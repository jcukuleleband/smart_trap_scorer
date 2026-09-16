// Isolated, device-local sample data. This module provides no authentication
// or authoritative scoring and never sends photographs over the network.
const event = { id: 'usability-demo', name: 'Practice league night', date: 'LOCAL USABILITY DEMO', squads: Array.from({length:22}, (_,i) => `Squad ${String(i+1).padStart(2,'0')}`) };
let database;
async function db() {
  if (!database) database = new Promise((resolve,reject) => {
    const request = indexedDB.open('fieldbook-usability-demo',1);
    request.onupgradeneeded = () => request.result.createObjectStore('sheets',{keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}
async function operate(mode, action) {
  const database = await db();
  return new Promise((resolve,reject) => {
    const tx = database.transaction('sheets',mode);
    let result, failure;
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () => reject(failure || tx.error || new Error('Demo storage failed'));
    const store = tx.objectStore('sheets');
    const request = store.getAll();
    request.onsuccess = () => {
      try { result = action(store,request.result); }
      catch(error) { failure=error; tx.abort(); }
    };
  });
}
export function demoScore(cells) {
  if (!Array.isArray(cells) || cells.length!==25 || cells.some(c=>!['hit','miss','uncertain'].includes(c))) throw new Error('Exactly 25 target results are required.');
  return cells.includes('uncertain') ? null : cells.filter(c=>c==='hit').length;
}
export async function demoApi(path, options={}) {
  const method=options.method || 'GET';
  if(path==='/session') return method==='DELETE' ? {ok:true} : {event,csrf:'demo'};
  if(path==='/config') return {};
  return operate(method==='GET'?'readonly':'readwrite',(store,rows)=>{
    if(path==='/sheets' && method==='GET') return rows.map(({image,...record})=>record);
    if(path==='/sheets' && method==='POST') {
      const id=options.headers['X-Submission-Id'];
      if(rows.some(row=>row.id===id)) return {received:true,id};
      const context=JSON.parse(decodeURIComponent(options.headers['X-Sheet-Context']));
      if(context.eventId!==event.id) throw new Error('This photo belongs to another event.');
      if(rows.length>=10 || rows.reduce((sum,row)=>sum+row.image.size,0)+options.body.size>50*1024*1024) throw new Error('Demo storage is full. Clear demo data to start again.');
      store.add({id,image:options.body,squad:context.squad,sheet:context.sheet,created:new Date().toISOString(),status:'Review needed',version:1,cells:Array(25).fill('uncertain'),score:null,participant:''});
      return {received:true,id};
    }
    const match=path.match(/^\/sheets\/([^/]+)(\/image|\/confirm)?$/);
    const record=rows.find(row=>row.id===match?.[1]);
    if(!record) throw new Error('Demo sheet not found.');
    if(method==='GET') return match[2]==='/image' ? record.image : record;
    const input=JSON.parse(options.body);
    if(input.version!==record.version) throw new Error('Sheet changed. Reopen it before continuing.');
    if(record.status==='Verified') throw new Error('This demo sheet is already confirmed.');
    if(method==='PATCH') {
      if(!input.participant?.trim() || !input.reason?.trim()) throw new Error('Enter a participant and correction reason.');
      record.score=demoScore(input.cells); record.cells=input.cells; record.participant=input.participant;
    } else if(match[2]==='/confirm') {
      if(record.score===null) throw new Error('Resolve all targets before confirming.');
      record.status='Verified';
    } else throw new Error('Unsupported demo operation.');
    record.version++; store.put(record); return record;
  });
}
export async function clearDemo() { await operate('readwrite',store=>store.clear()); }
