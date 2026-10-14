import {catalog,toSpec,disabledFields,parseLook,serialize,parseQuery} from '../../dist/server/generated/domain.js';
import {renderAvatar} from '../../dist/server/generated/renderer.js';
import {applyWorldSelection} from '../../dist/client/assets/world-selection.js';
import {randomizeLook} from '../randomize/randomize.mjs';
export {catalog,renderAvatar,toSpec};
export const baseUrl='https://botbuilder.mipmap.ai/';
export function resolveBot(selections={},url){
 const base=url?readLink(url):Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,group.defaultId]));
 for(const [key,value]of Object.entries(selections))if(!catalog[key]?.entries.some(entry=>entry.id===value))throw Error(`Invalid selection: ${key}. Use get_bot_options.`);
 const look=applyWorldSelection(base,parseLook({...base,...selections}),catalog);
 const unavailable=disabledFields(toSpec(look));
 for(const key of Object.keys(selections))if(unavailable.has(key))throw Error(`${key} is unavailable for this character.`);
 return look;
}
function readLink(input){
 const url=new URL(input,baseUrl);
 if(!['botbuilder.mipmap.ai','botpfp-copy-brett.bhamlin.chatgpt.site'].includes(url.hostname)||!['https:'].includes(url.protocol))throw Error('Use a Bot Builder share URL or query string.');
 return parseQuery(url.search);
}
export function describeBot(look){return {selections:look,unavailableFields:[...disabledFields(toSpec(look))],url:baseUrl+serialize(look)};}
export function randomBot(){return applyWorldSelection(resolveBot(),randomizeLook({catalog,toSpec,disabledFields},Math.random),catalog);}
export function exportUrl(look,format,size){return `${baseUrl}api/bot.${format}${serialize(look)||'?'}${serialize(look)?'&':''}size=${size}`;}
