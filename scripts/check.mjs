import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import { handleApi } from '../dist/server/index.js';
const root=resolve('dist/client');
let checked=0;
for(const filename of await readdir(resolve(root,'assets'))){
 if(!filename.endsWith('.js'))continue;
 const path=resolve(root,'assets',filename),source=await readFile(path,'utf8');
 for(const match of source.matchAll(/(?:from\s*|import\s*\()["'`]([^"'`]+\.js)["'`]/g)){
  const target=resolve(dirname(path),match[1]);await readFile(target);checked++;
 }
}
const saved=new Map(), storage={async put(key,value){saved.set(key,value);}};
const request=(body)=>new Request('https://test.local/api/feedback',{method:'POST',body:JSON.stringify(body)});
assert.equal((await handleApi(request({text:''}),storage)).status,400);
assert.equal((await handleApi(request({text:'x'.repeat(2001)}),storage)).status,400);
assert.equal((await handleApi(request({text:'Test feedback',look:'?head=mochi'}),storage)).status,201);
assert.equal(saved.size,1);
assert.equal(JSON.parse([...saved.values()][0]).text,'Test feedback');
assert.equal((await handleApi(request({text:'Preserve this on error'}),{async put(){throw Error('offline');}})).status,503);
assert.equal((await handleApi(new Request('https://test.local/api/feedback/config'),storage)).status,200);
console.log(`PASS: ${checked} module references and feedback validation, persistence, and failure behavior.`);
