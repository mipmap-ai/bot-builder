import {parse} from 'acorn';
import {analyze} from 'eslint-scope';
// Follow resolved module bindings, so local minified names cannot pull in editor UI.
export function extractModule(source,names,keepEffects=false){
 const ast=parse(source,{ecmaVersion:2022,sourceType:'module',ranges:true});
 const manager=analyze(ast,{ecmaVersion:2022,sourceType:'module'});
 const scope=manager.scopes.find(scope=>scope.type==='module');
 const units=[];
 for(const statement of ast.body){
  if(statement.type==='VariableDeclaration')for(const declaration of statement.declarations)units.push({node:declaration,text:`${statement.kind} ${source.slice(declaration.start,declaration.end)};`});
  else if(keepEffects&&!['ExportNamedDeclaration','ExportDefaultDeclaration'].includes(statement.type)&&!['FunctionDeclaration','ClassDeclaration','ImportDeclaration'].includes(statement.type))units.push({node:statement,text:source.slice(statement.start,statement.end),effect:true});
  else if(['FunctionDeclaration','ClassDeclaration','ImportDeclaration'].includes(statement.type))units.push({node:statement,text:source.slice(statement.start,statement.end)});
 }
 const variables=new Map(scope.variables.map(variable=>[variable.name,variable]));
 const owners=new Map(scope.variables.map(variable=>[variable,units.find(unit=>variable.identifiers.some(id=>id.start>=unit.node.start&&id.end<=unit.node.end))]));
 const selected=new Set();
 function select(unit){
  if(!unit||selected.has(unit))return;selected.add(unit);
  for(const variable of scope.variables)if(variable.references.some(ref=>ref.identifier.start>=unit.node.start&&ref.identifier.end<=unit.node.end))select(owners.get(variable));
 }
 for(const unit of units)if(unit.effect)select(unit);
 for(const name of names){if(!variables.has(name))throw Error(`Missing module binding ${name}`);select(owners.get(variables.get(name)));}
 return units.filter(unit=>selected.has(unit)).map(unit=>unit.text).join('\n');
}
