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
  const params=new URLSearchParams();
  params.set('mode','payment');
  params.set('success_url','https://halonap.com/?checkout=success');
  params.set('cancel_url','https://halonap.com/?checkout=cancelled');
  params.set('billing_address_collection','required');
  params.set('shipping_address_collection[allowed_countries][0]','GB');
  params.set('phone_number_collection[enabled]','true');
  selected.forEach((item,i)=>{params.set(`line_items[${i}][price]`,item.price);params.set(`line_items[${i}][quantity]`,String(item.quantity));});
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});
  const data=await response.json();
  if(!response.ok||!data.url){console.error('Stripe checkout error',data.error?.type,data.error?.code);return res.status(502).json({error:'Unable to create checkout. Please try again.'});}
  res.setHeader('Cache-Control','no-store');return res.status(200).json({url:data.url});
 }catch(e){console.error('Checkout exception',e.message);return res.status(500).json({error:'Checkout unavailable. Please try again.'});}
}
