export const OWNER_ID='netlify-admin';
const response=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export function administrator(user,env={}){
 if(!user)return false;
 const roles=user.roles||user.app_metadata?.roles||[];
 const allowed=String(env.REKENSTART_ADMIN_EMAIL||'').split(',').map(p=>p.trim().toLowerCase()).filter(Boolean);
 return roles.includes('admin')||Boolean(user.email&&allowed.includes(user.email.toLowerCase()));
}
export function createHandler({core,getUser,getDatabase,environment=()=>process.env}){
 return async function handler(request){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/'))return response({error:'Pagina niet gevonden.'},404);
  const vars=environment();
  let user;
  try{user=await getUser();}catch{return response({error:'De docenteninlog is nog niet beschikbaar. Probeer later opnieuw.'},503);}
  const admin=administrator(user,vars);
  const headers=new Headers(request.headers);
  // Identity comes exclusively from the verified Netlify session, never a client header.
  headers.delete('oai-authenticated-user-id');
  if(user)headers.set('oai-authenticated-user-id',admin?OWNER_ID:String(user.id));
  let db;
  try{db=await getDatabase();}catch{
   if(url.pathname==='/api/state'&&request.method==='GET')return response({...core.offlineState(),signedIn:Boolean(user),canEdit:false,setupRequired:true});
   return response({error:'De online opslag is nog niet beschikbaar. Je concept blijft behouden.'},503);
  }
  const env={DB:db,AI_PROVIDER:vars.AI_PROVIDER||'gemini'};
  for(const key of ['AI_CONNECTION_SECRET','GEMINI_API_KEY','OPENAI_API_KEY','OPENAI_MODEL','OPENAI_REASONING_EFFORT'])if(vars[key])env[key]=vars[key];
  try{
   const result=await core.fetch(new Request(request,{headers}),env);
   const safeHeaders=new Headers(result.headers);safeHeaders.set('cache-control','no-store');
   return new Response(result.body,{status:result.status,statusText:result.statusText,headers:safeHeaders});
  }catch{return response({error:'Deze functie is tijdelijk niet beschikbaar. Je concept blijft behouden.'},503);}
 };
}
