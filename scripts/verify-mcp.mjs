import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const base=process.argv[2]||'http://127.0.0.1:8787';
const client=new Client({name:'bot-builder-verification',version:'1.0.0'});
await client.connect(new StreamableHTTPClientTransport(new URL('/mcp',base)));
try{
 const tools=(await client.listTools()).tools;assert.equal(tools.length,6);
 const call=async(name,args={})=>{const response=await client.callTool({name,arguments:args});assert.ok(!response.isError,JSON.stringify(response));return JSON.parse(response.content[0].text);};
 const options=await call('get_bot_options');assert.ok(options.options.outfit.entries.some(e=>e.id==='tuxedo'));assert.deepEqual(options.options.held.entries.map(e=>e.id),['none']);
 const created=await call('create_bot',{selections:{character:'rabbit',eyeColor:'blue',outfit:'tuxedo',frame:'front-center'}});
 assert.equal(created.url,'https://botbuilder.mipmap.ai/?character=rabbit&eyeColor=blue&outfit=tuxedo&frame=front-center');
 const edit=await call('edit_bot',{url:created.url,selections:{eyeColor:'green'}});assert.equal(edit.selections.eyeColor,'green');
 const migrated=await call('get_bot_share_link',{url:'?held=sweet-potato'});assert.equal(migrated.selections.held,'none');
 await call('randomize_bot');
 const invalid=await client.callTool({name:'create_bot',arguments:{selections:{character:'rabbit',skin:'porcelain'}}});assert.ok(invalid.isError);
 for(const format of ['svg','png'])for(const size of [1024,2048]){
  const exported=await call('export_bot',{url:created.url,format,size});
  const path=new URL(exported.downloadUrl);const response=await fetch(new URL(path.pathname+path.search,base));assert.equal(response.status,200);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(format==='png'){assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);}
  else assert.match(bytes.toString(),new RegExp(`width="${size}"`));
 }
 assert.equal((await fetch(new URL('/api/bot.png?size=9999',base))).status,400);
 assert.equal((await fetch(new URL('/mcp',base),{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(new URL('/api/feedback/config',base))).status,200);
 assert.equal((await fetch(new URL('/',base))).status,200);
 console.log(`PASS: ${tools.length} MCP tools, legacy links, SVG/PNG 1024/2048, invalid inputs, origin protection, and site/feedback routes at ${base}`);
}finally{await client.close();}
