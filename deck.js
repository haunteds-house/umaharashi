import {applyFarmingScore,priority} from './farming.js';
import {supportCharacters,supportsConflict,supportAllowed,deckRequirements,canCompleteTypes} from './planning.js';
import {createTrainingModel,combinedScore,isOutingCard,supportRaceBonus} from './training.js';
import {baseId,pairNodes,baselineEvaluation,creationChance,summarizeChances,comparePairs} from './core.js';
const tierName=n=>n===3?'gold':n===2?'upgraded':'white';
const rank=s=>s?.rarity===2?3:s?.skillName?.endsWith('◎')?2:1;
// Bounded skill-coverage search, not a training-stat simulator or an exhaustive solver.
export function prepareDecks({plan,supports,ownedSupports,skills,links,characters=[]}) {
 const training=createTrainingModel(plan,characters),weight=Math.min(1,Math.max(0,Number(plan.trainingWeight??25)/100));
 const requirements=deckRequirements(plan);
 const maxOutings=Number.isInteger(plan.maxOutingCards)?Math.max(0,Math.min(6,plan.maxOutingCards)):1;
 const outingCount=d=>d.cards.filter(isOutingCard).length;
 const wanted=plan.wanted,skillMap=new Map(skills.map(s=>[s.skillId,s]));
 const skillIds=wanted.map(id=>links.factorSkills?.[id]??[]);
 const sources=(kind,entityId)=>skillIds.map(ids=>{
  const found=[];for(const id of ids)for(const field of kind==='support'?(plan.countEventSources===false?['supportHints']:['supportHints','supportEvents']):(plan.countEventSources===false||plan.scenario==='MANT'?['characters']:['characters','characterEvents']))for(const source of links.skills?.[id]?.[field]??[])if(source.id===entityId)found.push({skillId:id,skillName:skillMap.get(id)?.skillName??`Skill ${id}`,tier:rank(skillMap.get(id)),kind:field,detail:source.detail});
  return found.sort((a,b)=>b.tier-a.tier)[0]??null;
 });
 const target=baseId(plan.nodes[0].cardId),catalog=new Map(supports.map(s=>[s.supportCardId,s]));
 const candidate=(meta,owned,borrowed)=>({id:meta.supportCardId,charaId:meta.charaId,borrowed,level:borrowed?({1:40,2:45,3:50}[meta.rarity]):owned.level??null,limitBreak:borrowed?4:owned.limitBreak??0,rarity:meta.rarity,type:meta.supportCardTypeName,sources:sources('support',meta.supportCardId)});
 const owned=[...new Map(ownedSupports.map(o=>[o.cardId,o])).values()].map(o=>catalog.has(o.cardId)?candidate(catalog.get(o.cardId),o,false):null).filter(c=>c&&!supportCharacters(c).includes(target)&&training.scenarios.some(s=>supportAllowed(c,s)));
 const borrowed=supports.filter(s=>!plan.borrowSSR||s.rarity===3).map(s=>candidate(s,null,true)).filter(c=>!supportCharacters(c).includes(target)&&training.scenarios.some(s=>supportAllowed(c,s)));
 if(new Set(owned.map(c=>c.charaId)).size<5)throw Error('Deck mode needs at least five owned support characters, excluding the target. Import support_card_data.json or turn deck mode off.');
 const targetSources=plan.nodes[0].cardId?sources('character',plan.nodes[0].cardId):wanted.map(()=>null);
 const seed={cards:[],tiers:targetSources.map(s=>s?.tier??0),quality:0};
 const value=d=>d.tiers.reduce((n,t,i)=>n+(plan.farmingObjective==='legacy'||!plan.farmingObjective||plan.farmingObjective==='package'?1:priority(plan,wanted[i]))*(plan.bought?.[wanted[i]]?.inspirationOnly?0:t?10+t:0),0);
 const beamValue=d=>(1-weight)*value(d)/Math.max(1,wanted.reduce((n,id)=>n+(plan.farmingObjective==='legacy'||!plan.farmingObjective||plan.farmingObjective==='package'?1:priority(plan,id)),0)*13)+weight*d.quality/(d.quality+3000);
 const order=(a,b)=>beamValue(b)-beamValue(a)||b.quality-a.quality||a.cards.map(c=>c.id).join(',').localeCompare(b.cards.map(c=>c.id).join(','));
 const extend=(d,c)=>({cards:[...d.cards,c],tiers:d.tiers.map((t,i)=>Math.max(t,c.sources[i]?.tier??0)),quality:d.quality+training.standalone(c)});
 let beam=[seed];
 for(let slot=0;slot<5;slot++){
  const next=new Map();for(const d of beam)for(const c of owned){if(d.cards.some(x=>supportsConflict(x,c))||outingCount(d)+(isOutingCard(c)?1:0)>maxOutings)continue;const x=extend(d,c);if(!canCompleteTypes(x.cards,requirements.minimums))continue;const key=x.cards.map(c=>c.id).sort((a,b)=>a-b).join(',');if(!next.has(key))next.set(key,x);}
  // Preserve alternatives with each outing count instead of letting
  // high standalone event scores fill every shortlist position.
  beam=[];for(let count=0;count<=Math.min(slot+1,maxOutings);count++){const rows=[...next.values()].filter(d=>outingCount(d)===count).sort(order),kept=new Set(rows.slice(0,64)),identities=new Map();for(const d of rows){const key=d.cards.filter(isOutingCard).map(c=>c.id).sort().join(',');const n=identities.get(key)??0;if(n<4){kept.add(d);identities.set(key,n+1);}}beam.push(...kept);}
 }
 const profiles=new Map();
 const palKey=d=>d.cards.filter(isOutingCard).map(c=>`${c.id}:${c.limitBreak}`).sort().join(',')||'none';
 for(const d of beam)for(const c of borrowed){if(d.cards.some(x=>supportsConflict(x,c))||outingCount(d)+(isOutingCard(c)?1:0)>maxOutings)continue;const x=extend(d,c);if(!canCompleteTypes(x.cards,requirements.minimums))continue;if(requirements.raceBonus>0&&x.cards.some(c=>supportRaceBonus(c)===null))continue;if(x.cards.reduce((n,c)=>n+(supportRaceBonus(c)??0),0)<requirements.raceBonus)continue;const key=x.tiers.join(',')+'|'+x.cards.map(c=>c.type).sort().join(',')+'|'+palKey(x);if(!profiles.has(key)||order(x,profiles.get(key))<0)profiles.set(key,x);}
 // Retain each Pal/Group identity, not just its type: their scenario effects differ.
 const finalists=[];for(const key of new Set([...profiles.values()].map(palKey)))finalists.push(...[...profiles.values()].filter(d=>palKey(d)===key).sort(order).slice(0,8));
 // Keep broader no-Pal diversity as well.
 for(const d of [...profiles.values()].filter(d=>outingCount(d)===0).sort(order).slice(0,32))if(!finalists.includes(d))finalists.push(d);
 const decks=finalists.flatMap(d=>{const result=training.evaluate(d.cards);if(result.unavailable)return [];return result.comparisons.length?result.comparisons.map(comparison=>{const sourcesForScenario=plan.nodes[0].cardId?sources('character',plan.nodes[0].cardId):wanted.map(()=>null);const targetSkills=comparison.scenario==='MANT'?sourcesForScenario.map((source,i)=>{if(source?.kind!=='characterEvents')return source;const ids=skillIds[i];const own=ids.filter(id=>(links.skills?.[id]?.characters??[]).some(x=>x.id===plan.nodes[0].cardId)).map(id=>({skillId:id,skillName:skillMap.get(id)?.skillName,tier:rank(skillMap.get(id)),kind:'characters',detail:'Innate / awakening skill'}));return own.sort((a,b)=>b.tier-a.tier)[0]??null;}):sourcesForScenario;if(plan.scenarioHints!==false)for(let i=0;i<wanted.length;i++){const skill=skillIds[i].map(id=>skillMap.get(id)).find(skill=>skill&&((comparison.scenario==='URA'&&skill.skillName.startsWith('Racing Spirit:'))||(comparison.scenario==='Aoharu'&&skill.skillName.startsWith('Ignited Spirit '))));if(skill&&(!targetSkills[i]||targetSkills[i].tier<1))targetSkills[i]={skillId:skill.skillId,skillName:skill.skillName,tier:1,kind:'scenario',detail:comparison.scenario==='URA'?'Happy Meek duel hint; must earn and buy during this run':'Extreme Spirit Burst hint; must earn and buy during this run'};}return {...d,targetSources:targetSkills,tiers:wanted.map((_,i)=>Math.max(targetSkills[i]?.tier??0,...d.cards.map(c=>c.sources[i]?.tier??0))),training:{...result,...comparison}};}):[{...d,targetSources,training:result}];});
 if(!decks.length)throw Error('No legal five-owned + one-borrowed deck is available for this target and support constraints. Relax the Pal/Group limit, type minimums or race bonus, change scenario, or import more cards.');
 return decks;
}
export function scorePairWithDeck(engine,plan,a,b,base,decks){
 const nodes=pairNodes(plan.nodes[0],a,b),ev=plan.nodes[0].cardId?engine.evaluate(nodes,plan.parentRaceBonus):baselineEvaluation(nodes);
 const odds=new Map(engine.odds(nodes,ev,plan.rolls).map(o=>[o.id,o]));
 let best=null;
 for(const deck of decks){
  const acquisition=[];
  const chances=plan.wanted.map((id,i)=>{
   const o=odds.get(id),inherit=o?.chance??0;
   if(engine.factors.get(id)?.type!==3){acquisition.push({kind:'inheritance',chance:inherit});return inherit;}
   const only=plan.bought?.[id]?.inspirationOnly,available=!only&&deck.tiers[i]>0;
   let source=null;if(available){source=deck.targetSources[i]?.tier===deck.tiers[i]?{...deck.targetSources[i],entityId:plan.nodes[0].cardId}:null;for(const c of deck.cards)if(!source&&c.sources[i]?.tier===deck.tiers[i])source={...c.sources[i],entityId:c.id,borrowed:c.borrowed};}
   acquisition.push(available?{...source,kind:source.kind,conditional:true}:{kind:'inspiration',chance:inherit});
   return creationChance(o?.copies??0,available?tierName(deck.tiers[i]):'white')*(available?1:inherit);
  });
  const score=applyFarmingScore({...base,chances,min:chances.length?Math.min(...chances):0,sum:chances.reduce((s,p)=>s+p,0),...summarizeChances(chances,plan.wanted,engine.links.factorAliases),deck:deck.cards.map(({sources,...c})=>c),acquisition,deckQuality:deck.quality,training:deck.training,combinedScore:combinedScore(chances,deck.training.score,Math.min(1,Math.max(0,Number(plan.trainingWeight??25)/100)))},plan,engine.links.factorAliases);
  if(!best||comparePairs(score,best)<0||comparePairs(score,best)===0&&score.deckQuality>best.deckQuality)best=score;
 }
 return best;
}
