import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {optimizeTransfers,planProtection,transferSettings} from '../transfer.js';
import {normalizeImport} from '../core.js';
const factors=[{id:'10',type:0},{id:'20',type:1},{id:'30',type:3},{id:'40',type:3},{id:'100',type:5},{id:'200',type:5}];
const node=(cardId,position)=>({cardId,position,sparks:[{id:10,stars:2}],wins:[1,2],winsKnown:true});
const veteran=(id,extra={})=>({id:String(id),...node(100101),parents:[node(100201,10),node(100301,20)],locked:false,saved:false,memo:'',stats:{speed:600},aptitudes:{Turf:7},skills:[{id:1,level:1}],rating:1000,...extra});
const run=(rows,options={},plans=[])=>optimizeTransfers(rows,factors,options,plans);
test('duplicate copies retain a deterministic witness, not circular transfers',()=>{
 const input=[veteran(3),veteran(2),veteran(1)],before=structuredClone(input),result=run(input);
 assert.equal(result.counts.transfer,2);assert.equal(result.rows.find(r=>r.id==='1').verdict,'keep');
 for(const r of result.rows.filter(r=>r.verdict==='transfer'))assert.deepEqual(r.replacements,['1']);
 assert.deepEqual(input,before);
});
test('all protection sources survive even when otherwise redundant',()=>{
 const rows=[veteran(1,{locked:true}),veteran(2,{memo:'keep'}),veteran(3,{saved:true}),veteran(4),veteran(5),veteran(6)];
 const result=run(rows,{protectedIds:['4']},['5']);assert.equal(result.counts.protected,4);assert.equal(result.counts.transfer,2);
});
test('missing lock metadata and incomplete ancestry/history remain review',()=>{
 for(const extra of [{locked:null},{locked:undefined},{parents:[]},{winsKnown:false},{sparks:[{id:999,stars:3}]}]){
  const result=run([veteran(1),veteran(2,extra)]);assert.equal(result.rows.find(r=>r.id==='2').verdict,'review');assert.equal(result.counts.transfer,0);
 }
});
test('alternate outfits, unique signatures and ancestor identities are separate groups',()=>{
 const variants=[{cardId:100102},{sparks:[{id:100,stars:1}]},{parents:[node(100401,10),node(100301,20)]}];
 for(const extra of variants)assert.equal(run([veteran(1),veteran(2,extra)]).counts.transfer,0);
});
test('stronger stars, additional races and ancestor sparks are preserved',()=>{
 const strong=veteran(2,{sparks:[{id:10,stars:3}],wins:[1,2,3]});strong.parents[0].sparks.push({id:30,stars:3});
 const result=run([veteran(1),strong]);assert.equal(result.rows.find(r=>r.id==='1').verdict,'transfer');assert.equal(result.rows.find(r=>r.id==='2').verdict,'keep');
 for(const e of result.rows[0].evidence)assert.ok(e.retainedValue>=e.value);
});
test('different star combinations require collective mode and show multiple witnesses',()=>{
 const rows=[veteran(1,{sparks:[{id:30,stars:3},{id:40,stars:1}]}),veteran(2,{sparks:[{id:30,stars:1},{id:40,stars:3}]}),veteran(3,{sparks:[{id:30,stars:2},{id:40,stars:2}]})];
 assert.equal(run(rows).counts.transfer,0);const result=run(rows,{mode:'portfolio'}),r=result.rows.find(r=>r.id==='3');
 assert.equal(r.verdict,'transfer');assert.equal(r.collective,true);assert.deepEqual(new Set(r.replacements),new Set(['1','2']));
});
test('minimum copies and optional racing preservation affect removals',()=>{
 assert.equal(run([veteran(1),veteran(2),veteran(3)],{minimum:2}).counts.transfer,1);
 const rows=[veteran(1,{stats:{speed:1000},skills:[{id:2,level:1}]}),veteran(2,{stats:{speed:500},skills:[{id:1,level:1}]})];
 assert.equal(run(rows).counts.transfer,1);assert.equal(run(rows,{racing:true}).counts.transfer,0);
});
test('saved-plan references ignore remote parents and preserve local IDs',()=>{
 assert.deepEqual(planProtection([{nodes:[{sourceId:'1'},{sourceId:'2',remote:true}]},{nodes:[{sourceId:'1'},{sourceId:'3'}]}]),['1','3']);
});
test('import retains lock and saved flags without interpreting zero as true',()=>{
 const catalog=new Map([[10,{}]]),raw={trained_chara_id:1,card_id:100101,factor_info_array:[{factor_id:103}],is_locked:0,is_saved:1};
 assert.equal(normalizeImport([raw],'x',catalog).data[0].locked,false);assert.equal(normalizeImport([raw],'x',catalog).data[0].saved,true);
 for(const value of [1,'1',true])assert.equal(normalizeImport([{...raw,is_locked:value}],'x',catalog).data[0].locked,true);
 assert.equal(normalizeImport([{...raw,is_locked:undefined}],'x',catalog).data[0].locked,null);
});
test('real string-ID catalog works and recommendations always refer to retained copies',()=>{
 const real=JSON.parse(readFileSync(new URL('../data/factors.json',import.meta.url)));
 const result=optimizeTransfers([veteran(1),veteran(2)],real);assert.equal(result.counts.transfer,1);
 const retained=new Set(result.rows.filter(r=>r.verdict!=='transfer').map(r=>r.id));
 for(const r of result.rows)for(const id of r.replacements)assert.ok(retained.has(id));
});
test('settings constrain restored data and normalize protection IDs',()=>{
 assert.deepEqual(transferSettings({mode:'x',minimum:99,racing:'false',protectedIds:['1','1',1]}),{mode:'individual',minimum:10,racing:false,protectedIds:['1']});
});

test('UI discards late worker results and blocks export after workspace changes',async()=>{
 const {createTransferUI}=await import('../transfer-ui.js');
 const previous=globalThis.Worker,workers=[];let exports=0;
 globalThis.Worker=class {constructor(){workers.push(this);}postMessage(data){this.input=data;}terminate(){this.terminated=true;}};
 try{
  const state={collections:{veterans:[veteran(1),veteran(2)]},plan:{nodes:[]},saved:[],imports:{}};
  const ui=createTransferUI({getState:()=>state,data:{factors,skills:[]},esc:String,title:String,portrait:()=>'',sparks:()=>'',inspect:()=>{},save:()=>{},download:()=>exports++,refresh:()=>{}});
  const click=attr=>ui.handle({type:'click',target:{closest:()=>({hasAttribute:a=>a===attr,dataset:{}})}});
  click('data-transfer-run');const first=workers[0];ui.invalidate();assert.equal(first.terminated,true);
  first.onmessage({data:{type:'result',result:run(state.collections.veterans)}});assert.doesNotMatch(ui.render(),/Analysis complete/);
  click('data-transfer-run');workers[1].onmessage({data:{type:'result',result:run(state.collections.veterans)}});
  click('data-transfer-export');assert.equal(exports,1);
  ui.invalidate();click('data-transfer-export');assert.equal(exports,1);assert.match(ui.render(),/Results are outdated/);
 }finally{globalThis.Worker=previous;}
});

test('is_saved is metadata, not protection: an all-saved roster can be optimized',()=>{
 const result=run([veteran(1,{saved:true}),veteran(2,{saved:true}),veteran(3,{saved:true,locked:true})]);
 assert.equal(result.counts.protected,1);assert.equal(result.counts.transfer,2);
 assert.deepEqual(result.rows.find(r=>r.id==='3').reasons,['Locked in game']);
});
