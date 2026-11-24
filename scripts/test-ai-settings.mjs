import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
// Exercise the actual connection form handler with an isolated DOM fixture.
// No browser storage, server account, or real provider request is involved.
const source=await fs.readFile(new URL('../src/ai-settings.js',import.meta.url),'utf8');
const key={value:'AQ.fake_ui_test_key_not_a_credential',disabled:true};
const checkbox={checked:true,disabled:true},submit={disabled:true},close={disabled:false};
const form={elements:{key,freeTier:checkbox},isConnected:true,hidden:false,handlers:{},reportValidity:()=>true,
 querySelectorAll:selector=>selector==='input'?[key,checkbox]:[key,checkbox,submit],addEventListener(name,callback){this.handlers[name]=callback;}};
const status={textContent:'',dataset:{},after(button){this.next=button;}};
const body={innerHTML:'',replaceChildren(){this.innerHTML='';form.isConnected=false;}};
const dialog={open:false,handlers:{},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();},
 querySelectorAll:()=>[submit,close],querySelector:()=>close,addEventListener(name,callback){this.handlers[name]=callback;}};
const nodes={'ai-connection':dialog,'ai-connection-body':body,'ai-connection-form':form,'ai-connection-status':status,'wc-assistant':{open:false},details:{open:false}};
const document={addEventListener(){},createElement(){return {addEventListener(){}};}};
const replies=[Response.json({canConnect:true,ready:false,revision:0}),Response.json({error:'Gemini is tijdelijk niet beschikbaar.'},{status:503}),Response.json({connected:false}),Response.json({connected:true,revision:1,message:'Gemini is verbonden.'})];
const sent=[];let refreshed=0;
const fetch=async(url,options)=>{sent.push({url,body:options?.body});return replies.shift();};
const {openAIConnection}=new Function('document','$','service','fetch','AbortSignal','readService','state','openWorkcards',source+'\nreturn {openAIConnection};')(document,id=>nodes[id],{canEdit:true,shared:true},fetch,AbortSignal,async()=>{refreshed++;},{},()=>{});
await openAIConnection();
const secret=key.value,event={preventDefault(){}};
await form.handlers.submit(event);
assert.equal(status.dataset.state,'error');assert.match(status.textContent,/tijdelijk/);
assert.equal(key.value,secret,'a failed attempt keeps the key in the current password field');
assert.equal(key.disabled,false);assert.equal(submit.disabled,false);assert.equal(close.disabled,false);
assert.equal(form.hidden,false);assert.equal(refreshed,0,'failure never marks the connection successful');
await form.handlers.submit(event);
assert.equal(status.dataset.state,'error');assert.equal(key.value,secret);assert.equal(refreshed,0);
await form.handlers.submit(event);
assert.equal(status.dataset.state,'success');assert.equal(key.value,'','success clears the password field');assert.equal(form.hidden,true);assert.equal(refreshed,1);
assert(sent.slice(1).every(request=>JSON.parse(request.body).key===secret));
dialog.close();assert.equal(body.innerHTML,'','closing removes the form and its secret input');
console.log('Passed: connection UI preserves the key after failure, rejects unconfirmed success, clears the key after success and removes the form on close.');
