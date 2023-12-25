# htmlfy
HTML formatter yo! Prettify, minify and more!

`htmlfy` is a fork of [html-formatter](https://github.com/uznam8x/html-formatter/tree/master). Most of the processing logic has been preserved, and full credit for that goes to the original author. I've made the following major enhancements.

- Fully typed.
- Converted to ES6.
- Optional "tab" sizes to prettify the HTML.
- A lot of naming changes for functions, etc.

## Install

`npm install htmlfy`

## API

### Prettify
Turn single-line or ugly HTML into highly formatted HTML. This is a wrapper for all other functions, and then it adds indentation.

See [configuration](#configuration) for adjusting the tab size.

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
Turn well-formatted or ugly HTML into a single-line of HTML.

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
Enforce entity characters for textarea content. By default, this performs basic minification on textareas before setting entities. When running this function as a standalone, you'll likely want to pass `minify_content` as `true` for full minification of the textarea. It does not process any other tags.

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

### Default Import
If needed, you can use a default import for `htmlfy`.

```js
import * as htmlfy from 'htmlfy'

console.log(htmlfy.prettify('<main><div>Hello World</div></main'))
```

## Configuration
Default config:
```js
{
  tab_size: 2
}
```

### Tab Size
`prettify` indents text using spaces. If you'd like to custom this, pass a configuration object as the second argument.

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
