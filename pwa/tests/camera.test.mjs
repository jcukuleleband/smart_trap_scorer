import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
function browser(getUserMedia) {
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',value:'',events:{},
      addEventListener(type,handler){this.events[type]=handler;},
      click(){this.clicked=true;},play:async()=>{},srcObject:null});
    return elements.get(id);
  };
  const context=vm.createContext({demoMode:false,queue:{},
    document:{getElementById:get,querySelectorAll:()=>[],addEventListener(){}},
    navigator:{onLine:true,mediaDevices:{getUserMedia}},
    window:{addEventListener(){}},URL,location:{href:'https://example.com/'},
    // Keep startup configuration pending while exercising camera events.
    fetch:()=>new Promise(()=>{})});
  vm.runInContext(source,context);
  return {get,context};
}
test('native capture is opened directly by the user gesture',()=>{
  const {get}=browser(()=>assert.fail('Native capture must not request a video stream'));
  get('phone-camera').events.click();
  assert.equal(get('camera-file').clicked,true);
});
test('live capture explicitly starts playback before enabling the shutter',async()=>{
  const stream={getTracks:()=>[]};
  const {get}=browser(async()=>stream);
  let played=false;
  get('video').play=async()=>{assert.equal(get('shutter').hidden,true);played=true;};
  await get('camera').events.click();
  assert.equal(played,true);
  assert.equal(get('video').srcObject,stream);
  assert.equal(get('shutter').hidden,false);
});
test('leaving capture while permission is pending stops the late stream',async()=>{
  let resolveStream,stopped=false;
  const {get,context}=browser(()=>new Promise(resolve=>resolveStream=resolve));
  const pending=get('camera').events.click();
  vm.runInContext('stopCamera()',context);
  resolveStream({getTracks:()=>[{stop(){stopped=true;}}]});
  await pending;
  assert.equal(stopped,true);
  assert.equal(get('video').srcObject,null);
});
test('permission denial gives a recovery path',async()=>{
  const {get}=browser(async()=>{throw Object.assign(new Error('Denied'),{name:'NotAllowedError'});});
  await get('camera').events.click();
  assert.match(get('notice').textContent,/permission was blocked/);
  assert.match(get('notice').textContent,/Take photo/);
  assert.equal(get('shutter').hidden,true);
});
