import { CONFIG } from "./constants.js"

/**
 * @typedef {object} State
 * @property {boolean} checked_html - If passed in HTML has been checked for HTML within it.
 * @property {import("htmlfy").Config} config - Validated configuration.
 * @property {boolean} ignored
 */

/**
 * @type State
 */
const state = {
  checked_html: false,
  config: { ...CONFIG },
  ignored: false
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
