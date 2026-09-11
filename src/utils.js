import { CONFIG, VOID_ELEMENTS } from './constants.js'

/**
 * @typedef {object} HtmlfyConstants
 * @property {string} CONTENT_IGNORE_PLACEHOLDER
 * @property {string} SELF_CLOSING_PLACEHOLDER
 * @property {string} ATTRIBUTE_IGNORE_PLACEHOLDER
 */

/**
 * Create the placeholders used during one formatting operation.
 *
 * @param {string} [ignore_with]
 * @returns {HtmlfyConstants}
 */
export const createConstants = (ignore_with = CONFIG.ignore_with) => ({
  CONTENT_IGNORE_PLACEHOLDER: `${ignore_with}_`,
  SELF_CLOSING_PLACEHOLDER: `${ignore_with}/_>`,
  ATTRIBUTE_IGNORE_PLACEHOLDER: `${ignore_with}=_`
})

const DEFAULT_CONSTANTS = createConstants()

/**
 * Visit complete tags without treating brackets inside quoted attributes as boundaries.
 * Returning true from the visitor stops the scan.
 *
 * @param {string} content
 * @param {(tag: string, start: number, end: number) => boolean | void} visitor
 * @returns {boolean}
 */
const scanTags = (content, visitor) => {
  let tag_start = -1
  let quote = ''

  for (let index = 0; index < content.length; index++) {
    const character = content[index]

    if (tag_start === -1) {
      if (character === '<') tag_start = index
      continue
    }

    if (quote) {
      if (character === quote) quote = ''
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
    } else if (character === '<') {
      tag_start = index
    } else if (character === '>') {
      if (visitor(content.slice(tag_start, index + 1), tag_start, index + 1)) return true
      tag_start = -1
    }
  }

  return false
}

/**
 * Parse the name of an opening tag and return its end offset within the tag.
 *
 * @param {string} tag
 * @returns {{ name: string, name_end: number } | undefined}
 */
const getOpeningTag = (tag) => {
  let name_start = 1
  while (/\s/.test(tag[name_start] || '')) name_start++
  if (!/[A-Za-z]/.test(tag[name_start] || '')) return

  let name_end = name_start + 1
  while (name_end < tag.length && !/[\s/>]/.test(tag[name_end])) name_end++

  const name = tag.slice(name_start, name_end)
  if (!/^[A-Za-z][A-Za-z0-9:._-]*$/.test(name)) return

  return { name, name_end }
}

/**
 * Transform complete opening tags while preserving all content between them.
 *
 * @param {string} content
 * @param {(tag: string, name: string, name_end: number) => string} transform
 * @returns {string}
 */
export const transformOpeningTags = (content, transform) => {
  const chunks = []
  let previous_end = 0

  scanTags(content, (tag, start, end) => {
    const opening_tag = getOpeningTag(tag)
    if (!opening_tag) return

    chunks.push(
      content.slice(previous_end, start),
      transform(tag, opening_tag.name, opening_tag.name_end)
    )
    previous_end = end
  })

  if (chunks.length === 0) return content
  chunks.push(content.slice(previous_end))
  return chunks.join('')
}

/**
 * Checks if content contains at least one HTML element or custom HTML element.
 * 
 * The first regex matches void and self-closing elements.
 * The second regex matches normal HTML elements, plus they can have a namespace.
 * The third regex matches custom HTML elemtns, plus they can have a namespace.
 * 
 * HTML elements should begin with a letter, and can end with a letter or number.
 * 
 * Custom elements must begin with a letter, and can end with a letter, number,
 * hyphen, underscore, or period. However, all letters must be lowercase.
 * They must have at least one hyphen, and can only have periods and underscores if there is a hyphen.
 * 
 * These regexes are based on
 * https://w3c.github.io/html-reference/syntax.html#tag-name
 * and
 * https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 * respectively.
 * 
 * @param {string} content Content to evaluate.
 * @returns {boolean} A boolean.
 */
