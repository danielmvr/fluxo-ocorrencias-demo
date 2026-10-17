import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const siteFiles = ['index.html', 'assets/app.js', 'assets/store.js', 'assets/demo.js', 'assets/data.seed.js', 'assets/styles.css', 'assets/favicon.svg'];
const ignored = new Set(['.git', '.site', 'release', 'node_modules']);
const topAllowed = new Set(['assets', 'docs', 'scripts', 'tests', '.github', 'index.html', 'README.md', 'package.json', 'package-lock.json', '.gitignore', '.nojekyll']);
export async function files(directory = root) {
  let result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if ((await lstat(absolute)).isSymbolicLink()) throw new Error('Links simbólicos não são permitidos no pacote.');
    if (entry.isDirectory()) result.push(...await files(absolute));
    else result.push(path.relative(root, absolute).split(path.sep).join('/'));
  }
  return result.sort();
}
export async function audit() {
  const errors = [];
  const list = await files();
  for (const file of list) {
    if (!topAllowed.has(file.split('/')[0])) errors.push(`Arquivo fora da seleção de publicação: ${file}`);
    if (/(\.env|\.exe|\.kmz|\.xls|\.pyc|\.log|\.pdf)$/i.test(file)) errors.push(`Formato não permitido: ${file}`);
    if (!/\.(html|js|mjs|css|json|md|yml|svg)$/.test(file)) continue;
    const text = await readFile(path.join(root, file), 'utf8');
    if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.|\bgh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) errors.push(`Possível segredo em ${file}`);
    if (siteFiles.includes(file) && /https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(text)) errors.push(`URL externa no aplicativo: ${file}`);
    if (siteFiles.includes(file) && /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|\bsendBeacon\s*\(|supabase|ponteUrl|WHATSAPP_CONFIG/i.test(text)) errors.push(`Integração de rede no aplicativo: ${file}`);
  }
  for (const file of siteFiles) if (!list.includes(file)) errors.push(`Falta arquivo do site: ${file}`);
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  if (!html.includes("connect-src 'none'")) errors.push('Falta bloqueio de conexões na CSP.');
  if (errors.length) throw new Error(errors.join('\n'));
  return list;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const list = await audit(); console.log(`Auditoria estrutural aprovada: ${list.length} arquivos; aplicativo sem URLs externas, clientes de rede ou padrões de segredo detectados.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
