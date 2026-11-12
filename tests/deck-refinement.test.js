import test from 'node:test';
import assert from 'node:assert/strict';
import {deckReplacements,preservesSourceTiers} from '../deck-refinement.js';
const conflicts=(a,b)=>a.charaId===b.charaId;
const c=(id,charaId,borrowed=false)=>({id,charaId,borrowed});
test('ownership exchange reaches a deck that no legal single-slot swap can reach',()=>{
 const owned=[c(1,1),c(2,2),c(3,3),c(4,4),c(5,5),c(6,6)];
 const current=[...owned.slice(0,5),c(6,6,true)],borrowed=[c(6,6,true),c(7,7,true)];
 // Owned #6 is initially blocked by borrowed #6. Replacing only the borrow
 // loses its requested source; replacing only the owned slot is illegal.
 const alternatives=[...deckReplacements(current,owned,borrowed,conflicts)];
 const desired=alternatives.find(cs=>cs[0].id===6&&cs[5].id===7);
 assert.ok(desired);assert.equal(desired.filter(x=>x.borrowed).length,1);
 assert.equal(new Set(desired.map(x=>x.charaId)).size,6);
 assert.deepEqual(current.map(x=>x.id),[1,2,3,4,5,6]);
});
test('refinement accepts new skill sources without trading away another source',()=>{
 assert.equal(preservesSourceTiers([3,1,1],[1,1,0]),true);
 assert.equal(preservesSourceTiers([3,0,3],[1,1,0]),false);
});

test('multi-skill consolidation frees an owned slot without an improving intermediate swap',async()=>{
 const {sourceConsolidations}=await import('../deck-refinement.js');
 const card=(id,tiers,borrowed=false)=>({...c(id,id,borrowed),sources:tiers.map(tier=>tier?{tier}:null)});
 const current=[card(1,[1,0]),card(2,[0,3]),card(3,[]),card(4,[]),card(5,[]),card(6,[],true)];
 const consolidated=card(7,[1,3]),trainer=card(8,[]);
 const rows=[...sourceConsolidations(current,[...current.slice(0,5),consolidated,trainer],[current[5]],conflicts,[0,0])];
 assert.ok(rows.some(cs=>cs[0].id===7&&cs[1].id===8));
 for(const cs of rows){assert.equal(cs.filter(c=>c.borrowed).length,1);assert.equal(new Set(cs.map(c=>c.charaId)).size,6);}
 // A white-only substitute must not erase the incumbent gold source.
 assert.equal([...sourceConsolidations(current,[...current.slice(0,5),card(7,[1,1]),trainer],[current[5]],conflicts,[0,0])].length,0);
 // Trainee-provided coverage does not need another consolidation.
 assert.equal([...sourceConsolidations(current,[consolidated,trainer],[current[5]],conflicts,[1,3])].length,0);
});
