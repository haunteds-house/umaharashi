import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanScenarioGoals,scenarioSkillSources,scenarioGoalControls} from '../scenario-skills.js';
import {prepareDecks,scorePairWithDeck} from '../deck.js';
import {emptyPlan,emptyNode,Engine,scorePair} from '../core.js';
import {captureFarmingPreset,restoreFarmingSettings} from '../farming.js';
const D=Object.fromEntries(['characters','supports','skills','factors','skill-links','affinity','races'].map(n=>[n,JSON.parse(fs.readFileSync(new URL('../data/'+n+'.json',import.meta.url)))]));
const rewards=(scenario,scenarioGoals,extra={})=>scenarioSkillSources({scenarioGoals,...extra},scenario,D.skills);
test('scenario selection alone no longer grants every stat hint',()=>{
 for(const s of ['URA','Aoharu','MANT','GL','GM'])assert.deepEqual(rewards(s,{}),[]);
 assert.deepEqual(rewards('Aoharu',{unityExtreme:['Wit']},{scenarioHints:false}),[]);
 assert.deepEqual(rewards('URA',{unityExtreme:['Wit']}),[]);
});
test('Extreme Bursts give only selected facilities; gold needs ten total bursts and a unique highest rank',()=>{
 const g={unityExtreme:['Wit','Power'],unityHighest:'Speed'};
 assert.deepEqual(rewards('Aoharu',g).map(s=>s.skillId),[210052,210032]);
 for(const [n,tier] of [[3,0],[4,1],[9,1],[10,3],[12,3],[13,3]]){
  const rows=rewards('Aoharu',{...g,unityBursts:n});
  assert.equal(rows.find(s=>s.skillId===210011||s.skillId===210012)?.tier??0,tier);
  assert.equal(rows.filter(s=>s.tier===3).length,tier===3?1:0);
 }
 assert.equal(rewards('Aoharu',{unityBursts:20,unityHighest:''}).length,0);
 assert.match(rewards('Aoharu',{unityExtreme:['Wit']})[0].detail,/strengthened Team Zenith/);
});
test('URA uses the duel contest, including Energy for Mood, and a separate final reward',()=>{
 const rows=rewards('URA',{uraDuels:['Energy','Stamina'],uraFinal:true});
 assert.deepEqual(rows.map(s=>s.skillId),[210141,210101,210081]);
 assert.ok(rows.every(s=>s.kind==='scenario'));
});
test('concert and Trackblazer rewards distinguish progress from gold completion requirements',()=>{
 assert.deepEqual(rewards('MANT',{trackAward:true,trackWin:true}).map(s=>s.skillId),[210062,210061]);
 for(const [songs,great,id] of [[17,true,210072],[18,false,210072],[18,true,210071],[22,true,210071]]){
  assert.equal(rewards('GL',{concertComplete:true,concertSongs:songs,concertGreat:great})[0].skillId,id);
 }
 assert.deepEqual(rewards('GL',{concertSongs:22,concertGreat:true}),[]);
});
test('career goals survive presets and reject malformed or injected values',()=>{
 const plan={...emptyPlan(),scenarioGoals:{unityExtreme:['Wit'],unityHighest:'Wit',unityBursts:10}};
 assert.deepEqual(restoreFarmingSettings(emptyPlan(),captureFarmingPreset(plan,{},'Unity'),emptyPlan()).scenarioGoals,plan.scenarioGoals);
 assert.deepEqual(cleanScenarioGoals({unityExtreme:['Wit','Wit','<script>'],unityBursts:'10'}).unityExtreme,['Wit']);
 assert.equal(cleanScenarioGoals({unityBursts:'10'}).unityBursts,0);
 assert.ok(!scenarioGoalControls({...plan,scenarioGoals:{unityHighest:'<script>'}}).includes('<script>'));
});
test('scenario gold changes actual deck scoring and respects tier caps and inspiration-only',()=>{
 const p={...emptyPlan(),scenario:'Aoharu',deckMode:'manual',manualDeck:[30017,20015,20050,30028,30084,30078],wanted:[210050],scenarioGoals:{unityHighest:'Wit',unityBursts:10}};
 assert.ok(D['skill-links'].factorSkills[p.wanted[0]].includes(210051));
 const opts={plan:p,characters:D.characters,skills:D.skills,links:D['skill-links'],supports:D.supports,ownedSupports:p.manualDeck.slice(0,5).map(cardId=>({cardId,limitBreak:4,level:50}))};
 const decks=prepareDecks(opts);assert.deepEqual(decks[0].tiers,[3]);assert.equal(decks[0].targetSources[0].skillName,'Burning Spirit WIT');
 const engine=new Engine(D.affinity,D.factors,D.races,D['skill-links']);
 const a={...emptyNode(),id:'a',cardId:100101,parents:[]},b={...emptyNode(),id:'b',cardId:100201,parents:[]};
 const score=plan=>scorePairWithDeck(engine,plan,a,b,scorePair(engine,plan,a,b),decks);
 assert.equal(score(p).chances[0],.4);
 assert.equal(score({...p,bought:{210050:{manualTier:true,tier:'white'}}}).chances[0],.2);
 assert.equal(score({...p,bought:{210050:{inspirationOnly:true}}}).chances[0],0);
 assert.deepEqual(prepareDecks({...opts,plan:{...p,scenarioGoals:{unityExtreme:['Wit']}}})[0].tiers,[1]);
 assert.deepEqual(prepareDecks({...opts,plan:{...p,scenario:'URA'}})[0].tiers,[0]);
});
