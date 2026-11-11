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
