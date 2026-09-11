import { minifyKnownHtml } from './minify.js'
import { 
  createConstants,
  extractIgnoredBlocks,
  finalProtectContent,
  isHtml, 
  protectAttributes, 
  reinsertIgnoredBlocks, 
  setIgnoreAttribute, 
  setSelfClosing, 
  trimify, 
  unprotectAttributes, 
  unprotectContent, 
  unsetIgnoreAttribute, 
  validateConfig, 
  wordWrap
} from './utils.js'
import { VOID_ELEMENTS } from './constants.js'

const VOID_ELEMENT_SET = new Set(VOID_ELEMENTS)
const TOKEN_CLOSING = 1
const TOKEN_COMMENT = 2
const TOKEN_DOCTYPE = 4
const TOKEN_IGNORED = 8
const TOKEN_SELF_CLOSING = 16
const TOKEN_SYNTHETIC_SELF_CLOSING = 32

/**
 * @typedef {object} Token
 * @property {'tag' | 'text'} type
 * @property {string} value
 * @property {number} flags
 */

/**
 * Isolate tags, content, and comments.
 * 
 * @param {string} html The HTML string to evaluate.
 * @param {import('./utils.js').HtmlfyConstants} constants
 * @returns {Token[]}
 */
const enqueue = (html, constants) => {
  /** @type {Token[]} */
  const lines = []
  /* Regex to find tags OR text content between tags. */
  const regex = /<[^>]+>|[^<]+/g

  /* Use replace for callback iteration, but avoid constructing the old marker output. */
  html.replace(regex, (value) => {
    const type = value.startsWith('<') ? 'tag' : 'text'

    if (type === 'text') {
      if (value.trim().length > 0) {
        lines.push({
          type,
          value,
          flags: value.startsWith('___HTMLFY_SPECIAL_IGNORE_MARKER_') ? TOKEN_IGNORED : 0,
        })
      }
      return ''
    }

    const trimmed = value.trim()
    const synthetic_self_closing = trimmed.endsWith(constants.SELF_CLOSING_PLACEHOLDER)
    let flags = 0
    if (trimmed.startsWith('</')) flags |= TOKEN_CLOSING
    if (trimmed.startsWith('<!--')) flags |= TOKEN_COMMENT
    if (trimmed.startsWith('<!doctype')) flags |= TOKEN_DOCTYPE
    if (trimmed.endsWith('/>') || synthetic_self_closing) flags |= TOKEN_SELF_CLOSING
    if (synthetic_self_closing) flags |= TOKEN_SYNTHETIC_SELF_CLOSING

    lines.push({
      type,
      value,
      flags,
    })
    return ''
  })

  return lines
}

/**
 * Process enqueued content.
 *  
 * @param {Token[]} lines
 * @param {import('htmlfy').Config} config
 * @param {import('./utils.js').HtmlfyConstants} constants
 * @returns {string}
 */
