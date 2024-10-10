import { readFile, stat } from 'node:fs/promises'
import path from 'node:path';
import { getMime } from './mimes.js';

/**
 * Read a file from the input dir or from the internet.
 * @param {string[]} paths
 * @returns 
 */
export async function resolve(...paths) {
  const last = paths.slice(-1)[0];
  if (/^\w+:\/\//.test(last)) {
    // seems to be an URL, fetch it
    const resource = last;
    const response = await fetch(resource);
    if (response.status >= 400) {
      throw new Error('Not Found');
    }
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('text')) {
      return await response.buffer();
    }
    return await response.text();
  }
  
  // otherwise, readFile it.
  const resource = path.normalize(path.join(...paths));
  const absResource = path.resolve(resource);
  if ((await stat(absResource)).isDirectory()) {
    return null;
  }
  const contentType = getMime(resource);
  const isText = contentType.startsWith('text/') || contentType.endsWith('+xml');
  return await readFile(absResource, isText ? 'utf8' : null);
}
