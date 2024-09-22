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
