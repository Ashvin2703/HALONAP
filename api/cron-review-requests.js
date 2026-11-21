import crypto from 'node:crypto';
import {database} from '../lib/commerce.js';
import {mailer,reviewRequestEmail,sendOnce} from '../lib/customer-emails.js';

// Runs daily from Vercel Cron (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET".
const DAY=86400000;
function authorised(req){
 const secret=process.env.CRON_SECRET,header=req.headers.authorization||'';
 if(!secret)return false;
 const expected=Buffer.from('Bearer '+secret),actual=Buffer.from(header);
 return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);
}

export async function sendDueReviewRequests(now=Date.now(),send=mailer()){
 if(!send)return {sent:0,skipped:0,failed:0,error:'Email is not configured'};
 // Paid, unrefunded orders dispatched 7–30 days ago that have not had a request yet.
 const from=new Date(now-30*DAY).toISOString(),to=new Date(now-7*DAY).toISOString();
 const orders=await database('customer_orders?select=id,order_number,customer_name,customer_email,refunded_pence&review_request_sent_at=is.null&payment_status=eq.paid&fulfillment_status=in.(dispatched,delivered)&customer_email=not.is.null&dispatched_at=gte.'+encodeURIComponent(from)+'&dispatched_at=lte.'+encodeURIComponent(to)+'&order=dispatched_at.asc&limit=50');
 const emails=[...new Set(orders.map(o=>o.customer_email.toLowerCase()))];
 const optedOut=new Set(emails.length?(await database('email_opt_outs?select=email&email=in.'+encodeURIComponent('('+emails.map(e=>'"'+e.replace(/"/g,'')+'"').join(',')+')'))).map(r=>r.email):[]);
 const asked=new Set();let sent=0,skipped=0,failed=0;
 for(const order of orders){
  const email=order.customer_email.toLowerCase();
  // One request per customer per run, and none to anyone who opted out or was refunded.
  if(optedOut.has(email)||asked.has(email)||Number(order.refunded_pence)>0){skipped++;continue}
  try{if(await sendOnce(order,'review_request_sent_at',reviewRequestEmail,send)){sent++;asked.add(email)}else skipped++}
  catch(err){failed++;console.error('Review request failed',order.id,err?.code||err?.message)}
 }
 return {sent,skipped,failed};
}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!process.env.CRON_SECRET)return res.status(503).json({error:'CRON_SECRET is not configured'});
 if(!authorised(req))return res.status(401).json({error:'Unauthorised'});
 try{return res.status(200).json(await sendDueReviewRequests())}
 catch(err){console.error('Review request run failed',err?.message);return res.status(500).json({error:'Review requests failed'})}
}
