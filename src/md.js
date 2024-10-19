import { handleIncludes } from './includes.js';
import { markdown } from './transforms/markdown.js';

const INCLUDE_REGEX = /<html-include[\s\r\n]*src="([\w\-\.]+?)"[\s\r\n]*\/?>/g;

export default (config) => {
  config.addTemplateFormats('md');

  config.addExtension('md', {
    outputFileExtension: 'html',
    compile: async function (inputContent, inputPath) {
      
      return async (data) => {
        return await handleIncludes(
          markdown(inputContent), inputPath, 
          config, data, config.dir.includes, 
          INCLUDE_REGEX);
      };
    },
  });
};
