import { CONFIG, VOID_ELEMENTS } from './constants.js'
import { getState, setState } from './state.js'

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
  setState({ checked_html: true })

  return /<(?:[A-Za-z]+[A-Za-z0-9]*)(?:\s+.*?)*?\/{0,1}>/.test(content) ||
  /<(?<Element>(?:[A-Za-z]+[A-Za-z0-9]*:)?(?:[A-Za-z]+[A-Za-z0-9]*))(?:\s+.*?)*?>(?:.|\n)*?<\/{1}\k<Element>>/.test(content) || 
  /<(?<Element>(?:[a-z][a-z0-9._]*:)?[a-z][a-z0-9._]*-[a-z0-9._-]+)(?:\s+.*?)*?>(?:.|\n)*?<\/{1}\k<Element>>/.test(content)
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
  const validated_config = mergeObjects(default_config, config)

  /* Below `constants` prefixes and suffixes must be in sync with those in state.js */
  setState({ 
    config: validated_config,
    constants: {
      CONTENT_IGNORE_PLACEHOLDER: `${validated_config.ignore_with}_`,
      SELF_CLOSING_PLACEHOLDER: `${validated_config.ignore_with}/_>`,
      ATTRIBUTE_IGNORE_PLACEHOLDER: `${validated_config.ignore_with}`
    }
  })
  return validated_config
}

/**
 * 
 * @param {string} html 
 */
