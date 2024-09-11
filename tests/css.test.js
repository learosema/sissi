import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { SissiConfig } from '../src/sissi-config.js';
import css from '../src/css.js'



describe('css plugin', () => {

  let config;

  const virtualFileSystem = new Map();
  virtualFileSystem.set('styles.css', [
    `@import "A.css";`,
    `@import "B.css";`,
  ].join('\n'));
  virtualFileSystem.set('A.css', '.a {color: red; }');
  virtualFileSystem.set('B.css', '.b {color: green }');

  function dummyResolver(resource) {
    const match = resource.match(/\\?\/?(\w+.css)$/);
    if (!match || !virtualFileSystem.has(match[1]) ) {
      throw new Error('Virtual File not found')
    }
    const file = match[1];
    return virtualFileSystem.get(file);
  }
  
  before(() => {
    config = new SissiConfig();
    config.resolve = dummyResolver;
    config.addPlugin(css);
  });

  it('should add the CSS processor to the config extension', () => {
    assert(config.extensions.has('css'));
    assert(config.extensions.get('css').outputFileExtension === 'css');
    assert(typeof config.extensions.get('css').compile === 'function');
  });

  it('should bundle css assets', async () => {
    const expectedFile = [
      virtualFileSystem.get('A.css'),
      virtualFileSystem.get('B.css')
    ].join('\n');

    const transform = await config.extensions.get('css').compile(virtualFileSystem.get('styles.css'), 'styles.css');
    const result = await transform();

    assert(result === expectedFile);
  });

});