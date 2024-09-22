import { describe, it, mock, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { SissiConfig } from '../src/sissi-config.js';
import { resolve } from '../src/resolver.js';


describe('resolve', () => {

  let config;
  
  before(() => {
    config = new SissiConfig({
      dir: {
        input: 'demo',
        output: 'dist',
      }
    });    
  });

  it('should resolve files from the local file system', async () => {
    const content = await resolve(path.join(config.dir.input, 'index.html'));
    assert(content.startsWith('<!DOCTYPE html>'));
  });

  it('should fetch stuff from the internet', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      const headers = new Map();
      headers.set('Content-Type', 'text/css');
      
      return ({
        headers,
        async text() {return ':where(html){}'}
      })
    });

    const content = await resolve('https://unpkg.com/open-props@1.7.6/open-props.min.css');
    assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
    assert(content.startsWith(':where'));

    globalThis.fetch = originalFetch;
  });

});
