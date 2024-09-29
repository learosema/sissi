import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { dataPath, handleTemplateFile, parseArguments, template } from '../../src/transforms/template-data.js';
import { SissiConfig } from '../../src/sissi-config.js';
import md from '../../src/md.js';

const TEST_DATA = {
  'title': 'This is a title',
  'tags': ['html', 'css', 'javascript'],
  'meta': {
    'authors': ['Joe', 'Lea'],
  },
  'theMatrix': [[1,2,3],[4,5,6],[7,8,9]],
  date() {
    return '12.03.2024'
  },
  greet(str) {
    return 'Hello ' + str;
  }
}

const TEST_MD = `---
layout: base.html
author: Lea Rosema
---
# {{ title }}

An article by {{ author }}
`

const TEST_TEMPLATE = `<h1>{{ title }}</h1>
<p>Blog article by {{ meta.authors[1] }}</p>
`

const TEST_TEMPLATE_EXPECTED = `<h1>This is a title</h1>
<p>Blog article by Lea</p>
`

const TEST_TEMPLATE_2 = `{{ date }}`
const TEST_TEMPLATE_EXPECTED_2 = '12.03.2024';

const TEST_TEMPLATE_3 = `{{ greet(meta.authors[1]) }}`
const TEST_TEMPLATE_EXPECTED_3 = 'Hello Lea';

describe('dataPath tests', () => {

  it('creates a function to get data properties', () => {
    assert.equal(dataPath('title')(TEST_DATA), TEST_DATA.title);
  });

  it('creates a function to get an element from an array', () => {
    assert.equal(dataPath('tags[2]')(TEST_DATA), TEST_DATA.tags[2]);
  });

  it('creates a function to get an element from an array inside an object', () => {
    assert.equal(dataPath('meta.authors[1]')(TEST_DATA), TEST_DATA.meta.authors[1]);
  });

  it('creates a function to get an element from a nested array', () => {
    assert.equal(dataPath('theMatrix[1][2]')(TEST_DATA), TEST_DATA.theMatrix[1][2]);
  });

  it('should fail when using an invalid syntax', () => {
    assert.throws(() => dataPath(''));
    assert.throws(() => dataPath('.object[1]'));
    assert.throws(() => dataPath('object[1].'));
    assert.throws(() => dataPath('object.[1]'));
    assert.throws(() => dataPath('object..[1]'));
  });
});

describe('parseArguments function', () => {
  it('should parse argument lists', () => {
    assert.deepEqual(parseArguments('"DE"', {}), ["DE"]);
    assert.deepEqual(parseArguments('12.3, "DE"', {}), [12.3, "DE"]);
  });

  it('should support data path arguments', () => {
    assert.deepEqual(parseArguments('meta.author, 12', {meta:{author:'Lea'}}), ['Lea', 12]);
  });

});

describe('template function', () => {
  it('should insert data into the placeholders wrapped in double curly brackets', () => {
    assert.equal(template(TEST_TEMPLATE)(TEST_DATA), TEST_TEMPLATE_EXPECTED);
  });

  it('should be able to invoke functions', () => {
    assert.equal(template(TEST_TEMPLATE_2)(TEST_DATA), TEST_TEMPLATE_EXPECTED_2);
    assert.equal(template(TEST_TEMPLATE_3)(TEST_DATA), TEST_TEMPLATE_EXPECTED_3);
  });

  it('should be able to apply a filter', () => {
    const filters = new Map();
    filters.set('shout', (str) => (str||'').toUpperCase());
    const result = template('{{greeting | shout }}')({greeting: "Hello"}, filters);
    
    assert.equal(result, "HELLO");
  })
});

describe('handleTemplateFile function', () => {
  it('should work with the default markdown plugin', async () => {
    const config = new SissiConfig();
    config.addExtension(md);

    const vFS = new Map();
    vFS.set('index.md', TEST_MD);
    vFS.set('_layouts/base.html', '<body>{{ content }}</body>');  

    config.resolve = (...paths) => {
      const resource = path.normalize(path.join(...paths));
      return vFS.get(resource);
    }

    const result = await handleTemplateFile(config, {title: 'Lea was here'}, 'index.md');

    assert.equal(result.filename, 'public/index.html');
    assert.equal(result.content, '<body><h1>Lea was here</h1>\n\n<p>An article by Lea Rosema</p>\n</body>')
  });
});
