import { resolve } from "./resolver.js";
import path from 'node:path';

/**
 * Gets a Record of dependencies per file
 * @param {*} inputFilePaths 
 * @param {*} resolver 
 * @returns {Promise<Record<string, string[]>>} record of paths. As soon as the path in key changes, the array of files in the value need to be rebuilt.
 */
export async function getDependencyGraph(inputRootDir, inputFilePaths, resolver) {
  const deps = {};
  for (const inputFilePath of inputFilePaths) {
    if (/\.(md|css|html?)$/.test(inputFilePath)) {
      const content = await (resolver ?? resolve)(path.normalize(path.join(inputRootDir, inputFilePath)));
      if (typeof content !== 'string') {
        continue;
      }
      for (const dependency of inputFilePaths) {
        const baseName = path.parse(dependency).base;
        if (content.includes(baseName)) {
          if (! deps.hasOwnProperty(dependency)) {
            deps[dependency] = []
          }
          deps[dependency].push(inputFilePath);
        }
      }
    }
  }
  return deps;
}
