import { expect, test } from 'vitest'
import { minify, prettify } from 'htmlfy'
import { isHtml, setIgnoreAttribute, unsetIgnoreAttribute } from '../src/utils.js'

test('Malformed opening tags are not HTML', () => {
  expect(isHtml(`<div ${'attribute '.repeat(10_000)}`)).toBeFalsy()
})

test('Minify preserves a long text node', () => {
  const text = 'x'.repeat(128 * 1_024)
  expect(minify(`<div>${text}</div>`)).toBe(`<div>${text}</div>`)
})

test('Minify trims only quoted attribute values', () => {
  const html = `<div title="  1 > 0  " data-value='  <span>value</span>  '>content= " unchanged "</div>`
  expect(minify(html)).toBe(`<div title="1>0" data-value='<span>value</span>'>content= " unchanged "</div>`)
})

test('Attribute protection preserves quoted HTML', () => {
  const html = `<custom-element content='<b>bold</b>' title="1 > 0"></custom-element>`
  expect(unsetIgnoreAttribute(setIgnoreAttribute(html))).toBe(html)
})

test('Prettify preserves many ignored blocks', () => {
  const block = '<pre>  const value = "a  b";\n    console.log(value);\n</pre>'
  const html = `<main>${block.repeat(25)}</main>`
  const expected = `<main>\n${Array(25).fill(`  ${block}`).join('\n')}\n</main>`

  expect(prettify(html, { ignore: ['pre'] })).toBe(expected)
})

test('Minify preserves a large textarea body', () => {
  const content = `  first line\n    second line ${'<b>text</b>'.repeat(50)}  `
  expect(minify(`<textarea>${content}</textarea>`)).toBe(`<textarea>${content.replace(/\s+/g, ' ')}</textarea>`)
})
