declare module 'htmlfy' {
  export interface UserConfig {
    content_wrap?: number;
    ignore?: string[];
    ignore_with?: string;
    strict?: boolean;
    tab_size?: number;
    tag_wrap?: number;
    trim?: string[];
  }

  export type Config = Required<UserConfig>

  /**
   * Ensure void elements are "self-closing".
   * 
   * @param {string} html The HTML string to evaluate.
   * @returns {string}
   * @example <br> => <br />
   */
  export function closify(html: string): string

  /**
   * Enforce entity characters for textarea content.
   * To also minifiy, pass `minify` as `true`.
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
  export function entify(html: string, minify?: boolean): string

  /**
   * Creates a single-line HTML string
   * by removing line returns, tabs, and relevant spaces.
   * 
   * @param {string} html The HTML string to minify.
   * @param {UserConfig} [config] A user configuration object.
   * @returns A minified HTML string.
   */
  export function minify(html: string, config?: UserConfig): string

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
