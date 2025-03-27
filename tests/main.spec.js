import { closify } from '../src/closify.js'
import { CONFIG } from '../src/constants.js'
import { entify } from '../src/entify.js'
import { minify } from '../src/minify.js'
import { prettify } from '../src/prettify.js'
import { trimify } from '../src/utils.js'
import { expect, test } from 'vitest'


const ugly_html = `<form id="3"     >     <!-- 
      
This is a comment. --><!-- This is a second comment. --><label for="email-0">

What's your email?</label><input id="email-0" type="email" 
title="We need your email for verification." name="email" required><!--    This is another comment. -->
<label for="1">What fruits do you like?</label><fieldset id="1">
<input id="fruits-1-0" type="checkbox" name="fruits" value="apples">
<label for="fruits-1-0"  >Apples<  /label><br><div><!--      This is an embedded comment. --></div>
<input id="fruits-1-1" type="checkbox" name="fruits" value="grapes">
<label for="fruits-1-1">Grapes</label><br></fieldset>
<br><name:test></name:test>
<link:test><div>Hello There</div></link:test>
<custom-element class="hello there world" style="margin-top: 12px; margin-left: 12px;"><div>Goodbye World</div></custom-element>
</form>`

const entify_html = `<textarea  >

Did   you know that 3 >   2?

This is another paragraph.   


</textarea><textarea class="  more  stuff  ">    </textarea>`

const pretty_html = `<form id="3">
  <!-- This is a comment. -->
  <!-- This is a second comment. -->
  <label for="email-0">What's your email?</label>
  <input id="email-0" type="email" title="We need your email for verification." name="email" required />
  <!-- This is another comment. -->
  <label for="1">What fruits do you like?</label>
  <fieldset id="1">
    <input id="fruits-1-0" type="checkbox" name="fruits" value="apples" />
    <label for="fruits-1-0">Apples</label>
    <br />
    <div>
      <!-- This is an embedded comment. -->
    </div>
    <input id="fruits-1-1" type="checkbox" name="fruits" value="grapes" />
    <label for="fruits-1-1">Grapes</label>
    <br />
  </fieldset>
  <br />
  <name:test></name:test>
  <link:test>
    <div>Hello There</div>
  </link:test>
  <custom-element class="hello there world" style="margin-top: 12px; margin-left: 12px;">
    <div>Goodbye World</div>
  </custom-element>
</form>`

const pretty_strict_html = `<form id="3">
  <label for="email-0">What's your email?</label>
  <input id="email-0" type="email" title="We need your email for verification." name="email" required>
  <label for="1">What fruits do you like?</label>
  <fieldset id="1">
    <input id="fruits-1-0" type="checkbox" name="fruits" value="apples">
    <label for="fruits-1-0">Apples</label>
    <br>
    <div></div>
    <input id="fruits-1-1" type="checkbox" name="fruits" value="grapes">
    <label for="fruits-1-1">Grapes</label>
    <br>
  </fieldset>
  <br>
  <name:test></name:test>
  <link:test>
    <div>Hello There</div>
  </link:test>
  <custom-element class="hello there world" style="margin-top: 12px; margin-left: 12px;">
    <div>Goodbye World</div>
  </custom-element>
</form>`

const pretty_wrapped_html = `<form id="3">
  <!-- This is a comment. -->
  <!-- This is a second comment. -->
  <label for="email-0">What's your email?</label>
  <input
    id="email-0"
    type="email"
    title="We need your email for verification."
    name="email"
    required
  />
  <!-- This is another comment. -->
  <label for="1">What fruits do you like?</label>
  <fieldset id="1">
    <input id="fruits-1-0" type="checkbox" name="fruits" value="apples" />
    <label for="fruits-1-0">Apples</label>
    <br />
    <div>
      <!-- This is an embedded comment. -->
    </div>
    <input id="fruits-1-1" type="checkbox" name="fruits" value="grapes" />
    <label for="fruits-1-1">Grapes</label>
    <br />
  </fieldset>
  <br />
  <name:test></name:test>
  <link:test>
    <div>Hello There</div>
  </link:test>
  <custom-element
    class="hello there world"
    style="margin-top: 12px; margin-left: 12px;"
  >
    <div>Goodbye World</div>
  </custom-element>
</form>`

