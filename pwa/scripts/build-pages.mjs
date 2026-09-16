import { cp, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolveApiBase } from '../public/api.js';
const output = fileURLToPath(new URL('../dist/', import.meta.url));
const configured = (process.env.PWA_API_BASE_URL || '').trim();
// Accept the literal placeholder used during the initial usability deployment.
const value = configured.toLowerCase() === 'blank' ? '' : configured;
if (value) {
  if (!value.startsWith('https://')) throw new Error('Pages requires an absolute HTTPS PWA_API_BASE_URL, including the API path.');
  resolveApiBase(value, 'https://example.invalid/');
}
await mkdir(output, { recursive: true });
await cp(new URL('../public/', import.meta.url), output, { recursive: true });
await writeFile(new URL('../dist/mode.js', import.meta.url), `export const demoMode = ${!value};\n`);
await writeFile(new URL('../dist/config.json', import.meta.url), JSON.stringify({ apiBaseUrl: value }) + '\n');
await writeFile(new URL('../dist/.nojekyll', import.meta.url), '');
console.log(value ? 'Pages artifact ready with configured backend.' : 'Pages usability demo ready; no backend needed.');
