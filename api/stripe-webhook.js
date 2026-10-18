export const config = { api: { bodyParser: false } };
import crypto from 'node:crypto';
const SUPABASE='https://ufhobvpuwhainuheewxb.supabase.co';
const PRICES={price_1URLHq24vjMaecFfE01eVMSh:'Black',price_1URNCd24vjMaecFfShkLBUKY:'Pink',price_1URNGr24vjMaecFfnovZJiLp:'Grey'};
async function rawBody(req){if(Buffer.isBuffer(req.body))return req.body;if(typeof req.body==='string')return Buffer.from(req.body);const parts=[];for await(const chunk of req)parts.push(Buffer.from(chunk));return Buffer.concat(parts)}
function verified(payload,header,secret){const fields=Object.fromEntries((header||'').split(',').map(p=>p.split('=')));const t=Number(fields.t);if(!t||Math.abs(Date.now()/1000-t)>300)return false;const expected=crypto.createHmac('sha256',secret).update(t+'.'+payload.toString('utf8')).digest('hex');return (header||'').split(',').some(part=>{if(!part.startsWith('v1='))return false;const actual=part.slice(3);return actual.length===expected.length&&crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected))})}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();
 const signing=process.env.STRIPE_WEBHOOK_SECRET,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!signing||!key||!process.env.STRIPE_SECRET_KEY)return res.status(503).send('Webhook not configured');
 const raw=await rawBody(req);if(!verified(raw,req.headers['stripe-signature'],signing))return res.status(400).send('Invalid signature');
 let event;try{event=JSON.parse(raw.toString('utf8'))}catch{return res.status(400).end()}
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return res.status(200).json({received:true});
 const session=event.data?.object;
 if(session?.payment_status!=='paid')return res.status(200).json({received:true});
 try{
  const request=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(session.id)+'/line_items?limit=100',{headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY}});
  if(!request.ok)throw Error('Stripe line items unavailable');
  const lines=(await request.json()).data||[];
  const items=lines.map(i=>({colour:PRICES[i.price?.id]||i.description||'Mask',quantity:i.quantity||1}));
  const address=session.collected_information?.shipping_details||session.shipping_details||{};
  const customer=session.customer_details||{};
  const userId=session.metadata?.supabase_user_id||session.client_reference_id;
  if(userId&&!/^[0-9a-f-]{36}$/i.test(userId))throw Error('Invalid customer reference');
  const row={user_id:userId||null,stripe_session_id:session.id,order_number:session.payment_intent||session.id,items,total_pence:session.amount_total||0,currency:session.currency||'gbp',payment_status:'paid',customer_name:address.name||customer.name||null,customer_email:customer.email||null,customer_phone:customer.phone||null,shipping_address:address.address||null};
  const result=await fetch(SUPABASE+'/rest/v1/customer_orders?on_conflict=stripe_session_id',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(row)});
  if(!result.ok)throw Error('Order save failed: '+result.status);
  return res.status(200).json({received:true});
 }catch(error){console.error('Order webhook:',error.message);return res.status(500).send('Retry later')}
}