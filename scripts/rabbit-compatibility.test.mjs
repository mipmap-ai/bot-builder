import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {r as framePresets} from '../dist/client/assets/wavy-BqL-5g6J.js';
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
 for(const item of cases.filter(item=>!item.name.endsWith('/muni')))test(`existing image remains identical: ${item.name}`,async()=>assert.equal(hash((await render(item.spec)).svg),item.hash));
 for(const item of cases.filter(item=>item.name.endsWith('/muni')))test(`Muni URL resolves to its requested Penguin replacement: ${item.name}`,async()=>{
  const result=await render(item.spec);assert.match(result.svg,/#EDA73D/);assert.notEqual(hash(result.svg),item.hash);
 });
 test('tuxedo outfit resolves and renders with a shirt and bow tie',async()=>{
  const spec=parseSpec({outfit:{type:'tuxedo'}});assert.equal(spec.outfit.type,'tuxedo');
  const result=await render(spec);assert.match(result.svg,/#F1EFF5/);assert.match(result.svg,/#17181D/);
 });
 test('centered frame places the head origin at the horizontal and vertical center with no rotation',()=>{
  const frame=framePresets['front-center'];
  assert.deepEqual(frame.view.center,[0,0]);assert.deepEqual(frame.pose,{yaw:0,pitch:0,roll:0});
 });
 test('centered frame resolves for Bot, Penguin and Rabbit',async()=>{
  for(const type of ['bot','muni','rabbit']){
   const spec=parseSpec({frame:{preset:'front-center'},character:{type},outfit:{type:'tuxedo'}});
   assert.equal(spec.frame.preset,'front-center');
   const result=await render(spec);assert.match(result.svg,/#F1EFF5/);assert.notEqual(hash(result.svg),cases[0].hash);
  }
 });
 test('rabbit is a distinct valid character and renders colored ears',async()=>{
  const spec=parseSpec({character:{type:'rabbit'}});assert.equal(spec.character.type,'rabbit');
  const rabbit=await render(spec);assert.match(rabbit.svg,/#E8A7B8/);assert.notEqual(hash(rabbit.svg),cases[0].hash);
 });
}

test('legacy Sweet Potato specifications render exactly as Nothing held',async()=>{
 for(const type of ['bot','muni','rabbit']){
  const avatar={character:{type},frame:{preset:'front-center'},hair:{type:'ponytail'},outfit:{type:'tuxedo'},accessory:{crown:'trucker-hat',held:'sweet-potato'}};
  const parsed=parseSpec(avatar);assert.equal(parsed.accessory.held,'none');assert.equal(parsed.accessory.crown,'trucker-hat');
  const expected={...avatar,accessory:{...avatar.accessory,held:'none'}};
  assert.deepEqual(parsed,parseSpec(expected));
  assert.equal((await render(avatar)).svg,(await render(expected)).svg);
 }
});
