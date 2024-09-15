import path from 'path';

import { defaultResolver } from '../src/resolver.js';

const INCLUDE_REGEX = /<html-include[\s\r\n]*src="([\w\.]+)"[\s\r\n]*\/?>/g;

export default (config) => {
  const resolve = config.resolve || defaultResolver(config);
  config.addTemplateFormats('html');

  config.addExtension('html', {
    outputFileExtension: 'html',
    compile: async function (inputContent, inputPath) {
      
      let parsed = path.parse(inputPath);
      if (parsed.name.startsWith('_')) {
        // Omit files prefixed with an underscore.
        return;
      }
      
      return async () => {
        const includes = new Map();
        const matches = inputContent.matchAll(INCLUDE_REGEX);
        for (const [, file] of matches) {
          
          const fullPath = path.join(config.dir.input, config.dir.includes, file);
          try {
            const content = await resolve(
              path.join(config.dir.input, config.dir.includes, file));
            includes.set(file, content);
          } catch (err) {
            console.error('error processing file:', fullPath, err);
            // silently fail if there is no include
            includes.set(file, `<html-include src="${file}"/>`);
          }
        }   
        return inputContent.replace(INCLUDE_REGEX, (_, file) => {
          return includes.get(file)
        });
      };
    },
  });
};
