import webpush from 'web-push';
import {database} from './commerce.js';

async function signingKeys() {
 const read = async () => (await database('order_push_keys?select=keys'))[0]?.keys;
 const existing = await read();
 if (existing) return existing;
 await database('order_push_keys', {method:'POST', headers:{Prefer:'resolution=ignore-duplicates'}, body:JSON.stringify({singleton:true,keys:webpush.generateVAPIDKeys()})});
 return read();
}

function validate(subscription) {
 const url = new URL(subscription.endpoint);
 const hosts = ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'];
 if (url.protocol !== 'https:' || url.port || url.username || url.password ||
     !(hosts.includes(url.hostname) || url.hostname.endsWith('.push.apple.com') || url.hostname.endsWith('.notify.windows.com')) ||
     Buffer.from(subscription.keys.p256dh,'base64url').length !== 65 ||
     Buffer.from(subscription.keys.auth,'base64url').length !== 16) throw Error('Unsupported push subscription');
}

function send(subscription, payload, keys) {
 return webpush.sendNotification(subscription,JSON.stringify(payload),{timeout:8000,TTL:86400,
  vapidDetails:{subject:'mailto:hello@halonap.com',publicKey:keys.publicKey,privateKey:keys.privateKey}});
}

export async function pushSettings(action,subscription,user) {
 const keys=await signingKeys();
 if(action==='push_key')return {key:keys.publicKey};
 try {validate(subscription)} catch {throw Object.assign(Error('Invalid push subscription'),{status:400})}
 await database('order_push_devices',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({
  endpoint:subscription.endpoint,admin_id:user.id,subscription:{endpoint:subscription.endpoint,keys:subscription.keys}
 })});
 await send(subscription,{body:'Order alerts are enabled on this device.'},keys);
 return {enabled:true};
}

export async function notifyPaidOrder(id,row,createdAt) {
 const devices=await database('order_push_devices?select=endpoint,subscription&enrolled_at=lte.'+encodeURIComponent(createdAt));
 if(!devices.length)return;
 const keys=await signingKeys();
 const count=row.items.reduce((n,i)=>n+i.quantity,0);
 const amount=new Intl.NumberFormat('en-GB',{style:'currency',currency:row.currency}).format(row.total_pence/100);
 const payload={id,body:'Order #'+row.order_number.slice(-8)+' · '+amount+' paid · '+count+' item'+(count===1?'':'s')+' · Ready to pack'};
 for(const device of devices){
  const filter='endpoint=eq.'+encodeURIComponent(device.endpoint);
  const delivery='order_push_deliveries?order_id=eq.'+encodeURIComponent(id)+'&'+filter;
  if(!await database('rpc/claim_order_push',{method:'POST',body:JSON.stringify({p_order:id,p_endpoint:device.endpoint})}))continue;
  try {await send(device.subscription,payload,keys)}
  catch(err){
   if([404,410].includes(err.statusCode)){await database('order_push_devices?'+filter,{method:'DELETE'});continue}
   await database(delivery,{method:'DELETE'});throw Error('Order alert delivery needs retry');
  }
  await database(delivery,{method:'PATCH',body:JSON.stringify({sent:true})});
 }
}
