import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(await read('dist/server/index.js')).toString('base64'))).default;
const db=new DatabaseSync(':memory:');
for(const name of (await fs.readdir(new URL('../drizzle',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())db.exec(await read('drizzle/'+name));
const DB={prepare(sql){return {values:[],bind(...v){this.values=v;return this;},async first(){return db.prepare(sql).get(...this.values)??null;},async all(){return {results:db.prepare(sql).all(...this.values)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...this.values).changes)}};}};}};
// Deliberately invalid fixtures; no real service credentials or provider calls.
const key='AQ.test_gemini_key_not_a_real_credential_12345';
const env={DB,AI_PROVIDER:'gemini',AI_CONNECTION_SECRET:'ab'.repeat(32),OPENAI_API_KEY:'must-never-be-used',OPENAI_MODEL:'must-never-be-used'};
const origin='https://test.example';
let userCounter=0;
async function send(path,body,{user='owner',from=origin,runtime=env}={}){
 const headers={origin:from,'content-type':'application/json'};if(user)headers['oai-authenticated-user-id']=user;
 const res=await worker.fetch(new Request(origin+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)}),runtime);
 return {status:res.status,data:await res.json()};
}
const requests=[];
const nativeFetch=globalThis.fetch;
const nativeConsoleError=console.error,diagnostics=[];
console.error=value=>diagnostics.push(String(value));
let response,networkError,responseQueue=[];
globalThis.fetch=async(url,options)=>{
 requests.push({url,headers:options.headers,body:JSON.parse(options.body)});
 if(networkError)throw new Error('Simulated timeout');
 return (responseQueue.shift()??response).clone();
};
const geminiText=(text,finishReason='STOP',parts=[])=>Response.json({candidates:[{finishReason,content:{parts:[...parts,{text}]}}]});
const assistantBody={mode:'chat',question:'Hoe oefen ik taal tijdens het meten?',card:JSON.parse(await read('src/workcard-examples.json'))[0]};
const ask=(body=assistantBody,options={})=>send('/api/assistant',body,{user:'gemini-teacher-'+(++userCounter),...options});
const connect=(body={},options={})=>send('/api/ai-connection',{key,freeTier:true,revision:0,...body},options);
try{
 let r=await send('/api/state');assert.equal(r.data.liveCoach,false);assert.equal(r.data.ai.provider,'gemini');
 const planBefore=db.prepare('SELECT * FROM rekenstart_plan').get();
 r=await send('/api/ai-connection');assert.equal(r.status,200);assert.equal(r.data.ready,false);assert.equal(r.data.canConnect,true);
 assert.equal((await connect({}, {user:''})).status,403);
 assert.equal((await connect({}, {user:'colleague'})).status,403);
 assert.equal((await connect({}, {from:'https://other.example'})).status,403);
 assert.equal((await send('/api/ai-connection',undefined,{user:'colleague'})).status,403);
 assert.equal((await connect({freeTier:false})).status,400);
 assert.equal((await connect({key:'invalid'})).status,400);
 assert.equal((await connect({key:'AQ.invalid key with whitespace'})).status,400);
 assert.equal((await ask()).status,503);
 assert.equal(requests.length,0,'denied requests must not call a provider');

 response=Response.json({error:{message:'Temporary Google failure '+key,status:'UNAVAILABLE'}},{status:503});
 r=await connect();assert.equal(r.status,503);assert.match(r.data.error,/tijdelijk overbelast/);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ai_connection').get().n,0,'failed test cannot store a key');
 assert.equal(requests.length,2,'transient connection failure gets exactly one retry');
 response=geminiText('Verbonden');
 r=await connect();assert.equal(r.status,200);assert.equal(r.data.connected,true);assert.equal(r.data.revision,1);assert.equal(r.data.model,'gemini-3.5-flash-lite');
 const stored=db.prepare('SELECT * FROM ai_connection').get();
 assert.equal(stored.owner_id,'owner');assert.equal(stored.free_tier_confirmed,1);
 assert(!JSON.stringify(stored).includes(key),'database must contain only encrypted credentials');
 assert.equal(Buffer.from(stored.iv,'base64').length,12);
 assert(!JSON.stringify(r.data).includes(key));
 r=await send('/api/ai-connection');assert.equal(r.data.ready,true);assert.equal(r.data.revision,1);
 assert.deepEqual(Object.keys(r.data).sort(),['provider','ready','revision','verifiedAt','managed','canConnect'].sort());
 assert.equal((await send('/api/state')).data.liveCoach,true);
 assert.equal((await send('/api/state',undefined,{user:'colleague'})).data.liveCoach,true);
 assert.equal((await send('/api/state',undefined,{user:''})).data.liveCoach,false);
 let count=requests.length;assert.equal((await connect()).status,409);assert.equal(requests.length,count,'stale settings rejected before API call');

 response=geminiText('Laat de leerling de eenheid hardop noemen.','STOP',[{thought:true,text:'Hidden reasoning'}]);
 r=await ask();assert.equal(r.status,200);assert.equal(r.data.message,'Laat de leerling de eenheid hardop noemen.');
 let sent=requests.at(-1);
 assert.equal(sent.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
 assert.equal(sent.headers['x-goog-api-key'],key);assert(!sent.url.includes(key));assert(!JSON.stringify(sent.body).includes(key));
 assert.equal(sent.body.generationConfig.thinkingConfig.thinkingLevel,'LOW');assert.equal(sent.body.generationConfig.maxOutputTokens,2048);

 responseQueue=[Response.json({error:{status:'INTERNAL',message:key}},{status:500}),geminiText('Het tweede verzoek slaagt.')];
 count=requests.length;r=await ask();assert.equal(r.status,200);assert.equal(r.data.message,'Het tweede verzoek slaagt.');
 assert.equal(requests.length-count,2);assert.equal(responseQueue.length,0);

 const fields=structuredClone(assistantBody.card);fields.steps[0].title='Gewijzigde eerste stap';
 response=geminiText(JSON.stringify(fields));
 r=await ask({...assistantBody,mode:'card'});assert.equal(r.status,200);assert.equal(r.data.card.status,'draft');assert.equal(r.data.card.steps[0].image,'');
 sent=requests.at(-1);assert.equal(sent.body.generationConfig.responseMimeType,'application/json');
 assert.equal(sent.body.generationConfig.responseJsonSchema.type,'object');assert.equal(sent.body.generationConfig.maxOutputTokens,8400);
 assert(!JSON.stringify(sent.body).includes('data:image'));
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workcards').get().n,0,'proposal never saves a card automatically');

 const data=JSON.parse(await read('src/lesson-data.json'));
 const lesson=data.years[0][0].lessons[0];
 response=geminiText(JSON.stringify({title:'Meten op stage',context:'Lees de maat af voor je begint.',tip:'Benoem de eenheid.'}));
 r=await send('/api/coach',{lesson:lesson.id,sector:data.sectors[0].id,question:'Geef een stagevoorbeeld.'},{user:'coach-teacher'});
 assert.equal(r.status,200);assert.equal(r.data.title,'Meten op stage');
 assert.deepEqual(JSON.parse(requests.at(-1).body.contents[0].parts[0].text).feiten,lesson.main.facts);

 for(const [providerResponse,status,pattern] of [
   [Response.json({error:{message:key,status:'RESOURCE_EXHAUSTED'}},{status:429}),429,/gebruikslimiet/],
   [Response.json({error:{message:key,status:'PERMISSION_DENIED'}},{status:403}),503,/instellingen/],
   [Response.json({error:{message:key,status:'UNAVAILABLE'}},{status:503}),503,/tijdelijk overbelast/],
   [Response.json({error:{message:key,status:'INTERNAL'}},{status:500}),503,/interne storing/],
   [Response.json({error:{message:'Free tier is not available in your country. '+key,status:'FAILED_PRECONDITION'}},{status:400}),503,/gratis API-gebruik/],
   [Response.json({error:{message:key,status:'FAILED_PRECONDITION'}},{status:400}),503,/voorwaarden/],
   [Response.json({error:{message:key,status:'INVALID_ARGUMENT'}},{status:400}),503,/formaat/],
   [Response.json({error:{message:key,code:'parameter_unknown'}},{status:400}),503,/formaat/],
   [Response.json({error:{message:key,status:'UNAUTHENTICATED'}},{status:401}),503,/accepteert deze API-sleutel niet/],
   [Response.json({error:{message:'API key not valid. '+key,status:'INVALID_ARGUMENT'}},{status:400}),503,/herkent deze API-sleutel niet/],
   [Response.json({error:{message:key,code:'payment_required'}},{status:402}),503,/gratis API-gebruik/],
   [Response.json({error:{message:key,status:'NOT_FOUND'}},{status:404}),503,/modelinstellingen/],
   [Response.json({error:{message:key,status:'DEADLINE_EXCEEDED'}},{status:504}),504,/niet op tijd/],
   [geminiText('Een half antwoord','MAX_TOKENS'),502,/niet volledig/],
   [geminiText('Verboden antwoord','SAFETY'),502,/niet beantwoorden/],
   [geminiText(''),502,/geen bruikbaar antwoord/],
   [Response.json({promptFeedback:{blockReason:'SAFETY'}}),502,/niet beantwoorden/],
   [new Response('Not JSON',{status:200}),502,/niet beantwoorden/]
 ]){
   response=providerResponse;count=requests.length;r=await ask();assert.equal(r.status,status);assert.match(r.data.error,pattern);assert(!JSON.stringify(r.data).includes(key));
   assert.equal(requests.length-count,[500,502,503].includes(providerResponse.status)?2:1,'retry only explicit transient HTTP errors');
 }
 response=geminiText('{"title":"Not a workcard"}');
 assert.equal((await ask({...assistantBody,mode:'card'})).status,502);
 networkError=true;assert.equal((await ask()).status,504);networkError=false;
 response=Response.json({error:{message:'bad key'}},{status:403});
 assert.equal((await connect({revision:1,key:'different_invalid_fake_key_12345'})).status,503);
 assert.deepEqual(db.prepare('SELECT * FROM ai_connection').get(),stored,'failed replacement preserves working encrypted key');
 const wrongSecret={...env,AI_CONNECTION_SECRET:'cd'.repeat(32)};
 assert.equal((await send('/api/state',undefined,{runtime:wrongSecret})).data.liveCoach,false);
 assert.equal((await send('/api/ai-connection',undefined,{runtime:wrongSecret})).data.ready,false);
 count=requests.length;assert.equal((await ask(assistantBody,{runtime:wrongSecret})).status,503);assert.equal(requests.length,count);
 assert(requests.every(r=>r.url==='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'),'connection, chat, card and coach use the same free-tier-capable model with no provider fallback');
 assert.deepEqual(db.prepare('SELECT * FROM rekenstart_plan').get(),planBefore);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workcards').get().n,0);
 assert(!diagnostics.join('\n').includes(key),'diagnostic logs must never include a key echoed by the provider');
 assert(!diagnostics.join('\n').includes(assistantBody.question),'diagnostic logs must never include prompts');
 const events=diagnostics.map(value=>JSON.parse(value));
 assert(events.every(event=>event.model==='gemini-3.5-flash-lite'));
 assert(events.some(event=>event.reason==='free_tier_unavailable'));
 assert(events.some(event=>event.reason==='provider_internal'&&event.attempt===1));
 assert(events.some(event=>event.reason==='unavailable'&&event.attempt===2));
 assert(events.every(event=>Object.keys(event).every(name=>['event','reference','model','httpStatus','providerCodes','reason','attempt'].includes(name))));
 console.log('Passed: Gemini connection test, owner access, encrypted key storage, chat/card/coach contracts, specific sanitized errors, bounded transient retry, no quota/billing retry or paid fallback, unchanged cards and planning. Provider responses were simulated.');
}finally{globalThis.fetch=nativeFetch;console.error=nativeConsoleError;db.close();}
