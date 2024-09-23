import path from 'path';

import { handleTemplateFile } from './transforms/template-data.js';
import { markdown } from './transforms/markdown.js';

const INCLUDE_REGEX = /<html-include[\s\r\n]*src="([\w\.]+)"[\s\r\n]*\/?>/g;

export default (config) => {
  config.addTemplateFormats('md');

  config.addExtension('md', {
    outputFileExtension: 'html',
    compile: async function (inputContent, inputPath) {
      
      return async (data) => {
        const includes = new Map();
        const content = markdown(inputContent);
        const matches = content.matchAll(INCLUDE_REGEX);
        for (const [, file] of matches) {
          const include = await handleTemplateFile(config, data, path.join(config.dir.includes, file));
          includes.set(file, include ? include.content : `<!-- html-include src="${file}" -->`);
        }   
        return content.replace(INCLUDE_REGEX, (_, file) => {
          return includes.get(file)
        });
      };
    },
  });
};
