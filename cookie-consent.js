(function(){
  'use strict';
  const KEY='halonap-cookie-consent-v1';
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  const valid=saved&&typeof saved.analytics==='boolean'&&typeof saved.marketing==='boolean';
  function apply(c){
    window.halonapCookieConsent=c;
    window.dispatchEvent(new CustomEvent('halonap:consent',{detail:c}));
    if(typeof window.gtag==='function')window.gtag('consent','update',{analytics_storage:c.analytics?'granted':'denied',ad_storage:c.marketing?'granted':'denied',ad_user_data:c.marketing?'granted':'denied',ad_personalization:c.marketing?'granted':'denied'});
  }
  // Consent defaults are restrictive. Integrations must check consent before loading.
  window.halonapCookieConsent=valid?saved:{necessary:true,analytics:false,marketing:false};
  if(typeof window.gtag==='function')window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  if(valid)apply(saved);
  function init(){
    const style=document.createElement('style');
    style.textContent=`
#hn-cookie-panel{position:fixed;z-index:2147483000;bottom:16px;left:16px;width:min(430px,calc(100vw - 32px));box-sizing:border-box;background:#fff;color:#1e2d45;border:1px solid #dbe2ed;border-radius:18px;box-shadow:0 16px 50px #091b3540;padding:22px;font-family:Arial,sans-serif;transform:translateY(calc(100% + 40px));opacity:0;transition:transform .42s cubic-bezier(.2,.8,.2,1),opacity .42s ease;visibility:hidden}
#hn-cookie-panel.hn-visible{transform:translateY(0);opacity:1;visibility:visible}
#hn-cookie-panel h2{font-size:19px;line-height:1.3;margin:0 0 10px;font-weight:700;color:#203c64}
#hn-cookie-panel p{font-size:13px;line-height:1.65;margin:0 0 16px;color:#526074}
#hn-cookie-panel .hn-cookie-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}
#hn-cookie-panel button{min-height:43px;border-radius:10px;font-size:13px;font-weight:650;cursor:pointer;padding:10px;border:1px solid #294977}
#hn-cookie-accept,#hn-cookie-save{background:#294977;color:#fff}
#hn-cookie-reject{background:white;color:#294977}
#hn-cookie-manage{grid-column:1/-1;border:0!important;background:transparent;color:#294977;text-decoration:underline;text-underline-offset:3px}
#hn-cookie-options{display:none;margin:0 0 14px;padding:12px;border:1px solid #e2e8f0;border-radius:10px}
#hn-cookie-options.hn-open{display:block}
#hn-cookie-options label{display:flex;justify-content:space-between;gap:14px;align-items:center;margin:9px 0;font-size:13px}
#hn-cookie-options input{width:18px;height:18px;accent-color:#294977}
#hn-cookie-settings{position:fixed;z-index:2147482999;bottom:12px;left:12px;background:#fff;color:#294977;border:1px solid #dbe2ed;border-radius:50%;width:36px;height:36px;box-shadow:0 4px 15px #091b3525;cursor:pointer;font-size:17px}
@media(max-width:600px){#hn-cookie-panel{bottom:0;left:0;width:100%;border-radius:18px 18px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px))}#hn-cookie-settings{bottom:10px;left:10px}}
@media(prefers-reduced-motion:reduce){#hn-cookie-panel{transition:none}}
`;
    document.head.appendChild(style);
    const panel=document.createElement('section');
    panel.id='hn-cookie-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Cookie preferences');
    panel.innerHTML='<h2>Your privacy matters</h2><p>We use essential cookies to run our shop. With your permission, we may also use analytics and marketing cookies. You can change your choice at any time. See our <a href="/privacy-policy" style="color:#294977;text-decoration:underline">Privacy Policy</a>.</p><div id="hn-cookie-options"><label>Essential cookies <span>Always on</span></label><label>Analytics cookies <input id="hn-cookie-analytics" type="checkbox"></label><label>Marketing cookies <input id="hn-cookie-marketing" type="checkbox"></label></div><div class="hn-cookie-actions"><button type="button" id="hn-cookie-reject">Reject All</button><button type="button" id="hn-cookie-accept">Accept All</button><button type="button" id="hn-cookie-manage">Manage Preferences</button><button type="button" id="hn-cookie-save" style="display:none;grid-column:1/-1">Save Preferences</button></div>';
    document.body.appendChild(panel);
    const settings=document.createElement('button');settings.id='hn-cookie-settings';settings.type='button';settings.textContent='⚙';settings.setAttribute('aria-label','Cookie settings');document.body.appendChild(settings);
    const options=panel.querySelector('#hn-cookie-options'),save=panel.querySelector('#hn-cookie-save');
    function show(){panel.querySelector('#hn-cookie-analytics').checked=!!window.halonapCookieConsent.analytics;panel.querySelector('#hn-cookie-marketing').checked=!!window.halonapCookieConsent.marketing;panel.classList.add('hn-visible')}
    function choose(a,m){const c={necessary:true,analytics:a,marketing:m,updatedAt:new Date().toISOString()};try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}apply(c);panel.classList.remove('hn-visible')}
    panel.querySelector('#hn-cookie-accept').onclick=()=>choose(true,true);
    panel.querySelector('#hn-cookie-reject').onclick=()=>choose(false,false);
    panel.querySelector('#hn-cookie-manage').onclick=()=>{options.classList.toggle('hn-open');save.style.display=options.classList.contains('hn-open')?'block':'none'};
    save.onclick=()=>choose(panel.querySelector('#hn-cookie-analytics').checked,panel.querySelector('#hn-cookie-marketing').checked);
    settings.onclick=show;
    if(!valid)requestAnimationFrame(()=>requestAnimationFrame(show));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();