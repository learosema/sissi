---
title: All about Data
layout: base.html
---

# All about Data

## Data Cascade

### Data provided by Sissi

### The `_data` subdirectory

### The Frontmatter

## Using data inside templates

Sissi supports a "poor girl's handlebars". It looks for expressions wrapped in double curly braces and replaces them with the data accordingly. If the data is resolved as a function, a parameterless function call will be invoked. If the data results a Promise, it is automatically resolved.

If you place a javascript file named `meta.js` in your _data directory which provides a default export, you can access the object like this:

```js
export default {
  author: 'Lea'
};
```

```html
{\{ meta.author }\}
```

Alternatively, you can put json or yaml into the data directory.

