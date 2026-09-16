import http from 'node:http';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
export function score(cells){if(!Array.isArray(cells)||cells.length!==25||cells.some(c=>!['hit','miss','uncertain'].includes(c)))throw new Error('Exactly 25 valid target cells required');return cells.includes('uncertain')?null:cells.filter(c=>c==='hit').length;}
function fail(status,message){const e=new Error(message);e.status=status;throw e;}
async function body(req,max=13000000){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)fail(413,'Request too large');chunks.push(chunk);}return Buffer.concat(chunks);}
function json(bytes){try{return JSON.parse(bytes.toString());}catch{fail(400,'Invalid JSON');}}
export async function createApp({dataDir=resolve(root,'.data'),code=process.env.DEV_ACCESS_CODE||'FIELD-DEMO',publicOrigin=process.env.API_PUBLIC_ORIGIN||'',allowedOrigins=(process.env.PWA_ALLOWED_ORIGINS||'').split(',').filter(Boolean),secureCookies=process.env.COOKIE_SECURE==='true',sameSite=process.env.COOKIE_SAME_SITE||'Strict'}={}){
 if(!['Strict','Lax','None'].includes(sameSite))throw new Error('Invalid COOKIE_SAME_SITE');
 if(sameSite==='None'&&!secureCookies)throw new Error('SameSite=None requires COOKIE_SECURE=true');
 for(const origin of [...allowedOrigins,...(publicOrigin?[publicOrigin]:[])]){const u=new URL(origin);if(u.origin!==origin||u.protocol!=='https:')throw new Error('Configured origins must be exact HTTPS origins without paths');}
 const cookieAttributes=`HttpOnly; SameSite=${sameSite}; Path=/;${secureCookies?' Secure;':''}`;
 await mkdir(dataDir,{recursive:true});let records=[];try{records=JSON.parse(await readFile(resolve(dataDir,'records.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const sessions=new Map(),attempts=new Map();let writeChain=Promise.resolve();
 const event={id:'development-night',name:'Thursday Night League',date:'LOCAL DEVELOPMENT EVENT',squads:Array.from({length:22},(_,i)=>`Squad ${String(i+1).padStart(2,'0')}`)};
 async function locked(fn){const pending=writeChain.then(async()=>{const before=JSON.stringify(records);try{return await fn();}catch(error){records=JSON.parse(before);throw error;}});writeChain=pending.catch(()=>{});return pending;}
 async function save(){const temp=resolve(dataDir,'records.tmp');await writeFile(temp,JSON.stringify(records));await rename(temp,resolve(dataDir,'records.json'));}
 return http.createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try{
   const url=new URL(req.url,'http://localhost');const path=url.pathname;
   if(!path.startsWith('/api/')){const allowed=['/','/index.html','/app.js','/queue.js','/api.js','/mode.js','/demo.js','/config.json','/style.css','/sw.js','/manifest.webmanifest','/icon.svg'];if(!allowed.includes(path)||!['GET','HEAD'].includes(req.method))fail(404,'Not found');const file=path==='/'?'index.html':path.slice(1);const bytes=await readFile(resolve(root,'public',file));const types={'.json':'application/json','.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};res.writeHead(200,{'Content-Type':types[extname(file)],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);return;}
   const origin=req.headers.origin;
   const ownOrigin=publicOrigin||`http://${req.headers.host}`;
   res.setHeader('Vary','Origin');
   if(origin&&origin!==ownOrigin&&!allowedOrigins.includes(origin))fail(403,'Origin not permitted');
   if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Credentials','true');}
   if(req.method==='OPTIONS'){
    if(!origin)fail(403,'Preflight origin required');
    const methods=['GET','POST','PATCH','DELETE'];
    const headers=['content-type','x-csrf-token','x-submission-id','x-sheet-context'];
    const requested=(req.headers['access-control-request-headers']||'').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);
    if(!methods.includes(req.headers['access-control-request-method'])||requested.some(h=>!headers.includes(h)))fail(403,'Preflight request not permitted');
    res.writeHead(204,{'Access-Control-Allow-Methods':methods.join(', '),'Access-Control-Allow-Headers':headers.join(', '),'Access-Control-Max-Age':'600','Cache-Control':'no-store'});res.end();return;
   }
   if(path==='/api/config'&&req.method==='GET'){send(200,{development:true,demoCode:code==='FIELD-DEMO'?code:null});return;}
   const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('fieldbook_session='))?.split('=')[1];const session=sessions.get(token);
   if(path==='/api/session'&&req.method==='POST'){
    const ip=req.socket.remoteAddress,now=Date.now();const count=attempts.get(ip)||{count:0,start:now};if(now-count.start>60000){count.count=0;count.start=now;}count.count++;attempts.set(ip,count);if(count.count>20)fail(429,'Too many attempts. Wait one minute.');
    const input=json(await body(req,1000));const a=Buffer.from(String(input.code||'')),b=Buffer.from(code);if(a.length!==b.length||!timingSafeEqual(a,b))fail(401,'Access code not recognized');
    const id=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');sessions.set(id,{csrf,expires:Date.now()+3600000});res.setHeader('Set-Cookie',`fieldbook_session=${id}; ${cookieAttributes} Max-Age=3600`);send(200,{event,csrf});return;
   }
   if(!session||session.expires<Date.now())fail(401,'Session expired. Sign in again.');
   if(!['GET','HEAD'].includes(req.method)&&req.headers['x-csrf-token']!==session.csrf)fail(403,'Invalid session request');
   if(path==='/api/session'&&req.method==='GET'){send(200,{event,csrf:session.csrf});return;}
   if(path==='/api/session'&&req.method==='DELETE'){sessions.delete(token);res.setHeader('Set-Cookie',`fieldbook_session=; ${cookieAttributes} Max-Age=0`);send(200,{ok:true});return;}
   if(path==='/api/sheets'&&req.method==='GET'){send(200,records.map(({image,...r})=>r));return;}
   if(path==='/api/sheets'&&req.method==='POST'){
    const id=req.headers['x-submission-id'];if(!/^[0-9a-f-]{36}$/.test(id||''))fail(400,'Invalid submission identity');
    let context;try{context=JSON.parse(decodeURIComponent(req.headers['x-sheet-context']||''));}catch{fail(400,'Invalid sheet context');}
    if(context.eventId!==event.id||!event.squads.includes(context.squad)||typeof context.sheet!=='string'||!context.sheet.trim()||context.sheet.length>80)fail(400,'Invalid event, squad or sheet reference');
    const image=await body(req,12*1024*1024);const type=req.headers['content-type'];const valid=(type==='image/jpeg'&&image[0]===255&&image[1]===216&&image[2]===255)||(type==='image/png'&&image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||(type==='image/webp'&&image.toString('ascii',0,4)==='RIFF'&&image.toString('ascii',8,12)==='WEBP');if(!valid)fail(400,'Image signature does not match an allowed format');
    const hash=createHash('sha256').update(image).update(JSON.stringify({eventId:context.eventId,squad:context.squad,sheet:context.sheet,type})).digest('hex');
    await locked(async()=>{const prior=records.find(r=>r.id===id);if(prior){if(prior.hash!==hash)fail(409,'Submission identity already used for different data');return;}
     await writeFile(resolve(dataDir,`${id}.image`),image);records.push({id,hash,squad:context.squad,sheet:context.sheet,type,created:new Date().toISOString(),status:'Review needed',version:1,cells:Array(25).fill('uncertain'),score:null,participant:'',history:[]});await save();});send(200,{received:true,id});return;
   }
   const match=path.match(/^\/api\/sheets\/([0-9a-f-]{36})(\/image|\/confirm)?$/);if(!match)fail(404,'Not found');const record=records.find(r=>r.id===match[1]);if(!record)fail(404,'Sheet not found');
   if(req.method==='GET'&&match[2]==='/image'){res.writeHead(200,{'Content-Type':record.type,'Cache-Control':'no-store'});res.end(await readFile(resolve(dataDir,`${record.id}.image`)));return;}
   if(req.method==='GET'&&!match[2]){send(200,record);return;}
   if((req.method==='PATCH'&&!match[2])||(req.method==='POST'&&match[2]==='/confirm')){
    const input=json(await body(req,10000));await locked(async()=>{if(input.version!==record.version)fail(409,'This sheet changed. Reopen it and review the latest version.');if(record.status==='Verified')fail(409,'Verified sheets require manager amendment, unavailable in development.');
     if(req.method==='PATCH'){if(typeof input.participant!=='string'||!input.participant.trim()||input.participant.length>100||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>500)fail(400,'Participant and correction reason are required');let result;try{result=score(input.cells);}catch(e){fail(400,e.message);}record.history.push({version:record.version,cells:record.cells,participant:record.participant,reason:input.reason,at:new Date().toISOString(),actor:createHash('sha256').update(token).digest('hex').slice(0,12)});record.cells=input.cells;record.participant=input.participant;record.score=result;
     }else{if(record.score===null)fail(400,'Resolve all target cells before confirmation');record.status='Verified';record.history.push({action:'confirm',version:record.version,at:new Date().toISOString(),actor:createHash('sha256').update(token).digest('hex').slice(0,12)});}record.version++;await save();});send(200,record);return;
   }fail(405,'Method not allowed');
  }catch(e){send(e.status||500,e.status?{error:e.message}:{error:'Development server failure. Pending evidence should be retained.'});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=await createApp();app.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Fieldbook development PWA: http://localhost:4173 · code FIELD-DEMO (unless overridden). Sample data only.'));}
