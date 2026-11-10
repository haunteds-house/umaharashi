import {transferSettings,transferVerdicts,planProtection} from './transfer.js';
export function createTransferUI({getState,data,esc,title,portrait,sparks,inspect,save,download,refresh}) {
 let result=null,stale=false,worker=null,message='',page=0,query='',filter='all';
 const settings=()=>transferSettings(getState().transfer);
 const button=(text,attr,disabled=false)=>`<button ${attr} ${disabled?'disabled':''}>${text}</button>`;
 function invalidate(){if(result)stale=true;if(worker){worker.terminate();worker=null;message='Analysis cancelled because the workspace changed.';}}
 function render(){
  const state=getState(),config=settings(),count=state.collections.veterans.length;
  const unknown=state.collections.veterans.filter(v=>typeof v.locked!=='boolean').length;
  const rows=(result?.rows??[]).filter(r=>(filter==='all'||r.verdict===filter)&&`${title(r.cardId)} ${r.id}`.toLowerCase().includes(query.toLowerCase()));
  const pages=Math.max(1,Math.ceil(rows.length/30));page=Math.min(page,pages-1);
  return `<div class="page-heading"><div><div class="eyebrow">COLLECTION / TRANSFER REVIEW</div><h1>Transfer optimizer</h1><p>Find redundant veterans while preserving your inheritance options.</p></div></div>
  <section class="panel"><div class="toolbar">
   <label>Coverage mode<select data-transfer-setting="mode"><option value="individual" ${config.mode==='individual'?'selected':''}>Individual replacement</option><option value="portfolio" ${config.mode==='portfolio'?'selected':''}>Collective portfolio</option></select></label>
   <label>Minimum copies per group<select data-transfer-setting="minimum">${Array.from({length:10},(_,i)=>`<option ${config.minimum===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label>
   <label class="transfer-check"><input type="checkbox" data-transfer-setting="racing" ${config.racing?'checked':''}> Preserve racing stats, aptitudes and learned skills</label>
  </div><div class="actions">${button(worker?'Analyzing…':'Analyze collection','class="primary" data-transfer-run',!count||!!worker)}${worker?button('Cancel','data-transfer-cancel'):''}${button('Export review','data-transfer-export',!result||stale||!!worker)}${button('Import veterans','data-action="import"')}</div>
  <p class="tiny" role="status" id="transfer-status">${esc(message||`${count} imported veterans ready to review.`)}</p>
  ${unknown?`<div class="notice warning">${unknown} veterans have no recorded lock status. Reimport trained_chara_data.json to include in-game locks; these records remain protected from recommendations until then.</div>`:''}
  <details><summary>What the optimizer checks</summary><p>Copies are compared within the same outfit, direct Unique spark identity and two ancestor identities. Every recorded spark must retain at least its star level, and every recorded race win must remain covered, separately for the veteran and each ancestor. This preserves direct grandparent material as well as recorded parent branches.</p><p>Individual mode requires one retained replacement. Collective mode allows different retained copies to cover different values, so it can lose a useful combination on a single veteran. The retained collection is reduced greedily, not guaranteed to be the smallest possible collection.</p><p>In-game locks, saved flags, memos, manual protections and references in your current or saved plans are always retained. Records with missing ancestry, race history, lock status or unknown sparks need review. Old ancestry exports may lack local veteran IDs, so references to those ancestors cannot always be detected.</p><p>This is an independent adaptation of <a href="https://github.com/Rom1foucher/UmaLegacyLinker#transfer-helper-work-in-progress" target="_blank" rel="noreferrer">Uma Legacy Linker’s Transfer Helper</a>. It uses recorded asset coverage, not that tool’s contextual race scoring or exhaustive dominance model. It does not label transfers “strictly safe.” Racing performance is outside the default inheritance analysis.</p><p>Review the retained replacements before transferring in game. This tab never transfers veterans or removes records from your imported collection.</p></details></section>
  ${stale?'<div class="notice warning">Results are outdated. Analyze the collection again before using or exporting recommendations.</div>':''}
  ${result?`<div class="transfer-metrics">${Object.entries(transferVerdicts).map(([key,label])=>`<div class="metric"><span>${label}</span><strong>${result.counts[key]}</strong></div>`).join('')}</div>
  <section class="panel"><div class="toolbar"><label class="grow">Search<input id="transfer-query" value="${esc(query)}" placeholder="Character, outfit or veteran ID…"></label><label>Verdict<select id="transfer-filter"><option value="all">All verdicts</option>${Object.entries(transferVerdicts).map(([key,label])=>`<option value="${key}" ${filter===key?'selected':''}>${label}</option>`).join('')}</select></label></div>
  <p class="tiny">${rows.length} matching veterans · ${result.groups} comparison groups. Recommendations refer only to retained copies.</p>
  <div class="table-wrap"><table><thead><tr><th>Veteran</th><th>Verdict & reason</th><th>Retained replacements</th><th>Review</th></tr></thead><tbody>${rows.slice(page*30,page*30+30).map(r=>{const v=state.collections.veterans.find(v=>v.id===r.id);return `<tr><td><div class="roster-name">${portrait(r.cardId)}<div><b>${esc(title(r.cardId))}</b><span class="row-sub">#${esc(r.id)} · Rating ${Number(v?.rating||0).toLocaleString()}</span></div></div>${sparks(v?.sparks??[],4)}</td><td><b>${transferVerdicts[r.verdict]}</b><p class="tiny">${r.reasons.map(esc).join('<br>')}</p></td><td>${r.replacements.map(id=>button('#'+esc(id),`class="small" data-transfer-inspect="${esc(id)}"`)).join(' ')||'—'}${r.collective?'<p class="tiny">Collective coverage only</p>':''}</td><td><div class="transfer-actions">${button('Inspect',`class="small" data-transfer-inspect="${esc(r.id)}"`)}${r.evidence.length?button('Compare evidence',`class="small" data-transfer-evidence="${esc(r.id)}"`):''}${button(config.protectedIds.includes(r.id)?'Remove manual protection':'Protect',`class="small" data-transfer-protect="${esc(r.id)}" aria-pressed="${config.protectedIds.includes(r.id)}"`)}</div></td></tr>`;}).join('')||'<tr><td colspan="4">No veterans match these filters.</td></tr>'}</tbody></table></div>
  <div class="pagination">${button('← Previous','data-transfer-page="-1"',page===0)}<span>${page+1} / ${pages}</span>${button('Next →','data-transfer-page="1"',page>=pages-1)}</div></section>`:!count?'<div class="panel empty"><h2>Import your veterans to begin</h2><p>The optimizer uses the same collection as the lineage planner.</p><button data-action="import">Import collection</button></div>':''}`;
 }
 function run(){
  invalidate();message='Comparing same-outfit copies…';
  const current=new Worker(new URL('./transfer-worker.js',import.meta.url),{type:'module'});worker=current;refresh();
  current.onmessage=({data:response})=>{if(worker!==current)return;
   if(response.type==='progress'){message=`Compared ${response.done} / ${response.total} groups…`;const el=document.querySelector('#transfer-status');if(el)el.textContent=message;return;}
   current.terminate();worker=null;
   if(response.type==='result'){result=response.result;stale=false;page=0;message=`Analysis complete: ${result.counts.transfer} transfer candidates from ${result.total} veterans.`;}else message='Analysis failed: '+response.message;
   refresh();
  };
  current.onerror=()=>{if(worker!==current)return;current.terminate();worker=null;message='Analysis failed. Try again or reimport your veteran JSON.';refresh();};
  const state=getState();current.postMessage({veterans:state.collections.veterans,factors:data.factors,settings:settings(),planIds:planProtection([state.plan,...state.saved])});
 }
 function evidence(id){
  const row=result?.rows.find(r=>r.id===id);if(!row)return;
  const label=key=>{const [slot,kind,value]=key.split('|');let name=value;if(kind==='spark')name=data.factors.find(f=>String(f.id)===value)?.text??value;if(kind==='skill')name=data.skills.find(s=>String(s.skillId)===value)?.skillName??value;return `${slot==='self'?'Veteran':slot==='racing'?'Racing':`Ancestor ${slot.split(':')[0].replace('ancestor','')}`} · ${kind} · ${name}`;};
  const modal=document.querySelector('#modal');document.querySelector('#modal-body').innerHTML=`<div class="modal-top"><h2>Replacement evidence · #${esc(id)}</h2><button data-action="close-modal">Close</button></div>${stale?'<p class="notice warning">Outdated results. Run the optimizer again.</p>':''}<p>${row.collective?'Different retained copies cover different values. This does not preserve every combination on one veteran.':'One retained copy matches or exceeds every checked value.'}</p><div class="table-wrap"><table><thead><tr><th>Checked value</th><th>Candidate</th><th>Retained</th><th>Difference</th><th>Replacement</th></tr></thead><tbody>${row.evidence.map(e=>`<tr><td>${esc(label(e.feature))}</td><td>${e.value}</td><td>${e.retainedValue}</td><td>+${e.retainedValue-e.value}</td><td>#${esc(e.replacement)}</td></tr>`).join('')}</tbody></table></div>`;modal.showModal();
 }
 function handle(event){
  const el=event.target.closest('[data-transfer-run],[data-transfer-cancel],[data-transfer-export],[data-transfer-protect],[data-transfer-inspect],[data-transfer-evidence],[data-transfer-page],[data-transfer-setting],#transfer-query,#transfer-filter');if(!el)return false;
  if(event.type==='click'){
   if(el.hasAttribute('data-transfer-run'))run();
   else if(el.hasAttribute('data-transfer-cancel')){invalidate();message='Analysis cancelled.';refresh();}
   else if(el.hasAttribute('data-transfer-export')&&result&&!stale&&!worker)download('umaharashi-transfer-review.json',{format:'umaharashi-transfer-review',generatedAt:new Date().toISOString(),importedAt:getState().imports.veterans?.importedAt,...result});
   else if(el.hasAttribute('data-transfer-protect')){const c=settings(),id=el.dataset.transferProtect;c.protectedIds=c.protectedIds.includes(id)?c.protectedIds.filter(x=>x!==id):[...c.protectedIds,id];getState().transfer=c;save();invalidate();refresh();}
   else if(el.hasAttribute('data-transfer-inspect'))inspect(el.dataset.transferInspect);
   else if(el.hasAttribute('data-transfer-evidence'))evidence(el.dataset.transferEvidence);
   else if(el.hasAttribute('data-transfer-page')){page+=Number(el.dataset.transferPage);refresh();}
  }else if(event.type==='change'&&el.hasAttribute('data-transfer-setting')){const c=settings();c[el.dataset.transferSetting]=el.type==='checkbox'?el.checked:el.value;getState().transfer=transferSettings(c);save();invalidate();refresh();}
  else if(event.type==='change'&&el.id==='transfer-filter'){filter=el.value;page=0;refresh();}
  else if(event.type==='input'&&el.id==='transfer-query'){query=el.value;page=0;refresh();}
  return true;
 }
 return {render,handle,invalidate};
}
