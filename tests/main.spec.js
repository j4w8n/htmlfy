import { closify } from '../src/closify.js'
import { CONFIG } from '../src/constants.js'
import { entify } from '../src/entify.js'
import { minify } from '../src/minify.js'
import { prettify } from '../src/prettify.js'
import { isHtml, trimify } from '../src/utils.js'
import { expect, test } from 'vitest'

const common_config = {
  content_wrap: 60
}

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
</form>
<link:test>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</link:test>
<mg-card>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</mg-card>`

const single_textarea_html = `<   textarea  >

Did   you know that 3 >   2?

This is another paragraph.   


</  textarea   >`
const textarea_html = `<   textarea  >

Did   you know that 3 >   2?

This is another paragraph.   


</  textarea   ><textarea class="  more  stuff  ">    </textarea>`

const pretty_html = `<form id="3">
  <!-- This is a comment. -->
  <!-- This is a second comment. -->
  <label for="email-0">What's your email?</label>
  <input id="email-0" type="email" title="We need your email for verification." name="email" required>
  <!-- This is another comment. -->
  <label for="1">What fruits do you like?</label>
  <fieldset id="1">
    <input id="fruits-1-0" type="checkbox" name="fruits" value="apples">
    <label for="fruits-1-0">Apples</label>
    <br>
    <div>
      <!-- This is an embedded comment. -->
    </div>
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
</form>
<link:test>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</link:test>
<mg-card>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</mg-card>`

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
</form>
<link:test>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</link:test>
<mg-card>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</mg-card>`

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
  >
  <!-- This is another comment. -->
  <label for="1">What fruits do you like?</label>
  <fieldset id="1">
    <input id="fruits-1-0" type="checkbox" name="fruits" value="apples">
    <label for="fruits-1-0">Apples</label>
    <br>
    <div>
      <!-- This is an embedded comment. -->
    </div>
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
</form>
<link:test>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</link:test>
<mg-card>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</mg-card>`

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
    >
    <!-- This is another comment. -->
    <label for="1">What fruits do you like?</label>
    <fieldset id="1">
        <input id="fruits-1-0" type="checkbox" name="fruits" value="apples">
        <label for="fruits-1-0">Apples</label>
        <br>
        <div>
            <!-- This is an embedded comment. -->
        </div>
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
</form>
<link:test>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
    do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
    occaecat cupidatat non proident, sunt in culpa qui officia
    deserunt mollit anim id est laborum.
</link:test>
<mg-card>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
    do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
    occaecat cupidatat non proident, sunt in culpa qui officia
    deserunt mollit anim id est laborum.
</mg-card>`

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
</form>
<link:test>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</link:test>
<mg-card>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</mg-card>`

const closify_html = `<form id="3">
<!-- This is a comment. -->
<form id="test" />
<!-- This is a second comment. --><br><input class="hello"><br><input><link:test></link:test></form>`

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
>`

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

const regular_elements_with_simple_nesting = '<div identifier="identifier" message="This is a tooltip message"><icon icon="info-circle"></icon></div>'
const regular_elements_pretty_with_simple_nesting = `<div identifier="identifier" message="This is a tooltip message">
  <icon icon="info-circle"></icon>
</div>`
const regular_elements_with_nesting = '<article items="⚠️ Property must be set through a script or a framework-specific syntax." identifier="identifier" name="input-name" label="Label" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>."><div><span slot="item-1">non</span><span slot="item-2">oui</span></div><h1>Hello</h1></article>'
const regular_elements_pretty_with_nesting = `<article items="⚠️ Property must be set through a script or a framework-specific syntax." identifier="identifier" name="input-name" label="Label" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>.">
  <div>
    <span slot="item-1">non</span>
    <span slot="item-2">oui</span>
  </div>
  <h1>Hello</h1>
</article>`

