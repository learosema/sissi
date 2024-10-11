import path from 'path';

import { handleTemplateFile } from './transforms/template-data.js';

const INCLUDE_REGEX = /@import [\"\']([\w:\/\\\.\-]+?\.css)[\"\'](?:\s*layer\s*\((\w+)\))?;/g;

export default (config) => {
  config.addTemplateFormats('css');

  config.addExtension('css', {
    outputFileExtension: 'css',
    compile: async function (inputContent, inputPath) {
      let parsed = path.parse(inputPath);

      return async (data) => {
        const includes = new Map();
        const matches = inputContent.matchAll(INCLUDE_REGEX);
        for (const [, file, layer] of matches) {
          const tpl = await handleTemplateFile(config, data, path.join(parsed.dir, file));
          if (layer) {
            includes.set(file, tpl ? `@layer ${layer} {\n${tpl.content}\n}` : `@import url("${file}") layer(${layer});`);
            continue;
          }
          includes.set(file, tpl ? tpl.content : `@import url("${file}");`);
        }
        return inputContent.replace(INCLUDE_REGEX, (_, file) => includes.get(file)) 
      };
    },
  });
};
