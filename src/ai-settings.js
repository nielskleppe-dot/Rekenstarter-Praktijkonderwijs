const AI_SITE_URL="https://rekenstart-herfst-2026.nielskleppe.chatgpt.site";
let aiConnectionBusy=false;
function aiConnectButton(){
  return service.canEdit?'<button type="button" class="btn" data-action="ai-connect">'+(service.liveCoach?'Gemini-koppeling beheren':'Gemini koppelen')+'</button>':"";
}
function aiConnectionPanel(){
  return '<section class="panel ai-panel"><div><span class="eyebrow">Praktijkassistent</span><h2>Gemini voor je proef</h2><p>'+(service.liveCoach?'Gemini is verbonden voor de chatbot, werkkaartvoorstellen en Rekencoach.':'Koppel je Google-sleutel om op deze website echte AI-antwoorden en werkkaarten te proberen.')+'</p><p class="ai-caption">Gebruik een Google-project met Free tier en zonder betaalde facturering. Google bepaalt de gebruikslimieten.</p></div>'+aiConnectButton()+'</section>';
}
async function openAIConnection(){
  if(!service.canEdit)return;
  for(const id of ["wc-assistant","details"])if($(id).open)$(id).close();
  const dialog=$("ai-connection"),body=$("ai-connection-body");
  body.innerHTML='<header class="wc-chat-head"><div><span class="eyebrow">Eén verbinding voor je website</span><h2 id="ai-connection-title">Gemini koppelen</h2></div><button type="button" class="icon-btn" data-action="ai-close" aria-label="Sluiten">×</button></header><p class="ai-intro">Laat Gemini meedenken met je les en werkkaarten invullen in de vaste schoolopmaak.</p><ol class="ai-steps"><li>Open <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer">Google AI Studio</a> en maak een API-sleutel.</li><li>Kies een project met <strong>Free tier</strong>. Laat betaalde facturering uit.</li><li>Vul de sleutel hieronder in. De website test de verbinding met een kort bericht.</li></ol><form id="ai-connection-form"><label class="field">Google API-sleutel<input type="password" name="key" required minlength="20" maxlength="256" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Plak hier je Google-sleutel" disabled></label><label class="ai-checkbox"><input type="checkbox" name="freeTier" required disabled><span>Ik heb gecontroleerd dat dit Google-project Free tier gebruikt en geen betaalde facturering heeft.</span></label><p class="ai-caption">De sleutel wordt versleuteld opgeslagen en niet getoond aan collega’s. Voer geen leerlinggegevens in de chatbot in.</p><div class="ai-form-actions"><button class="btn primary" type="submit" disabled>Verbinden en testen</button></div></form><p id="ai-connection-status" class="ai-connection-status" role="status" aria-live="polite">Instellingen laden…</p>';
  dialog.showModal();
  const form=$("ai-connection-form"),status=$("ai-connection-status");
  if(!service.shared){
    status.innerHTML='Deze koppeling stel je in op de afgeschermde online website. <a href="'+AI_SITE_URL+'" target="_blank" rel="noopener noreferrer">Open de website en ga naar Beheer</a>.';
    return;
  }
  let config;
  try{
    const response=await fetch("/api/ai-connection",{cache:"no-store",signal:AbortSignal.timeout(10000)});
    config=await response.json();
    if(!response.ok)throw Error(config.error||"De instellingen kunnen nu niet worden geladen.");
    if(!dialog.open||!form.isConnected)return;
    if(!config.canConnect){status.textContent=config.managed?"De Gemini-sleutel wordt al centraal beheerd.":"De beveiligde koppeling is nog niet beschikbaar. Probeer later opnieuw.";return;}
    for(const input of form.querySelectorAll("input,button"))input.disabled=false;
    status.textContent=config.ready?"Gemini is verbonden. Je kunt hier een andere sleutel testen en opslaan.":"Er is nog geen Gemini-sleutel opgeslagen.";
  }catch(error){status.textContent=error.name==="TimeoutError"?"Het laden duurt te lang. Open dit venster opnieuw.":error.message;return;}
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if(aiConnectionBusy||!form.reportValidity())return;
    const input={key:form.elements.key.value.trim(),freeTier:form.elements.freeTier.checked,revision:config.revision};
    aiConnectionBusy=true;
    for(const button of dialog.querySelectorAll("button"))button.disabled=true;
    for(const field of form.querySelectorAll("input"))field.disabled=true;
    status.textContent="Gemini antwoordt op een testbericht. Bij een tijdelijke storing probeert de website het één keer opnieuw. Dit kan ongeveer een minuut duren…";
    status.dataset.state="pending";
    try{
      const response=await fetch("/api/ai-connection",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input),signal:AbortSignal.timeout(65000)});
      const result=await response.json().catch(()=>null);
      if(!response.ok)throw Error(result?.error||"De website ontving geen bruikbaar antwoord. Probeer het later opnieuw; je sleutel blijft in dit venster staan.");
      if(!result?.connected)throw Error("De verbinding is nog niet bevestigd. Open het venster opnieuw om de status te controleren.");
      config.revision=result.revision;
      form.elements.key.value="";
      await readService();
      status.textContent=result.message;
      status.dataset.state="success";
      form.hidden=true;
      const next=document.createElement("button");next.type="button";next.className="btn primary";next.textContent="Probeer de Praktijkassistent";
      next.addEventListener("click",()=>{dialog.close();state.page="workcards";openWorkcards();});
      status.after(next);
    }catch(error){
      status.dataset.state="error";
      status.textContent=error.name==="TimeoutError"?"De test duurt te lang. Sluit dit venster en open het opnieuw om de verbindingsstatus te controleren.":error.message;
    }finally{
      input.key="";
      aiConnectionBusy=false;
      for(const field of form.querySelectorAll("input,button"))field.disabled=false;
      dialog.querySelector('[data-action="ai-close"]').disabled=false;
    }
  });
}
document.addEventListener("click",event=>{
  const action=event.target.closest("[data-action]")?.dataset.action;
  if(action==="ai-connect")openAIConnection();
  if(action==="ai-close"&&!aiConnectionBusy)$("ai-connection").close();
});
$("ai-connection").addEventListener("cancel",event=>{if(aiConnectionBusy)event.preventDefault();});
$("ai-connection").addEventListener("close",()=>{$("ai-connection-body").replaceChildren();});