const pretty_wrapped_tab4_html = `<form id="3">
    <!-- This is a comment. -->
    <!-- This is a second comment. -->
    <label for="email-0">What's your email?</label>
    <input
        id="email-0"
        type="email"
        title="We need your email for verification."
        name="email"
        required
    />
    <!-- This is another comment. -->
    <label for="1">What fruits do you like?</label>
    <fieldset id="1">
        <input id="fruits-1-0" type="checkbox" name="fruits" value="apples" />
        <label for="fruits-1-0">Apples</label>
        <br />
        <div>
            <!-- This is an embedded comment. -->
        </div>
        <input id="fruits-1-1" type="checkbox" name="fruits" value="grapes" />
        <label for="fruits-1-1">Grapes</label>
        <br />
    </fieldset>
    <br />
    <name:test></name:test>
    <link:test>
        <div>Hello There</div>
    </link:test>
    <custom-element
        class="hello there world"
        style="margin-top: 12px; margin-left: 12px;"
    >
        <div>Goodbye World</div>
    </custom-element>
</form>`

const pretty_wrapped_strict_html = `<form id="3">
  <label for="email-0">What's your email?</label>
  <input
    id="email-0"
    type="email"
    title="We need your email for verification."
    name="email"
    required
  >
  <label for="1">What fruits do you like?</label>
  <fieldset id="1">
    <input id="fruits-1-0" type="checkbox" name="fruits" value="apples">
    <label for="fruits-1-0">Apples</label>
    <br>
    <div></div>
    <input id="fruits-1-1" type="checkbox" name="fruits" value="grapes">
    <label for="fruits-1-1">Grapes</label>
    <br>
  </fieldset>
  <br>
  <name:test></name:test>
  <link:test>
    <div>Hello There</div>
  </link:test>
  <custom-element
    class="hello there world"
    style="margin-top: 12px; margin-left: 12px;"
  >
    <div>Goodbye World</div>
  </custom-element>
</form>`

const closify_html = `<form id="3">
<!-- This is a comment. -->
<!-- This is a second comment. --><br><input><br><input><link:test></link:test></form>`

const config_html = `<form id="3">
<!-- This is a comment. -->
<!-- This is a second comment. --><div><br /><input /><br /><input /><div></div></div></form>`

const config_html_with_ignore_string = `<form id="3">
<!-- This is a comment. -->
<!-- This is a second comment. --><div><br /><input /><p>This contains &lt;angled&gt; brackets -${CONFIG.ignore_with}gt- and an unfortunate combination of characters</p><input /><div></div></div></form>`

const script_html = `<script>
  document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
</script>
`

const css_html = `
<main><div>Hello World</div></main>
<style>
  body {
    width: 100
  }
</style>`

const code_html = `
<pre><code>// This is my code
Please()
{
  leave it alone
}
</code></pre>
`

const trim_leading_whitespace = `<div> 

  Hello</div>`
const trim_trailing_whitespace = `<div>Hello

  

</div>`

const empty_attributes_spaces = `<main>
  <div data-some-thing2-else=''></div>
  <div data-some1thing2else="  "></div>
  <div data-one-two-three=""></div>
  <div data-name="" data-1='  '></div>
</main>`
const empty_attributes_fixed = `<main>
  <div data-some-thing2-else=''></div>
  <div data-some1thing2else=""></div>
  <div data-one-two-three=""></div>
  <div data-name="" data-1=''></div>
</main>`

const standalone_tag_wrap = '<mg-batman boolean text="hello" object="Property must be set through a script or a framework-specific syntax." array="Property must be set through a script or a framework-specific syntax." function="Property must be set through a script or a framework-specific syntax."></mg-batman>'
const standalone_pretty_tag_wrap = `<mg-batman
  boolean
  text="hello"
  object="Property must be set through a script or a framework-specific syntax."
  array="Property must be set through a script or a framework-specific syntax."
  function="Property must be set through a script or a framework-specific syntax."
></mg-batman>`

const standalone_input_wrap = '<input class="hello there world" id="fruits-1-0" type="checkbox" name="fruits" value="apples">'
const standalone_pretty_input_wrap = `<input
  class="hello there world"
  id="fruits-1-0"
  type="checkbox"
  name="fruits"
  value="apples"
 />`

