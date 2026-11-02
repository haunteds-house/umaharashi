// Preference scores are not game probabilities. Alias groups are one outcome.
export const objectives={legacy:'Current ranking',balanced:'Balanced coverage',yield:'Most desired sparks per run',package:'Complete package'};
export function priority(plan,id){const n=Number(plan.sparkWeights?.[id]??1);return Number.isFinite(n)?Math.max(.1,Math.min(100,n)):1;}
export function farmingMetrics(chances,plan,aliases={}){
 const groups=[];
 chances.forEach((p,i)=>{
  if(!Number.isFinite(p)||p<0||p>1)throw Error('Invalid outcome probability.');
  const id=plan.wanted[i],keys=new Set([id,...(aliases[id]??[])]);let weight=priority(plan,id),ids=[id];
  for(const g of [...groups])if([...keys].some(k=>g.keys.has(k))){g.keys.forEach(k=>keys.add(k));p=Math.min(p,g.p);weight=Math.max(weight,g.weight);ids.push(...g.ids);groups.splice(groups.indexOf(g),1);}
  groups.push({keys,ids,p,weight});
 });
 const rows=groups.map(({keys,...g})=>g),count=rows.length;
 const expectedYield=count?rows.reduce((n,g)=>n+g.p,0):null;
 const weightedYield=count?rows.reduce((n,g)=>n+g.p*g.weight,0):null;
 const weightTotal=rows.reduce((n,g)=>n+g.weight,0);
 const weightedAverage=count?weightedYield/weightTotal:null;
 const balanced=count?(Math.min(...rows.map(g=>g.p))+weightedAverage)/2:null;
 const packageChance=count?rows.reduce((n,g)=>n*g.p,1):null;
 const objective=Object.hasOwn(objectives,plan.farmingObjective)?plan.farmingObjective:'legacy';
 const utility={balanced,yield:weightedAverage,package:packageChance}[objective]??null;
 return {objective,groups:rows,expectedYield,weightedYield,weightedAverage,balanced,packageChance,utility};
}
export function applyFarmingScore(result,plan,aliases={}){
 const farming=farmingMetrics(result.chances,plan,aliases);
 const trainingWeight=result.training?Math.max(0,Math.min(1,Number(plan.trainingWeight??25)/100)):0;
 const trainingUtility=result.training?Math.max(0,result.training.score)/(Math.max(0,result.training.score)+3000):0;
 const skillUtility=farming.utility??(result.chances.length?(result.min+result.sum/result.chances.length)/2:0);
 const score=100*((1-trainingWeight)*skillUtility+trainingWeight*trainingUtility);
 return {...result,farming:{...farming,trainingWeight,skillUtility,skillPoints:100*(1-trainingWeight)*skillUtility,trainingPoints:100*trainingWeight*trainingUtility},...(farming.objective!=='legacy'?{combinedScore:score}:{})};
}
export const farmingFields=['wanted','bought','searchMode','includeSupports','borrowSSR','maxOutingCards','scenario','autoScenarios','trainingFocus','trainingWeight','rolls','parentRaceBonus','farmingObjective','sparkWeights','deckTemplate','deckMinimums','minRaceBonus','countEventSources','scenarioHints','recoveryAdjustment','courseId','goalPreset','matchSort','matchDirection'];
export function captureFarmingPreset(plan,search,name){return {version:1,name:String(name).trim().slice(0,100)||'Farming preset',settings:Object.fromEntries(farmingFields.filter(k=>plan[k]!==undefined).map(k=>[k,structuredClone(plan[k])])),search:structuredClone(search)};}
export function restoreFarmingSettings(plan,preset,defaults){
 if(preset?.version!==1||!preset.settings||typeof preset.settings!=='object')throw Error('Invalid farming preset.');
 const next=structuredClone(plan);
 for(const k of farmingFields){delete next[k];if(defaults[k]!==undefined)next[k]=structuredClone(defaults[k]);if(Object.hasOwn(preset.settings,k))next[k]=structuredClone(preset.settings[k]);}
 next.deck=[];next.training=null;return next;
}
