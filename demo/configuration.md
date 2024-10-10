---
title: Welcome to Sissi
layout: base.html
---
# {{ title }}

Right now there's not too much to configure. Specify an input dir, specify an output dir:

```js
export default function(config) {
  // You can add plugins via config.addPlugin here
  // config.addPlugin(html);
  return {
    dir: {
      input: 'demo',
      output: 'dist'
    }
  }
}
```