const custom_elements_with_simple_nesting = '<mg-tooltip identifier="identifier" message="This is a tooltip message"><mg-icon icon="info-circle"></mg-icon></mg-tooltip>'
const custom_elements_pretty_with_simple_nesting = `<mg-tooltip identifier="identifier" message="This is a tooltip message">
  <mg-icon icon="info-circle"></mg-icon>
</mg-tooltip>`
const custom_elements_with_nesting = '<mg-input-toggle items="⚠️ Property must be set through a script or a framework-specific syntax." identifier="identifier" name="input-name" label="Label" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>."><div>Let the spans fly.<span slot="item-1">non</span><span slot="item-2">oui</span></div><nested-custom>Hello</nested-custom></mg-input-toggle>'
const custom_elements_pretty_with_nesting = `<mg-input-toggle items="⚠️ Property must be set through a script or a framework-specific syntax." identifier="identifier" name="input-name" label="Label" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>.">
  <div>
    Let the spans fly.
    <span slot="item-1">non</span>
    <span slot="item-2">oui</span>
  </div>
  <nested-custom>Hello</nested-custom>
</mg-input-toggle>`
const custom_elements_with_nesting_tag_wrap = '<mg-input-toggle items="⚠️ Property must be set through a script or a framework-specific syntax." identifier="identifier" name="input-name" label="Label" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>."><div>Let the spans fly.<span slot="item-1">non</span><span slot="item-2">oui</span></div><link:test>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</link:test><mg-card>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</mg-card><nested-custom>Hello</nested-custom></mg-input-toggle>'
const custom_elements_pretty_with_nesting_tag_wrap = `<mg-input-toggle
  items="⚠️ Property must be set through a script or a framework-specific syntax."
  identifier="identifier"
  name="input-name"
  label="Label"
  tooltip="This is a tooltip"
  help-text="Help text with html <b>bold</b>, <em>italic</em>."
>
  <div>
    Let the spans fly.
    <span slot="item-1">non</span>
    <span slot="item-2">oui</span>
  </div>
  <link:test>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
    do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
    occaecat cupidatat non proident, sunt in culpa qui officia
    deserunt mollit anim id est laborum.
  </link:test>
  <mg-card>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
    do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
    occaecat cupidatat non proident, sunt in culpa qui officia
    deserunt mollit anim id est laborum.
  </mg-card>
  <nested-custom>Hello</nested-custom>
</mg-input-toggle>`

const elements_with_multiple_standalone_attributes_and_html = '<mg-input-toggle boolean items="⚠️ Property must be set through a script or a framework-specific syntax." identifier="identifier" selected name="input-name" label="Label" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>." required><div>Let the spans fly.<span slot="item-1">non</span><span slot="item-2">oui</span></div><nested-custom>Hello</nested-custom></mg-input-toggle>'
const elements_pretty_with_multiple_standalone_attributes_and_html = `<mg-input-toggle boolean items="⚠️ Property must be set through a script or a framework-specific syntax." identifier="identifier" selected name="input-name" label="Label" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>." required>
  <div>
    Let the spans fly.
    <span slot="item-1">non</span>
    <span slot="item-2">oui</span>
  </div>
  <nested-custom>Hello</nested-custom>
</mg-input-toggle>`
const elements_pretty_with_multiple_standalone_attributes_and_html_tag_wrap = `<mg-input-toggle
  boolean
  items="⚠️ Property must be set through a script or a framework-specific syntax."
  identifier="identifier"
  selected
  name="input-name"
  label="Label"
  tooltip="This is a tooltip"
  help-text="Help text with html <b>bold</b>, <em>italic</em>."
  required
>
  <div>
    Let the spans fly.
    <span slot="item-1">non</span>
    <span slot="item-2">oui</span>
  </div>
  <nested-custom>Hello</nested-custom>
</mg-input-toggle>`

const trailing_plaintext_sibling = '<mg-input-text identifier="identifier" name="input-name" label="Label" type="search" icon="magnifying-glass" placeholder="placeholder" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>."><div>Hello</div><mg-button slot="append-input" label="search"><mg-icon icon="magnifying-glass"></mg-icon> Search</mg-button></mg-input-text>'
const pretty_trailing_plaintext_sibling = `<mg-input-text
  identifier="identifier"
  name="input-name"
  label="Label"
  type="search"
  icon="magnifying-glass"
  placeholder="placeholder"
  tooltip="This is a tooltip"
  help-text="Help text with html <b>bold</b>, <em>italic</em>."
>
  <div>Hello</div>
  <mg-button slot="append-input" label="search">
    <mg-icon icon="magnifying-glass"></mg-icon>
    Search
  </mg-button>
</mg-input-text>`
const leading_plaintext_sibling = '<mg-input-text identifier="identifier" name="input-name" label="Label" type="search" icon="magnifying-glass" placeholder="placeholder" tooltip="This is a tooltip" help-text="Help text with html <b>bold</b>, <em>italic</em>."><div>Hello</div><mg-button slot="append-input" label="search"> Search<mg-icon icon="magnifying-glass"></mg-icon></mg-button></mg-input-text>'
const pretty_leading_plaintext_sibling = `<mg-input-text
  identifier="identifier"
  name="input-name"
  label="Label"
  type="search"
  icon="magnifying-glass"
  placeholder="placeholder"
  tooltip="This is a tooltip"
  help-text="Help text with html <b>bold</b>, <em>italic</em>."
>
  <div>Hello</div>
  <mg-button slot="append-input" label="search">
    Search
    <mg-icon icon="magnifying-glass"></mg-icon>
  </mg-button>
</mg-input-text>`
const surrounded_plaintext_sibling = `<div>The panda <i>eats</i>, <i>shoots</i>, and <i>leaves</i>.</div>`
const pretty_surrounded_plaintext_sibling = `<div>
  The panda
  <i>eats</i>,
  <i>shoots</i>,
  and
  <i>leaves</i>.
</div>`

