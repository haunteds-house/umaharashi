import test from 'node:test';
import assert from 'node:assert/strict';
import {farmingMetrics,applyFarmingScore,captureFarmingPreset,restoreFarmingSettings,priority} from '../farming.js';
import {emptyPlan,comparePairs} from '../core.js';
const plan={wanted:[1,2,3],farmingObjective:'balanced'};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('three objectives reproduce the documented tradeoff',()=>{
 const rows=[[.8,.4,.1],[.4,.4,.4],[.65,.35,.3]].map(p=>farmingMetrics(p,plan));
 near(rows[0].expectedYield,1.3);near(rows[1].balanced,.4);near(rows[2].packageChance,.06825);
 assert.ok(rows[1].balanced>rows[2].balanced&&rows[2].balanced>rows[0].balanced);
 assert.ok(rows[2].packageChance>rows[1].packageChance);
});
test('weights affect preferences, never probability or unweighted yield; uniform scaling invariant',()=>{
 const a=farmingMetrics([.8,.4,.1],{...plan,sparkWeights:{1:3}}),b=farmingMetrics([.8,.4,.1],{...plan,sparkWeights:{1:30,2:10,3:10}});
 near(a.weightedAverage,b.weightedAverage);near(a.packageChance,.032);near(a.expectedYield,1.3);near(a.weightedYield,2.9);
});
test('aliases count once with conservative chance and highest priority, including transitive overlap',()=>{
 const r=farmingMetrics([.4,.5,.6],{...plan,sparkWeights:{2:3}},{1:[2],2:[3]});
 assert.equal(r.groups.length,1);near(r.expectedYield,.4);near(r.packageChance,.4);near(r.weightedYield,1.2);
});
test('empty and impossible outcomes stay explicit',()=>{
 assert.equal(farmingMetrics([],plan).expectedYield,null);
 assert.equal(farmingMetrics([0,.5,.5],plan).packageChance,0);
 assert.throws(()=>farmingMetrics([NaN],plan));
 assert.equal(priority({sparkWeights:{1:Infinity}},1),1);
});
test('legacy rankings are unchanged; selected objectives reach pair comparator',()=>{
 const a={chances:[.8,.4,.1],min:.1,sum:1.3,total:0,a:'1',b:'2'},b={chances:[.4,.4,.4],min:.4,sum:1.2,total:0,a:'3',b:'4'};
 assert.equal(applyFarmingScore(a,{...plan,farmingObjective:'legacy'}).combinedScore,undefined);
 const by=mode=>comparePairs(applyFarmingScore(a,{...plan,farmingObjective:mode}),applyFarmingScore(b,{...plan,farmingObjective:mode}));
 assert.ok(by('balanced')>0);assert.ok(by('yield')<0);assert.ok(by('package')>0);
});
test('training blend applies selected utility and ignores priorities for package',()=>{
 const r={chances:[.8,.4,.1],min:.1,sum:1.3,training:{score:3000}};
 const a=applyFarmingScore(r,{...plan,farmingObjective:'package',trainingWeight:25,sparkWeights:{1:50}});
 near(a.combinedScore,100*(.75*.032+.25*.5));near(a.farming.skillPoints+a.farming.trainingPoints,a.combinedScore);
});
test('farming presets round trip settings and filters without carrying lineage or collection',()=>{
 const p=emptyPlan();Object.assign(p,{wanted:[1,2],bought:{1:{tier:'gold'}},farmingObjective:'yield',sparkWeights:{1:3},scenario:'Aoharu',deckMinimums:{Speed:2},trainingWeight:10});p.nodes[0].cardId=100101;
 const filter={mode:'uql',uql:'Groundwork >= 6'},preset=JSON.parse(JSON.stringify(captureFarmingPreset(p,filter,'Loop')));
 assert.equal(preset.settings.nodes,undefined);assert.equal(preset.search.uql,filter.uql);
 const target=emptyPlan();target.nodes[0].cardId=100201;target.pins=[true,false];target.minRaceBonus=50;
 const restored=restoreFarmingSettings(target,preset,emptyPlan());
 assert.equal(restored.nodes[0].cardId,100201);assert.deepEqual(restored.pins,[true,false]);assert.equal(restored.farmingObjective,'yield');assert.equal(restored.sparkWeights[1],3);assert.equal(restored.minRaceBonus,undefined);
 restored.wanted.push(3);assert.deepEqual(preset.settings.wanted,[1,2]);
});
