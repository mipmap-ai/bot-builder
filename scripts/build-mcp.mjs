import {readFile,writeFile,copyFile,rm,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {extractModule} from './extract-module.mjs';
const assets='dist/client/assets';
await mkdir('dist/server/generated',{recursive:true});
let source=await readFile(`${assets}/index-RLaEwmsK.js`,'utf8');
source=extractModule(source,['D','gt','it','ct','bt','yt'])+'export {D as catalog,gt as toSpec,it as disabledFields,ct as parseLook,bt as serialize,yt as parseQuery};';
let renderer=await readFile(`${assets}/draw-worker-CFe3JlME.js`,'utf8');
const transport=renderer.indexOf(',Fv=self;');
if(transport<0)throw Error('Renderer extraction anchor changed');
renderer=extractModule(renderer.slice(0,transport)+';',['Xd','Nv'],true);
renderer+='export async function renderAvatar(spec,size){await Xd(spec);return Nv(spec,{size});}';
const inputs=[['domain',source],['renderer',renderer]];
try {
 for(const [name,text] of inputs){
  const entry=`${assets}/mcp-${name}.temporary.js`;
  await writeFile(entry,text);
  await build({entryPoints:[entry],outfile:`dist/server/generated/${name}.js`,bundle:true,format:'esm',platform:'browser',minify:true});
 }
 await build({entryPoints:['src/mcp/server.mjs'],outfile:'dist/server/mcp.js',bundle:true,format:'esm',platform:'browser',minify:true,external:['./resvg.wasm'],plugins:[{name:'shared-editor-modules',setup(build){build.onResolve({filter:/generated\/(domain|renderer)\.js$/},args=>({path:resolve(assets,`mcp-${args.path.match(/(domain|renderer)\.js$/)[1]}.temporary.js`)}));}}]});
}finally{for(const [name]of inputs)await rm(`${assets}/mcp-${name}.temporary.js`,{force:true});}
await copyFile('node_modules/@resvg/resvg-wasm/index_bg.wasm','dist/server/resvg.wasm');
