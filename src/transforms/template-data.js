import path from 'node:path';

import { frontmatter } from './frontmatter.js';
import { resolve } from '../resolver.js';
import { SissiConfig } from "../sissi-config.js";

const TEMPLATE_REGEX = /\{\{\s*([\w\.\[\]]+)\s*\}\}/g;
const JSON_PATH_REGEX = /^\w+((?:\.\w+)|(?:\[\d+\]))*$/
const JSON_PATH_TOKEN = /(^\w+)|(\.\w+)|(\[\d+\])/g

/**
 * Poor girl's jsonpath
 * 
 * @param {string} path 
 * @returns {(data:any) => any} a function that returns the specified property
 */
export function dataPath(path) {
  if (JSON_PATH_REGEX.test(path) === false) {
    throw new Error('invalid json path: ' + path);
  }
  const matches = Array.from(path.match(JSON_PATH_TOKEN)).map(
    m => JSON.parse(m.replace(/(^\.)|\[|\]/g, '').replace(/^([a-zA-Z]\w+)$/, '"$1"'))
  );
  return (data) => {
    let result = data;
    for (const match of matches) {
      result = result[match];
      if (! result) {
        return result;
      }
    }
    return result;
  }
}

/**
 * Poor girl's handlebars
 * 
 * @param {string} str the template content
 * @returns {(data: any) => string} a function that takes a data object and returns the processed template
 */
export function template(str) {
  return (data) => {
    return str.replace(TEMPLATE_REGEX, (_, expr) => {
      const result = dataPath(expr)(data);
      return dataPath(expr)(data)
    });
  }
}

/**
 * Complete Template processing function
 * @param {SissiConfig} config 
 * @param {any} data 
 * @param {string} inputFile 
 * @returns {Promise<{content: Buffer|string, filename}>} the content file name and the output file name
 */
export async function handleTemplateFile(config, data, inputFile) {
  const content = await (config.resolve || resolve)(config.dir.input, inputFile);
  if (content === null) {
    return null;
  } 

  const parsed = path.parse(inputFile);
  const ext = parsed.ext?.slice(1);
  if (! config.extensions.has(ext)) {
    return {
      content,
      filename: config.naming(config.dir.output, inputFile)
    };
  }
  
  const plugin = config.extensions.get(ext);

  const { data: matterData, body } = frontmatter(content);
  const fileData = Object.assign({}, structuredClone(data), matterData);
  
  const outputFile = config.naming(config.dir.output, inputFile, plugin?.outputFileExtension);
  Object.assign(fileData, {
    inputFile,
    outputFile,
  })
  
  const processor = await plugin.compile(body, inputFile);

  let fileContent = template(await processor(fileData))(fileData);

  if (fileData.layout) {
    const layoutFilePath = path.normalize(path.join(config.dir.layouts, fileData.layout));
    const l = await handleTemplateFile(config, 
      {...fileData, content: fileContent, layout: null}, layoutFilePath);
    fileContent = l.content;
  }

  return {content: fileContent, filename: outputFile};
}
