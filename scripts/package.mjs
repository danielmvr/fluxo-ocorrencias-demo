import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, audit } from './audit.mjs';

// ZIP sem dependências: entradas armazenadas, CRC32 e diretório central padrão.
const testFiles = (await readdir(path.join(root, 'tests'))).filter(f => f.endsWith('.test.mjs')).map(f => path.join(root, 'tests', f));
if (!testFiles.length) throw new Error('Não há testes para validar o pacote.');
const check = spawnSync(process.execPath, ['--test', ...testFiles], { cwd: root, stdio: 'inherit' });
if (check.status !== 0) process.exit(check.status || 1);
const list = await audit();
function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) { crc ^= byte; for (let b = 0; b < 8; b++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
const local = [], central = [], manifest = [];
let offset = 0;
for (const file of list) {
  const data = await readFile(path.join(root, file));
  const name = Buffer.from(file, 'utf8');
  const crc = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6); header.writeUInt16LE(33, 12);
  header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
  local.push(header, name, data);
  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x800, 8); entry.writeUInt16LE(33, 14);
  entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(name.length, 28); entry.writeUInt32LE(offset, 42);
  central.push(entry, name); offset += header.length + name.length + data.length;
  manifest.push({ file, bytes: data.length });
}
const directory = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(list.length, 8); end.writeUInt16LE(list.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
await mkdir(path.join(root, 'release'), { recursive: true });
await writeFile(path.join(root, 'release', 'fluxo-ocorrencias-demo.zip'), Buffer.concat([...local, directory, end]));
await writeFile(path.join(root, 'release', 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Pacote criado: release/fluxo-ocorrencias-demo.zip (${list.length} arquivos, sem histórico Git).`);
