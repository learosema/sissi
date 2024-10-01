import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import path from 'node:path';

import { defaultNaming, directoryNaming } from '../src/naming.js';

describe('Default Naming', () => {
  it('should use append-strategy for non-html files', () => {
    const result = defaultNaming('logo.svg');

    assert.equal(result, '/logo.svg');
  });

  it('should still use the append-strategy for html files', () => {
    const result = defaultNaming('imprint.html');

    // imprint.html -> /imprint.html
    assert.equal(result, '/imprint.html');
  });

});



describe('Directory Naming', () => {
  it('should use append-strategy for non-html files', () => {
    const result = directoryNaming('logo.svg');

    assert.equal(result, '/logo.svg');
  });

  it('should use the directory-strategy for html files', () => {
    const result = directoryNaming('test/imprint.html');

    // imprint.html -> /test/imprint/index.html
    assert.equal(result, 
      '/imprint/index.html'
    );
  });

  it('should not use the directory-strategy html files named index.html', () => {
    const result = directoryNaming('/index.html');

    assert.equal(result, '/index.html');
  });

});
