import {selectPrediction} from './matching.mjs';
import {pipeline,env,RawImage} from '@huggingface/transformers';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths=new URL('/photo/ort/',self.location.origin).href;
let classifier;
let lastProgress=0;
self.onmessage=async({data})=>{
 try{
  classifier??=await pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32',{
   revision:'d15189d7028b43f1d3e65039190477f6af591c2a',dtype:'q8',device:'wasm',
   progress_callback:event=>{
    if(Date.now()-lastProgress<350&&event.status!=='ready')return;lastProgress=Date.now();
    if(event.status==='progress')postMessage({type:'progress',message:`Preparing photo matching${event.progress?` · ${Math.round(event.progress)}%`:''}`});
   }
  });
  const matches={};
  for(let i=0;i<data.groups.length;i++){
   const group=data.groups[i],crop=data.crops[group.region];
   postMessage({type:'progress',message:`Matching ${group.key==='hairColor'?'hair color':group.key} · ${i+1} of ${data.groups.length}`});
   const image=new RawImage(new Uint8ClampedArray(crop.data),crop.width,crop.height,4);
   const predictions=await classifier(image,group.choices.map(e=>e.text),{hypothesis_template:'{}'});
   matches[group.key]=selectPrediction(group.key,predictions,group.choices);
  }
  postMessage({type:'result',matches});
 }catch(error){console.error('Photo matcher:',error.message);postMessage({type:'error',message:error.message||'Photo matching failed.'});}
};
