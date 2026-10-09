import {build} from 'esbuild';
import {cp,mkdir} from 'node:fs/promises';
const output='dist/client/photo';
await mkdir(output,{recursive:true});
await build({entryPoints:['src/photo/worker.mjs'],outfile:`${output}/worker.js`,bundle:true,format:'esm',platform:'browser',minify:true,alias:{'onnxruntime-web/webgpu':'onnxruntime-web/wasm'}});
await build({entryPoints:['src/photo/ui.mjs'],outfile:`${output}/ui.js`,bundle:true,format:'esm',platform:'browser',minify:true,external:['/assets/index-RLaEwmsK.js']});
for(const file of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])await cp(`node_modules/onnxruntime-web/dist/${file}`,`${output}/ort/${file}`);
for(const file of ['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm'])await cp(`node_modules/@mediapipe/tasks-vision/wasm/${file}`,`${output}/vision/${file}`);
console.log('Photo matching assets built.');
