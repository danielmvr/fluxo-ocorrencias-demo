import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { root, siteFiles, audit } from './audit.mjs';
await audit();
for (const file of [...siteFiles, '.nojekyll']) {
  const dest = path.join(root, '.site', file);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(path.join(root, file), dest);
}
console.log('Site estático preparado em .site/ com somente os arquivos do aplicativo.');
