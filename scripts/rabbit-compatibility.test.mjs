import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {r as parseSpec} from '../dist/client/assets/spec-BwdhfE_6.js';
const pending=new Map();
globalThis.self={postMessage:message=>{const callback=pending.get(message.id);if(callback){pending.delete(message.id);message.error?callback.reject(Error(message.error)):callback.resolve(message);}}};
await import('../dist/client/assets/draw-worker-CFe3JlME.js');
let nextId=0;
async function render(spec){const id=++nextId;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});self.onmessage({data:{id,spec:parseSpec(spec),size:256}});});}
const hash=svg=>createHash('sha256').update(svg).digest('hex');
const fixtureUrl=new URL('./fixtures/existing-avatar-hashes.json',import.meta.url);
if(process.argv.includes('--record')){
 const cases=[{name:'default',spec:{}},{name:'saved portrait URL',spec:{head:{skin:'#CBA688'},hair:{type:'ponytail',color:'#3B2B26'},outfit:{type:'blouse',color:'#F4EDE2'}}}];
 for(const shape of ['classic','mochi','squircle','pebble'])for(const type of ['bot','ghost','cat','muni'])cases.push({name:`${shape}/${type}`,spec:{head:{shape},character:{type}}});
 cases.push({name:'colored eyes and hair',spec:{eyes:{color:'#4B88C9'},hair:{type:'long-waves',color:'#B8683E'},outfit:{type:'jacket'}}});
 for(const item of cases)item.hash=hash((await render(item.spec)).svg);
 await writeFile(fixtureUrl,JSON.stringify(cases,null,2)+'\n');
}else{
 const cases=JSON.parse(await readFile(fixtureUrl,'utf8'));
 for(const item of cases)test(`existing image remains identical: ${item.name}`,async()=>assert.equal(hash((await render(item.spec)).svg),item.hash));
 test('rabbit is a distinct valid character and renders colored ears',async()=>{
  const spec=parseSpec({character:{type:'rabbit'}});assert.equal(spec.character.type,'rabbit');
  const rabbit=await render(spec);assert.match(rabbit.svg,/#E8A7B8/);assert.notEqual(hash(rabbit.svg),cases[0].hash);
 });
}
