import { readFileSync } from "node:fs";
import { buildTask } from "./arithmetic.mjs";
import { slots,sectors,defaultStarts,holidays,examples,sourceWorkbook,calendarSource } from "./specification.mjs";
import { makeVariants,phaseLabels } from "./practice.mjs";
import { enrichMath,makeDidactics } from "./didactics.mjs";

const curriculum=JSON.parse(readFileSync(new URL("./curriculum.json",import.meta.url),"utf8"));
const artwork={
  stock:"practice-examples.webp",
  sets:"practice-sets.webp",
  measure:"practice-measure.webp",
  weigh:"practice-weigh.webp",
  techniek:"practice-techniek.webp"
};

export function makeData(){
  const years=examples.map((year,yearIndex)=>year.map((week,weekIndex)=>{
    const record=curriculum[yearIndex][weekIndex];
    return {week:record.week,theme:record.theme,lessons:week.map(([type,numbers,checkNumbers],dayIndex)=>{
      const day=slots[dayIndex];
      const main=enrichMath(type,numbers,buildTask(type,numbers));
      const check=enrichMath(type,checkNumbers,buildTask(type,checkNumbers));
      const byPhase=makeVariants(sectors,weekIndex,dayIndex,type,main);
      return {
        id:String(yearIndex+1)+"-"+record.week+"-"+day.key,day:day.key,
        goal:record.goals[dayIndex],theme:record.theme,type,main,check,byPhase,
        variants:byPhase.kennismaken,teaching:makeDidactics(type,numbers,day,main)
      };
    })};
  }));
  const images=Object.fromEntries(Object.entries(artwork).map(([name,file])=>[
    name,"data:image/webp;base64,"+readFileSync(new URL("./"+file,import.meta.url)).toString("base64")
  ]));
  return {
    years,curriculum,slots,defaultStarts,holidays,sourceWorkbook,calendarSource,phaseLabels,images,
    sectors:sectors.map(({weeks,measure,...meta})=>meta),
    sourceSchool:"https://www.csgpm.nl/vakanties"
  };
}
