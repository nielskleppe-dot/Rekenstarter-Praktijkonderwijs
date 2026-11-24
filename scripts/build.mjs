import {mkdir,readFile,writeFile,copyFile,readdir} from "node:fs/promises";
import {resolve} from "node:path";
import {gzipSync} from "node:zlib";
import {buildCatalog} from "../src/catalog-authoring.mjs";
const root=resolve(import.meta.dirname,".."),read=f=>readFile(resolve(root,f),"utf8");
const [template,style,cardStyle,common,core,visuals,client,teachers,cards,printer,server,cardServer,aiServer,aiClient,dataText,assetsText,examplesText,...vendor]=await Promise.all([
"src/index.html","src/styles.css","src/workcards.css","src/common.js","src/card-core.js","src/visuals.js","src/client.js","src/teachers.js","src/workcards.js","src/card-print.js","worker/index.js","worker/cards.js","worker/ai.js","src/ai-settings.js","src/lesson-data.json","src/card-assets.json","src/workcard-examples.json","vendor/jszip.js","vendor/docx.js","vendor/pdf-lib.js"].map(read));
const data=JSON.parse(dataText),assets=JSON.parse(assetsText);
const safeJSON=s=>JSON.stringify(JSON.parse(s)).replace(/</g,"\\u003c");
const metric=await read("src/metric.js");
const catalog=await read("src/catalog.js");
const measurements=await read("src/measurement-visuals.js");
const photoBank=JSON.parse(await read('assets/photo-bank/manifest.json'));
const generatedPhotos=photoBank.images.filter(photo=>photo.status==='generated');
const careerBank=JSON.parse(await read('assets/career-openings/manifest.json'));
const generatedCareerPhotos=careerBank.images.filter(photo=>photo.status==='generated');
if(!generatedCareerPhotos.length||generatedCareerPhotos.length!==careerBank.images.length)throw Error('Complete all commissioned workplace opening photos before building');
const careerMetadata=generatedCareerPhotos.map(({id,sector,material,question,topic,alt,file,width,height,sha256,varietyGroup})=>({id,sector,material,question,topic,alt,width,height,varietyGroup,url:'/lesbeelden/'+file+'?v='+sha256.slice(0,12)}));
const bankMetadata=generatedPhotos.map(({id,sector,kind,alt,material,file,width,height,sha256,referenceSubject,measurementGroup,batch})=>({id,sector,kind,alt,material,width,height,referenceSubject,measurementGroup,batch,url:'/lesbeelden/'+file+'?v='+sha256.slice(0,12)}));
const bankAssets=Object.fromEntries(await Promise.all(generatedPhotos.map(async photo=>[photo.file,{sha256:photo.sha256,bytes:photo.bytes,data:(await readFile(resolve(root,'assets/photo-bank/images',photo.file))).toString('base64')}])))
for(const photo of generatedCareerPhotos){const raw=await readFile(resolve(root,'assets/career-openings/images',photo.file));bankAssets[photo.file]={sha256:photo.sha256,bytes:photo.bytes,data:raw.toString('base64')};}
const bankServer=(await read('worker/photo-bank.js')).replace('/* LESSON_IMAGE_ASSETS */{}',()=>JSON.stringify(bankAssets));
const catalogText=JSON.stringify(buildCatalog(data,generatedPhotos));
await writeFile(resolve(root,"src/catalog-data.json"),catalogText);
const instrumentKeys=["length","mass","volume","bricks","kerb"];
const photoData=Object.fromEntries(await Promise.all(instrumentKeys.map(async key=>[key,"data:image/webp;base64,"+(await readFile(resolve(root,"assets/instruments/"+key+".webp"))).toString("base64")])));
const measurementKeys=(await readdir(resolve(root,"assets/measurement"))).filter(f=>f.endsWith(".webp"));
const measurementData=Object.fromEntries(await Promise.all(measurementKeys.map(async file=>[file.replace(".webp",""),"data:image/webp;base64,"+(await readFile(resolve(root,"assets/measurement",file))).toString("base64")])));
for(const file of await readdir(resolve(root,'assets/tasks'))){
 if(file.endsWith('.webp'))measurementData[file.slice(0,-5)]='data:image/webp;base64,'+(await readFile(resolve(root,'assets/tasks',file))).toString('base64');
}
const photoMeasurements=measurements.replace("/* MEASUREMENT_PHOTOS */{}",()=>JSON.stringify(measurementData));
const topicKeys=(await readdir(resolve(root,"assets/topics"))).filter(f=>f.endsWith(".webp"));
const topicData=Object.fromEntries(await Promise.all(topicKeys.map(async file=>[file.replace(".webp",""),"data:image/webp;base64,"+(await readFile(resolve(root,"assets/topics",file))).toString("base64")])));
const coinFiles=(await readdir(resolve(root,"assets/coins"))).filter(f=>/\.(jpg|png)$/.test(f));
if(coinFiles.length!==8)throw Error("All eight euro coin photos are required.");
const coinData=Object.fromEntries(await Promise.all(coinFiles.map(async file=>[file.split('.')[0],"data:image/"+(file.endsWith('.png')?'png':'jpeg')+";base64,"+(await readFile(resolve(root,"assets/coins",file))).toString("base64")])));
const photoVisuals=visuals.replace("/* INSTRUMENT_PHOTOS */{}",()=>JSON.stringify(photoData)).replace("/* TOPIC_PHOTOS */{}",()=>JSON.stringify(topicData)).replace("/* COIN_PHOTOS */{}",()=>JSON.stringify(coinData)).replace('/* LESSON_PHOTO_BANK */[]',()=>JSON.stringify(bankMetadata)).replace('/* CAREER_PHOTOS */[]',()=>JSON.stringify(careerMetadata));
const photoVariety=await read('src/photo-variety.js');
const app='(()=>{"use strict";\n'+[common,core,photoVisuals,photoMeasurements,metric,catalog,client,photoVariety,teachers,printer,cards,aiClient,"renderPage();parseLink();readService();"].join("\n")+'\n})();';
const safeScript=s=>s.replace(/<\/script/gi,"<\\/script");
const refined=await read("src/refined-layout.css");
let html=template.replace("/* REKENSTART_STYLES */",()=>style+"\n"+cardStyle+"\n"+refined).replace("/* REKENSTART_DATA */",()=>safeJSON(dataText)).replace("/* CATALOG_DATA */",()=>safeJSON(catalogText)).replace("/* WORKCARD_ASSETS */",()=>safeJSON(assetsText)).replace("/* WORKCARD_EXAMPLES */",()=>safeJSON(examplesText)).replace("/* WORKCARD_VENDOR */",()=>safeScript(vendor.join("\n;\n"))).replace("/* REKENSTART_APP */",()=>safeScript(app)).replace("/* SCHOOL_LOGO */",()=>assets.logo.data);
// The server needs lesson text and planning, not a second copy of presentation images.
// Keep the complete supplied data in HTML, including offline exports.
const {images:browserImages,brand:browserBrand,...serverData}=data;
const compressedPage=gzipSync(Buffer.from(html,'utf8'),{level:9});
const pageServer=(await read('worker/page.js')).replace('/* COMPRESSED_PAGE */""',()=>JSON.stringify(compressedPage.toString('base64')));
const lazyData="const DATA_JSON="+JSON.stringify(JSON.stringify(serverData))+";\nlet DATA;\nfunction ensureLessonData(){if(!DATA)DATA=JSON.parse(DATA_JSON);}\n";
const worker=lazyData+pageServer+"\n"+common+"\n"+core+"\n"+aiServer+"\n"+cardServer+"\n"+bankServer+"\n"+server;
const dist=resolve(root,"dist");
await mkdir(dist,{recursive:true});
await writeFile(resolve(dist,"index.html"),html);
if(!process.argv.includes('--netlify')){
for(const folder of["server",".openai","drizzle"])await mkdir(resolve(dist,folder),{recursive:true});
await writeFile(resolve(dist,"server/index.js"),worker);
await copyFile(resolve(root,".openai/hosting.json"),resolve(dist,".openai/hosting.json"));
for(const f of await readdir(resolve(root,"drizzle")))if(f.endsWith(".sql"))await copyFile(resolve(root,"drizzle",f),resolve(dist,"drizzle",f));
}
const ix=process.argv.indexOf("--offline");if(ix>=0){if(!process.argv[ix+1])throw Error("Output path required");await writeFile(resolve(process.argv[ix+1]),html);}
console.log("Built "+data.years.flatMap(y=>y.flatMap(w=>w.lessons)).length+" lessons, "+data.sectors.length+" sectors, "+JSON.parse(examplesText).length+" workcards and "+generatedPhotos.length+" separately loaded lesson images.");
