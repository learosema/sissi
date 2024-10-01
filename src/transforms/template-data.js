import path from 'node:path';

import { frontmatter } from './frontmatter.js';
import { resolve } from '../resolver.js';
import { SissiConfig } from "../sissi-config.js";

const TEMPLATE_REGEX = /\{\{\s*([\w\.\[\]]+)(?:\((.*)\))?(?:\s*\|\s([a-zA-Z*]\w*)?(?:\s*\:\s*(.+))?)?\s*\}\}/g;
const JSON_PATH_REGEX = /^[a-zA-Z_]\w*((?:\.\w+)|(?:\[\d+\]))*$/
const JSON_PATH_TOKEN = /(^[a-zA-Z_]\w*)|(\.[a-zA-Z_]\w*)|(\[\d+\])/g

function mergeMaps(map1, map2) {
  return new Map([...map1, ...map2]);
}

function htmlEscape(input) {
  return input?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
 * 
 * @param {string} args a string with a comma separated  
 * @param {any} data data object that is used to fill in data-path parameters
 * @returns 
 */
export function parseArguments(args, data) {
  if (!args) return [];
  return args.trim().split(/\s*,\s*/).map(arg => {
    if (JSON_PATH_REGEX.test(arg)) {
      return dataPath(arg)(data);
    }
    try {
      return JSON.parse(arg)
    } catch (_err) {
      return null;
    }
  });
}

/**
 * Poor girl's handlebars
 * 
 * @param {string} str the template content
 * @returns {(data: any, filters: Map<string, function>) => string} a function that takes a data object and returns the processed template
 */
export function template(str) {
  const defaultFilters = new Map();
  let isSafe = false;
  defaultFilters.set('safe', (input) => { isSafe = true; return input; })
  return (data, providedFilters) => {
    const filters = mergeMaps(defaultFilters || new Map(), providedFilters || new Map())
    return str.replace(TEMPLATE_REGEX, (_, expr, params, filter, filterParams) => {
      let result = dataPath(expr)(data);
      const args = parseArguments(params, data);
      
      if (typeof result === "function") {
        result = result(...args);
      }

      if (filter && filters instanceof Map &&
          filters.has(filter) && typeof filters.get(filter) === 'function') {
        const filterArgs = parseArguments(filterParams, data);
        result = filters.get(filter)(result, ...filterArgs);
      }
      return isSafe ? result : htmlEscape(result);
    });
  }
}

/**
 * Complete Template processing function
 * 
 * @param {SissiConfig} config 
 * @param {any} data 
 * @param {string} inputFile 
 * @returns {Promise<{content: Buffer|string, filename}>} the content file name and the output file name
 */
export async function handleTemplateFile(config, data, inputFile) {
  const content = await (config.resolve || resolve)(config.dir.input, inputFile);
  if (typeof content === "undefined") {
    throw new Error('Not Found');
  }
  if (content === null) {
    return null;
  }
  const parsed = path.parse(inputFile);
  const ext = parsed.ext?.slice(1);
  if (! config.extensions.has(ext)) {
    return {
      content,
      filename: path.normalize(path.join(config.dir.output, config.naming(inputFile)))
    };
  }
  
  const plugin = config.extensions.get(ext);
  const pageUrl = config.naming(inputFile, plugin?.outputFileExtension);
  const absOutputFile = path.join(path.normalize(config.dir.output), pageUrl);

  const page = {
    fileSlug: parsed.name,
    filePathStem: path.join(parsed.dir, parsed.name),
    inputPath: inputFile,
    outputPath: absOutputFile,
    outputFileExtension: plugin.outputFileExtension || 'html',
    rawInput: content
  };
  
  Object.defineProperty(page, 'url', {value: pageUrl, writable: false});
  

  const { data: matterData, body } = frontmatter(content);
  const fileData = Object.assign({}, structuredClone(data), matterData);
  if (fileData.page && typeof fileData.page === 'object') {
    Object.assign(fileData.page, page); 
  } else {
    fileData.page = page;
  }

  const processor = await plugin.compile(body, inputFile);

  let fileContent = template(await processor(fileData))(fileData);

  if (fileData.layout) {
    const layoutFilePath = path.normalize(path.join(config.dir.layouts, fileData.layout));
    const l = await handleTemplateFile(config, 
      {...fileData, content: fileContent, layout: null}, layoutFilePath, true);
    if (l) {
      fileContent = l.content;
    } else {
      throw new Error('Layout not found:' + layoutFilePath);
    }
  }

  return {content: fileContent, filename: page.outputPath};
}

