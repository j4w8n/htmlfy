/**
 * Enforce entity characters for textarea content.
 * To also minifiy tags, pass `minify` as `true`.
 * 
 * @param {string} html The HTML string to evaluate.
 * @param {boolean} [minify] Minifies the textarea tags themselves. 
 * Defaults to `false`. We recommend a value of `true` if you're running `entify()` 
 * as a standalone function.
 * @returns {string}
 * @example <textarea>3 > 2</textarea> => <textarea>3&nbsp;&gt;&nbsp;2</textarea>
 * @example With minify.
 * <textarea  >3 > 2</textarea> => <textarea>3&nbsp;&gt;&nbsp;2</textarea>
 */
export const entify = (html, minify = false) => {
  /** 
   * Use entities inside textarea content.
   */
  html = html.replace(/<\s*textarea[^>]*>((.|\n)*?)<s*\/\s*textarea\s*>/g, (match, capture) => {
    return match.replace(capture, (match) => {
      return match
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/\n/g, '&#10;')
        .replace(/\r/g, '&#13;')
        .replace(/\s/g, '&nbsp;')
    })
  })

  if (minify) {
    html = html.replace(/<\s*textarea[^>]*>(.|\n)*?<\s*\/\s*textarea\s*>/g, (match) => {
      /* This only affects the html tags, since everything else has been entified. */
      return match
        .replace(/\s+/g, ' ')
        .replace(/\s>/g, '>')
        .replace(/>\s/g, '>')
        .replace(/\s</g, '<')
        .replace(/<\s/g, '<')
        .replace(/<\/\s/g, '<\/')
        .replace(/class=["']\s/g, (match) => match.replace(/\s/g, ''))
        .replace(/(class=.*)\s(["'])/g, '$1'+'$2')
    })
  }

  return html
}

/**
 * Remove entity characters for textarea content.
 * Currently internal use only.
 * 
 * @param {string} html The HTML string to evaluate.
 * @returns {string}
 * @example <textarea>3&nbsp;&gt;&nbsp;2</textarea> => <textarea>3 > 2</textarea>
 */
export const dentify = (html) => {
  /** 
   * Remove entities inside textarea content.
   */
  return html = html.replace(/<textarea[^>]*>((.|\n)*?)<\/textarea>/g, (match, capture) => {
    return match.replace(capture, (match) => {
      match = match
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#10;/g, '\n')
        .replace(/&#13;/g, '\r')
        .replace(/&nbsp;/g, ' ')
        // Ensure we collapse consecutive spaces, or they'll be completely removed later.
        .replace(/\s+/g, ' ')

      return match
    })
  })
}
