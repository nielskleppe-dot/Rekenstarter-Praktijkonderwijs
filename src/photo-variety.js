// Photos belong to one reviewed material family. A fixed lesson-day index rotates
// that family's photographs consistently on every slide and after a page reload.
let workplacePhotoRegistry;
function workplaceFamily(sector,material,explicit){
 if(explicit)return sector+'|'+explicit;
 let key=careerMaterialKey(material);
 key=regularCareerAliases[sector]?.[key]||key;
 const reviewed={
  groen:{'rechthoekig plantvak':'plantvak','langwerpig plantvak':'plantvak'},
  eco:{reclamebord:'winkelbord'}
 };
 key=reviewed[sector]?.[key]||key;
 return sector+'|'+key;
}
function allWorkplacePhotos(){
 if(workplacePhotoRegistry)return workplacePhotoRegistry;
 const records=[
  ...lessonPhotoBank.map(p=>({id:p.id,sector:p.sector,material:p.material,type:'bank',group:workplaceFamily(p.sector,p.material,p.varietyGroup)})),
  ...careerPhotos.map(p=>({id:p.id,sector:p.sector,material:p.material,type:'career',group:workplaceFamily(p.sector,p.material,p.varietyGroup)}))
 ];
 for(const sector of DATA.sectors.map(s=>s.id)){
  const add=(key,material,group)=>records.push({id:'task:'+key,sector,material,type:'task',key,group:workplaceFamily(sector,material,group)});
  add(sector+'-temperature','de werksituatie bij temperatuur','temperature');
  add(sector+'-surface',surfaceNames[sector]);
  add(sector+'-box',boxNames[sector]);
  for(const kind of ['length','mass','volume'])records.push({id:'measure:'+sector+':'+kind,sector,type:'measure',kind,material:measurementPhotoLabels[sector][kind],group:sector+'|measure:'+kind});
  records.push({id:'payment:'+sector,sector,type:'payment',material:paymentCaptions[sector],group:sector+'|payment'});
 }
 const byId=new Map(records.map(p=>[p.id,p])),byGroup=new Map();
 for(const p of records){if(!byGroup.has(p.group))byGroup.set(p.group,[]);byGroup.get(p.group).push(p);}
 // Sort by stable identities; never pick a new image merely because the page reloads.
 for(const pool of byGroup.values())pool.sort((a,b)=>a.id.localeCompare(b.id,'en'));
 return workplacePhotoRegistry={records,byId,byGroup};
}
function workplaceRecord(photo,sector){
 const registry=allWorkplacePhotos();
 const id=photo.match(/data-career-photo-id="([^"]+)"/)?.[1]||photo.match(/data-photo-id="([^"]+)"/)?.[1];
 if(id)return registry.byId.get(id);
 const key=photo.match(/data-task-photo-key="([^"]+)"/)?.[1];
 if(key)return registry.byId.get('task:'+key);
 if(photo.includes('data-topic-photo="money"'))return registry.byId.get('payment:'+sector);
 const kind=photo.match(/data-photo-kind="(length|mass|volume)"/)?.[1];
 return kind?registry.byId.get('measure:'+sector+':'+kind):null;
}
function photoLessonOrdinal(deck){
 const days={ma:0,di:1,do:2};
 if(deck.catalog){
  const lesson=deck.catalog,scheduled=/^pro[34]-w\d\d-(ma|di|do)$/.test(lesson.id);
  if(scheduled)return (lesson.year-1)*108+(lesson.week-1)*3+days[lesson.day];
  const extras=CATALOG.entries.filter(p=>!/^pro[34]-w\d\d-(ma|di|do)$/.test(p.id));
  return 1000+Math.max(0,extras.findIndex(p=>p.id===lesson.id));
 }
 if(deck.metric)return ((deck.year||state.year)-1)*24+deck.metric.week*3+deck.metric.day;
 const [year,week,day]=deck.lesson.id.split('-');
 const offset=DATA.years.slice(0,Number(year)-1).reduce((total,weeks)=>total+weeks.length*3,0);
 return offset+(Number(week)-1)*3+days[day];
}
function workplacePhotoMarkup(record){
 if(record.type==='bank')return lessonBankPhoto(record.id,record.sector);
 if(record.type==='career')return careerPhoto(record.id,record.sector);
 if(record.type==='payment')return paymentPhoto(record.sector);
 if(record.type==='measure')return sectorMeasurementPhoto(record.sector,record.kind);
 return taskPhoto(record.key,record.material,record.sector);
}
function variedWorkPhoto(photo,deck){
 const base=workplaceRecord(photo,deck.sector);if(!base)return photo;
 const pool=allWorkplacePhotos().byGroup.get(base.group),index=photoLessonOrdinal(deck);
 if(!pool?.length||!Number.isInteger(index))return photo;
 return workplacePhotoMarkup(pool[((index%pool.length)+pool.length)%pool.length]);
}
