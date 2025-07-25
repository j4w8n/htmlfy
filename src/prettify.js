import { minify } from './minify.js'
import { 
  extractIgnoredBlocks,
  finalProtectContent,
  isHtml, 
  protectAttributes, 
  reinsertIgnoredBlocks, 
  setIgnoreAttribute, 
  setSelfClosing, 
  unsetSelfClosing, 
  trimify, 
  unprotectAttributes, 
  unprotectContent, 
  unsetIgnoreAttribute, 
  validateConfig, 
  wordWrap
} from './utils.js'
import { VOID_ELEMENTS } from './constants.js'
import { getState } from './state.js'

/**
 * @type {{ line: Record<string,string>[] }}
 */
const convert = {
  line: []
}

/**
 * @type {Map<any,any>}
 */
let ignore_map

/**
 * Isolate tags, content, and comments.
 * 
 * @param {string} html The HTML string to evaluate.
 * @example <div>Hello World!</div> => 
 *  [#-# : 0 : <div> : #-#]
 *  Hello World!
 *  [#-# : 1 : </div> : #-#]
 */
const enqueue = (html) => {
  convert.line = []
  let i = -1
  /* Regex to find tags OR text content between tags. */
  const regex = /(<[^>]+>)|([^<]+)/g

  html.replace(regex, (match, c1, c2) => {
    if (c1) {
      convert.line.push({ type: "tag", value: match })
    } else if (c2 && c2.trim().length > 0) {
      /* It's text content (and not just whitespace). */
      convert.line.push({ type: "text", value: match })
    }

    i++
    return `\n[#-# : ${i} : ${match} : #-#]\n`
  })
}

/**
 * Process enqueued content.
 *  
 * @returns {string}
 */
