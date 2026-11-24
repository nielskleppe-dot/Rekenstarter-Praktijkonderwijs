const GEMINI_MODEL = "gemini-3.5-flash-lite";
function aiProvider(env) { return env.AI_PROVIDER || (env.GEMINI_API_KEY ? "gemini" : "openai"); }
function aiError(message,status=503) { return Object.assign(Error(message),{status,ai:true}); }
function aiReasoning(env) { return env.OPENAI_REASONING_EFFORT ? {reasoning:{effort:env.OPENAI_REASONING_EFFORT}} : {}; }
function aiBase64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function aiBytes(text) { return Uint8Array.from(atob(text),c=>c.charCodeAt(0)); }
async function aiStorageKey(env) {
  if(!/^[a-f0-9]{64}$/.test(env.AI_CONNECTION_SECRET||""))throw aiError("De beveiligde sleutelopslag is nog niet beschikbaar.");
  return crypto.subtle.importKey("raw",Uint8Array.from(env.AI_CONNECTION_SECRET.match(/../g),b=>parseInt(b,16)),"AES-GCM",false,["encrypt","decrypt"]);
}
async function aiEncrypt(env,secret,owner) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode("rekenstart:gemini:"+owner)},await aiStorageKey(env),new TextEncoder().encode(secret));
  return {ciphertext:aiBase64(encrypted),iv:aiBase64(iv)};
}
async function aiDecrypt(env,row) {
  try {
    const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:aiBytes(row.iv),additionalData:new TextEncoder().encode("rekenstart:gemini:"+row.owner_id)},await aiStorageKey(env),aiBytes(row.ciphertext));
    return new TextDecoder().decode(plain);
  }catch{throw aiError("De Gemini-sleutel kan niet worden geopend. Laat de sitebeheerder de koppeling opnieuw instellen.");}
}
async function aiConfig(env) {
  const provider=aiProvider(env);
  if(provider==="openai")return {provider,model:env.OPENAI_MODEL,key:env.OPENAI_API_KEY};
  if(provider!=="gemini")throw aiError("De AI-instellingen moeten worden gecontroleerd.");
  if(env.GEMINI_API_KEY)return {provider,model:GEMINI_MODEL,key:env.GEMINI_API_KEY};
  const row=env.DB?await env.DB.prepare("SELECT owner_id,ciphertext,iv,revision,verified_at FROM ai_connection WHERE id=1").first():null;
  return {provider,model:GEMINI_MODEL,key:row?await aiDecrypt(env,row):null};
}
async function aiState(env,user) {
  const provider=aiProvider(env);
  if(!user||!env.DB)return {provider,label:provider==="gemini"?"Gemini":"OpenAI",ready:false};
  try {const config=await aiConfig(env);return {provider,label:provider==="gemini"?"Gemini":"OpenAI",ready:Boolean(config.key&&config.model)};}
  catch{return {provider,label:provider==="gemini"?"Gemini":"OpenAI",ready:false};}
}
function geminiFailure(response,raw,reference,attempt){
  // Only known enum values leave this function. Provider messages may contain
  // credentials, prompts or project identifiers, so never log or return them.
  const known=new Set(["INVALID_ARGUMENT","INVALID_REQUEST","PARAMETER_UNKNOWN","FAILED_PRECONDITION","API_KEY_INVALID","API_KEY_EXPIRED","API_KEY_SERVICE_BLOCKED","SERVICE_DISABLED","UNAUTHENTICATED","AUTHENTICATION","ACCESS_TOKEN_TYPE_UNSUPPORTED","PERMISSION_DENIED","NOT_FOUND","MODEL_NOT_FOUND","RESOURCE_EXHAUSTED","RATE_LIMIT_EXCEEDED","QUOTA_EXCEEDED","TOO_MANY_REQUESTS","PAYMENT_REQUIRED","INTERNAL","API_ERROR","UNAVAILABLE","SERVICE_UNAVAILABLE","DEADLINE_EXCEEDED"]);
  const details=Array.isArray(raw?.error?.details)?raw.error.details:[];
  const codes=[raw?.error?.status,raw?.error?.code,...details.map(d=>d?.reason)].filter(c=>typeof c==="string").map(c=>c.toUpperCase()).filter(c=>known.has(c));
  const has=(...items)=>items.some(c=>codes.includes(c));
  const providerText=typeof raw?.error?.message==="string"?raw.error.message:"";
  const status=response.status;
  let reason="provider_error",message="Google kon de aanvraag niet uitvoeren. Probeer later opnieuw.",httpStatus=502,retryable=false;
  if(has("API_KEY_INVALID","API_KEY_EXPIRED")||/API key not valid|API_KEY_INVALID|API key expired/i.test(providerText)){
    reason="invalid_key";message="Google herkent deze API-sleutel niet of de sleutel is verlopen. Kopieer de volledige sleutel opnieuw uit Google AI Studio.";httpStatus=503;
  }else if(status===401||has("UNAUTHENTICATED","AUTHENTICATION","ACCESS_TOKEN_TYPE_UNSUPPORTED")){
    reason="authentication";message="Google accepteert deze API-sleutel niet. Controleer de sleutel in Google AI Studio en maak daar zo nodig een nieuwe sleutel.";httpStatus=503;
  }else if(status===402||has("PAYMENT_REQUIRED")||has("FAILED_PRECONDITION")&&/billing|free tier|paid|payment|country|region|location/i.test(providerText)){
    reason="free_tier_unavailable";message="Google staat gratis API-gebruik voor deze aanvraag niet toe. Controleer in AI Studio of je project Free tier heeft. Laat betaalde facturering uit; de verbinding is nog niet opgeslagen.";httpStatus=503;
  }else if(status===403||has("PERMISSION_DENIED","SERVICE_DISABLED","API_KEY_SERVICE_BLOCKED")){
    reason="permission";message="Deze Google-sleutel heeft geen toegang tot de Gemini API. Controleer de API-instellingen en projectrechten in Google AI Studio.";httpStatus=503;
  }else if(status===404||has("MODEL_NOT_FOUND","NOT_FOUND")){
    reason="model_unavailable";message="Het ingestelde Gemini-model is voor deze aanvraag niet beschikbaar. Laat de sitebeheerder de modelinstellingen controleren.";httpStatus=503;
  }else if(status===429||has("RESOURCE_EXHAUSTED","RATE_LIMIT_EXCEEDED","QUOTA_EXCEEDED","TOO_MANY_REQUESTS")){
    reason="quota";message="De Gemini-gebruikslimiet voor dit Google-project is bereikt. Bekijk de limiet in Google AI Studio en probeer na het herstel van de limiet opnieuw.";httpStatus=429;
  }else if(has("FAILED_PRECONDITION")){
    reason="project_setup";message="Google meldt dat dit project nog niet aan de voorwaarden voor API-gebruik voldoet. Controleer de projectinstellingen in Google AI Studio.";httpStatus=503;
  }else if(status===400||has("INVALID_ARGUMENT","INVALID_REQUEST","PARAMETER_UNKNOWN")){
    reason="request_format";message="Google wijst het formaat van de AI-aanvraag af. De sitebeheerder moet de koppeling controleren; je hoeft hiervoor geen betaalde facturering aan te zetten.";httpStatus=503;
  }else if(status===503||has("UNAVAILABLE","SERVICE_UNAVAILABLE")){
    reason="unavailable";message="Gemini is tijdelijk overbelast of niet beschikbaar. Probeer later opnieuw; je werk blijft behouden.";httpStatus=503;retryable=true;
  }else if(status===500||has("INTERNAL","API_ERROR")){
    reason="provider_internal";message="Er is een interne storing bij Google. Probeer later opnieuw; je werk blijft behouden.";httpStatus=503;retryable=true;
  }else if(status===502){
    reason="gateway";message="De verbinding met Google gaf een tijdelijke serverfout. Probeer later opnieuw; je werk blijft behouden.";httpStatus=503;retryable=true;
  }else if(status===504||has("DEADLINE_EXCEEDED")){
    reason="deadline";message="Google kon niet op tijd antwoorden. Probeer later opnieuw; je werk blijft behouden.";httpStatus=504;
  }
  console.error(JSON.stringify({event:"gemini_request_failed",reference,model:GEMINI_MODEL,httpStatus:status,providerCodes:[...new Set(codes)],reason,attempt}));
  return Object.assign(aiError(message+" (Google "+status+" · "+reference+")",httpStatus),{retryable});
}
async function aiRequest(config,env,options) {
  if(!config.key||!config.model)throw aiError(config.provider==="gemini"?"Gemini is nog niet verbonden. De sitebeheerder kan bij Beheer de Google-sleutel koppelen.":"De AI-verbinding moet nog worden ingesteld.");
  let url,body,headers={"content-type":"application/json"};
  if(config.provider==="gemini"){
    url="https://generativelanguage.googleapis.com/v1beta/models/"+GEMINI_MODEL+":generateContent";
    headers["x-goog-api-key"]=config.key;
    body={systemInstruction:{parts:[{text:options.instructions}]},contents:[{role:"user",parts:[{text:options.input}]}],generationConfig:{maxOutputTokens:Math.max(options.maxOutputTokens*2,2048),thinkingConfig:{thinkingLevel:"LOW"}}};
    if(options.schema){body.generationConfig.responseMimeType="application/json";body.generationConfig.responseJsonSchema=options.schema;}
  }else{
    url="https://api.openai.com/v1/responses";headers.authorization="Bearer "+config.key;
    body={model:config.model,...aiReasoning(env),store:false,max_output_tokens:options.maxOutputTokens,instructions:options.instructions,input:options.input};
    if(options.schema)body.text={format:{type:"json_schema",name:options.name||"werkkaart",strict:true,schema:options.schema}};
  }
  let response,raw;
  const deadline=Date.now()+(options.timeoutMs??55000),reference="G-"+crypto.randomUUID().slice(0,8);
  for(let attempt=1;attempt<=2;attempt++){
    const signal=AbortSignal.timeout(Math.max(1,deadline-Date.now()));
    try{
      response=await fetch(url,{method:"POST",headers,body:JSON.stringify(body),signal});
      raw=await response.json().catch(()=>null);
      if(signal.aborted)throw Error("deadline");
    }catch{
      if(config.provider==="gemini")console.error(JSON.stringify({event:"gemini_request_failed",reference,model:GEMINI_MODEL,reason:signal.aborted?"timeout":"network",attempt}));
      throw aiError("De verbinding met de AI is onderbroken of duurde te lang. Probeer later opnieuw; je werk blijft behouden."+(config.provider==="gemini"?" ("+reference+")":""),504);
    }
    if(response.ok||config.provider!=="gemini")break;
    const failure=geminiFailure(response,raw,reference,attempt);
    // Retry an explicit transient provider error once within the same deadline.
    // No retries for quota, credentials, billing, timeouts or failed validation.
    if(attempt===1&&failure.retryable&&deadline-Date.now()>12000){
      await new Promise(resolve=>setTimeout(resolve,1000));
      continue;
    }
    throw failure;
  }
  if(!response.ok){
    const code=raw?.error?.code,status=raw?.error?.status;
    if(code==="credit_balance_exhausted"||code==="insufficient_quota")throw aiError("De AI heeft geen gebruikstegoed beschikbaar. De sitebeheerder moet het API-tegoed of de gebruikslimiet controleren. Je werk blijft behouden.");
    if(response.status===429)throw aiError(config.provider==="gemini"?"De Gemini-gebruikslimiet is bereikt. Probeer later opnieuw. Je werk blijft behouden.":"De AI krijgt tijdelijk te veel vragen. Probeer het over een minuut opnieuw. Je werk blijft behouden.",429);
    if([401,403,404].includes(response.status)||code==="model_not_found"||status==="INVALID_ARGUMENT")throw aiError("De AI-instellingen moeten door de sitebeheerder worden gecontroleerd. Controleer de sleutel en modeltoegang. Je werk blijft behouden.");
    throw aiError("De AI kan nu geen antwoord geven. Je werk blijft behouden. Probeer later opnieuw.",502);
  }
  let text;
  if(config.provider==="gemini"){
    const candidate=raw?.candidates?.[0];
    if(raw?.promptFeedback?.blockReason||candidate?.finishReason!=="STOP")throw aiError(candidate?.finishReason==="MAX_TOKENS"?"Het AI-antwoord is niet volledig. Vraag om een kortere opdracht; je werk blijft behouden.":"Gemini kon deze vraag niet beantwoorden. Pas de vraag aan; je werk blijft behouden.",502);
    text=Array.isArray(candidate.content?.parts)?candidate.content.parts.filter(p=>!p?.thought&&typeof p?.text==="string").map(p=>p.text).join("\n"):"";
  }else{
    if(raw?.status&&raw.status!=="completed")throw aiError("Het AI-antwoord is niet volledig. Probeer een kortere opdracht.",502);
    text=raw?.output?.flatMap(p=>p.content??[]).filter(p=>p.type==="output_text").map(p=>p.text).join("\n");
  }
  if(!text?.trim())throw aiError("De AI gaf geen bruikbaar antwoord. Je werk blijft behouden.",502);
  return text.trim();
}
async function aiRun(env,options) { return aiRequest(await aiConfig(env),env,options); }