const process = (lines, config, constants) => {
  const step = " ".repeat(config.tab_size)
  const tag_wrap = config.tag_wrap
  const content_wrap = config.content_wrap
  const strict = config.strict

  /* Track current number of indentations needed. */
  let indent_level = 0

  /** @type string[] */
  const output_lines = []
  const tag_regex = /<[A-Za-z]+\b[^>]*(?:.|\n)*?\/?>/ /* Is opening tag or void element. */
  const attribute_regex = /\s{1}[A-Za-z:@#*?$()\[\].-]+(?:=".*?")?/g /* Matches all tag/element attributes. */

  /* Process lines and indent. */
  lines.forEach((source, index) => {
    let current_line_value = source.value

    let subtrahend = 0
    const prev_line_data = lines[index - 1]

    indent_level++

    if (index === 0) subtrahend++
    /* We're processing a closing tag. */
    if (source.flags & TOKEN_CLOSING) subtrahend++
    /* prevLine is a doctype declaration. */
    if (prev_line_data && (prev_line_data.flags & TOKEN_DOCTYPE)) subtrahend++
    /* prevLine is a comment. */
    if (prev_line_data && (prev_line_data.flags & TOKEN_COMMENT)) subtrahend++
    /* prevLine is a void element. */
    if (prev_line_data && (prev_line_data.flags & TOKEN_SELF_CLOSING)) subtrahend++
    /* prevLine is a closing tag. */
    if (prev_line_data && (prev_line_data.flags & TOKEN_CLOSING)) subtrahend++
    /* prevLine is text. */
    if (prev_line_data?.type === "text") subtrahend++

    /* Determine offset for line indentation. */
    const offset = Math.max(0, indent_level - subtrahend)
    /* Correct indent level for *this* line's content */
    const current_indent_level = offset // Store the level for this line

    indent_level = current_indent_level

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

        /* If nothing left after extracting punctuation, skip this line. */
        if (current_line_value.length === 0) return
      }
    }

    const padding = step.repeat(current_indent_level)

    if (source.flags & TOKEN_IGNORED) {
      /* Stop processing this line, as it's set to be ignored. */
      output_lines.push(current_line_value)
    } else {
      /* Remove comment. */
      if (strict && (source.flags & TOKEN_COMMENT))
        return

      let result = current_line_value

      /* Remove self-closing placeholder, if needed. */
      if (source.flags & TOKEN_SYNTHETIC_SELF_CLOSING)
        result = result.replace(constants.SELF_CLOSING_PLACEHOLDER, '>')

      if (
        source.type === 'text' && 
        content_wrap > 0 && 
        result.length >= content_wrap
      ) {
        result = wordWrap(result, content_wrap, padding, constants)
      }
      /* Wrap the attributes of open tags and void elements. */
      else if (
        tag_wrap > 0 &&
        result.length > tag_wrap &&
        tag_regex.test(result)
      ) {
        attribute_regex.lastIndex = 0 // Reset stateful regex

        const attributes = []
        let first_attribute_start = -1
        let last_attribute_end = -1
        let attribute_match

        while ((attribute_match = attribute_regex.exec(result)) !== null) {
          if (first_attribute_start === -1) first_attribute_start = attribute_match.index
          last_attribute_end = attribute_regex.lastIndex
          attributes.push(attribute_match[0].trim())
        }

        if (attributes.length > 0) {
          const opening_part = result.slice(0, first_attribute_start)
          const closing_part = result.slice(last_attribute_end).trim()
          const inner_padding = padding + step
          const wrapped_tag = [padding + opening_part]

          for (const attribute of attributes) {
            wrapped_tag.push(inner_padding + attribute)
          }

          const tag_name_match = opening_part.match(/<([A-Za-z_:-]+)/)
          const tag_name = tag_name_match ? tag_name_match[1] : ""
          const is_self_closing = result.endsWith("/>") && VOID_ELEMENT_SET.has(tag_name)
          const closing_padding = padding + (strict && is_self_closing ? " " : "")

          wrapped_tag.push(closing_padding + closing_part)
          result = wrapped_tag.join('\n')
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
  if (tag_wrap > 0) final_html = protectAttributes(final_html, constants)

  /* Extra preserve wrapped content. */
  if (content_wrap > 0 && new RegExp(`/\\n[ ]*[^\\n]*${constants.CONTENT_IGNORE_PLACEHOLDER}[^\\n]*\\n/`).test(final_html))
    final_html = finalProtectContent(final_html, constants)

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
  if (content_wrap > 0) final_html = unprotectContent(final_html, constants)

  /* Revert wrapped attributes. */
  if (tag_wrap > 0) final_html = unprotectAttributes(final_html, constants)

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
  /* Return content as-is if it does not contain any HTML elements. */
  if (!isHtml(html)) return html

  const validated_config = validateConfig(config || {})
  const constants = createConstants(validated_config.ignore_with)

  const ignore = validated_config.ignore.length > 0

  /** @type {Map<any,any> | undefined} */
  let ignore_map

  /* Allows you to trimify before ignoring. */
  if (validated_config.trim.length > 0) html = trimify(html, validated_config.trim)

  /* Extract ignored elements. */
  if (ignore) {
    const { html_with_markers, extracted_map } = extractIgnoredBlocks(html, validated_config.ignore)
    html = html_with_markers
    ignore_map = extracted_map
  }

  /* Preserve html text within attribute values. */
  html = setIgnoreAttribute(html, constants)

  /* Insert placeholder for void elements that aren't self-closing. */
  html = setSelfClosing(html, constants)

  html = minifyKnownHtml(html, validated_config)
  const lines = enqueue(html, constants)
  html = process(lines, validated_config, constants)

  /* Revert html text within attribute values. */
  html = unsetIgnoreAttribute(html, constants)

  /* Re-insert ignored elements. */
  if (ignore_map) {
    html = reinsertIgnoredBlocks(html, ignore_map)
  }

  return html
}
