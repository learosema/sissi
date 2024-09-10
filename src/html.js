import { readFile } from 'fs/promises';
import path from 'path';

const INCLUDE_REGEX = /<html-include[\s\r\n]*src="(\w+\.\w+)"[\s\r\n]*\/?>/g;

export default (config) => {
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
            const content = await readFile(
              path.join(config.dir.input, config.dir.includes, file), 'utf8');
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
