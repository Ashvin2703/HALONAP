// Mobile menu: the header nav is hidden below 750px, so this toggle opens it as a dropdown.
(function(){
  var header=document.querySelector('.header'),btn=document.getElementById('navToggle'),nav=document.getElementById('siteNav');
  if(!header||!btn||!nav)return;
  function set(open){header.classList.toggle('nav-open',open);btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Close menu':'Open menu')}
  btn.addEventListener('click',function(){set(!header.classList.contains('nav-open'))});
  nav.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&header.classList.contains('nav-open')){set(false);btn.focus()}});
  document.addEventListener('click',function(e){if(header.classList.contains('nav-open')&&!header.contains(e.target))set(false)});
})();
