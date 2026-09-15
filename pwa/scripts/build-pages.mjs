import { cp, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolveApiBase } from '../public/api.js';
const output = fileURLToPath(new URL('../dist/', import.meta.url));
const value = process.env.PWA_API_BASE_URL || '';
if (value) {
  if (!value.startsWith('https://')) throw new Error('Pages requires an absolute HTTPS PWA_API_BASE_URL, including the API path.');
  resolveApiBase(value, 'https://example.invalid/');
}
await mkdir(output, { recursive: true });
await cp(new URL('../public/', import.meta.url), output, { recursive: true });
await writeFile(new URL('../dist/config.json', import.meta.url), JSON.stringify({ apiBaseUrl: value }) + '\n');
await writeFile(new URL('../dist/.nojekyll', import.meta.url), '');
console.log(value ? 'Pages artifact ready with configured backend.' : 'Pages artifact ready; login will show that a backend must be configured.');
