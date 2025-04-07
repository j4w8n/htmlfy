declare module 'htmlfy' {
  export interface UserConfig {
    content_wrap?: number;
    ignore?: string[];
    ignore_with?: string;
    strict?: boolean;
    tab_size?: number;
    tag_wrap?: boolean;
    tag_wrap_width?: number;
    trim?: string[];
  }

  export type Config = Required<UserConfig>

  /**
   * Ensure void elements are "self-closing".
   *
   * @param {string} html The HTML string to evaluate.
   * @param {boolean} [html_check] Check to see if the content contains any HTML, before processing. Defaults to `true`.
   * @returns An HTML string where void elements are formatted as self-closing.
   * @example <br> => <br />
   */
  export function closify(html: string, html_check?: boolean): string

  /**
   * Enforce entity characters for textarea content.
   * By default, this also does basic minification before setting entities.
   * For full minification, pass `minify` as `true`.
   * 
   * @param {string} html The HTML string to evaluate.
   * @param {boolean} [minify] Fully minifies the content of textarea elements. 
   * Defaults to `false`. We recommend a value of `true` if you're running `entify()` 
   * as a standalone function.
   * @returns An HTML string where entities are enforced on the contents of textareas.
   * @example <textarea>3 > 2</textarea> => <textarea>3 &gt; 2</textarea>
   */
  export function entify(html: string, minify?: boolean): string

  /**
   * Creates a single-line HTML string
   * by removing line returns, tabs, and relevant spaces.
   * 
   * @param {string} html The HTML string to minify.
   * @param {boolean} [html_check] Check to see if the content contains any HTML, before processing. Defaults to `true`.
   * @returns A minified HTML string.
   */
  export function minify(html: string, html_check?: boolean): string

  /**
   * Format HTML with line returns and indentations.
   * 
   * @param {string} html The HTML string to prettify.
   * @param {UserConfig} [config] A user configuration object.
   * @returns A well-formed HTML string.
   */
  export function prettify(html: string, config?: UserConfig): string

  /**
   * Trim leading and trailing whitespace from the defined HTML elements.
   * 
   * @param {string} html
   * @param {string[]} trim
   * @returns A trimmed string.
   */
  export function trimify(html: string, trim: string[]): string
}
