const ellipse=(cx,cy,rx,ry,count=80)=>Array.from({length:count},(_,index)=>{
 const angle=index/count*Math.PI*2;return [cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry];
});
const curve=(a,b,c,d,count=24)=>Array.from({length:count},(_,index)=>{
 const t=index/count,u=1-t;return [0,1].map(axis=>u*u*u*a[axis]+3*u*u*t*b[axis]+3*u*t*t*c[axis]+t*t*t*d[axis]);
});
const mask=[
 ...curve([0,-.99],[-.99,-.99],[-.98,.58],[-.47,.73]),
 ...curve([-.47,.73],[-.19,.82],[-.05,.44],[0,.25]),
 ...curve([0,.25],[.05,.44],[.19,.82],[.47,.73]),
 ...curve([.47,.73],[.98,.58],[.99,-.99],[0,-.99])
];
const outline=ellipse(0,.06,1.02,1.18);
const upperBeak=[
 ...curve([-.38,-.28],[-.30,-.04],[.30,-.04],[.38,-.28]),
 ...curve([.38,-.28],[.23,-.43],[-.23,-.43],[-.38,-.28])
];
const lowerBeak=[...curve([-.35,-.29],[-.27,-.56],[.27,-.56],[.35,-.29])];
// Keep the existing Muni URL value for this explicitly requested replacement.
export const penguinCharacter={
 id:'muni',label:'Penguin',color:'#20252D',recolor:false,ramp:'skin',blush:'#E5E9ED',outfit:true,jaw:false,
 fit:{eyes:{spacing:52,vertical:8,scale:.62},blush:{spacing:76,drop:20}},
 drawing:{face:outline,silhouette:[outline],ears:null,shapes:[
  {fill:'#20252D',rings:[outline],smoothing:'art'},
  {fill:'#F7FAFC',rings:[mask],smoothing:'art'},
  {fill:'#D98020',rings:[lowerBeak],smoothing:'art'},
  {fill:'#EDA73D',rings:[upperBeak],smoothing:'art'},
  {fill:'#FFD16A',rings:[ellipse(-.10,-.16,.15,.025)],smoothing:'art'},
  {fill:'#9B5A16',rings:[ellipse(0,-.31,.29,.014)],smoothing:'art'}
 ]}
};
export const tuxedoDefinition={id:'tuxedo',label:'Tuxedo',colors:{
 primary:{label:'Jacket',default:'#202126'},secondary:{label:'Shirt',default:'#F1EFF5'},accent:{label:'Bow tie',default:'#17181D'}
}};
export const tuxedoEntry={id:'tuxedo',label:'Tuxedo',order:7,values:{type:'tuxedo'}};
