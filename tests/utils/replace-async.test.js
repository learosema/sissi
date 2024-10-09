import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { replaceAsync } from '../../src/utils/replace-async.js';

describe('replaceAsync', () => {

  it('should do nothing when there is no match', async () => {
    const testString = 'There is no planet B.';

    const result = await replaceAsync(testString, /\{\}/g, () => {
      return Promise.reject('this should not happen');
    });

    assert.equal(result, testString);
  });

  it('should reject when an inner result rejects', async () => {
    const testString = 'Crash {}';
    
    await assert.rejects(async () => {
      await replaceAsync(testString, /\{\}/g, () => Promise.reject(new Error('boom')));
    }, {
      message: 'boom'
    });
  });

  it('should be able to process asynchronous replacements', async () => {
    const replacements = ['life', 'universe', 'rest', '42'];
    
    const result = await replaceAsync('The answer to {0}, {1} and the {2} is {3}.', /\{(\d+)\}/g, (_, x) => {
      const idx = (x|0);
      return Promise.resolve(replacements[idx]);
    });
    assert.equal(result, 'The answer to life, universe and the rest is 42.');
  });

});
