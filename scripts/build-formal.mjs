import {copyFile,readFile,writeFile} from 'node:fs/promises';
await copyFile('src/formal/parts.mjs','dist/client/assets/formal-parts.js');
const svg=await readFile('src/formal/tuxedo.svg','utf8');
await writeFile('dist/client/assets/tuxedo.js',`export default ${JSON.stringify(svg)};\n`);
console.log('Penguin and Tuxedo built.');
