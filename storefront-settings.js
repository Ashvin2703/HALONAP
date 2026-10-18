/* First-party campaign attribution for this page; no tracking cookies. */
(()=>{
 const query=new URLSearchParams(location.search);
 window.halonapAttribution={};
 for(const key of ['utm_source','utm_medium','utm_campaign']){const v=query.get(key);if(v&&/^[a-zA-Z0-9_-]{1,80}$/.test(v))window.halonapAttribution[key]=v;}
 fetch('https://ufhobvpuwhainuheewxb.supabase.co/rest/v1/store_settings?select=announcement,support_email&id=eq.true',{headers:{apikey:'sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy'},cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(rows=>{const s=rows[0];if(!s)return;const banner=document.querySelector('.announcement');if(banner&&s.announcement&&!/£\s*70/.test(s.announcement))banner.textContent=s.announcement;for(const link of document.querySelectorAll('a[href^="mailto:"]')){const old=link.getAttribute('href').slice(7);link.href='mailto:'+s.support_email;if(link.textContent.trim()===old)link.textContent=s.support_email;}}).catch(()=>{});
})();
