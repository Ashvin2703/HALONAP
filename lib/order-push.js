import {createHash} from 'node:crypto';
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

export async function manageDevices(action,body,user) {
 const owner='admin_id=eq.'+encodeURIComponent(user.id);
 const rows=await database('order_push_devices?select=endpoint,enrolled_at&order=enrolled_at.desc&'+owner);
 const idFor=endpoint=>createHash('sha256').update(endpoint).digest('hex');
 if(action==='push_disconnect'){
  const match=rows.find(row=>idFor(row.endpoint)===body.deviceId);
  if(match)await database('order_push_devices?'+owner+'&endpoint=eq.'+encodeURIComponent(match.endpoint),{method:'DELETE'});
  return {disconnected:true};
 }
 return {devices:rows.map(({endpoint,enrolled_at})=>({
  id:idFor(endpoint),added:enrolled_at,current:endpoint===body.currentEndpoint,
  label:new URL(endpoint).hostname.endsWith('.apple.com')?'Apple device':'Browser device'
 }))};
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

// Live chat: ring every admin device that has alerts turned on. Called again every few seconds
// while the customer waits (see api/live-chat.js), so phones and laptops keep ringing until someone answers.
export async function notifyLiveChat(chatId,name,topic) {
 const devices=await database('order_push_devices?select=endpoint,subscription');
 if(!devices.length)return 0;
 const keys=await signingKeys();
 const payload={kind:'chat',id:chatId,body:(name||'A customer')+' wants to talk'+(topic?' about '+topic:'')+'. Tap to answer.'};
 let sent=0;
 for(const device of devices){
  try{await send(device.subscription,payload,keys);sent++}
  catch(err){if([404,410].includes(err.statusCode))await database('order_push_devices?endpoint=eq.'+encodeURIComponent(device.endpoint),{method:'DELETE'})}
 }
 return sent;
}
