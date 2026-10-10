import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {randomizeLook} from '../src/randomize/randomize.mjs';
const file=new URL('../dist/client/assets/.randomizer-test.mjs',import.meta.url);
let source=await readFile(new URL('../dist/client/assets/index-RLaEwmsK.js',import.meta.url),'utf8');
// Load the actual app catalog and schema, omitting only its browser bootstrap.
const polyfillStart=source.indexOf('(function(){let e=document.createElement');
const polyfillEnd=source.indexOf('var xe=',polyfillStart);
assert.ok(polyfillStart>0&&polyfillEnd>polyfillStart);
source=source.slice(0,polyfillStart)+source.slice(polyfillEnd);
const bootstrapStart=source.lastIndexOf('addEventListener(`load`,');
const firstBootstrap=source.lastIndexOf('addEventListener(`load`,()=>document.head.append');
assert.ok(bootstrapStart>=firstBootstrap&&firstBootstrap>0);
source=source.slice(0,firstBootstrap)+'export {D as catalog,gt as toSpec,it as disabledFields,ct as parseLook,Vt as appRandomize};';
await writeFile(file,source);
let app;
try{app=await import(file.href);}finally{await unlink(file);}
const defaults=Object.fromEntries(Object.entries(app.catalog).map(([key,group])=>[key,group.defaultId]));
function randomFor(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('randomization reaches every eligible catalog selection, including character, frame, size and held items',()=>{
 const seen=Object.fromEntries(Object.keys(app.catalog).map(key=>[key,new Set()]));
 const random=randomFor(42);
 for(let sample=0;sample<3000;sample++){
  const look=app.appRandomize(defaults,random);
  assert.deepEqual(app.parseLook(look),look);
  const disabled=app.disabledFields(app.toSpec(look));
  for(const [key,value] of Object.entries(look)){
   assert.ok(app.catalog[key].entries.some(entry=>entry.id===value),`${key} has an invalid ID`);
   if(disabled.has(key))assert.equal(value,defaults[key],`${key} is incompatible`);
   else seen[key].add(value);
  }
 }
 for(const [key,group] of Object.entries(app.catalog))assert.deepEqual(seen[key],new Set(group.entries.map(entry=>entry.id)),`not every ${key} selection was reachable`);
});
test('all character choices use their own compatibility rules',()=>{
 const characters=app.catalog.character.entries;
 for(let index=0;index<characters.length;index++){
  let first=true;
  const random=()=>first?(first=false,(index+.5)/characters.length):.999;
  const look=randomizeLook(app,random),disabled=app.disabledFields(app.toSpec(look));
  assert.equal(look.character,characters[index].id);
  for(const key of disabled)assert.equal(look[key],defaults[key]);
 }
});
test('the current avatar is untouched until a new valid result is selected',()=>{
 const previous={...defaults,hair:'ponytail',outfit:'tuxedo'};
 const before={...previous};
 const result=app.appRandomize(previous,randomFor(42));
 assert.deepEqual(previous,before);
 assert.notDeepEqual(result,previous);
});

test('retired Sweet Potato links resolve to Nothing held without changing other selections',()=>{
 const oldLook={...defaults,held:'sweet-potato',hair:'ponytail',outfit:'tuxedo',frame:'front-center',skin:'honey',hairColor:'espresso'};
 const before={...oldLook};
 const migrated=app.parseLook(oldLook);
 assert.deepEqual(migrated,{...oldLook,held:'none'});
 assert.deepEqual(oldLook,before);
 assert.equal(app.toSpec(migrated).accessory.held,'none');
 assert.deepEqual(app.catalog.held.entries.map(entry=>entry.id),['none']);
 assert.throws(()=>app.parseLook({...defaults,held:'invented-item'}));
});
