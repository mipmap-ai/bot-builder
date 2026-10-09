export const HAIR_DESCRIPTIONS = {
 'cap':'short thick wavy hair', 'dark-bob':'a straight chin-length bob haircut', 'ponytail':'hair tied back in a ponytail',
 'straight':'straight hair with blunt bangs across the forehead', 'sakura':'a short layered bob with choppy bangs',
 'messy':'short messy hair', 'sweep':'short hair swept to one side', 'long-waves':'long loose wavy hair',
 'shaggy':'a shaggy medium-length haircut', 'side-part':'neatly side-parted short hair', 'messy-bun':'hair tied in a messy bun',
 'layered-bob':'a layered chin-length bob haircut', 'tousled':'short tousled hair', 'spiky':'short spiky hair',
 'slick-back':'short slicked-back hair', 'buzz':'a buzz cut or bald head', 'twin-tails':'hair tied in two pigtails',
 'fluffy':'fluffy voluminous short hair', 'long-fringe':'short hair with long bangs over the eyes',
 'big-waves':'voluminous shoulder-length wavy hair', 'swept-fringe':'short hair with side-swept bangs', 'curly':'short tightly curly hair'
};
export const OUTFIT_DESCRIPTIONS = {
 jacket:'a jacket over a shirt', turtleneck:'a turtleneck sweater', blouse:'a blouse', sailor:'a sailor shirt with a broad sailor collar',
 'high-collar':'a shirt with a standing collar', wristband:'a plain T-shirt', hero:'a superhero costume with a cape'
};
const ACCESSORIES = {
 none:'no glasses, sunglasses, hat or hair accessory', 'round-glasses':'round eyeglasses', 'square-glasses':'rectangular eyeglasses',
 'wraparound-sunglasses':'sunglasses covering the eyes', 'baseball-cap':'a baseball cap', beanie:'a knitted beanie', beret:'a beret',
 'conical-hat':'a conical straw hat', crown:'a crown', fez:'a fez hat', goggles:'goggles worn on the head',
 'officer-cap':'a peaked uniform cap', 'pit-vipers':'sunglasses resting on top of the head', 'star-clip':'a hair clip',
 tiara:'a tiara', 'trucker-hat':'a trucker cap'
};
const BEARDS={none:'a clean-shaven face without a beard or mustache', 'full-beard':'a full beard', 'curly-mustache':'a mustache without a beard'};
const EYE_COLORS={black:'very dark brown', 'dark-brown':'dark brown',brown:'brown',hazel:'hazel',green:'green',blue:'blue',gray:'gray',amber:'amber',violet:'violet'};
const HAIR_COLORS={chestnut:'brown',espresso:'dark brown',auburn:'reddish brown',copper:'copper red',honey:'golden brown',platinum:'platinum blonde',silver:'gray',rose:'pink',midnight:'black',slate:'bluish gray','soft-black':'soft black',sakura:'light pink',teal:'blue or teal',butter:'golden blonde',ice:'pale blue'};
export function makeGroups(catalog, outfitVisible, eyesVisible=false,geometry={}) {
 const group=(key,region,description)=>({key,region,choices:catalog[key].entries.filter(e=>key!=='hair'||hairCandidate(e.id,geometry)).map(e=>({id:e.id,label:e.label,text:description(e)}))});
 return [
  group('hair','hair',e=>`A portrait of a person with ${HAIR_DESCRIPTIONS[e.id]||e.label.toLowerCase()}.`),
  group('hairColor','hair',e=>`A portrait of a person with ${HAIR_COLORS[e.id]||e.label.toLowerCase()} hair.`),
  group('accessory','portrait',e=>`A portrait of a person with ${ACCESSORIES[e.id]||e.label.toLowerCase()}.`),
  ...(eyesVisible?[group('eyeColor','eyes',e=>`A close-up photo of ${EYE_COLORS[e.id]} eyes.`)]:[]),
  group('beard','face',e=>`A portrait of a person with ${BEARDS[e.id]}.`),
  ...(outfitVisible?[group('outfit','outfit',e=>`A person wearing ${OUTFIT_DESCRIPTIONS[e.id]}.`)]:[])
 ];
}
export function closestColor(rgb, entries) {
 if(!rgb||!entries.length) throw Error('No color samples available.');
 const lab=([r,g,b])=>{
  const linear=v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4;
  [r,g,b]=[r,g,b].map(linear);
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
  const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
  const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
 };
 const sample=lab(rgb);
 const distance=e=>{const color=e.color.slice(1);const target=lab([0,2,4].map(i=>parseInt(color.slice(i,i+2),16)));return target.reduce((n,v,i)=>n+(v-sample[i])**2,0);};
 return entries.filter(e=>/^#[a-f\d]{6}$/i.test(e.color||'')).sort((a,b)=>distance(a)-distance(b))[0].id;
}
export function validateMatches(matches,catalog) {
 const allowed=['hair','hairColor','accessory','beard','outfit','eyeColor'];
 for(const [key,id]of Object.entries(matches))if(!allowed.includes(key)||!catalog[key]?.entries.some(e=>e.id===id))throw Error('The matcher returned an unavailable bot part.');
 if(!matches.hair||!matches.hairColor)throw Error('The matcher could not select hair.');
 return matches;
}
export function chooseHead(box){const ratio=box.height/box.width;return ratio<1.08?'mochi':ratio>1.42?'pebble':ratio<1.23?'squircle':'classic';}
export function normalizeImageSize(width,height,max=1200){const scale=Math.min(1,max/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}

export function selectPrediction(key,predictions,choices){
 const best=choices.find(choice=>choice.text===predictions[0]?.label);
 if(!best)throw Error('No matching option found.');
 if(key==='accessory'&&best.id!=='none'&&(predictions[0].score<.24||predictions[0].score-(predictions[1]?.score||0)<.08))return 'none';
 if(key==='beard'&&best.id!=='none'&&(predictions[0].score<.55||predictions[0].score-(predictions[1]?.score||0)<.15))return 'none';
 return best.id;
}

export function hairCandidate(id,{long=false,foreheadVisible=false}={}){
 if(foreheadVisible&&['straight','sakura','long-fringe'].includes(id))return false;
 if(long&&!['ponytail','messy-bun','straight','twin-tails','long-waves','big-waves'].includes(id))return false;
 return true;
}
