import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');
const core=new Function((await read('src/card-core.js'))+'\n'+(await read('src/card-print.js'))+'\nreturn {validateCard,emptyCard,cardId,CardPrint};')();
const examples=JSON.parse(await read('src/workcard-examples.json'));
for(const card of examples){
 assert.equal(core.validateCard(card,true).templateVersion,'pm-werkkaart-2');
 const pages=core.CardPrint.build(card,{},true);
 assert.equal(pages.length,5,card.sector+' uses four pupil pages and teacher page');
 assert.equal(pages.at(-1).title,'Docentenblad');
 assert.equal(pages.filter(p=>p.nodes.some(n=>n.id==='asset:logo')).length,pages.length);
 assert.equal(pages.reduce((n,p)=>n+p.blocks.filter(b=>b.kind==='step').length,0),card.steps.length);
 assert(pages.every(p=>p.blocks.every(b=>b.y+b.h<=279.1)));
}
const empty=core.emptyCard();assert.equal(core.validateCard(empty).steps.length,3);assert.throws(()=>core.validateCard(empty,true));
for(const image of ['https://example.com/image.jpg','javascript:alert(1)','asset:nonexistent','data:image/svg+xml;base64,abc'])assert.throws(()=>core.validateCard({...examples[0],overviewImage:image}));
assert.throws(()=>core.validateCard({...examples[0],title:'x'.repeat(141)}));
assert.throws(()=>core.validateCard({...examples[0],templateVersion:'unknown'}));
const long=structuredClone(examples[0]);long.steps=Array.from({length:30},(_,i)=>({...long.steps[i%6]}));
assert.equal(core.CardPrint.build(core.validateCard(long),{},false).reduce((n,p)=>n+p.blocks.filter(b=>b.kind==='step').length,0),30);
const goals=JSON.stringify(examples[0].goals);
for(const level of ['Basis','Meer ondersteuning','Meer uitdaging'])assert.equal(JSON.stringify(core.validateCard({...examples[0],level}).goals),goals);
// Check the five examples against independently specified arithmetic outcomes.
assert.match(examples.find(c=>c.sector==='hbr').math.items[0].answer,/1\.600/);
assert.match(examples.find(c=>c.sector==='eco').math.items[0].answer,/9/);
assert.match(examples.find(c=>c.sector==='zw').math.items[0].answer,/3/);
assert.match(examples.find(c=>c.sector==='groen').math.items[0].answer,/4/);
assert.match(examples.find(c=>c.sector==='techniek').math.items[0].answer,/120/);
const db=new DatabaseSync(':memory:');
for(const migration of ['drizzle/0000_rekenstart.sql','drizzle/0001_workcards.sql'])db.exec(await read(migration));
const DB={prepare(sql){return {values:[],bind(...v){this.values=v;return this;},async first(){return db.prepare(sql).get(...this.values)??null;},async all(){return {results:db.prepare(sql).all(...this.values)};},async run(){const r=db.prepare(sql).run(...this.values);return {meta:{changes:Number(r.changes)}};}};},async batch(statements){db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}};
const worker=(await import('data:text/javascript;base64,'+Buffer.from(await read('dist/server/index.js')).toString('base64'))).default;
const send=async(path,body,user='teacher-a',origin='https://test.example')=>{
 const headers={'oai-authenticated-user-id':user,origin};if(body)headers['content-type']='application/json';
 const res=await worker.fetch(new Request('https://test.example'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined}),{DB});
 return {status:res.status,data:await res.json()};
};
await send('/api/state');const planBefore=db.prepare('SELECT * FROM rekenstart_plan').get();
const card={...structuredClone(examples[0]),id:core.cardId(),revision:0};
let r=await send('/api/cards',{card,expectedRevision:0});assert.equal(r.status,200);assert.equal(r.data.revision,1);
assert.equal((await send('/api/cards')).data.cards.length,1);
assert.equal((await send('/api/cards',null,'teacher-b')).data.cards.length,0);
assert.equal((await send('/api/cards/'+card.id,null,'teacher-b')).status,404);
assert.equal((await send('/api/cards',{card,expectedRevision:1},'teacher-b')).status,403);
assert.equal((await send('/api/cards',{card,expectedRevision:1},'teacher-a','https://elsewhere.example')).status,403);
assert.equal((await send('/api/cards',{card,expectedRevision:0})).status,409);
card.title='Aardappelschijfjes · aangepast';r=await send('/api/cards',{card,expectedRevision:1});assert.equal(r.data.revision,2);
assert.equal((await send('/api/cards/'+card.id+'?history=1')).data.versions.length,2);
assert.equal((await send('/api/cards/'+card.id+'?revision=1')).data.card.title,examples[0].title);
assert.equal((await send('/api/cards',{card:{...card,title:''},expectedRevision:2})).status,400);
assert.equal((await send('/api/assistant',{mode:'chat',question:'Geef een tip.',card})).status,503);
// Exercise the real Worker against simulated provider responses; never call a paid API in tests.
const nativeFetch=globalThis.fetch;
const requests=[];
let providerResponse;
globalThis.fetch=async(url,options)=>{requests.push({url,...options,body:JSON.parse(options.body)});return providerResponse.clone();};
const aiSend=async(path,body,origin='https://test.example',user='ai-test-teacher')=>{
 const res=await worker.fetch(new Request('https://test.example'+path,{method:'POST',headers:{'content-type':'application/json',origin,'oai-authenticated-user-id':user},body:JSON.stringify(body)}),{DB,OPENAI_API_KEY:'test-key-not-real',OPENAI_MODEL:'gpt-6-luna',OPENAI_REASONING_EFFORT:'none'});
 return {status:res.status,data:await res.json()};
};
const textResponse=value=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:value}]}]});
try {
 providerResponse=textResponse('Laat leerlingen de maat hardop benoemen.');
 r=await aiSend('/api/assistant',{mode:'chat',question:'Hoe oefen ik taal tijdens het meten?',card});
 assert.equal(r.status,200);assert.match(r.data.message,/hardop/);
 assert.equal(requests.at(-1).url,'https://api.openai.com/v1/responses');
 assert.equal(requests.at(-1).body.model,'gpt-6-luna');assert.deepEqual(requests.at(-1).body.reasoning,{effort:'none'});
 assert.equal(requests.at(-1).body.store,false);assert.equal(requests.at(-1).body.max_output_tokens,650);
 const fields=structuredClone(examples[0]);fields.steps[0].title='Een aangepaste eerste stap';
 providerResponse=textResponse(JSON.stringify(fields));
 r=await aiSend('/api/assistant',{mode:'card',question:'Maak een werkkaart met taal- en rekendoelen.',card});
 assert.equal(r.status,200);assert.equal(r.data.card.status,'draft');assert.equal(r.data.card.steps[0].image,'');
 assert.equal(requests.at(-1).body.text.format.strict,true);assert.equal(requests.at(-1).body.max_output_tokens,4200);
 const lessonData=JSON.parse(await read('src/lesson-data.json'));
 const lesson=lessonData.years.flatMap(year=>year.flatMap(week=>week.lessons))[0];
 const coachInput={lesson:lesson.id,sector:lessonData.sectors[0].id,question:'Gebruik een voorbeeld van de stage.'};
 providerResponse=textResponse(JSON.stringify({title:'Meten op stage',context:'Lees de maat af voor je begint.',tip:'Laat de leerling de eenheid hardop noemen.'}));
 r=await aiSend('/api/coach',coachInput);assert.equal(r.status,200);assert.equal(r.data.title,'Meten op stage');
 assert.deepEqual(requests.at(-1).body.reasoning,{effort:'none'});
 assert.deepEqual(JSON.parse(requests.at(-1).body.input).feiten,lesson.main.facts);
 for(const apiPath of ['/api/assistant','/api/coach']){
   const input=apiPath.endsWith('coach')?coachInput:{mode:'chat',question:'Geef een tip.',card};
   providerResponse=Response.json({error:{code:'credit_balance_exhausted',message:'Do not expose provider details.'}},{status:429});
   r=await aiSend(apiPath,input);assert.equal(r.status,503);assert.match(r.data.error,/gebruikstegoed/);assert.doesNotMatch(r.data.error,/provider details/);
 }
 providerResponse=Response.json({error:{code:'rate_limit_exceeded'}},{status:429});
 r=await aiSend('/api/assistant',{mode:'chat',question:'Geef een tip.',card});assert.equal(r.status,429);assert.doesNotMatch(r.data.error,/gebruikstegoed/);
 providerResponse=Response.json({error:{code:'model_not_found'}},{status:404});
 r=await aiSend('/api/coach',coachInput);assert.equal(r.status,503);assert.match(r.data.error,/instellingen/);
 providerResponse=textResponse('{"title":"Incomplete card"}');
 r=await aiSend('/api/assistant',{mode:'card',question:'Maak een kaart.',card});assert.equal(r.status,502);
 const beforeDenied=requests.length;
 assert.equal((await aiSend('/api/assistant',{mode:'chat',question:'Geef een tip.',card},'https://elsewhere.example')).status,403);
 assert.equal((await aiSend('/api/coach',coachInput,'https://test.example','')).status,403);
 assert.equal(requests.length,beforeDenied);
}finally{globalThis.fetch=nativeFetch;}
assert.deepEqual(db.prepare('SELECT * FROM rekenstart_plan').get(),planBefore);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workcard_versions').get().n,2);
db.close();
console.log('Passed: five examples, pagination, validation, differentiation, storage, version history, access checks, AI chat/card/coach contracts, quota and rate errors, preserved drafts and unchanged lesson plan.');
