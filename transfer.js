// Original roster-coverage implementation; see docs/transfer-optimizer.md.
export const transferVerdicts={protected:'Protected',keep:'Keep',transfer:'Transfer candidate',review:'Review'};
export function transferSettings(input={}) {
 return {mode:input?.mode==='portfolio'?'portfolio':'individual',minimum:Math.max(1,Math.min(10,Math.floor(Number(input?.minimum)||1))),racing:input?.racing===true,protectedIds:[...new Set((Array.isArray(input?.protectedIds)?input.protectedIds:[]).filter(x=>typeof x==='string'))]};
}
export function planProtection(plans=[]) {
 return [...new Set(plans.flatMap(p=>(p?.nodes??[]).filter(n=>!n.remote&&n.sourceId).map(n=>String(n.sourceId))))];
}
function unique(v,catalog){return (v.sparks??[]).filter(s=>catalog.get(s.id)?.type===5).map(s=>s.id).sort((a,b)=>a-b).join(',');}
function profile(v,catalog,racing) {
 const features=new Map();
 const add=(key,value)=>features.set(key,Math.max(features.get(key)??0,value));
 const parents=[...(v.parents??[])].sort((a,b)=>a.cardId-b.cardId||a.position-b.position);
 const nodes=[v,...parents];
 const issues=[];
 if(typeof v.locked!=='boolean')issues.push('Lock status unavailable; reimport your veteran JSON.');
 if(parents.length!==2||parents.some(p=>!p.cardId)||new Set(parents.map(p=>p.position)).size!==2)issues.push('Incomplete recorded ancestry.');
 if(nodes.some(n=>n.winsKnown!==true))issues.push('Race history is incomplete.');
 if(nodes.some(n=>!Array.isArray(n.sparks)||!n.sparks.length))issues.push('Spark data is incomplete.');
 if(nodes.some(n=>(n.sparks??[]).some(s=>!catalog.has(s.id))))issues.push('Unknown spark IDs need review.');
 nodes.forEach((n,index)=>{
  const slot=index===0?'self':`ancestor${index}:${n.cardId}`;
  for(const s of n.sparks??[])add(`${slot}|spark|${s.id}`,s.stars);
  for(const id of n.wins??[])add(`${slot}|race|${id}`,1);
 });
 if(racing){
  if(!v.stats||!v.aptitudes||!Array.isArray(v.skills))issues.push('Racing data is incomplete.');
  for(const [key,n] of Object.entries(v.stats??{}))add(`racing|stat|${key}`,Number(n)||0);
  for(const [key,n] of Object.entries(v.aptitudes??{}))add(`racing|aptitude|${key}`,Number(n)||0);
  for(const s of v.skills??[])add(`racing|skill|${s.id}`,Number(s.level)||1);
  add('racing|rating|rating',Number(v.rating)||0);
 }
 // Different ancestor identities are not treated as interchangeable: they affect
 // compatibility, character restrictions and the usefulness of a whole branch.
 const group=JSON.stringify([v.cardId,unique(v,catalog),parents.map(p=>p.cardId)]);
 return {id:String(v.id),v,group,features,issues};
}
const covers=(a,b)=>[...b].every(([key,n])=>(a.get(key)??0)>=n);
function union(rows){const out=new Map();for(const r of rows)for(const [key,n] of r.features)out.set(key,Math.max(out.get(key)??0,n));return out;}
function compare(a,b){return Number(b.protected)-Number(a.protected)||b.features.size-a.features.size||Number(b.v.rating||0)-Number(a.v.rating||0)||a.id.localeCompare(b.id,undefined,{numeric:true});}
export function optimizeTransfers(veterans,factors,options={},planIds=[],progress=()=>{}) {
 const settings=transferSettings(options),manual=new Set(settings.protectedIds),used=new Set(planIds.map(String)),catalog=new Map(factors.map(f=>[Number(f.id),f]));
 const groups=new Map(),rows=[];
 for(const v of veterans){
  if(v.remote)continue;
  const r=profile(v,catalog,settings.racing);
  r.reasons=[];
  if(v.locked===true)r.reasons.push('Locked in game');
  if(String(v.memo??'').trim())r.reasons.push('Has a memo');
  if(used.has(r.id))r.reasons.push('Used in the current or a saved plan');
  if(manual.has(r.id))r.reasons.push('Manually protected');
  r.protected=r.reasons.length>0;r.retained=true;
  r.verdict=r.protected?'protected':r.issues.length?'review':'keep';
  if(!groups.has(r.group))groups.set(r.group,[]);groups.get(r.group).push(r);rows.push(r);
 }
 let done=0;
 for(const group of groups.values()){
  group.sort(compare);
  // Remove the least preferred copy first. Only retained, complete records may
  // cover a removal, so cyclic replacements and transfer-to-transfer chains
  // cannot occur. No result claims a globally minimum set cover.
  for(const candidate of [...group].reverse()){
   if(candidate.protected||candidate.issues.length)continue;
   const retained=group.filter(r=>r.retained);
   if(retained.length<=settings.minimum)continue;
   const alternatives=retained.filter(r=>r!==candidate&&!r.issues.length);
   const replacement=alternatives.find(r=>covers(r.features,candidate.features));
   if(replacement||(settings.mode==='portfolio'&&alternatives.length&&covers(union(alternatives),candidate.features))){candidate.retained=false;candidate.verdict='transfer';}
  }
  for(const r of group){
   r.replacements=[];r.evidence=[];r.collective=false;
   if(r.verdict==='transfer'){
    const alternatives=group.filter(a=>a.retained&&!a.issues.length),single=alternatives.find(a=>covers(a.features,r.features));
    const selected=single?[single]:alternatives;r.collective=!single;
    const ids=new Set();
    for(const [feature,value] of r.features){const best=selected.reduce((a,b)=>(b.features.get(feature)??0)>(a?.features.get(feature)??-1)?b:a,null);ids.add(best.id);r.evidence.push({feature,value,retainedValue:best.features.get(feature),replacement:best.id});}
    r.replacements=[...ids];
    r.reasons.push(single?'One retained copy matches or exceeds every checked value.':'Retained copies collectively cover the checked values; no single complete replacement.');
   }else if(r.verdict==='review')r.reasons.push(...r.issues);
   else if(r.verdict==='keep')r.reasons.push(group.filter(a=>a.retained).length<=settings.minimum?'Retained minimum for this outfit / Unique / ancestry group.':'Preserves a spark, race, combination or racing value not covered by retained copies.');
  }
  progress(++done,groups.size);
 }
 return {version:1,settings,total:rows.length,groups:groups.size,rows:rows.map(r=>({id:r.id,cardId:r.v.cardId,verdict:r.verdict,reasons:r.reasons,issues:r.issues,replacements:r.replacements,evidence:r.evidence,collective:r.collective,featureCount:r.features.size})),counts:Object.fromEntries(Object.keys(transferVerdicts).map(k=>[k,rows.filter(r=>r.verdict===k).length]))};
}
