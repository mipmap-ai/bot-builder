import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {handleApi} from './dist/server/index.js';
const root=resolve('dist/client');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const storage={async put(key,value){const file=resolve('.local-data',key);await mkdir(resolve(file,'..'),{recursive:true});await writeFile(file,value,{mode:0o600});}};
http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost:5173');
  if(url.pathname.startsWith('/api/')){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>16000){res.writeHead(413);res.end();return;}}
   const request=new Request(url,{method:req.method,headers:req.headers,...(body?{body}: {})});
   const result=await handleApi(request,storage);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;
  }
  let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403);res.end();return;}
  if(url.pathname==='/'||!extname(file))file=resolve(root,'index.html');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));
