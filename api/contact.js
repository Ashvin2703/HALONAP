import nodemailer from 'nodemailer';
import {enquiryReceivedEmail} from '../lib/customer-emails.js';

const SUPABASE_URL = 'https://ufhobvpuwhainuheewxb.supabase.co';
const TOPICS = new Set(['General enquiry','Order tracking','Returns','Product question']);
const recent = new Map();
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notificationHtml(record,ticket){
 const name=escapeHtml(record.name),email=escapeHtml(record.email),order=escapeHtml(record.order_number||'Not provided'),topic=escapeHtml(record.topic),message=escapeHtml(record.message).replace(/\r\n|\r|\n/g,'<br>'),ref=escapeHtml(ticket);
 const replyUrl='mailto:'+encodeURIComponent(record.email)+'?subject='+encodeURIComponent('Re: HALONAP enquiry ['+ticket+']');
 const row=(label,value)=>'<tr><td style="padding:10px 0;color:#667085;font-size:13px;width:95px;vertical-align:top;border-bottom:1px solid #edf0f4">'+label+'</td><td style="padding:10px 0;color:#203657;font-size:14px;font-weight:600;overflow-wrap:anywhere;border-bottom:1px solid #edf0f4">'+value+'</td></tr>';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#203657"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e8ee;border-radius:10px;overflow:hidden"><tr><td align="center" style="background:#ffffff;padding:22px 18px;border-bottom:1px solid #e8eaf0"><div style="font-size:24px;line-height:30px;font-weight:700;letter-spacing:3px"><span style="color:#203657">HAL</span><span style="color:#b58b35">O</span><span style="color:#203657">NAP</span></div><div style="font-size:10px;letter-spacing:1px;color:#947538;margin-top:5px">BETTER SLEEP, BRIGHTER DAYS.</div></td></tr><tr><td style="padding:26px 24px 24px"><div style="font-size:11px;letter-spacing:1.2px;font-weight:700;color:#a18345">CUSTOMER SUPPORT</div><h1 style="font-size:22px;line-height:29px;margin:9px 0 7px;color:#203657">New Customer Enquiry</h1><p style="font-size:13px;line-height:20px;color:#667085;margin:0 0 21px">A message was submitted through halonap.com.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fa;border:1px solid #e6e9ef;border-radius:6px"><tr><td style="padding:15px 16px"><div style="font-size:11px;font-weight:700;letter-spacing:.7px;color:#667085">REFERENCE</div><div style="font-size:18px;line-height:25px;font-weight:700;margin-top:5px;color:#203657;overflow-wrap:anywhere">${ref}</div></td><td align="right" style="padding:15px 16px;vertical-align:top"><span style="font-size:11px;font-weight:700;color:#8a6b27;background:#fff3cf;padding:5px 9px;border-radius:4px">NEW</span></td></tr></table><h2 style="font-size:15px;margin:24px 0 7px;color:#203657">Customer details</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${row('Name',name)}${row('Email','<a href="mailto:'+encodeURIComponent(record.email)+'" style="color:#203657;text-decoration:underline">'+email+'</a>')}${row('Topic',topic)}${row('Order',order)}</table><h2 style="font-size:15px;margin:24px 0 10px;color:#203657">Message</h2><div style="background:#f6f7fa;border-radius:5px;padding:15px 16px;font-size:14px;line-height:22px;color:#26354e;overflow-wrap:anywhere">${message}</div><table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:23px"><tr><td bgcolor="#203657" style="border-radius:5px"><a href="${replyUrl}" style="display:inline-block;padding:13px 19px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">Reply to Customer</a></td></tr></table><p style="font-size:12px;line-height:19px;color:#667085;margin:15px 0 0">You can also use Reply in your email app. The customer's address is set as Reply-To.</p></td></tr><tr><td align="center" style="padding:17px;border-top:1px solid #e8eaf0;color:#7b8597;font-size:11px">HALONAP Customer Support · Internal notification</td></tr></table></td></tr></table></body></html>`;
}
const valid = (v,max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const origin=req.headers.origin;
  if(origin && !['https://halonap.com','https://www.halonap.com'].includes(origin))return res.status(403).json({error:'Invalid origin'});
  if(Number(req.headers['content-length']||0)>12000)return res.status(413).json({error:'Request too large'});
  const {name,email,order_number,topic,message}=req.body||{};
  if(!valid(name,120)||!valid(email,254)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!valid(message,3000)||!TOPICS.has(topic)|| (order_number!=null && (typeof order_number!=='string'||order_number.length>80)))return res.status(400).json({error:'Please check your contact details and message.'});
  const now=Date.now(),key=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim()+'|'+email.toLowerCase();
  if(now-(recent.get(key)||0)<60000)return res.status(429).json({error:'Please wait a minute before sending another message.'});
  recent.set(key,now);
  if(recent.size>2000)for(const [k,t] of recent)if(now-t>120000)recent.delete(k);
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'Contact service temporarily unavailable.'});
  const record={name:name.trim(),email:email.trim(),order_number:order_number?.trim()||null,topic,message:message.trim()};
  let ticketId=null;
  try{
    const response=await fetch(SUPABASE_URL+'/rest/v1/customer_messages?select=id',{
      method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(record),signal:AbortSignal.timeout(9000)
    });
    if(!response.ok){console.error('Contact database insert failed',response.status);return res.status(503).json({error:'Unable to save your message. Please try again.'});}
    const saved=await response.json();
    if(!Array.isArray(saved)||!saved[0]?.id)throw new Error('Missing message reference');
    ticketId='HN-'+String(saved[0].id).replace(/-/g,'').slice(0,10).toUpperCase();
  }catch(err){console.error('Contact database unavailable',err?.message);return res.status(503).json({error:'Unable to save your message. Please try again.'});}
  let notified=false,acknowledged=false;
  try{
    const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD,SMTP_SECURE}=process.env;
    if(!SMTP_HOST||!SMTP_USER||!SMTP_PASSWORD)throw new Error('SMTP configuration incomplete');
    const transport=nodemailer.createTransport({host:SMTP_HOST,port:Number(SMTP_PORT||465),secure:SMTP_SECURE==='true',auth:{user:SMTP_USER,pass:SMTP_PASSWORD},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000});
    await transport.sendMail({from:{name:'HALONAP Contact Form',address:SMTP_USER},to:'hello@halonap.com',replyTo:record.email,subject:'HALONAP contact: '+record.topic+' ['+ticketId+']',html:notificationHtml(record,ticketId),text:['New contact form message','Reference: '+ticketId,'Name: '+record.name,'Email: '+record.email,'Order: '+(record.order_number||'Not provided'),'Topic: '+record.topic,'','Message:',record.message].join('\n')});
    notified=true;
    try{
      await transport.sendMail({from:{name:'HALONAP Customer Care',address:SMTP_USER},to:record.email,replyTo:'hello@halonap.com',...enquiryReceivedEmail(record.name,record.topic,ticketId)});
      acknowledged=true;
    }catch(err){console.error('Customer acknowledgement failed',err?.code||err?.message);}

  }catch(err){console.error('Contact notification failed',err?.code||err?.message);}
  return res.status(200).json({saved:true,notified,acknowledged,reference:ticketId});
}
