import test from 'node:test';
import assert from 'node:assert/strict';
import {filterPickerRows} from '../picker.js';
const chars=[{cardId:1,charaName:'Alpha',cardTitle:'First',aptitudeTurf:'A',talentSpeed:10},{cardId:2,charaName:'Beta',cardTitle:'Second',aptitudeTurf:'B',talentSpeed:20}];
const defaults={query:'',owned:false,valid:false,aptitude:'',grade:7,sort:'affinity',kind:'characters'};
const aff=v=>({value:v.cardId,invalid:v.cardId===2});
test('character filters combine ownership, aptitude and text without changing source',()=>{const run=f=>filterPickerRows(chars,{...defaults,...f},chars,[{cardId:1}],aff).map(r=>r.v.cardId);assert.deepEqual(run({owned:true}),[1]);assert.deepEqual(run({aptitude:'Turf'}),[1]);assert.deepEqual(run({query:'SECOND'}),[2]);assert.deepEqual(run({valid:true}),[1]);assert.deepEqual(run({sort:'growth:Speed'}),[2,1]);assert.deepEqual(run({sort:'name'}),[1,2]);assert.equal(chars[0].cardId,1);});
test('veterans use trained aptitudes and expose rating and spark sorting',()=>{const veterans=[{cardId:1,id:'a',rating:100,aptitudes:{Turf:6},sparks:[{stars:3}]},{cardId:2,id:'b',rating:200,aptitudes:{Turf:8},sparks:[{stars:1}]}];const run=f=>filterPickerRows(veterans,{...defaults,kind:'veterans',...f},chars,[],aff).map(r=>r.v.id);assert.deepEqual(run({aptitude:'Turf'}),['b']);assert.deepEqual(run({sort:'rating'}),['b','a']);assert.deepEqual(run({sort:'stars'}),['a','b']);});
