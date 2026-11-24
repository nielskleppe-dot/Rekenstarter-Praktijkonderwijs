const CARD_TEMPLATE = "pm-werkkaart-2";
const CARD_SECTORS = {eco:"Economie",zw:"Zorg & Welzijn",hbr:"HBR",groen:"Groen",techniek:"Techniek"};
const CARD_PHASES = ["Kennismaken","Oriënteren","Vervolgopdrachten"];
function cardId() {
  if(typeof crypto.randomUUID==="function")return "kaart-"+crypto.randomUUID();
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(v=>v.toString(16).padStart(2,"0")).join("");
  return "kaart-"+[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
}
function cardText(value,max=500,required=false) {
  if(typeof value!=="string" || value.length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) || (required&&!value.trim())) throw Error("Controleer de tekstvelden en hun maximale lengte.");
  return value.trim();
}
function cardList(value,max,mapper) {
  if(!Array.isArray(value)||value.length>max)throw Error("De kaart bevat te veel onderdelen.");
  return value.map(mapper);
}
function cardImage(value) {
  const v=cardText(value,600000);
  if(v && !/^asset:(?:logo|hbr-[1-7]|(?:eco|zw|groen|techniek)-[1-3])$/.test(v) && !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=\s]+$/.test(v))throw Error("Gebruik een voorbeeldfoto of een geüploade PNG/JPG.");
  return v;
}
function validateCard(input,complete=false) {
  if(!input||typeof input!=="object"||JSON.stringify(input).length>1800000)throw Error("De kaart is te groot. Gebruik kleinere foto's.");
  const text=(k,max=500,req=false)=>cardText(input[k]??"",max,req);
  const id=text("id",90,true);
  if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error("Ongeldig kaartnummer.");
  const sector=text("sector",20,true);
  if(!Object.hasOwn(CARD_SECTORS,sector))throw Error("Kies een geldige sector.");
  if(input.templateVersion!==CARD_TEMPLATE)throw Error("Deze sjabloonversie wordt niet ondersteund.");
  const phase=text("phase",30);
  if(!CARD_PHASES.includes(phase))throw Error("Kies een geldige praktijkfase.");
  const level=text("level",30);
  if(!["Basis","Meer ondersteuning","Meer uitdaging"].includes(level))throw Error("Kies een geldig niveau.");
  const out={id,templateVersion:CARD_TEMPLATE,sector,phase,level,revision:Number.isInteger(input.revision)&&input.revision>=0?input.revision:0,
    status:input.status==="checked"?"checked":"draft",title:text("title",140,true),description:text("description",500),duration:text("duration",120),
    grade:text("grade",60),year:text("year",12),direction:text("direction",80),source:text("source",600),sourceStatus:text("sourceStatus",100),
    sourceText:text("sourceText",12000),linkedLesson:text("linkedLesson",40),overviewImage:cardImage(input.overviewImage??""),overviewAlt:text("overviewAlt",220)};
  const g=input.goals??{};out.goals={practice:cardText(g.practice??"",300,complete),language:cardText(g.language??"",300,complete),math:cardText(g.math??"",300,complete)};
  out.materials=cardList(input.materials??[],24,m=>({name:cardText(m.name??"",100),amount:cardText(m.amount??"",120)}));
  out.tools=text("tools",600);out.precautions=cardList(input.precautions??[],6,t=>cardText(t,400));
  out.steps=cardList(input.steps??[],30,t=>({title:cardText(t.title??"",90),text:cardText(t.text??"",650),image:cardImage(t.image??""),alt:cardText(t.alt??"",220),check:cardText(t.check??"",220)}));
  out.words=cardList(input.words??[],3,w=>({word:cardText(w.word??"",70),definition:cardText(w.definition??"",180)}));
  const o=input.oral??{};out.oral={question:cardText(o.question??"",250),start:cardText(o.start??"",180),answer:cardText(o.answer??"",400)};
  const m=input.math??{};out.math={title:cardText(m.title??"",100),items:cardList(m.items??[],6,t=>({question:cardText(t.question??"",400),answer:cardText(t.answer??"",500)})),hint:cardText(m.hint??"",350),extra:cardText(m.extra??"",400),extraAnswer:cardText(m.extraAnswer??"",500)};
  out.reflection=cardList(input.reflection??[],3,t=>cardText(t,180));
  const t=input.teacher??{};out.teacher={};for(const k of ["before","support","challenge","images"])out.teacher[k]=cardText(t[k]??"",1400);
  if(complete && (!out.steps.length || out.steps.some(s=>!s.title||!s.text)||!out.materials.length||out.materials.some(m=>!m.name||!m.amount)||out.words.length!==3||out.words.some(w=>!w.word||!w.definition)||!out.oral.question||!out.oral.answer||out.reflection.length!==3||!out.math.items.length||out.math.items.some(q=>!q.question||!q.answer)))throw Error("Vul eerst de doelen, materialen, stappen, drie vakwoorden en rekenvragen met antwoorden in.");
  return out;
}
function emptyCard(context={}) {
  return {...context,templateVersion:CARD_TEMPLATE,id:cardId(),revision:0,status:"draft",
    title:context.title||"Mijn praktijkopdracht",sector:context.sector||"groen",direction:"",grade:context.grade||("PrO "+(Number(context.year||1)+2)),year:String(context.year||1),
    phase:context.phase||"Kennismaken",level:"Basis",duration:"",description:context.description||"",source:"",sourceStatus:"Concept · te controleren",sourceText:"",
    linkedLesson:context.linkedLesson||"",overviewImage:"",overviewAlt:"",
    goals:{practice:"",language:"",math:context.mathGoal||""},materials:[{name:"",amount:""}],tools:"",precautions:[""],
    steps:Array.from({length:3},()=>({title:"",text:"",image:"",alt:"",check:""})),
    words:Array.from({length:3},()=>({word:"",definition:""})),oral:{question:"",start:"",answer:""},
    math:{title:"Rekenen bij deze opdracht",items:[{question:"",answer:""}],hint:"",extra:"",extraAnswer:""},
    reflection:["Ik heb zorgvuldig gewerkt.","Ik heb mijn antwoord gecontroleerd.","Ik heb mijn werkplek opgeruimd."],
    teacher:{before:"",support:"",challenge:"",images:""}};
}
function cardSchema() {
  const str={type:"string"};
  const obj=properties=>({type:"object",additionalProperties:false,properties,required:Object.keys(properties)});
  const arr=items=>({type:"array",items});
  return obj({title:str,description:str,duration:str,goals:obj({practice:str,language:str,math:str}),
    materials:arr(obj({name:str,amount:str})),tools:str,precautions:arr(str),
    steps:arr(obj({title:str,text:str,alt:str,check:str})),
    words:arr(obj({word:str,definition:str})),oral:obj({question:str,start:str,answer:str}),
    math:obj({title:str,items:arr(obj({question:str,answer:str})),hint:str,extra:str,extraAnswer:str}),
    reflection:arr(str),teacher:obj({before:str,support:str,challenge:str,images:str})});
}

