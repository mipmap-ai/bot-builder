const shape=(d,tone='base')=>({tone,d});
const cap=[shape('M217 520Q186 214 360 180Q512 111 681 196Q823 268 783 524L738 526Q704 295 531 258Q436 360 266 425L264 542Z'),shape('M270 359Q379 176 519 189Q378 254 270 359Z','highlight'),shape('M531 258Q650 223 738 526L754 472Q711 214 582 225Z','shade')];
const bun=[shape('M405 179C327 98 391 24 496 29C609 12 674 106 594 179Z'),shape('M433 140Q419 54 525 58Q452 78 471 158Z','highlight')];
const braid=(x,y)=>Array.from({length:6},(_,i)=>shape(`M${x} ${y+i*57}Q${x-50} ${y+i*57+24} ${x-9} ${y+i*57+68}Q${x+51} ${y+i*57+25} ${x} ${y+i*57}Z`,i%2?'shade':'base'));
const drawings={
 'neat-bun':{label:'Neat bun',front:cap,back:bun},
 'braided-updo':{label:'Braided updo',front:[...cap,...Array.from({length:8},(_,i)=>{const x=278+i*56,y=280-Math.sin(i/7*Math.PI)*120;return shape(`M${x} ${y}q-25 -38 0 -49q52 -4 50 30q-10 31 -50 19Z`,i%2?'shade':'highlight');})],back:bun},
 'twin-braids':{label:'Twin braids',front:cap,back:[],side:[...braid(190,540).map(part=>({...part,pin:[190,540]})),...braid(810,540).map(part=>({...part,pin:[810,540]}))]},
 'side-braid':{label:'Side braid',front:cap,back:[],side:braid(810,540).map(part=>({...part,pin:[810,540]}))}
};
export const worldHair=Object.fromEntries(Object.entries(drawings).map(([id,drawing])=>[id,{id,...drawing,frame:{center:[500,500],scale:250,pose:{yaw:0,pitch:0,roll:0}},cast:{d:''},fit:{crown:1.2817600000000002,eyeLine:.16167149837337216,halfWidth:1.2090479852317104},smoothing:{simplify:.0012,tipSpan:0,valleyDegrees:181},keepGaps:true,holdBelowChin:true}]));
export const worldHairEntries=Object.entries(worldHair).map(([id,{label}],index)=>({id,label,order:1000+index,values:{type:id}}));
export const worldHairLoaders=Object.fromEntries(Object.entries(worldHair).map(([id,drawing])=>[id,async()=>({drawing})]));
