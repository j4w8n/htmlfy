import { expect, test } from 'vitest'
import { minify, prettify } from 'htmlfy'
import { isHtml } from '../src/utils.js'

test('Malformed opening tags are not HTML', () => {
  expect(isHtml(`<div ${'attribute '.repeat(12)}`)).toBeFalsy()
})

test('Minify preserves a long text node', () => {
  const text = 'x'.repeat(4_096)
  expect(minify(`<div>${text}</div>`)).toBe(`<div>${text}</div>`)
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
