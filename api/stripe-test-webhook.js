export const config={api:{bodyParser:false}};
import crypto from 'node:crypto';
const BASE='https://ufhobvpuwhainuheewxb.supabase.co';
const PRICES={};
async function body(req){const chunks=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));return Buffer.concat(chunks)}
function valid(raw,header,secret){const parts=(header||'').split(',');const ts=Number(parts.find(x=>x.startsWith('t='))?.slice(2));if(!ts||Math.abs(Date.now()/1000-ts)>300)return false;const expected=crypto.createHmac('sha256',secret).update(ts+'.'+raw.toString()).digest('hex');return parts.some(p=>{if(!p.startsWith('v1='))return false;const sig=p.slice(3);return sig.length===expected.length&&crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))})}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();
 const secret=process.env.STRIPE_TEST_WEBHOOK_SECRET,key=process.env.SUPABASE_SERVICE_ROLE_KEY,stripe=process.env.STRIPE_TEST_SECRET_KEY;
 if(!secret||!key||!stripe||!stripe.startsWith('sk_test_'))return res.status(503).send('Test webhook not configured');
 const raw=await body(req);if(!valid(raw,req.headers['stripe-signature'],secret))return res.status(400).send('Invalid signature');
 let event;try{event=JSON.parse(raw.toString())}catch{return res.status(400).end()}
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return res.status(200).json({received:true});
 const session=event.data?.object;
 if(!session?.id?.startsWith('cs_test_')||session.livemode!==false||session.payment_status!=='paid')return res.status(200).json({received:true});
 try{
  const result=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(session.id)+'/line_items?limit=100',{headers:{Authorization:'Bearer '+stripe}});
  if(!result.ok)throw Error('Unable to retrieve test items');
  const lines=(await result.json()).data||[];
  const items=lines.map(line=>({colour:line.description?.includes('Black')?'Black':line.description?.includes('Pink')?'Pink':line.description?.includes('Grey')?'Grey':null,quantity:line.quantity}));
  if(items.some(x=>!x.colour))throw Error('Unknown test product');
  const saved=await fetch(BASE+'/rest/v1/rpc/record_halonap_test_payment',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_session:session.id,p_items:items,p_amount:session.amount_total})});
  if(!saved.ok)throw Error('Test order save failed '+saved.status);
  return res.status(200).json({received:true});
 }catch(e){console.error('Test webhook:',e.message);return res.status(500).send('Retry later')}
}