import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { demoApi, demoScore } from '../public/demo.js';

test('demo opens a distinct sample event and never requires a code', async()=>{
  const session=await demoApi('/session');
  assert.equal(session.event.id,'usability-demo');
  assert.equal(session.event.squads.length,22);
  assert.deepEqual(await demoApi('/session',{method:'DELETE'}),{ok:true});
});
test('demo scoring leaves uncertainty unresolved and counts complete rounds',()=>{
  assert.equal(demoScore(Array(25).fill('uncertain')),null);
  assert.equal(demoScore(Array(25).fill('hit')),25);
  assert.equal(demoScore(Array(25).fill('miss')),0);
  assert.equal(demoScore(['miss',...Array(24).fill('hit')]),24);
  assert.throws(()=>demoScore(Array(24).fill('hit')));
  assert.throws(()=>demoScore(Array(25).fill('other')));
});
test('Pages build explicitly selects demo or API mode and includes offline demo modules',async()=>{
  const build=new URL('../scripts/build-pages.mjs',import.meta.url);
  const {fileURLToPath}=await import('node:url');
  const run=value=>execFileSync(process.execPath,[fileURLToPath(build)],{env:{...process.env,PWA_API_BASE_URL:value}});
  try {
    run('');
    assert.match(await readFile(new URL('../dist/mode.js',import.meta.url),'utf8'),/demoMode = true/);
    assert.match(await readFile(new URL('../dist/demo.js',import.meta.url),'utf8'),/fieldbook-usability-demo/);
    assert.match(await readFile(new URL('../dist/sw.js',import.meta.url),'utf8'),/'mode.js', 'demo.js'/);
    run(' blank ');
    assert.match(await readFile(new URL('../dist/mode.js',import.meta.url),'utf8'),/demoMode = true/);
    assert.equal(JSON.parse(await readFile(new URL('../dist/config.json',import.meta.url),'utf8')).apiBaseUrl,'');
    run('https://api.example.com/api/');
    assert.match(await readFile(new URL('../dist/mode.js',import.meta.url),'utf8'),/demoMode = false/);
    assert.equal(JSON.parse(await readFile(new URL('../dist/config.json',import.meta.url),'utf8')).apiBaseUrl,'https://api.example.com/api/');
    assert.throws(()=>run('http://insecure.example/api/'));
  } finally { run(''); }
});
