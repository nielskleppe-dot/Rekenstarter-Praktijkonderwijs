import {readFile,writeFile,mkdir,copyFile,readdir,stat,realpath,rm} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist');
const read=p=>readFile(join(root,p),'utf8');
const restored=spawnSync(process.execPath,['scripts/restore-assets.mjs'],{cwd:root,stdio:'inherit'});
if(restored.status!==0)throw Error('The image assets could not be restored');
// Remove only this checkout's generated output, never a linked directory.
try{const actual=await realpath(dist);if(actual!==dist||!actual.startsWith(root+sep))throw Error('Unexpected output location');await rm(dist,{recursive:true,force:true});}catch(error){if(error.code!=='ENOENT')throw error;}
const compiled=spawnSync(process.execPath,['scripts/build.mjs','--netlify'],{cwd:root,stdio:'inherit'});
if(compiled.status!==0)throw Error('The lesson build failed');
await mkdir(join(dist,'assets'),{recursive:true});await mkdir(join(dist,'lesbeelden'),{recursive:true});await mkdir(join(dist,'login'),{recursive:true});
const files=new Map();
async function externalImage(data){
 const parsed=/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(data||'');
 if(!parsed)return data;
 const bytes=Buffer.from(parsed[2],'base64'),hash=createHash('sha256').update(bytes).digest('hex'),file='beeld-'+hash.slice(0,20)+'.'+(parsed[1]==='jpeg'?'jpg':parsed[1]);
 if(!files.has(file)){await writeFile(join(dist,'assets',file),bytes);files.set(file,hash);}
 return '/assets/'+file;
}
let html=await readFile(join(dist,'index.html'),'utf8');
const dataMatch=html.match(/(<script type="application\/json" id="rekenstart-data">)([\s\S]*?)(<\/script>)/);
if(!dataMatch)throw Error('Lesson data missing');
const data=JSON.parse(dataMatch[2]);for(const key of Object.keys(data.images))data.images[key]=await externalImage(data.images[key]);
html=html.replace(dataMatch[0],()=>dataMatch[1]+JSON.stringify(data).replace(/</g,'\\u003c')+dataMatch[3]);
for(const name of ['instrumentPhotos','measurementPhotos','topicPhotos','coinPhotos']){
 const pattern=new RegExp('const '+name+'=(\\{[^\\n]+\\});'),match=html.match(pattern);
 if(!match)throw Error('Picture collection missing: '+name);
 const collection=JSON.parse(match[1]);for(const key of Object.keys(collection))collection[key]=await externalImage(collection[key]);
 html=html.replace(match[0],()=> 'const '+name+'='+JSON.stringify(collection)+';');
}
for(const folder of ['photo-bank','career-openings']){
 const manifest=JSON.parse(await read('assets/'+folder+'/manifest.json'));
 for(const photo of manifest.images){
  const source=join(root,'assets',folder,'images',photo.file),bytes=await readFile(source);
  if(createHash('sha256').update(bytes).digest('hex')!==photo.sha256)throw Error('Photo integrity mismatch: '+photo.id);
  await copyFile(source,join(dist,'lesbeelden',photo.file));
 }
}
html=html.replaceAll('/signin-with-chatgpt?return_to=%2F','/login/').replaceAll('/signout-with-chatgpt?return_to=%2F','/login/?actie=uitloggen').replace(/const AI_SITE_URL="[^"]+";/,'const AI_SITE_URL=location.origin;');
html=html.replace('renderPage();parseLink();readService();',"window.addEventListener('rekenstart-auth-ready',()=>readService());renderPage();parseLink();readService();");
// Cache large application and document-export code separately from the page.
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if(scripts.length!==2)throw Error('Expected the vendor and lesson application scripts');
for(const [index,match]of scripts.entries()){
 const file=(index?'rekenstart':'werkkaart-tools')+'-'+createHash('sha256').update(match[1]).digest('hex').slice(0,16)+'.js';
 await writeFile(join(dist,'assets',file),match[1]);
 html=html.replace(match[0],()=>'<script src="/assets/'+file+'"></script>');
}
html=html.replace('</body>','<script type="module" src="/assets/auth-client.js"></script></body>');
await writeFile(join(dist,'index.html'),html);
const assets=JSON.parse(await read('src/card-assets.json'));
const logo=await externalImage(assets.logo.data);
const login=(await read('src/netlify-login.html')).replace('/assets/school-logo.png',logo);
await writeFile(join(dist,'login/index.html'),login);
await build({entryPoints:[join(root,'src/netlify-auth-client.mjs')],outfile:join(dist,'assets/auth-client.js'),bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,legalComments:'eof'});
// Reuse the validated lesson, card and AI APIs; only identity and storage change.
const {images,brand,...serverData}=JSON.parse(await read('src/lesson-data.json'));
const shared=await read('src/common.js'),cards=await read('src/card-core.js'),cardApi=await read('worker/cards.js');
const ai=(await read('worker/ai.js')).replace('options.timeoutMs??55000','options.timeoutMs??45000');
let server=await read('worker/index.js');
const start=server.indexOf('async function getPlan('),end=server.indexOf('async function readPlan(',start);
if(start<0||end<0)throw Error('Planning API could not be adapted');
server=server.slice(0,start)+`async function getPlan(env,user){
 if(!env.DB)return null;
 let saved=await env.DB.prepare("SELECT owner_id,revision,payload FROM rekenstart_plan WHERE id = 1").first();
 if(!saved&&user==='netlify-admin'){
  await env.DB.prepare("INSERT OR IGNORE INTO rekenstart_plan (id,owner_id,revision,payload) VALUES (1,?,0,?)").bind('netlify-admin',JSON.stringify(baseSettings(DATA))).run();
  saved=await env.DB.prepare("SELECT owner_id,revision,payload FROM rekenstart_plan WHERE id = 1").first();
 }
 return saved;
}
`+server.slice(end);
server=server.replace('export default {','const core={');
const generated=join(root,'netlify/generated');await mkdir(generated,{recursive:true});
const core='const DATA_JSON='+JSON.stringify(JSON.stringify(serverData))+';let DATA;function ensureLessonData(){if(!DATA)DATA=JSON.parse(DATA_JSON);}\n'+shared+'\n'+cards+'\n'+ai+'\n'+cardApi+'\n'+server+'\ncore.offlineState=()=>{ensureLessonData();return {signedIn:false,shared:false,canEdit:false,liveCoach:false,ai:{provider:"gemini",label:"Gemini",ready:false},revision:0,settings:baseSettings(DATA)};};export default core;\n';
await writeFile(join(generated,'api-core.mjs'),core);
const report={lessons:244,professionalPhotos:797,externalImages:files.size,htmlBytes:Buffer.byteLength(html),sourceVersion:37,sourceCommit:'ead46a4be5d6d04a95c79fcb874fc12049c1c27f'};
await writeFile(join(root,'netlify/generated/build-report.json'),JSON.stringify(report,null,2));
console.log('Netlify export: '+JSON.stringify(report));
