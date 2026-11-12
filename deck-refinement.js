// Keep ownership boundaries while exploring replacements. A borrowed copy of a
// character can block its owned version, so both slots must sometimes change
// together; an illegal intermediate deck must not hide that alternative.
export function* deckReplacements(current,owned,borrowed,conflicts){
 for(let slot=0;slot<6;slot++)for(const c of slot===5?borrowed:owned){
  if(c.id===current[slot].id)continue;
  yield current.map((x,i)=>i===slot?c:x);
 }
 const borrowedCard=current[5];
 const ownedVersions=owned.filter(c=>conflicts(c,borrowedCard));
 if(!ownedVersions.length)return;
 for(let slot=0;slot<5;slot++)for(const replacement of ownedVersions)for(const borrow of borrowed){
  if(borrow.id===borrowedCard.id)continue;
  yield current.map((x,i)=>i===slot?replacement:i===5?borrow:x);
 }
}
export const preservesSourceTiers=(trial,current)=>current.every((tier,i)=>(trial[i]??0)>=tier);

// Consolidate two complementary source cards into one, then fill the freed slot.
// Score the finished deck: the consolidating card alone may train worse than
// either incumbent, so greedy single swaps cannot discover this improvement.
export function* sourceConsolidations(current,owned,borrowed,conflicts,targetTiers=[]){
 const tiers=cards=>targetTiers.map((t,i)=>Math.max(t,...cards.map(c=>c.sources?.[i]?.tier??0)));
 const required=tiers(current);
 for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){
  const rest=current.filter((_,i)=>i!==a&&i!==b),remaining=tiers(rest);
  const lost=required.map((t,i)=>t>remaining[i]?i:-1).filter(i=>i>=0);
  // Both removed cards must contribute a different source. Redundant cards
  // already have a legal single-slot replacement.
  if(lost.length<2||![a,b].every(slot=>lost.some(i=>(current[slot].sources?.[i]?.tier??0)===required[i]&&(current[slot===a?b:a].sources?.[i]?.tier??0)<required[i])))continue;
  for(const [sourceSlot,freeSlot] of [[a,b],[b,a]])for(const source of sourceSlot===5?borrowed:owned){
   if(rest.some(c=>conflicts(c,source))||!lost.every(i=>(source.sources?.[i]?.tier??0)>=required[i]))continue;
   for(const replacement of freeSlot===5?borrowed:owned){
    if(conflicts(source,replacement)||rest.some(c=>conflicts(c,replacement)))continue;
    yield current.map((c,i)=>i===sourceSlot?source:i===freeSlot?replacement:c);
   }
  }
 }
}
