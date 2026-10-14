// Each stud is authored at ±1.04, -0.552. Move it to the live ear center.
export function worldEarPlacement(anchors){
 const ears=anchors.ears??{left:[-anchors.headProfile(Math.PI),-.15],right:[anchors.headProfile(0),-.15]};
 const scale=Math.hypot(ears.right[0]-ears.left[0],ears.right[1]-ears.left[1])/2.08;
 return ([x,y])=>{
  const side=x<0?-1:1,ear=side<0?ears.left:ears.right;
  return [ear[0]+(x-side*1.04)*scale,ear[1]+(y+.552)*scale];
 };
}
