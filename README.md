# Sissi

Sissi 👸 stands for `Simple Static Site` and is a configuration-free minimalistic static-site generator, inspired by [eleventy](https://11ty.dev), but for an even more minimalistic approach.

This is a silly experiment by [Lea](https://lea.lgbt/@lea). This must be how [Zach](https://zachleat.com/@zachleat) started Eleventy ☺️🎈.

What does it include?

## Configuration API similar to Eleventy

```js
import html from './src/html.js';
import css from './src/css.js';

export default function(config) {
  config.addPlugin(html);
  config.addPlugin(css);
  return {
    dir: {
      input: 'demo',
      output: 'dist'
    }
  }
}
```

## HTML-includes

It comes with a very basic but effective include system, inspired by Max Böcks [zero-build](https://mxb.dev/blog/buildless/) approach:

```html
<html-include src="header.html"/>
```

## CSS Imports

```css
@import 'variables.css';
@import 'layout.css';
```

## What about JS?

Not sure yet :D.

There is an extension system. You could use that to add esbuild support. That part is compatible with eleventy.
Also, You could totally replace the above CSS processor with LightningCSS, for example.

## The Demo

`npm run demo`

