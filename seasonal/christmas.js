/* Isolated Christmas layer: no commerce, auth, data, analytics or copy changes. */
(() => {
  'use strict';
  if (document.querySelector('[data-hn-christmas]')) return;
  const base = '/seasonal/assets/';
  const items = [];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  function art(host, type, asset, eager = false) {
    const el = document.createElement('span');
    el.className = 'hn-xmas hn-xmas--' + type;
    el.setAttribute('aria-hidden', 'true');
    el.dataset.hnChristmas = '';
    const img = document.createElement('img');
    img.alt = ''; img.draggable = false; img.decoding = 'async';
    img.loading = eager ? 'eager' : 'lazy'; img.fetchPriority = 'low';
    img.src = base + asset + '-320.webp';
    img.srcset = base + asset + '-160.webp 160w, ' + base + asset + '-320.webp 320w';
    img.sizes = type === 'tree' ? '(max-width:750px) 44px, 160px' : '(max-width:750px) 100px, 180px';
    img.width = 320; img.height = 320;
    el.append(img); host.append(el);
    return el;
  }
  function mount(selector, type, asset, corner) {
    const host = document.querySelector(selector); if (!host) return;
    if (getComputedStyle(host).position === 'static') host.classList.add('hn-xmas-host');
    const el = art(host, type, asset, selector === '.rest-hero');
    items.push({host, el, corner});
    return el;
  }
  const header = document.querySelector('.header');
  if (header) {
    art(header, 'garland-left', 'garland', true);
    art(header, 'garland-right', 'garland', true);
    const lights = document.createElement('span');
    lights.className = 'hn-xmas-lights'; lights.setAttribute('aria-hidden', 'true'); header.append(lights);
  }
  mount('.rest-hero', 'tree', 'tree', 'bl');
  mount('.rest-hero', 'lantern', 'lantern', 'br');
  mount('#shop .product-layout', 'gifts', 'gifts', 'bl');
  mount('#details', 'pine', 'garland', 'tr');
  mount('#reviews', 'pine', 'garland', 'tl');
  mount('#reviews', 'reindeer', 'reindeer', 'br');
  mount('.site-footer', 'santa', 'santa', 'bl');
  const globe = mount('.site-footer', 'globe', 'globe', 'br');
  if (globe) {
    const snow = document.createElement('span'); snow.className = 'hn-xmas-snow';
    for(let i=0;i<3;i++) snow.append(document.createElement('i'));
    globe.append(snow);
  }
  // Fail closed: only use genuine empty space, never move existing content.
  function obstacles(host) {
    const rects = [];
    const visible = el => !el.closest('.hn-xmas') && getComputedStyle(el).visibility !== 'hidden';
    host.querySelectorAll('a,button,input,select,textarea,img,video,svg').forEach(el => {
      if (!visible(el) || (host.matches('.rest-hero') && el.matches('video.hero-motion'))) return;
      const r=el.getBoundingClientRect(); if(r.width && r.height) rects.push(r);
    });
    const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())) {
      if(!node.textContent.trim() || node.parentElement.closest('script,style,.hn-xmas') || !visible(node.parentElement)) continue;
      const range=document.createRange(); range.selectNodeContents(node);
      for(const r of range.getClientRects()) if(r.width && r.height) rects.push(r);
    }
    return rects;
  }
  function place() {
    const occupied = new Map();
    for(const {host,el,corner} of items) {
      el.removeAttribute('data-placed');
      if(getComputedStyle(el).display === 'none') continue;
      const h=host.getBoundingClientRect(),w=el.offsetWidth,ht=el.offsetHeight;
      if(!h.width || !h.height) continue;
      if(!occupied.has(host)) occupied.set(host,obstacles(host));
      const avoid=occupied.get(host),gap=10;
      if(host.matches('.rest-hero')) { const nav=document.querySelector('.header'); if(nav) avoid.push(nav.getBoundingClientRect()); }
      const left=gap,right=h.width-w-gap,top=gap,bottom=h.height-ht-gap;
      let candidates=corner==='bl'?[[left,bottom],[left,top]]:corner==='br'?[[right,bottom],[right,top]]:corner==='tr'?[[right,top],[right,bottom]]:[[left,top],[left,bottom]];
      if(host.matches('.rest-hero')) candidates=candidates.slice(0,1);
      // Also consider quiet side gutters, without entering the central content.
      for(const y of (host.matches('.rest-hero') ? [] : [h.height*.35,h.height*.6])) candidates.push([corner.includes('l')?left:right,y]);
      if(el.classList.contains('hn-xmas--gifts')) {
        for(let y=10;y+ht<h.height;y+=40) for(const x of [left,right,(h.width-w)/2]) candidates.push([x,y]);
      }
      for(const [x,y] of candidates) {
        if(x<0 || y<0 || x+w>h.width || y+ht>h.height) continue;
        const r={left:h.left+x,right:h.left+x+w,top:h.top+y,bottom:h.top+y+ht};
        if(avoid.some(o=>r.left<o.right+6&&r.right>o.left-6&&r.top<o.bottom+6&&r.bottom>o.top-6)) continue;
        el.style.left=x+'px';el.style.top=y+'px';el.dataset.placed='';avoid.push(r);break;
      }
    }
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;place()});}
  const observer=new ResizeObserver(schedule);
  new Set(items.map(i=>i.host)).forEach(host=>observer.observe(host));
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  document.fonts?.ready.then(schedule);
  // Product modal visibility and asynchronous review loading can change free space.
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  const reviews=document.querySelector('#approvedReviews');
  if(reviews)new MutationObserver(schedule).observe(reviews,{childList:true,subtree:true});
  schedule();
  const hero=document.querySelector('.rest-hero');
  if(hero && !media.matches && innerWidth>750) {
    const flying=art(hero,'flight','santa',true);flying.classList.add('hn-xmas-flight');
    const remove=()=>flying.remove();flying.addEventListener('animationend',remove,{once:true});
    media.addEventListener('change',remove,{once:true});setTimeout(remove,9000);
  }
})();