async function aiConnectionApi(request,env,url) {
  const user=request.headers.get("oai-authenticated-user-id");
  if(!user||!env.DB)return jsonError("Log in op de online website om Gemini te koppelen.",403);
  if(!["GET","POST"].includes(request.method))return jsonError("Deze handeling is niet beschikbaar.",405);
  if(request.method==="POST"&&!validOrigin(request,url))return jsonError("Open de koppeling vanuit deze website.",403);
  const plan=await getPlan(env,user);
  if(plan?.owner_id!==user)return jsonError("Alleen de sitebeheerder kan de AI-koppeling aanpassen.",403);
  const current=await env.DB.prepare("SELECT revision,verified_at FROM ai_connection WHERE id=1").first();
  if(request.method==="GET")return json({provider:aiProvider(env),ready:(await aiState(env,user)).ready,revision:current?.revision??0,verifiedAt:current?.verified_at??null,managed:Boolean(env.GEMINI_API_KEY),canConnect:Boolean(env.AI_CONNECTION_SECRET)&&!env.GEMINI_API_KEY&&aiProvider(env)==="gemini"});
  if(aiProvider(env)!=="gemini"||env.GEMINI_API_KEY)return jsonError("De site is niet ingesteld op de Gemini-proefkoppeling.",409);
  const input=await readBody(request,2000);
  if(input.freeTier!==true)return jsonError("Controleer eerst dat je Google-project de Free tier gebruikt en geen betaalde facturering heeft.",400);
  const key=typeof input.key==="string"?input.key.trim():"";
  if(!/^[A-Za-z0-9_.-]{20,256}$/.test(key))return jsonError("Vul een geldige Google AI Studio API-sleutel in.",400);
  if(!Number.isInteger(input.revision)||input.revision!==(current?.revision??0))return jsonError("De koppeling is intussen aangepast. Sluit dit venster en open het opnieuw.",409);
  await aiStorageKey(env);
  const quota=await env.DB.prepare("INSERT INTO rekenstart_quota(user_id,hour,used) VALUES (?,?,1) ON CONFLICT(user_id,hour) DO UPDATE SET used=used+1 WHERE used<10 RETURNING used").bind("connection:"+user,Math.floor(Date.now()/3600000)).first();
  if(!quota)return jsonError("Je hebt te vaak geprobeerd te verbinden. Probeer het later opnieuw.",429);
  // This is the only connection check; user confirmation triggers an actual model request.
  const reply=await aiRequest({provider:"gemini",model:GEMINI_MODEL,key},env,{instructions:"Geef uitsluitend het gevraagde testwoord terug.",input:"Antwoord met: Verbonden",maxOutputTokens:128});
  if(!/^verbonden[.!]?$/i.test(reply))return jsonError("Gemini antwoordde, maar de verbindingstest was niet herkenbaar. Probeer opnieuw.",502);
  const encrypted=await aiEncrypt(env,key,user),now=new Date().toISOString();
  const saved=await env.DB.prepare("INSERT INTO ai_connection(id,owner_id,ciphertext,iv,revision,verified_at,free_tier_confirmed) VALUES (1,?,?,?,1,?,1) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,ciphertext=excluded.ciphertext,iv=excluded.iv,revision=ai_connection.revision+1,verified_at=excluded.verified_at,free_tier_confirmed=1 WHERE ai_connection.revision=? RETURNING revision").bind(user,encrypted.ciphertext,encrypted.iv,now,input.revision).first();
  if(!saved)return jsonError("De koppeling is intussen aangepast. Open dit venster opnieuw.",409);
  return json({connected:true,provider:"gemini",model:GEMINI_MODEL,revision:saved.revision,verifiedAt:now,message:"Gemini heeft geantwoord. De koppeling is opgeslagen en klaar voor je proef."});
}
