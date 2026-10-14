const shape=(fill,d)=>({fill,d});
const ellipse=(x,y,rx,ry)=>`M${x-rx} ${y}C${x-rx} ${y-ry*1.33} ${x+rx} ${y-ry*1.33} ${x+rx} ${y}C${x+rx} ${y+ry*1.33} ${x-rx} ${y+ry*1.33} ${x-rx} ${y}Z`;
const gold='#D9B35C',ivory='#F1E6D0';
const flower=(x,y,color)=>[0,72,144,216,288].map(a=>shape(color,ellipse(Math.round(x+Math.cos(a*Math.PI/180)*28),Math.round(y+Math.sin(a*Math.PI/180)*28),25,19))).concat(shape(gold,ellipse(x,y,14,14)));
const hats={
 'wedding-turban':['Wedding turban',[
  shape('#943B55','M211 299Q225 119 490 112Q762 113 790 299L740 430Q502 376 252 431Z'),
  shape('#B9546E','M229 277Q440 274 681 134L725 160Q484 334 250 360Z M263 414Q452 236 538 112L583 119Q485 312 307 425Z'),
  shape('#6A2D42','M217 305Q454 350 754 199L775 240Q449 382 231 347Z'),
  shape(gold,'M499 236L528 277L499 318L470 277Z'),shape(ivory,'M507 249Q485 146 487 94Q498 65 508 94L524 220Z')]],
 sombrero:['Sombrero',[
  shape('#DBB574',ellipse(500,352,445,82)),shape('#BE9457',ellipse(500,377,438,43)),
  shape('#E4C38A','M315 326L358 140Q500 88 642 140L685 326Q508 377 315 326Z'),
  shape('#9A6145','M325 290Q500 325 675 290L685 320Q500 362 315 320Z'),
  ...Array.from({length:14},(_,i)=>shape(ivory,`M${120+i*58} 349l12 -13l12 13l-12 13Z`))]],
 'lace-bonnet':['Lace bonnet',[
  shape(ivory,'M237 394L135 275L179 124L292 235Q500 108 708 235L821 124L865 275L763 394Q702 198 500 205Q298 198 237 394Z'),
  shape('#D5CEBB','M211 293L177 214L179 163L282 261Z M789 293L823 214L821 163L718 261Z'),
  ...[210,267,324,676,733,790].map(x=>shape('#FFF8EB',ellipse(x,259,15,28)))]],
 'tartan-tam':['Tartan tam',[
  shape('#314C46','M203 352Q163 246 309 158Q564 68 773 216Q859 299 794 355L699 410L284 421Z'),
  shape('#253832','M217 350Q513 323 790 350L753 407L279 424Z'),
  shape('#BA4A50',ellipse(549,137,34,28)),shape('#45695B','M260 278Q475 110 675 179Q500 150 335 329Z')]],
 'andean-hat':['Andean brimmed hat',[
  shape('#8A5D42',ellipse(500,357,356,55)),shape('#634A38',ellipse(500,378,350,28)),
  shape('#79533B','M298 330L332 133Q508 94 668 133L702 330Q500 369 298 330Z'),
  shape('#AA3F4F','M306 288Q500 326 694 288L702 326Q500 367 298 326Z')]],
 'gold-hairpin':['Gold hairpin',[
  shape(gold,'M695 184L685 397H699L714 184Z'),shape('#E9C776','M702 252Q635 216 669 168Q709 166 713 211Q747 153 784 170Q795 228 718 252Z'),shape(ivory,ellipse(713,225,12,12))]]
};
const clips={
 'white-flower':['White flower',flower(760,380,ivory)],
 'red-flower':['Red flower',flower(760,380,'#C24C59')],
 'gold-earrings':['Gold drop earrings',[-1,1].flatMap(side=>{const x=500+side*260;return [shape(gold,ellipse(x,638,13,16)),shape(gold,`M${x-6} 647h12v58h-12Z`),shape(gold,ellipse(x,710,20,27)),shape('#EFD49A',ellipse(x-5,708,7,15))];})]
};
const necklaces={
 'gold-pendant':['Gold pendant',[
  shape(gold,'M440 500Q500 550 560 500L560 510Q500 563 440 510Z'),shape(gold,'M500 547L519 569L500 596L481 569Z'),shape('#EDD5A2','M500 554L510 569L500 584L490 569Z')]],
 'beaded-collar':['Beaded collar',[
  ...[0,1,2].flatMap(row=>Array.from({length:11},(_,i)=>{const a=(i-5)*.2,x=500+Math.sin(a)*(62+row*16),y=500+Math.cos(a)*(30+row*18);return shape(['#E4B849','#4F95AD','#C64C49'][row],ellipse(Math.round(x),Math.round(y),6,6));}))]],
 'silver-brooch':['Silver brooch',[
  shape('#D2D3CC',ellipse(500,530,31,31)),shape('#9CA4A6',ellipse(500,530,23,23)),shape('#F1EADF','M500 509L516 530L500 551L484 530Z'),
  shape('#C4C8C5','M479 551L487 586L494 572L500 593L506 572L513 586L521 551Z')]]
};
const make=(id,label,shapes,slot)=>({id,label,seat:slot==='crown'?{slot,crown:[0,id==='lace-bonnet'?1.25:.7],width:2.2}:slot==='clip'?{slot,at:[.9398,.4379],tangent:[-.2367,.9716]}:{slot,center:[0,0],width:1},frame:{center:[500,500],scale:250,roll:0},overOutfit:slot==='neck',followEars:id==='gold-earrings',shapes});
export const worldAccessories=Object.fromEntries([...Object.entries(hats).map(([id,[label,shapes]])=>[id,make(id,label,shapes,id==='gold-hairpin'?'clip':'crown')]),...Object.entries(clips).map(([id,[label,shapes]])=>[id,make(id,label,shapes,'clip')]),...Object.entries(necklaces).map(([id,[label,shapes]])=>[id,make(id,label,shapes,'neck')])]);
export const worldAccessoryLoaders=Object.fromEntries(Object.entries(worldAccessories).map(([id,drawing])=>[id,async()=>({drawing})]));
const group=(label,slot,entries)=>({kind:'preset',label,heading:label,slice:'accessory',tab:'accessory',defaultId:'none',entries:[{id:'none',label:'None',values:{}},...entries.map(([id,name])=>({id,label:name,values:{[slot]:id}}))]});
export const worldGroups={
 headwear:group('Headwear','crown',[...Object.entries(hats).filter(([id])=>id!=='gold-hairpin').map(([id,[label]])=>[id,label]),['conical-hat','Conical hat'],['fez','Fez']]),
 hairOrnament:group('Hair ornaments','clip',[['gold-hairpin','Gold hairpin'],['white-flower','White flower'],['red-flower','Red flower'],['gold-earrings','Gold drop earrings']]),
 jewelry:group('Jewelry','neck',Object.entries(necklaces).map(([id,[label]])=>[id,label]))
};
