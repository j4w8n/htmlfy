/**
 * @type {import('htmlfy').Config}
 */
export const CONFIG = {
  content_wrap: 0,
  ignore: [],
  ignore_with: '!i-£___£%_',
  strict: false,
  tab_size: 2,
  tag_wrap: 0,
  trim: []
}

export const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 
  'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr'
]

/**
 * Defined by state.js and configuration.
 * 
 * CONTENT_IGNORE_PLACEHOLDER
 * SELF_CLOSING_PLACEHOLDER
 * ATTRIBUTE_IGNORE_PLACEHOLDER
 */
