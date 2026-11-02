import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainingModel,trainingWeights} from '../training.js';
import {emptyPlan} from '../core.js';
import {processCards} from '../vendor/tierlist/tierlist-calc.js';
import cards from '../vendor/tierlist/cards.js';
import {recoveryUtilization} from '../scenario-supports.js';
const fixed=[30028,30003,30010,30054,30055];
const evaluate=(scenario,pal)=>createTrainingModel({...emptyPlan(),scenario},[]).evaluate([...fixed,pal].map(id=>({id,limitBreak:4})));
test('Global link bonuses use card IDs, including both Riko rarities',()=>{
 const w=trainingWeights(null,'Aoharu');for(const id of [10060,30036]){const card=cards.find(c=>c.id===id&&c.limit_break===4);const r=processCards([{...card,char_name:'renamed display label'}],w,[])[0];assert.equal(r.info.scenario_bonus,40);}
 const hello=cards.find(c=>c.id===30052&&c.limit_break===4);assert.equal(processCards([hello],w,[])[0].info.scenario_bonus,0);assert.equal(processCards([hello],trainingWeights(null,'GL'),[])[0].info.scenario_bonus,75);
});
test('same 2 Speed 3 Wit deck distinguishes Unity Riko and Concert Hello',()=>{
 assert.ok(evaluate('Aoharu',30036).score>evaluate('Aoharu',30052).score);
 assert.ok(evaluate('GL',30052).score>evaluate('GL',30036).score);
 assert.equal(evaluate('Aoharu',30052).perCard.at(-1).scenarioLinked,false);
 assert.ok(evaluate('Aoharu',30052).perCard.at(-1).energyScore>0,'ordinary recovery is not removed off-scenario');
});
test('recovery heuristic follows deck composition, not Pal identity or scenario',()=>{
 assert.equal(recoveryUtilization([]),1);assert.equal(recoveryUtilization([{type:4},{type:4},{type:4}]),.4);
 assert.equal(evaluate('Aoharu',30036).energyUtilization,evaluate('GL',30052).energyUtilization);
});
test('original recovery valuation remains available explicitly',()=>{
 const r=createTrainingModel({...emptyPlan(),scenario:'Aoharu',recoveryAdjustment:false},[]).evaluate([...fixed,30052].map(id=>({id,limitBreak:4})));
 assert.equal(r.energyUtilization,1);assert.ok(r.score>evaluate('Aoharu',30052).score);
});
test('both Pal identities survive profile pruning with the same five owned cards',async()=>{
 const {readFileSync}=await import('node:fs');const {prepareDecks}=await import('../deck.js');
 const supports=JSON.parse(readFileSync(new URL('../data/supports.json',import.meta.url))).filter(c=>[...fixed,30036,30052].includes(c.supportCardId));
 const decks=prepareDecks({plan:{...emptyPlan(),scenario:'Aoharu',borrowSSR:true},supports,ownedSupports:fixed.map(cardId=>({cardId,limitBreak:4,level:50})),skills:[],links:{},characters:[]});
 for(const id of [30036,30052])assert.ok(decks.some(d=>d.cards.some(c=>c.id===id&&c.borrowed)),`borrow ${id} survived`);
});