export const isHtml = (content) => {
  const paired_elements = new Set()
  const standard_element = /^[A-Za-z][A-Za-z0-9]*$/
  const namespaced_element = /^(?:[A-Za-z][A-Za-z0-9]*:)[A-Za-z][A-Za-z0-9]*$/
  const custom_element = /^(?:[a-z][a-z0-9._]*:)?[a-z][a-z0-9._]*-[a-z0-9._-]+$/

  return scanTags(content, (tag) => {
    if (tag.startsWith('</')) {
      const name = tag.slice(2, -1)
      return paired_elements.has(name)
    }

    const opening_tag = getOpeningTag(tag)
    if (!opening_tag) return false

    const suffix_start = tag[opening_tag.name_end]
    if (!(suffix_start === '>' || /\s/.test(suffix_start) || (suffix_start === '/' && tag[opening_tag.name_end + 1] === '>')))
      return false

    if (standard_element.test(opening_tag.name)) return true
    if (namespaced_element.test(opening_tag.name) || custom_element.test(opening_tag.name))
      paired_elements.add(opening_tag.name)

    return false
  })
}

/**
 * Generic utility which merges two objects.
 * 
 * @param {any} current Original object.
 * @param {any} updates Object to merge with original.
 * @returns {any}
 */
const mergeObjects = (current, updates) => {
  if (!current || !updates)
    throw new Error("Both 'current' and 'updates' must be passed-in to mergeObjects()")

  /**
   * @type {any}
   */
  let merged
  
  if (Array.isArray(current)) {
    merged = structuredClone(current).concat(updates)
  } else if (typeof current === 'object') {
    merged = { ...current }
    for (let key of Object.keys(updates)) {
      if (typeof updates[key] !== 'object') {
        merged[key] = updates[key]
      } else {
        /* key is an object, run mergeObjects again. */
        merged[key] = mergeObjects(merged[key] || {}, updates[key])
      }
    }
  }

  return merged
}

/**
 * Merge a user config with the default config.
 * 
 * @param {import('htmlfy').Config} default_config The default config.
 * @param {import('htmlfy').UserConfig} config The user config.
 * @returns {import('htmlfy').Config}
 */
export const mergeConfig = (default_config, config) => {
  return mergeObjects(default_config, config)
}

/**
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 */
export const protectAttributes = (html, constants = DEFAULT_CONSTANTS) => {
  html = html.replace(/<[\w:\-]+([^>]*[^\/])>/g, (/** @type {string} */match, /** @type {any} */capture) => {
    return match.replace(capture, (match) => {
      return match
        .replace(/\n/g, constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'nl!')
        .replace(/\r/g, constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'cr!')
        .replace(/\s/g, constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'ws!')
    })
  })

  return html
}

/**
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 */
export const protectContent = (html, constants = DEFAULT_CONSTANTS) => {
  return html
    .replace(/\n/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'nl!')
    .replace(/\r/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'cr!')
    .replace(/\s/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'ws!')
}

/**
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 */
export const finalProtectContent = (html, constants = DEFAULT_CONSTANTS) => {
  const regex = /\s*<([a-zA-Z0-9:-]+)[^>]*>\n\s*<\/\1>(?=\n[ ]*[^\n]*__!i-£___£%__[^\n]*\n)(\n[ ]*\S[^\n]*\n)|<([a-zA-Z0-9:-]+)[^>]*>(?=\n[ ]*[^\n]*__!i-£___£%__[^\n]*\n)(\n[ ]*\S[^\n]*\n\s*)<\/\3>/g 

  return html
    .replace(regex, (/** @type {string} */match, p1, p2, p3, p4) => {
      const text_to_protect = p2 || p4

      if (!text_to_protect)
        return match

      const protected_text = text_to_protect
       .replace(/\n/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'nl!')
       .replace(/\r/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'cr!')
       .replace(/\s/g, constants.CONTENT_IGNORE_PLACEHOLDER + "ws!")

      return match.replace(text_to_protect, protected_text)
    })
}

/**
 * Replace html brackets with ignore string.
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 * @returns {string}
 */
export const setIgnoreAttribute = (html, constants = DEFAULT_CONSTANTS) => {
  // Most documents do not contain HTML-like brackets inside attribute values.
  if (!/=\s*(?:"[^"]*[<>][^"]*"|'[^']*[<>][^']*')/.test(html)) return html

  return transformOpeningTags(html, (tag, name, name_end) => {
    let quote = ''
    let previous_end = 0
    const chunks = []

    for (let index = name_end; index < tag.length - 1; index++) {
      const character = tag[index]

      if (!quote && (character === '"' || character === "'")) {
        quote = character
      } else if (quote && character === quote) {
        quote = ''
      } else if (quote && (character === '<' || character === '>')) {
        chunks.push(
          tag.slice(previous_end, index),
          constants.ATTRIBUTE_IGNORE_PLACEHOLDER + (character === '<' ? 'lt!' : 'gt!')
        )
        previous_end = index + 1
      }
    }

    if (chunks.length === 0) return tag
    chunks.push(tag.slice(previous_end))
    return chunks.join('')
  })
}

