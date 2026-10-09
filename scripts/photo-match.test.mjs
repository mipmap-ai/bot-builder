import test from 'node:test';
import assert from 'node:assert/strict';
import {makeGroups,closestColor,validateMatches,normalizeImageSize,chooseHead} from '../src/photo/matching.mjs';
const catalog={hair:{entries:[{id:'cap',label:'Wavy'},{id:'buzz',label:'Buzz cut'}]},hairColor:{entries:[{id:'espresso',label:'Espresso'}]},accessory:{entries:[{id:'none',label:'None'},{id:'square-glasses',label:'Square glasses'}]},beard:{entries:[{id:'none',label:'None'}]},outfit:{entries:[{id:'wristband',label:'Shirt'}]}};
test('matches only available parts and preserves distinct photo regions',()=>{const groups=makeGroups(catalog,true);assert.equal(groups.length,5);assert.equal(groups.find(e=>e.key==='outfit').region,'outfit');assert.equal(groups.find(e=>e.key==='hair').choices[0].id,'cap');assert.match(groups.find(e=>e.key==='hair').choices[0].text,/wavy hair/);assert.equal(makeGroups(catalog,false).length,4);});
test('rejects invented or missing bot options',()=>{assert.throws(()=>validateMatches({hair:'missing',hairColor:'espresso'},catalog));assert.throws(()=>validateMatches({hair:'cap'},catalog));assert.throws(()=>validateMatches({hair:'cap',hairColor:'espresso',skin:'invented'},catalog));assert.deepEqual(validateMatches({hair:'cap',hairColor:'espresso',accessory:'none'},catalog),{hair:'cap',hairColor:'espresso',accessory:'none'});});
test('nearest color chooses existing palette IDs',()=>{const colors=[{id:'ink',color:'#000000'},{id:'white',color:'#ffffff'},{id:'red',color:'#ff0000'}];assert.equal(closestColor([251,249,250],colors),'white');assert.equal(closestColor([13,10,8],colors),'ink');assert.equal(closestColor([243,9,13],colors),'red');});
test('large photos shrink without changing aspect ratio',()=>{assert.deepEqual(normalizeImageSize(4000,3000),{width:1200,height:900});assert.deepEqual(normalizeImageSize(400,800),{width:400,height:800});assert.deepEqual(normalizeImageSize(3000,4000),{width:900,height:1200});});
test('face proportions map to available head shapes',()=>{assert.equal(chooseHead({width:100,height:100}),'mochi');assert.equal(chooseHead({width:100,height:160}),'pebble');assert.equal(chooseHead({width:100,height:130}),'classic');});
const {r:parseSpec}=await import('../dist/client/assets/spec-BwdhfE_6.js');
test('eye colors survive spec validation',()=>{
 const spec=parseSpec({eyes:{color:'#4B88C9'}});assert.equal(spec.eyes.color,'#4B88C9');assert.equal(parseSpec({}).eyes.color,'#1D1C1D');
});
test('eye color matching runs only when the eyes are large enough',()=>{
 const withEyes={...catalog,eyeColor:{entries:[{id:'blue',label:'Blue'}]}};
 assert.ok(makeGroups(withEyes,true,true).some(e=>e.key==='eyeColor'&&e.region==='eyes'));
 assert.ok(!makeGroups(withEyes,true,false).some(e=>e.key==='eyeColor'));
});
const {selectPrediction}=await import('../src/photo/matching.mjs');
test('uncertain accessories are omitted instead of hallucinated',()=>{
 const choices=[{id:'goggles',text:'goggles'},{id:'none',text:'bare face'}];
 assert.equal(selectPrediction('accessory',[{label:'goggles',score:.18},{label:'bare face',score:.16}],choices),'none');
 assert.equal(selectPrediction('accessory',[{label:'goggles',score:.68},{label:'bare face',score:.2}],choices),'goggles');
});
