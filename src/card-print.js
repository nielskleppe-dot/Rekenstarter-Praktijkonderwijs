/* One page model drives the screen, PDF and editable Word export. */
const CardPrint = (() => {
  const mmPt=72/25.4, contentW=182, left=14, bottom=279;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let canvas;
  function width(text,size,bold=false) {
    if(typeof document!=="undefined") {
      canvas??=document.createElement("canvas");const c=canvas.getContext("2d");
      c.font=(bold?"bold ":"")+size+"pt Arial";return c.measureText(text).width*25.4/96;
    }
    return [...text].reduce((s,c)=>s+(c===" "?0.28:/[ilI.,:;]/.test(c)?0.26:/[MW@]/.test(c)?0.88:0.52),0)*size*25.4/72;
  }
  function wrap(text,w,size=12,bold=false){
    const lines=[];
    for(const paragraph of String(text??"").split("\n")){
      let line="";
      for(let word of paragraph.split(/\s+/)){
        if(width(word,size,bold)>w){
          if(line){lines.push(line);line="";}
          let part="";for(const c of word){if(width(part+c,size,bold)>w){lines.push(part);part="";}part+=c;}line=part;continue;
        }
        if(line&&width(line+" "+word,size,bold)>w){lines.push(line);line=word;}else line+=(line?" ":"")+word;
      }
      lines.push(line);
    }
    return lines.length?lines:[""];
  }
  const asset=(id,assets)=>id?.startsWith("asset:")?assets[id.slice(6)]?.data||"":id||"";
  function build(card,assets,includeTeacher=false){
    const pages=[];let page,y;
    function newPage(title=card.title,label="Werkkaart"){
      page={title,label,nodes:[],blocks:[]};pages.push(page);y=Math.max(43,20+wrap(title,139,21,true).length*9.04);
    }
    function room(h,title=page.title,label=page.label){if(y+h>bottom)newPage(title,label);}
    function add(block){room(block.h);block.y=y;page.blocks.push(block);y+=block.h+2;return block;}
    function text(text,size=12,bold=false,gap=1){
      const lines=wrap(text,contentW,size,bold),lh=size*.352778*1.22;
      // Split unusually long text between pages without reducing its font.
      while(lines.length){const max=Math.max(1,Math.floor((bottom-y-gap)/lh));if(y+lh+gap>bottom){newPage(page.title,page.label);continue;}const part=lines.splice(0,max);add({kind:"text",text:part.join("\n"),lines:part,size,bold,h:part.length*lh+gap,lh});}
    }
    function heading(s){room(18);text(s,14,true,1);}
    function table(rows,widths,header=true){
      let group=[],height=0;
      const prepared=rows.map((cells,i)=>({cells:cells.map((s,j)=>wrap(s,widths[j]-5,11.5,header&&i===0)),header:header&&i===0}));
      const h=r=>Math.max(...r.cells.map(c=>c.length))*4.95+4;
      const flush=()=>{if(group.length)add({kind:"table",rows:group,widths,h:height});group=[];height=0;};
      for(const row of prepared){
        let rh=h(row);
        if(rh>bottom-55)throw Error("Een tabelregel is te lang. Verdeel de tekst over kortere regels.");
        if(y+height+rh>bottom&&group.length){flush();newPage(page.title,page.label);if(header){group=[prepared[0]];height=h(prepared[0]);}}
        room(height+rh);group.push(row);height+=rh;
      }
      flush();
    }
    function picture(id,alt,h=51){add({kind:"image",id,alt,h,w:106});}
    newPage(card.title,CARD_SECTORS[card.sector]+" · "+card.grade+" · "+card.phase);
    text([card.direction,card.duration].filter(Boolean).join(" · "),10.5,false,1);
    text(card.description||"Beschrijf hier wat je gaat doen.",12,false,1);
    text("Naam ____________________  Klas _____  Datum ____________",11,false,2);
    heading("Dit leer je");
    for(const [key,label]of[["practice","Praktijk"],["language","Taal"],["math","Rekenen"]]){text(label+"  "+(card.goals[key]||"Doel nog invullen"),12,false,0);page.blocks.at(-1).boldPrefix=label;}
    picture(card.overviewImage,card.overviewAlt);
    heading("Dit heb je nodig");
    table([[card.sector==="hbr"?"Ingrediënt":"Materiaal","Hoeveelheid"],...card.materials.map(m=>[m.name,m.amount])],[120,62]);
    text("Zet klaar: "+(card.tools||"Hulpmiddelen nog invullen."),11.5);
    for(const s of card.precautions.filter(Boolean))text("□ "+s,11.5,false,0);
    newPage("Zo werk je","KIJK · LEES · DOE");
    card.steps.forEach((s,i)=>{
      const lines=wrap(s.text||"Vul de handeling in.",91,12),titles=wrap((i+1)+"  "+(s.title||"Stap invullen"),91,14,true),check=wrap(s.check,91,10.5);
      const h=Math.max(62,8+titles.length*6+lines.length*5.15+(s.check?check.length*4.5+3:0)+9);
      if(h>bottom-43)throw Error("Stap "+(i+1)+" is te lang voor één blad. Verdeel de handelingen over twee stappen.");
      const block=add({kind:"step",step:s,index:i+1,lines,titles,check:s.check?check:[],h});
      if(i===card.steps.length-1)y+=1;
    });
    newPage("Taal en rekenen",CARD_SECTORS[card.sector]+" · Oefenen");
    heading("1  Welk woord hoort erbij?");
    text("Schrijf A, B of C achter het juiste woord.",12,false,1);
    const order=[1,2,0];
    order.forEach((n,i)=>text(String.fromCharCode(65+i)+"  "+(card.words[n]?.definition||"Betekenis nog invullen"),12,false,0));
    table([["Woord","Letter"],...card.words.map(w=>[w.word,"________"])],[136,46]);
    heading("2  Vertel het aan je maatje");
    text(card.oral.question||"Vraag nog invullen.",12);
    text((card.oral.start||"Mijn uitleg")+" __________________________",12);
    text("________________________________________________________",12);
    heading("3  "+(card.math.title||"Rekenen bij deze opdracht"));
    card.math.items.forEach((q,i)=>{text((i+1)+". "+q.question,12,false,1);text("Berekening: ____________________________________________",11.5);text("Antwoord: _____________________________________________",11.5);});
    if(card.math.hint)text("Hulp  "+card.math.hint,11.5);
    if(card.level==="Meer uitdaging"&&card.teacher.challenge)text("Extra uitdaging  "+card.teacher.challenge,11.5);
    if(card.math.extra){text("Extra  "+card.math.extra,11.5);text("________________________________________________________",11.5);}
    room(14*.352778*1.22+3+card.reflection.reduce((h,t)=>h+wrap("□ "+t,contentW,12).length*12*.352778*1.22+2,0)+12*.352778*1.22+3);
    heading("4  Dit ging goed");
    card.reflection.forEach(t=>text("□ "+t,12,false,0));
    text("Volgende keer oefen ik _________________________________",12);
    if(includeTeacher){
      newPage("Docentenblad","BEGELEIDING EN ANTWOORDEN");
      text("Leerlingdeel: bladzijde 1 t/m "+(pages.length-1)+".",11.5);
      text(card.sourceStatus+" · "+card.source,10.5);
      heading("Voor en tijdens de les");text(card.teacher.before||"Nog invullen.",12);
      heading("Taaldoel");text(card.goals.language,12);
      table([["Opdracht","Antwoord"],...card.words.map((w,i)=>[w.word,String.fromCharCode(65+order.indexOf(i))]),["Mondelinge uitleg",card.oral.answer]],[64,118]);
      heading("Rekendoel");text(card.goals.math,12);
      card.math.items.forEach((q,i)=>{text((i+1)+". "+q.question,11.5,true,0);text(q.answer||"Antwoord nog controleren.",12);});
      if(card.math.extra){text("Extra: "+card.math.extra,11.5,true,0);text(card.math.extraAnswer,12);}
      heading("Hulp en uitdaging");text("Met hulp: "+card.teacher.support,12);text("Uitdaging: "+card.teacher.challenge,12);
      heading("Over de beelden");text(card.teacher.images||"Controleer de beeldbronnen voor gebruik.",10.5);
    }
    pages.forEach((p,i)=>{
      const nodes=p.nodes;
      const tx=(x,y,w,text,size=12,bold=false,color="#000000",lh)=>nodes.push({type:"text",x,y,w,text,size,bold,color,lh:lh??size*.352778*1.22});
      const rect=(x,y,w,h,fill="#ffffff",stroke="#d9d9d9")=>nodes.push({type:"rect",x,y,w,h,fill,stroke});
      const img=(id,alt,x,y,w,h)=>nodes.push({type:"image",id,alt,x,y,w,h});
      tx(14,11,139,p.label,9,false,"#555555");
      const titleLines=wrap(p.title,139,21,true);
      tx(14,17,139,titleLines.join("\n"),21,true);
      img("asset:logo","CSG Prins Maurits Praktijkonderwijs",158,13,38,20);
      for(const b of p.blocks){
        const yy=b.y;
        if(b.kind==="text"){tx(left,yy,contentW,b.text,b.size,b.bold,"#000000",b.lh);nodes.at(-1).boldPrefix=b.boldPrefix;}
        if(b.kind==="image")img(b.id,b.alt,left+(contentW-b.w)/2,yy,b.w,b.h);
        if(b.kind==="step"){
          rect(left,yy,contentW,b.h);
          img(b.step.image,b.step.alt,left+2,yy+2,81,b.h-4);
          const xx=left+87;let ty=yy+3;
          tx(xx,ty,91,b.titles.join("\n"),14,true);ty+=b.titles.length*6+2;
          tx(xx,ty,91,b.lines.join("\n"),12,false,"#000000",5.15);ty+=b.lines.length*5.15+3;
          if(b.check.length){tx(xx,ty,91,b.check.join("\n"),10.5);ty+=b.check.length*4.5+2;}
          tx(xx,yy+b.h-7,91,"□ Gedaan",11.5);
        }
        if(b.kind==="table"){let rowY=yy;for(const row of b.rows){let rowH=Math.max(...row.cells.map(c=>c.length))*4.95+4;let xx=left;row.cells.forEach((lines,j)=>{rect(xx,rowY,b.widths[j],rowH,row.header?"#DFEAF0":"#ffffff");tx(xx+2.5,rowY+2,b.widths[j]-5,lines.join("\n"),11.5,row.header,"#000000",4.95);xx+=b.widths[j];});rowY+=rowH;}}
      }
      tx(14,286,182,CARD_SECTORS[card.sector]+" · "+card.title.slice(0,60)+"   |   "+(i+1)+" / "+pages.length,9,false,"#555555");
    });
    return pages;
  }
  function html(pages,assets){
    return pages.map((p,i)=>'<article class="wc-paper" aria-label="Werkkaart pagina '+(i+1)+'">'+p.nodes.map(n=>{
      const pos='left:'+n.x+'mm;top:'+n.y+'mm;width:'+n.w+'mm;';
      if(n.type==="text")return '<div class="wc-print-text" style="'+pos+'font-size:'+n.size+'pt;line-height:'+n.lh+'mm;font-weight:'+(n.bold?700:400)+';color:'+n.color+'">'+(n.boldPrefix?'<strong>'+esc(n.boldPrefix)+'</strong>'+esc(n.text.slice(n.boldPrefix.length)):esc(n.text))+'</div>';
      if(n.type==="rect")return '<div class="wc-print-rect" style="'+pos+'height:'+n.h+'mm;background:'+n.fill+';border:.2mm solid '+n.stroke+'"></div>';
      const uri=asset(n.id,assets);
      return uri?'<img class="wc-print-image" alt="'+esc(n.alt)+'" src="'+uri+'" style="'+pos+'height:'+n.h+'mm">':'<div class="wc-print-placeholder" style="'+pos+'height:'+n.h+'mm">Foto toevoegen</div>';
    }).join("")+'</article>').join("");
  }
  function bytes(data){return Uint8Array.from(atob(data.split(",")[1]),c=>c.charCodeAt(0));}
  function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),20000);}
  const filename=c=>c.title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"_").slice(0,90)||"Werkkaart";
  async function pdf(card,assets,teacher=false,save=true){
    const {PDFDocument,StandardFonts,rgb}=PDFLib;
    const doc=await PDFDocument.create(),regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
    const pages=build(card,assets,teacher),cache=new Map(),color=s=>rgb(parseInt(s.slice(1,3),16)/255,parseInt(s.slice(3,5),16)/255,parseInt(s.slice(5,7),16)/255);
    for(const page of pages){const p=doc.addPage([210*mmPt,297*mmPt]);for(const n of page.nodes){
      const x=n.x*mmPt,y=(297-n.y)*mmPt;
      if(n.type==="rect"){p.drawRectangle({x,y:y-n.h*mmPt,width:n.w*mmPt,height:n.h*mmPt,color:color(n.fill),borderColor:color(n.stroke),borderWidth:.35});continue;}
      if(n.type==="image"){
        const uri=asset(n.id,assets);
        if(!uri){p.drawRectangle({x,y:y-n.h*mmPt,width:n.w*mmPt,height:n.h*mmPt,borderColor:rgb(.8,.8,.8),borderWidth:.5});p.drawText("Foto toevoegen",{x:x+8,y:y-20,size:11,font:regular,color:rgb(.4,.4,.4)});continue;}
        if(!cache.has(uri))cache.set(uri,uri.startsWith("data:image/png")?await doc.embedPng(bytes(uri)):await doc.embedJpg(bytes(uri)));
        const im=cache.get(uri),s=Math.min(n.w*mmPt/im.width,n.h*mmPt/im.height),w=im.width*s,h=im.height*s;
        p.drawImage(im,{x:x+(n.w*mmPt-w)/2,y:y-h-(n.h*mmPt-h)/2,width:w,height:h});continue;
      }
      n.text.split("\n").forEach((line,j)=>{
        let xx=x;
        if(line.startsWith("□ ")){p.drawRectangle({x:xx,y:y-j*n.lh*mmPt-n.size*.85,width:7,height:7,borderColor:rgb(0,0,0),borderWidth:.6});xx+=12;line=line.slice(2);}
        const safe=line.replace(/[\u2610]/g,"[ ]").replace(/\u2212/g,"-").replace(/[^\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g," ");
        if(n.boldPrefix&&j===0){p.drawText(n.boldPrefix,{x:xx,y:y-n.size,font:bold,size:n.size,color:color(n.color)});p.drawText(safe.slice(n.boldPrefix.length),{x:xx+bold.widthOfTextAtSize(n.boldPrefix,n.size),y:y-n.size,font:regular,size:n.size,color:color(n.color)});}else p.drawText(safe,{x:xx,y:y-n.size-j*n.lh*mmPt,font:n.bold?bold:regular,size:n.size,color:color(n.color)});
      });
    }}
    const output=await doc.save();if(save)download(new Blob([output],{type:"application/pdf"}),filename(card)+(teacher?"_met_docentblad":"")+".pdf");
    return output;
  }
  async function word(card,assets,teacher=false,save=true){
    const D=docx, pages=build(card,assets,teacher),tw=mm=>Math.round(mm*56.6929);
    const none={style:D.BorderStyle.NONE,size:0,color:"FFFFFF"},edge={style:D.BorderStyle.SINGLE,size:2,color:"D9D9D9"};
    const paragraph=(s,size=12,bold=false,after=1)=>new D.Paragraph({spacing:{after:tw(after),line:Math.round(size*1.22*20)},children:String(s).split("\n").map((l,i)=>new D.TextRun({text:l,break:i?1:undefined,font:"Arial",size:size*2,bold,color:"000000"}))});
    function imageRun(id,w,h){
      const data=asset(id,assets);if(!data)return null;
      // PNG/JPEG natural dimensions are supplied by the image's decoded pixels below.
      return new D.ImageRun({type:data.startsWith("data:image/png")?"png":"jpg",data:bytes(data),transformation:{width:w*96/25.4,height:h*96/25.4},altText:{title:"Werkkaartfoto",description:"Praktijkbeeld",name:"Praktijkbeeld"}});
    }
    const dims=new Map();
    async function natural(id){const uri=asset(id,assets);if(!uri)return null;if(dims.has(uri))return dims.get(uri);const im=new Image();im.src=uri;await im.decode();const v={w:im.naturalWidth,h:im.naturalHeight};dims.set(uri,v);return v;}
    async function picturePara(id,w,h){
      const dim=await natural(id);if(!dim)return paragraph("Foto toevoegen",10);
      const s=Math.min(w/dim.w,h/dim.h),run=imageRun(id,dim.w*s,dim.h*s);
      return new D.Paragraph({alignment:D.AlignmentType.CENTER,spacing:{after:0,before:0},children:[run]});
    }
    function cell(children,width,shading,borders=true){return new D.TableCell({width:{size:tw(width),type:D.WidthType.DXA},margins:{top:tw(1.5),bottom:tw(1.5),left:tw(2),right:tw(2)},borders:{top:borders?edge:none,bottom:borders?edge:none,left:borders?edge:none,right:borders?edge:none},shading:shading?{fill:shading}:undefined,verticalAlign:D.VerticalAlign.CENTER,children});}
    const children=[];
    for(let ix=0;ix<pages.length;ix++){
      const p=pages[ix];if(ix)children.push(new D.Paragraph({children:[new D.PageBreak()],spacing:{after:0}}));
      const logo=await picturePara("asset:logo",38,20);
      children.push(new D.Table({width:{size:tw(182),type:D.WidthType.DXA},columnWidths:[tw(142),tw(40)],borders:{top:none,bottom:none,left:none,right:none,insideHorizontal:none,insideVertical:none},rows:[new D.TableRow({cantSplit:true,children:[cell([paragraph(p.label,9),paragraph(p.title,21,true,2)],142,null,false),cell([logo],40,null,false)]})]}));
      children.push(paragraph("",2,false,1));
      for(const b of p.blocks){
        if(b.kind==="text"){if(b.boldPrefix)children.push(new D.Paragraph({spacing:{after:tw(2),line:Math.round(b.size*1.22*20)},children:[new D.TextRun({text:b.boldPrefix,bold:true,font:"Arial",size:b.size*2}),new D.TextRun({text:b.text.slice(b.boldPrefix.length),font:"Arial",size:b.size*2})]}));else children.push(paragraph(b.text,b.size,b.bold,2));}
        if(b.kind==="image"){children.push(await picturePara(b.id,b.w,b.h));children.push(paragraph("",2,false,1));}
        if(b.kind==="table"){
          const rows=b.rows.map(r=>new D.TableRow({cantSplit:true,tableHeader:r.header,children:r.cells.map((ls,j)=>cell([paragraph(ls.join("\n"),11.5,r.header,0)],b.widths[j],r.header?"DFEAF0":undefined))}));
          children.push(new D.Table({width:{size:tw(182),type:D.WidthType.DXA},columnWidths:b.widths.map(tw),rows}));children.push(paragraph("",2,false,1));
        }
        if(b.kind==="step"){
          const im=await picturePara(b.step.image,79,b.h-5),right=[paragraph(b.titles.join("\n"),14,true,2),paragraph(b.step.text,12,false,2)];
          if(b.step.check)right.push(paragraph(b.step.check,10.5,false,2));right.push(paragraph("□ Gedaan",11.5,false,0));
          children.push(new D.Table({width:{size:tw(182),type:D.WidthType.DXA},columnWidths:[tw(85),tw(97)],rows:[new D.TableRow({cantSplit:true,children:[cell([im],85),cell(right,97)]})]}));children.push(paragraph("",2,false,1));
        }
      }
    }
    const document=new D.Document({creator:"CSG Prins Maurits",title:card.title,description:"Werkkaart met taal- en rekendoelen",styles:{default:{document:{run:{font:"Arial",size:24,color:"000000"},paragraph:{spacing:{after:0}}}}},
      sections:[{properties:{page:{size:{width:tw(210),height:tw(297)},margin:{top:tw(11),bottom:tw(13),left:tw(14),right:tw(14),header:tw(5),footer:tw(5)}}},
      footers:{default:new D.Footer({children:[new D.Paragraph({alignment:D.AlignmentType.RIGHT,children:[new D.TextRun({text:CARD_SECTORS[card.sector]+" · "+card.title.slice(0,50)+"  |  ",font:"Arial",size:18}),new D.TextRun({children:[D.PageNumber.CURRENT],size:18})]})]})},children}]});
    const output=await D.Packer.toBlob(document);if(save)download(output,filename(card)+(teacher?"_met_docentblad":"")+".docx");return output;
  }
  return {build,html,pdf,word,download,filename,asset,wrap};
})();

