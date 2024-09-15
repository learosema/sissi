import path from 'node:path';

import { SissiConfig } from "./sissi-config";
import { readdir, readFile } from 'node:fs/promises';
import { smolYAML } from './transforms/smolyaml';

/**
 * read contents of the data dir into an object
 * 
 * @param {SissiConfig} config 
 */
export async function readDataDir(config) {
  const relativeDataDir = path.normalize(path.join(config.dir.input, config.dir.data));
  if (relativeDataDir.startsWith('..')) {
    throw new Error('the data dir should not be above the input dir')
  }
  const dataDir = path.resolve(relativeDataDir);
  const files = await readdir(path.normalize(dataDir), {recursive: true});
  const result = {}
  for (const dataFilePath of files) {
    const pathInfo = path.parse(dataFilePath);
    if (pathInfo.ext === '.js') {
      result[pathInfo.name] = await import(dataFilePath);
    }
    if (pathInfo.ext === '.json') {
      result[pathInfo.name] = JSON.parse(await readFile(dataFilePath, 
        'utf8'
      ));
    }
    if (pathInfo.ext === '.yaml') {
      result[pathInfo.name] = smolYAML(await readFile(dataFilePath, 'utf8'));
    }
  }
  return result;
}

