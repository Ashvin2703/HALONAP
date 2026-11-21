/* First-party campaign attribution and Admin Studio storefront settings; no tracking cookies. */
(()=>{
 const query=new URLSearchParams(location.search);
 window.halonapAttribution={};
 for(const key of ['utm_source','utm_medium','utm_campaign']){const v=query.get(key);if(v&&/^[a-zA-Z0-9_-]{1,80}$/.test(v))window.halonapAttribution[key]=v;}
 const money=p=>'£'+(p%100?(p/100).toFixed(2):p/100);
 const pence=v=>Number.isInteger(v)&&v>=0?v:null;
 const fields='announcement,support_email,free_delivery_threshold_pence,price_pence,price_compare_at_pence,standard_delivery_pence,express_delivery_pence,shop_paused,pause_message';
 fetch('https://ufhobvpuwhainuheewxb.supabase.co/rest/v1/store_settings?select='+fields+'&id=eq.true',{headers:{apikey:'sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy'},cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(rows=>{
  const s=rows[0];if(!s)return;
  const price=pence(s.price_pence),was=pence(s.price_compare_at_pence),free=pence(s.free_delivery_threshold_pence),standard=pence(s.standard_delivery_pence),express=pence(s.express_delivery_pence);
  const onSale=price!==null&&was!==null&&was>price;
  const fill=el=>{
   if(el.matches('[data-free-threshold]')&&free!==null)el.textContent=money(free);
   else if(el.matches('[data-ship="standard"]')&&standard!==null)el.textContent=money(standard);
   else if(el.matches('[data-ship="express"]')&&express!==null)el.textContent=money(express);
   else if(el.matches('[data-price]')&&price!==null){el.textContent=money(price);if(onSale){const old=document.createElement('s');old.textContent=money(was);old.style.opacity='.6';el.prepend(old,' ')}}
  };
  const selector='[data-free-threshold],[data-ship],[data-price]';
  const apply=root=>{if(root.matches?.(selector))fill(root);for(const el of root.querySelectorAll?root.querySelectorAll(selector):[])fill(el)};
  apply(document);
  /* Policy modals are rendered later from script.js. */
  new MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes)if(n.nodeType===1)apply(n)}).observe(document.body,{childList:true,subtree:true});
  const banner=document.querySelector('.announcement');if(banner)banner.textContent=s.announcement;
  if(s.shop_paused===true){
   const bar=document.createElement('div');bar.className='halonap-paused';bar.setAttribute('role','status');
   bar.textContent=(typeof s.pause_message==='string'&&s.pause_message.trim())||'HALONAP is not taking new orders right now. Please check back soon.';
   bar.style.cssText='position:sticky;top:0;z-index:1000;background:#203657;color:#fff;text-align:center;padding:12px 16px;font:600 14px/1.4 system-ui,sans-serif';
   document.body.prepend(bar);
  }
  for(const link of document.querySelectorAll('a[href^="mailto:"]')){const old=link.getAttribute('href').slice(7);link.href='mailto:'+s.support_email;if(link.textContent.trim()===old)link.textContent=s.support_email;}
  window.halonapSettings=s;window.dispatchEvent(new CustomEvent('halonap:settings',{detail:s}));
 }).catch(()=>{});
})();
