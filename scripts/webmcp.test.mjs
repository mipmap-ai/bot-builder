import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {createTools} from '../src/webmcp/tools.mjs';
const file=new URL('../dist/client/assets/.webmcp-test.mjs',import.meta.url);
let source=await readFile(new URL('../dist/client/assets/index-RLaEwmsK.js',import.meta.url),'utf8');
const start=source.indexOf('(function(){let e=document.createElement'),end=source.indexOf('var xe=',start);
assert.ok(start>0&&end>start);
source=source.slice(0,start)+source.slice(end);
source=source.slice(0,source.lastIndexOf('addEventListener(`load`,()=>document.head.append'))+'export {D as catalog,Ut as store,gt as toSpec,it as disabledFields,ct as parseLook,bt as serialize};';
await writeFile(file,source);
let app;try{app=await import(file.href);}finally{await unlink(file);}
const defaults=Object.fromEntries(Object.entries(app.catalog).map(([key,group])=>[key,group.defaultId]));
function setup(){
 app.store.setState({look:{...defaults},past:[],future:[]});
 const tools=createTools({catalog:app.catalog,state:()=>app.store.getState(),parse:app.parseLook,toSpec:app.toSpec,disabled:app.disabledFields,serialize:app.serialize,settle:async()=>{},exportAvatar:async(format,size)=>({format,size}),photo:{status:()=>({photoSelected:false}),open:()=>({open:true}),match:()=>{throw Error('Select a photo first.');}}});
 return async(name,input={})=>{const result=await tools.find(tool=>tool.name===name).execute(input);return {...JSON.parse(result.content[0].text),isError:!!result.isError};};
}
test('batched selections form one reversible edit using the real editor state',async()=>{
 const call=setup();await call('change_bot',{selections:{character:'rabbit',eyeColor:'blue',outfit:'tuxedo',frame:'front-center'}});
 assert.equal(app.store.getState().past.length,1);assert.equal(app.store.getState().look.character,'rabbit');
 const changed={...app.store.getState().look};await call('undo_bot');assert.deepEqual(app.store.getState().look,defaults);await call('redo_bot');assert.deepEqual(app.store.getState().look,changed);
});
test('invalid and unavailable selections leave every selection and history untouched',async()=>{
 const call=setup();for(const selections of [{outfit:'invented'},{character:'rabbit',hair:'curly'},{outfit:'tuxedo',unknown:'x'},{},{held:'sweet-potato'}]){assert.equal((await call('change_bot',{selections})).isError,true);assert.deepEqual(app.store.getState().look,defaults);assert.equal(app.store.getState().past.length,0);}
});
test('catalog tools expose current IDs without retired options and share links use existing serialization',async()=>{
 const call=setup();const options=await call('get_bot_options');assert.deepEqual(options.options.held.entries.map(e=>e.id),['none']);assert.equal(options.options.character.entries.find(e=>e.id==='muni').label,'Penguin');
 await call('change_bot',{selections:{skin:'honey',hair:'ponytail',hairColor:'espresso'}});const before={...app.store.getState().look};const link=await call('get_bot_share_link');assert.equal(link.url,'https://botbuilder.mipmap.ai/'+app.serialize(before));await call('get_current_bot');assert.deepEqual(app.store.getState().look,before);
});
test('WebMCP randomization uses valid character compatibility rules',async()=>{
 const call=setup();for(let n=0;n<100;n++){await call('randomize_bot');const look=app.store.getState().look;assert.deepEqual(app.parseLook(look),look);for(const key of app.disabledFields(app.toSpec(look)))assert.equal(look[key],defaults[key]);}
});
test('export tool validates format, dimensions, and unknown arguments before generating files',async()=>{
 const call=setup();for(const input of [{format:'jpeg'},{format:'png',size:8192},{format:'svg',url:'https://example.com'}])assert.equal((await call('export_bot',input)).isError,true);assert.deepEqual(await call('export_bot',{format:'png',size:2048}),{format:'png',size:2048,isError:false});
});
test('photo tools expose readiness without photo data and reject matching without selection',async()=>{
 const call=setup();assert.equal((await call('get_photo_match_status')).photoSelected,false);assert.equal((await call('open_photo_match')).open,true);assert.equal((await call('match_selected_photo')).isError,true);assert.equal((await call('get_current_bot',{extra:true})).isError,true);
});

test('photo tools and the manual picker import the same versioned module instance',async()=>{
 const html=await readFile(new URL('../dist/client/index.html',import.meta.url),'utf8');
 const ui=await readFile(new URL('../src/webmcp/ui.mjs',import.meta.url),'utf8');
 const photoUrl=html.match(/src="([^\"]*photo\/ui\.js[^\"]*)"/)[1];
 assert.ok(ui.includes("from '"+photoUrl+"'"));
});