const heavy_plaintext = `<div>Hello There World<br />Goodbye Now</div><div><i></i> Simmer<span>Down</span>Y'all </div>`
const pretty_heavy_plaintext = `<div>
  Hello There World
  <br />
  Goodbye Now
</div>
<div>
  <i></i>
  Simmer
  <span>Down</span>
  Y'all
</div>`

const custom_heavy_plaintext = `<name:test>Hello There World<br />Goodbye Now</name:test><link:test><thing:one></thing:one> Simmer<thing:two>Down</thing:two>Y'all </link:test>`
const pretty_custom_heavy_plaintext = `<name:test>
  Hello There World
  <br />
  Goodbye Now
</name:test>
<link:test>
  <thing:one></thing:one>
  Simmer
  <thing:two>Down</thing:two>
  Y'all
</link:test>`

const content_wrap =  "<mg-card>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</mg-card>"
const wrapped_content_wrap = `<mg-card>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</mg-card>`

const content_wrap_siblings =  "<div><mg-card></mg-card>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div>"
const wrapped_content_wrap_siblings = `<div>
  <mg-card></mg-card>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
  do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation
  ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit
  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia
  deserunt mollit anim id est laborum.
</div>`

const only_normal_element = "<div></div>"
const only_void_element = '<input>'
const only_selfclosing_element = '<input />'
const only_custom_element = '<me-custom></me-custom>'
const only_namespaced_element = '<test:article></test:article>'
const only_namespaced_custom_element = '<link:me-custom></link:me-custom>'

// @ts-ignore
const testConfig = async (config) => {
  // await is required for this test
  return await prettify(config_html, config)
}

test('Content wrap', () => {
  expect(prettify(content_wrap, { content_wrap: 60 })).toBe(wrapped_content_wrap)
})

test('Content wrap with siblings', () => {
  expect(prettify(content_wrap_siblings, { content_wrap: 60 })).toBe(wrapped_content_wrap_siblings)
})

test('Sole normal element is HTML', () => {
  expect(isHtml(only_normal_element)).toBeTruthy()
})

test('Sole void element is HTML', () => {
  expect(isHtml(only_void_element)).toBeTruthy()
})

test('Sole self-closing element is HTML', () => {
  expect(isHtml(only_selfclosing_element)).toBeTruthy()
})

test('Sole custom element is HTML', () => {
  expect(isHtml(only_custom_element)).toBeTruthy()
})

test('Sole namespaced element is HTML', () => {
  expect(isHtml(only_namespaced_element)).toBeTruthy()
})

test('Sole namespaced custom element is HTML', () => {
  expect(isHtml(only_namespaced_custom_element)).toBeTruthy()
})

test('Trailing plaintext sibling', () => {
  expect(prettify(trailing_plaintext_sibling, { tag_wrap: 80 })).toBe(pretty_trailing_plaintext_sibling)
})

test('Leading plaintext sibling', () => {
  expect(prettify(leading_plaintext_sibling, { tag_wrap: 80 })).toBe(pretty_leading_plaintext_sibling)
})

test('Surrounded plaintext sibling', () => {
  expect(prettify(surrounded_plaintext_sibling)).toBe(pretty_surrounded_plaintext_sibling)
})

test('Heavy plaintext nesting', () => {
  expect(prettify(heavy_plaintext)).toBe(pretty_heavy_plaintext)
})

test('Custom elements with heavy plaintext nesting', () => {
  expect(prettify(custom_heavy_plaintext)).toBe(pretty_custom_heavy_plaintext)
})

test('Trimify', () => {
  expect(trimify(trim_leading_whitespace, ['div'])).toBe('<div>Hello</div>')
  expect(trimify(trim_trailing_whitespace, ['div'])).toBe('<div>Hello</div>')
  expect(prettify(textarea_html)).toBe(
    `<textarea>Did you know that 3 > 2? This is another paragraph.</textarea>
<textarea class="more stuff"></textarea>`
  )
})

