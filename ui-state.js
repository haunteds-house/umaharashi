// Pure UI transitions shared by controls and regression tests.
export function updateMatchSort(plan,key,value){
 if(key==='sort'){plan.matchSort=value;plan.matchDirection=value==='expectedRuns'?'asc':'desc';}
 else plan.matchDirection=value==='asc'?'asc':'desc';
}
export function updateLearning(plan,id,key,value){
 plan.bought??={};const b=plan.bought[id]??={tier:'white',inspirationOnly:false};
 if(key==='inspirationOnly')b.inspirationOnly=!!value; // Preserve the selected tier for when it is switched off.
 else if(value==='auto')b.manualTier=false;
 else {b.tier=['white','upgraded','gold'].includes(value)?value:'white';b.manualTier=true;}
 return b;
}
export function skillTier(s){return s?.rarity===2?'gold':/◎$/.test(s?.skillName??'')?'upgraded':'white';}
export function factorForSkill(links,skillId,wanted=[]){
 const ids=Object.entries(links.factorSkills??{}).filter(([,skills])=>skills.includes(Number(skillId))).map(([id])=>Number(id));
 return wanted.find(id=>ids.includes(id))??ids[0]??null;
}
export function createSearchGate(){let current=null;return {
 start(value){current=value;},isCurrent(value){return current===value;},
 cancel(){current?.terminate();current=null;},finish(value){if(current!==value)return false;value.terminate();current=null;return true;}
};}
// Restore focus and expansion without overwriting newly calculated form values.
export function captureView(root){
 const all=[...root.querySelectorAll('details')];const detailKey=(el,i)=>el.id||`${i}:${el.querySelector(':scope > summary')?.textContent.trim()}`;
 const open=new Map(all.map((el,i)=>[detailKey(el,i),el.open]));
 const active=document.activeElement;let selector=null;
 if(root.contains(active)){if(active.id)selector='#'+CSS.escape(active.id);else {const attr=[...active.attributes].find(a=>a.name.startsWith('data-'));if(attr)selector=`[${attr.name}="${CSS.escape(attr.value)}"]`;}}
 const selection=active?.tagName==='INPUT'&&['text','search'].includes(active.type)?[active.selectionStart,active.selectionEnd]:null;
 const drafts=new Map(['wanted-search','farming-name','plan-name'].map(id=>[id,root.querySelector('#'+id)?.value]).filter(([,v])=>v!==undefined));
 return ()=>{[...root.querySelectorAll('details')].forEach((el,i)=>{const v=open.get(detailKey(el,i));if(v!==undefined)el.open=v;});for(const [id,value] of drafts){const el=root.querySelector('#'+id);if(el)el.value=value;}const next=selector?root.querySelector(selector):null;if(next&&!next.disabled){next.focus({preventScroll:true});if(selection)next.setSelectionRange(...selection);}};
}
