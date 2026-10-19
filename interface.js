/* Progressive enhancement: navigation, product film and benefit carousel. */
(() => {
 const hero=document.querySelector('.rest-hero'),nav=document.querySelector('.product-navigation');
 if(hero&&nav){const observer=new IntersectionObserver(([entry])=>{nav.classList.toggle('visible',!entry.isIntersecting);nav.inert=entry.isIntersecting;},{threshold:0});observer.observe(hero);nav.inert=true;}
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 document.querySelectorAll('video[autoplay]').forEach(video=>{video.muted=true;if(reduced){video.removeAttribute('autoplay');video.pause();}else{video.play().catch(()=>{});}});
 const film=document.getElementById('productFilm'),toggle=document.getElementById('filmToggle'),label=document.getElementById('filmLabel');
 toggle?.addEventListener('click',async()=>{if(film.paused){try{await film.play();label.textContent='Pause film';toggle.setAttribute('aria-label','Pause product film');toggle.firstElementChild.textContent='Ⅱ';}catch{label.textContent='Tap to try again';}}else{film.pause();label.textContent='Watch the film';toggle.setAttribute('aria-label','Play product film');toggle.firstElementChild.textContent='▶';}});
 const track=document.getElementById('benefitTrack'),tabs=[...document.querySelectorAll('[data-benefit]')];let index=0;
 function select(i,scroll=true){index=Math.max(0,Math.min(tabs.length-1,i));tabs.forEach((tab,n)=>{tab.classList.toggle('active',n===index);tab.setAttribute('aria-pressed',String(n===index));});if(scroll&&track){const item=track.children[index];track.scrollTo({left:item.offsetLeft-track.children[0].offsetLeft,behavior:reduced?'instant':'smooth'});}}
 tabs.forEach(tab=>tab.addEventListener('click',()=>select(Number(tab.dataset.benefit))));
 document.getElementById('benefitPrev')?.addEventListener('click',()=>select((index+tabs.length-1)%tabs.length));document.getElementById('benefitNext')?.addEventListener('click',()=>select((index+1)%tabs.length));
 if(track){let timer;track.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>{const first=track.children[0];let closest=0,dist=Infinity;[...track.children].forEach((item,i)=>{const d=Math.abs(item.offsetLeft-first.offsetLeft-track.scrollLeft);if(d<dist){closest=i;dist=d;}});select(closest,false);},100);},{passive:true});}
 document.querySelectorAll('[data-finish]').forEach(link=>link.addEventListener('click',()=>{document.querySelector(`.colour-option[data-colour="${link.dataset.finish}"]`)?.click();}));
})();
