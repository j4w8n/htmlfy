/**
 * @type {import('htmlfy').Config}
 */
export const CONFIG = {
  ignore: [],
  ignore_with: '_!i-£___£%_',
  strict: false,
  tab_size: 2,
  tag_wrap: false,
  tag_wrap_width: 80,
  trim: []
}

export const ATTRIBUTE_IGNORE_STRING = '!i-£___£%_'

export const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 
  'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr'
]
