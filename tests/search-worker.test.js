import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyPlan,emptyNode} from '../core.js';
const load=n=>JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)));
const messages=[];
globalThis.self={postMessage:m=>messages.push(m)};
await import('../search-worker.js');
test('worker searches without a target, applies pins, and rejects invalid pinned slots',()=>{
 const plan=emptyPlan();plan.wanted=[210090];plan.searchMode='sparkgen';plan.bought[210090]={tier:'white',inspirationOnly:true};
 const veteran=(id,cardId,stars)=>({...emptyNode(),id,cardId,sparks:[{id:210150,stars}],parents:[]});
 const veterans=[veteran('1',100101,1),veteran('2',100201,2),veteran('3',100301,3)];
 const data={affinity:load('affinity'),factors:load('factors'),races:load('races'),links:load('skill-links'),plan,veterans};
 self.onmessage({data});let result=messages.at(-1);assert.equal(result.type,'done');assert.equal(result.matched,3);assert.deepEqual([result.top[0].a,result.top[0].b],['2','3']);assert.equal(result.top[0].baseline,true);
 plan.pins[0]=true;plan.nodes[1].sourceId='1';self.onmessage({data});result=messages.at(-1);assert.equal(result.matched,2);assert.ok(result.top.every(p=>p.a==='1'));
 plan.nodes[1].sourceId=null;self.onmessage({data});assert.equal(messages.at(-1).type,'error');
});
test('deck worker returns scenario-scored six-card results and rejects insufficient owned cards',()=>{
 const plan=emptyPlan();plan.includeSupports=true;plan.scenario='URA';plan.wanted=[Number(load('factors').find(f=>f.text==='Groundwork').id)];
 const veterans=[100101,100201].map((cardId,i)=>({...emptyNode(),id:String(i+1),cardId,parents:[]}));
 const data={affinity:load('affinity'),factors:load('factors'),races:load('races'),links:load('skill-links'),skills:load('skills'),characters:load('characters'),supports:load('supports'),ownedSupports:[30028,20031,20033,20012,20002,30052].map(cardId=>({cardId,limitBreak:4,level:50})),plan,veterans};
 self.onmessage({data});const r=messages.at(-1);assert.equal(r.type,'done');assert.equal(r.top.length,1);assert.equal(r.top[0].deck.length,6);assert.equal(r.top[0].training.scenario,'URA');assert.ok(Number.isFinite(r.top[0].combinedScore));
 data.ownedSupports=[];self.onmessage({data});assert.equal(messages.at(-1).type,'error');assert.match(messages.at(-1).message,/at least five/);
});

test('match sorting changes the full worker shortlist, not just the existing top 40',()=>{
 const plan=emptyPlan();plan.wanted=[210090];plan.searchMode='sparkgen';plan.bought[210090]={tier:'white',inspirationOnly:true};
 const veterans=Array.from({length:12},(_,i)=>({...emptyNode(),id:String(i),cardId:100101+i*100,sparks:i<2?[]:[{id:210150,stars:3}],parents:[]}));
 const data={affinity:load('affinity'),factors:load('factors'),races:load('races'),links:load('skill-links'),plan,veterans};
 self.onmessage({data});const normal=messages.at(-1);assert.equal(normal.type,'done');assert.equal(normal.top.length,40);assert.ok(!normal.top.some(r=>r.a==='0'&&r.b==='1'));
 plan.matchSort='average';plan.matchDirection='asc';self.onmessage({data});const sorted=messages.at(-1);assert.equal(sorted.type,'done');assert.deepEqual([sorted.top[0].a,sorted.top[0].b],['0','1']);
 assert.ok(sorted.top.every((r,i,rows)=>!i||rows[i-1].average<=r.average));
});

test('match comparison handles missing values, infinity, individual sparks and deck value',async()=>{
 const {compareParentMatches:cmp}=await import('../core.js');
 const a={a:'1',b:'2',min:0,sum:0,total:5,average:.2,expectedRuns:Infinity,chances:[.8],training:{score:400,missing:[]}};
 const b={...a,a:'3',average:.5,expectedRuns:2,chances:[.3],training:{score:200,missing:[]}};
 assert.ok(cmp(a,b,'average','desc')>0);assert.ok(cmp(a,b,'expectedRuns','asc')>0);
 assert.ok(cmp(a,b,'spark:0','desc')<0);assert.ok(cmp(a,b,'training','desc')<0);
 for(const direction of ['asc','desc']){assert.ok(cmp({...a,average:null},b,'average',direction)>0);assert.ok(cmp({...a,baseline:true},b,'affinity',direction)>0);}
});
