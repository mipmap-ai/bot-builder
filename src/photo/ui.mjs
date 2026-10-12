import {FaceDetector,FaceLandmarker,ImageSegmenter,FilesetResolver} from '@mediapipe/tasks-vision';
import {photoStore,photoCatalog,parsePhotoLook} from '/assets/index-RLaEwmsK.js';
import {makeGroups,closestColor,validateMatches,chooseHead,normalizeImageSize} from './matching.mjs';
import {regionPixels,representativeColor,illuminationGains,correctColor,categoryBounds,faceDimensions,hairGeometry,irisColor} from './regions.mjs';
let detectorPromise;
let analysisPromise;
let worker;
let operation=0;
let selected;
let previewUrl;
let busy=false;
let matchOutcome="idle";
let matchError=null;
let cancelMatch;
const dialog=document.createElement('dialog');
dialog.className='photo-match-sheet';
dialog.setAttribute('aria-labelledby','photo-match-title');
dialog.innerHTML=`<form class="photo-match-body" method="dialog">
 <div class="photo-match-head"><h2 id="photo-match-title">Create a bot from a photo</h2><button type="button" class="photo-match-close" aria-label="Close photo matching">×</button></div>
 <p class="photo-match-hint">Choose a clear photo of one person, with their hair visible.</p>
 <label class="photo-match-upload"><input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a person's photo"><span class="photo-match-upload-label">Choose photo</span><span class="photo-match-formats">JPG, PNG or WebP · up to 12 MB</span></label>
 <div class="photo-match-preview" hidden><img alt="Photo to match"><button type="button" class="photo-match-change">Change photo</button></div>
 <p class="photo-match-private">Your photo stays on this device. First use may take a minute.</p>
 <p class="photo-match-status" role="status" aria-live="polite"></p>
 <p class="photo-match-error" role="alert" hidden></p>
 <button type="button" class="photo-match-create" disabled>Create bot</button>
 <p class="photo-match-footnote">We'll choose the closest available bot parts. You can adjust or undo the result.</p>
 </form>`;
document.body.append(dialog);
const input=dialog.querySelector('input');
const create=dialog.querySelector('.photo-match-create');
const preview=dialog.querySelector('.photo-match-preview');
const image=preview.querySelector('img');
const status=dialog.querySelector('.photo-match-status');
const error=dialog.querySelector('.photo-match-error');
const upload=dialog.querySelector('.photo-match-upload');
const toast=document.createElement('div');toast.className='photo-match-toast';toast.setAttribute('role','status');toast.hidden=true;document.body.append(toast);
let toastTimer;
function showError(message){error.textContent=message;error.hidden=false;status.textContent='';}
function setBusy(value){busy=value;create.disabled=value||!selected;create.textContent=value?'Matching photo…':'Create bot';input.disabled=value;dialog.querySelector('.photo-match-change').disabled=value;dialog.setAttribute('aria-busy',String(value));}
function reset(){if(busy&&matchOutcome==="matching")matchOutcome="cancelled";operation++;cancelMatch?.();cancelMatch=null;worker?.terminate();worker=null;selected=null;input.value='';preview.hidden=true;upload.hidden=false;image.removeAttribute('src');if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;status.textContent='';error.hidden=true;setBusy(false);}
function close(){dialog.close();}
dialog.querySelector('.photo-match-close').onclick=close;
dialog.addEventListener('close',reset);
dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
dialog.querySelector('.photo-match-change').onclick=()=>input.click();
input.addEventListener('change',async()=>{
 const selectionToken=++operation;
 error.hidden=true;status.textContent='';matchOutcome='idle';matchError=null;const file=input.files?.[0];selected=null;create.disabled=true;
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){showError('Choose a JPG, PNG or WebP photo.');return;}
 if(file.size>12*1024*1024){showError('That photo is too large. Choose one smaller than 12 MB.');return;}
 let bitmap;
 try {
  bitmap=await createImageBitmap(file);
  if(selectionToken!==operation)return;
  const size=normalizeImageSize(bitmap.width,bitmap.height);
  const canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
  canvas.getContext('2d').drawImage(bitmap,0,0,size.width,size.height);
  const raster=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not preview that photo.')),'image/png'));
  if(selectionToken!==operation)return;
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(raster);image.src=previewUrl;selected=file;preview.hidden=false;upload.hidden=true;create.disabled=false;
 }catch(failure){if(selectionToken===operation)showError('Could not read that image. Choose a JPG, PNG or WebP photo.');}
 finally{bitmap?.close();}
});

