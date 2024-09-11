import { readFile } from 'node:fs/promises'
import path from 'node:path';

export function defaultResolver(config) {
  return async function (resource) {
    if (/^\w+:\/\//.test(resource)) {
      // seems to be an URI, fetch it
      const response = await fetch(resource);
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.startsWith('text')) {
        return await resource.buffer();
      }
      return await resource.text();
    }
    // otherwise, readFile it.
    return await readFile(path.resolve(config.dir.input, resource), 'utf8');
  }
}
