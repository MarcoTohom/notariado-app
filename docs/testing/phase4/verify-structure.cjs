const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = path.resolve(__dirname, '../../..');
const src = path.join(root,'frontend/src');
const ts = require(path.join(root,'frontend/node_modules/typescript'));
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const beforeCache = new Map();
const before = f => {
 if (!beforeCache.has(f)) beforeCache.set(f, git('show', 'da9d93b:frontend/src/' + f));
 return beforeCache.get(f);
};
const read=f=>fs.readFileSync(path.join(src,f),'utf8');
const parse=s=>ts.createSourceFile('source.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const walk=(n,fn)=>{fn(n);ts.forEachChild(n,c=>walk(c,fn));};
const children=n=>n.children.filter(c=>!(ts.isJsxText(c)&&!c.text.trim())&&!(ts.isJsxExpression(c)&&!c.expression));
const tag=n=>ts.isJsxElement(n)?n.openingElement.tagName.getText():'';
const attribute=(n,name)=>(n.openingElement||n).attributes.properties.find(p=>p.name?.getText()===name)?.initializer;
const canonical=n=>{
 if(!n)return null;
 if(ts.isParenthesizedExpression(n))return canonical(n.expression);
 if(ts.isJsxText(n))return n.text.trim()?['jsx-text',n.text.trim().replace(/\s+/g,' ')]:null;
 const descendants=[];ts.forEachChild(n,c=>{const value=canonical(c);if(value!==null)descendants.push(value);});
 return [ts.SyntaxKind[n.kind],typeof n.text==='string'?n.text:undefined,...descendants];
};
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const errors=[];
const assert=(condition,label)=>{if(!condition)errors.push(label);};
const declarations=sf=>Object.fromEntries(sf.statements.filter(n=>n.name||ts.isVariableStatement(n)).map(n=>[ts.isVariableStatement(n)?n.declarationList.declarations[0].name.getText():n.name.text,ts.isVariableStatement(n)?n.declarationList.declarations[0]:n]));
const oldControls=declarations(parse(before('features/fields/FieldControls.tsx')));
const controlsDir='features/fields/controls/';
const controlFiles=['BasicInputs.tsx','TextInputs.tsx','SelectInput.tsx','RelationInput.tsx','FileInput.tsx','ListInput.tsx'];
const newControls=Object.assign({},...controlFiles.map(f=>declarations(parse(read(controlsDir+f)))),declarations(parse(read('features/fields/FieldControls.tsx'))));
let controlsChecked=0;
for(const [name,node] of Object.entries(oldControls)){
 if(['inputClass','FileActivityContext','ControlProps','CONTROLS'].includes(name))continue;
 assert(equal(node.body||node.initializer,newControls[name]?.body||newControls[name]?.initializer),'Changed control body: '+name);
 controlsChecked++;
}
const oldRegistry=oldControls.CONTROLS.initializer.getText().replace('list: ListInput','list: ListControl');
assert(equal(parse('const registry = '+oldRegistry).statements[0].declarationList.declarations[0].initializer,newControls.CONTROLS.initializer),'Changed registry');
assert(equal(oldControls.ControlProps,parse(read(controlsDir+'types.ts')).statements[1]),'Changed ControlProps');
assert(equal(oldControls.FileActivityContext.initializer,declarations(parse(read(controlsDir+'FileActivityContext.ts'))).FileActivityContext.initializer),'Changed upload activity context');
const oldEditor=parse(before('features/fields/FieldDefinitionEditor.tsx'));
const newEditor=parse(read('features/fields/FieldDefinitionEditor.tsx'));
const oldEditorDecl=declarations(oldEditor);
assert(equal(oldEditorDecl.newField.initializer,declarations(parse(read('features/fields/editor/defaults.ts'))).newField.initializer),'Changed default field');
let editorActionsChecked=0;
for(const name of ['patch','reorder','add']){
 const find=sf=>{let result;walk(sf,n=>{if(ts.isVariableDeclaration(n)&&n.name.getText()===name)result=n.initializer;});return result;};
 assert(equal(find(oldEditor),find(newEditor)),'Changed editor action: '+name);editorActionsChecked++;
}
let fieldset;walk(oldEditor,n=>{if(tag(n)==='fieldset')fieldset=n;});
const parts=children(fieldset);
const fragment=s=>parse('const ui = <>'+s+'</>;').statements[0].declarationList.declarations[0].initializer;
const returned=f=>{let node;walk(parse(read(f)),n=>{if(ts.isReturnStatement(n))node=n.expression;});return node;};
const adapt=s=>s.replace(/patch\(index, /g,'onChange(');
assert(equal(fragment(adapt(parts.slice(1,3).map(n=>n.getText(oldEditor)).join('\n'))),returned('features/fields/editor/DefinitionSettings.tsx')),'Changed definition identity or flags');
const options=parts.slice(3,9).map(n=>n.getText(oldEditor)).join('\n').replace(parts[4].getText(oldEditor),'{children}');
assert(equal(fragment(adapt(options)),returned('features/fields/editor/DefinitionOptions.tsx')),'Changed definition type options');
assert(equal(parse('const ui = '+adapt(parts[10].expression.right.getText(oldEditor))).statements[0].declarationList.declarations[0].initializer,returned('features/fields/editor/DefinitionRestrictions.tsx')),'Changed definition restrictions');

const allFiles=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?allFiles(path.join(directory,e.name)):/\.tsx?$/.test(e.name)?[path.join(directory,e.name)]:[]);
const files=allFiles(src).map(f=>path.relative(src,f).replace(/\\/g,'/'));
const graph=new Map(files.map(f=>[f,[]]));let importsChecked=0;
for(const f of files){
 const sf=parse(read(f));
 for(const n of sf.statements.filter(ts.isImportDeclaration)){
  const spec=n.moduleSpecifier.text;if(!spec.startsWith('.'))continue;importsChecked++;
  const stem=path.posix.normalize(path.posix.join(path.posix.dirname(f),spec));
  const target=[stem,stem+'.ts',stem+'.tsx',stem+'/index.ts',stem+'/index.tsx'].find(t=>files.includes(t));
  if(!target)assert(fs.existsSync(path.join(src,stem)),'Broken import: '+f+' -> '+spec);
  else if(!n.importClause?.isTypeOnly)graph.get(f).push(target);
 }
}
const cycles=[],seen=new Set(),active=new Set(),stack=[];
const visit=f=>{if(active.has(f)){cycles.push([...stack.slice(stack.indexOf(f)),f]);return;}if(seen.has(f))return;seen.add(f);active.add(f);stack.push(f);graph.get(f).forEach(visit);stack.pop();active.delete(f);};files.forEach(visit);
assert(!cycles.length,'Import cycles');
const modalFiles=files.filter(f=>f.startsWith('features/')&&f.endsWith('Modal.tsx'));
const modalVariants=[];let modalLogicChecked=0;
for(const f of modalFiles){
 const old=parse(before(f)),current=parse(read(f));let overlay,modal;
 walk(old,n=>{if(ts.isJsxElement(n)&&attribute(n,'className')?.text?.startsWith('fixed inset-0'))overlay=n;});
 walk(current,n=>{if(tag(n)==='Modal')modal=n;});
 assert(Boolean(modal),'Modal not shared: '+f);
 const oldPanel=children(overlay)[0];
 const oldHeader=children(oldPanel)[0], headerNodes=[];
 walk(oldHeader,n=>{if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n))headerNodes.push(n);});
 for(const [name,heading] of [['title','h3'],['subtitle','p']]){
  const node=headerNodes.find(n=>tag(n)===heading);
  const content=before(f).slice(node.openingElement.end,node.closingElement.getStart(old));
  assert(equal(fragment(content),attribute(modal,name).expression),'Changed modal '+name+': '+f);
  const mono=attribute(node,'className').text.includes('font-mono');
  assert((attribute(modal,name+'ClassName')?.text==='font-mono')===mono,'Changed modal typography: '+f);
 }
 assert(equal(headerNodes.find(ts.isJsxSelfClosingElement),attribute(modal,'icon').expression),'Changed modal icon: '+f);
 assert(equal(attribute(headerNodes.find(n=>tag(n)==='button'),'onClick').expression,attribute(modal,'onClose').expression),'Changed modal close handler: '+f);
 const panelClass=attribute(oldPanel,'className').text;
 const width=panelClass.match(/max-w-(\S+)/)[1],height=panelClass.includes('max-h-[85vh]')?'85vh':panelClass.includes('max-h-[90vh]')?'90vh':'content';
 assert(attribute(modal,'size').text===width,'Changed modal width: '+f);
 assert((attribute(modal,'height')?.text||'90vh')===height,'Changed modal height: '+f);
 assert(modal.openingElement.attributes.properties.some(p=>p.name?.getText()==='animated')===panelClass.includes('animate-in'),'Changed modal animation: '+f);
 const oldStatements=old.statements.filter(n=>!ts.isImportDeclaration(n)&&!(ts.isVariableStatement(n)&&['inputClass','labelClass','errorClass'].includes(n.declarationList.declarations[0].name.getText())));
 const newStatements=current.statements.filter(n=>!ts.isImportDeclaration(n));
 for(const n of oldStatements){
  const name=ts.isVariableStatement(n)?n.declarationList.declarations[0].name.getText():n.name?.text;
  const counterpart=newStatements.find(x=>(ts.isVariableStatement(x)?x.declarationList.declarations[0].name.getText():x.name?.text)===name);
  const initializer=ts.isVariableStatement(n)?n.declarationList.declarations[0].initializer:null;
  if(initializer&&ts.isArrowFunction(initializer)&&ts.isBlock(initializer.body)){
   const after=counterpart?.declarationList.declarations[0].initializer;
   // All setup, queries, effects and payload-building handlers before the final JSX return.
   const setup=body=>body.statements.filter((stmt,i)=>{
    let expression=stmt.expression;while(expression&&ts.isParenthesizedExpression(expression))expression=expression.expression;
    return !(i===body.statements.length-1&&ts.isReturnStatement(stmt)&&expression&&ts.isJsxElement(expression));
   });
   assert(JSON.stringify(setup(initializer.body).map(canonical))===JSON.stringify(setup(after.body).map(canonical)),'Changed modal setup or handler: '+f);modalLogicChecked++;
  }else assert(equal(n,counterpart),'Changed modal declaration: '+f+' '+name);
 }
 modalVariants.push({file:f,size:width,height});
}
const protectedFiles=files.filter(f=>f.endsWith('/api.ts')||f.endsWith('/types.ts')&&!f.includes('/controls/')||f.startsWith('shared/')||f.startsWith('app/')||['features/fields/validation.ts','features/auth/AuthContext.tsx','components/Navbar.tsx','lib/validators.ts','lib/labels.ts','lib/format.ts'].includes(f));
for(const f of protectedFiles)assert(read(f).replace(/\r\n/g,'\n').trim()===before(f).replace(/\r\n/g,'\n').trim(),'Changed contract or infrastructure: '+f);
const existingTests=git('ls-tree','-r','--name-only','da9d93b','frontend/src').split('\n').filter(f=>/\.test\.tsx?$/.test(f)).map(f=>f.replace('frontend/src/',''));
for(const f of existingTests)assert(read(f).replace(/\r\n/g,'\n').trim()===before(f).replace(/\r\n/g,'\n').trim(),'Changed existing test: '+f);
assert(fs.readFileSync(path.join(root,'frontend/e2e/dynamic-fields.spec.ts'),'utf8').replace(/\r\n/g,'\n').trim()===git('show','da9d93b:frontend/e2e/dynamic-fields.spec.ts').replace(/\r\n/g,'\n').trim(),'Changed existing E2E');
const changed=[...git('diff','--name-only').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
const forbidden=changed.filter(f=>!f.startsWith('frontend/src/')&&!f.startsWith('frontend/e2e/')&&!f.startsWith('docs/')&&f!=='README.md');assert(!forbidden.length,'Out of scope files: '+forbidden.join(', '));
const lines=s=>s.split(/\r?\n/).length;
const result={phase:4,reference_commit:'da9d93b',control_bodies_unchanged:controlsChecked,registry_types_and_upload_context_unchanged:true,editor_actions_unchanged:editorActionsChecked,editor_sections_equivalent:3,modal_handlers_and_setup_unchanged:modalLogicChecked,modal_headers_and_animations_unchanged:true,modal_variants:modalVariants,contracts_and_infrastructure_files_unchanged:protectedFiles.length,existing_frontend_test_files_unchanged:existingTests.length,existing_e2e_unchanged:true,relative_imports_checked:importsChecked,runtime_import_cycles:cycles,forbidden_changes:forbidden,file_lines:{FieldControls:{before:lines(before('features/fields/FieldControls.tsx')),after:lines(read('features/fields/FieldControls.tsx'))},FieldDefinitionEditor:{before:lines(before('features/fields/FieldDefinitionEditor.tsx')),after:lines(read('features/fields/FieldDefinitionEditor.tsx'))}},errors,status:errors.length?'failed':'passed'};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exit(1);
fs.mkdirSync(path.join(root,'docs/testing/phase4'),{recursive:true});fs.writeFileSync(path.join(root,'docs/testing/phase4/structure-verification.json'),JSON.stringify(result,null,2)+'\n');
