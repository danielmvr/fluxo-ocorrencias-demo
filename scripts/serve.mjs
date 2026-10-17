import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const allowed = new Set(['index.html', 'assets/app.js', 'assets/store.js', 'assets/demo.js', 'assets/data.seed.js', 'assets/styles.css', 'assets/favicon.svg']);
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    if (!allowed.has(relative)) { res.writeHead(404); res.end('Não encontrado'); return; }
    const file = await realpath(path.join(root, relative));
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const contents = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : contents);
  } catch { res.writeHead(404); res.end('Não encontrado'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Rota Demo em http://127.0.0.1:${port}`));
