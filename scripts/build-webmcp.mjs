import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/client/webmcp',{recursive:true});
await copyFile('src/webmcp/tools.mjs','dist/client/webmcp/tools.mjs');
await copyFile('src/webmcp/ui.mjs','dist/client/webmcp/ui.js');
