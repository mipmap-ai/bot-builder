import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,resolveBot,describeBot,renderAvatar,toSpec} from '../src/mcp/bot.mjs';
import {worldOutfitEntries} from '../src/world/outfits.mjs';
import {worldHairEntries} from '../src/world/hair.mjs';
import {worldGroups,worldAccessories} from '../src/world/accessories.mjs';
const render=async selections=>(await renderAvatar(toSpec(resolveBot(selections)),256)).svg;
test('all 12 curated garments are individual recolorable options and render distinctly',async()=>{
 assert.equal(worldOutfitEntries.length,12);const images=new Set();
 for(const entry of worldOutfitEntries){assert.deepEqual(Object.keys(entry.values),['type']);assert.ok(catalog.outfit.entries.some(e=>e.id===entry.id));
  const a=await render({outfit:entry.id,outfitColor:'teal',frame:'front-center'});
  const b=await render({outfit:entry.id,outfitColor:'rose',frame:'front-center'});
  assert.notEqual(a,b,`${entry.id} recolors`);images.add(a);
  const look=resolveBot({outfit:entry.id});assert.deepEqual(resolveBot({},describeBot(look).url),look);
 }
 assert.equal(images.size,12);
});
test('new hairstyles and accessories load independently and leave clothes unchanged',async()=>{
 for(const entry of worldHairEntries){const look=resolveBot({hair:entry.id,outfit:'tuxedo'});assert.equal(look.outfit,'tuxedo');assert.ok((await renderAvatar(toSpec(look),256)).svg.includes('<svg'));}
 for(const [field,group]of Object.entries(worldGroups))for(const entry of group.entries){
  const look=resolveBot({[field]:entry.id,outfit:'jacket',hair:'ponytail'});assert.equal(look.outfit,'jacket');assert.equal(look.hair,'ponytail');
  assert.deepEqual(resolveBot({},describeBot(look).url),look);
  assert.ok((await renderAvatar(toSpec(look),256)).svg.includes('<svg'));
 }
 assert.equal(Object.keys(worldAccessories).length,12);
});
test('hat, hair ornament and jewelry combine across garments and characters',async()=>{
 for(const character of ['bot','rabbit','muni','cat']){
  const look=resolveBot({character,headwear:'wedding-turban',hairOrnament:'white-flower',jewelry:'gold-pendant',outfit:'kimono',outfitColor:'teal'});
  const spec=toSpec(look);assert.equal(spec.accessory.crown,'wedding-turban');assert.equal(spec.accessory.clip,'white-flower');assert.equal(spec.accessory.neck,'gold-pendant');
  assert.ok((await renderAvatar(spec,256)).svg.includes('#D9B35C'));
 }
});
test('new empty accessory fields preserve old URL selections and defaults',()=>{
 const look=resolveBot({},'?accessory=conical-hat&outfit=tuxedo&eyeColor=blue');
 assert.equal(describeBot(look).url,'https://botbuilder.mipmap.ai/?eyeColor=blue&outfit=tuxedo&accessory=conical-hat');
 assert.equal(toSpec(look).accessory.crown,'conical-hat');
 for(const field of Object.keys(worldGroups))assert.equal(look[field],'none');
});

import {worldHair} from '../src/world/hair.mjs';
import {messyBun} from '../dist/client/assets/messy-bun-sEL3i9Gv.js';
import {worldEarPlacement} from '../src/world/attachment.mjs';
test('new hair uses the exact canonical fit so native shape deformation stays enabled',()=>{
 for(const drawing of Object.values(worldHair))assert.deepEqual(drawing.fit,messyBun.fit);
});
test('earring studs follow live ear centers at different widths, heights and offsets',()=>{
 for(const ears of [{left:[-1,-.2],right:[1,-.2]},{left:[-1.3,-.1],right:[1.3,-.1]},{left:[-.8,-.3],right:[.9,-.15]}]){
  const place=worldEarPlacement({ears});assert.deepEqual(place([-1.04,-.552]),ears.left);assert.deepEqual(place([1.04,-.552]),ears.right);
 }
});
test('curated hairstyles and earrings render on every head shape, size, and frame',async()=>{
 for(const hair of Object.keys(worldHair))for(const head of ['classic','mochi','squircle','pebble'])for(const size of ['small','medium','large'])for(const frame of ['front-center','corner-peek','side-peek','bottom-peek','top-peek','tilt-peek','half-face','close-up']){
  assert.ok((await render({hair,head,size,frame,hairOrnament:'gold-earrings'})).includes('<svg'));
 }
});
test('individual accessories replace only a conflicting slot',()=>{
 const base=describeBot(resolveBot({headwear:'wedding-turban',hairOrnament:'white-flower',jewelry:'gold-pendant'})).url;
 const cap=resolveBot({accessory:'baseball-cap'},base);assert.equal(cap.headwear,'none');assert.equal(cap.hairOrnament,'white-flower');assert.equal(cap.jewelry,'gold-pendant');assert.equal(toSpec(cap).accessory.crown,'baseball-cap');
 const flower=resolveBot({hairOrnament:'red-flower'},'?accessory=star-clip');assert.equal(flower.accessory,'none');assert.equal(toSpec(flower).accessory.clip,'red-flower');
});
test('retired trial outfit URLs resolve to the curated counterparts',()=>{
 for(const [old,replacement]of Object.entries({'tartan-vest':'bunad',charro:'flamenco',lehenga:'sari','thai-formal':'thai-chakri'})){
  assert.ok(!catalog.outfit.entries.some(entry=>entry.id===old));assert.equal(resolveBot({},`?outfit=${old}`).outfit,replacement);
 }
});

import {Resvg,initWasm} from '@resvg/resvg-wasm';
import {readFile} from 'node:fs/promises';
test('new hair and hats keep both eyes visible in actual pixels for every head and size',async()=>{
 await initWasm(await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm',import.meta.url)));
 const eyePixels=svg=>{const renderer=new Resvg(svg);let image;try{image=renderer.render();const pixels=image.pixels;let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]===139&&pixels[i+1]===108&&pixels[i+2]===180)count++;return count;}finally{image?.free();renderer.free();}};
 for(const head of ['classic','mochi','squircle','pebble'])for(const size of ['small','medium','large']){
  const base={head,size,frame:'front-center',eyeColor:'violet',hair:'buzz'};
  const reference=eyePixels(await render(base));assert.ok(reference>20);
  for(const hair of Object.keys(worldHair))assert.ok(eyePixels(await render({...base,hair}))>=reference*.95,`${head}/${size}/${hair} obscures eyes`);
  for(const headwear of ['wedding-turban','sombrero','lace-bonnet','tartan-tam','andean-hat'])assert.ok(eyePixels(await render({...base,headwear}))>=reference*.95,`${head}/${size}/${headwear} obscures eyes`);
 }
});
