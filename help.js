const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const info=(label,text)=>`<button type="button" class="info-bubble" data-help="${escape(text)}" aria-label="About ${escape(label)}" aria-expanded="false">i</button>`;
export function installHelp(){
 const box=document.createElement('div');box.id='info-tooltip';box.className='info-tooltip';box.setAttribute('role','tooltip');box.setAttribute('popover','manual');box.hidden=true;document.body.append(box);
 let active=null,timer,pinned=false;
 const close=()=>{clearTimeout(timer);if(active){active.setAttribute('aria-expanded','false');active.removeAttribute('aria-describedby');}active=null;pinned=false;box.hidePopover?.();box.hidden=true;};
 const show=b=>{clearTimeout(timer);if(active!==b)close();active=b;box.textContent=b.dataset.help;box.hidden=false;box.showPopover?.();b.setAttribute('aria-expanded','true');b.setAttribute('aria-describedby',box.id);const r=b.getBoundingClientRect();box.style.left=Math.max(8,Math.min(r.left,innerWidth-box.offsetWidth-8))+'px';box.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-box.offsetHeight-8))+'px';};
 const later=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!pinned&&document.activeElement!==active)close();},200);};
 document.addEventListener('pointerover',e=>{const b=e.target.closest('[data-help]');if(b)show(b);else if(box.contains(e.target))clearTimeout(timer);});
 document.addEventListener('pointerout',e=>{if(e.target.closest('[data-help]')||box.contains(e.target))later();});
 document.addEventListener('focusin',e=>{if(e.target.matches('[data-help]'))show(e.target);});
 document.addEventListener('focusout',e=>{if(e.target.matches('[data-help]'))later();});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-help]');if(b){e.preventDefault();e.stopPropagation();if(active===b&&pinned)close();else{show(b);pinned=true;}}else if(!box.contains(e.target))close();},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){close();e.preventDefault();e.stopPropagation();}},true);
 window.addEventListener('scroll',e=>{if(!box.contains(e.target))close();},true);window.addEventListener('resize',close);
 const condense=()=>{
  if(active&&!active.isConnected)close();
  document.querySelectorAll('[data-help-note]').forEach(p=>{
   const label=p.dataset.helpNote||'this setting',before=p.previousElementSibling,holder=document.createElement('span');holder.innerHTML=info(label,p.textContent);const button=holder.firstElementChild;
   const links=[...p.querySelectorAll('a')].map(a=>a.cloneNode(true));
   if(before?.tagName==='LABEL'){before.append(button);p.replaceChildren();}else if(/^H[1-6]$/.test(before?.tagName??'')){before.append(button);p.replaceChildren();}else p.replaceChildren(button);
   p.removeAttribute('data-help-note');if(links.length){const list=document.createElement('span');list.className='help-links';links.forEach(a=>{list.append(a,document.createTextNode(' '));});p.append(list);}if(!p.childNodes.length)p.remove();
  });
  // An info button is not another form control inside a label. Keep it beside the label.
  document.querySelectorAll('label > .info-bubble').forEach(button=>{const label=button.parentElement,wrapper=document.createElement('div');wrapper.className='field-with-help';label.before(wrapper);wrapper.append(label,button);});
 };
 new MutationObserver(condense).observe(document.body,{childList:true,subtree:true});condense();
}
