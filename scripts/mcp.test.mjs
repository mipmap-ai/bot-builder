import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolveBot,describeBot,randomBot,renderAvatar,toSpec,catalog,exportUrl} from '../src/mcp/bot.mjs';
import {r as parseSpec} from '../dist/client/assets/spec-BwdhfE_6.js';
test('shared server renderer preserves existing artwork',async()=>{
 const cases=JSON.parse(await readFile(new URL('./fixtures/existing-avatar-hashes.json',import.meta.url)));
 for(const item of cases.filter(item=>!item.name.endsWith('/muni'))){const {svg}=await renderAvatar(parseSpec(item.spec),256);assert.equal(createHash('sha256').update(svg).digest('hex'),item.hash,item.name);}
});
test('server share URLs round trip and migrate retired options',()=>{
 const selections={character:'rabbit',eyeColor:'blue',outfit:'tuxedo',frame:'front-center'};
 const look=resolveBot(selections);assert.deepEqual(resolveBot({},describeBot(look).url),look);
 assert.equal(resolveBot({},'?held=sweet-potato').held,'none');
 assert.equal(resolveBot({},'?character=muni').character,'muni');
 assert.throws(()=>resolveBot({hair:'pony',character:'rabbit'}));
 assert.throws(()=>resolveBot({skin:'porcelain',character:'rabbit'}));
 assert.throws(()=>resolveBot({},'https://example.com/'));
 assert.throws(()=>resolveBot({secret:'x'}));
 assert.equal(exportUrl(look,'png',2048),'https://botbuilder.mipmap.ai/api/bot.png?character=rabbit&eyeColor=blue&outfit=tuxedo&frame=front-center&size=2048');
});
test('random server bots use valid options and render',async()=>{
 for(let n=0;n<30;n++){const look=randomBot();for(const [key,value]of Object.entries(look))assert.ok(catalog[key].entries.some(entry=>entry.id===value));assert.ok((await renderAvatar(toSpec(look),256)).svg.includes('<svg'));}
});
