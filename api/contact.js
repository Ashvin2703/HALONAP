import nodemailer from 'nodemailer';

const SUPABASE_URL = 'https://ufhobvpuwhainuheewxb.supabase.co';
const TOPICS = new Set(['General enquiry','Order tracking','Returns','Product question']);
const recent = new Map();
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
    await transport.sendMail({from:{name:'HALONAP Contact Form',address:SMTP_USER},to:'hello@halonap.com',replyTo:record.email,subject:'HALONAP contact: '+record.topic+' ['+ticketId+']',text:['New contact form message','Reference: '+ticketId,'Name: '+record.name,'Email: '+record.email,'Order: '+(record.order_number||'Not provided'),'Topic: '+record.topic,'','Message:',record.message].join('\n')});
    notified=true;
    try{
      await transport.sendMail({from:{name:'HALONAP Customer Care',address:SMTP_USER},to:record.email,replyTo:'hello@halonap.com',subject:'We received your message | '+ticketId,text:['Hello '+record.name+',','','Thank you for contacting HALONAP. We have received your enquiry.','Your reference number: '+ticketId,'Topic: '+record.topic,'','Our customer care team will review your message and respond as soon as possible.','If you need to add information, reply to this email and include your reference number.','','Better sleep, brighter days.','HALONAP Customer Care','https://halonap.com'].join('\n')});
      acknowledged=true;
    }catch(err){console.error('Customer acknowledgement failed',err?.code||err?.message);}

  }catch(err){console.error('Contact notification failed',err?.code||err?.message);}
  return res.status(200).json({saved:true,notified,acknowledged,reference:ticketId});
}
