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
   const variants=Array.isArray(crop)?crop:[crop];
   const scores=new Map();
   for(let variant=0;variant<variants.length;variant++){
    const part=variants[variant];
    const image=new RawImage(new Uint8ClampedArray(part.data),part.width,part.height,4);
    const result=await classifier(image,group.choices.map(e=>e.text),{hypothesis_template:'{}'});
    const weight=variants.length===1?1:variant===0?.8:.2;
    for(const prediction of result)scores.set(prediction.label,(scores.get(prediction.label)||0)+prediction.score*weight);
   }
   const predictions=[...scores].map(([label,score])=>({label,score})).sort((a,b)=>b.score-a.score);
   matches[group.key]=selectPrediction(group.key,predictions,group.choices);
  }
  postMessage({type:'result',matches});
 }catch(error){console.error('Photo matcher:',error.message);postMessage({type:'error',message:error.message||'Photo matching failed.'});}
};
