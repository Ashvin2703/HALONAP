// Share one auth client across reviews, accounts, contact and order controls.
window.halonapGetClient=()=>{
 if(!window.halonapClient&&window.supabase?.createClient)
  window.halonapClient=window.supabase.createClient('https://ufhobvpuwhainuheewxb.supabase.co','sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy');
 return window.halonapClient;
};
const paymentLinks = {"Black":"https://buy.stripe.com/9B6cMY9D10Ad7Xt1ezasg02","Pink":"https://buy.stripe.com/28E6oA3eD2Il2D9g9tasg06","Grey":"https://buy.stripe.com/cNi9AMg1p1EhgtZ0avasg05"};
// SHOP SETTINGS — replace these with your real details before accepting orders.
const SHOP = {
  productName: 'HALONAP Sleep Eye Mask',
  priceGBP: 12.99, // Current selling price.
  whatsappNumber: '447733967306', // Country code and digits only.
};
let quantity = 1;
let cartQuantity = 0;
let selectedColour = "Black";
const variantPhotos = {Grey:["IMG_6093.jpeg","IMG_6092.jpeg","IMG_6091.jpeg","IMG_6094.jpeg"],Pink:["IMG_6089.jpeg","IMG_6088.jpeg","IMG_6087.jpeg","IMG_6086.jpeg","IMG_6090.jpeg"],Black:["IMG_6051.jpeg","IMG_6071.jpeg","IMG_6072.jpeg","IMG_6073.jpeg","IMG_6074.jpeg"]};
const cartVariants = {Grey:0,Pink:0,Black:0};
const CART_STORAGE_KEY = 'halonap-cart-v1';
let cartCloudUser=null,cartSyncTimer=null,cartLoading=false;function saveCart(){try{localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(cartVariants))}catch(e){}if(cartCloudUser&&!cartLoading){clearTimeout(cartSyncTimer);cartSyncTimer=setTimeout(()=>window.halonapSaveCustomerCart?.({...cartVariants}),450)}}window.halonapSetCustomerCart=(userId,items)=>{clearTimeout(cartSyncTimer);cartLoading=true;cartCloudUser=userId;for(const colour of ['Black','Pink','Grey']){const value=items?.[colour];cartVariants[colour]=Number.isInteger(value)&&value>=0&&value<=99?value:0}cartQuantity=Object.values(cartVariants).reduce((a,b)=>a+b,0);if(cartQuantity>99){cartQuantity=0;for(const colour of ['Black','Pink','Grey'])cartVariants[colour]=0}cartLoading=false;saveCart();if(typeof renderCart==='function')renderCart()};window.halonapDetachCustomerCart=()=>{clearTimeout(cartSyncTimer);cartCloudUser=null;for(const colour of ['Black','Pink','Grey'])cartVariants[colour]=0;cartQuantity=0;saveCart();if(typeof renderCart==='function')renderCart()};window.halonapReadLocalCart=()=>({...cartVariants});
function restoreCart(){try{const saved=JSON.parse(localStorage.getItem(CART_STORAGE_KEY));if(!saved||typeof saved!=='object')return;for(const colour of ['Black','Pink','Grey']){const n=saved[colour];if(Number.isInteger(n)&&n>=0&&n<=99)cartVariants[colour]=n;}cartQuantity=Object.values(cartVariants).reduce((a,b)=>a+b,0);if(cartQuantity>99){for(const colour of ['Black','Pink','Grey'])cartVariants[colour]=0;cartQuantity=0}}catch(e){}}
restoreCart();
let galleryIndex=0;
let gallerySwapToken=0;
function renderGallery(){
 const photos=variantPhotos[selectedColour]||[];
 if(!photos.length)return;
 galleryIndex=(galleryIndex+photos.length)%photos.length;
 const main=document.getElementById('mainProduct');
 const file=photos[galleryIndex];
 const nextSrc=(selectedColour==='Black'?'images/':'')+file;
 const label='HALONAP '+selectedColour+' sleep mask — photo '+(galleryIndex+1)+' of '+photos.length;
 const count=document.getElementById('galleryCount');
 if(count)count.textContent=(galleryIndex+1)+' / '+photos.length;
 document.querySelectorAll('.gallery-dot').forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===galleryIndex)));
 const token=++gallerySwapToken;
 if(main.getAttribute('src')===nextSrc){main.alt=label;main.classList.remove('hn-photo-changing');return}
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced){main.src=nextSrc;main.alt=label;main.classList.remove('hn-photo-changing');return}
 const preloaded=new Image();
 preloaded.onload=()=>{
  if(token!==gallerySwapToken)return;
  main.classList.add('hn-photo-changing');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(token!==gallerySwapToken)return;
   main.src=nextSrc;main.alt=label;
   requestAnimationFrame(()=>main.classList.remove('hn-photo-changing'));
  }));
 };
 preloaded.onerror=()=>{if(token!==gallerySwapToken)return;main.src=nextSrc;main.alt=label;main.classList.remove('hn-photo-changing')};
 preloaded.src=nextSrc;
}
function moveGallery(delta){galleryIndex+=delta;renderGallery()}
document.getElementById("galleryPrev")?.addEventListener("click",()=>moveGallery(-1));
document.getElementById("galleryNext")?.addEventListener("click",()=>moveGallery(1));
const galleryPhoto=document.getElementById("mainProduct");
let swipeStartX=null,swipeStartY=null;
galleryPhoto?.addEventListener("touchstart",e=>{if(e.touches.length!==1)return;swipeStartX=e.touches[0].clientX;swipeStartY=e.touches[0].clientY},{passive:true});
galleryPhoto?.addEventListener("touchend",e=>{if(swipeStartX===null||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-swipeStartX,dy=e.changedTouches[0].clientY-swipeStartY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25)moveGallery(dx<0?1:-1);swipeStartX=null;swipeStartY=null},{passive:true});
function setVariant(colour){
 selectedColour=colour;
 document.getElementById("selectedColour").textContent=colour;
 const description=document.getElementById("variantDescription");
 if(description)description.querySelector("strong").textContent="HALONAP Sleep Eye Mask — Colour: "+colour;
 document.querySelectorAll(".colour-option").forEach(b=>{const active=b.dataset.colour===colour;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active))});
 galleryIndex=0;renderGallery();
}
document.querySelectorAll(".colour-option").forEach(b=>b.addEventListener("click",()=>setVariant(b.dataset.colour)));
setVariant("Black");
const money = n => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
const $ = id => document.getElementById(id);
$('price').textContent=money(SHOP.priceGBP);
$('year').textContent=new Date().getFullYear();
function updateVariantSummary(){const q=$('variantQuantity'),t=$('variantTotal');if(q)q.textContent=quantity;if(t)t.textContent=money(quantity*SHOP.priceGBP)}
$('minus').onclick=()=>{$('quantity').textContent=quantity=Math.max(1,quantity-1);updateVariantSummary()};
$('plus').onclick=()=>{$('quantity').textContent=quantity=Math.min(99,quantity+1);updateVariantSummary()};updateVariantSummary();
document.querySelectorAll('.thumb').forEach(b=>b.onclick=()=>{document.querySelectorAll('.thumb').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('mainProduct').src=b.dataset.src});
let bagReturnFocus=null;
$('drawer').inert=true;
function openBag(){bagReturnFocus=document.activeElement;$('drawer').inert=false;$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');$('overlay').hidden=false;renderCart();$('closeBag').focus()}
function closeBag(){const wasOpen=$('drawer').classList.contains('open');$('drawer').classList.remove('open');if(wasOpen&&bagReturnFocus?.isConnected)bagReturnFocus.focus();$('drawer').inert=true;$('drawer').setAttribute('aria-hidden','true');$('overlay').hidden=true}
$('bagButton').onclick=openBag;$('closeBag').onclick=closeBag;$('overlay').onclick=closeBag;
document.addEventListener('keydown',e=>{if(!$('drawer').classList.contains('open'))return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeBag()}else if(e.key==='Tab'){const controls=[...$('drawer').querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')];const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}},true);
$('addToBag').onclick=()=>{if(cartQuantity+quantity>99){alert('Your bag can hold up to 99 masks. Please reduce the quantity before adding more.');return}cartQuantity+=quantity;cartVariants[selectedColour]+=quantity;saveCart();quantity=1;$('quantity').textContent='1';updateVariantSummary();renderCart();const btn=$('addToBag');btn.classList.remove('hn-added');void btn.offsetWidth;btn.classList.add('hn-added');setTimeout(()=>btn.classList.remove('hn-added'),400);openBag()};
function renderCart(){ $('bagCount').textContent=cartQuantity;$('subtotal').textContent=money(cartQuantity*SHOP.priceGBP);const host=$('cartContents');host.innerHTML='';for(const colour of ['Black','Pink','Grey']){const count=cartVariants[colour];if(!count)continue;const item=document.createElement('div');item.className='cart-item';item.style.marginBottom='20px';const img=document.createElement('img');img.src=(colour==='Black'?'images/':'')+variantPhotos[colour][0];img.alt='HALONAP '+colour+' eye mask';img.onerror=()=>{img.style.display="none"};const info=document.createElement('div');const title=document.createElement('h3');title.textContent='HALONAP Sleep Eye Mask — Colour: '+colour;const price=document.createElement('p');price.textContent='Quantity: '+count+' · Total: '+money(SHOP.priceGBP*count);const remove=document.createElement('button');remove.textContent='Remove';remove.onclick=()=>{cartQuantity-=cartVariants[colour];cartVariants[colour]=0;saveCart();renderCart()};const controls=document.createElement('div');controls.className='cart-qty';const dec=document.createElement('button');dec.type='button';dec.textContent='−';dec.setAttribute('aria-label','Decrease '+colour+' quantity');const amount=document.createElement('span');amount.textContent=String(count);amount.setAttribute('aria-live','polite');const inc=document.createElement('button');inc.type='button';inc.textContent='+';inc.setAttribute('aria-label','Increase '+colour+' quantity');const change=delta=>{const next=Math.max(0,Math.min(99,cartVariants[colour]+delta));if(cartQuantity+next-cartVariants[colour]>99)return;cartQuantity+=next-cartVariants[colour];cartVariants[colour]=next;saveCart();renderCart()};dec.onclick=()=>change(-1);inc.onclick=()=>change(1);controls.append(dec,amount,inc);info.append(title,price,controls,remove);item.append(img,info);host.appendChild(item)}if(!cartQuantity)host.innerHTML='<p class="empty">Your bag is waiting for something lovely ♡</p>';$('checkout').disabled=!cartQuantity;$('checkout').style.opacity=cartQuantity?'1':'.5'}

let checkoutBusy=false;
async function startStripeCheckout(items,btn){if(checkoutBusy)return;checkoutBusy=true;const label=btn.textContent;btn.disabled=true;btn.textContent='Preparing secure checkout…';try{const session=await window.halonapGetSession?.();const headers={'Content-Type':'application/json'};if(session?.access_token)headers.Authorization='Bearer '+session.access_token;const response=await fetch('/api/checkout',{method:'POST',headers,body:JSON.stringify({items,attribution:window.halonapAttribution||{}})});const data=await response.json();if(!response.ok||!data.url)throw Error(data.error||'Checkout unavailable');window.location.assign(data.url)}catch(error){alert(error.message||'Unable to start checkout. Please try again.')}finally{checkoutBusy=false;btn.disabled=btn.id==='checkout'&&!cartQuantity;btn.textContent=label}}
const PENDING_CHECKOUT_KEY='halonap-pending-checkout-v1';let pendingCheckout=null;try{const saved=JSON.parse(sessionStorage.getItem(PENDING_CHECKOUT_KEY)||'null');if(saved&&saved.items&&!Array.isArray(saved.items)&&Object.keys(saved.items).every(k=>Object.hasOwn(cartVariants,k))&&Object.values(saved.items).every(v=>Number.isInteger(v)&&v>=0&&v<=99)&&Object.values(saved.items).reduce((a,b)=>a+b,0)>0&&Object.values(saved.items).reduce((a,b)=>a+b,0)<=99)pendingCheckout={items:saved.items,button:$('checkout')};}catch(e){}const checkoutChoice=$('checkoutChoice');function closeCheckoutChoice(){checkoutChoice.hidden=true}
function cancelPendingCheckout(){pendingCheckout=null;window.__halonapCheckoutLogin=false;try{sessionStorage.removeItem(PENDING_CHECKOUT_KEY);sessionStorage.removeItem('halonap-checkout-auth')}catch(e){}}
window.halonapCancelPendingCheckout=cancelPendingCheckout;
function dismissCheckoutChoice(){closeCheckoutChoice();cancelPendingCheckout()}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!checkoutChoice.hidden){e.preventDefault();e.stopImmediatePropagation();dismissCheckoutChoice()}},true);
async function requestCheckout(items,button){if(window.halonapGetSession){try{const session=await window.halonapGetSession();if(session?.user){startStripeCheckout(items,button);return}}catch(e){}}pendingCheckout={items,button};try{sessionStorage.setItem(PENDING_CHECKOUT_KEY,JSON.stringify({items,attribution:window.halonapAttribution||{}}))}catch(e){}closeBag();checkoutChoice.hidden=false}function finishCheckout(){if(!pendingCheckout)return;const {items,button}=pendingCheckout;pendingCheckout=null;try{sessionStorage.removeItem(PENDING_CHECKOUT_KEY)}catch(e){}closeCheckoutChoice();startStripeCheckout(items,button)}$('checkoutChoiceClose').onclick=dismissCheckoutChoice;checkoutChoice.addEventListener('click',e=>{if(e.target===checkoutChoice)dismissCheckoutChoice()});$('checkoutChoiceGuest').onclick=finishCheckout;for(const [id,mode] of [['checkoutChoiceSignIn','signin'],['checkoutChoiceCreate','signup']])$(id).onclick=()=>{closeCheckoutChoice();if(typeof window.halonapOpenAccount==='function')window.halonapOpenAccount(mode,true);else{alert('Account sign in is unavailable right now. You can continue as guest.');checkoutChoice.hidden=false}};window.halonapCheckoutAfterAuth=()=>{if(pendingCheckout)finishCheckout()};window.halonapHasPendingCheckout=()=>!!pendingCheckout;$('checkout').onclick=()=>{if(cartQuantity)requestCheckout({...cartVariants},$('checkout'))};
$('buyNow').removeAttribute('href');$('buyNow').setAttribute('role','button');$('buyNow').addEventListener('click',event=>{event.preventDefault();requestCheckout({[selectedColour]:quantity},$('buyNow'))});renderCart();
// Returning from Stripe's Back button should preserve the basket and make editing easy.
if(new URLSearchParams(location.search).get('checkout')==='cancelled'){window.addEventListener('load',()=>{openBag();try{history.replaceState(null,'',location.pathname+'#shop')}catch(e){}})}

// Only display the confirmation after Supabase accepts the review.
let reviewThankYouTimer;
function showReviewThankYou(){
 const popup=document.getElementById('reviewThankYou');
 if(!popup)return;
 clearTimeout(reviewThankYouTimer);
 popup.hidden=false;
 requestAnimationFrame(()=>popup.classList.add('is-visible'));
 reviewThankYouTimer=setTimeout(()=>{popup.classList.remove('is-visible');setTimeout(()=>{if(!popup.classList.contains('is-visible'))popup.hidden=true},250)},5000);
}
// HALONAP review submissions and moderation (Supabase RLS enforces admin access).
(async function initReviews(){
 const client=window.halonapGetClient();
 const form=document.getElementById('reviewForm'),host=document.getElementById('approvedReviews'),admin=document.getElementById('reviewAdmin'),adminList=document.getElementById('reviewAdminList');
 if(!client||!form||!host)return;
 const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
 const card=(item,moderation=false)=>{
  const el=make('article',undefined,'review-card');
  el.append(make('div','★'.repeat(item.rating)+'☆'.repeat(5-item.rating),'review-stars'),make('strong',item.name));const body=make('p',item.review,'review-body');el.append(body);if(!moderation&&item.review.length>180){body.classList.add('review-collapsed');const more=make('button','Read more','review-more');more.type='button';more.setAttribute('aria-expanded','false');more.onclick=()=>{const expanded=body.classList.toggle('review-collapsed')===false;more.textContent=expanded?'Show less':'Read more';more.setAttribute('aria-expanded',String(expanded))};el.append(more)}
  const gallery=make('div',undefined,'review-gallery');
  for(const path of (item.media_paths||[])){
   const url=client.storage.from('review-media').getPublicUrl(path).data.publicUrl;
   const video=/\.(mp4|webm|mov)$/i.test(path);
   const media=document.createElement(video?'video':'img');media.src=url;if(video){media.controls=true;media.preload='metadata'}else {media.alt='Customer review photo';media.tabIndex=0;media.setAttribute('role','button');media.setAttribute('aria-label','View review photo full size');const open=()=>{const viewer=document.createElement('div');viewer.className='review-lightbox';viewer.setAttribute('role','dialog');viewer.setAttribute('aria-label','Review photo');const image=document.createElement('img');image.src=url;image.alt=media.alt;const close=make('button','×','review-lightbox-close');close.setAttribute('aria-label','Close photo');const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss()}else if(e.key==='Tab'){e.preventDefault();close.focus()}};const dismiss=()=>{document.removeEventListener('keydown',onKey,true);viewer.remove();media.focus()};document.addEventListener('keydown',onKey,true);close.onclick=dismiss;viewer.onclick=e=>{if(e.target===viewer)dismiss()};viewer.append(image,close);document.body.append(viewer);close.focus()};media.onclick=open;media.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}}media.loading='lazy';gallery.append(media);
  }
  el.append(gallery);
  if(moderation){el.append(make('small','Status: '+item.status+' · '+new Date(item.created_at).toLocaleDateString()));const actions=make('div',undefined,'review-actions');for(const [label,status] of [['Approve','approved'],['Reject','rejected'],['Delete','delete']]){const btn=make('button',label);btn.type='button';btn.onclick=async()=>{if(status==='delete'&&!confirm('Delete this review?'))return;btn.disabled=true;const result=status==='delete'?await client.from('product_reviews').delete().eq('id',item.id):await client.from('product_reviews').update({status}).eq('id',item.id);if(result.error)alert(result.error.message);await load();await loadAdmin()};actions.append(btn)}el.append(actions)}
  return el;
 };
 async function load(){const {data,error}=await client.from('product_reviews').select('*').eq('status','approved').order('created_at',{ascending:false}).limit(60);host.replaceChildren();if(!error)for(const item of data||[])host.append(card(item))}
 async function loadAdmin(){if(!admin||!adminList)return;const {data:{user}}=await client.auth.getUser();if(!user){admin.hidden=true;return}const {data:membership}=await client.from('review_admins').select('user_id').eq('user_id',user.id).maybeSingle();admin.hidden=!membership;if(!membership)return;const {data,error}=await client.from('product_reviews').select('*').order('created_at',{ascending:false}).limit(100);adminList.replaceChildren();if(error){adminList.textContent=error.message;return}for(const item of data||[])adminList.append(card(item,true));if(!data?.length)adminList.textContent='No reviews yet.'}
 form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const status=document.getElementById('reviewStatus'),btn=form.querySelector('button[type=submit]'),files=[...document.getElementById('reviewMedia').files];if(files.length>4){status.textContent='Choose up to 4 files.';return}const allowed=['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'];if(files.some(f=>f.size>20*1024*1024||!allowed.includes(f.type))){status.textContent='Only JPG, PNG, WebP, MP4, WebM or MOV files up to 20 MB each.';return}btn.disabled=true;status.textContent='Uploading your review…';const paths=[];try{for(const file of files){const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov'})[file.type];const path='incoming/'+crypto.randomUUID()+'.'+ext;const {error}=await client.storage.from('review-media').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;paths.push(path)}const {error}=await client.from('product_reviews').insert({name:document.getElementById('reviewName').value.trim(),rating:Number(document.getElementById('reviewRating').value),review:document.getElementById('reviewMessage').value.trim(),media_paths:paths,status:'pending'});if(error)throw error;form.reset();status.textContent='';showReviewThankYou();await loadAdmin()}catch(err){status.textContent='Submission failed: '+err.message}finally{btn.disabled=false}});
 await load();await loadAdmin();client.auth.onAuthStateChange(()=>setTimeout(loadAdmin,0));
})();


