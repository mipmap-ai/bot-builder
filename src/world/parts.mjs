import {worldOutfitDefinitions,worldOutfitEntries,worldOutfitArt,retiredWorldOutfits} from './outfits.mjs';
import {worldAccessories,worldAccessoryLoaders,worldGroups} from './accessories.mjs';
import {worldHair,worldHairEntries,worldHairLoaders} from './hair.mjs';
export {retiredWorldOutfits,worldOutfitDefinitions,worldOutfitEntries,worldAccessoryLoaders,worldHairLoaders,worldGroups};
export const worldOutfitLoaders=Object.fromEntries(Object.entries(worldOutfitArt).map(([id,art])=>[id,async()=>art]));
export function extendWorldMetadata(metadata){return {...metadata,hair:{...metadata.hair,...Object.fromEntries(Object.entries(worldHair).map(([id,{label}])=>[id,{id,label}]))},accessory:{...metadata.accessory,...Object.fromEntries(Object.entries(worldAccessories).map(([id,{label,seat}])=>[id,{id,label,slot:seat.slot}]))}};}
export const worldFabricColors=[['red','#B93448'],['teal','#358C90'],['emerald','#24735B'],['saffron','#D69F42'],['violet','#71538F'],['rose','#AD3E71']].map(([id,color],index)=>({id,label:id[0].toUpperCase()+id.slice(1),color,order:10+index}));
export function extendWorldCatalog(catalog){return {...catalog,outfitColor:{...catalog.outfitColor,...Object.fromEntries(worldFabricColors.map(entry=>[entry.id,entry]))},outfit:{...catalog.outfit,...Object.fromEntries(worldOutfitEntries.map(entry=>[entry.id,entry]))},hair:{...Object.fromEntries(Object.entries(catalog.hair).map(([id,entry])=>[id,entry.order===undefined?{...entry,order:100}:entry])),...Object.fromEntries(worldHairEntries.map(entry=>[entry.id,entry]))}};}
