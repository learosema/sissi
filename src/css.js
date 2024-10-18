import { handleIncludes } from './includes.js';

const INCLUDE_REGEX = /@import [\"\']([\w:\/\\\.\-]+?\.css)[\"\'](?:\s*layer\s*\((\w+)\))?;/g;

export default (config) => {
  config.addTemplateFormats('css');

  config.addExtension('css', {
    outputFileExtension: 'css',
    compile: async function (inputContent, inputPath) {
      return async (data) => {
        return await handleIncludes(
          inputContent, inputPath,
          config, data, null, INCLUDE_REGEX, 
          (context, _, file, layer) => {
            const include = context.includes.get(file);
            if (!include || !include.content) {
              return `@import url("${file}")${layer ?` layer(${layer});`:``};`;
            }
            if (! layer) {
              return include.content;
            }
            return `@layer ${layer} {\n${include.content}\n}`;
          }
        );
      }
    },
  });
};