/**
 * Trim leading and trailing whitespace characters.
 * 
 * @param {string} html
 * @param {string[]} trim
 * @returns {string}
 */
export const trimify = (html, trim) => {
  for (let e = 0; e < trim.length; e++) {
    /* Whitespace character must be escaped with '\' or RegExp() won't include it. */
    const leading_whitespace = new RegExp(`(<${trim[e]}[^>]*>)\\s+`, "g")
    const trailing_whitespace = new RegExp(`\\s+(</${trim[e]}>)`, "g")

    html = html
      .replace(leading_whitespace, '$1')
      .replace(trailing_whitespace, '$1')
  }

  return html
}

/**
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 */
export const unprotectAttributes = (html, constants = DEFAULT_CONSTANTS) => {
  html = html.replace(/<[\w:\-]+([^>]*[^\/])>/g, (/** @type {string} */match, /** @type {any} */capture) => {
    return match.replace(capture, (match) => {
      return match
        .replace(new RegExp(constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'nl!', "g"), '\n')
        .replace(new RegExp(constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'cr!', "g"), '\r')
        .replace(new RegExp(constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'ws!', "g"), ' ')
    })
  })

  return html
}

/**
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 */
export const unprotectContent = (html, constants = DEFAULT_CONSTANTS) => {
  html = html.replace(new RegExp(`.*${constants.CONTENT_IGNORE_PLACEHOLDER}[a-z]{2}!.*`, "g"), (/** @type {string} */match) => {
    return match.replace(new RegExp(`${constants.CONTENT_IGNORE_PLACEHOLDER}[a-z]{2}!`, "g"), (match) => {
      return match
        .replace(new RegExp(constants.CONTENT_IGNORE_PLACEHOLDER + 'nl!', "g"), '\n')
        .replace(new RegExp(constants.CONTENT_IGNORE_PLACEHOLDER + 'cr!', "g"), '\r')
        .replace(new RegExp(constants.CONTENT_IGNORE_PLACEHOLDER + 'ws!', "g"), ' ')
    })
  })

  return html
}

/**
 * Replace ignore string with html brackets.
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 * @returns {string}
 */
export const unsetIgnoreAttribute = (html, constants = DEFAULT_CONSTANTS) => {
  /* Regex to find opening tags and capture their attributes. */
  const tagRegex = /<([\w:\-]+)([^>]*)>/g
  const escapedIgnoreString = constants.ATTRIBUTE_IGNORE_PLACEHOLDER.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  )
  const ltPlaceholderRegex = new RegExp(escapedIgnoreString + "lt!", "g")
  const gtPlaceholderRegex = new RegExp(escapedIgnoreString + "gt!", "g")

  return html.replace(
    tagRegex,
    (
      /** @type {string} */ fullMatch,
      /** @type {string} */ tagName,
      /** @type {string} */ attributesCapture
    ) => {
      const processedAttributes = attributesCapture
        .replace(ltPlaceholderRegex, "<")
        .replace(gtPlaceholderRegex, ">")

      /* Reconstruct the tag. */
      return `<${tagName}${processedAttributes}>`
    }
  )
}

/**
 * Validate any passed-in config options and merge with CONFIG.
 * 
 * @param {import('htmlfy').UserConfig} config A user config.
 * @returns {import('htmlfy').Config} A validated config.
 */
