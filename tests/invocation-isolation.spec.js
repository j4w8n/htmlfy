import { expect, test } from 'vitest'
import { closify, minify, prettify } from 'htmlfy'

test('Plain text remains unchanged after processing HTML', () => {
  prettify('<div>HTML</div>')

  expect(prettify('Plain  text')).toBe('Plain  text')
  expect(minify('Plain  text')).toBe('Plain  text')
  expect(closify('Plain  text')).toBe('Plain  text')
})

test('Prettify configuration does not affect later calls', () => {
  const html = '<main><div>content</div></main>'

  expect(prettify(html, { tab_size: 4 })).toBe(`<main>
    <div>content</div>
</main>`)
  expect(prettify(html)).toBe(`<main>
  <div>content</div>
</main>`)
})

test('Minify ignore configuration does not affect later calls', () => {
  const html = `<pre>  one
    two  </pre>`

  expect(minify(html, { ignore: ['pre'] })).toBe(html)
  expect(minify(html)).toBe('<pre>one two</pre>')
})

test('Custom placeholders do not affect later calls', () => {
  const html = '<div content="<span>value</span>"></div>'

  expect(prettify(html, { ignore_with: 'CUSTOM-PLACEHOLDER' })).toBe(html)
  expect(prettify(html)).toBe(html)
})
