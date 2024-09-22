import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readDataDir } from '../src/data.js';
import { SissiConfig } from '../src/sissi-config.js';


describe('readDataDir', () => {
  let config;
  
  before(() => {
    config = new SissiConfig({dir: {
      input: 'tests/fixture',
      data: '_data',
      output: 'dist'
    }});
  })

  it('should read the javascript data', async () => {
    const expectedData = {author: "Lea Rosema"};
    const actual = await readDataDir(config);
    
    assert.deepEqual(actual.jsdata, expectedData);
  });

  it('should read the json data', async () => {
    const expectedData = {author: "Lea Rosema"};
    const actual = await readDataDir(config);
    
    assert.deepEqual(actual.jsondata, expectedData);
  });

  it('should read the yaml data', async () => {
    const expectedData = {author: "Lea Rosema"};
    const actual = await readDataDir(config);
    
    assert.deepEqual(actual.yamldata, expectedData);
  });

});
