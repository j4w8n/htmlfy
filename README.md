# htmlfy
HTML formatter yo!

Prettier html, minified html, and a few more goodies.

`htmlfy` is a fork of [html-formatter](https://github.com/uznam8x/html-formatter/tree/master). Some of the processing logic has been preserved, and full credit for that goes to the original author.

I've made the following enhancements:

- Fully typed
- Converted to ESM
- Configuration options
- Support for custom HTML elements (web components)
- Refactoring galore
- Made it go brrr fast

## Install

`npm install htmlfy`

## API

### Prettify
Turn single-line or ugly HTML into highly formatted HTML. You can pass a configuration object as the second argument.

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
Turn well-formatted or ugly HTML into a single line of HTML. You can pass a configuration object as the second argument. This function is called internally when you use `prettify`.

> This feature is not a replacement for compressors like [htmlnano](https://github.com/posthtml/htmlnano), which focus on giving you the smallest data-size possible.

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
A standalone function that ensures [void elements](https://developer.mozilla.org/en-US/docs/Glossary/Void_element) are "self-closing".

```js
import { closify } from 'htmlfy'

const html = `<br><input type="text">`
console.log(closify(html))
/*
<br /><input type="text" />
*/
```

It also normalizes non-void elements which happen to be self-closing for whatever reason.

```js
import { closify } from 'htmlfy'

const html = `<form class="hello" />`
console.log(closify(html))
/*
<form class="hello"></form>
*/
```

### Entify
A standalone function that enforces entity characters for textarea content. You can pass `true ` as the `minify` to minify the tags themselves. Note that this does not run the HTML through the `minify` function.

```js
import { entify } from 'htmlfy'

const html = `<main class="hello   there world"><div>Welcome to htmlfy!  </div></main><textarea  >

Did   you know that 3 >   2?

This is another paragraph.   


</textarea><textarea class="  more  stuff  ">    </textarea>`
console.log(entify(html, true))
/*
<main class="hello   there world"><div>Welcome to htmlfy!  </div></main><textarea>&#10;&#10;Did&nbsp;&nbsp;&nbsp;you&nbsp;know&nbsp;that&nbsp;3&nbsp;&gt;&nbsp;&nbsp;&nbsp;2?&#10;&#10;This&nbsp;is&nbsp;another&nbsp;paragraph.&nbsp;&nbsp;&nbsp;&#10;&#10;&#10;</textarea><textarea class="more stuff">&nbsp;&nbsp;&nbsp;&nbsp;</textarea>
*/
```

### Trimify
A standalone function that trims leading and trailing whitespace for whatever HTML elements you'd like.

```js
import { trimify } from 'htmlfy'

const html = `<div>
Hello    World
</div>`
console.log(trimify(html, ['div']))
/* <div>Hello    World</div> */
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
These configuration options can be passed to `prettify` or `minify`. Note that as of now, only the `ignore` and `ignore_with` are relevant for `minify`.

Default config:
```js
{
  content_wrap: 0,
  ignore: [],
  ignore_with: '_!i-£___£%_',
  strict: false,
  tab_size: 2,
  tag_wrap: 0,
  trim: []
}
```

### Content Wrap
Wrap text content at a certain character-width breakpoint. Default is `0`, which does not wrap.

```js
import { prettify } from 'htmlfy'

const html = '<div>Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.</div>'
console.log(prettify(html, { content_wrap: 40 }))
/*
<div>
  Lorem ipsum dolor sit amet consectetur
  adipiscing elit. Quisque faucibus ex
  sapien vitae pellentesque sem placerat.
  In id cursus mi pretium tellus duis
  convallis.
</div>
*/
```

### Ignore
Tell htmlfy to not process some elements' content and leave them as-is. Note this still minifies the tags themselves.

```js
import { prettify } from 'htmlfy'

const html = `
<main><div>Hello World</div></main>
<style  >
body {
  width: 100
}
</style>`
console.log(prettify(html, { ignore: ['style'] }))
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
You can pass in your own string, for ignoring elements, if the default is actually being used in the elements you want to ignore.

```js
prettify(html, { ignore: ['p'], ignore_with: 'some-string-that-wont-be-in-your-ignored-elements' })
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
Wrap and prettify attributes within opening tags and void elements if they're overall length is above a certain character width. Default is `0`, which does not wrap.

In the below example, the `<input>` element is well over 40 characters long, so it's wrapped and prettified.

```js
import { prettify } from 'htmlfy'

const html = `<form><input id="email-0" type="email" title="We need your email for verification." name="email" required /></form>`
console.log(prettify(html, { tag_wrap: 40 }))
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

### Trim
Trim leading and trailing whitespace within elements. Good for when you are ignoring certain elements, but still want to remove this whitespace.

```js
import { prettify } from 'htmlfy'

const html = '<textarea>    Hello   World    </textarea>'
console.log(prettify(html, { trim: ['textarea'], ignore: ['textarea']}))
/*<textarea>Hello   World</textarea>*/
```
