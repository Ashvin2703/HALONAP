import {pushSettings} from '../lib/order-push.js';
import nodemailer from 'nodemailer';
import {requireAdmin,database,stripe} from '../lib/commerce.js';
import {dispatchEmail} from '../lib/customer-emails.js';


// Dispatch email shares the customer email design in lib/customer-emails.js.
export {dispatchEmail};

// Stripe Checkout sessions from the last 7 days, split into the last 24 hours and the full week.
export async function checkoutStats(now=Date.now()){
 const since=Math.floor(now/1000)-7*86400,dayAgo=Math.floor(now/1000)-86400,sessions=[];let after='';
 for(let page=0;page<5;page++){const list=await stripe('checkout/sessions?limit=100&created[gte]='+since+after);sessions.push(...list.data);if(!list.has_more)break;after='&starting_after='+encodeURIComponent(list.data.at(-1).id);}
 const sum=rows=>{const pick=s=>rows.filter(x=>x.status===s);return {started:rows.length,completed:pick('complete').length,abandoned:pick('expired').length,open:pick('open').length,abandoned_pence:pick('expired').reduce((n,x)=>n+(x.amount_total||0),0)}};
 return {last_24h:sum(sessions.filter(s=>s.created>=dayAgo)),last_7d:sum(sessions),truncated:sessions.length>=500};
}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
 try{
  const user=await requireAdmin(req);
  const {action,order_id,resend,auto}=req.body||{};
  if(['push_key','push_enable'].includes(action))return res.status(200).json(await pushSettings(action,req.body.subscription,user));
  if(action==='checkout_stats')return res.status(200).json(await checkoutStats());
  if(action!=='notify_dispatch'||!/^[-0-9a-f]{36}$/i.test(order_id||''))return res.status(400).json({error:'Invalid request'});
  const rows=await database('customer_orders?select=id,order_number,items,customer_name,customer_email,tracking_number,fulfillment_status,dispatch_email_sent_at&id=eq.'+encodeURIComponent(order_id));
  if(rows.length!==1)return res.status(404).json({error:'Order not found'});
  const order=rows[0];
  if(order.fulfillment_status!=='dispatched')return res.status(409).json({error:'Order is not marked as dispatched'});
  if(!order.customer_email)return res.status(409).json({error:'Order has no customer email'});
  if(order.dispatch_email_sent_at&&resend!==true)return res.status(200).json({sent:false,already_sent_at:order.dispatch_email_sent_at});
  const settings=(await database('store_settings?select=dispatch_email_enabled,dispatch_email_note&id=eq.true'))?.[0]||{};
  // Automatic sends (from saving an order as dispatched) respect the on/off switch; the manual button always sends.
  if(auto===true&&settings.dispatch_email_enabled===false)return res.status(200).json({sent:false,disabled:true});
  const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD,SMTP_SECURE}=process.env;
  if(!SMTP_HOST||!SMTP_USER||!SMTP_PASSWORD)return res.status(503).json({error:'Email is not configured'});
  // Claim the send first so double clicks or two admins cannot email the customer twice.
  const now=new Date().toISOString();
  // A resend only claims if nobody else has sent since this request read the order.
  const previous=order.dispatch_email_sent_at;
  const claimed=await database('customer_orders?id=eq.'+encodeURIComponent(order.id)+'&dispatch_email_sent_at='+(previous?'eq.'+encodeURIComponent(previous):'is.null'),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({dispatch_email_sent_at:now})});
  if(!Array.isArray(claimed)||claimed.length!==1)return res.status(200).json({sent:false,already_sent:true});
  try{
   const transport=nodemailer.createTransport({host:SMTP_HOST,port:Number(SMTP_PORT||465),secure:SMTP_SECURE==='true',auth:{user:SMTP_USER,pass:SMTP_PASSWORD},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000});
   const mail=dispatchEmail(order,settings.dispatch_email_note);
   await transport.sendMail({from:{name:'HALONAP Customer Care',address:SMTP_USER},to:order.customer_email,replyTo:'hello@halonap.com',...mail});
  }catch(err){
   await database('customer_orders?id=eq.'+encodeURIComponent(order.id),{method:'PATCH',body:JSON.stringify({dispatch_email_sent_at:previous})}).catch(()=>{});
   console.error('Dispatch email failed',err?.code||err?.message);
   return res.status(502).json({error:'Dispatch email could not be sent. Try again.'});
  }
  return res.status(200).json({sent:true,sent_at:now});
 }catch(error){return res.status(error.status||502).json({error:error.message});}
}
