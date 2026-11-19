import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const port = Number(process.env.PORT || 4000);
const target = new URL(process.env.API_PROXY_TARGET || 'http://127.0.0.1:4001');
if (target.protocol !== 'http:') throw new Error('Preview proxy supports a local HTTP backend only.');
const page = await readFile(resolve(process.cwd(), 'preview/index.html'));
http.createServer((req, res) => {
  if (/^\/api(?:\/|\?|$)/.test(req.url || '')) {
    const proxy = http.request({ hostname: target.hostname, port: target.port || 80, path: req.url, method: req.method, headers: { ...req.headers, host: target.host } }, upstream => {
      res.writeHead(upstream.statusCode || 502, upstream.headers); upstream.pipe(res);
    });
    proxy.on('error', () => { if (!res.headersSent) res.writeHead(502, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify({ error:{ code:'API_UNAVAILABLE', message:'Account services are unavailable.'} })); });
    req.pipe(proxy); return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(req.method === 'HEAD' ? undefined : page);
}).listen(port, '0.0.0.0', () => console.log(`Self-contained website preview listening on port ${port}`));
