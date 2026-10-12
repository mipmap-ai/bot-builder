import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {z} from 'zod/v3';
import {Resvg,initWasm} from '@resvg/resvg-wasm';
import wasm from './resvg.wasm';
import {catalog,resolveBot,describeBot,randomBot,exportUrl,renderAvatar,toSpec} from './bot.mjs';
const selections=z.object(Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,z.enum(group.entries.map(entry=>entry.id)).optional()]))).strict();
const botInput={selections:selections.optional(),url:z.string().max(8000).optional()};
const result=data=>({content:[{type:'text',text:JSON.stringify(data)}]});
export function createServer(){
 const server=new McpServer({name:'bot-builder',version:'1.0.0'});
 const register=(name,description,inputSchema,execute)=>server.registerTool(name,{description,inputSchema:z.object(inputSchema).strict(),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:name!=='randomize_bot',openWorldHint:false}},async input=>{try{return result(await execute(input));}catch(error){return {isError:true,content:[{type:'text',text:error.message}]};}});
 register('get_bot_options','List valid option IDs, labels, colors and defaults. IDs are stable; availability depends on character.',{},()=>({options:Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,{label:group.label,defaultId:group.defaultId,entries:group.entries.map(({id,label,color})=>({id,label,...(color?{color}:{})}))}]))}));
 register('create_bot','Create a bot from valid option IDs. Omitted fields use existing defaults. Returns selections and a share URL.',botInput,input=>describeBot(resolveBot(input.selections,input.url)));
 register('edit_bot','Edit a supplied Bot Builder share URL with valid selections. Returns a new URL; does not change a browser editor.',{url:z.string().max(8000),selections},input=>describeBot(resolveBot(input.selections,input.url)));
 register('randomize_bot','Create a random bot using the existing valid-combination rules.',{},()=>describeBot(randomBot()));
 register('get_bot_share_link','Return the full production share URL for supplied selections or an existing share URL.',botInput,input=>describeBot(resolveBot(input.selections,input.url)));
 register('export_bot','Return a public SVG or PNG download URL rendered with the existing artwork. No files are stored.',{...botInput,format:z.enum(['svg','png']),size:z.union([z.literal(1024),z.literal(2048)]).default(1024)},input=>({...describeBot(resolveBot(input.selections,input.url)),downloadUrl:exportUrl(resolveBot(input.selections,input.url),input.format,input.size),mimeType:input.format==='svg'?'image/svg+xml':'image/png'}));
 return server;
}
let initialized;
export async function handleMcp(request){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origin not allowed'},{status:403});
 const server=createServer();
 const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true,maxRequestBodySize:32768});
 await server.connect(transport);
 try{return await transport.handleRequest(request);}finally{await server.close();}
}
export async function handleImage(request){
 if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET'}});
 try{
  const url=new URL(request.url);
  const size=Number(url.searchParams.get('size')||1024);
  if(![1024,2048].includes(size))throw Error('Use size 1024 or 2048.');
  const input=Object.fromEntries(url.searchParams);delete input.size;
  // Resolve URL migrations before rendering retired selections.
  for(const key of Object.keys(input))if(!Object.hasOwn(catalog,key))throw Error('Unknown option.');
  const look=resolveBot({},'?'+new URLSearchParams(input));
  const {svg}=await renderAvatar(toSpec(look),size);
  const png=url.pathname.endsWith('.png');
  let body=svg;
  if(png){
   initialized??=initWasm(wasm);await initialized;
   const renderer=new Resvg(svg);let image;
   try{image=renderer.render();body=image.asPng();}finally{image?.free();renderer.free();}
  }
  return new Response(body,{headers:{'Content-Type':png?'image/png':'image/svg+xml','Content-Disposition':`attachment; filename="bot-builder.${png?'png':'svg'}"`,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }catch(error){return Response.json({error:error.message},{status:400});}
}
