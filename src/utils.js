import { CONFIG } from './constants.js'

/**
 * Checks if content contains at least one HTML element.
 * 
 * @param {string} content Content to evaluate.
 * @returns {boolean} A boolean.
 */
export const isHtml = (content) => {
  const regex = /<(?<Element>[A-Za-z]+\b)[^>]*(?:.|\n)*?<\/{1}\k<Element>>/
  return regex.test(content)
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
    throw new Error("Both 'current' and 'updates' must be passed-in to merge()")

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
 * @param {import('types').DefaultConfig} dconfig The default config.
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
 * Ignores elements by protecting or unprotecting their entities.
 * 
 * @param {string} html 
 * @param {string[]} ignore
 * @param {'protect'|'unprotect'} mode
 * @param {string} protectionString
 * @returns {string}
 */
export const ignoreElement = (html, ignore, mode, protectionString) => {
  for (let e = 0; e < ignore.length; e++) {
    const regex = new RegExp(`<${ignore[e]}[^>]*>((.|\n)*?)<\/${ignore[e]}>`, "g")
    html = html.replace(regex, mode === 'protect' ? (match, capture) => protectElement(match, capture, protectionString) : (match, capture) => unprotectElement(match, capture, protectionString))
  }

  return html
}

/**
 * Protect an element by inserting entities.
 * 
 * @param {string} match 
 * @param {any} capture 
 * @param {string} protectionString 
 * @returns 
 */
const protectElement = (match, capture, protectionString) => {
  return match.replace(capture, (match) => {
    return match
      .replace(/</g, '-' + protectionString + 'lt-')
      .replace(/>/g, '-' + protectionString + 'gt-')
      .replace(/\n/g, '-' + protectionString + 'nl-')
      .replace(/\r/g, '-' + protectionString + 'cr-')
      .replace(/\s/g, '-' + protectionString + 'ws-')
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
 * Unprotect an element by removing entities.
 * 
 * @param {string} match 
 * @param {any} capture 
 * @param {string} protectionString 
 * @returns 
 */
const unprotectElement = (match, capture, protectionString) => {
  return match.replace(capture, (match) => {
    return match
      .replace(new RegExp('-' + protectionString + 'lt-', "g"), '<')
      .replace(new RegExp('-' + protectionString + 'gt-', "g"), '>')
      .replace(new RegExp('-' + protectionString + 'nl-', "g"), '\n')
      .replace(new RegExp('-' + protectionString + 'cr-', "g"), '\r')
      .replace(new RegExp('-' + protectionString + 'ws-', "g"), ' ')
  })
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
    Object.hasOwn(config, 'tab_size') || 
    Object.hasOwn(config, 'strict') || 
    Object.hasOwn(config, 'ignore') || 
    Object.hasOwn(config, 'trim') || 
    Object.hasOwn(config, 'protection_string'))
  if (config_empty) return CONFIG

  let tab_size = config.tab_size

  if (tab_size) {
    if (typeof tab_size !== 'number') throw new Error('Tab size must be a number.')
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

  if (Object.hasOwn(config, 'strict') && typeof config.strict !== 'boolean')
    throw new Error('Strict config must be a boolean.')
  if (Object.hasOwn(config, 'ignore') && (!Array.isArray(config.ignore) || !config.ignore?.every((e) => typeof e === 'string')))
    throw new Error('Ignore config must be an array of strings.')
  if (Object.hasOwn(config, 'trim') && (!Array.isArray(config.trim) || !config.trim?.every((e) => typeof e === 'string')))
    throw new Error('Trim config must be an array of strings.')

  return mergeConfig(CONFIG, config)

}