const process = () => {
  const { config, constants } = getState()
  const step = " ".repeat(config.tab_size)
  const tag_wrap = config.tag_wrap
  const content_wrap = config.content_wrap
  const strict = config.strict

  /* Track current number of indentations needed. */
  let indents = ''

  /** @type string[] */
  const output_lines = []
  const tag_regex = /<[A-Za-z]+\b[^>]*(?:.|\n)*?\/?>/g /* Is opening tag or void element. */
  const attribute_regex = /\s{1}[A-Za-z-]+(?:=".*?")?/g /* Matches all tag/element attributes. */

  /* Process lines and indent. */
  convert.line.forEach((source, index) => {
    let current_line_value = source.value

    const is_ignored_content =
      current_line_value.startsWith('___HTMLFY_SPECIAL_IGNORE_MARKER_')

    let subtrahend = 0
    const prev_line_data = convert.line[index - 1]
    const prev_line_value = prev_line_data?.value ?? "" // Use empty string if no prev line

    /**
     * Arbitratry character, to keep track of the string's length.
     */
    indents += '0'

    if (index === 0) subtrahend++
    /* We're processing a closing tag. */
    if (current_line_value.trim().startsWith("</")) subtrahend++
    /* prevLine is a doctype declaration. */
    if (prev_line_value.trim().startsWith("<!doctype")) subtrahend++
    /* prevLine is a comment. */
    if (prev_line_value.trim().startsWith("<!--")) subtrahend++
    /* prevLine is a void element. */
    if (
      prev_line_value.trim().endsWith("/>") // native self-closing
      ||
      prev_line_value.trim().endsWith(constants.SELF_CLOSING_PLACEHOLDER) // synthetic self-closing
    ) subtrahend++
    /* prevLine is a closing tag. */
    if (prev_line_value.trim().startsWith("</")) subtrahend++
    /* prevLine is text. */
    if (prev_line_data?.type === "text") subtrahend++

    /* Determine offset for line indentation. */
    const offset = Math.max(0, indents.length - subtrahend)
    /* Correct indent level for *this* line's content */
    const current_indent_level = offset // Store the level for this line

    indents = indents.substring(0, current_indent_level) // Adjust for *next* round

    /**
     * Starts with a single punctuation character.
     * Add punctuation to end of previous line.
     */
    if (source.type === 'text' && /^[!,;\.]/.test(current_line_value)) {
      if (current_line_value.length === 1) {
        output_lines[output_lines.length - 1] = 
          output_lines.at(-1) + current_line_value
        return
      } else {
        output_lines[output_lines.length - 1] = 
          output_lines.at(-1) + current_line_value.charAt(0)
        current_line_value = current_line_value.slice(1).trim()
      }
    }

    const padding = step.repeat(current_indent_level)

    if (is_ignored_content) {
      /* Stop processing this line, as it's set to be ignored. */
      output_lines.push(current_line_value)
    } else {
      /* Remove comment. */
      if (strict && current_line_value.trim().startsWith("<!--"))
        return

      let result = current_line_value

      /* Remove self-closing placeholder, if needed. */
      result = unsetSelfClosing(result)

      if (
        source.type === 'text' && 
        content_wrap > 0 && 
        result.length >= content_wrap
      ) {
        result = wordWrap(result, content_wrap, padding)
      }
      /* Wrap the attributes of open tags and void elements. */
      else if (
        tag_wrap > 0 &&
        result.length > tag_wrap &&
        tag_regex.test(result)
      ) {
        tag_regex.lastIndex = 0 // Reset stateful regex
        attribute_regex.lastIndex = 0 // Reset stateful regex

        const tag_parts = result.split(attribute_regex).filter(Boolean)

        if (tag_parts.length >= 2) {
          const attributes = result.matchAll(attribute_regex)
          const inner_padding = padding + step
          let wrapped_tag = padding + tag_parts[0] + "\n"

          for (const a of attributes) {
            const attribute_string = a[0].trim()
            wrapped_tag += inner_padding + attribute_string + "\n"
          }

          const tag_name_match = tag_parts[0].match(/<([A-Za-z_:-]+)/)
          const tag_name = tag_name_match ? tag_name_match[1] : ""
          const is_self_closing = tag_parts.at(-1)?.endsWith("/>") && VOID_ELEMENTS.includes(tag_name)
          const closing_part = tag_parts[1].trim()
          const closing_padding = padding + (strict && is_self_closing ? " " : "")

          wrapped_tag += closing_padding + closing_part

          result = wrapped_tag // Assign the fully wrapped string
        } else {
          result = padding + result
        }
      } else {
        /* Apply simple indentation (if no wrapping occurred) */
        result = padding + result
      }

      /* Add the processed line (or lines if wordWrap creates them) to the output */
      output_lines.push(result)
    }
  })

  /* Join all processed lines into the final HTML string */
  let final_html = output_lines.join("\n")

  /* Preserve wrapped attributes. */
  if (tag_wrap > 0) final_html = protectAttributes(final_html)

  /* Extra preserve wrapped content. */
  if (content_wrap > 0 && new RegExp(`/\\n[ ]*[^\\n]*${constants.CONTENT_IGNORE_PLACEHOLDER}[^\\n]*\\n/`).test(final_html))
    final_html = finalProtectContent(final_html)

  /* Remove line returns, tabs, and consecutive spaces within html elements or their content. */
  final_html = final_html.replace(
    /<(?<Element>[^>\s]+)[^>]*>[^<]*?[^><\/\s][^<]*?<\/\k<Element>>|<script[^>]*>[\s]*<\/script>|<([\w:\._-]+)([^>]*)><\/\2>|<([\w:\._-]+)([^>]*)>[\s]+<\/\4>/g,
    match => {
      // Check if this contains placeholder
      if (match.includes(constants.SELF_CLOSING_PLACEHOLDER) || match.includes(constants.CONTENT_IGNORE_PLACEHOLDER)) {
        return match // Don't modify if it contains the placeholder
      }

      return match.replace(/\n|\t|\s{2,}/g, '')
    }
  )

  /* Revert wrapped content. */
  if (content_wrap > 0) final_html = unprotectContent(final_html)

  /* Revert wrapped attributes. */
  if (tag_wrap > 0) final_html = unprotectAttributes(final_html)

  /* Remove self-closing nature of void elements. */
  if (strict) final_html = final_html.replace(/\s\/>|\/>/g, '>')

  /* Trim leading and/or trailing line returns. */
  if (final_html.startsWith("\n")) final_html = final_html.substring(1)
  if (final_html.endsWith("\n")) final_html = final_html.substring(0, final_html.length - 1)

  return final_html
}

/**
 * Format HTML with line returns and indentations.
 * 
 * @param {string} html The HTML string to prettify.
 * @param {import('htmlfy').UserConfig} [config] A user configuration object.
 * @returns {string} A well-formed HTML string.
 */
export const prettify = (html, config) => {
  let reinsert_ignored = false
  const { checked_html, ignored } = getState()

  /* Return content as-is if it does not contain any HTML elements. */
  if (!checked_html && !isHtml(html)) return html

  /* Runs setState for config. */
  const validated_config = validateConfig(config || {})

  const ignore = validated_config.ignore.length > 0

  /* Allows you to trimify before ignoring. */
  if (validated_config.trim.length > 0) html = trimify(html, validated_config.trim)

  /* Extract ignored elements. */
  if (!ignored && ignore) {
    const { html_with_markers, extracted_map } = extractIgnoredBlocks(html)
    html = html_with_markers
    ignore_map = extracted_map
    reinsert_ignored = true
  }

  /* Preserve html text within attribute values. */
  html = setIgnoreAttribute(html)

  /* Insert placeholder for void elements that aren't self-closing. */
  html = setSelfClosing(html)

  html = minify(html)
  enqueue(html)
  html = process()

  /* Revert html text within attribute values. */
  html = unsetIgnoreAttribute(html)

  /* Re-insert ignored elements. */
  if (reinsert_ignored) {
    html = reinsertIgnoredBlocks(html, ignore_map)
  }

  return html
}
