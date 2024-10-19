import EventEmitter from 'events';
import { readFile } from 'fs';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

import { getMime } from './mimes.js'

const DEVSERVER_JS = `
const eventSource = new EventSource('/_dev-events');
window.addEventListener('beforeunload', () => eventSource.close(), false);
eventSource.addEventListener('message', (e) => {
  const events = JSON.parse(e.data);
  for (const event of events) {
    if (event.filename.endsWith('.html') || document.location.href === event.page.url) {
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
  req.on('close', () => { 
    eventEmitter.off('watch-event', watchListener);
    res.end();
  });
}

export function serve(eventEmitter = null, wwwRoot = 'dist', listenOptions) {
  return new Promise((resolve) => {
    const host = listenOptions?.host ?? process.env.HOST ?? 'localhost';
    const port = listenOptions?.port ?? parseInt(process.env.PORT ?? '8000', 10);
    const server = createServer((req, res) => {
      const url = new URL(`http://${host}${port !== 80?`:${port}`:''}${req.url}`);
      const { send, sendError } = sendFactory(req, res);
      if (eventEmitter && url.pathname === '/_dev-events') {
        serverSentEvents(req, res, eventEmitter);
        return;
      }
      if (url.pathname === '/_dev-events.js') {
        send(200, DEVSERVER_JS, 'text/javascript');
        return;
      }
      const dir = path.resolve(process.cwd(), wwwRoot);
      const resourcePath = path.normalize(url.pathname + (url.pathname.endsWith('/') ? 'index.html' : ''));
      if (resourcePath.split('/').includes('..')) {
        sendError(404, 'Not Found');
        return;
      }
      const filePath = path.join(dir, path.normalize(resourcePath));
      if (! filePath.startsWith(dir)) {
        sendError(404, 'Not Found');
        return;
      }
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
    });
    server.listen({port, host, ...(listenOptions ?? {})}, () => {
      console.log(`[http]\tServer listening on http://${host}:${port}/`);
      resolve(server);
    });
  });
}
