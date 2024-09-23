import path from 'path';
import { handleTemplateFile } from './transforms/template-data.js';

const INCLUDE_REGEX = /<html-include[\s\r\n]*src="([\w\-\.]+)"[\s\r\n]*\/?>/g;

export default (config) => {
  config.addTemplateFormats('html');

  config.addExtension('html', {
    outputFileExtension: 'html',
    compile: async function (inputContent, inputPath) {
      
      let parsed = path.parse(inputPath);
      
      return async (data) => {
        const includes = new Map();
        let content = inputContent, matches;

        while ((matches = Array.from(content.matchAll(INCLUDE_REGEX))).length > 0) {
          for (const [, file] of matches) {
            const include = await handleTemplateFile(config, data, path.join(config.dir.includes, file));
            includes.set(file, include ? include.content : `<!-- html-include src="${file}" -->`);
          }
          content = content.replace(INCLUDE_REGEX, (_, file) => {
            return includes.get(file)
          });
        }
        return content;
      };
    },
  });
};