function crop(source,x,y,width,height){
 x=Math.max(0,Math.min(source.width-1,x));y=Math.max(0,Math.min(source.height-1,y));
 width=Math.max(1,Math.min(source.width-x,width));height=Math.max(1,Math.min(source.height-y,height));
 const canvas=document.createElement('canvas');const size=normalizeImageSize(width,height,384);canvas.width=size.width;canvas.height=size.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,x,y,width,height,0,0,canvas.width,canvas.height);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height);return {canvas,data:pixels.data,width:canvas.width,height:canvas.height};
}
async function detect(source){
 detectorPromise??=(async()=>{
  const files=await FilesetResolver.forVisionTasks('/photo/vision');
  return FaceDetector.createFromOptions(files,{baseOptions:{modelAssetPath:'/photo/face-detector.tflite',delegate:'CPU'},runningMode:'IMAGE',minDetectionConfidence:.5});
 })();
 try{return (await detectorPromise).detect(source);}catch(error){detectorPromise=null;throw error;}
}
async function analyze(source){
 analysisPromise??=(async()=>{
  const files=await FilesetResolver.forVisionTasks('/photo/vision');
  const segmenter=await ImageSegmenter.createFromOptions(files,{baseOptions:{modelAssetPath:'/photo/selfie-multiclass.tflite',delegate:'CPU'},runningMode:'IMAGE',outputCategoryMask:true,outputConfidenceMasks:false});
  const landmarker=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'/photo/face-landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:2});
  return {segmenter,landmarker};
 })();
 try{
  const {segmenter,landmarker}=await analysisPromise;
  const faces=landmarker.detect(source).faceLandmarks;
  const result=segmenter.segment(source);
  try{
   const mask=result.categoryMask.getAsUint8Array().slice();
   const width=result.categoryMask.width,height=result.categoryMask.height;
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0,width,height);
   const pixels=context.getImageData(0,0,width,height).data;
   return {mask,width,height,pixels,faces};
  }finally{result.close();}
 }catch(error){analysisPromise=null;throw error;}
}
function isolated(source,analysis,categories){
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0);
 const data=context.getImageData(0,0,canvas.width,canvas.height);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const category=analysis.mask[Math.floor(y/canvas.height*analysis.height)*analysis.width+Math.floor(x/canvas.width*analysis.width)];
  if(!categories.includes(category)){const index=(y*canvas.width+x)*4;data.data[index]=data.data[index+1]=data.data[index+2]=127;}
 }
 context.putImageData(data,0,0);return canvas;
}
async function match(crops,groups,token){
 worker??=new Worker('/photo/worker.js?v=2',{type:'module'});
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{cancelMatch=null;worker?.terminate();worker=null;reject(Error('Matching took too long. Check your connection and try again.'));},300000);
  cancelMatch=()=>{clearTimeout(timeout);reject(new DOMException('Matching cancelled.','AbortError'));};
  worker.onmessage=({data})=>{if(token!==operation)return;
   if(data.type==='progress')status.textContent=data.message;
   else if(data.type==='result'){clearTimeout(timeout);cancelMatch=null;resolve(data.matches);}
   else if(data.type==='error'){clearTimeout(timeout);cancelMatch=null;worker?.terminate();worker=null;reject(Error('The matching model could not load or run. Check your connection and try again.'));}
  };
  worker.onerror=()=>{clearTimeout(timeout);cancelMatch=null;worker?.terminate();worker=null;reject(Error('Photo matching is unavailable in this browser. Try an updated Chrome, Edge or Safari.'));};
  worker.postMessage({crops,groups});
 });
}
export async function matchSelectedPhoto(){
 if(busy)throw Error("Photo matching is already running.");
 if(!selected)throw Error("Select a photo in the photo dialog first.");
 const token=++operation;matchOutcome='matching';matchError=null;setBusy(true);error.hidden=true;status.textContent='Finding the face…';let bitmap;
 try{
  bitmap=await createImageBitmap(selected);if(token!==operation)return;
  const size=normalizeImageSize(bitmap.width,bitmap.height);const source=document.createElement('canvas');source.width=size.width;source.height=size.height;
  source.getContext('2d').drawImage(bitmap,0,0,size.width,size.height);bitmap.close();bitmap=null;
  const detection=await detect(source);if(token!==operation)return;
  if(detection.detections.length===0)throw Error('No clear face found. Choose a brighter photo with the face looking toward the camera.');
  if(detection.detections.length>1)throw Error('More than one face found. Crop the photo to the person you want to match.');
  const box=detection.detections[0].boundingBox;
  const {originX:x,originY:y,width:w,height:h}=box;
  status.textContent='Separating hair, skin and clothing…';
  const analysis=await analyze(source);if(token!==operation)return;
  const skinSamples=regionPixels(analysis.pixels,analysis.mask,3);
  const hairSamples=regionPixels(analysis.pixels,analysis.mask,1);
  const clothingSamples=regionPixels(analysis.pixels,analysis.mask,4);
  const gains=illuminationGains(clothingSamples);
  const skin=correctColor(representativeColor(skinSamples,.9),gains);
  const sampledHair=representativeColor(hairSamples,.3);
  const outfitColor=correctColor(representativeColor(clothingSamples,.6),gains);
  const outfitVisible=clothingSamples.length>150;
  const hairBounds=categoryBounds(analysis.mask,analysis.width,analysis.height,[1,3]);
  const outfitBounds=categoryBounds(analysis.mask,analysis.width,analysis.height,[4]);
  const person=isolated(source,analysis,[1,2,3,4,5]);
  const headSource=isolated(source,analysis,[1,3,5]);
  const clothingSource=isolated(source,analysis,[4]);
  const bounded=(canvas,bounds,fallback)=>bounds?crop(canvas,bounds.x*source.width-w*.12,bounds.y*source.height-h*.12,bounds.width*source.width+w*.24,bounds.height*source.height+h*.24):fallback;
  const portrait=bounded(headSource,hairBounds,crop(person,x-w*.35,y-h*.7,w*1.7,h*2));
  const hair=portrait;
  const hairContext=bounded(source,hairBounds,crop(source,x-w*.4,y-h*.8,w*1.8,h*2.4));
  const face=crop(headSource,x-w*.1,y-h*.05,w*1.2,h*1.15);
  const eyes=crop(source,x+w*.05,y+h*.22,w*.9,h*.3);
  const outfit=bounded(clothingSource,outfitBounds,crop(person,x-w*.8,y+h*.6,w*2.6,h*1.4));
  const outfitContext=bounded(source,outfitBounds,outfit);
  const geometry=hairGeometry(analysis,analysis.faces[0]);
  const eyeSample=irisColor(source.getContext("2d").getImageData(0,0,source.width,source.height).data,source.width,source.height,analysis.faces[0]);
  const serialize=part=>({data:part.data,width:part.width,height:part.height});
  const predicted=await match({portrait:serialize(portrait),hair:[serialize(hairContext),serialize(hair)],face:serialize(face),outfit:[serialize(outfitContext),serialize(outfit)],eyes:serialize(eyes)},makeGroups(photoCatalog,outfitVisible,!eyeSample&&w>=180,geometry).filter(group=>!sampledHair||group.key!=='hairColor'),token);
  if(eyeSample)predicted.eyeColor=closestColor(eyeSample,photoCatalog.eyeColor.entries);
  if(geometry.long&&predicted.hair==='messy-bun')predicted.hair='ponytail';
  if(sampledHair)predicted.hairColor=closestColor(sampledHair,photoCatalog.hairColor.entries);
  const matches=validateMatches(predicted,photoCatalog);
  if(token!==operation)return;
  const look={...photoStore.getState().look,...matches,head:analysis.faces[0]?chooseHead(faceDimensions(analysis.faces[0],source.width,source.height)):"classic",character:'bot',blush:'skin',held:'none'};
  if(skin)look.skin=closestColor(skin,photoCatalog.skin.entries);
  if(outfitColor)look.outfitColor=closestColor(outfitColor,photoCatalog.outfitColor.entries);
  photoStore.getState().load(parsePhotoLook(look));
  const names=['hair','hairColor','skin','accessory','beard'].map(key=>photoCatalog[key].entries.find(e=>e.id===look[key])?.label).filter(label=>label&&label!=='None');
  matchOutcome='complete';close();toast.textContent=`Photo matched · ${names.join(' · ')}. Fine-tune any part or use Undo.`;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,10000);
  return {matched:true};
 }catch(failure){if(token===operation){matchOutcome='failed';matchError=failure.message||'Could not read that photo. Try another photo.';showError(matchError);}throw failure;}
 finally{bitmap?.close();if(token===operation)setBusy(false);}
}
create.onclick=()=>{void matchSelectedPhoto().catch(()=>{});};
export function openPhotoMatch(){dialog.showModal();input.focus();return getPhotoMatchStatus();}
export function getPhotoMatchStatus(){return {open:dialog.open,photoSelected:!!selected,busy,outcome:matchOutcome,...(matchError?{error:matchError}:{})};}
export function startSelectedPhotoMatch(){
 if(busy)throw Error('Photo matching is already running.');
 if(!selected)throw Error('Select a photo in the photo dialog first.');
 void matchSelectedPhoto().then(result=>{if(!result?.matched&&matchOutcome==='matching')matchOutcome='cancelled';}).catch(()=>{});
 return {started:true,...getPhotoMatchStatus()};
}
function mount(){
 const actions=document.querySelector('.stage-actions');if(!actions||actions.querySelector('.photo-match-open'))return;
 const button=document.createElement('button');button.type='button';button.className='pill photo-match-open';button.setAttribute('aria-label','Create bot from photo');button.setAttribute('aria-haspopup','dialog');button.title='Create bot from photo';
 button.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 4-4 5 5"/></svg><span class="photo-match-label">Photo match</span>';
 button.onclick=openPhotoMatch;actions.prepend(button);
}
mount();new MutationObserver(mount).observe(document.getElementById('root'),{childList:true,subtree:true});
