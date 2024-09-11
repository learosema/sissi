import { readFile } from 'fs';
import { createServer, ServerResponse } from 'http';
import path from 'node:path';

function getMime(url) {
  if (/\.html?$/.test(url)) return 'text/html';
  if (/\.css$/.test(url)) return 'text/css';
  if (/\.gif$/.test(url)) return 'image/gif';
  if (/\.png$/.test(url)) return 'image/png';
  if (/\.webp$/.test(url)) return 'image/webp';
  if (/\.jpe?g$/.test(url)) return 'image/jpeg';
  if (/\.svg$/.test(url)) return 'image/svg+xml';
  if (/\.xml$/.test(url)) return 'text/xml';
  if (/\.js$/.test(url)) return 'text/javascript';
  if (/\.json$/.test(url)) return 'application/json';
  if (/\.midi?$/.test(url)) return 'audio/midi';
  if (/\.ico$/.test(url)) return 'image/vnd.microsoft.icon';
  return 'application/octet-stream' 
}

function sendFactory(req, res) {
  const send = (code, content, mimetype = 'text/html') => {
    console.log(`[http]\t (${code}) ${req.method} ${req.url}`);
    res.writeHead(code, { 'Content-Type': mimetype });
    res.end(content);
  }
  
  const sendError = (code, message) => send(code, `${code} ${message}`);
  return { send, sendError };  
}

export function serve(wwwRoot = 'dist') {
  console.log('[http]\tServer listening on http://localhost:8000/');
  createServer((req, res) => {
    const { send, sendError } = sendFactory(req, res);

    const dir = path.resolve(process.cwd(), wwwRoot);
    const resourcePath = path.normalize(req.url + (req.url.endsWith('/') ? 'index.html' : ''));
    if (resourcePath.split('/').includes('..')) {
      sendError(404, 'Not Found');
      return;
    }
    const filePath = path.join(dir, resourcePath);
    readFile(filePath, (err, data) => {
      if (err) {
        sendError(404, 'Not Found');
        return;
      }
      send(200, data, getMime(resourcePath));
    });
  }).listen(8000);
}
