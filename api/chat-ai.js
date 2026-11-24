import Anthropic from '@anthropic-ai/sdk';
import {database} from '../lib/commerce.js';
import {runChat} from '../lib/chat-agent.js';

// POST {history:[{role,text}]} -> {reply, handoff, actions}. 503 {fallback:true} tells the browser to use
// the free keyword bot instead (no API key yet, or Claude unavailable).
const hits=new Map();   // per-instance soft limit; add a Vercel Firewall rate limit on /api/chat-ai for a hard one
function limited(ip){
 const now=Date.now(),list=(hits.get(ip)||[]).filter(t=>now-t<10*60*1000);list.push(now);hits.set(ip,list);
 if(hits.size>5000)hits.clear();
 return list.length>40;
}
let settingsCache={at:0,data:null};
async function settings(){
 if(Date.now()-settingsCache.at<60000)return settingsCache.data;
 try{const rows=await database('store_settings?select=price_pence,price_compare_at_pence,standard_delivery_pence,express_delivery_pence,free_delivery_threshold_pence,shop_paused&id=eq.true');settingsCache={at:Date.now(),data:rows?.[0]||null}}catch{}
 return settingsCache.data;
}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end()}
 if(!process.env.ANTHROPIC_API_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({fallback:true});
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim();
 if(limited(ip))return res.status(429).json({error:'You’re sending messages very quickly. Please wait a moment, or email hello@halonap.com.'});
 const history=Array.isArray(req.body?.history)?req.body.history.slice(-16):[];
 try{
  const out=await runChat(history,{settings:await settings()});
  return res.status(200).json(out);
 }catch(err){
  if(err.status===400&&!(err instanceof Anthropic.APIError))return res.status(400).json({error:err.message});
  console.error('Chat AI unavailable:',err instanceof Anthropic.APIError?err.status:'',err.message);
  return res.status(503).json({fallback:true});   // browser falls back to the keyword bot
 }
}
