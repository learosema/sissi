---
title: Templating
layout: base.html
---
# {{ title }}

Sissi comes with a basic markdown and html template engine.

## HTML Includes

You can include HTML via the html-include tag. It will fetch the partial HTML snippet from the `_includes` subfolder and inserts it in the right place. This part is heavily inspired by the [Going Buildless approach by Max Böck](https://mxb.dev/blog/buildless/) 

```html
<html-include src="header.html">
```

## Template Data

Sissi supports a "poor girl's handlebars". It looks for expressions wrapped in double curly braces and replaces them with the data accordingly.  More details on this is in the next section about data.

## Built-in filters

- `safe`: do not escape HTML
- `json`: stringify as JSON
- `async`: resolves promises
- `number`: format as number
- `currency`: format as currency
- `limit`: limit an array
- `reverse`: reverse an array

