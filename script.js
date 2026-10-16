// SHOP SETTINGS — replace these with your real details before accepting orders.
const SHOP = {
  productName: 'HALONAP Sleep Eye Mask',
  priceGBP: 12.99, // Current selling price.
  whatsappNumber: '447733967306', // Country code and digits only.
};
let quantity = 1;
let cartQuantity = 0;
const money = n => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
const $ = id => document.getElementById(id);
$('price').textContent=money(SHOP.priceGBP);
$('year').textContent=new Date().getFullYear();
$('minus').onclick=()=>{$('quantity').textContent=quantity=Math.max(1,quantity-1)};
$('plus').onclick=()=>{$('quantity').textContent=quantity=Math.min(99,quantity+1)};
document.querySelectorAll('.thumb').forEach(b=>b.onclick=()=>{document.querySelectorAll('.thumb').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('mainProduct').src=b.dataset.src});
function openBag(){$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');$('overlay').hidden=false;renderCart()}
function closeBag(){$('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');$('overlay').hidden=true}
$('bagButton').onclick=openBag;$('closeBag').onclick=closeBag;$('overlay').onclick=closeBag;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBag()});
$('addToBag').onclick=()=>{cartQuantity+=quantity;quantity=1;$('quantity').textContent='1';renderCart();openBag()};
function renderCart(){ $('bagCount').textContent=cartQuantity;$('subtotal').textContent=money(cartQuantity*SHOP.priceGBP);$('cartContents').innerHTML=cartQuantity?`<div class="cart-item"><img src="images/product-2.jpg" alt="HALONAP eye mask"><div><h3>Sleep Eye Mask</h3><p>${money(SHOP.priceGBP)} × ${cartQuantity}</p><button id="removeItem">Remove</button></div></div>`:'<p class="empty">Your bag is waiting for something lovely ♡</p>';if(cartQuantity)$('removeItem').onclick=()=>{cartQuantity=0;renderCart()};$('checkout').disabled=!cartQuantity;$('checkout').style.opacity=cartQuantity?'1':'.5'}
$('checkout').onclick=()=>{if(!cartQuantity)return;if(!/^\d{8,15}$/.test(SHOP.whatsappNumber)){$('checkoutHelp').textContent='Checkout is not configured yet. Store owner: add your WhatsApp number in script.js.';return;}const msg=`Hello HALONAP! I'd like to order:\n${SHOP.productName}\nQuantity: ${cartQuantity}\nSubtotal: ${money(cartQuantity*SHOP.priceGBP)}\nUK delivery: FREE\nTotal: ${money(cartQuantity*SHOP.priceGBP)}\nPlease confirm availability and delivery address.`;window.open(`https://wa.me/${SHOP.whatsappNumber}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer')};renderCart();

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
