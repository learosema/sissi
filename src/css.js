import path from 'path';

import { handleTemplateFile } from './transforms/template-data.js';

// TODO: add a regex for layer syntax
const INCLUDE_REGEX = /@import [\"\']([\w:\/\\]+\.css)[\"\'];/g;

export default (config) => {
  config.addTemplateFormats('css');

  config.addExtension('css', {
    outputFileExtension: 'css',
    compile: async function (inputContent, inputPath) {
      let parsed = path.parse(inputPath);

      return async (data) => {
        const includes = new Map();
        const matches = inputContent.matchAll(INCLUDE_REGEX);
        for (const [, file] of matches) {
          const tpl = await handleTemplateFile(config, data, path.join(parsed.dir, file));
          includes.set(file, tpl ? tpl.content : `@import url("${file}");`);
        }
        return inputContent.replace(INCLUDE_REGEX, (_, file) => includes.get(file)) 
      };
    },
  });
};
