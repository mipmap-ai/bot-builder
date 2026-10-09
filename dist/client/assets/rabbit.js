const ellipse=(cx,cy,rx,ry,count=64)=>Array.from({length:count},(_,index)=>{
 const angle=index/count*Math.PI*2;return [cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry];
});
const arc=(start,end,count=36)=>Array.from({length:count+1},(_,index)=>{
 const angle=start+(end-start)*index/count;return [Math.cos(angle)*1.1,.07+Math.sin(angle)*1.05];
});
const curve=(a,b,c,d,count=32)=>Array.from({length:count+1},(_,index)=>{
 const t=index/count,u=1-t;return [0,1].map(axis=>u*u*u*a[axis]+3*u*u*t*b[axis]+3*u*t*t*c[axis]+t*t*t*d[axis]);
});
const outer=arc(.65,.65)[0],inner=arc(1.2,1.2)[0],tip=[.76,2.64];
const ear=[...curve(outer,[1.02,1.2],[1.14,2.6],tip),...curve(tip,[.42,2.85],[.28,1.58],inner).slice(1)];
const mirror=points=>points.map(([x,y])=>[-x,y]);
const fitEar=points=>points.map(([x,y])=>[x,y>1?1+(y-1)*.5:y]);
const silhouette=[...arc(-Math.PI/2,.65),...fitEar(ear).slice(1),...arc(1.2,Math.PI-1.2).slice(1),...mirror(fitEar(ear)).reverse().slice(1),...arc(Math.PI-.65,Math.PI*1.5).slice(1)];
const innerEar=[...curve([.63,1.05],[.8,1.48],[.94,2.35],[.72,2.44]),...curve([.72,2.44],[.54,2.5],[.47,1.54],[.63,1.05]).slice(1)];
export const rabbitCharacter={
 id:'rabbit',label:'Rabbit',color:'#F2E4CF',recolor:true,ramp:'skin',blush:'#F2B2C6',outfit:true,jaw:false,
 fit:{eyes:{spacing:52,vertical:0,scale:.86},blush:{spacing:76,drop:20}},
 drawing:{
  face:ellipse(0,.07,1.1,1.05),silhouette:[silhouette],ears:null,
  shapes:[
   {tone:'base',rings:[silhouette],smoothing:'art'},
   {fill:'#E8A7B8',rings:[fitEar(innerEar),mirror(fitEar(innerEar))],smoothing:'art'},
   {fill:'#FFF7ED',rings:[ellipse(0,-.48,.37,.23)],smoothing:'art'},
   {fill:'#D78DA4',rings:[curve([-.11,-.29],[-.08,-.21],[.08,-.21],[.11,-.29]).concat([[0,-.40]])],smoothing:'art'},
   {fill:'#A78076',rings:[ellipse(-.6,-.4,.22,.015),ellipse(.6,-.4,.22,.015),ellipse(-.6,-.52,.21,.015),ellipse(.6,-.52,.21,.015)],smoothing:'art'}
  ]
 }
};
export const rabbitEntry={id:'rabbit',label:'Rabbit',order:4,values:{type:'rabbit'}};
