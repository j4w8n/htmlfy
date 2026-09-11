import { expect, test } from 'vitest'
import { minify, prettify } from 'htmlfy'
import {
  extractIgnoredBlocks,
  isHtml,
  reinsertIgnoredBlocks,
  setIgnoreAttribute,
  unsetIgnoreAttribute
} from '../src/utils.js'

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

test('Minify normalizes inter-tag and text whitespace', () => {
  const html = `<main>\n\t  <p>alpha  beta <span>inside</span> after</p>\n\t</main>`
  expect(minify(html)).toBe('<main><p>alpha beta <span>inside</span> after</p></main>')
})

test('Minify normalizes both spaced closing-tag forms', () => {
  expect(minify('<main><div>one< /div><p>two</ p><span>three< / span></main>')).toBe(
    '<main><div>one</div><p>two</p><span>three</span></main>'
  )
})

test('Attribute protection preserves quoted HTML', () => {
  const html = `<custom-element content='<b>bold</b>' title="1 > 0"></custom-element>`
  expect(unsetIgnoreAttribute(setIgnoreAttribute(html))).toBe(html)
})

test('Prettify preserves token classification and wrapping behavior', () => {
  const html = '<!doctype html><main><!-- note --><input type="text" aria-label="A label" data-long="1234567890"><p>one two three four five six seven eight nine ten</p></main>'

  expect(prettify(html, { tag_wrap: 30, content_wrap: 12 })).toBe(`<!doctype html>
<main>
  <!-- note -->
  <input
    type="text"
    aria-label="A label"
    data-long="1234567890"
  >
  <p>
    one two
    three four
    five six
    seven eight
    nine ten
  </p>
</main>`)
})

test('Prettify collapses only eligible inline elements', () => {
  const html = '<main><p>/</p><p>text</p><div>   </div><script> </script><x-item>custom</x-item></main>'

  expect(prettify(html)).toBe(`<main>
  <p>
    /
  </p>
  <p>text</p>
  <div></div>
  <script></script>
  <x-item>custom</x-item>
</main>`)
})

test('Prettify preserves many ignored blocks', () => {
  const block = '<pre>  const value = "a  b";\n    console.log(value);\n</pre>'
  const html = `<main>${block.repeat(25)}</main>`
  const expected = `<main>\n${Array(25).fill(`  ${block}`).join('\n')}\n</main>`

  expect(prettify(html, { ignore: ['pre'] })).toBe(expected)
})

test('Ignored block extraction handles multiple tag names in any order', () => {
  const html = '<main><pre> before <code>x</code> after </pre><code> y </code></main>'
  const { html_with_markers, extracted_map } = extractIgnoredBlocks(html, ['code', 'pre'])

  expect(extracted_map.size).toBe(2)
  expect(reinsertIgnoredBlocks(html_with_markers, extracted_map)).toBe(html)
})

test('Unclosed ignored blocks remain unchanged', () => {
  const html = '<main><pre>const value = "<unfinished";</main>'
  const { html_with_markers, extracted_map } = extractIgnoredBlocks(html, ['pre'])

  expect(html_with_markers).toBe(html)
  expect(extracted_map.size).toBe(0)
})

test('Minify preserves a large textarea body', () => {
  const content = `  first line\n    second line ${'<b>text</b>'.repeat(50)}  `
  expect(minify(`<textarea>${content}</textarea>`)).toBe(`<textarea>${content.replace(/\s+/g, ' ')}</textarea>`)
})

test('Minify handles malformed tag-like text inside textarea content', () => {
  const html = '<textarea>one < broken " quote\n  two</textarea>'
  expect(minify(html)).toBe('<textarea>one < broken " quote two</textarea>')
})

test('Minify preserves textarea entity decoding behavior', () => {
  const html = '<textarea>&lt;x&gt;&nbsp;&#10;&quot;q&quot;</textarea>'
  expect(minify(html)).toBe('<textarea><x> "q"</textarea>')
})
