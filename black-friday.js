/* HALONAP Black Friday 2026. Shows only between START and END, and only while the live price
   (Admin Settings) is below the was price. Removes itself when the sale ends. Text only, no tracking. */
(()=>{
 'use strict';
 const START=Date.parse('2026-11-24T00:00:00Z');
 const END=Date.parse('2026-12-01T00:00:00Z');   // end of Cyber Monday, 30 Nov 2026, 11:59 pm UK time
 const WAS_PENCE=1299;                            // the regular price charged before the sale
 if(Date.now()<START||Date.now()>=END)return;

 const money=p=>'£'+(p/100).toFixed(2);
 const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
 let price=999,was=WAS_PENCE,built=false;
 const counters=[];

 function remaining(){const ms=Math.max(0,END-Date.now());return {d:Math.floor(ms/864e5),h:Math.floor(ms/36e5)%24,m:Math.floor(ms/6e4)%60,s:Math.floor(ms/1e3)%60,ms}}
 const two=n=>String(n).padStart(2,'0');

 function bar(){
  const b=el('div','bf-bar');b.setAttribute('role','region');b.setAttribute('aria-label','Black Friday sale');
  b.append(el('span','bf-bar-tag','Black Friday'));
  const t=el('span','bf-bar-text');t.append('Sleep mask now ',el('b','bf-now',money(price)),' ',el('s','bf-was',money(was)),' · Save '+pct()+'%');b.append(t);
  const c=el('span','bf-bar-count');c.append('Ends in ');const v=el('b','bf-count-inline');c.append(v);b.append(c);
  counters.push(r=>{v.textContent=(r.d?r.d+'d ':'')+two(r.h)+'h '+two(r.m)+'m '+two(r.s)+'s'});
  const a=el('a','bf-bar-cta','Shop the sale →');a.href='#shop';b.append(a);
  document.querySelector('.header')?.before(b);
  // The homepage header is laid over the hero, so move it down by the bar's height.
  const setH=()=>document.documentElement.style.setProperty('--bf-bar-h',b.offsetHeight+'px');setH();addEventListener('resize',setH);
 }

 function heroSticker(){
  const hero=document.querySelector('.rest-hero');if(!hero)return;
  const s=el('a','bf-sticker');s.href='#shop';s.setAttribute('aria-label','Black Friday: '+money(price)+', was '+money(was)+'. Shop the sale');
  s.append(el('span','bf-sticker-top','Black Friday'),el('span','bf-sticker-pct','−'+pct()+'%'),el('span','bf-sticker-price',money(price)));
  hero.append(s);
  const cta=hero.querySelector('.hero-shop');if(cta)cta.textContent='Shop the Black Friday deal';
  const sub=hero.querySelector('.hero-price');if(sub){const line=el('span','bf-hero-line');line.append('Black Friday ',el('b',null,money(price)),' ',el('s',null,money(was)));sub.after(line)}
 }

 function promoSection(){
  const shop=document.getElementById('shop');if(!shop)return;
  const sec=el('section','bf-promo');sec.setAttribute('aria-labelledby','bfTitle');
  // Background: slow "BLACK FRIDAY" marquee and twinkling gold sparkles (decorative only).
  const mq=el('div','bf-marquee');mq.setAttribute('aria-hidden','true');const track=el('div','bf-marquee-track');for(let i=0;i<8;i++)track.append(el('span',null,'Black Friday ✦ '));mq.append(track);sec.append(mq);
  const sparks=el('div','bf-sparks');sparks.setAttribute('aria-hidden','true');for(let i=0;i<18;i++){const sp=el('span','bf-spark');sp.style.cssText='left:'+(4+((i*53)%92))+'%;top:'+(6+((i*37)%86))+'%;animation-delay:'+((i*0.37)%3).toFixed(2)+'s;--s:'+(0.5+((i*7)%10)/10);sparks.append(sp)}sec.append(sparks);
  const inner=el('div','bf-promo-inner');sec.append(inner);
  const copy=el('div','bf-promo-copy');inner.append(copy);
  copy.append(el('p','bf-kicker','Black Friday · Cyber Monday'));
  const h=el('h2','bf-title');h.id='bfTitle';h.append('£'+((was-price)/100).toFixed(2).replace(/\.00$/,'')+' off every mask.');copy.append(h);
  const pr=el('div','bf-price-drop');pr.setAttribute('aria-label','Now '+money(price)+', was '+money(was));
  const wasEl=el('span','bf-drop-was',money(was)),nowEl=el('span','bf-drop-now',money(was));
  pr.append(wasEl,nowEl,el('span','bf-drop-save','Save '+pct()+'%'));copy.append(pr);
  const perks=el('ul','bf-perks');
  for(const [icon,text] of [['✦','All three colours: Black, Pink and Grey'],['◌','Free UK delivery on 2 masks or more ('+money(price*2)+')'],['↺','30-day returns']]){const li=el('li');li.append(el('span','bf-perk-icon',icon),text);perks.append(li)}
  copy.append(perks);
  const cta=el('a','bf-cta','Shop the sale');cta.href='#shop';copy.append(cta);
  const side=el('div','bf-promo-side');inner.append(side);
  // Three colours, fanned out. Each opens the shop with that colour already chosen.
  const fan=el('div','bf-fan');
  for(const [colour,src] of [['Pink','IMG_6088.webp'],['Black','images/IMG_6074.webp'],['Grey','IMG_6093.webp']]){
   const a=el('a','bf-fan-item bf-fan-'+colour.toLowerCase());a.href='#shop';a.setAttribute('aria-label','Shop '+colour+' for '+money(price));
   const img=el('img');img.src=src;img.alt='';img.decoding='async';
   a.append(img,el('span','bf-fan-label',colour+' · '+money(price)));
   a.addEventListener('click',()=>setTimeout(()=>document.querySelector('#shop [data-colour="'+colour+'"]')?.click(),60));
   fan.append(a);
  }
  side.append(fan);
  const card=el('div','bf-count-card');side.append(card);
  card.append(el('p','bf-count-label','Sale ends in'));
  const grid=el('div','bf-count');grid.setAttribute('role','timer');grid.setAttribute('aria-label','Time left in the Black Friday sale');
  const cells={};for(const [k,l] of [['d','Days'],['h','Hours'],['m','Mins'],['s','Secs']]){const c=el('div','bf-count-cell');cells[k]=el('span','bf-count-num','00');c.append(cells[k],el('span','bf-count-unit',l));grid.append(c)}
  card.append(grid,el('p','bf-count-note','Ends Monday 30 November, 11:59 pm UK time'));
  counters.push(r=>{for(const k of ['d','h','m','s']){const v=two(r[k]);if(cells[k].textContent!==v){cells[k].textContent=v;if(!calm){cells[k].classList.remove('tick');void cells[k].offsetWidth;cells[k].classList.add('tick')}}}});
  shop.before(sec);
  // Price drop plays once when the section scrolls into view.
  const play=()=>{if(calm){nowEl.textContent=money(price);sec.classList.add('bf-played');return}sec.classList.add('bf-played');const t0=performance.now(),dur=1100;const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);nowEl.textContent=money(Math.round(was-(was-price)*e));if(k<1)requestAnimationFrame(step)};setTimeout(()=>requestAnimationFrame(step),450)};
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();play()}},{threshold:.35});io.observe(sec)}else play();
 }

 function productPrice(){
  const p=document.getElementById('price');if(!p)return;
  p.classList.add('bf-price');p.replaceChildren(el('s','bf-was',money(was)),' ',el('span','bf-now',money(price)),' ',el('span','bf-save-pill','Black Friday · Save '+pct()+'%'));
  const label=document.querySelector('#shop .hn-gallery-label');const old=document.querySelector('.bf-ribbon');if(old)old.remove();if(label)label.append(el('span','bf-ribbon','Black Friday −'+pct()+'%'));
  const sticky=document.querySelector('#hnStickyBuy [data-price]');if(sticky)sticky.replaceChildren(el('s','bf-was',money(was)),' ',money(price));
 }

 const pct=()=>Math.round((was-price)/was*100);

 function build(){
  if(built)return;built=true;
  document.documentElement.classList.add('bf-on');
  bar();heroSticker();promoSection();productPrice();
  const tick=()=>{const r=remaining();if(r.ms<=0){document.querySelectorAll('.bf-bar,.bf-sticker,.bf-hero-line,.bf-promo,.bf-ribbon').forEach(n=>n.remove());document.documentElement.classList.remove('bf-on');clearInterval(timer);return}counters.forEach(f=>f(r))};
  const timer=setInterval(tick,1000);tick();
 }

 function apply(s){
  if(s&&Number.isInteger(s.price_pence))price=s.price_pence;
  if(s&&Number.isInteger(s.price_compare_at_pence))was=s.price_compare_at_pence;
  if(price>=was)return;          // no real discount, so no sale claims
  if(built){productPrice();return}
  build();
 }
 const start=()=>{if(window.halonapSettings)apply(window.halonapSettings);else setTimeout(()=>{if(!built)apply(null)},2500)};
 // Settings arrive from Supabase; script.js rewrites #price when they do, so re-apply afterwards.
 window.addEventListener('halonap:settings',e=>setTimeout(()=>apply(e.detail),0));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
