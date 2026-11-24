import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=resolve(import.meta.dirname,'..'),read=p=>readFile(join(root,p),'utf8'),dist=join(root,'dist');
const html=await read('dist/index.html'),login=await read('dist/login/index.html');
assert(Buffer.byteLength(html)<10_000_000,'Keep the entry page below the manual-upload file-size recommendation');
assert(!html.includes('signin-with-chatgpt'));assert(!html.includes('signout-with-chatgpt'));
const scripts=[...html.matchAll(/<script(?: type="module")? src="([^"]+)"/g)].map(m=>m[1]);assert.equal(scripts.length,3);
const sources=await Promise.all(scripts.map(p=>readFile(join(dist,p),'utf8'))),app=sources.find(s=>s.includes('function regularSlides('));assert(app);
assert.match(app,/const AI_SITE_URL=location.origin/);assert(!app.includes('https://rekenstart-herfst-2026.nielskleppe.chatgpt.site'));
assert.doesNotMatch(app,/href="https?:\/\/(?:mijn\.)?numo\.nl\//);
for(const name of ['instrumentPhotos','measurementPhotos','topicPhotos','coinPhotos']){
 const match=app.match(new RegExp('const '+name+'=(\\{[^\\n]+\\});'));assert(match,name);
 for(const url of Object.values(JSON.parse(match[1]))){assert(url.startsWith('/assets/'));assert((await stat(join(dist,url))).size>0);}
}
const original=JSON.parse(await read('src/lesson-data.json'));
const exported=JSON.parse(html.match(/<script type="application\/json" id="rekenstart-data">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual({...exported,images:original.images},original,'All lessons, sector cases, sums and scheduling are preserved');
for(const url of Object.values(exported.images)){assert(url.startsWith('/assets/'));assert((await stat(join(dist,url))).size>0);}
let photos=0;for(const collection of ['photo-bank','career-openings'])for(const p of JSON.parse(await read('assets/'+collection+'/manifest.json')).images){
 const bytes=await readFile(join(dist,'lesbeelden',p.file));assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256);photos++;
}
assert.equal(photos,797);assert.match(login,/id="login-form"/);assert.match(login,/id="login-forgot"/);assert.match(login,/type="password"/);
assert(!JSON.stringify(await readdir(dist)).includes('server'),'Do not publish Worker source as static files');
await build({entryPoints:[join(root,'netlify/functions/api.mjs')],bundle:true,platform:'node',format:'esm',target:'node22',write:false,logLevel:'silent'});
console.log('PASS: Netlify build, '+photos+' intact photos, external image loading, preserved lesson data, login page and bundled Node 22 API.');
