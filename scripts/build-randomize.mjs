import {copyFile} from 'node:fs/promises';
await copyFile('src/randomize/randomize.mjs','dist/client/assets/randomize.js');
console.log('Randomizer built.');
