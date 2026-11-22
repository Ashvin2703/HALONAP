import {ImapFlow} from 'imapflow';
import {simpleParser} from 'mailparser';
import {database,requireAdmin,stripe} from '../lib/commerce.js';
import {mailer} from '../lib/customer-emails.js';

const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function invalid(message){throw Object.assign(new Error(message),{status:400})}

async function syncInbox(before){
 const {IMAP_HOST,IMAP_USER,IMAP_PASSWORD,SMTP_HOST,SMTP_USER,SMTP_PASSWORD}=process.env;
 const neo=/^smtp\d*\.neo\.space$/i.test(SMTP_HOST||'');
 const user=IMAP_USER||(neo?SMTP_USER:null);
 const pass=IMAP_PASSWORD||(neo?SMTP_PASSWORD:null);
 if(user?.toLowerCase()!=='hello@halonap.com'||!pass||(!IMAP_HOST&&!neo))throw Error('Configure IMAP access for hello@halonap.com in the deployment settings.');
 const client=new ImapFlow({host:IMAP_HOST||'imap0001.neo.space',port:993,secure:true,auth:{user,pass},logger:false,connectionTimeout:8000,socketTimeout:15000});
 try{
  await client.connect();
  const box=await client.mailboxOpen('INBOX',{readOnly:true});
  if(!box.exists)return {older:null};
  if(before!=null&&(!Number.isSafeInteger(before)||before<2))invalid('Invalid mailbox cursor');
  const end=before?Math.min(before-1,box.exists):box.exists;
  const start=Math.max(1,end-14);
  const rows=[];
  for await(const m of client.fetch(start+':'+end,{uid:true,envelope:true,internalDate:true,source:{start:0,maxLength:180000}})){
   const sender=m.envelope.from?.[0]?.address;
   if(!sender)continue;
   const parsed=await simpleParser(m.source,{skipImageLinks:true,skipHtmlToText:false});
   rows.push({source_key:String(box.uidValidity)+'/'+m.uid,email:sender.toLowerCase(),subject:m.envelope.subject||'(No subject)',body:(parsed.text||'(No text preview)').slice(0,24000),message_id:m.envelope.messageId||null,created_at:new Date(m.internalDate).toISOString()});
  }
  if(rows.length)await database('support_inbox?on_conflict=source_key',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify(rows)});
  return {older:start>1?start:null};
 }finally{client.close()}
}
async function reply(body){
 if(!uuid.test(body.sourceId)||!uuid.test(body.requestId)||typeof body.text!=='string'||!body.text.trim()||body.text.length>12000)invalid('Invalid reply');
 const inbox=body.source==='inbox';
 if(!inbox&&body.source!=='form')invalid('Invalid message source');
 const [source]=await database((inbox?'support_inbox?select=email,subject,message_id':'customer_messages?select=email,topic')+'&id=eq.'+body.sourceId);
 if(!source)invalid('Message no longer available');
 const send=mailer();if(!send)throw Error('Outbound mail is not configured');
 const subject='Re: '+(source.subject||source.topic||'HALONAP enquiry').replace(/^re:\s*/i,'');
 const data={id:body.requestId,email:source.email,subject,body:body.text.trim()};
 const inserted=await database('support_replies',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(data)});
 if(!inserted.length){
  const [prior]=await database('support_replies?select=state&id=eq.'+body.requestId);
  if(prior?.state==='sent')return {sent:true};
  throw Error('Delivery is unconfirmed. Check the conversation before sending again.');
 }
 await send({to:{address:source.email,name:''},subject,text:data.body,inReplyTo:source.message_id||undefined,references:source.message_id||undefined,messageId:'<'+data.id+'@halonap.com>'});
 await database('support_replies?id=eq.'+data.id,{method:'PATCH',body:JSON.stringify({state:'sent'})});
 return {sent:true};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).end();
 try{
  await requireAdmin(req);
  const body=req.body||{};
  if(body.action==='sync_inbox')return res.json(await syncInbox(body.before));
  if(body.action==='reply')return res.json(await reply(body));
  if(body.action==='delivery_amounts'){
   if(!Array.isArray(body.ids)||body.ids.length>20||!body.ids.length||!body.ids.every(id=>uuid.test(id)))invalid('Invalid export batch');
   const orders=await database('customer_orders?select=id,stripe_session_id&id=in.('+body.ids.join(',')+')');
   const shipping={};
   for(const order of orders){
    if(!order.stripe_session_id){shipping[order.id]=null;continue}
    const session=await stripe('checkout/sessions/'+encodeURIComponent(order.stripe_session_id));
    shipping[order.id]=session.shipping_cost?.amount_total??session.total_details?.amount_shipping??null;
   }
   return res.json({shipping});
  }
  invalid('Unknown action');
 }catch(err){return res.status(err.status||502).json({error:err.authenticationFailed?'Mailbox sign-in failed. Check Neo third-party access and mailbox credentials.':err.message})}
}
