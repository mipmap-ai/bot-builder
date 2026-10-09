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

const {regionPixels,representativeColor,illuminationGains,correctColor,categoryBounds,faceDimensions,irisColor}=await import('../src/photo/regions.mjs');
const {hairCandidate}=await import('../src/photo/matching.mjs');
test('skin, hair and clothing samples exclude their surroundings',()=>{
 const pixels=new Uint8ClampedArray([90,60,40,255,220,170,140,255,240,235,230,255,160,100,60,255]);
 const mask=new Uint8Array([1,3,4,0]);
 assert.deepEqual(regionPixels(pixels,mask,3),[[220,170,140]]);
 assert.deepEqual(regionPixels(pixels,mask,1),[[90,60,40]]);
 assert.deepEqual(regionPixels(pixels,mask,4),[[240,235,230]]);
 assert.equal(categoryBounds(mask,2,2,[1,3]),null);
 const garment=new Uint8Array(100);for(let y=2;y<7;y++)for(let x=2;x<8;x++)garment[y*10+x]=4;
 assert.deepEqual(categoryBounds(garment,10,10,[4]),{x:.2,y:.2,width:.6,height:.5,count:30});
});
test('skin sampling avoids shadows while preserving darker colors',()=>{
 const shadow=Array.from({length:50},()=>[70,45,30]),lit=Array.from({length:50},()=>[135,95,70]);
 assert.deepEqual(representativeColor([...shadow,...lit],.9),[135,95,70]);
 assert.deepEqual(illuminationGains(Array.from({length:50},()=>[80,40,30])),[1,1,1]);
 assert.deepEqual(correctColor([135,95,70],[1,1,1]),[135,95,70]);
});
test('neutral clothing corrects warm lighting without unbounded gains',()=>{
 const gains=illuminationGains(Array.from({length:50},()=>[230,210,190]));
 const corrected=correctColor([230,210,190],gains);
 assert.deepEqual(corrected,[240,240,240]);
 assert.ok(gains.every(gain=>gain<=1.5));
});
test('visible forehead and long hair exclude blunt bangs and short cuts',()=>{
 assert.equal(hairCandidate('straight',{long:true,foreheadVisible:true}),false);
 assert.equal(hairCandidate('buzz',{long:true}),false);
 assert.equal(hairCandidate('ponytail',{long:true,foreheadVisible:true}),true);
 assert.equal(hairCandidate('straight',{long:true,foreheadVisible:false}),true);
});
test('face shape uses mesh distances instead of a square detector box',()=>{
 const points=Array.from({length:478},()=>({x:.5,y:.5}));
 points[234]={x:.3,y:.5};points[454]={x:.7,y:.5};points[10]={x:.5,y:.2};points[152]={x:.5,y:.75};
 const shape=faceDimensions(points,1000,1000);
 assert.equal(chooseHead(shape),'classic');
 assert.equal(irisColor(new Uint8ClampedArray(400),10,10,points),null);
});
