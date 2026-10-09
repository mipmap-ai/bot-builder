export function randomizeLook({catalog,toSpec,disabledFields},random=Math.random){
 const defaults=Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,group.defaultId]));
 const pick=key=>{
  const entries=catalog[key].entries;
  return entries[Math.floor(random()*entries.length)].id;
 };
 const look={...defaults,character:pick('character')};
 const disabled=disabledFields(toSpec(look));
 for(const key of Object.keys(catalog)){
  if(key!=='character'&&!disabled.has(key))look[key]=pick(key);
 }
 for(const key of disabledFields(toSpec(look)))look[key]=defaults[key];
 return look;
}
