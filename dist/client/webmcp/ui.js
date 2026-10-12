import {photoStore,photoCatalog,parsePhotoLook,toBotSpec,disabledBotFields,serializeBotLook} from '/assets/index-RLaEwmsK.js';
import {n as exports,r as svgToPng} from '/assets/export-6cYnj8PJ.js';
import {openPhotoMatch,getPhotoMatchStatus,startSelectedPhotoMatch} from '/photo/ui.js?v=2';
import {createTools} from './tools.mjs';

const settle=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
async function exportAvatar(format,size){
  const worker=new Worker('/assets/draw-worker-CFe3JlME.js',{type:'module'});
  try {
    const rendered=await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('Avatar rendering timed out.')),30000);
      worker.onmessage=({data})=>{clearTimeout(timeout);data.error?reject(Error(data.error)):resolve(data);};
      worker.onerror=()=>{clearTimeout(timeout);reject(Error('Avatar rendering failed.'));};
      worker.postMessage({id:1,spec:toBotSpec(photoStore.getState().look),size});
    });
    const blob=format==='png'?await svgToPng(rendered.svg,rendered.width,rendered.height):new Blob([rendered.svg],{type:'image/svg+xml'});
    const filename=exports.makeExportFilename(format);
    exports.downloadBlob(blob,filename);
    return {filename,format,width:rendered.width,height:rendered.height};
  } finally {worker.terminate();}
}
const registry=document.modelContext;
let lifecycle;
function registerTools(){
  if(typeof registry?.registerTool!=='function'||!document.querySelector('.editor'))return false;
  lifecycle?.abort();
  lifecycle=new AbortController();
  const tools=createTools({catalog:photoCatalog,state:()=>photoStore.getState(),parse:parsePhotoLook,toSpec:toBotSpec,disabled:disabledBotFields,serialize:serializeBotLook,settle,exportAvatar,photo:{open:openPhotoMatch,status:getPhotoMatchStatus,match:startSelectedPhotoMatch}});
  for(const tool of tools){try{Promise.resolve(registry.registerTool(tool,{signal:lifecycle.signal})).catch(error=>console.warn('WebMCP registration failed:',tool.name,error));}catch(error){console.warn('WebMCP registration failed:',tool.name,error);}}
  return true;
}
if(typeof registry?.registerTool==='function'){
  if(!registerTools()){
    const observer=new MutationObserver(()=>{if(registerTools())observer.disconnect();});
    observer.observe(document.getElementById('root'),{childList:true,subtree:true});
    addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  }
  addEventListener('pagehide',()=>lifecycle?.abort());
  addEventListener('pageshow',event=>{if(event.persisted)registerTools();});
}
