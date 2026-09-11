import {
  extractIgnoredBlocks,
  extractTextareaBlocks,
  isHtml,
  reinsertIgnoredBlocks,
  reinsertTextareaBlocks,
  transformOpeningTags,
  validateConfig
} from "./utils.js"

/**
 * Minify HTML using configuration already validated by the caller.
 *
 * @param {string} html
 * @param {import('htmlfy').Config} validated_config
 * @param {boolean} extract_ignored
 * @returns {string}
 */
const minifyHtml = (html, validated_config, extract_ignored) => {
  /** @type {Map<any,any> | undefined} */
  let ignore_map
  /** @type {Map<string,string> | undefined} */
  let textarea_map
  const ignore = validated_config.ignore.length > 0

  /* Extract ignored elements. Skipped if prettify has already ignored blocks. */
  if (extract_ignored && ignore) {
    const { html_with_markers, extracted_map } = extractIgnoredBlocks(html, validated_config.ignore)
    html = html_with_markers
    ignore_map = extracted_map
  }

  /* Keep textarea markup out of the general minification passes. */
  if (!validated_config.ignore.includes('textarea') && html.includes('textarea')) {
    const { html_with_markers, extracted_map } = extractTextareaBlocks(html)
    html = html_with_markers
    textarea_map = extracted_map
  }

  /* All other minification. */
  // Remove ALL newlines and tabs explicitly.
  html = html.replace(/\n|\t/g, '')

  // Remove whitespace ONLY between tags.
  html = html.replace(/>\s+</g, "><")

  // Collapse any remaining multiple spaces to single spaces.
  html = html.replace(/ {2,}/g, ' ')

  // Protect space between text content and an opening tag (e.g., "text <a>")
  html = html.replace(
    /(\S) (<[a-zA-Z][a-zA-Z0-9_:-]*)/g,
    `$1___MINIFY-PROTECTED-SPACE___$2`
  )

  // Protect space between a closing tag and text content (e.g., "</a> text")
  html = html.replace(
    /(<\/[a-zA-Z][a-zA-Z0-9_:-]*>) (\S)/g,
    `$1___MINIFY-PROTECTED-SPACE___$2`
  )

  // Remove specific single spaces between tags and whitespace within tags.
  html = html.replace(/ >/g, ">")   // <tag > -> <tag>
  html = html.replace(/ </g, "<")   // leading space before tag
  html = html.replace(/> /g, ">")   // trailing space after tag
  html = html.replace(/< /g, "<")   // < tag> -> <tag>
  html = html.replace(/<\s+\//g, '</') // < /tag> -> </tag>
  html = html.replace(/<\/\s+/g, '</') // </ tag> -> </tag>

  // Unprotect space around inner tags
  html = html.replace(new RegExp('___MINIFY-PROTECTED-SPACE___', 'g'), ' ')

  // Trim spaces around equals signs in attributes (run before value trim)
  //    This handles `attr = "value"` -> `attr="value"`
  html = html.replace(/ = /g, "=")
  // Consider safer alternatives if needed (e.g., / = "/g, '="')

  // Trim whitespace inside quoted attribute values when any are padded.
  if (/=["']\s|\s["']/.test(html)) {
    html = transformOpeningTags(html, (tag, name, name_end) => {
      const chunks = []
      let previous_end = 0
      let index = name_end

      while (index < tag.length - 1) {
        while (/\s/.test(tag[index] || '')) index++

        const attribute_start = index
        while (/[a-zA-Z0-9_-]/.test(tag[index] || '')) index++
        if (index === attribute_start || tag[index] !== '=') {
          index++
          continue
        }

        const quote = tag[index + 1]
        if (quote !== '"' && quote !== "'") {
          index++
          continue
        }

        const value_start = index + 2
        const value_end = tag.indexOf(quote, value_start)
        if (value_end === -1) break

        const value = tag.slice(value_start, value_end)
        const trimmed_value = value.trim()
        if (trimmed_value !== value) {
          chunks.push(tag.slice(previous_end, value_start), trimmed_value)
          previous_end = value_end
        }
        index = value_end + 1
      }

      if (chunks.length === 0) return tag
      chunks.push(tag.slice(previous_end))
      return chunks.join('')
    })
  }

  // Final trim for the whole string
  html = html.trim()

  if (textarea_map) {
    html = reinsertTextareaBlocks(html, textarea_map)
  }

  /* Re-insert ignored elements. Skipped unless minify did the ignore. */
  if (ignore_map) {
    html = reinsertIgnoredBlocks(html, ignore_map)
  }

  return html
}

/**
 * Minify HTML that has already been checked and had ignored blocks extracted.
 *
 * @param {string} html
 * @param {import('htmlfy').Config} config
 * @returns {string}
 */
export const minifyKnownHtml = (html, config) => minifyHtml(html, config, false)

/**
 * Creates a single-line HTML string
 * by removing line returns, tabs, and relevant spaces.
 *
 * @param {string} html The HTML string to minify.
 * @param {import('htmlfy').UserConfig} [config] A user configuration object.
 * @returns {string} A minified HTML string.
 */
export const minify = (html, config) => {
  if (!isHtml(html)) return html
  return minifyHtml(html, validateConfig(config || {}), true)
}
