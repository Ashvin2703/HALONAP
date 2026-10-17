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
const variantPhotos = {Grey:["IMG_6093.jpeg","IMG_6092.jpeg","IMG_6091.jpeg","IMG_6094.jpeg"],Pink:["IMG_6089.jpeg","IMG_6088.jpeg","IMG_6087.jpeg","IMG_6086.jpeg","IMG_6090.jpeg"],Black:["IMG_6071.jpeg","IMG_6051.jpeg","IMG_6072.jpeg","IMG_6073.jpeg","IMG_6074.jpeg"]};
const cartVariants = {Grey:0,Pink:0,Black:0};
const fallbackPhoto = null;
function setVariant(colour){selectedColour=colour;document.getElementById("buyNow").href=paymentLinks[colour];document.getElementById("selectedColour").textContent=colour;const description=document.getElementById("variantDescription");if(description)description.querySelector("strong").textContent="HALONAP Sleep Eye Mask — Colour: "+colour;document.querySelectorAll(".colour-option").forEach(b=>{const active=b.dataset.colour===colour;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active))});const photos=variantPhotos[colour] || [];const thumbs=document.querySelector(".thumbs");thumbs.innerHTML="";photos.forEach((name,i)=>{const src=(colour==="Black"?"images/":"")+name;const btn=document.createElement("button");btn.type="button";btn.className="thumb"+(i===0?" active":"");btn.dataset.src=src;btn.setAttribute("aria-label",colour+" photo "+(i+1));const img=document.createElement("img");img.src=src;img.alt="";img.onerror=()=>{img.style.display="none"};btn.appendChild(img);btn.onclick=()=>{thumbs.querySelectorAll(".thumb").forEach(x=>x.classList.remove("active"));btn.classList.add("active");const main=document.getElementById("mainProduct");main.src=src;main.alt="HALONAP "+colour+" sleep mask"};thumbs.appendChild(btn)});const main=document.getElementById("mainProduct");main.src=(colour==="Black"?"images/":"")+photos[0];main.alt="HALONAP "+colour+" sleep mask";main.onerror=()=>{main.alt="Photo unavailable for "+colour;main.removeAttribute("src")};}
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
function openBag(){$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');$('overlay').hidden=false;renderCart()}
function closeBag(){$('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');$('overlay').hidden=true}
$('bagButton').onclick=openBag;$('closeBag').onclick=closeBag;$('overlay').onclick=closeBag;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBag()});
$('addToBag').onclick=()=>{cartQuantity+=quantity;cartVariants[selectedColour]+=quantity;quantity=1;$('quantity').textContent='1';updateVariantSummary();renderCart();openBag()};
function renderCart(){ $('bagCount').textContent=cartQuantity;$('subtotal').textContent=money(cartQuantity*SHOP.priceGBP);const host=$('cartContents');host.innerHTML='';for(const colour of ['Black','Pink','Grey']){const count=cartVariants[colour];if(!count)continue;const item=document.createElement('div');item.className='cart-item';item.style.marginBottom='20px';const img=document.createElement('img');img.src=(colour==='Black'?'images/':'')+variantPhotos[colour][0];img.alt='HALONAP '+colour+' eye mask';img.onerror=()=>{img.style.display="none"};const info=document.createElement('div');const title=document.createElement('h3');title.textContent='HALONAP Sleep Eye Mask — Colour: '+colour;const price=document.createElement('p');price.textContent='Quantity: '+count+' · Total: '+money(SHOP.priceGBP*count);const remove=document.createElement('button');remove.textContent='Remove';remove.onclick=()=>{cartQuantity-=cartVariants[colour];cartVariants[colour]=0;renderCart()};info.append(title,price,remove);item.append(img,info);host.appendChild(item)}if(!cartQuantity)host.innerHTML='<p class="empty">Your bag is waiting for something lovely ♡</p>';$('checkout').disabled=!cartQuantity;$('checkout').style.opacity=cartQuantity?'1':'.5'}

$('checkout').onclick=async()=>{if(!cartQuantity)return;const btn=$('checkout');btn.disabled=true;const label=btn.textContent;btn.textContent='Preparing secure checkout…';try{const response=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cartVariants})});const data=await response.json();if(!response.ok||!data.url)throw Error(data.error||'Checkout unavailable');window.location.assign(data.url)}catch(error){alert(error.message||'Unable to start checkout. Please try again.')}finally{btn.disabled=false;btn.textContent=label}};renderCart();

// Customer reviews are sent for manual verification; no fabricated ratings are displayed.
const reviewForm = document.getElementById('reviewForm');
if (reviewForm) reviewForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!reviewForm.reportValidity()) return;
  const name = document.getElementById('reviewName').value.trim();
  const rating = document.getElementById('reviewRating').value;
  const review = document.getElementById('reviewMessage').value.trim();
  if (!name || !rating || !review) return;
  const message = ['Hello HALONAP! I would like to submit a customer review.', 'Name: ' + name, 'Rating: ' + rating + '/5', 'Review: ' + review].join('\n');
  window.open('https://wa.me/447733967306?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
});


// Display only reviews explicitly added to reviews.json after approval.
// Use textContent for all customer-provided fields to prevent HTML injection.
(async function showApprovedReviews() {
  const host = document.getElementById('approvedReviews');
  if (!host) return;
  try {
    const response = await fetch('reviews.json', { cache: 'no-store' });
    if (!response.ok) return;
    const reviews = await response.json();
    if (!Array.isArray(reviews)) return;
    for (const item of reviews) {
      if (!item || typeof item.name !== 'string' || typeof item.review !== 'string') continue;
      const rating = Number(item.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;
      const card = document.createElement('article');
      card.style.cssText = 'background:#fff8fa;border:1px solid #eed8e0;border-radius:18px;padding:22px;margin:14px 0;line-height:1.6';
      const stars = document.createElement('div');
      stars.style.cssText = 'letter-spacing:3px;margin-bottom:8px;color:#D4AF37;font-size:22px';
      stars.setAttribute('aria-label', rating + ' out of 5 stars');
      stars.textContent = '★'.repeat(rating) + '☆'.repeat(5-rating);
      const name = document.createElement('strong');
      name.textContent = item.name.slice(0,60);
      const body = document.createElement('p');
      body.style.marginTop = '10px';
      body.textContent = item.review.slice(0,1200);
      card.append(stars, name, body);
      host.appendChild(card);
    }
  } catch (error) {
    // Keep the review submission form available if the review feed cannot load.
  }
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
