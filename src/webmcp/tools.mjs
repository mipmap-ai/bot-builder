export function createTools(api) {
  const empty = {type:'object',properties:{},additionalProperties:false};
  const fields = Object.fromEntries(Object.entries(api.catalog).map(([key, group]) => [key,{type:'string',enum:group.entries.map(entry=>entry.id)}]));
  const read = () => {
    const state=api.state();
    return {selections:{...state.look},unavailableFields:[...api.disabled(api.toSpec(state.look))],canUndo:state.past.length>0,canRedo:state.future.length>0};
  };
  const object = input => {
    if (!input || typeof input!=='object' || Array.isArray(input)) throw Error('Expected an object.');
  };
  const noInput = input => {object(input);if(Object.keys(input).length)throw Error('This tool takes no arguments.');};
  const mutate = async action => {action();await api.settle();return read();};
  const tool=(name,description,inputSchema,execute,readOnlyHint=false)=>({name,description,inputSchema,annotations:{readOnlyHint},async execute(input){try{return {content:[{type:'text',text:JSON.stringify(await execute(input))}]};}catch(error){return {isError:true,content:[{type:'text',text:JSON.stringify({error:error.message})}]};}}});
  return [
    tool('get_bot_options','List valid Bot Builder option IDs, labels, defaults, and availability for the current bot.',empty,input=>{noInput(input);return {options:Object.fromEntries(Object.entries(api.catalog).map(([key,group])=>[key,{label:group.label,defaultId:group.defaultId,entries:group.entries.map(({id,label,color})=>({id,label,...(color?{color}:{})}))}])),unavailableFields:read().unavailableFields};},true),
    tool('get_current_bot','Read current selections and undo/redo availability.',empty,input=>{noInput(input);return read();},true),
    tool('change_bot','Apply valid option IDs together as one undoable edit. Unavailable fields are rejected; change character first or include compatible selections.',{type:'object',properties:{selections:{type:'object',properties:fields,additionalProperties:false,minProperties:1}},required:['selections'],additionalProperties:false},async input=>{
      object(input);if(Object.keys(input).some(key=>key!=='selections'))throw Error('Unknown argument.');object(input.selections);
      const entries=Object.entries(input.selections);if(!entries.length)throw Error('Choose at least one selection.');
      for(const [key,value] of entries)if(!Object.hasOwn(fields,key)||!fields[key].enum.includes(value))throw Error(`Invalid selection: ${key}. Use get_bot_options.`);
      const look=api.parse({...api.state().look,...input.selections});const unavailable=api.disabled(api.toSpec(look));
      for(const [key]of entries)if(unavailable.has(key))throw Error(`${key} is unavailable for this character.`);
      return mutate(()=>api.state().load(look));
    }),
    tool('randomize_bot','Randomize all available bot options using the existing valid-combination rules.',empty,input=>{noInput(input);return mutate(()=>api.state().randomize());}),
    ...['undo','redo'].map(action=>tool(`${action}_bot`,`${action==='undo'?'Undo':'Redo'} one editor change.`,empty,input=>{noInput(input);return mutate(()=>api.state()[action]());})),
    tool('get_bot_share_link','Return the full production URL for the current bot without using the clipboard.',empty,input=>{noInput(input);return {url:`https://botbuilder.mipmap.ai/${api.serialize(api.state().look)}`};},true),
    tool('export_bot','Download the current bot as PNG or SVG using the existing renderer. Returns the saved filename after generation.',{type:'object',properties:{format:{type:'string',enum:['png','svg']},size:{type:'integer',enum:[1024,2048]}},required:['format'],additionalProperties:false},async input=>{object(input);if(Object.keys(input).some(key=>!['format','size'].includes(key))||!['png','svg'].includes(input.format)||!([1024,2048].includes(input.size??1024)))throw Error('Use png or svg and size 1024 or 2048.');return api.exportAvatar(input.format,input.size??1024);}),
    tool('open_photo_match','Open the photo picker dialog so the visitor can choose a photo locally. Does not read files or select a photo.',empty,input=>{noInput(input);return api.photo.open();}),
    tool('get_photo_match_status','Read selected-photo readiness, progress outcome, and errors. On complete, use get_current_bot. Does not return the photo or its filename.',empty,input=>{noInput(input);return api.photo.status();},true),
    tool('match_selected_photo','Start matching only the photo already selected by the visitor. Returns immediately; poll get_photo_match_status until complete, failed, or cancelled. Processing stays on-device and applies one undoable edit. First use downloads models.',empty,async input=>{noInput(input);return api.photo.match();}),
  ];
}
