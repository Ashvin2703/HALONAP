import {requireAdmin,database,stripe,syncOrderRefund} from '../lib/commerce.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
 try{
  await requireAdmin(req);
  const {action,order_id}=req.body||{};
  if(!['sync','refund'].includes(action)||!/^[-0-9a-f]{36}$/i.test(order_id||''))return res.status(400).json({error:'Invalid request'});
  const rows=await database('customer_orders?select=id,order_number,total_pence,payment_status&id=eq.'+encodeURIComponent(order_id));
  if(rows.length!==1)return res.status(404).json({error:'Order not found'});
  const order=rows[0];let state=await syncOrderRefund(order);
  if(action==='refund'){
   if(state.refund_status==='pending')return res.status(409).json({error:'A refund is already pending. Sync its status before retrying.'});
   if(state.refunded_pence>=order.total_pence)return res.status(409).json({error:'This payment is already fully refunded.'});
   const params=new URLSearchParams({payment_intent:order.order_number,'metadata[halonap_order_id]':order.id});
   // Full remaining amount only. Stable key protects double clicks and uncertain network retries.
   await stripe('refunds',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':'halonap-full-refund-'+order.id},body:params.toString()});
   state=await syncOrderRefund(order);
  }
  return res.status(200).json(state);
 }catch(error){return res.status(error.status||502).json({error:error.message});}
}
