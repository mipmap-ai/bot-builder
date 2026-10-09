import {copyFile} from 'node:fs/promises';
await copyFile('src/rabbit/character.mjs','dist/client/assets/rabbit.js');
console.log('Rabbit character built.');
