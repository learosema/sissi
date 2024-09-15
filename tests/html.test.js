import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { SissiConfig } from '../src/sissi-config.js';
import html from '../src/html.js'



describe('html plugin', () => {

  let config;

  const virtualFileSystem = new Map();
  virtualFileSystem.set('index.html', [
    `<html-include src="header.html">`,
    `<html-include src="main.html">`,
  ].join('\n'));
  virtualFileSystem.set('_includes/header.html', '<header></header>');
  virtualFileSystem.set('_includes/main.html', '<main></main>');

  function dummyResolver(resource) {
    return virtualFileSystem.get(resource);
  }
  
  before(() => {
    config = new SissiConfig();
    config.resolve = dummyResolver;
    config.addPlugin(html);
  });

  it('should add the HTML processor to the config', () => {
    assert(config.extensions.has('html'));
    assert.equal(config.extensions.get('html').outputFileExtension, 'html');
    assert.equal(typeof config.extensions.get('html').compile, 'function');
  });

  it('should bundle html includes', async () => {
    const expectedFile = [
      virtualFileSystem.get('_includes/header.html'),
      virtualFileSystem.get('_includes/main.html')
    ].join('\n');

    const transform = await config.extensions.get('html').compile(virtualFileSystem.get('index.html'), 'index.html');
    const result = await transform();

    assert.equal(result, expectedFile);
  });

});
