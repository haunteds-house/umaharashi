import {supportRules} from './support-rules.js';
export const supportCharacters=c=>supportRules[c.id]?.characters??[c.charaId];
export const supportOutings=c=>supportRules[c.id]?.outings??0;
export const supportsConflict=(a,b)=>supportCharacters(a).some(id=>supportCharacters(b).includes(id));
export const supportAllowed=(c,scenario)=>!(supportRules[c.id]?.blockedScenarios??[]).includes(scenario);
export const deckTypes=['Speed','Stamina','Power','Guts','Intelligence'];
export const deckTemplates={
 free:{name:'Flexible · no type minimums',minimums:{},raceBonus:0},
 unity:{name:'Unity Cup · 2 Speed / 3 Wit',minimums:{Speed:2,Intelligence:3},raceBonus:35,scenario:'Aoharu',note:'One flex slot, commonly Riko. Adapt for stamina needs or strong Speed growth.',source:'unity-cup-deckbuilding-guide'},
 mant:{name:'Trackblazer · 2 Speed / 2 Wit',minimums:{Speed:2,Intelligence:2},raceBonus:50,scenario:'MANT',note:'Two flex slots for skills, stamina, or growth. Career-specific character events are unavailable.',source:'trackblazer'},
 guts:{name:'Trackblazer · 3 Guts / 2 Wit',minimums:{Guts:3,Intelligence:2},raceBonus:50,scenario:'MANT',note:'One flex slot. Check stamina and skill access before committing.',source:'trackblazer'},
 concert:{name:'Grand Concert · 2 Speed / 2 Wit',minimums:{Speed:2,Intelligence:2},raceBonus:0,scenario:'GL',note:'Reserve a flex slot for Light Hello where possible. Training and songs matter more than extra races.',source:'grand-concert'}
};
const parenting='https://uma.guide/guides/parenting-in-umamusume';
export const goalPresets=[
 {id:'front-loop',name:'Front Runner · starter skill loop',skills:['Groundwork','Ignited Spirit WIT','Prudent Positioning','Dodging Danger'],scenario:'Aoharu',note:'Seed the four skills, then expand the loop. Keep rare skills that have no replacement source.',source:parenting},
 {id:'pace-loop',name:'Pace Chaser · starter skill loop',skills:['Groundwork','Nimble Navigator','Racing Spirit: Stamina','Uma Stan'],scenario:'URA',note:'URA can seed Racing Spirit. Move to Unity or Trackblazer for stronger final parents once the loop is established.',source:parenting},
 {id:'late-loop',name:'Late Surger · starter skill loop',skills:['Uma Stan','Pedal to the Metal','Tail Held High','Nimble Navigator'],scenario:'MANT',note:'Trackblazer can offer style hints. Preserve skills without a dependable source and aim for SS rank.',source:parenting},
 {id:'end-loop',name:'End Closer · starter skill loop',skills:['Uma Stan','Restraint','Tail Held High','Nimble Navigator'],scenario:'Aoharu',note:'Restraint is difficult to replace. Check acquisition sources before advancing a generation.',source:parenting},
 ...['Front','Pace','Late','End'].map(style=>({id:'cm21-'+style.toLowerCase(),name:'CM21 Capricorn · '+style,skills:['Meticulous Measures','Sprinting Gear','Sprint Corners ○',...(style==='Pace'?['Head-On']:style==='Late'?['Leap Forward','Slick Surge','Pedal to the Metal']:style==='End'?['Leap Forward','Straightaway Spurt']:[])],scenario:'GL',template:'concert',note:'Chukyo 1200m turf · Winter / Left / Sunny / Firm. White-spark farming package, not a full ace build. Choose direct-parent uniques separately: Victoria por plancha ☆, Budding Blossom, or Louder! Tracen Cheer! as appropriate for style. Final-straight timing differs from old CM9.',source:'https://uma.guide/guides/cm21-guide'}))
];
export function applyGoalPreset(plan,id,factors){
 const preset=goalPresets.find(p=>p.id===id);if(!preset)throw Error('Unknown parent goal.');
 const found=preset.skills.map(name=>factors.find(f=>f.type===3&&f.text===name));
 const missing=preset.skills.filter((_,i)=>!found[i]);if(missing.length)throw Error('Preset skills absent from this data snapshot: '+missing.join(', '));
 const next=structuredClone(plan);next.wanted=[...new Set([...next.wanted,...found.map(f=>Number(f.id))])];
 Object.assign(next,{goalPreset:id,scenario:preset.scenario,searchMode:'sparkgen',includeSupports:true,trainingWeight:10,matchSort:'recommended'});
 if(preset.id.startsWith('cm21-'))next.courseId=10701;
 if(preset.template)Object.assign(next,{deckTemplate:preset.template,deckMinimums:{...deckTemplates[preset.template].minimums},minRaceBonus:deckTemplates[preset.template].raceBonus});
 next.bought??={};for(const f of found)next.bought[f.id]??={tier:'white',inspirationOnly:false};return next;
}
export function deckRequirements(plan){
 const minimums=Object.fromEntries(deckTypes.map(t=>[t,Number(plan.deckMinimums?.[t]??0)]));
 if(Object.values(minimums).some(n=>!Number.isInteger(n)||n<0||n>6)||Object.values(minimums).reduce((a,b)=>a+b,0)>6)throw Error('Support type minimums must be whole numbers totaling at most six.');
 const raceBonus=Number(plan.minRaceBonus??0);if(!Number.isFinite(raceBonus)||raceBonus<0||raceBonus>100)throw Error('Minimum race bonus must be between 0 and 100.');
 return {minimums,raceBonus};
}
export function canCompleteTypes(cards,minimums){const deficits=deckTypes.reduce((n,t)=>n+Math.max(0,minimums[t]-(cards.filter(c=>c.type===t).length)),0);return deficits<=6-cards.length;}
export function courseSummary(course){
 const finalStraight=course.straights.find(s=>s.end===course.distance);
 return {lateStart:course.distance*2/3,finalStraight:finalStraight?.start??null,finalStraightLength:finalStraight?course.distance-finalStraight.start:null};
}
