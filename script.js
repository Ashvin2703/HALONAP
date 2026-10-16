// SHOP SETTINGS — replace these with your real details before accepting orders.
const SHOP = {
  productName: 'HALONAP Sleep Eye Mask',
  priceGBP: 19.99, // Example price. Change to your actual selling price.
  whatsappNumber: '', // Example: '447700900123' (country code, digits only, no +).
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
$('checkout').onclick=()=>{if(!cartQuantity)return;if(!/^\d{8,15}$/.test(SHOP.whatsappNumber)){$('checkoutHelp').textContent='Checkout is not configured yet. Store owner: add your WhatsApp number in script.js.';return;}const msg=`Hello HALONAP! I'd like to order:\n${SHOP.productName}\nQuantity: ${cartQuantity}\nSubtotal: ${money(cartQuantity*SHOP.priceGBP)}\nPlease confirm shipping, availability and final total.`;window.open(`https://wa.me/${SHOP.whatsappNumber}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer')};renderCart();
