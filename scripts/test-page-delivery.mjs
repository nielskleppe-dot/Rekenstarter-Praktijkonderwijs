import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const html=await read('dist/index.html'),compressed=gzipSync(Buffer.from(html,'utf8'),{level:9});
const source=(await read('worker/page.js')).replace('/* COMPRESSED_PAGE */""',()=>JSON.stringify(compressed.toString('base64')));
const app=new Function(source+'\nreturn {teachingPageResponse,pageAcceptsGzip,isLoaded:()=>pageGzipBytes!==undefined};')();
assert.equal(app.isLoaded(),false);
for(const accept of ['', 'gzip', 'br, gzip', 'gzip;q=0', '*;q=0.5', '*;q=1,gzip;q=0']){
 const response=app.teachingPageResponse(new Request('https://fixture.test',{method:'HEAD',headers:{'accept-encoding':accept}}));
 assert.equal((await response.arrayBuffer()).byteLength,0);assert.equal(app.isLoaded(),false,'HEAD must never decode the page');
}
for(const accept of ['gzip','br, gzip','gzip;q=0.5','*;q=1']){
 const response=app.teachingPageResponse(new Request('https://fixture.test',{headers:{'accept-encoding':accept}}));
 assert.equal(response.status,200);assert.equal(response.headers.get('content-encoding'),'gzip');
 assert.equal(gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8'),html);
 assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('vary'),'Accept-Encoding');
}
for(const accept of ['','identity','br','gzip;q=0','*;q=1,gzip;q=0']){
 const response=app.teachingPageResponse(new Request('https://fixture.test',{headers:{'accept-encoding':accept}}));
 assert.equal(response.headers.get('content-encoding'),null);assert.equal(await response.text(),html);
}
const workerSource=await read('dist/server/index.js');
assert(workerSource.startsWith('const DATA_JSON='),'lesson objects are not eagerly constructed at startup');
assert(!workerSource.includes('const HTML='),'no uncompressed teaching page at startup');
assert(compressed.length<Buffer.byteLength(html),'precompress the page during the build');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(workerSource).toString('base64'))).default;
const response=await worker.fetch(new Request('https://fixture.test',{headers:{'accept-encoding':'gzip'}}),{});
assert.equal(response.status,200);assert.equal(gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8'),html);
const state=await worker.fetch(new Request('https://fixture.test/api/state'),{});
assert.equal(state.status,200);assert((await state.json()).settings.starts.length>0,'planning still initializes on its API route');
console.log(JSON.stringify({pass:true,htmlBytes:Buffer.byteLength(html),gzipBytes:compressed.length,workerBytes:Buffer.byteLength(workerSource),delivery:'GET/HEAD, gzip negotiation and exact HTML, lazy startup and planning API'}));
