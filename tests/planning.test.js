import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {supportCharacters,supportOutings,supportsConflict,supportAllowed,goalPresets,applyGoalPreset,deckRequirements,courseSummary} from '../planning.js';
import {emptyPlan} from '../core.js';
import {prepareDecks} from '../deck.js';
import {createTrainingModel} from '../training.js';
const D=Object.fromEntries(['characters','supports','skills','factors','skill-links','courses'].map(n=>[n,JSON.parse(fs.readFileSync(new URL('../data/'+n+'.json',import.meta.url)))]));
const options=plan=>({plan,supports:D.supports,ownedSupports:D.supports.map(c=>({cardId:c.supportCardId,limitBreak:4,level:50})),skills:D.skills,links:D['skill-links'],characters:D.characters});
test('MDB group members, scenario restrictions and outing counts',()=>{
 assert.equal(supportOutings({id:30081}),7);assert.equal(supportOutings({id:30067}),5);assert.equal(supportOutings({id:30080}),3);
 assert.ok(supportCharacters({id:30067}).includes(1003));assert.ok(supportsConflict({id:30067},{id:9,charaId:1003}));
 assert.equal(supportAllowed({id:30081},'GL'),false);assert.equal(supportAllowed({id:30081},'Aoharu'),false);assert.equal(supportAllowed({id:30081},'MANT'),true);
});
test('all goal packages resolve and preserve the user plan without mutation',()=>{
 const p=emptyPlan();p.wanted=[100];p.nodes[0].cardId=100101;p.bought[100]={tier:'white',inspirationOnly:true};const before=structuredClone(p);
 for(const preset of goalPresets){const n=applyGoalPreset(p,preset.id,D.factors);assert.ok(n.wanted.includes(100));assert.equal(n.nodes[0].cardId,p.nodes[0].cardId);assert.equal(n.includeSupports,true);assert.equal(n.searchMode,'sparkgen');assert.equal(new Set(n.wanted).size,n.wanted.length);}
 assert.deepEqual(p,before);assert.throws(()=>applyGoalPreset(p,'front-loop',[]),/absent/);
});
test('type and race-bonus constraints include borrow and forbid group-member conflicts',()=>{
 const p={...emptyPlan(),scenario:'MANT',deckMinimums:{Speed:2,Intelligence:2},minRaceBonus:50};p.nodes[0].cardId=100301;
 const decks=prepareDecks(options(p));assert.ok(decks.length);
 for(const d of decks){assert.ok(d.cards.filter(c=>c.type==='Speed').length>=2);assert.ok(d.cards.filter(c=>c.type==='Intelligence').length>=2);assert.ok(d.training.raceBonus>=50);assert.equal(d.cards.filter(c=>c.borrowed).length,1);assert.ok(!d.cards.some(c=>supportCharacters(c).includes(1003)));for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)assert.equal(supportsConflict(d.cards[i],d.cards[j]),false);}
 assert.throws(()=>deckRequirements({deckMinimums:{Speed:4,Intelligence:3}}),/at most six/);
});
test('scenario hints are conditional, scenario-specific and can be disabled',()=>{
 const id=Number(D.factors.find(f=>f.text==='Racing Spirit: Stamina').id);const p={...emptyPlan(),scenario:'URA',wanted:[id],scenarioGoals:{uraDuels:['Stamina']}};
 let decks=prepareDecks(options(p));assert.ok(decks.every(d=>d.targetSources[0]?.kind==='scenario'));
 decks=prepareDecks(options({...p,scenario:'GL'}));assert.ok(decks.every(d=>d.targetSources[0]===null));
 decks=prepareDecks(options({...p,scenarioHints:false}));assert.ok(decks.every(d=>d.targetSources[0]===null));
});
test('automatic scenario evaluation excludes restricted group cards',()=>{
 const p={...emptyPlan(),scenario:'auto',autoScenarios:['GL','MANT','Aoharu']};const model=createTrainingModel(p,D.characters);
 const result=model.evaluate([30081,30028,20031,20033,20012,20002].map(id=>({id,limitBreak:4})));
 assert.deepEqual(result.comparisons.map(x=>x.scenario),['MANT']);assert.equal(result.outingDays,7);
});
test('Trackblazer excludes character event sources but retains innate alternatives',()=>{
 const skill=Object.entries(D['skill-links'].skills).find(([id,v])=>v.characterEvents?.length&&D['skill-links'].factorSkills&&Object.values(D['skill-links'].factorSkills).some(ids=>ids.includes(Number(id))));assert.ok(skill);
 const target=skill[1].characterEvents[0].id, factor=Number(Object.entries(D['skill-links'].factorSkills).find(([id,ids])=>ids.includes(Number(skill[0])))[0]);
 const p={...emptyPlan(),scenario:'MANT',wanted:[factor]};p.nodes[0].cardId=target;
 assert.ok(prepareDecks(options(p)).every(d=>d.targetSources[0]?.kind!=='characterEvents'));
});
test('course geometry shows Chukyo 1200 final-straight carryover window',()=>{
 const c=D.courses.courses.find(c=>c.race_track_id===10007&&c.distance===1200&&c.surface===1);assert.ok(c);
 const s=courseSummary(c);assert.equal(s.lateStart,800);assert.equal(s.finalStraight,788);assert.equal(s.finalStraightLength,412);
});
