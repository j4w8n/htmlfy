import { CONFIG } from "./constants.js"

/**
 * @typedef {object} Constants
 * @property {string} CONTENT_IGNORE_PLACEHOLDER
 * @property {string} SELF_CLOSING_PLACEHOLDER
 * @property {string} ATTRIBUTE_IGNORE_PLACEHOLDER
 */
/**
 * @typedef {object} State
 * @property {boolean} checked_html - If passed in HTML has been checked for HTML within it.
 * @property {import("htmlfy").Config} config - Validated configuration.
 * @property {boolean} ignored
 * @property {Constants} constants - Constant strings, influenced by ignore_with.
 */

/**
 * @type State
 * 
 * `constants` prefixes and suffixes must be in sync with those in utils.js
 */
const state = {
  checked_html: false,
  config: { ...CONFIG },
  ignored: false,
  constants: {
    CONTENT_IGNORE_PLACEHOLDER: `${CONFIG.ignore_with}_`,
    SELF_CLOSING_PLACEHOLDER: `${CONFIG.ignore_with}/_>`,
    ATTRIBUTE_IGNORE_PLACEHOLDER: `${CONFIG.ignore_with}=_`
  }
}

/**
 * 
 * @returns {State}
 */
export const getState = () => state

/**
 * 
 * @param {Partial<State>} new_state 
 */
export const setState = (new_state) => Object.assign(state, new_state)