test('Prettify', () => {
  expect(prettify(ugly_html, common_config)).toBe(pretty_html)
})

test('Prettify with HTML check', () => {
  expect(prettify('No HTML')).toBe('No HTML')
})

test('Prettify with strict HTML', () => {
  expect(prettify(ugly_html, { ...common_config, strict: true })).toBe(pretty_strict_html)
})

test('Prettify with tag wrap', () => {
  expect(prettify(ugly_html, { ...common_config, tag_wrap: 80 })).toBe(pretty_wrapped_html)
})

test('Prettify with content wrap', () => {
  expect(prettify(ugly_html, { content_wrap: 60 })).toBe(pretty_html)
})

test('Prettify with tag wrap and tab size', () => {
  expect(prettify(ugly_html, { ...common_config, tag_wrap: 80, tab_size: 4 })).toBe(pretty_wrapped_tab4_html)
})

test('Prettify with tag wrap and strict HTML', () => {
  expect(prettify(ugly_html, { ...common_config, strict: true, tag_wrap: 80 })).toBe(pretty_wrapped_strict_html)
})

test('Prettify with empty attributes', () => {
  expect(prettify(empty_attributes_spaces)).toBe(empty_attributes_fixed)
})

test('Standalone tag wrap', () => {
  expect(prettify(standalone_tag_wrap, { tag_wrap: 80 })).toBe(standalone_pretty_tag_wrap)
})

test('Standalone input wrap', () => {
  expect(prettify(standalone_input_wrap, { tag_wrap: 80 })).toBe(standalone_pretty_input_wrap)
})

test('Attribute with html text for value', () => {
  expect(prettify(attribute_with_hyphen)).toBe(attribute_with_hyphen_pretty)
})

test('Tag wrapped attribute with html text for value', () => {
  expect(prettify(attribute_with_hyphen_tag_wrap, { tag_wrap: 80 })).toBe(attribute_with_hyphen_pretty_tag_wrap)
})

test('Void attribute with html text for value', () => {
  expect(prettify(void_attribute_with_hyphen, { strict: true })).toBe(void_attribute_with_hyphen)
})

test('Crazy attribute with html text for value', () => {
  expect(prettify(attribute_with_html_crazy_name)).toBe(attribute_with_html_crazy_name)
})

test('Crazy attribute with html text for value with tag wrap', () => {
  expect(prettify(attribute_with_html_crazy_name_tag_wrap, { tag_wrap: 60 })).toBe(attribute_with_html_crazy_name_pretty_tag_wrap)
})

test('Regular elements with simple nesting', () => {
  expect(prettify(regular_elements_with_simple_nesting)).toBe(regular_elements_pretty_with_simple_nesting)
})

test('Regular elements with nesting', () => {
  expect(prettify(regular_elements_with_nesting)).toBe(regular_elements_pretty_with_nesting)
})

test('Custom elements with simple nesting', () => {
  expect(prettify(custom_elements_with_simple_nesting)).toBe(custom_elements_pretty_with_simple_nesting)
})

test('Custom elements with nesting', () => {
  expect(prettify(custom_elements_with_nesting)).toBe(custom_elements_pretty_with_nesting)
})

test('Custom elements with nesting and tag wrap', () => {
  expect(prettify(custom_elements_with_nesting_tag_wrap, { ...common_config, tag_wrap: 60 })).toBe(custom_elements_pretty_with_nesting_tag_wrap)
})

test('Elements with multiple standalone attributes', () => {
  expect(prettify(elements_with_multiple_standalone_attributes_and_html)).toBe(elements_pretty_with_multiple_standalone_attributes_and_html)
})

test('Elements with multiple standalone attributes and tag wrap', () => {
  expect(prettify(elements_with_multiple_standalone_attributes_and_html, { tag_wrap: 60 })).toBe(elements_pretty_with_multiple_standalone_attributes_and_html_tag_wrap)
})

test('Minify', () => {
  expect(minify(pretty_html)).toBe(
    `<form id="3"><!-- This is a comment. --><!-- This is a second comment. --><label for="email-0">What's your email?</label><input id="email-0" type="email" title="We need your email for verification." name="email" required><!-- This is another comment. --><label for="1">What fruits do you like?</label><fieldset id="1"><input id="fruits-1-0" type="checkbox" name="fruits" value="apples"><label for="fruits-1-0">Apples</label><br><div><!-- This is an embedded comment. --></div><input id="fruits-1-1" type="checkbox" name="fruits" value="grapes"><label for="fruits-1-1">Grapes</label><br></fieldset><br><name:test></name:test><link:test><div>Hello There</div></link:test><custom-element class="hello there world" style="margin-top: 12px; margin-left: 12px;"><div>Goodbye World</div></custom-element></form><link:test>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</link:test><mg-card>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</mg-card>`
  )
})

