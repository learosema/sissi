import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { SissiConfig } from '../src/sissi-config.js';
import { defaultResolver } from '../src/resolver.js';

describe('defaultResolver', () => {

  let config = new SissiConfig({
    dir: {
      input: 'demo',
      output: 'dist',
    }
  });

  it('should return a function', () => {
    const resolver = defaultResolver(config);

    assert.equal(typeof resolver, 'function');
  });

  it('should resolve files from the local file system', async () => {
    const resolve = defaultResolver(config);

    const content = await resolve('index.html');
    assert(content.startsWith('<!DOCTYPE html>'));
  });

});
