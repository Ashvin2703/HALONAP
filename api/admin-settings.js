import {requireAdmin,database,stripe} from '../lib/commerce.js';

// One Stripe product per colour. A price change adds a new Stripe price to each product,
// because Stripe prices cannot be edited, then points the store at the new prices.
export const PRODUCTS=Object.freeze({Black:'prod_VSFnEph0uuMBdj',Pink:'prod_VSHmKiUMfy7aJj',Grey:'prod_VSHqLuIAtpcaNz'});
const form=obj=>({method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(obj).toString()});

export async function changePrice(pricePence){
 const rows=await database('store_settings?select=price_pence,price_compare_at_pence,stripe_prices&id=eq.true');
 if(rows?.length!==1)throw Error('Store settings not found');
 const current=rows[0];
 if(current.price_pence===pricePence)return {price_pence:pricePence,unchanged:true};
 const created={};
 const archive=async ids=>{for(const id of ids){try{await stripe('prices/'+encodeURIComponent(id),form({active:'false'}))}catch(err){console.error('Price archive failed',id,err.message)}}};
 try{
  for(const [colour,product] of Object.entries(PRODUCTS)){
   const price=await stripe('prices',form({product,currency:'gbp',unit_amount:String(pricePence),'metadata[colour]':colour,'metadata[source]':'halonap-admin'}));
   created[colour]=price.id;
  }
 }catch(err){await archive(Object.values(created));throw Error('Stripe price could not be created: '+err.message)}
 const patch={price_pence:pricePence,stripe_prices:created};
 // A sale "was" price must stay above the selling price, so clear it if the new price reaches it.
 const compareCleared=current.price_compare_at_pence!=null&&current.price_compare_at_pence<=pricePence;
 if(compareCleared)patch.price_compare_at_pence=null;
 try{await database('store_settings?id=eq.true',{method:'PATCH',body:JSON.stringify(patch)})}
 catch(err){await archive(Object.values(created));throw Error('Price was not saved: '+err.message)}
 // From here checkout uses the new prices. Tidy Stripe so the dashboard shows one active price per colour.
 const warnings=[];
 for(const [colour,product] of Object.entries(PRODUCTS)){
  try{await stripe('products/'+product,form({default_price:created[colour]}))}catch(err){warnings.push(colour+' default price not updated')}
  const old=current.stripe_prices?.[colour];
  if(old&&old!==created[colour]){try{await stripe('prices/'+encodeURIComponent(old),form({active:'false'}))}catch(err){warnings.push(colour+' old price not archived')}}
 }
 return {price_pence:pricePence,previous_price_pence:current.price_pence,stripe_prices:created,compare_cleared:compareCleared,warnings};
}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
 try{
  await requireAdmin(req);
  const {action,price_pence}=req.body||{};
  if(action!=='set_price')return res.status(400).json({error:'Invalid request'});
  if(!Number.isInteger(price_pence)||price_pence<100||price_pence>100000)return res.status(400).json({error:'Enter a price between £1.00 and £1,000.00'});
  return res.status(200).json(await changePrice(price_pence));
 }catch(error){return res.status(error.status||502).json({error:error.message});}
}
