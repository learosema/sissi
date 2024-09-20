import { readFile } from 'node:fs/promises'
import path from 'node:path';

export async function resolve(resource) {
  if (/^\w+:\/\//.test(resource)) {
    // seems to be an URI, fetch it
    const response = await fetch(resource);
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('text')) {
      return await response.buffer();
    }
    return await response.text();
  }
  // otherwise, readFile it.
  return await readFile(path.resolve(resource), 'utf8');
}
