import { ATTRIBUTE_IGNORE_STRING, CONFIG } from './constants.js'

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
export const isHtml = (content) => 
  /<(?:[A-Za-z]+[A-Za-z0-9]*)(?:\s+.*?)*?\/{0,1}>/.test(content) ||
  /<(?<Element>(?:[A-Za-z]+[A-Za-z0-9]*:)?(?:[A-Za-z]+[A-Za-z0-9]*))(?:\s+.*?)*?>(?:.|\n)*?<\/{1}\k<Element>>/.test(content) || 
  /<(?<Element>(?:[a-z][a-z0-9._]*:)?[a-z][a-z0-9._]*-[a-z0-9._-]+)(?:\s+.*?)*?>(?:.|\n)*?<\/{1}\k<Element>>/.test(content)

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
 * @param {import('htmlfy').Config} dconfig The default config.
 * @param {import('htmlfy').UserConfig} config The user config.
 * @returns {import('htmlfy').Config}
 */
export const mergeConfig = (dconfig, config) => {
  /**
   * We need to make a deep copy of `dconfig`,
   * otherwise we end up altering the original `CONFIG` because `dconfig` is a reference to it.
   */
  return mergeObjects(structuredClone(dconfig), config)
}

/**
 * 
 * @param {string} html 
 */
export const protectAttributes = (html) => {
  html = html.replace(/<[\w:\-]+([^>]*[^\/])>/g, (/** @type {string} */match, /** @type {any} */capture) => {
    return match.replace(capture, (match) => {
      return match
        .replace(/\n/g, ATTRIBUTE_IGNORE_STRING + 'nl!')
        .replace(/\r/g, ATTRIBUTE_IGNORE_STRING + 'cr!')
        .replace(/\s/g, ATTRIBUTE_IGNORE_STRING + 'ws!')
    })
  })

  return html
}

/**
 * Replace html brackets with ignore string.
 * 
 * @param {string} html 
 * @returns {string}
 */
export const setIgnoreAttribute = (html) => {
  const regex = /<([A-Za-z][A-Za-z0-9]*|[a-z][a-z0-9._]*-[a-z0-9._-]+)((?:\s+[A-Za-z0-9_-]+="[^"]*"|\s*[a-z]*)*)>/g

  html = html.replace(regex, (/** @type {string} */match, p1, p2) => {
    return match.replace(p2, (match) => {
      return match
        .replace(/</g, ATTRIBUTE_IGNORE_STRING + 'lt!')
        .replace(/>/g, ATTRIBUTE_IGNORE_STRING + 'gt!')
    })
  })
  
  return html
}

/**
 * Replace entities with ignore string.
 * 
 * @param {string} html 
 * @param {import('htmlfy').Config} config
 * @returns {string}
 */
export const setIgnoreElement = (html, config) => {
  const ignore = config.ignore
  const ignore_string = config.ignore_with

  for (let e = 0; e < ignore.length; e++) {
    const regex = new RegExp(`<${ignore[e]}[^>]*>((.|\n)*?)<\/${ignore[e]}>`, "g")

    html = html.replace(regex, (/** @type {string} */match, /** @type {any} */capture) => {
      return match.replace(capture, (match) => {
        return match
          .replace(/</g, '-' + ignore_string + 'lt-')
          .replace(/>/g, '-' + ignore_string + 'gt-')
          .replace(/\n/g, '-' + ignore_string + 'nl-')
          .replace(/\r/g, '-' + ignore_string + 'cr-')
          .replace(/\s/g, '-' + ignore_string + 'ws-')
      })
    })
  }
  
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
  html = html.replace(/<[\w:\-]+([^>]*[^\/])>/g, (/** @type {string} */match, /** @type {any} */capture) => {
    return match.replace(capture, (match) => {
      return match
        .replace(new RegExp(ATTRIBUTE_IGNORE_STRING + 'nl!', "g"), '\n')
        .replace(new RegExp(ATTRIBUTE_IGNORE_STRING + 'cr!', "g"), '\r')
        .replace(new RegExp(ATTRIBUTE_IGNORE_STRING + 'ws!', "g"), ' ')
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
  html = html.replace(/<[\w:\-]+([^>]*)>/g, (/** @type {string} */match, /** @type {any} */capture) => {
    return match.replace(capture, (match) => {
      return match
        .replace(new RegExp(ATTRIBUTE_IGNORE_STRING + 'lt!', "g"), '<')
        .replace(new RegExp(ATTRIBUTE_IGNORE_STRING + 'gt!', "g"), '>')
    })
  })
  
  return html
}

/**
 * Replace ignore string with entities.
 * 
 * @param {string} html 
 * @param {import('htmlfy').Config} config
 * @returns {string}
 */
export const unsetIgnoreElement = (html, config) => {
  const ignore = config.ignore
  const ignore_string = config.ignore_with

  for (let e = 0; e < ignore.length; e++) {
    const regex = new RegExp(`<${ignore[e]}[^>]*>((.|\n)*?)<\/${ignore[e]}>`, "g")

    html = html.replace(regex, (/** @type {string} */match, /** @type {any} */capture) => {
      return match.replace(capture, (match) => {
        return match
          .replace(new RegExp('-' + ignore_string + 'lt-', "g"), '<')
          .replace(new RegExp('-' + ignore_string + 'gt-', "g"), '>')
          .replace(new RegExp('-' + ignore_string + 'nl-', "g"), '\n')
          .replace(new RegExp('-' + ignore_string + 'cr-', "g"), '\r')
          .replace(new RegExp('-' + ignore_string + 'ws-', "g"), ' ')
      })
    })
  }
  
  return html
}

/**
 * Validate any passed-in config options and merge with CONFIG.
 * 
 * @param {import('htmlfy').UserConfig} config A user config.
 * @returns {import('htmlfy').Config} A validated config.
 */
export const validateConfig = (config) => {
  if (typeof config !== 'object') throw new Error('Config must be an object.')

  const config_empty = !(
    Object.hasOwn(config, 'ignore') || 
    Object.hasOwn(config, 'ignore_with') || 
    Object.hasOwn(config, 'strict') || 
    Object.hasOwn(config, 'tab_size') || 
    Object.hasOwn(config, 'tag_wrap') || 
    Object.hasOwn(config, 'tag_wrap_width') || 
    Object.hasOwn(config, 'trim')
  )

  if (config_empty) return CONFIG

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

  if (Object.hasOwn(config, 'ignore') && (!Array.isArray(config.ignore) || !config.ignore?.every((e) => typeof e === 'string')))
    throw new Error('Ignore config must be an array of strings.')

  if (Object.hasOwn(config, 'ignore_with') && typeof config.ignore_with !== 'string')
    throw new Error(`Ignore_with config must be a string, not ${typeof config.ignore_with}.`)

  if (Object.hasOwn(config, 'strict') && typeof config.strict !== 'boolean')
    throw new Error(`Strict config must be a boolean, not ${typeof config.strict}.`)

  if (Object.hasOwn(config, 'tag_wrap') && typeof config.tag_wrap !== 'boolean')
    throw new Error(`tag_wrap config must be a boolean, not ${typeof config.tag_wrap}.`)

  if (Object.hasOwn(config, 'tag_wrap_width') && typeof config.tag_wrap_width !== 'number')
    throw new Error(`tag_wrap_width config must be a number, not ${typeof config.tag_wrap_width}.`)

  if (Object.hasOwn(config, 'trim') && (!Array.isArray(config.trim) || !config.trim?.every((e) => typeof e === 'string')))
    throw new Error('Trim config must be an array of strings.')

  return mergeConfig(CONFIG, config)

}