export const validateConfig = (config) => {
  if (typeof config !== 'object') throw new Error('Config must be an object.')

  config = { ...config }
  
  const default_config = { ...CONFIG }

  const config_empty = !(
    Object.hasOwn(config, 'content_wrap') ||
    Object.hasOwn(config, 'ignore') || 
    Object.hasOwn(config, 'ignore_with') || 
    Object.hasOwn(config, 'strict') || 
    Object.hasOwn(config, 'tab_size') || 
    Object.hasOwn(config, 'tag_wrap') || 
    Object.hasOwn(config, 'trim')
  )

  if (config_empty) {
    return default_config
  }

  let tab_size = config.tab_size

  if (tab_size) {
    if (typeof tab_size !== 'number') throw new Error(`tab_size must be a number, not ${typeof config.tab_size}.`)

    const safe = Number.isSafeInteger(tab_size)
    if (!safe) throw new Error(`Tab size ${tab_size} is not safe. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger for more info.`)

    /** 
     * Round down, just in case a safe floating point,
     * like 4.0, was passed.
     */
    tab_size = Math.floor(tab_size)
    if (tab_size < 1 || tab_size > 16) throw new Error('Tab size out of range. Expecting 1 to 16.')
  
    config.tab_size = tab_size
  }

  if (Object.hasOwn(config, 'content_wrap') && typeof config.content_wrap !== 'number')
    throw new Error(`content_wrap config must be a number, not ${typeof config.content_wrap}.`)

  if (Object.hasOwn(config, 'ignore') && (!Array.isArray(config.ignore) || !config.ignore?.every((e) => typeof e === 'string')))
    throw new Error('Ignore config must be an array of strings.')

  if (Object.hasOwn(config, 'ignore_with')) {
    if (typeof config.ignore_with !== 'string')
      throw new Error(`ignore_with must be a string, not ${typeof config.ignore_with}.`)
    else if (config.ignore_with.startsWith('_'))
      /**
       * This negatively affects processing of preserved tag attributes,
       * because tag names can end with an underscore, so the regex
       * does not capture them.
       */
      throw new Error(`ignore_with cannot start with an underscore.`)
  }

  if (Object.hasOwn(config, 'strict') && typeof config.strict !== 'boolean')
    throw new Error(`Strict config must be a boolean, not ${typeof config.strict}.`)
  
  if (Object.hasOwn(config, 'tag_wrap') && typeof config.tag_wrap !== 'number')
    throw new Error(`tag_wrap config must be a number, not ${typeof config.tag_wrap}.`)

  if (Object.hasOwn(config, 'trim') && (!Array.isArray(config.trim) || !config.trim?.every((e) => typeof e === 'string')))
    throw new Error('Trim config must be an array of strings.')

  return mergeConfig(default_config, config)

}

/**
 * 
 * @param {string} text 
 * @param {number} width 
 * @param {string} indent
 * @param {HtmlfyConstants} [constants]
 */
export const wordWrap = (text, width, indent, constants = DEFAULT_CONSTANTS) => {
  const words = text.trim().split(/\s+/)
  
  if (words.length === 0 || (words.length === 1 && words[0] === ''))
    return ""

  const lines = []
  let current_line = ""
  const padding_string = indent

  words.forEach((word) => {
    if (word === "") return

    if (word.length >= width) {
      /* If there's content on the current line, push it first with correct padding. */
      if (current_line !== "")
        lines.push(lines.length === 0 ? indent + current_line : padding_string + current_line)

      /* Push a long word on its own line with correct padding. */
      lines.push(lines.length === 0 ? indent + word : padding_string + word)
      current_line = "" // Reset current line
      return // Move to the next word
    }

    /* Check if adding the next word exceeds the wrap width. */
    const test_line = current_line === "" ? word : current_line + " " + word

    if (test_line.length <= width) {
      current_line = test_line
    } else {
      /* Word doesn't fit, finish the current line and push it. */
      if (current_line !== "") {
         /* Add padding based on whether it's the first line added or not. */
         lines.push(lines.length === 0 ? indent + current_line : padding_string + current_line)
      }
      /* Start a new line with the current word. */
      current_line = word
    }
  })

  /* Add the last remaining line with appropriate padding. */
  if (current_line !== "")
    lines.push(lines.length === 0 ? indent + current_line : padding_string + current_line)

  const result = lines.join("\n")

  return protectContent(result, constants)
}

const IGNORE_MARKER_PREFIX = "___HTMLFY_SPECIAL_IGNORE_MARKER_"
const IGNORE_MARKER_REGEX = /___HTMLFY_SPECIAL_IGNORE_MARKER_\d+___/g
const TEXTAREA_MARKER_PREFIX = "___HTMLFY_TEXTAREA_MARKER_"
const TEXTAREA_MARKER_REGEX = /___HTMLFY_TEXTAREA_MARKER_\d+___/g

/**
 * Extract the contents of matching elements in one traversal.
 *
 * @param {string} html
 * @param {Set<string>} names
 * @param {string} marker_prefix
 * @param {(content: string) => string} [transform]
 * @returns {{ html_with_markers: string, extracted_map: Map<string,string> }}
 */
