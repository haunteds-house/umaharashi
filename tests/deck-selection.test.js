import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyPlan,emptyNode,Engine,scorePair} from '../core.js';
import {prepareDecks,scorePairWithDeck} from '../deck.js';
import {createTrainingModel} from '../training.js';
import {captureFarmingPreset,restoreFarmingSettings} from '../farming.js';
const D=Object.fromEntries(['characters','supports','skills','factors','affinity','races','skill-links'].map(n=>[n,JSON.parse(fs.readFileSync(new URL('../data/'+n+'.json',import.meta.url)))]));
const fixed=[20015,20050,30054,30028,30084];
const options=plan=>({plan,characters:D.characters,skills:D.skills,links:D['skill-links'],supports:D.supports.filter(s=>[...fixed,30078,30107,30036,10060,20021].includes(s.supportCardId)),ownedSupports:fixed.map(cardId=>({cardId,limitBreak:4,level:50}))});
test('equal skill outcomes break ties on complete-deck training, not standalone sums',()=>{
 const engine=new Engine(D.affinity,D.factors,D.races,D['skill-links']),plan={...emptyPlan(),trainingWeight:0};
 const a={...emptyNode(),id:'a',cardId:100101,parents:[]},b={...emptyNode(),id:'b',cardId:100201,parents:[]};
 const make=(quality,score)=>({cards:[],tiers:[],targetSources:[],quality,training:{score}});
 const result=scorePairWithDeck(engine,plan,a,b,scorePair(engine,plan,a,b),[make(10000,100),make(1,200)]);
 assert.equal(result.training.score,200);
});
test('Unity Riko requirement allows a legal borrow and never silently substitutes Aoi',()=>{
 const plan={...emptyPlan(),scenario:'Aoharu',requireUnityRiko:true,maxOutingCards:1};
 const decks=prepareDecks(options(plan));assert.ok(decks.length);
 for(const d of decks){assert.ok(d.cards.some(c=>[10060,30036].includes(c.id)));assert.equal(d.cards.filter(c=>c.borrowed).length,1);assert.equal(d.cards.length,6);}
 assert.throws(()=>prepareDecks({...options(plan),supports:options(plan).supports.filter(c=>![10060,30036].includes(c.supportCardId))}),/Riko requirement/);
 assert.throws(()=>prepareDecks(options({...plan,maxOutingCards:0})),/Riko requirement|Pal/);
});
test('Riko requirement is scenario-specific and persists in farming presets',()=>{
 const plan={...emptyPlan(),scenario:'URA',requireUnityRiko:true};
 const decks=prepareDecks(options(plan));assert.ok(decks.some(d=>!d.cards.some(c=>[10060,30036].includes(c.id))));
 const restored=restoreFarmingSettings(emptyPlan(),captureFarmingPreset(plan,{},'Stamina'),emptyPlan());assert.equal(restored.requireUnityRiko,true);
});
test('event-stamina breakdown remains independent of energy discount',()=>{
 const deck=[...fixed,30036].map(id=>({id,limitBreak:4}));
 const model=p=>createTrainingModel({...emptyPlan(),scenario:'Aoharu',...p},[]).evaluate(deck);
 const a=model({}),b=model({recoveryAdjustment:false});
 const r=a.perCard.find(c=>c.id===30036);assert.equal(r.startingStats[1],30);assert.equal(r.eventStats[1],95*1.35);
 assert.deepEqual(r.eventStats,b.perCard.find(c=>c.id===30036).eventStats);
 assert.ok(r.energyScore<b.perCard.find(c=>c.id===30036).energyScore);
});
test('full-deck refinement preserves skill tiers, legality and finds useful owned swaps',()=>{
 const plan={...emptyPlan(),scenario:'Aoharu',trainingWeight:0,maxOutingCards:0,deckMinimums:{Speed:2,Intelligence:3}};
 const opts=options(plan);opts.ownedSupports.push({cardId:30040,limitBreak:0,level:30});opts.supports.push(D.supports.find(c=>c.supportCardId===30040));
 plan.wanted=['Groundwork','Tail Held High','Dodging Danger'].map(n=>Number(D.factors.find(f=>f.text===n).id));
 const decks=prepareDecks(opts);const best=decks.filter(d=>d.tiers[0]>=1&&d.tiers[1]>=1&&d.tiers[2]===3).sort((a,b)=>b.training.score-a.training.score)[0];assert.ok(best);
 for(const d of decks){assert.equal(new Set(d.cards.map(c=>c.charaId)).size,6);assert.equal(d.cards.filter(c=>c.borrowed).length,1);}
 // At equal skill coverage the suggested owned speed slot must not retain
 // Jordan when the complete model scores the available Kitasan swap higher.
 assert.ok(best.cards.some(c=>c.id===30028&&!c.borrowed));
 assert.ok(!best.cards.some(c=>c.id===30084&&!c.borrowed));
});
