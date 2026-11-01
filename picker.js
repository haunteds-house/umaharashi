import {aptitudes,grades} from './core.js';
// Shared picker behavior: catalog grades for planned characters, trained grades for veterans.
export function filterPickerRows(source,filters,characters,owned,affinity){
 const catalog=new Map(characters.map(c=>[c.cardId,c])),ownedIds=new Set(owned.map(c=>c.cardId));
 const q=filters.query.trim().toLowerCase(),apt=aptitudes.find(a=>a[0]===filters.aptitude),veteran=filters.kind==='veterans';
 const rows=source.filter(v=>{const c=catalog.get(v.cardId);if(q&&!`${c?.charaName??''} ${c?.cardTitle??''} ${v.cardId} ${v.id??''}`.toLowerCase().includes(q))return false;
 if(!veteran&&filters.owned&&!ownedIds.has(v.cardId))return false;
 if(apt){const grade=veteran?(v.aptitudes?.[apt[0]]??0):grades.indexOf(c?.[apt[2]]);if(grade<Number(filters.grade))return false;}return true;
 }).map(v=>({v,aff:affinity(v)})).filter(r=>!filters.valid||!r.aff.invalid);
 const name=r=>`${catalog.get(r.v.cardId)?.charaName??''} ${catalog.get(r.v.cardId)?.cardTitle??''}`;
 const value=r=>{switch(filters.sort){case 'id':return r.v.cardId;case 'rating':return r.v.rating??0;case 'stars':return (r.v.sparks??[]).reduce((n,s)=>n+s.stars,0);default:return filters.sort.startsWith('growth:')?catalog.get(r.v.cardId)?.['talent'+filters.sort.split(':')[1]]??0:r.aff.value;}};
 return rows.sort((a,b)=>(filters.sort==='name'?0:value(b)-value(a))||name(a).localeCompare(name(b))||String(a.v.id??a.v.cardId).localeCompare(String(b.v.id??b.v.cardId)));
}
