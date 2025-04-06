import { closify } from './closify.js'
import { minify } from './minify.js'
import { 
  finalProtectContent,
  isHtml, 
  protectAttributes, 
  setIgnoreAttribute, 
  setIgnoreElement, 
  trimify, 
  unprotectAttributes, 
  unprotectContent, 
  unsetIgnoreAttribute, 
  unsetIgnoreElement, 
  validateConfig, 
  wordWrap
} from './utils.js'
import { CONFIG, VOID_ELEMENTS } from './constants.js'

/**
 * @type {boolean}
 */
let strict

/**
 * @type {string[]}
 */
let trim

/**
 * @type {{ line: Record<string,string>[] }}
 */
const convert = {
  line: []
}

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
  // Regex to find tags OR text content between tags
  const regex = /(<[^>]+>)|([^<]+)/g

  html = html.replace(regex, (match, c1, c2) => {
    if (c1) {
      // It's a tag
      convert.line.push({ type: "tag", value: match })
    } else if (c2 && c2.trim().length > 0) {
      // It's text content (and not just whitespace)
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
  html = closify(html, false)

  if (trim.length > 0) html = trimify(html, trim)

  html = minify(html, false)
  html = enqueue(html)

  return html
}

/**
 * 
 * @param {string} html The HTML string to process.
 * @param {import('htmlfy').Config} config 
 * @returns {string}
 */
const process = (html, config) => {
  const step = config.tab_size
  const wrap = config.tag_wrap
  const wrap_width = config.tag_wrap_width
  const content_wrap = config.content_wrap

  /* Track current number of indentations needed. */
  let indents = ''

  /* Process lines and indent. */
  convert.line.forEach((source, index) => {
    html = html
      .replace(/\n+/g, '\n') /* Replace consecutive line returns with singles. */
      .replace(`[#-# : ${index} : ${source.value} : #-#]`, (match) => {
        let subtrahend = 0
        const prevLine = `[#-# : ${index - 1} : ${convert.line[index - 1]?.value} : #-#]`
        const tag_regex = /<[A-Za-z]+\b[^>]*(?:.|\n)*?\/?>/g /* Is opening tag or void element. */

        /**
         * Arbitratry character, to keep track of the string's length.
         */
        indents += '0'
        
        if (index === 0) subtrahend++

        /* We're processing a closing tag. */
        if (match.indexOf(`#-# : ${index} : </`) > -1) subtrahend++

        /* prevLine is a doctype declaration. */
        if (prevLine.indexOf('<!doctype') > -1) subtrahend++

        /* prevLine is a comment. */
        if (prevLine.indexOf('<!--') > -1) subtrahend++

        /* prevLine is a self-closing tag. */
        if (prevLine.indexOf('/> : #-#') > -1) subtrahend++

        /* prevLine is a closing tag. */
        if (prevLine.indexOf(`#-# : ${index - 1} : </`) > -1) subtrahend++

        /* prevLine is text. */
        if (convert.line[index - 1]?.type === 'text') subtrahend++

        /* Determine offset for line indentation. */
        const offset = indents.length - subtrahend

        /* Adjust for the next round. */
        indents = indents.substring(0, offset)

        /* Remove comment. */
        if (strict && match.indexOf('<!--') > -1) return ''

        /* Remove the prefix and suffix, leaving the content. */
        let result = match
          .replace(`[#-# : ${index} : `, '')
          .replace(' : #-#]', '')

        if (
          convert.line[index]?.type === 'text' && 
          content_wrap > 0 && 
          result.length >= content_wrap
        ) {
          result = wordWrap(result, content_wrap, step * offset)
        }

        /* Wrap the attributes of open tags and void elements. */
        if (wrap && tag_regex.test(source.value) && source.value.length > wrap_width) {
          const attribute_regex = /\s{1}[A-Za-z-]+(?:=".*?")?/g /* Matches all tag/element attributes. */
          const tag_parts = source.value.split(attribute_regex).filter(Boolean)
          const attributes = source.value.matchAll(attribute_regex)
          const padding = step * offset
          const inner_padding = padding + step

          let wrapped = tag_parts[0].padStart(tag_parts[0].length + padding) + `\n`
          for (const a of attributes) {
            /* Must declare separately so we can pad this string before adding it to `wrapped`. */
            const a_string = a[0].trim().padStart(a[0].trim().length + inner_padding) + `\n`
            wrapped += a_string
          }

          /**
           * Regarding the ending check: only pad an additional space 
           * if strict is true and the tag we're processing is a void element. 
           */
          const e_string = tag_parts[1].padStart(
            tag_parts[1].trim().length + 
            padding + 
            (strict && VOID_ELEMENTS.includes(tag_parts[0].slice(1)) ? 1 : 0)
          )
          wrapped += e_string

          return wrapped
        } else {
          /* Pad the string with spaces and return. */
          return result.padStart(result.length + (step * offset))
        }
      })
  })

  /* Preserve wrapped attributes. */
  if (wrap) html = protectAttributes(html)

  /* Extra preserve wrapped content. */
  if (content_wrap > 0 && /\n[ ]*[^\n]*__!i-£___£%__[^\n]*\n/.test(html)) html = finalProtectContent(html)

  /* Remove line returns, tabs, and consecutive spaces within html elements or their content. */
  html = html.replace(
    /<(?<Element>.+).*>[^<]*?[^><\/\s][^<]*?<\/{1}\k<Element>|<script[^>]*>\s+<\/script>|<(\w+)>\s+<\/(\w+)|<(?:([\w:\._-]+)|([\w:\._-]+)[^>]*[^\/])>\s+<\/([\w:\._-]+)>/g,
    match => match.replace(/\n|\t|\s{2,}/g, '')
  )

  /* Revert wrapped content. */
  if (content_wrap > 0) html = unprotectContent(html)

  /* Revert wrapped attributes. */
  if (wrap) html = unprotectAttributes(html)

  /* Remove self-closing nature of void elements. */
  if (strict) html = html.replace(/\s\/>|\/>/g, '>')

  const lead_newline_check = html.substring(0, 1)
  const tail_newline_check = html.substring(html.length - 1)

  /**
   * Remove single leading and trailing new line, if they exist.
   * These will be `false` if the "html" being processed is only plain text. 
   */
  if (lead_newline_check === '\n') html = html.substring(1, html.length)
  if (tail_newline_check === '\n') html = html.substring(0, html.length - 1)

  return html
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

  const validated_config = config ? validateConfig(config) : CONFIG
  strict = validated_config.strict

  const ignore = validated_config.ignore.length > 0
  trim = validated_config.trim

  /* Preserve ignored elements. */
  if (ignore) html = setIgnoreElement(html, validated_config)

  /* Preserve html text within attribute values. */
  html = setIgnoreAttribute(html)

  html = preprocess(html)
  html = process(html, validated_config)

  /* Revert html text within attribute values. */
  html = unsetIgnoreAttribute(html)

  /* Revert ignored elements. */
  if (ignore) html = unsetIgnoreElement(html, validated_config)

  return html
}