const attribute_with_html_crazy_name = '<cus---t0m...element___ boolean text="hello" blu="blu bli bla blo" number="42" html-content="Help text with html <b>bold</b>, <em>italic</em>."></cus---t0m...element___>'
const attribute_with_html_crazy_name_tag_wrap = '<cus---t0m...element___ boolean text="hello" blu="blu bli bla blo" number="42" html-content="Help text with html <b>bold</b>, <em>italic</em>."></cus---t0m...element___>'
const attribute_with_html_crazy_name_pretty_tag_wrap = `<cus---t0m...element___
  boolean
  text="hello"
  blu="blu bli bla blo"
  number="42"
  html-content="Help text with html <b>bold</b>, <em>italic</em>."
></cus---t0m...element___>`
const void_attribute_with_hyphen = '<input boolean text="hello" blu="blu bli bla blo" number="42" html-content="Help text with html <b>bold</b>, <em>italic</em>.">'
const attribute_with_hyphen = '<mg-blublu boolean text="hello" blu="blu bli bla blo" number="42" html-content="Help text with html <b>bold</b>, <em>italic</em>."><div>Hello there world</div></mg-blublu>'
const attribute_with_hyphen_pretty = `<mg-blublu boolean text="hello" blu="blu bli bla blo" number="42" html-content="Help text with html <b>bold</b>, <em>italic</em>.">
  <div>Hello there world</div>
</mg-blublu>`
const attribute_with_hyphen_tag_wrap = '<mg-blublu boolean text="hello" blu="blu bli bla blo" number="42" html-content="Help text with html <b>bold</b>, <em>italic</em>."></mg-blublu>'
const attribute_with_hyphen_pretty_tag_wrap = `<mg-blublu
  boolean
  text="hello"
  blu="blu bli bla blo"
  number="42"
  html-content="Help text with html <b>bold</b>, <em>italic</em>."
></mg-blublu>`

// @ts-ignore
const testConfig = async (config) => {
  // await is required for this test
  return await prettify(config_html, config)
}

test('Trimify', () => {
  expect(trimify(trim_leading_whitespace, ['div'])).toBe('<div>Hello</div>')
  expect(trimify(trim_trailing_whitespace, ['div'])).toBe('<div>Hello</div>')
  expect(prettify(entify_html, { trim: [ 'textarea' ]})).toBe(
    `<textarea>Did&nbsp;&nbsp;&nbsp;you&nbsp;know&nbsp;that&nbsp;3&nbsp;&gt;&nbsp;&nbsp;&nbsp;2?&#10;&#10;This&nbsp;is&nbsp;another&nbsp;paragraph.</textarea>
<textarea class="more stuff"></textarea>`
  )
})

test('Prettify', () => {
  expect(prettify(ugly_html)).toBe(pretty_html)
})

test('Prettify with HTML check', () => {
  expect(prettify('No HTML')).toBe('No HTML')
})

test('Prettify with strict HTML', () => {
  expect(prettify(ugly_html, { strict: true })).toBe(pretty_strict_html)
})

test('Prettify with tag wrap', () => {
  expect(prettify(ugly_html, { tag_wrap: true })).toBe(pretty_wrapped_html)
})

test('Prettify with tag wrap and tab size', () => {
  expect(prettify(ugly_html, { tag_wrap: true, tab_size: 4 })).toBe(pretty_wrapped_tab4_html)
})

test('Prettify with tag wrap and strict HTML', () => {
  expect(prettify(ugly_html, { strict: true, tag_wrap: true })).toBe(pretty_wrapped_strict_html)
})

test('Prettify with empty attributes', () => {
  expect(prettify(empty_attributes_spaces)).toBe(empty_attributes_fixed)
})

test('Standalone tag wrap', () => {
  expect(prettify(standalone_tag_wrap, { tag_wrap: true })).toBe(standalone_pretty_tag_wrap)
})

test('Standalone input wrap', () => {
  expect(prettify(standalone_input_wrap, { tag_wrap: true })).toBe(standalone_pretty_input_wrap)
})

test('Attribute with html text for value', () => {
  expect(prettify(attribute_with_hyphen)).toBe(attribute_with_hyphen_pretty)
})

test('Tag wrapped attribute with html text for value', () => {
  expect(prettify(attribute_with_hyphen_tag_wrap, { tag_wrap: true })).toBe(attribute_with_hyphen_pretty_tag_wrap)
})

test('Void attribute with html text for value', () => {
  expect(prettify(void_attribute_with_hyphen, { strict: true })).toBe(void_attribute_with_hyphen)
})

test('Crazy attribute with html text for value', () => {
  expect(prettify(attribute_with_html_crazy_name)).toBe(attribute_with_html_crazy_name)
})

test('Crazy attribute with html text for value with tag wrap', () => {
  expect(prettify(attribute_with_html_crazy_name_tag_wrap, { tag_wrap: true })).toBe(attribute_with_html_crazy_name_pretty_tag_wrap)
})

