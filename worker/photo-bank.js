// Asset data is kept out of the initial HTML and decoded only when requested.
const LESSON_IMAGE_ASSETS=/* LESSON_IMAGE_ASSETS */{};
function lessonImageResponse(request,url){
 if(!url.pathname.startsWith('/lesbeelden/'))return null;
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{allow:'GET, HEAD'}});
 const filename=url.pathname.slice('/lesbeelden/'.length);
 if(!/^[a-z0-9-]+\.webp$/.test(filename))return new Response(null,{status:404});
 const asset=Object.hasOwn(LESSON_IMAGE_ASSETS,filename)?LESSON_IMAGE_ASSETS[filename]:null;
 if(!asset)return new Response(null,{status:404});
 const etag='"'+asset.sha256+'"';
 // A stale version URL must not be cached forever after an image replacement.
 const immutable=url.searchParams.get('v')===asset.sha256.slice(0,12);
 const headers={'content-type':'image/webp','x-content-type-options':'nosniff','cache-control':immutable?'public, max-age=31536000, immutable':'public, max-age=3600',etag,'content-length':String(asset.bytes)};
 if(url.searchParams.get('download')==='1')headers['content-disposition']='attachment; filename="'+filename+'"';
 if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});
 if(request.method==='HEAD')return new Response(null,{headers});
 const binary=atob(asset.data),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new Response(bytes,{headers});
}
