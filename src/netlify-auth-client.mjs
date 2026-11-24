import {login,logout,getUser,handleAuthCallback,acceptInvite,requestPasswordRecovery,updateUser} from '@netlify/identity';
const fragment=new URLSearchParams(location.hash.slice(1));
const callback=['invite_token','confirmation_token','recovery_token','access_token','email_change_token'].some(key=>fragment.has(key));
const onLogin=location.pathname.startsWith('/login');
if(!onLogin&&callback){location.replace('/login/'+location.hash);}
else if(onLogin){
 const form=document.getElementById('login-form'),status=document.getElementById('login-status'),heading=document.getElementById('login-heading');
 const email=document.getElementById('login-email'),password=document.getElementById('login-password'),submit=document.getElementById('login-submit');
 let inviteToken=null,recovery=false;
 const busy=value=>{for(const field of form.querySelectorAll('input,button'))field.disabled=value;};
 async function start(){
  busy(true);
  try{
   if(new URLSearchParams(location.search).get('actie')==='uitloggen'){
    await logout();location.replace('/');return;
   }
   const result=callback?await handleAuthCallback():null;
   // Remove one-time tokens before the user follows any other link.
   if(callback)history.replaceState(null,'','/login/');
   if(result?.type==='invite'&&result.token){
    inviteToken=result.token;heading.textContent='Welkom bij Rekenstart';
    document.getElementById('login-email-field').hidden=true;email.required=false;
    password.autocomplete='new-password';password.minLength=12;
    submit.textContent='Account activeren';status.textContent='Kies een wachtwoord van minimaal 12 tekens.';
   }else if(result?.type==='recovery'){
    recovery=true;heading.textContent='Kies een nieuw wachtwoord';
    document.getElementById('login-email-field').hidden=true;email.required=false;
    password.autocomplete='new-password';password.minLength=12;
    submit.textContent='Wachtwoord opslaan';status.textContent='Kies een wachtwoord van minimaal 12 tekens.';
   }else if(await getUser()){
    status.textContent='Je bent ingelogd. Je gaat naar de lessen.';location.replace('/');return;
   }else status.textContent='Log in met het account waarvoor je een uitnodiging hebt ontvangen.';
  }catch{status.textContent='De uitnodiging of inlog is niet beschikbaar. Probeer opnieuw of vraag de beheerder om een nieuwe uitnodiging.';}
  finally{busy(false);}
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  busy(true);status.textContent='Even wachten…';
  try{
   if(inviteToken)await acceptInvite(inviteToken,password.value);
   else if(recovery)await updateUser({password:password.value});
   else await login(email.value.trim(),password.value);
   password.value='';location.replace('/');
  }catch{status.textContent='Inloggen lukt niet. Controleer je e-mailadres en wachtwoord of vraag de beheerder om hulp.';}
  finally{busy(false);}
 });
 document.getElementById('login-forgot').addEventListener('click',async()=>{
  if(!email.reportValidity())return;
  busy(true);
  try{await requestPasswordRecovery(email.value.trim());status.textContent='Als dit account bestaat, ontvang je een e-mail om je wachtwoord te herstellen.';}
  catch{status.textContent='De herstelmail kan nu niet worden verstuurd. Probeer later opnieuw of vraag de beheerder om hulp.';}
  finally{busy(false);}
 });
 start();
}else{
 getUser().then(()=>window.dispatchEvent(new Event('rekenstart-auth-ready'))).catch(()=>{});
}
