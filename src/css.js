import path from 'path';

import { defaultResolver } from './resolver.js';

// TODO: add a regex for layer syntax
const INCLUDE_REGEX = /@import [\"\']([\w:\/\\]+\.css)[\"\'];/g;

export default (config) => {
  const resolve = config.resolve || defaultResolver(config);
  config.addTemplateFormats('css');

  config.addExtension('css', {
    outputFileExtension: 'css',
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
          
          const fullPath = path.join(parsed.dir, file);
          try {
            const content = await resolve(
              fullPath, config);
            includes.set(file, content);
          } catch (err) {
            console.error('error processing file:', fullPath, err);
            // silently fail if there is no include
            includes.set(file, `@import "${file}";`);
          }
        }
                
        return inputContent.replace(INCLUDE_REGEX, (_, file) => includes.get(file)) 
      };
    },
  });
};
