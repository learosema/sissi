import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import path from 'node:path';

import { defaultNaming, directoryNaming } from '../src/naming.js';

describe('Default Naming', () => {
  it('should use append-strategy for non-html files', () => {
    const result = defaultNaming('test', 'logo.svg');

    assert(result === ['test', 'logo.svg'].join(path.sep));
  });

  it('should still use the append-strategy for html files', () => {
    const result = defaultNaming('test', 'imprint.html');

    // imprint.html -> test/imprint/index.html
    assert.equal(result, ['test', 'imprint.html'].join(path.sep));
  });

});



describe('Directory Naming', () => {
  it('should use append-strategy for non-html files', () => {
    const result = directoryNaming('test', 'logo.svg');

    assert.equal(result, ['test', 'logo.svg'].join(path.sep));
  });

  it('should use the directory-strategy for html files', () => {
    const result = directoryNaming('test', 'imprint.html');

    // imprint.html -> test/imprint/index.html
    assert.equal(result, ['test', 'imprint', 'index.html'].join(path.sep));
  });

  it('should not use the directory-strategy html files named index.html', () => {
    const result = directoryNaming('test', 'index.html');

    assert.equal(result, ['test', 'index.html'].join(path.sep));
  });

});
