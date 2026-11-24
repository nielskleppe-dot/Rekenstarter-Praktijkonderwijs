import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,dirname,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'..'),pack=join(root,'asset-packs');
const digest=b=>createHash('sha256').update(b).digest('hex');
let manifest;
try{manifest=JSON.parse(await readFile(join(pack,'manifest.json'),'utf8'));}catch(error){if(error.code==='ENOENT')process.exit(0);throw error;}
const expected=new Map(manifest.files.map(p=>[p.path,p]));
const valid=await Promise.all(manifest.files.map(async p=>{try{return digest(await readFile(join(root,p.path)))===p.sha256;}catch{return false;}}));
if(valid.every(Boolean)){console.log('All '+valid.length+' image assets are already present and verified.');process.exit(0);}
const chunks=[];for(const part of manifest.parts){
 const file=resolve(pack,part.file);if(!file.startsWith(pack+sep))throw Error('Invalid asset part path');
 const bytes=await readFile(file);if(bytes.length!==part.bytes||digest(bytes)!==part.sha256)throw Error('Image archive part failed its integrity check');chunks.push(bytes);
}
const compressed=Buffer.concat(chunks);if(compressed.length!==manifest.bytes||digest(compressed)!==manifest.sha256)throw Error('Image archive failed its integrity check');
const archive=gunzipSync(compressed),seen=new Set();let offset=0;
while(offset+512<=archive.length){
 const header=archive.subarray(offset,offset+512);offset+=512;if(header.every(value=>value===0))break;
 const field=(start,length)=>header.subarray(start,start+length).toString('utf8').replace(/\0.*$/s,'').trim();
 const prefix=field(345,155),name=(prefix?prefix+'/':'')+field(0,100),type=header[156];
 const path=resolve(root,name),size=parseInt(field(124,12),8),entry=expected.get(name);
 if(!entry||!path.startsWith(join(root,'assets')+sep)||![0,48].includes(type)||!Number.isSafeInteger(size)||size!==entry.bytes||seen.has(name))throw Error('Invalid archive entry');
 let checksum=0;for(let i=0;i<512;i++)checksum+=i>=148&&i<156?32:header[i];
 if(checksum!==parseInt(field(148,8),8))throw Error('Invalid archive header');
 const bytes=archive.subarray(offset,offset+size);if(digest(bytes)!==entry.sha256)throw Error('Image content failed its integrity check');
 await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);seen.add(name);offset+=Math.ceil(size/512)*512;
}
if(seen.size!==expected.size)throw Error('Incomplete image archive');
console.log('Restored and verified '+seen.size+' original image assets.');
