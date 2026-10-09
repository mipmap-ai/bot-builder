const ellipse=(cx,cy,rx,ry,count=80)=>Array.from({length:count},(_,index)=>{
 const angle=index/count*Math.PI*2;return [cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry];
});
const curve=(a,b,c,d,count=24)=>Array.from({length:count},(_,index)=>{
 const t=index/count,u=1-t;return [0,1].map(axis=>u*u*u*a[axis]+3*u*u*t*b[axis]+3*u*t*t*c[axis]+t*t*t*d[axis]);
});
const mask=[
 ...curve([0,-.95],[-1.18,-.95],[-1.03,.79],[-.44,.90]),
 ...curve([-.44,.90],[-.16,.97],[-.03,.68],[0,.51]),
 ...curve([0,.51],[.03,.68],[.16,.97],[.44,.90]),
 ...curve([.44,.90],[1.03,.79],[1.18,-.95],[0,-.95])
];
const outline=ellipse(0,.04,1.1,1.13);
// Keep the existing Muni URL value for this explicitly requested replacement.
export const penguinCharacter={
 id:'muni',label:'Penguin',color:'#20252D',recolor:false,ramp:'skin',blush:'#F2B2C6',outfit:true,jaw:false,
 fit:{eyes:{spacing:52,vertical:0,scale:.86},blush:{spacing:76,drop:20}},
 drawing:{face:outline,silhouette:[outline],ears:null,shapes:[
  {fill:'#20252D',rings:[outline],smoothing:'art'},
  {fill:'#FFF8EC',rings:[mask],smoothing:'art'},
  {fill:'#EDA73D',rings:[[[-.23,-.39],[0,-.32],[.23,-.39],[0,-.57]]],smoothing:'art'}
 ]}
};
export const tuxedoDefinition={id:'tuxedo',label:'Tuxedo',colors:{
 primary:{label:'Jacket',default:'#202126'},secondary:{label:'Shirt',default:'#F1EFF5'},accent:{label:'Bow tie',default:'#17181D'}
}};
export const tuxedoEntry={id:'tuxedo',label:'Tuxedo',order:7,values:{type:'tuxedo'}};
