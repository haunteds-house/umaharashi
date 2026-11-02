const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const info=(label,text)=>`<button type="button" class="info-bubble" data-help="${escape(text)}" aria-label="About ${escape(label)}" aria-expanded="false">i</button>`;
export function installHelp(){
 const box=document.createElement('div');box.id='info-tooltip';box.className='info-tooltip';box.setAttribute('role','tooltip');box.hidden=true;document.body.append(box);
 let active=null,timer;
 const close=()=>{clearTimeout(timer);if(active){active.setAttribute('aria-expanded','false');active.removeAttribute('aria-describedby');}active=null;box.hidden=true;};
 const show=b=>{clearTimeout(timer);if(active!==b)close();active=b;box.textContent=b.dataset.help;box.hidden=false;b.setAttribute('aria-expanded','true');b.setAttribute('aria-describedby',box.id);const r=b.getBoundingClientRect();box.style.left=Math.max(8,Math.min(r.left,innerWidth-box.offsetWidth-8))+'px';box.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-box.offsetHeight-8))+'px';};
 const later=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(document.activeElement!==active)close();},180);};
 document.addEventListener('pointerover',e=>{const b=e.target.closest('[data-help]');if(b)show(b);else if(box.contains(e.target))clearTimeout(timer);});
 document.addEventListener('pointerout',e=>{if(e.target.closest('[data-help]')||box.contains(e.target))later();});
 document.addEventListener('focusin',e=>{if(e.target.matches('[data-help]'))show(e.target);});
 document.addEventListener('focusout',e=>{if(e.target.matches('[data-help]'))later();});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-help]');if(b){show(b);clearTimeout(timer);}else if(!box.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 window.addEventListener('scroll',close,true);window.addEventListener('resize',close);
 const condense=()=>{
  if(active&&!active.isConnected)close();
  document.querySelectorAll('[data-help-note]').forEach(p=>{const label=p.dataset.helpNote||'this setting',text=p.textContent;const before=p.previousElementSibling;const holder=document.createElement('span');holder.innerHTML=info(label,text);const button=holder.firstElementChild;if(before?.tagName==='LABEL'){const control=before.querySelector('select,input,textarea');if(control&&!control.hasAttribute('aria-label'))control.setAttribute('aria-label',[...before.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim()||label);before.insertBefore(button,control);p.remove();}else if(/^H[1-6]$/.test(before?.tagName??'')){before.append(button);p.remove();}else p.replaceWith(button);});
 };
 new MutationObserver(condense).observe(document.querySelector('#main'),{childList:true,subtree:true});
 condense();
}
