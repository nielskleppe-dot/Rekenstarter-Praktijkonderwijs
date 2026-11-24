import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'..'),folder=join(root,'asset-packs');await mkdir(folder,{recursive:true});
const files=[];
async function scan(dir){for(const item of await readdir(join(root,dir),{withFileTypes:true})){const name=dir+'/'+item.name;if(item.isDirectory())await scan(name);else if(/\.(?:webp|png|jpe?g|ico|woff2?|ttf)$/i.test(item.name))files.push(name);}}
await scan('assets');files.sort();const records=[],chunks=[];
const digest=b=>createHash('sha256').update(b).digest('hex');
for(const file of files){
 const bytes=await readFile(join(root,file)),header=Buffer.alloc(512);
 const slash=file.lastIndexOf('/'),name=Buffer.byteLength(file)<=100?file:file.slice(slash+1),prefix=Buffer.byteLength(file)<=100?'':file.slice(0,slash);
 if(Buffer.byteLength(name)>100||Buffer.byteLength(prefix)>155)throw Error('Image filename too long');
 const put=(value,start,size)=>header.write(value,start,size,'utf8'),octal=(value,size)=>value.toString(8).padStart(size-1,'0')+'\0';
 put(name,0,100);put(octal(0o644,8),100,8);put(octal(0,8),108,8);put(octal(0,8),116,8);put(octal(bytes.length,12),124,12);put(octal(0,12),136,12);
 header.fill(32,148,156);header[156]=48;put('ustar\0',257,6);put('00',263,2);put(prefix,345,155);
 const sum=header.reduce((n,b)=>n+b,0);put(sum.toString(8).padStart(6,'0')+'\0 ',148,8);
 chunks.push(header,bytes,Buffer.alloc((512-bytes.length%512)%512));records.push({path:file,bytes:bytes.length,sha256:digest(bytes)});
}
chunks.push(Buffer.alloc(1024));const compressed=gzipSync(Buffer.concat(chunks),{level:9}),parts=[];
for(let offset=0,index=1;offset<compressed.length;offset+=2*1024*1024,index++){
 const bytes=compressed.subarray(offset,offset+2*1024*1024),file='beroepsbeelden-'+String(index).padStart(3,'0')+'.part';
 await writeFile(join(folder,file),bytes);parts.push({file,bytes:bytes.length,sha256:digest(bytes)});
}
await writeFile(join(folder,'manifest.json'),JSON.stringify({format:'ustar+gzip',bytes:compressed.length,sha256:digest(compressed),parts,files:records},null,2));
console.log('Packed '+records.length+' intact image assets into '+parts.length+' verified parts.');
