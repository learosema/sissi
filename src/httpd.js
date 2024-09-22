import EventEmitter from 'events';
import { readFile } from 'fs';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import path from 'node:path';
import url from "node:url";

const SSE_POOL = [];

const DEVSERVER_JS = `
const eventSource = new EventSource('/_dev-events');
eventSource.addEventListener('message', (e) => {
  const events = JSON.parse(e.data);
  for (const event of events) {
    if (event.filename.endsWith('.html')) {
      document.location.reload();
    }
    if (event.filename.endsWith('.css')) {
      document.querySelectorAll('link[rel="stylesheet"]:not([data-remove])').forEach(link => {
        const [href, query] = link.getAttribute('href').split('?')
        const params = new URLSearchParams(query);
        params.set('time', new Date().getTime().toString());
        const newLink = link.cloneNode();
        newLink.setAttribute('href', href + '?' + params.toString());
        link.setAttribute('data-remove', '1');
        document.head.insertBefore(newLink, link);
        window.setTimeout(() => link.remove(), 50);
      });
    }
  }
});
`

function getMime(path) {
  if (/\.html?$/.test(path)) return 'text/html';
  if (/\.css$/.test(path)) return 'text/css';
  if (/\.gif$/.test(path)) return 'image/gif';
  if (/\.png$/.test(path)) return 'image/png';
  if (/\.webp$/.test(path)) return 'image/webp';
  if (/\.jpe?g$/.test(path)) return 'image/jpeg';
  if (/\.svg$/.test(path)) return 'image/svg+xml';
  if (/\.xml$/.test(path)) return 'text/xml';
  if (/\.js$/.test(path)) return 'text/javascript';
  if (/\.json$/.test(path)) return 'application/json';
  if (/\.midi?$/.test(path)) return 'audio/midi';
  if (/\.ico$/.test(path)) return 'image/vnd.microsoft.icon';
  return 'application/octet-stream' 
}

function sendFactory(req, res) {
  const send = (code, content, mimetype = 'text/html') => {
    console.log(`[http]\t (${code}) ${req.method} ${req.url}`);
    res.writeHead(code, { 'Content-Type': mimetype, 'Cache-Control': 'no-cache' });
    res.end(content);
  }
  const sendError = (code, message) => send(code, `${code} ${message}`);
  return { send, sendError };  
}

/**
 * Server-sent Events endpoint from the dev server. 
 * Notifies the browser about file changes
 * 
 * @param {ServerResponse<IncomingMessage>} res 
 * @param {EventEmitter} eventEmitter 
 */
function serverSentEvents(req, res, eventEmitter) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  const watchListener = (...payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }
  
  eventEmitter.on('watch-event', watchListener);
  req.on('close', () => eventEmitter.off('watch-event', watchListener));
}

export function serve(eventEmitter = null, wwwRoot = 'dist') {
  const port = process.env.PORT || 8000;
  console.log(`[http]\tServer listening on http://localhost:${port}/`);
  createServer((req, res) => {
    const uri = url.parse(req.url).pathname;
    const { send, sendError } = sendFactory(req, res);
    if (eventEmitter && uri === '/_dev-events') {
      serverSentEvents(req, res, eventEmitter);
      return;
    }
    if (uri === '/_dev-events.js') {
      send(200, DEVSERVER_JS, 'text/javascript');
      return;
    }
    const dir = path.resolve(process.cwd(), wwwRoot);
    const resourcePath = path.normalize(uri + (uri.endsWith('/') ? 'index.html' : ''));
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
      const mime = getMime(resourcePath);
      if (data && mime === 'text/html') {
        send(200, data.toString().replace('</body>', '<script src="/_dev-events.js"></script></body>'), mime);
        return;
      }
      send(200, data, mime);
    });
  }).listen(port);
}
