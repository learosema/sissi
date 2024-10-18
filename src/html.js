import { handleIncludes } from './includes.js';

const INCLUDE_REGEX = /<html-include[\s\r\n]*src="([\w\-\.]+?)"[\s\r\n]*\/?>/g;

export default (config) => {
  config.addTemplateFormats('html');

  config.addExtension('html', {
    outputFileExtension: 'html',
    compile: async function (inputContent, inputPath) {
      return async (data) => {
        return await handleIncludes(
          inputContent, inputPath, 
          config, data, config.dir.includes, 
          INCLUDE_REGEX);
      }
    },
  });
};