const extractBlocks = (html, names, marker_prefix, transform = content => content) => {
  const extracted_blocks = new Map()
  const chunks = []
  let marker_id = 0
  let previous_end = 0

  /** @type {{ name: string, content_start: number } | undefined} */
  let active_block
  let tag_start = -1
  let quote = ''

  for (let index = 0; index < html.length; index++) {
    const character = html[index]

    if (active_block) {
      if (character !== '<') continue

      let closing_index = index + 1
      while (/\s/.test(html[closing_index] || '')) closing_index++
      if (html[closing_index] !== '/') continue

      closing_index++
      while (/\s/.test(html[closing_index] || '')) closing_index++
      if (!html.startsWith(active_block.name, closing_index)) continue

      closing_index += active_block.name.length
      while (/\s/.test(html[closing_index] || '')) closing_index++
      if (html[closing_index] !== '>') continue

      const marker = `${marker_prefix}${marker_id++}___`
      chunks.push(html.slice(previous_end, active_block.content_start), marker)
      extracted_blocks.set(marker, transform(html.slice(active_block.content_start, index)))
      previous_end = index
      active_block = undefined
      index = closing_index
      continue
    }

    if (tag_start === -1) {
      if (character === '<') tag_start = index
      continue
    }

    if (quote) {
      if (character === quote) quote = ''
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
    } else if (character === '<') {
      tag_start = index
    } else if (character === '>') {
      const opening_tag = getOpeningTag(html.slice(tag_start, index + 1))
      if (opening_tag && names.has(opening_tag.name)) {
        active_block = { name: opening_tag.name, content_start: index + 1 }
      }
      tag_start = -1
    }
  }

  if (extracted_blocks.size === 0)
    return { html_with_markers: html, extracted_map: extracted_blocks }

  chunks.push(html.slice(previous_end))
  return { html_with_markers: chunks.join(''), extracted_map: extracted_blocks }
}

/**
 * Extract any HTML blocks to be ignored,
 * and replace them with a placeholder for re-insertion later.
 *
 * @param {string} html
 * @param {string[]} ignore
 * @returns {{ html_with_markers: string, extracted_map: Map<string,string> }}
 */
export function extractIgnoredBlocks(html, ignore) {
  return extractBlocks(html, new Set(ignore), IGNORE_MARKER_PREFIX)
}

/**
 * Protect textarea contents without expanding them into entities.
 *
 * @param {string} html
 * @returns {{ html_with_markers: string, extracted_map: Map<string,string> }}
 */
export function extractTextareaBlocks(html) {
  return extractBlocks(html, new Set(['textarea']), TEXTAREA_MARKER_PREFIX, content => content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
  )
}

/**
 * Re-insert ignored HTML blocks.
 * 
 * @param {string} html_with_markers 
 * @param {Map<any,any>} extracted_map 
 * @returns 
 */
export function reinsertIgnoredBlocks(html_with_markers, extracted_map) {
  return html_with_markers.replace(IGNORE_MARKER_REGEX, marker => extracted_map.get(marker) ?? marker)
}

/**
 * Re-insert protected textarea contents in one pass.
 *
 * @param {string} html_with_markers
 * @param {Map<string,string>} extracted_map
 * @returns {string}
 */
export function reinsertTextareaBlocks(html_with_markers, extracted_map) {
  return html_with_markers.replace(TEXTAREA_MARKER_REGEX, marker => extracted_map.get(marker) ?? marker)
}

const void_element_regex = new RegExp(`<(${VOID_ELEMENTS.join("|")})(?:\\s(?:[^/>]|/(?!>))*)*>`, 'g')

/**
 * Add a placeholder for void elements that are not self-closing.
 * This is for internal processing only.
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 * @returns 
 */
export function setSelfClosing(html, constants = DEFAULT_CONSTANTS) {
  return html.replace(
    // match only void elements that are not self-closing
    void_element_regex,
    match => match.replace(/>$/, constants.SELF_CLOSING_PLACEHOLDER)
  )
}

/**
 * Remove internal placeholder for non-native self-closing void elements.
 * 
 * @param {string} html
 * @param {HtmlfyConstants} [constants]
 * @returns 
 */
export function unsetSelfClosing(html, constants = DEFAULT_CONSTANTS) {
  return html.replace(constants.SELF_CLOSING_PLACEHOLDER, ">")
}
