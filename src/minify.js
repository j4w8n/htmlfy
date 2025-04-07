import { entify } from "./entify.js"
import { isHtml } from "./utils.js"

/**
 * Creates a single-line HTML string
 * by removing line returns, tabs, and relevant spaces.
 * 
 * @param {string} html The HTML string to minify.
 * @param {boolean} check_html Check to see if the content contains any HTML, before processing.
 * @returns {string} A minified HTML string.
 */
export const minify = (html, check_html = true) => {
  if (check_html && !isHtml(html)) return html

  /**
   * Ensure textarea content is specially minified and protected
   * before general minification.
   */
  html = entify(html)

  /* All other minification. */
  return html
    .replace(/\n|\t/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/(.+=)"\s+"/ig, '$1""')
    .replace(/(.+=)'\s+'/ig, "$1''")
    .replace(/\s>/g, '>')
    .replace(/<\s\//g, '</')
    .replace(/>\s/g, '>')
    .replace(/\s</g, '<')
    .replace(/class=["']\s/g, (match) => match.replace(/\s/g, ''))
    .replace(/(class=.*)\s(["'])/g, '$1'+'$2')
}
