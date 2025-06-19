import { VOID_ELEMENTS } from "./constants.js"
import { getState } from "./state.js"
import { isHtml } from "./utils.js"

/**
 * Ensure void elements are "self-closing".
 * 
 * @param {string} html The HTML string to evaluate.
 * @returns {string}
 * @example <br> => <br />
 */
export const closify = (html) => {
  const { checked_html } = getState()
  
  if (!checked_html && !isHtml(html)) return html
  
  return html.replace(/<([a-zA-Z\-0-9:]+)[^>]*>/g, (match, name) => {
    if (VOID_ELEMENTS.indexOf(name) > -1)
      return (`${match.substring(0, match.length - 1)} />`).replace(/\/\s\//g, '/')

    return match.replace(/[\s]?\/>/g, `></${name}>`)
  })
}
