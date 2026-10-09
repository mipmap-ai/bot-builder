import {FaceDetector,FilesetResolver} from '@mediapipe/tasks-vision';
import {photoStore,photoCatalog,parsePhotoLook} from '/assets/index-RLaEwmsK.js';
import {makeGroups,closestColor,validateMatches,chooseHead,normalizeImageSize} from './matching.mjs';
let detectorPromise;
let worker;
let operation=0;
let selected;
let previewUrl;
let busy=false;
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
function reset(){operation++;cancelMatch?.();cancelMatch=null;worker?.terminate();worker=null;selected=null;input.value='';preview.hidden=true;upload.hidden=false;image.removeAttribute('src');if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;status.textContent='';error.hidden=true;setBusy(false);}
function close(){dialog.close();}
dialog.querySelector('.photo-match-close').onclick=close;
dialog.addEventListener('close',reset);
dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
dialog.querySelector('.photo-match-change').onclick=()=>input.click();
input.addEventListener('change',()=>{
 error.hidden=true;status.textContent='';const file=input.files?.[0];selected=null;create.disabled=true;
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){showError('Choose a JPG, PNG or WebP photo.');return;}
 if(file.size>12*1024*1024){showError('That photo is too large. Choose one smaller than 12 MB.');return;}
 if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);image.src=previewUrl;selected=file;preview.hidden=false;upload.hidden=true;create.disabled=false;
});
function crop(source,x,y,width,height){
 x=Math.max(0,Math.min(source.width-1,x));y=Math.max(0,Math.min(source.height-1,y));
 width=Math.max(1,Math.min(source.width-x,width));height=Math.max(1,Math.min(source.height-y,height));
 const canvas=document.createElement('canvas');const size=normalizeImageSize(width,height,384);canvas.width=size.width;canvas.height=size.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,x,y,width,height,0,0,canvas.width,canvas.height);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height);return {canvas,data:pixels.data,width:canvas.width,height:canvas.height};
}
function sampleColor(source,regions,isSkin=false){
 const samples=[];
 for(const region of regions){
  const part=crop(source,...region);const data=part.data;
  for(let i=0;i<data.length;i+=16){const r=data[i],g=data[i+1],b=data[i+2];if(data[i+3]<240)continue;
   if(isSkin&&(r<g*.9||r<b*.96||Math.max(r,g,b)-Math.min(r,g,b)<5))continue;
   samples.push([r,g,b]);
  }
 }
 if(!samples.length)return null;
 const median=channel=>{const values=samples.map(rgb=>rgb[channel]).sort((a,b)=>a-b);return values[Math.floor(values.length/2)];};
 return [median(0),median(1),median(2)];
}
async function detect(source){
 detectorPromise??=(async()=>{
  const files=await FilesetResolver.forVisionTasks('/photo/vision');
  return FaceDetector.createFromOptions(files,{baseOptions:{modelAssetPath:'/photo/face-detector.tflite',delegate:'CPU'},runningMode:'IMAGE',minDetectionConfidence:.5});
 })();
 try{return (await detectorPromise).detect(source);}catch(error){detectorPromise=null;throw error;}
}
async function match(crops,groups,token){
 worker??=new Worker('/photo/worker.js',{type:'module'});
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
create.onclick=async()=>{
 if(busy||!selected)return;
 const token=++operation;setBusy(true);error.hidden=true;status.textContent='Finding the face…';let bitmap;
 try{
  bitmap=await createImageBitmap(selected);if(token!==operation)return;
  const size=normalizeImageSize(bitmap.width,bitmap.height);const source=document.createElement('canvas');source.width=size.width;source.height=size.height;
  source.getContext('2d').drawImage(bitmap,0,0,size.width,size.height);bitmap.close();bitmap=null;
  const detection=await detect(source);if(token!==operation)return;
  if(detection.detections.length===0)throw Error('No clear face found. Choose a brighter photo with the face looking toward the camera.');
  if(detection.detections.length>1)throw Error('More than one face found. Crop the photo to the person you want to match.');
  const box=detection.detections[0].boundingBox;
  const {originX:x,originY:y,width:w,height:h}=box;
  const skin=sampleColor(source,[[x+w*.16,y+h*.53,w*.16,h*.14],[x+w*.67,y+h*.53,w*.16,h*.14],[x+w*.4,y+h*.2,w*.2,h*.13]],true);
  const sampledHair=sampleColor(source,[[x+w*.22,y-h*.28,w*.55,h*.19]]);
  const outfitVisible=source.height>y+h*1.5;
  const outfitColor=outfitVisible?sampleColor(source,[[x+w*.15,y+h*1.3,w*.7,Math.min(h*.45,source.height-y-h*1.3)]]):null;
  const portrait=crop(source,x-w*.25,y-h*.45,w*1.5,h*1.55);
  const hair=crop(source,x-w*.25,y-h*.45,w*1.5,h*1.4);
  const face=crop(source,x-w*.1,y-h*.05,w*1.2,h*1.15);
  const eyes=crop(source,x+w*.05,y+h*.22,w*.9,h*.3);
  const outfit=crop(source,x-w*.5,y+h*.95,w*2,Math.min(h*1.6,source.height-y-h*.95));
  const serialize=part=>({data:part.data,width:part.width,height:part.height});
  const predicted=await match({portrait:serialize(portrait),hair:serialize(hair),face:serialize(face),outfit:serialize(outfit),eyes:serialize(eyes)},makeGroups(photoCatalog,outfitVisible,w>=180).filter(group=>!sampledHair||group.key!=='hairColor'),token);
  if(sampledHair)predicted.hairColor=closestColor(sampledHair,photoCatalog.hairColor.entries);
  const matches=validateMatches(predicted,photoCatalog);
  if(token!==operation)return;
  const look={...photoStore.getState().look,...matches,head:chooseHead(box),character:'bot',blush:'skin',held:'none'};
  if(skin)look.skin=closestColor(skin,photoCatalog.skin.entries);
  if(outfitColor)look.outfitColor=closestColor(outfitColor,photoCatalog.outfitColor.entries);
  photoStore.getState().load(parsePhotoLook(look));
  const names=['hair','hairColor','skin','accessory','beard'].map(key=>photoCatalog[key].entries.find(e=>e.id===look[key])?.label).filter(label=>label&&label!=='None');
  close();toast.textContent=`Photo matched · ${names.join(' · ')}. Fine-tune any part or use Undo.`;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,10000);
 }catch(failure){if(token===operation)showError(failure.message||'Could not read that photo. Try another photo.');}
 finally{bitmap?.close();if(token===operation)setBusy(false);}
};
function mount(){
 const actions=document.querySelector('.stage-actions');if(!actions||actions.querySelector('.photo-match-open'))return;
 const button=document.createElement('button');button.type='button';button.className='pill photo-match-open';button.setAttribute('aria-label','Create bot from photo');button.setAttribute('aria-haspopup','dialog');button.title='Create bot from photo';
 button.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 4-4 5 5"/></svg><span class="photo-match-label">Photo match</span>';
 button.onclick=()=>{dialog.showModal();input.focus();};actions.prepend(button);
}
mount();new MutationObserver(mount).observe(document.getElementById('root'),{childList:true,subtree:true});
