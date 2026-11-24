const json = (body,status=200) => Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const jsonError = (message,status) => json({error:message},status);

function validOrigin(request,url) {
  return request.headers.get("origin") === url.origin;
}

async function readBody(request,max=1_000_000) {
  const text=await request.text();
  if(text.length>max) throw Error("De invoer is te lang.");
  try { return JSON.parse(text); } catch { throw Error("De invoer is ongeldig."); }
}

async function getPlan(env,user) {
  if(!env.DB || !user) return null;
  let saved=await env.DB.prepare("SELECT owner_id,revision,payload FROM rekenstart_plan WHERE id = 1").first();
  if(!saved){
    await env.DB.prepare("INSERT OR IGNORE INTO rekenstart_plan (id,owner_id,revision,payload) VALUES (1,?,0,?)")
      .bind(user,JSON.stringify(baseSettings(DATA))).run();
    saved=await env.DB.prepare("SELECT owner_id,revision,payload FROM rekenstart_plan WHERE id = 1").first();
  }
  return saved;
}

async function readPlan(request,env) {
  const user=request.headers.get("oai-authenticated-user-id");
  const saved=await getPlan(env,user);
  const ai=await aiState(env,user);
  return json({
    signedIn:Boolean(user), shared:Boolean(saved), canEdit:(!env.DB || Boolean(saved && saved.owner_id===user)),
    liveCoach:ai.ready,ai,
    revision:saved?.revision ?? 0,
    settings:saved ? validatedSettings(JSON.parse(saved.payload),DATA) : baseSettings(DATA)
  });
}

async function writePlan(request,env,url) {
  const user=request.headers.get("oai-authenticated-user-id");
  if(!user || !validOrigin(request,url) || !env.DB) return jsonError("Centraal beheer is beschikbaar voor de eigenaar van de afgeschermde site.",403);
  const saved=await getPlan(env,user);
  if(saved.owner_id!==user) return jsonError("Alleen de site-eigenaar kan de planning aanpassen.",403);
  const input=await readBody(request);
  const next=validatedSettings(input.settings,DATA);
  if(!Number.isInteger(input.revision)) return jsonError("Laad de planning opnieuw.",409);
  const result=await env.DB.prepare("UPDATE rekenstart_plan SET payload = ?, revision = revision + 1 WHERE id = 1 AND owner_id = ? AND revision = ? RETURNING revision")
    .bind(JSON.stringify(next),user,input.revision).first();
  if(!result) return jsonError("De planning is intussen aangepast. Laad de pagina opnieuw voordat je opslaat.",409);
  return json({settings:next,revision:result.revision});
}

async function coach(request,env,url) {
  const user=request.headers.get("oai-authenticated-user-id");
  if(!user || !validOrigin(request,url)) return jsonError("Log in om de online Rekencoach te gebruiken.",403);
  if(!(await aiState(env,user)).ready) return jsonError("De AI-verbinding moet nog worden ingesteld bij Beheer.",503);
  const input=await readBody(request,4000);
  const lesson=lessonLookup(DATA,input.lesson);
  if(!lesson||!DATA.sectors.some(item=>item.id===input.sector)||!safeText(input.question,700))return jsonError("Kies een les en schrijf een korte vraag over de praktijkopdracht.",400);
  const stored=await getPlan(env,user);
  const settings=stored?validatedSettings(JSON.parse(stored.payload),DATA):baseSettings(DATA);
  const phase=isPhase(DATA,input.phase)?input.phase:lessonPhase(DATA,settings,lesson,input.sector).key;
  const base=lesson.byPhase[phase][input.sector];
  const edit=settings.variants[lesson.id+":"+input.sector+":"+phase];
  const published=edit?.status==="ready"?edit:edit?.previous;
  const variant={...base,...published};
  const hour=Math.floor(Date.now()/3_600_000);
  const quota=await env.DB.prepare("INSERT INTO rekenstart_quota (user_id, hour, used) VALUES (?, ?, 1) ON CONFLICT (user_id,hour) DO UPDATE SET used = used + 1 WHERE used < 10 RETURNING used")
    .bind(user,hour).first();
  if(!quota) return jsonError("Je hebt de limiet van 10 vragen per uur bereikt.",429);
  const output=await aiRun(env,{
      maxOutputTokens:650,
      instructions:"Je bent een Nederlandstalige Rekencoach voor praktijkonderwijs. Bewaar het opgegeven dagdoel, de berekening, de getallen, de eenheid en de moeilijkheid. Gebruik de opgegeven praktijkfase en bronopdracht. Schrijf alleen een nieuwe lestitel, een concrete contextzin en een korte docenttip. De website voegt het gedeelde rekenvoorbeeld zelf toe. Geef tekst zonder markdown. Vraag geen leerlinggegevens. Bij een andere vraag geef je een tip voor dit specifieke rekendoel.",
      input:JSON.stringify({vraag:input.question.trim(),dagdoel:lesson.goal,rekenvraag:lesson.main.question,feiten:lesson.main.facts,rekenstappen:lesson.main.steps,fase:DATA.phaseLabels[phase],opdracht:variant.task,praktijk:variant.context,bron:variant.source}),
      name:"rekencoach_context",schema:{
        type:"object",additionalProperties:false,properties:{title:{type:"string"},context:{type:"string"},tip:{type:"string"}},required:["title","context","tip"]
      }
  });
  let draft;
  try { draft=JSON.parse(output??""); } catch { return jsonError("De online Rekencoach gaf geen bruikbaar concept.",502); }
  if(!safeText(draft?.title,100)||!safeText(draft?.context,500)||!safeText(draft?.tip,400)) return jsonError("De online Rekencoach gaf geen bruikbaar concept.",502);
  return json({title:draft.title,context:draft.context,tip:draft.tip});
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    try {
      if(url.pathname.startsWith('/lesbeelden/'))return lessonImageResponse(request,url);
      if(url.pathname.startsWith('/api/'))ensureLessonData();
      if(url.pathname==="/api/ai-connection")return await aiConnectionApi(request,env,url);
      if(url.pathname==="/api/cards"||url.pathname.startsWith("/api/cards/"))return await cardApi(request,env,url);
      if(url.pathname==="/api/assistant"&&request.method==="POST")return await assistantApi(request,env,url);
      if(url.pathname==="/api/state"){
        if(request.method==="GET") return await readPlan(request,env);
        if(request.method==="PUT") return await writePlan(request,env,url);
        return jsonError("Deze handeling is niet beschikbaar.",405);
      }
      if(url.pathname==="/api/coach" && request.method==="POST") return await coach(request,env,url);
      if(url.pathname==="/" && ["GET","HEAD"].includes(request.method)) return teachingPageResponse(request);
      return new Response("Pagina niet gevonden.",{status:404,headers:{"content-type":"text/plain; charset=utf-8"}});
    } catch(error) {
      if(error.ai)return jsonError(error.message,error.status);
      if(url.pathname==="/api/ai-connection")return jsonError("Verbinden is niet gelukt. Controleer de invoer of probeer later opnieuw.",400);
      if(url.pathname.startsWith("/api/cards")||url.pathname==="/api/assistant")return jsonError(error.status?error.message:(String(error?.message).startsWith("D1_")?"Bewaren is tijdelijk niet beschikbaar. Je concept blijft open.":String(error?.message??"Controleer de invoer.")),error.status??400);
      if(request.method==="PUT" && !String(error?.message).startsWith("D1_")) return jsonError(String(error?.message??"Controleer de invoer."),400);
      return jsonError("Deze functie is tijdelijk niet beschikbaar.",503);
    }
  }
};
