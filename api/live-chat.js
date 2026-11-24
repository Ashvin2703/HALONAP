import crypto from 'node:crypto';
import {database} from '../lib/commerce.js';
import {notifyLiveChat} from '../lib/order-push.js';

// Customer side of HALONAP live chat. No sign-in: each chat gets a random secret that only the
// customer's browser holds; we store its SHA-256. Admins reply from Admin Studio (RLS).
export const RING_EVERY_MS=15000;           // while a customer waits, admin devices ring again this often
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sha=v=>crypto.createHash('sha256').update(String(v)).digest('hex');
const text=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,max):'';
const fail=(status,message)=>Object.assign(Error(message),{status});

async function loadChat(id,token){
 if(!UUID.test(id||'')||typeof token!=='string'||token.length<20||token.length>200)throw fail(403,'Chat not found');
 const rows=await database('live_chats?select=id,status,agent_name,token_hash,customer_name,topic&id=eq.'+id);
 const chat=rows?.[0];
 if(!chat)throw fail(403,'Chat not found');
 const a=Buffer.from(sha(token)),b=Buffer.from(chat.token_hash);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))throw fail(403,'Chat not found');
 return chat;
}

// Ring every admin device, at most once per RING_EVERY_MS per chat. The PATCH only succeeds for the
// first caller in each window, so parallel polls never double-ring.
export async function ring(chat,now=Date.now()){
 const cutoff=new Date(now-RING_EVERY_MS).toISOString();
 const claimed=await database('live_chats?id=eq.'+chat.id+'&status=eq.waiting&or=(last_ring_at.is.null,last_ring_at.lt.'+encodeURIComponent(cutoff)+')&select=id',
  {method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({last_ring_at:new Date(now).toISOString()})});
 if(!claimed?.length)return false;
 try{await notifyLiveChat(chat.id,chat.customer_name,chat.topic)}catch(err){console.error('Live chat ring:',err.message)}
 return true;
}

async function messagesAfter(id,after){
 const from=Number.isSafeInteger(after)&&after>0?after:0;
 return database('live_chat_messages?select=id,sender,body,created_at&chat_id=eq.'+id+'&id=gt.'+from+'&order=id.asc&limit=200');
}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end()}
 try{
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw fail(503,'Live chat is not available right now');
  const body=req.body||{};const action=body.action;

  if(action==='start'){
   // Customers connect without a form, so the name is optional.
   const name=text(body.name,120)||'Website customer',email=text(body.email,254),topic=text(body.topic,80);
   if(email&&!EMAIL.test(email))throw fail(400,'Please check your email address');
   const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim();
   const ipHash=ip?sha('halonap-chat:'+ip):null;
   if(ipHash){
    const since=new Date(Date.now()-10*60*1000).toISOString();
    const recent=await database('live_chats?select=id&ip_hash=eq.'+ipHash+'&created_at=gt.'+encodeURIComponent(since));
    if(recent.length>=3)throw fail(429,'Too many chats started. Please wait a few minutes or email hello@halonap.com.');
   }
   const token=crypto.randomBytes(24).toString('base64url');
   const [chat]=await database('live_chats',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({token_hash:sha(token),customer_name:name,customer_email:email||null,topic:topic||null,ip_hash:ipHash})});
   // Keep what the customer already told the bot, so the agent has context when they answer.
   const transcript=(Array.isArray(body.transcript)?body.transcript:[]).slice(-30)
    .map(m=>({sender:m?.sender==='bot'?'bot':'customer',body:text(m?.body,2000)})).filter(m=>m.body);
   const rows=[...transcript,{sender:'system',body:name+' asked to talk to a person'+(topic?' about '+topic:'')+'.'}].map(m=>({chat_id:chat.id,...m}));
   await database('live_chat_messages',{method:'POST',body:JSON.stringify(rows)});
   await ring(chat);
   return res.status(200).json({chat_id:chat.id,token,status:'waiting'});
  }

  const chat=await loadChat(body.chat_id,body.token);

  if(action==='poll'){
   await database('live_chats?id=eq.'+chat.id,{method:'PATCH',body:JSON.stringify({customer_seen_at:new Date().toISOString()})});
   if(chat.status==='waiting')await ring(chat);
   const messages=await messagesAfter(chat.id,body.after);
   return res.status(200).json({status:chat.status,agent_name:chat.agent_name,messages});
  }
  if(action==='send'){
   if(chat.status==='closed')throw fail(409,'This chat has ended');
   const message=text(body.body,2000);
   if(!message)throw fail(400,'Type a message first');
   const [row]=await database('live_chat_messages',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({chat_id:chat.id,sender:'customer',body:message})});
   return res.status(200).json({message:row});
  }
  if(action==='close'){
   if(chat.status!=='closed'){
    await database('live_chats?id=eq.'+chat.id,{method:'PATCH',body:JSON.stringify({status:'closed',closed_at:new Date().toISOString(),closed_by:'customer'})});
    await database('live_chat_messages',{method:'POST',body:JSON.stringify({chat_id:chat.id,sender:'system',body:'The customer left the chat.'})});
   }
   return res.status(200).json({status:'closed'});
  }
  throw fail(400,'Invalid request');
 }catch(err){
  const status=err.status||502;
  if(status>=500)console.error('Live chat:',err.message);
  return res.status(status).json({error:status>=500?'Live chat is busy. Please try again, or email hello@halonap.com.':err.message});
 }
}