export const protectAttributes = (html) => {
  const { constants } = getState()

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
 */
export const protectContent = (html) => {
  const { constants } = getState()

  return html
    .replace(/\n/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'nl!')
    .replace(/\r/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'cr!')
    .replace(/\s/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'ws!')
}

/**
 * 
 * @param {string} html 
 */
export const finalProtectContent = (html) => {
  const regex = /\s*<([a-zA-Z0-9:-]+)[^>]*>\n\s*<\/\1>(?=\n[ ]*[^\n]*__!i-£___£%__[^\n]*\n)(\n[ ]*\S[^\n]*\n)|<([a-zA-Z0-9:-]+)[^>]*>(?=\n[ ]*[^\n]*__!i-£___£%__[^\n]*\n)(\n[ ]*\S[^\n]*\n\s*)<\/\3>/g 
  const { constants } = getState()

  return html
    .replace(regex, (/** @type {string} */match, p1, p2, p3, p4) => {
      const text_to_protect = p2 || p4

      if (!text_to_protect)
        return match

      const protected_text = text_to_protect
       .replace(/\n/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'nl!')
       .replace(/\r/g, constants.CONTENT_IGNORE_PLACEHOLDER + 'cr!')
       .replace(/\s/g, constants.CONTENT_IGNORE_PLACEHOLDER + "ws!");

      return match.replace(text_to_protect, protected_text)
    })
}

/**
 * Replace html brackets with ignore string.
 * 
 * @param {string} html 
 * @returns {string}
 */
export const setIgnoreAttribute = (html) => {
  const regex = /<([A-Za-z][A-Za-z0-9]*|[a-z][a-z0-9._]*-[a-z0-9._-]+)((?:\s+[A-Za-z0-9_-]+="[^"]*"|\s*[a-z]*)*)>/g 
  const { constants } = getState()

  html = html.replace(regex, (/** @type {string} */match, p1, p2) => {
    return match.replace(p2, (match) => {
      return match
        .replace(/</g, constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'lt!')
        .replace(/>/g, constants.ATTRIBUTE_IGNORE_PLACEHOLDER + 'gt!')
    })
  })
  
  return html
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
 */
export const unprotectAttributes = (html) => {
  const { constants } = getState()

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
 */
export const unprotectContent = (html) => {
  const { constants } = getState()

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
 * @returns {string}
 */
export const unsetIgnoreAttribute = (html) => {
  /* Regex to find opening tags and capture their attributes. */
  const tagRegex = /<([\w:\-]+)([^>]*)>/g
  const { constants } = getState()
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
  
  const default_config = { ...CONFIG }

  const config_empty = !(
    Object.hasOwn(config, 'content_wrap') ||
    Object.hasOwn(config, 'ignore') || 
    Object.hasOwn(config, 'ignore_with') || 
    Object.hasOwn(config, 'strict') || 
    Object.hasOwn(config, 'tab_size') || 
    Object.hasOwn(config, 'tag_wrap') || 
    Object.hasOwn(config, 'tag_wrap_width') || 
    Object.hasOwn(config, 'trim')
  )

  if (config_empty) {
    setState({ config: default_config })
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
    else if (config.ignore_with.startsWith('_') || config.ignore_with.endsWith('_'))
      /**
       * This negatively affects processing of preserved tag attributes,
       * but I'm not sure why.
       */
      throw new Error(`ignore_with cannot start or end with an underscore.`)
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
 */
export const wordWrap = (text, width, indent) => {
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

  return protectContent(result)
}

/**
 * Extract any HTML blocks to be ignored,
 * and replace them with a placeholder
 * for re-insertion later.
 * 
 * @param {string} html 
 * @param {import('htmlfy').Config} config 
 * @returns {{ html_with_markers: string, extracted_map: Map<any,any> }}
 */
export function extractIgnoredBlocks(html, config) {
  setState({ ignored: true })
  let current_html = html
  const extracted_blocks = new Map()
  let marker_id = 0
  const MARKER_PREFIX = "___HTMLFY_SPECIAL_IGNORE_MARKER_"

  for (const tag of config.ignore) {
    /* Ensure tag is escaped if it can contain regex special chars. */
    const safe_tag_name = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")

    const regex = new RegExp(
      `(<\\s*${safe_tag_name}[^>]*>)(.*?)(<\\s*\/\\s*${safe_tag_name}\\s*>)`,
      "gs" // global and dotAll
    )

    /** @type RegExpExecArray | null */
    let match

    /**
     * @type {{ start: number; end: number; marker: string }[]}
     */
    const replacements = []

    while ((match = regex.exec(current_html)) !== null) {
      const marker = `${MARKER_PREFIX}${marker_id++}___`

      /* Only store content, and minify tags later. */
      extracted_blocks.set(marker, match[2])
      
      replacements.push({
        start: match.index + match[1].length, // start of content
        end: match.index + match[1].length + match[2].length, // end of content
        marker: marker,
      })
    }

    /* Apply replacements from the end to the beginning to keep indices valid. */
    for (let i = replacements.length - 1; i >= 0; i--) {
      const rep = replacements[i]
      current_html =
        current_html.substring(0, rep.start) +
        rep.marker +
        current_html.substring(rep.end)
    }
  }

  return { html_with_markers: current_html, extracted_map: extracted_blocks }
}

/**
 * Re-insert ignored HTML blocks.
 * 
 * @param {string} html_with_markers 
 * @param {Map<any,any>} extracted_map 
 * @returns 
 */
export function reinsertIgnoredBlocks(html_with_markers, extracted_map) {
  setState({ ignored: false })
  let final_html = html_with_markers

  for (const [marker, original_block] of extracted_map) {
    final_html = final_html.split(marker).join(original_block)
  }
  return final_html
}

const void_element_regex = new RegExp(`<(${VOID_ELEMENTS.join("|")})(?:\\s(?:[^/>]|/(?!>))*)*>`, 'g')

/**
 * Add a placeholder for void elements that are not self-closing.
 * This is for internal processing only.
 * 
 * @param {string} html 
 * @returns 
 */
export function setSelfClosing(html) {
  const { constants } = getState()

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
 * @returns 
 */
export function unsetSelfClosing(html) {
  const { constants } = getState()

  return html.replace(constants.SELF_CLOSING_PLACEHOLDER, ">")
}
