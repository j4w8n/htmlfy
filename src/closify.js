import { VOID_ELEMENTS } from "./constants.js"
import { isHtml } from "./utils.js"

/**
 * Ensure void elements are "self-closing".
 * 
 * @param {string} html The HTML string to evaluate.
 * @param {boolean} check_html Check to see if the content contains any HTML, before processing.
 * @returns {string}
 * @example <br> => <br />
 */
export const closify = (html, check_html = true) => {
  if (check_html && !isHtml(html)) return html
  
  return html.replace(/<([a-zA-Z\-0-9:]+)[^>]*>/g, (match, name) => {
    if (VOID_ELEMENTS.indexOf(name) > -1)
      return (`${match.substring(0, match.length - 1)} />`).replace(/\/\s\//g, '/')

    return match.replace(/[\s]?\/>/g, `></${name}>`)
  })
}
