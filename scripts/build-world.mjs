import {readFile,writeFile} from 'node:fs/promises';
import {parse} from 'acorn';
const assets='dist/client/assets';
for(const name of ['parts','outfits','accessories','hair','selection','attachment']){
 let text=await readFile(`src/world/${name}.mjs`,'utf8');text=text.replace(/from '\.\/(\w+)\.mjs'/g,"from './world-$1.js'");
 await writeFile(`${assets}/world-${name}.js`,text);
}
const names='retiredWorldOutfits,worldOutfitDefinitions,worldOutfitEntries,worldOutfitLoaders,worldAccessoryLoaders,worldHairLoaders,extendWorldMetadata,extendWorldCatalog';
async function patch(file,worker){
 let source=await readFile(`${assets}/${file}`,'utf8');
 const wrappers=worker?{d:'extendWorldMetadata',fn:'worldHairLoaders',pn:'worldAccessoryLoaders',Nr:'worldOutfitLoaders'}:{c:'extendWorldMetadata',tn:'extendWorldCatalog',cn:'worldHairLoaders',ln:'worldAccessoryLoaders'};
 const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'}),edits=[];
 for(const statement of ast.body)if(statement.type==='VariableDeclaration')for(const declaration of statement.declarations){const name=declaration.id.name,wrapper=wrappers[name];if(!wrapper)continue;const value=source.slice(declaration.init.start,declaration.init.end);if(value.startsWith('extendWorld')||value.startsWith('Object.assign(')&&value.includes(wrapper))continue;edits.push({start:declaration.init.start,end:declaration.init.end,value:wrapper.startsWith('extend')?`${wrapper}(${value})`:`Object.assign(${value},${wrapper})`});}
 if(edits.length&&edits.length!==Object.keys(wrappers).length)throw Error(`World part anchors incomplete in ${file}`);
 for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.value+source.slice(edit.end);
 const registry=worker?'Kd':'cr',schema=worker?'qd':'$',literal=worker?'bd':'n';
 const marker=`${registry}.tuxedo=tuxedoDefinition;`;
 if(!source.includes(`Object.assign(${registry},worldOutfitDefinitions);`))source=source.replace(marker,marker+`Object.assign(${registry},worldOutfitDefinitions);`);
 const variant=`${schema}(\`tuxedo\`,${literal}(\`tuxedo\`))`;
 if(!source.includes('...worldOutfitEntries.map'))source=source.replace(variant,variant+`,...worldOutfitEntries.map(({id})=>${schema}(id,${literal}(id)))`);
 if(worker&&!source.includes('role:`literal`')){
  const marker='let[a,o]=(n??``).split(`.`);';
  if(!source.includes(marker))throw Error('Outfit paint parser anchor changed');
  source=source.replace(marker,'if(r&&worldOutfitDefinitions[t]&&/^#[0-9a-fA-F]{6}$/.test(n??``))return{role:`literal`,color:n,region:`jacket`,rings:i};'+marker);
  source=source.replace('fill:wg(n)[e.tone],rings:t(e.rings)','fill:e.role===`literal`?e.color:wg(n)[e.tone],rings:t(e.rings)');
 }
 if(worker&&!source.includes('`accessory.jewelry`')){
  source=source.replace('function T_(e,t){return e.seat.slot===`neck`','function T_(e,t){return !e.overOutfit&&e.seat.slot===`neck`');
  source=source.replace('...a(m_[e.seat.slot],i)','...a(e.overOutfit?`accessory.jewelry`:m_[e.seat.slot],i)');
  source=source.replace('`accessory.neck`,`outfit`,`hair.middle`','`accessory.neck`,`outfit`,`accessory.jewelry`,`hair.middle`');
 }
 if(worker&&!source.includes('e.followEars?worldEarPlacement')){
  const marker='let r=M_(e,t,n),i=w_(e)';
  if(!source.includes(marker))throw Error('Accessory fit anchor changed');
  source=source.replace(marker,'let r=e.followEars?worldEarPlacement(n):M_(e,t,n),i=w_(e)');
 }
 if(!source.includes("import {worldEarPlacement}"))source="import {worldEarPlacement} from './world-attachment.js';\n"+source;
 if(!source.includes("from './world-parts.js'"))source=`import {${names}} from './world-parts.js';\n`+source;
 await writeFile(`${assets}/${file}`,source);
}
await patch('spec-CRo6iK1T.js',false);
await patch('draw-worker-CFe3JlME.js',true);
let editor=await readFile(`${assets}/index-RLaEwmsK.js`,'utf8');
if(!editor.includes("from './world-parts.js'"))editor="import {worldGroups} from './world-parts.js';\n"+editor;
if(!editor.includes('...worldGroups')){
 const marker='characterColor:Ze(`Color`,`character`,`color`,`characterColor`,!0)}';
 if(!editor.includes(marker))throw Error('Editor catalog anchor changed');
 editor=editor.replace(marker,marker.slice(0,-1)+',...worldGroups}');
}
if(!editor.includes("from './world-selection.js'"))editor="import {applyWorldSelection} from './world-selection.js';\n"+editor;
if(!editor.includes('n=applyWorldSelection(r,n,D)')){
 const marker='let n=n=>{let{look:r,past:i}=t();';
 if(!editor.includes(marker))throw Error('Editor mutation anchor changed');
 editor=editor.replace(marker,marker+'n=applyWorldSelection(r,n,D);');
}
if(!editor.includes('retiredWorldOutfits[t.outfit]')){
 if(!editor.includes("import {retiredWorldOutfits}"))editor="import {retiredWorldOutfits} from './world-parts.js';\n"+editor;
 const marker='function ct(e){let t=e;';
 if(!editor.includes(marker))throw Error('URL migration anchor changed');
 editor=editor.replace(marker,marker+'if(t&&typeof t===`object`&&Object.hasOwn(retiredWorldOutfits,t.outfit))t={...t,outfit:retiredWorldOutfits[t.outfit]};');
}
await writeFile(`${assets}/index-RLaEwmsK.js`,editor);
console.log('World parts built: 12 outfits, 4 hairstyles, and separate headwear, ornaments, jewelry.');
