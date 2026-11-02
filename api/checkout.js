const PRICES = Object.freeze({Black:'price_1URLHq24vjMaecFfE01eVMSh',Pink:'price_1URNCd24vjMaecFfShkLBUKY',Grey:'price_1URNGr24vjMaecFfnovZJiLp'});
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 if(!process.env.STRIPE_SECRET_KEY){return res.status(503).json({error:'Checkout setup pending. Contact HALONAP.'});}
 try{
  const items=req.body?.items;
  if(!items||typeof items!=='object'||Array.isArray(items)||Object.keys(items).some(k=>!Object.hasOwn(PRICES,k)))return res.status(400).json({error:'Invalid basket'});
  const entries=Object.entries(PRICES).map(([colour,price])=>({colour,price,quantity:items[colour]??0}));
  if(entries.some(x=>!Number.isInteger(x.quantity)||x.quantity<0||x.quantity>99))return res.status(400).json({error:'Invalid quantity'});
  const selected=entries.filter(x=>x.quantity>0);
  if(!selected.length||selected.reduce((n,x)=>n+x.quantity,0)>99)return res.status(400).json({error:'Invalid basket size'});
  // Enforce admin-controlled availability and configured stock before starting payment.
  const inventoryResponse=await fetch('https://ufhobvpuwhainuheewxb.supabase.co/rest/v1/product_inventory?select=colour,stock_quantity,is_active',{headers:{apikey:'sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy'},cache:'no-store'});
  if(!inventoryResponse.ok)return res.status(503).json({error:'Stock availability is temporarily unavailable. Please try again.'});
  const inventory=await inventoryResponse.json();
  for(const item of selected){const record=inventory.find(v=>v.colour===item.colour);if(!record||!record.is_active)return res.status(409).json({error:item.colour+' is currently unavailable.'});if(record.stock_quantity!==null&&record.stock_quantity<item.quantity)return res.status(409).json({error:'Only '+record.stock_quantity+' '+item.colour+' masks available.'});}
  let verifiedUserId=null;
  const bearer=(req.headers.authorization||'').match(/^Bearer (.+)$/i);
  if(bearer){const auth=await fetch('https://ufhobvpuwhainuheewxb.supabase.co/auth/v1/user',{headers:{apikey:'sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy',Authorization:'Bearer '+bearer[1]}});if(auth.ok){const account=await auth.json();verifiedUserId=account.id||null}}
  const params=new URLSearchParams();
  if(verifiedUserId)params.set('client_reference_id',verifiedUserId);
  params.set('mode','payment');
  params.set('allow_promotion_codes','true');
  for(const key of ['utm_source','utm_medium','utm_campaign']){const value=req.body?.attribution?.[key];if(typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value))params.set('metadata['+key+']',value);}
  params.set('success_url','https://halonap.com/?checkout=success');
  params.set('cancel_url','https://halonap.com/?checkout=cancelled#shop');
  params.set('billing_address_collection','required');
  params.set('shipping_address_collection[allowed_countries][0]','GB');
  // Stripe Checkout presents both UK shipping choices; free shipping is limited to eligible baskets.
  const ukShipping=[{name:'UK Standard Delivery (3–5 business days)',amount:299},{name:'UK Express Delivery (1–2 business days)',amount:399}];
  // GBP product prices are resolved from Stripe so the £70 threshold cannot be spoofed by the browser.
  const prices=await Promise.all(selected.map(async item=>{const response=await fetch('https://api.stripe.com/v1/prices/'+encodeURIComponent(item.price),{headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`}});const data=await response.json();if(!response.ok||data.currency!=='gbp'||!Number.isInteger(data.unit_amount))throw Error('Unable to verify product price');return data.unit_amount*item.quantity}));
  const subtotal=prices.reduce((sum,n)=>sum+n,0);
  if(subtotal>=7000)ukShipping.unshift({name:'Free UK Delivery (3–5 business days)',amount:0});
  ukShipping.forEach((option,i)=>{params.set(`shipping_options[${i}][shipping_rate_data][type]`,'fixed_amount');params.set(`shipping_options[${i}][shipping_rate_data][display_name]`,option.name);params.set(`shipping_options[${i}][shipping_rate_data][fixed_amount][amount]`,String(option.amount));params.set(`shipping_options[${i}][shipping_rate_data][fixed_amount][currency]`,'gbp')});
  params.set('phone_number_collection[enabled]','true');
  selected.forEach((item,i)=>{params.set(`line_items[${i}][price]`,item.price);params.set(`line_items[${i}][quantity]`,String(item.quantity));});
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});
  const data=await response.json();
  if(!response.ok||!data.url){console.error('Stripe checkout error',data.error?.type,data.error?.code);return res.status(502).json({error:'Unable to create checkout. Please try again.'});}
  res.setHeader('Cache-Control','no-store');return res.status(200).json({url:data.url});
 }catch(e){console.error('Checkout exception',e.message);return res.status(500).json({error:'Checkout unavailable. Please try again.'});}
}
