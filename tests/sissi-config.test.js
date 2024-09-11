import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { SissiConfig } from "../src/sissi-config.js";

describe('SissiConfig', () => {
  it('should provide some default options', () => {
    const config = new SissiConfig();

    assert(typeof config.dir.input === 'string');
    assert(typeof config.dir.output === 'string');
  });
});