test('Minify with HTML check', () => {
  expect(minify('No HTML')).toBe('No HTML')
})

test('Minify preserves whitespace in pre, code, and textarea', () => {
  const html_with_pre = `<pre>
  This is preformatted text.
    It should preserve
      all whitespace.
</pre>`
  const html_with_code = `<code>
  const x = 10;
  if (x > 5) {
    console.log('Hello');
  }
</code>`
  const html_with_samp = `<samp>
root
|---- child
      |---- child
</samp>`
  const html_with_kbd = '<kbd>CTRL+C\nCTRL+V</kbd>'
  const html_with_var = '<var>x</var>'
  const html_with_tt = `<tt>Teletype paragraph
text
</tt>`

  expect(minify(html_with_pre, { ignore: [ 'pre' ] })).toBe(html_with_pre)
  expect(minify(html_with_code, { ignore: [ 'code' ] })).toBe(html_with_code)
  expect(minify(html_with_samp, { ignore: [ 'samp' ] })).toBe(html_with_samp)
  expect(minify(html_with_kbd, { ignore: [ 'kbd' ] })).toBe(html_with_kbd)
  expect(minify(html_with_var, { ignore: [ 'var' ] })).toBe(html_with_var)
  expect(minify(html_with_tt, { ignore: [ 'tt' ] })).toBe(html_with_tt)
})

test('Entify', () => {
  expect(entify(textarea_html)).toBe(
    `<   textarea  >&#10;&#10;Did&nbsp;&nbsp;&nbsp;you&nbsp;know&nbsp;that&nbsp;3&nbsp;&gt;&nbsp;&nbsp;&nbsp;2?&#10;&#10;This&nbsp;is&nbsp;another&nbsp;paragraph.&nbsp;&nbsp;&nbsp;&#10;&#10;&#10;</  textarea   ><textarea class="  more  stuff  ">&nbsp;&nbsp;&nbsp;&nbsp;</textarea>`
  )
})

test('Entify with plain text', () => {
  expect(entify('Plain text')).toBe('Plain text')
})

test('Entify with minify', () => {
  expect(entify(textarea_html, true)).toBe(
    `<textarea>&#10;&#10;Did&nbsp;&nbsp;&nbsp;you&nbsp;know&nbsp;that&nbsp;3&nbsp;&gt;&nbsp;&nbsp;&nbsp;2?&#10;&#10;This&nbsp;is&nbsp;another&nbsp;paragraph.&nbsp;&nbsp;&nbsp;&#10;&#10;&#10;</textarea><textarea class="more stuff">&nbsp;&nbsp;&nbsp;&nbsp;</textarea>`
  )
})

test('Closify', () => {
  expect(closify(closify_html)).toBe(
`<form id="3">
<!-- This is a comment. -->
<form id="test"></form>
<!-- This is a second comment. --><br /><input class="hello" /><br /><input /><link:test></link:test></form>`
  )
})

test('Closify with HTML check', () => {
  expect(closify('No HTML')).toBe('No HTML')
})

test('Ignore textarea tag', () => {
  expect(prettify(single_textarea_html, { ignore: [ 'textarea' ]})).toBe(
    `<textarea>

Did   you know that 3 >   2?

This is another paragraph.   


</textarea>`
  )
})

test('Ignore consecutive textarea tags', () => {
  expect(prettify(textarea_html, { ignore: [ 'textarea' ]})).toBe(
    `<textarea>

Did   you know that 3 >   2?

This is another paragraph.   


</textarea>
<textarea class="more stuff">    </textarea>`
  )
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
    <p>This contains &lt;angled&gt; brackets -${CONFIG.ignore_with}gt- and an unfortunate combination of characters</p>
    <input />
    <div></div>
  </div>
</form>`
  )
})

test('Catches invalid ignore config', async () => {
  await expect(testConfig({ ignore: [ 'script', 1 ]})).rejects.toThrow('Ignore config must be an array of strings.')
})

test('Catches invalid ignore_with config', async () => {
  await expect(testConfig({ ignore_with: '_hello_'})).rejects.toThrow('ignore_with cannot start with an underscore.')
})

test('Catches invalid trim config', async () => {
  await expect(testConfig({ trim: [ 'textarea', 1 ]})).rejects.toThrow('Trim config must be an array of strings.')
})
