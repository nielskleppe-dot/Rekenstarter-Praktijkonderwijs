// Build-time gzip keeps the large teaching page cheap to load at Worker startup.
// Decode bytes only for a page GET; API and image requests never initialize them.
const PAGE_GZIP_BASE64=/* COMPRESSED_PAGE */"";
let pageGzipBytes;
function compressedPageBytes(){
 if(!pageGzipBytes){
  const binary=atob(PAGE_GZIP_BASE64),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  pageGzipBytes=bytes;
 }
 return pageGzipBytes;
}
function pageAcceptsGzip(header){
 const entries=String(header||'').toLowerCase().split(',').map(part=>{
  const [name,...params]=part.trim().split(';'),quality=params.find(p=>p.trim().startsWith('q='));
  const q=quality===undefined?1:Number(quality.trim().slice(2));
  return {name:name.trim(),q:Number.isFinite(q)&&q>=0&&q<=1?q:0};
 });
 const chosen=entries.find(e=>e.name==='gzip')||entries.find(e=>e.name==='*');
 return Boolean(chosen&&chosen.q>0);
}
function teachingPageResponse(request){
 const gzip=pageAcceptsGzip(request.headers.get('accept-encoding'));
 const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin',vary:'Accept-Encoding'};
 if(gzip)headers['content-encoding']='gzip';
 let body=null;
 if(request.method!=='HEAD'){
  const bytes=compressedPageBytes();
  body=gzip?bytes:new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'));
 }
 // Cloudflare requires manual encoding for an already compressed response body.
 return new Response(body,{headers,encodeBody:'manual'});
}
