import {decodeSpark,stats,aptitudes} from './core.js';
export const moeOrigin='https://uma.moe';
export function remoteSearchURL({trainerId='',wanted=[],factors,page=0}){
 const url=new URL('/api/v3/search',moeOrigin);
 const query={search_type:'inheritance',limit:'20',page:String(Math.max(0,Math.floor(page))),sort_by:'last_updated',sort_order:'desc'};
 if(trainerId){if(!/^\d{1,20}$/.test(trainerId))throw Error('Enter the numeric trainer ID, without spaces.');query.trainer_id=trainerId;}
 // The API's optional-white score is a soft rank among records matching at least one skill.
 const white=wanted.filter(id=>factors.get(Number(id))?.type===3);
 if(white.length&&!trainerId)query.optional_white_sparks=white.join(',');
 url.search=new URLSearchParams(query);return url.href;
}
export async function moeGet(url,key,{signal,fetcher=fetch}={}){
 const parsed=new URL(url);
 if(parsed.origin!==moeOrigin||!parsed.pathname.startsWith('/api/'))throw Error('Invalid uma.moe API URL.');
 if(!key.trim())throw Error('Enter your uma.moe API key. It is kept only in this tab’s memory.');
 let response;
 try{response=await fetcher(url,{headers:{'X-API-Key':key.trim(),Accept:'application/json'},credentials:'omit',redirect:'error',signal});}
 catch(e){if(e.name==='AbortError')throw e;throw Error('Could not reach uma.moe. Check your connection; the API may be unavailable or blocking cross-site requests.');}
 if(!response.ok)throw Error(response.status===401||response.status===403?'uma.moe rejected the API key or access to this profile.':response.status===429?'uma.moe rate limit reached. Wait before trying again.':`uma.moe request failed (${response.status}).`);
 return response.json();
}
export function normalizeRemoteProfile(profile,catalog,{now=new Date().toISOString()}={}){
 const r=profile?.inheritance,t=profile?.trainer;
 if(!r||!t||!/^\d{1,20}$/.test(String(t.account_id)))throw Error('This trainer has no public borrowable parent.');
 const positive=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
 const node=(prefix,cardId,position)=>{
  if(!positive(cardId))throw Error('Remote lineage is missing a parent character.');
  const fields=[`${prefix}_blue_factors`,`${prefix}_pink_factors`,`${prefix}_green_factors`,`${prefix}_white_factors`];
  if(fields.some(k=>!Object.hasOwn(r,k)))throw Error('Incomplete remote lineage: load the trainer profile, not a search summary.');
  const encoded=fields.flatMap(k=>Array.isArray(r[k])?r[k]:[r[k]]).filter(x=>Number(x)>0);
  const sparks=encoded.map(x=>decodeSpark(Number(x),catalog));
  if(new Set(sparks.map(x=>x.id)).size!==sparks.length)throw Error('Remote lineage has duplicate sparks.');
  const rawWins=r[`${prefix}_win_saddles`];
  const wins=Array.isArray(rawWins)?rawWins.map(Number):[];
  if(wins.some(x=>!positive(x)))throw Error('Invalid remote race data.');
  return {cardId:Number(cardId),sparks,wins,winsKnown:Array.isArray(rawWins),...(position?{position}:{})};
 };
 if(!positive(r.inheritance_id))throw Error('Invalid remote inheritance ID.');
 return {id:`moe:${t.account_id}:${r.inheritance_id}`,...node('main',r.main_parent_id),parents:[node('left',r.parent_left_id,10),node('right',r.parent_right_id,20)],remote:true,trainerId:String(t.account_id),trainerName:String(t.name??'Trainer').slice(0,100),fetchedAt:now,followerCount:Number(t.follower_num)||0,stats:Object.fromEntries(stats.map(s=>[s,0])),aptitudes:Object.fromEntries(aptitudes.map(([s])=>[s,0])),skills:[],rating:0,rarity:Number(r.parent_rarity)||0,scenario:null,memo:'uma.moe public borrowing snapshot; stats and aptitudes unavailable.',date:now};
}
export function legalBorrowPair(a,b){return !(a.remote&&b.remote);}
export function validateRemotePool(pool=[]){
 if(!Array.isArray(pool)||pool.length>100)throw Error('Invalid remote-parent pool.');
 for(const v of pool){
  if(!v?.remote||!/^\d{1,20}$/.test(v.trainerId)||typeof v.id!=='string'||!v.id.startsWith(`moe:${v.trainerId}:`)||!Array.isArray(v.parents)||v.parents.length!==2)throw Error('Invalid remote-parent snapshot.');
  if(![10,20].every(position=>v.parents.some(p=>p.position===position)))throw Error('Invalid remote ancestor positions.');
  for(const n of [v,...v.parents])if(!Number.isSafeInteger(n.cardId)||n.cardId<=0||!Array.isArray(n.sparks)||!Array.isArray(n.wins)||n.wins.some(id=>!Number.isSafeInteger(id)||id<=0)||n.sparks.some(f=>!Number.isSafeInteger(f.id)||f.id<=0||![1,2,3].includes(f.stars)))throw Error('Invalid remote lineage data.');
 }
 return pool;
}
