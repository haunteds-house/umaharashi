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
