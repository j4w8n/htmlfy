# htmlfy
HTML formatter yo! Prettify, minify and more!

`htmlfy` is a fork of [html-formatter](https://github.com/uznam8x/html-formatter/tree/master). Most of the processing logic has been preserved, and full credit for that goes to the original author. I've made the following major enhancements.

- Fully typed.
- Converted to ESM.
- Added configuration options.
- Added support for custom HTML elements (web components)
- Lots of refactoring.
- Improved some of the processing logic.

## Install

`npm install htmlfy`

## API
Most projects will only need to use `prettify` and/or `minify`.

### Prettify
Turn single-line or ugly HTML into highly formatted HTML. This is a wrapper for all other functions, except `trimify`, and then it adds indentation.

```js
import { prettify } from 'htmlfy'

const html = `<main class="hello   there world"><div>Welcome to htmlfy!  </div></main>`
console.log(prettify(html))
/*
<main class="hello there world">
  <div>
    Welcome to htmlfy!
  </div>
</main>
*/
```

### Minify
Turn well-formatted or ugly HTML into a single line of HTML.

> This feature is not a replacement for compressors like [htmlnano](https://github.com/posthtml/htmlnano), which focus on giving you the smallest data-size possible; but rather, it simply removes tabs, returns, and redundant whitespace.

```js
import { minify } from 'htmlfy'

const html = 
`<main class="hello there world">
  <div>
    Welcome to htmlfy!
  </div>
</main>`
console.log(minify(html))
/*
<main class="hello there world"><div>Welcome to htmlfy!</div></main>
*/
```

### Closify
> This is done when using prettify, but you can use it in a one-off scenario if needed.

Ensure [void elements](https://developer.mozilla.org/en-US/docs/Glossary/Void_element) are "self-closing".

```js
import { closify } from 'htmlfy'

const html = `<br><input type="text">`
console.log(closify(html))
/*
<br /><input type="text" />
*/
```

### Entify
> This is done when using prettify, but you can use it in a one-off scenario if needed.

Enforce entity characters for textarea content. This also performs basic minification on textareas before setting entities. When running this function as a standalone, you'll likely want to pass `minify` as `true` for full minification of the textarea. The minification does not process any other tags.

```js
import { entify } from 'htmlfy'

const html = `<main class="hello   there world"><div>Welcome to htmlfy!  </div></main><textarea  >

Did   you know that 3 >   2?

This is another paragraph.   


</textarea><textarea class="  more  stuff  ">    </textarea>`
console.log(entify(html, true))
/*
<main class="hello   there world"><div>Welcome to htmlfy!  </div></main><textarea>Did you know that 3 &gt; 2?&#13;&#13;This is another paragraph.</textarea><textarea class="more stuff"></textarea>
*/
```

### Trimify
Trim leading and trailing whitespace for whatever HTML element(s) you'd like. This is a standalone function, which is not run with `prettify` by default.

```js
import { trimify } from 'htmlfy'

const html = `<div>
Hello World
</div>`
console.log(trimify(html, [ 'div' ]))
/* <div>Hello World</div> */
```

### Default Import
If needed, you can use a default import for `htmlfy`.

```js
import * as htmlfy from 'htmlfy'

console.log(htmlfy.prettify('<main><div>Hello World</div></main'))
```

### Common JS Import
Although meant to be an ESM module, you can import using `require`.

```js
const { prettify } = require('htmlfy')
```

## Configuration
These configuration options can only be passed to `prettify`.

Default config:
```js
{
  ignore: [],
  ignore_with: '_!i-£___£%_',
  strict: false,
  tab_size: 2,
  tag_wrap: false,
  tag_wrap_width: 80,
  trim: []
}
```

### Ignore
Tell htmlfy to not process some elements and leave them as-is.

```js
import { prettify } from 'htmlfy'

const html = `
<main><div>Hello World</div></main>
<style>
body {
  width: 100
}
</style>`
console.log(prettify(html, { ignore: [ 'style' ] }))
/*
<main>
  <div>
    Hello World
  </div>
</main>
<style>
body {
  width: 100;
}
</style>
*/
```

### Ignore With
You can pass in your own string, for ignoring elements, if the default is actually being used in your ignored elements.

```js
prettify(html, { ignore: [ 'p' ], ignore_with: 'some-string-that-wont-be-in-your-ignored-elements' })
```

### Strict
If set to `true`, removes comments and ensures void elements are not self-closing.

```js
import { prettify } from 'htmlfy'

const html = `<main><br /><div><!-- Hello World --></div></main>`
console.log(prettify(html, { strict: true }))
/*
<main>
  <br>
  <div></div>
</main>
*/
```

### Tab Size
Determines the number of spaces, per tab, for indentation. For sanity reasons, the valid range is between 1 and 16.

```js
import { prettify } from 'htmlfy'

const html = `<main class="hello   there world"><div>Welcome to htmlfy!  </div></main>`
console.log(prettify(html, { tab_size: 4 }))
/*
<main class="hello there world">
    <div>
        Welcome to htmlfy!
    </div>
</main>
*/
```

### Tag Wrap
Wrap attributes within opening tags and void elements if they're greater than `tag_wrap_width`. Default is `false`.

```js
import { prettify } from 'htmlfy'

const html = `<form><input id="email-0" type="email" title="We need your email for verification." name="email" required /></form>`
console.log(prettify(html, { tag_wrap: true }))
/*
<form>
  <input
    id="email-0"
    type="email"
    title="We need your email for verification."
    name="email"
    required
  />
</form>
*/
```

### Tag Wrap Width
If an opening tag or void element's character width is larger than this number, and `tag_wrap` is set to `true`, attributes will be wrapped (aka prettified). Default is `80`.

### Trim
Trim leading and trailing whitespace within `textarea` elements, since all whitespace is preserved by default.

```js
import { prettify } from 'htmlfy'

const html = '<textarea>    Hello World    </textarea>'
console.log(prettify(html, { trim: [ 'textarea' ]}))
/*<textarea>Hello&nbsp;World</textarea>*/
```

> For compatibility and possible future expansion, we require declaring an array with the value 'textarea', as opposed to using something like `{ trim: true }`. Passing in additional HTML element values has no real effect, since we already trim whitespace for all other elements.
