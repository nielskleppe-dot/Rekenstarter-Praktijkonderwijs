function amsterdamDate(now=new Date()){
  const parts=new Intl.DateTimeFormat("nl-NL",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const part=kind=>parts.find(item=>item.type===kind).value;
  return part("year")+"-"+part("month")+"-"+part("day");
}
function shiftDate(date,offset){
  const instant=new Date(date+"T12:00:00Z");
  instant.setUTCDate(instant.getUTCDate()+offset);
  return instant.toISOString().slice(0,10);
}
function activeWeek(starts,day,holidays){
  const holiday=holidays.find(period=>period.start<=day&&day<=period.end);
  const active=holiday?-1:starts.findIndex(start=>start<=day&&day<=shiftDate(start,6));
  const future=starts.findIndex(start=>start>day);
  return {index:active,holiday,future,nearest:active>=0?active:future>=0?future:starts.length-1};
}
function baseSettings(data){
  return {starts:[...data.defaultStarts],cancelled:[],variants:{},goalLabels:{},phasePlans:{}};
}
function safeText(value,max){
  return typeof value==="string"&&value.trim().length>0&&value.trim().length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}
function validDate(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+"T12:00:00Z");
  return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===value;
}
function lessonLookup(data,id){
  const match=/^([12])-([1-8])-(ma|di|do)$/.exec(id);
  if(!match)return null;
  return data.years[Number(match[1])-1][Number(match[2])-1].lessons.find(lesson=>lesson.day===match[3]);
}
function isPhase(data,phase){
  return typeof phase==="string"&&Object.hasOwn(data.phaseLabels,phase);
}
function phaseKey(lesson,sector){
  return lesson.id.split("-")[0]+":"+sector;
}
function lessonPhase(data,settings,lesson,sector,preview="planning"){
  if(isPhase(data,preview))return {key:preview,planned:false};
  const plan=settings.phasePlans?.[phaseKey(lesson,sector)];
  const week=Number(lesson.id.split("-")[1])-1;
  const slot=data.slots.find(item=>item.key===lesson.day);
  const date=shiftDate(settings.starts[week],slot.offset);
  if(!plan||date<plan.start)return {key:"kennismaken",planned:false};
  const key=plan.follow&&date>=plan.follow?"vervolg":plan.orientation&&date>=plan.orientation?"orienteren":"kennismaken";
  return {key,planned:true};
}
function editedFields(variant){
  if(!variant||!safeText(variant.title,100)||!safeText(variant.context,500))throw Error("Controleer de titel en de praktijksituatie.");
  const data={title:variant.title.trim(),context:variant.context.trim()};
  for(const [field,max] of [["task",140],["source",180],["page",35],["next",260]]){
    if(variant[field]!==undefined&&variant[field]!==""){
      if(!safeText(variant[field],max))throw Error("Controleer de opdracht, bron en pagina.");
      data[field]=variant[field].trim();
    }
  }
  return data;
}
function validatedSettings(input,data){
  if(!input||typeof input!=="object"||!Array.isArray(input.starts)||input.starts.length!==data.defaultStarts.length)throw Error("Vul voor elke lesweek een maandag in.");
  const starts=input.starts.map((start,index)=>{
    if(!validDate(start)||new Date(start+"T12:00:00Z").getUTCDay()!==1)throw Error("Lesweek "+(index+1)+" moet op maandag beginnen.");
    if(index>0&&start<shiftDate(input.starts[index-1],7))throw Error("De lesweken moeten op volgorde staan en ieder een eigen week hebben.");
    if(data.slots.some(slot=>data.holidays.some(period=>period.start<=shiftDate(start,slot.offset)&&shiftDate(start,slot.offset)<=period.end)))throw Error("Lesweek "+(index+1)+" valt in een vakantie.");
    return start;
  });
  if(!Array.isArray(input.cancelled)||input.cancelled.length>24||input.cancelled.some(key=>typeof key!=="string"||!/^[1-8]-(ma|di|do)$/.test(key)))throw Error("Controleer de vervallen lesdagen.");
  const variants=Object.create(null),goalLabels=Object.create(null),phasePlans=Object.create(null);
  for(const [key,variant] of Object.entries(input.variants??{})){
    const [lesson,sector,phase,...rest]=key.split(":");
    if(rest.length||!lessonLookup(data,lesson)||!data.sectors.some(item=>item.id===sector)||(phase&&!isPhase(data,phase))||!["ready","draft"].includes(variant?.status))throw Error("Controleer de sectorvariant.");
    variants[key]={...editedFields(variant),status:variant.status};
    if(variant.status==="draft"&&variant.previous)variants[key].previous=editedFields(variant.previous);
  }
  for(const [id,label] of Object.entries(input.goalLabels??{})){
    if(!lessonLookup(data,id)||!safeText(label,180))throw Error("Controleer de tekst van het gedeelde dagdoel.");
    goalLabels[id]=label.trim();
  }
  for(const [key,plan] of Object.entries(input.phasePlans??{})){
    const [year,sector,...rest]=key.split(":");
    if(rest.length||!["1","2"].includes(year)||!data.sectors.some(item=>item.id===sector)||!plan||!validDate(plan.start))throw Error("Vul een geldige startdatum voor Kennismaken in.");
    const orientation=plan.orientation||"",follow=plan.follow||"";
    if(orientation&&(!validDate(orientation)||orientation<=plan.start))throw Error("De datum voor Oriënteren moet na de start van Kennismaken liggen.");
    if(follow&&(!orientation||!validDate(follow)||follow<=orientation))throw Error("Vervolgopdrachten beginnen na Oriënteren.");
    phasePlans[key]={start:plan.start,orientation,follow};
  }
  return {starts,cancelled:[...new Set(input.cancelled)],variants,goalLabels,phasePlans};
}

