// Coordinates follow the editor's 1000 × 1300 torso artwork convention.
const path=(d,fill='primary.base',shirt=false)=>`<path data-fill="${fill}"${shirt?' data-region="shirt"':''} d="${d}"/>`;
const circle=(x,y,r,fill='accent.base')=>path(`M${x-r} ${y}C${x-r} ${y-r*1.33} ${x+r} ${y-r*1.33} ${x+r} ${y}C${x+r} ${y+r*1.33} ${x-r} ${y+r*1.33} ${x-r} ${y}Z`,fill);
const rect=(x,y,w,h,fill)=>path(`M${x} ${y}h${w}v${h}h-${w}Z`,fill);
const torso='M410 466Q325 477 286 561L230 795V1300H770V795L714 561Q675 477 590 466L564 451H436Z';
const neck=path('M414 330H586V498H414Z','skin');
const body=()=>path(torso);
const sleeve=(fill='secondary.base')=>path('M397 470Q319 486 284 565L255 708L348 730L400 574Z M603 470Q681 486 716 565L745 708L652 730L600 574Z',fill);
const standing=(fill='secondary.base')=>path('M434 451L500 476L566 451L579 500L500 522L421 500Z',fill);
const wrap=(fill='secondary.base')=>path('M431 451L535 508L621 473L589 524L500 568L395 486Z',fill);
const belt=(fill='accent.base')=>rect(279,833,442,36,fill);
const buttons=(x=500,fill='accent.base')=>[540,589,638,687,736].map(y=>circle(x,y,8,fill)).join('');
const braidTrim=(x,y,w,h,fill='accent.base')=>{let s='';for(let a=x;a<x+w;a+=30)s+=path(`M${a} ${y}l12 12l-12 12l-12 -12Z`,fill);return s+rect(x-12,y+h-4,w+20,4,fill);};
const blossom=(x,y,fill='accent.base',r=10)=>[0,72,144,216,288].map(a=>circle(Math.round(x+Math.cos(a*Math.PI/180)*r),Math.round(y+Math.sin(a*Math.PI/180)*r),r*.68,fill)).join('')+circle(x,y,r*.4,'secondary.base');
const floral=(fill='accent.base')=>[[330,650],[645,595],[400,775],[610,760],[355,930],[650,1060]].map(([x,y])=>blossom(x,y,fill)).join('');
const vest=(fill='secondary.base')=>path('M409 466L468 502L481 838L302 861L354 562Z M591 466L532 502L519 838L698 861L646 562Z',fill);
const embroidery=(x=489)=>rect(x,508,22,610,'accent.base')+[550,635,720,805,890,975].map(y=>path(`M${x+11} ${y}l22 22l-22 22l-22 -22Z`,'accent.highlight')).join('');
const checked=(fill='secondary.base')=>[350,420,490,560,630].map(x=>rect(x,540,12,670,fill)).join('')+[590,685,780,875,970,1065,1160].map(y=>rect(280,y,440,12,fill)).join('');
const kente=()=>{let s='';const colors=['#E4AD38','#23775A','#A84238','#20252B'];for(let row=0;row<8;row++)for(let col=0;col<5;col++){const x=340+col*68,y=530+row*75;s+=rect(x,y,66,73,colors[(row+col)%4]);s+=path(`M${x+6} ${y+15}l25 15l-25 15Z M${x+58} ${y+40}l-25 15l25 15Z`,colors[(row+col+2)%4]);}return s;};
const details={
 'thai-chakri':()=>body()+path('M413 465L590 449L691 554L332 830L310 746L574 522Z','secondary.base')+path('M414 481L578 465L595 487L319 778L315 752Z','accent.base')+braidTrim(385,575,230,30)+belt()+circle(500,850,22),
 sari:()=>body()+sleeve()+path('M583 454L642 477L712 780L430 1300H314L605 716Z','secondary.base')+path('M576 472L603 480L326 1290H304Z','accent.base')+braidTrim(438,668,190,30)+belt('secondary.shadow'),
 kimono:()=>body()+wrap('accent.base')+path('M433 457L538 529L469 834H332Z','secondary.base')+path('M569 457L480 551L531 834H670Z','primary.highlight')+floral('secondary.highlight')+rect(288,805,424,92,'secondary.base')+rect(405,815,190,69,'accent.base'),
 hanbok:()=>path(torso,'secondary.base')+path('M406 464L594 464Q672 480 710 565L688 716H312L290 565Q328 480 406 464Z')+sleeve('primary.base')+wrap('accent.base')+path('M493 568L437 548L445 587L487 580L459 730L492 727L505 591L543 705L563 690L521 580L561 587L568 548L513 568Z','accent.base'),
 qipao:()=>body()+standing('primary.highlight')+path('M518 510L607 583V689H600V588L512 518Z','accent.base')+[545,580,625].map(y=>circle(607,y,7)).join('')+floral('secondary.base'),
 flamenco:()=>body()+sleeve('primary.base')+path('M396 468Q429 525 463 514Q493 544 522 516Q561 531 600 468L617 521Q577 576 546 550Q508 581 477 552Q437 572 399 529Z','secondary.base')+Array.from({length:7},(_,r)=>Array.from({length:5},(_,c)=>circle(340+c*77+(r%2?23:0),620+r*80,9,'secondary.base')).join('')).join('')+belt('primary.shadow'),
 bunad:()=>body()+sleeve('secondary.base')+vest('primary.shadow')+path('M430 453L500 480L570 453L566 522L500 542L434 522Z','secondary.base')+floral('accent.base')+belt(),
 'andean-jacket':()=>body()+standing('secondary.base')+embroidery()+path('M405 466L500 550L595 466L703 637L500 756L297 637Z','secondary.base')+[550,590,630,670].map((y,i)=>path(`M${340+i*12} ${y}L500 ${y+80}L${660-i*12} ${y}v14L500 ${y+95}L${340+i*12} ${y+14}Z`,['#C54A45','#D9A43A','#36748B','#F4E8CF'][i])).join(''),
 kaftan:()=>body()+path('M434 450L500 516L566 450L543 532L500 572L457 532Z','secondary.base')+embroidery()+floral()+belt(),
 'kente-wrap':()=>body()+kente()+path('M412 465L470 488L719 1080L658 1136Z','secondary.base')+braidTrim(346,759,300,30),
 'maasai-shuka':()=>body()+checked('secondary.base')+path('M406 465L463 494L710 1170L650 1200Z','primary.shadow')+path('M425 478L440 485L682 1178L667 1185Z','accent.base'),
 puletasi:()=>body()+sleeve('primary.base')+wrap('secondary.base')+floral('secondary.base')+[[355,575],[610,900],[420,1030]].map(([x,y])=>path(`M${x} ${y}q-52 15 -58 62q49 -2 58 -62Z M${x+8} ${y+8}q52 15 58 62q-49 -2 -58 -62Z`,'secondary.base')).join('')+belt('primary.shadow')
};
const styles=[
 ['thai-chakri','Thai Chakri','#24735B','#399178','#D8AD53'],
 ['sari','Sari','#AD3E71','#368D91','#D9B450'],
 ['kimono','Kimono','#B33C4C','#3C8D85','#F3E7D2'],
 ['hanbok','Hanbok','#F0E4D1','#3E967D','#BD496D'],
 ['qipao','Qipao','#237B7A','#A5CEC3','#D6B566'],
 ['flamenco','Flamenco dress','#B93448','#F5E4DA','#CE9B50'],
 ['bunad','Bunad','#314D68','#F0E5D5','#B3444B'],
 ['andean-jacket','Andean jacket','#923A48','#37778E','#D8AD4F'],
 ['kaftan','Kaftan','#315C9B','#D9B55F','#E2C577'],
 ['kente-wrap','Kente wrap','#D9A63C','#2C7458','#B54036'],
 ['maasai-shuka','Maasai shuka','#AC3C43','#303E63','#D6A84A'],
 ['puletasi','Puletasi','#358C90','#F0DFC1','#CAA16C']
];
export const worldOutfitDefinitions=Object.fromEntries(styles.map(([id,label,primary,secondary,accent])=>[id,{id,label,colors:{primary:{label:'Fabric',default:primary},secondary:{label:'Contrasting fabric',default:secondary},accent:{label:'Trim',default:accent}}}]));
export const worldOutfitEntries=styles.map(([id,label],index)=>({id,label,order:8+index,values:{type:id}}));
export const worldOutfitArt=Object.fromEntries(styles.map(([id])=>[id,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1300">${neck}${details[id]()}</svg>`]));

export const retiredWorldOutfits={'thai-formal':'thai-chakri',lehenga:'sari','kurta-vest':'sari',sherwani:'sari','ao-dai':'qipao',kebaya:'thai-chakri',barong:'kaftan','tartan-vest':'bunad',dirndl:'bunad','dutch-bodice':'bunad','greek-vest':'bunad',charro:'flamenco'};
