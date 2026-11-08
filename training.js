import {scenarioSupportIds,recoveryUtilization} from './scenario-supports.js';
import {supportOutings,supportAllowed} from './planning.js';
import cards from './vendor/tierlist/cards.js';
import {processCards} from './vendor/tierlist/tierlist-calc.js';
import {getScenario} from './vendor/tierlist/scenarios.js';
import {scenarioNames} from './training-options.js';
export {scenarioNames};
export const isOutingCard=c=>supportOutings(c)>0||lookup.get(`${c.id}:${c.limitBreak}`)?.type===6;
export const supportRaceBonus=c=>lookup.get(`${c.id}:${c.limitBreak}`)?.race_bonus??null;
const lookup=new Map(cards.map(c=>[`${c.id}:${c.limit_break}`,c]));
export function trainingWeights(target,scenario,focus='balanced'){
 const config=getScenario('gl',scenario),chosen=config[focus]??config.speed;
 // Keep the valuation of stats comparable across scenarios; scenario mechanics vary.
 const common=getScenario('gl','URA')[focus]??{...config.speed,type:0,prioritize:false,stats:[1,1,1,1,1,1,1],cap:500};
 return {...chosen,...common,...config.general,scenarioLinkIds:scenarioSupportIds[scenario],umaBonus:[...['Speed','Stamina','Power','Guts','Wisdom'].map(k=>1+(Number(target?.['talent'+k])||0)/100),1]};
}
export function createTrainingModel(plan,characters){
 const target=characters.find(c=>c.cardId===plan.nodes[0].cardId);
 // Auto uses scenarios enabled by the user; absent settings preserve conservative Global defaults.
 const enabled=(plan.autoScenarios??['URA','Aoharu','MANT','GL']).filter(k=>scenarioNames[k]);
 const scenarios=plan.scenario&&plan.scenario!=='auto'?[plan.scenario]:enabled;
 if(!scenarios.length||scenarios.some(k=>!scenarioNames[k]))throw Error('Select at least one supported training scenario.');
 const maps=new Map(),weights=new Map(),cache=new Map();
 for(const scenario of scenarios){const w=trainingWeights(target,scenario,plan.trainingFocus??'balanced');weights.set(scenario,w);maps.set(scenario,new Map(processCards(cards,w,[]).map(c=>[`${c.id}:${c.lb}`,c.score])));}
 const standalone=c=>Math.max(0,...scenarios.filter(s=>supportAllowed(c,s)).map(s=>maps.get(s).get(`${c.id}:${c.limitBreak}`)??0));
 function evaluate(deck){const key=deck.map(c=>`${c.id}:${c.limitBreak}`).sort().join(',');if(cache.has(key))return cache.get(key);
  const models=deck.map(c=>lookup.get(`${c.id}:${c.limitBreak}`));
  if(models.some(c=>!c))return {score:0,scenario:null,comparisons:[],missing:deck.filter((c,i)=>!models[i]).map(c=>c.id)};
  const legal=scenarios.filter(s=>deck.every(c=>supportAllowed(c,s)));
  if(!legal.length)return {score:0,scenario:null,comparisons:[],missing:[],unavailable:true};
  const outingDays=deck.reduce((n,c)=>n+supportOutings(c),0);
  const comparisons=legal.map(s=>{const energyUtilization=plan.recoveryAdjustment===false?1:recoveryUtilization(models);const perCard=models.map((c,i)=>{const r=processCards([c],{...weights.get(s),deckOutingDays:outingDays,energyUtilization},models.filter((_,j)=>j!==i))[0];return {id:c.id,score:r?.score??0,energyScore:r?.info.energy_score??0,scenarioBonus:r?.info.scenario_bonus??0,startingStats:r?.info.starting_stats??[],eventStats:r?.info.event_stats??[],scenarioLinked:(scenarioSupportIds[s]??[]).includes(c.id)};});return {scenario:s,score:perCard.reduce((n,c)=>n+c.score,0),perCard,energyUtilization};}).sort((a,b)=>b.score-a.score);
  const result={raceBonus:models.reduce((n,c)=>n+c.race_bonus,0),outingDays,...comparisons[0],comparisons,missing:[],growth:weights.get(comparisons[0].scenario).umaBonus.slice(0,5).map(x=>Math.round((x-1)*100)),neutralGrowth:!target};cache.set(key,result);return result;
 }
 return {standalone,evaluate,scenarios};
}
export const combinedScore=(chances,training,weight=.25)=>{
 const skill=chances.length?(Math.min(...chances)+chances.reduce((s,p)=>s+p,0)/chances.length)/2:0;
 return 100*((1-weight)*skill+weight*Math.max(0,training)/(Math.max(0,training)+3000));
};