test('Minify', () => {
  expect(minify(pretty_html)).toBe(
    `<form id="3"><!-- This is a comment. --><!-- This is a second comment. --><label for="email-0">What's your email?</label><input id="email-0" type="email" title="We need your email for verification." name="email" required /><!-- This is another comment. --><label for="1">What fruits do you like?</label><fieldset id="1"><input id="fruits-1-0" type="checkbox" name="fruits" value="apples" /><label for="fruits-1-0">Apples</label><br /><div><!-- This is an embedded comment. --></div><input id="fruits-1-1" type="checkbox" name="fruits" value="grapes" /><label for="fruits-1-1">Grapes</label><br /></fieldset><br /><name:test></name:test><link:test><div>Hello There</div></link:test><custom-element class="hello there world" style="margin-top: 12px; margin-left: 12px;"><div>Goodbye World</div></custom-element></form>`
  )
})

test('Minify with HTML check', () => {
  expect(minify('No HTML', true)).toBe('No HTML')
})

test('Entify', () => {
  expect(entify(entify_html)).toBe(
    `<textarea  >&#10;&#10;Did&nbsp;&nbsp;&nbsp;you&nbsp;know&nbsp;that&nbsp;3&nbsp;&gt;&nbsp;&nbsp;&nbsp;2?&#10;&#10;This&nbsp;is&nbsp;another&nbsp;paragraph.&nbsp;&nbsp;&nbsp;&#10;&#10;&#10;</textarea><textarea class="  more  stuff  ">&nbsp;&nbsp;&nbsp;&nbsp;</textarea>`
  )
})

test('Entify with plain text', () => {
  expect(entify('Plain text')).toBe('Plain text')
})

test('Entify with minify', () => {
  expect(entify(entify_html, true)).toBe(
    `<textarea>&#10;&#10;Did&nbsp;&nbsp;&nbsp;you&nbsp;know&nbsp;that&nbsp;3&nbsp;&gt;&nbsp;&nbsp;&nbsp;2?&#10;&#10;This&nbsp;is&nbsp;another&nbsp;paragraph.&nbsp;&nbsp;&nbsp;&#10;&#10;&#10;</textarea><textarea class="more stuff">&nbsp;&nbsp;&nbsp;&nbsp;</textarea>`
  )
})

test('Closify', () => {
  expect(closify(closify_html)).toBe(
`<form id="3">
<!-- This is a comment. -->
<!-- This is a second comment. --><br /><input /><br /><input /><link:test></link:test></form>`
  )
})

test('Closify with HTML check', () => {
  expect(closify('No HTML', true)).toBe('No HTML')
})

test('Ignore script tag', () => {
  expect(prettify(script_html, { ignore: [ 'script' ] })).toBe(
`<script>
  document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
</script>`
  )
})

test('Ignore style tag', () => {
  expect(prettify(css_html, { ignore: [ 'style' ]})).toBe(
`<main>
  <div>Hello World</div>
</main>
<style>
  body {
    width: 100
  }
</style>`
  )
})

test('Ignore nested tags', () => {
  expect(prettify(code_html, { ignore: [ 'pre', 'code' ]})).toBe(
`<pre><code>// This is my code
Please()
{
  leave it alone
}
</code></pre>`
  )
})

test('Strict config', () => {
  expect(prettify(config_html, { strict: true })).toBe(
`<form id="3">
  <div>
    <br>
    <input>
    <br>
    <input>
    <div></div>
  </div>
</form>`
  )
})

test('Tab size config', () => {
  expect(prettify(config_html, { tab_size: 4 })).toBe(
`<form id="3">
    <!-- This is a comment. -->
    <!-- This is a second comment. -->
    <div>
        <br />
        <input />
        <br />
        <input />
        <div></div>
    </div>
</form>`
  )
})

test('Default ignore_with in HTML', () => {
  expect(prettify(config_html_with_ignore_string, { ignore: ['p'], ignore_with: '!!-H--_-98'})).toBe(
`<form id="3">
  <!-- This is a comment. -->
  <!-- This is a second comment. -->
  <div>
    <br />
    <input />
    <p>This contains &lt;angled&gt; brackets -_!i-£___£%_gt- and an unfortunate combination of characters</p>
    <input />
    <div></div>
  </div>
</form>`
  )
})

test('Catches invalid ignore config', async () => {
  await expect(testConfig({ ignore: [ 'script', 1 ]})).rejects.toThrow('Ignore config must be an array of strings.')
})

test('Catches invalid trim config', async () => {
  await expect(testConfig({ trim: [ 'textarea', 1 ]})).rejects.toThrow('Trim config must be an array of strings.')
})
