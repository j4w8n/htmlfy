import { closify } from './closify.js'
import { minify } from './minify.js'
import { 
  extractIgnoredBlocks,
  finalProtectContent,
  isHtml, 
  protectAttributes, 
  reinsertIgnoredBlocks, 
  setIgnoreAttribute, 
  trimify, 
  unprotectAttributes, 
  unprotectContent, 
  unsetIgnoreAttribute, 
  validateConfig, 
  wordWrap
} from './utils.js'
import { CONFIG, VOID_ELEMENTS } from './constants.js'
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
 * @returns {string}
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

  html = html.replace(regex, (match, c1, c2) => {
    if (c1) {
      convert.line.push({ type: "tag", value: match })
    } else if (c2 && c2.trim().length > 0) {
      /* It's text content (and not just whitespace). */
      convert.line.push({ type: "text", value: match })
    }

    i++
    return `\n[#-# : ${i} : ${match} : #-#]\n`
  })

  return html
};

/**
 * Preprocess the HTML.
 * 
 * @param {string} html The HTML string to preprocess.
 * @returns {string}
 */
const preprocess = (html) => {
  html = closify(html)

  const { config } = getState()

  if (config.trim.length > 0) html = trimify(html, config.trim)

  html = minify(html)
  html = enqueue(html)

  return html
}

/**
 * 
 * @param {import('htmlfy').Config} config 
 * @returns {string}
 */
const process = (config) => {
  const step = " ".repeat(config.tab_size)
  const tag_wrap = config.tag_wrap
  const content_wrap = config.content_wrap
  const ignore_with = config.ignore_with
  const placeholder_template = `-${ignore_with}`
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
      current_line_value.startsWith(placeholder_template + "lt--") ||
      current_line_value.startsWith(placeholder_template + "gt--") ||
      current_line_value.startsWith(placeholder_template + "nl--") ||
      current_line_value.startsWith(placeholder_template + "cr--") ||
      current_line_value.startsWith(placeholder_template + "ws--") ||
      current_line_value.startsWith(placeholder_template + "tab--")

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
    /* prevLine is a self-closing tag. */
    if (prev_line_value.trim().endsWith("/>")) subtrahend++
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
     * 
     * TODO - Implement inline groups instead?
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
        tag_regex.lastIndex = 0; // Reset stateful regex
        attribute_regex.lastIndex = 0; // Reset stateful regex

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
          const is_void = VOID_ELEMENTS.includes(tag_name)
          const closing_part = tag_parts[1].trim()
          const closing_padding = padding + (strict && is_void ? " " : "") // Add space if void/strict

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
  if (content_wrap > 0 && /\n[ ]*[^\n]*__!i-£___£%__[^\n]*\n/.test(final_html))
    final_html = finalProtectContent(final_html)

  /* Remove line returns, tabs, and consecutive spaces within html elements or their content. */
  final_html = final_html.replace(
    /<(?<Element>.+).*>[^<]*?[^><\/\s][^<]*?<\/{1}\k<Element>|<script[^>]*>\s+<\/script>|<(\w+)>\s+<\/(\w+)|<(?:([\w:\._-]+)|([\w:\._-]+)[^>]*[^\/])>\s+<\/([\w:\._-]+)>/g,
    match => match.replace(/\n|\t|\s{2,}/g, '')
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

  const validated_config = config ? validateConfig(config) : { ...CONFIG }
  const ignore = validated_config.ignore.length > 0

  /* Extract ignored elements. */
  if (!ignored && ignore) {
    const { html_with_markers, extracted_map } = extractIgnoredBlocks(html, validated_config);
    html = html_with_markers
    ignore_map = extracted_map
    reinsert_ignored = true
  }

  /* Preserve html text within attribute values. */
  html = setIgnoreAttribute(html)

  html = preprocess(html)
  html = process(validated_config)

  /* Revert html text within attribute values. */
  html = unsetIgnoreAttribute(html)

  /* Re-insert ignored elements. */
  if (reinsert_ignored) {
    html = reinsertIgnoredBlocks(html, ignore_map)
  }

  return html
}
