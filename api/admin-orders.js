import nodemailer from 'nodemailer';
import {requireAdmin,database,stripe} from '../lib/commerce.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const itemsText=items=>(Array.isArray(items)?items:[]).map(i=>'HALONAP Sleep Eye Mask · '+(i.colour||'Mask')+' × '+(i.quantity||1));

export function dispatchEmail(order){
 const name=order.customer_name?.split(' ')[0]||'there',ref=order.order_number||String(order.id).slice(0,8),lines=itemsText(order.items),tracking=order.tracking_number;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your HALONAP order is on its way</title></head><body style="margin:0;padding:0;background:#f4f5f7;color:#18243a;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e9ee;border-radius:12px;overflow:hidden"><tr><td align="center" style="background:#203657;padding:30px 24px 26px"><div style="font-size:27px;line-height:34px;font-weight:700;letter-spacing:3px"><span style="color:#ffffff">HAL</span><span style="color:#e3b44f">O</span><span style="color:#ffffff">NAP</span></div><div style="font-size:12px;line-height:20px;color:#e3d4aa;letter-spacing:1px;margin-top:7px">BETTER SLEEP, BRIGHTER DAYS.</div></td></tr><tr><td style="padding:34px 30px 14px"><div style="font-size:12px;letter-spacing:1.5px;font-weight:700;color:#8b7446">ORDER DISPATCHED</div><h1 style="font-size:25px;line-height:33px;font-weight:700;color:#203657;margin:13px 0 18px">Your order is on its way</h1><p style="font-size:15px;line-height:25px;margin:0 0 14px">Hello ${esc(name)},</p><p style="font-size:15px;line-height:25px;margin:0 0 24px">Good news: your HALONAP order has been packed and handed to our delivery partner.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fa;border:1px solid #e5e8ef;border-radius:8px"><tr><td style="padding:20px 18px"><div style="font-size:11px;letter-spacing:1px;color:#667187;font-weight:700">ORDER REFERENCE</div><div style="font-size:16px;line-height:24px;font-weight:700;color:#203657;margin-top:6px;overflow-wrap:anywhere">${esc(ref)}</div>${lines.map(l=>`<div style="font-size:14px;line-height:22px;color:#4d5a70;margin-top:8px">${esc(l)}</div>`).join('')}${tracking?`<div style="font-size:11px;letter-spacing:1px;color:#667187;font-weight:700;margin-top:16px">TRACKING NUMBER</div><div style="font-size:16px;line-height:24px;font-weight:700;color:#203657;margin-top:6px;overflow-wrap:anywhere">${esc(tracking)}</div>`:''}</td></tr></table><p style="font-size:14px;line-height:23px;color:#4d5a70;margin:24px 0 22px">Questions about your delivery? Just reply to this email with your order reference.</p><p style="font-size:14px;line-height:23px;margin:0 0 12px">Sleep well,<br><strong>HALONAP Customer Care</strong></p></td></tr><tr><td align="center" style="border-top:1px solid #e8eaf0;padding:21px 18px 26px"><a href="mailto:hello@halonap.com" style="color:#203657;font-size:13px;text-decoration:none">hello@halonap.com</a><div style="font-size:12px;line-height:20px;color:#758096;margin-top:9px">© HALONAP · Better sleep, brighter days.</div></td></tr></table></td></tr></table></body></html>`;
 const text=['Hello '+name+',','','Your HALONAP order has been dispatched.','Order reference: '+ref,...lines,...(tracking?['Tracking number: '+tracking]:[]),'','Questions? Reply to this email with your order reference.','','Sleep well,','HALONAP Customer Care','https://halonap.com'].join('\n');
 return {subject:'Your HALONAP order is on its way ('+ref+')',html,text};
}

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
  await requireAdmin(req);
  const {action,order_id,resend}=req.body||{};
  if(action==='checkout_stats')return res.status(200).json(await checkoutStats());
  if(action!=='notify_dispatch'||!/^[-0-9a-f]{36}$/i.test(order_id||''))return res.status(400).json({error:'Invalid request'});
  const rows=await database('customer_orders?select=id,order_number,items,customer_name,customer_email,tracking_number,fulfillment_status,dispatch_email_sent_at&id=eq.'+encodeURIComponent(order_id));
  if(rows.length!==1)return res.status(404).json({error:'Order not found'});
  const order=rows[0];
  if(order.fulfillment_status!=='dispatched')return res.status(409).json({error:'Order is not marked as dispatched'});
  if(!order.customer_email)return res.status(409).json({error:'Order has no customer email'});
  if(order.dispatch_email_sent_at&&resend!==true)return res.status(200).json({sent:false,already_sent_at:order.dispatch_email_sent_at});
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
   const mail=dispatchEmail(order);
   await transport.sendMail({from:{name:'HALONAP Customer Care',address:SMTP_USER},to:order.customer_email,replyTo:'hello@halonap.com',...mail});
  }catch(err){
   await database('customer_orders?id=eq.'+encodeURIComponent(order.id),{method:'PATCH',body:JSON.stringify({dispatch_email_sent_at:previous})}).catch(()=>{});
   console.error('Dispatch email failed',err?.code||err?.message);
   return res.status(502).json({error:'Dispatch email could not be sent. Try again.'});
  }
  return res.status(200).json({sent:true,sent_at:now});
 }catch(error){return res.status(error.status||502).json({error:error.message});}
}
