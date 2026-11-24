import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve} from "node:path";
let worker,stamp;
async function load(){const path=resolve("dist/server/index.js"),st=(await stat(path)).mtimeMs;if(stamp!==st){worker=(await import("data:text/javascript;base64,"+Buffer.from(await readFile(path)).toString("base64"))).default;stamp=st;}return worker;}
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(","):v);const request=new Request("http://"+req.headers.host+req.url,{method:req.method,headers,body:["GET","HEAD"].includes(req.method)?undefined:Buffer.concat(chunks)});const response=await(await load()).fetch(request,{});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(error){console.error(error.message);res.writeHead(500);res.end("Preview kon niet laden.");}});
const portArg=process.argv.indexOf("--port");
server.listen(Number(portArg>=0?process.argv[portArg+1]:process.env.PORT||3000),"0.0.0.0",()=>console.log("Rekenstart preview ready"));