/* Accessible hamburger navigation for small screens. */
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const siteNav = document.getElementById('siteNav');
if (mobileMenuToggle && siteNav) {
  function setMobileMenu(open) {
    siteNav.classList.toggle('is-open', open);
    mobileMenuToggle.setAttribute('aria-expanded', String(open));
    mobileMenuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  mobileMenuToggle.addEventListener('click', () => setMobileMenu(!siteNav.classList.contains('is-open')));
  siteNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMobileMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMobileMenu(false); });
  document.addEventListener('click', event => {
    if (!siteNav.contains(event.target) && !mobileMenuToggle.contains(event.target)) setMobileMenu(false);
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 750) setMobileMenu(false); });
}

/* HALONAP information and customer rights popups. */
const halonapPolicies={
faq:{title:'Frequently Asked Questions',html:''},
warranty:{title:'Warranty & Product Rights',html:'<p>HALONAP customers have legal rights if a product is faulty, damaged or not as described. These rights apply under UK consumer law and are not limited by any voluntary manufacturer warranty.</p><p>We have not advertised an additional fixed-term commercial warranty. If a separate warranty is offered with your product, its specific terms will be provided in writing.</p><p>For a problem with your sleep mask, contact HALONAP with your order details and a description of the issue. We will review the available remedies under applicable consumer law.</p>'},
refund:{title:'Refund & Returns',html:'<h3>Returns Information</h3><p>HALONAP offers 30-day returns on eligible items from the delivery date. Contact us within 30 days of delivery to request a return under our additional policy. Separately, for eligible UK distance purchases, statutory cancellation generally allows 14 days after delivery to notify us and another 14 days to send the goods back. Your UK statutory rights are not affected.</p><h4>1. Initiate a Return</h4><p>Contact hello@halonap.com with your order details and reason for return.</p><h4>2. Prepare Your Return</h4><p>We will provide return instructions. Keep the item in its original packaging where possible. A legal hygiene exception may apply to certain sealed goods after unsealing.</p><h4>3. Send Back the Item</h4><p>Change-of-mind return postage may be payable by the customer where disclosed before purchase. Faulty or misdescribed goods remain covered by statutory rights.</p><h4>4. Refund</h4><p>Refunds are processed to the original payment method in accordance with applicable UK law. Contact us for assistance.</p>'},
cancellation:{title:'Cancellation Policy',html:'<p>Need to change or cancel an order? Contact HALONAP as soon as possible after ordering. If it has not been dispatched, we will try to stop it before shipping.</p><p>If your order has already been dispatched, your statutory cancellation rights for eligible online purchases still apply. Usually you have 14 days after delivery to notify us that you wish to cancel. Exceptions can apply to certain unsealed hygiene products.</p><p>Any refund will be processed according to applicable UK consumer law and our Refund & Returns policy.</p>'},
shipping:{title:'Delivery & Shipping',html:'<h3>Delivery and Returns</h3><h4>UK Delivery</h4><p><strong>Free standard delivery on orders of £70 or more.</strong></p><p>UK Standard Delivery: £2.99, estimated 3 business days.</p><p>UK Express Delivery: £3.99, estimated 1–2 business days.</p><p>Delivery times are estimates and may vary by location, weekends, bank holidays and courier delays.</p><h4>Shipping Destination</h4><p>We currently ship within the United Kingdom only. US shipping is not available.</p><h4>Returns</h4><p>Eligible products can be returned within 30 days after delivery, subject to the returns policy and applicable hygiene exceptions. Your statutory UK consumer rights remain unaffected.</p>'},
privacy:{title:'Privacy Policy',html:'<p>We use the information you provide to manage your account, process orders, arrange delivery and respond to customer enquiries. This may include your name, email address, shipping details and order information.</p><p>Account authentication is provided through Supabase and payments are handled by Stripe. HALONAP does not ask you to send payment card details by email or WhatsApp.</p><p>For privacy questions or requests concerning your personal data, please contact HALONAP through our Contact section. This summary should be reviewed and expanded into a full privacy notice before launch.</p>'},
terms:{title:'Terms & Conditions',html:'<p>HALONAP sells sleep eye masks through this website. Product colours, quantities and prices are shown before checkout. Your order is submitted through a secure Stripe checkout.</p><p>Please check your delivery address and order details carefully before paying. Contact us promptly if you need to correct an order.</p><p>Nothing in these terms limits your statutory rights under UK consumer law, including rights relating to faulty or misdescribed goods.</p>'}
};
(()=>{const modal=document.getElementById('policyModal');if(!modal)return;const close=()=>{modal.hidden=true};document.querySelectorAll('[data-policy]').forEach(button=>button.addEventListener('click',()=>{const policy=halonapPolicies[button.dataset.policy];if(!policy)return;document.getElementById('policyTitle').textContent=policy.title;document.getElementById('policyContent').innerHTML=button.dataset.policy==='faq'?(document.getElementById('faqContentTemplate')?.innerHTML||'<p>Contact us for assistance.</p>'):policy.html;modal.hidden=false;document.getElementById('policyClose').focus()}));document.getElementById('policyClose').onclick=close;document.getElementById('policyDone').onclick=close;modal.addEventListener('click',event=>{if(event.target===modal)close()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close()})})();

/* Minimal scroll polish: no persistent invisible text and no mobile parallax. */
document.addEventListener('DOMContentLoaded',()=>{
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const headings=document.querySelectorAll('.comfort-panel h2,.everyday>h2,.specifications h2,.finish-section h2,.film-description');
 if('IntersectionObserver' in window){
  const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   entry.target.classList.add('hn-entering');
   entry.target.addEventListener('animationend',()=>entry.target.classList.remove('hn-entering'),{once:true});
   obs.unobserve(entry.target);
  }),{threshold:.18});
  headings.forEach(h=>{if(h.closest('.hn-reveal'))return;h.classList.add('hn-headline-reveal');obs.observe(h)});
 }
 const panel=document.querySelector('.comfort-panel');
 const desktop=window.matchMedia('(min-width:900px)');
 if(!panel||!desktop.matches)return;
 let ticking=false;
 const update=()=>{ticking=false;const rect=panel.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;const ratio=(innerHeight-rect.top)/(innerHeight+rect.height);panel.style.setProperty('--hn-parallax',((ratio-.5)*12).toFixed(1)+'px')};
 const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}};
 addEventListener('scroll',onScroll,{passive:true});update();
});
