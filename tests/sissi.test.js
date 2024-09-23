import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SissiConfig } from '../src/sissi-config.js';
import { Sissi } from '../src/sissi.js';

import html from '../src/html.js';
import css from '../src/css.js';

describe('sissi', () => {

  it('should successfully build a smallsite', async () => {


    const config = new SissiConfig({
      dir: {
        input: 'tests/fixtures/smallsite',
        output: ''
      }
    });
    config.addPlugin(html);
    config.addPlugin(css);
    const sissi = new Sissi(config);
    sissi.dryMode = true;
    
    const writtenFiles = await sissi.build();

    writtenFiles.sort();

    assert.deepEqual(writtenFiles, 
      ['css/styles.css', 'imprint.html', 'index.html', 'test.html']
    );
  });
});
