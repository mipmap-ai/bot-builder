export function regionPixels(pixels,mask,category){
 const samples=[];
 for(let i=0,stride=Math.max(1,Math.floor(mask.length/24000));i<mask.length;i+=stride)if(mask[i]===category&&pixels[i*4+3]>240)samples.push([pixels[i*4],pixels[i*4+1],pixels[i*4+2]]);
 return samples;
}
const light=rgb=>rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
export function representativeColor(samples,percentile=.5){
 if(samples.length<20)return null;
 const sorted=[...samples].sort((a,b)=>light(a)-light(b));
 const center=Math.floor((sorted.length-1)*percentile),radius=Math.max(1,Math.floor(sorted.length*.08));
 const band=sorted.slice(Math.max(0,center-radius),Math.min(sorted.length,center+radius+1));
 return [0,1,2].map(channel=>Math.round(band.reduce((sum,rgb)=>sum+rgb[channel],0)/band.length));
}
export function illuminationGains(clothing){
 const whites=clothing.filter(rgb=>Math.min(...rgb)>145&&(Math.max(...rgb)-Math.min(...rgb))/Math.max(...rgb)<.28);
 const white=representativeColor(whites,.85);
 return white?white.map(channel=>Math.min(1.5,Math.max(.85,240/channel))):[1,1,1];
}
export function correctColor(rgb,gains){return rgb?.map((value,index)=>Math.min(255,Math.round(value*gains[index])));}
export function categoryBounds(mask,width,height,categories){
 let left=width,top=height,right=-1,bottom=-1,count=0;
 for(let i=0;i<mask.length;i++)if(categories.includes(mask[i])){const x=i%width,y=Math.floor(i/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
 return count<20?null:{x:left/width,y:top/height,width:(right-left+1)/width,height:(bottom-top+1)/height,count};
}
export function faceDimensions(landmarks,width,height){
 const distance=(a,b)=>Math.hypot((landmarks[a].x-landmarks[b].x)*width,(landmarks[a].y-landmarks[b].y)*height);
 return {width:distance(234,454),height:distance(10,152)};
}
export function hairGeometry(analysis,landmarks){
 if(!landmarks)return {long:false,foreheadVisible:false};
 const {mask,width,height}=analysis;
 const bounds=categoryBounds(mask,width,height,[1]);
 const chin=landmarks[152],forehead=landmarks[10],brow=landmarks[9];
 const faceHeight=Math.hypot(chin.x-forehead.x,chin.y-forehead.y);
 let visible=0,total=0;
 for(let row=1;row<=5;row++)for(let column=-2;column<=2;column++){
  const t=row/7,x=forehead.x*(1-t)+brow.x*t+column*.018,y=forehead.y*(1-t)+brow.y*t;
  const index=Math.min(height-1,Math.max(0,Math.floor(y*height)))*width+Math.min(width-1,Math.max(0,Math.floor(x*width)));
  if(mask[index]===3)visible++;total++;
 }
 return {long:!!bounds&&bounds.y+bounds.height>chin.y+faceHeight*.12,foreheadVisible:visible/total>.6};
}
export function irisColor(pixels,width,height,landmarks){
 if(!landmarks||landmarks.length<478)return null;
 const samples=[];
 for(const [centerIndex,edgeIndex]of [[468,469],[473,474]]){
  const center=landmarks[centerIndex],edge=landmarks[edgeIndex];
  const cx=center.x*width,cy=center.y*height,radius=Math.hypot((edge.x-center.x)*width,(edge.y-center.y)*height);
  if(radius<3)return null;
  for(let y=Math.floor(cy-radius);y<=cy+radius;y++)for(let x=Math.floor(cx-radius);x<=cx+radius;x++){
   const distance=Math.hypot(x-cx,y-cy)/radius;
   if(distance<.35||distance>.8||x<0||y<0||x>=width||y>=height)continue;
   const index=(y*width+x)*4;samples.push([pixels[index],pixels[index+1],pixels[index+2]]);
  }
 }
 return representativeColor(samples,.45);
}
