const groups={headwear:'crown',hairOrnament:'clip',jewelry:'neck'};
// Resolve only changed controls; old links with empty new groups retain their parts.
export function applyWorldSelection(previous,requested,catalog){
 const look={...requested};
 for(const field of ['accessory',...Object.keys(groups)]){
  if(previous[field]===requested[field])continue;
  if(field==='accessory'){
   const values=catalog.accessory.entries.find(entry=>entry.id===requested.accessory)?.values??{};
   for(const [group,slot]of Object.entries(groups))if(values[slot])look[group]='none';
  }else{
   look[field]=requested[field];
   const values=catalog.accessory.entries.find(entry=>entry.id===look.accessory)?.values??{};
   if(values[groups[field]])look.accessory='none';
  }
 }
 return look;
}
