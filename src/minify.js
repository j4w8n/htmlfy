import { entify } from "./entify.js"
import { extractIgnoredBlocks, isHtml, reinsertIgnoredBlocks, validateConfig } from "./utils.js"
import { getState } from "./state.js"

/**
 * @type {Map<any,any>}
 */
let ignore_map

/**
 * Creates a single-line HTML string
 * by removing line returns, tabs, and relevant spaces.
 * 
 * @param {string} html The HTML string to minify.
 * @param {import('htmlfy').UserConfig} [config] A user configuration object.
 * @returns {string} A minified HTML string.
 */
export const minify = (html, config) => {
  let reinsert_ignored = false
  const { checked_html, ignored } = getState()

  if (!checked_html && !isHtml(html)) return html

  const validated_config = config ? validateConfig(config) : (getState()).config
  const ignore = validated_config.ignore.length > 0

  /* Extract ignored elements. Skipped if prettify has already ignored blocks. */
  if (!ignored && ignore) {
    const { html_with_markers, extracted_map } = extractIgnoredBlocks(html, validated_config);
    html = html_with_markers
    ignore_map = extracted_map
    reinsert_ignored = true
  }

  /**
   * Ensure textarea content is specially minified and protected
   * before general minification.
   */
  html = entify(html)

  /* All other minification. */
  // Remove ALL newlines and tabs explicitly.
  html = html.replace(/\n|\t/g, '')

  // Remove whitespace ONLY between tags.
  html = html.replace(/>\s+</g, "><")

  // Collapse any remaining multiple spaces to single spaces.
  html = html.replace(/ {2,}/g, ' ')

  // Remove specific single spaces OR whitespace within closing tags.
  html = html.replace(/ >/g, ">")   // <tag > -> <tag>
  html = html.replace(/ </g, "<")   // Text < -> Text< (Also handles leading space before tag)
  html = html.replace(/> /g, ">")   // > Text -> >Text
  html = html.replace(/<\s*\//g, '</') // < /tag -> </tag>

  // Trim spaces around equals signs in attributes (run before value trim)
  //    This handles `attr = "value"` -> `attr="value"`
  html = html.replace(/ = /g, "=")
  // Consider safer alternatives if needed (e.g., / = "/g, '="')

  // Trim whitespace inside attribute values
  html = html.replace(
    /([a-zA-Z0-9_-]+)=(['"])(.*?)\2/g,
    (match, attr_name, quote, value) => {
      // value.trim() handles both leading/trailing spaces
      // and cases where the value is only whitespace (becomes empty string)
      const trimmed_value = value.trim()
      return `${attr_name}=${quote}${trimmed_value}${quote}`
    }
  )

  // Final trim for the whole string
  html = html.trim()

  /* Re-insert ignored elements. Skipped unless minify did the ignore. */
  if (reinsert_ignored) {
    html = reinsertIgnoredBlocks(html, ignore_map)
  }

  return html
}
