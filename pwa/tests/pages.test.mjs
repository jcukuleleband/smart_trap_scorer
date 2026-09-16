import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolveApiBase, endpoint } from '../public/api.js';
test('API configuration handles localhost and hosted API paths without credentials in URLs',()=>{
 assert.equal(endpoint(resolveApiBase('./api/','http://localhost:4173/'),'/session'),'http://localhost:4173/api/session');
 assert.equal(endpoint(resolveApiBase('https://api.example.com/api','https://host.github.io/project/'),'/sheets/id/image'),'https://api.example.com/api/sheets/id/image');
 for(const value of ['', 'http://example.com/api','https://user:secret@example.com/api','https://example.com/api?token=x'])assert.throws(()=>resolveApiBase(value,'https://host.github.io/project/'));
});
test('static entry and manifest resolve within a Pages project',async()=>{
 const root=new URL('../public/',import.meta.url),base='https://host.github.io/smart_trap_scorer/';
 const html=await readFile(new URL('index.html',root),'utf8');
 for(const [,value] of html.matchAll(/(?:href|src)="([^"]+)"/g)){assert.ok(new URL(value,base).pathname.startsWith('/smart_trap_scorer/'),value);}
 const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));
 for(const value of [manifest.id,manifest.start_url,manifest.scope,...manifest.icons.map(i=>i.src)])assert.ok(new URL(value,base).pathname.startsWith('/smart_trap_scorer/'));
});
test('service worker caches only its scoped shell and preserves other application caches',async()=>{
 const handlers={},scope='https://host.github.io/smart_trap_scorer/',deleted=[];let assets;
 const context={URL,self:{registration:{scope},addEventListener:(type,fn)=>handlers[type]=fn},caches:{open:async()=>({addAll:async a=>assets=a}),keys:async()=>['other-app',`fieldbook:${scope}:shell-old`,'fieldbook:https://host.github.io/other/:shell-old'],delete:async k=>deleted.push(k)}};
 vm.runInNewContext(await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;
 assert.ok(assets.every(a=>a.startsWith(scope)));assert.ok(!assets.some(a=>a.endsWith('config.json')));
 handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,[`fieldbook:${scope}:shell-old`]);
 for(const url of ['https://api.example.com/api/sheets',`${scope}config.json`,`${scope}app.js?private=true`])handlers.fetch({request:{url,method:'GET'},respondWith:()=>assert.fail('Must not cache private/configuration requests')});
});
