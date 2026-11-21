import test from 'node:test';
import assert from 'node:assert/strict';
import webpush from 'web-push';
import {notifyPaidOrder} from '../lib/order-push.js';

test('paid order retries only deliver once and omit customer details',async t=>{
 process.env.SUPABASE_SERVICE_ROLE_KEY='mock';
 let claimed=false;
 const sent=[];
 t.mock.method(global,'fetch',async url=>{
  let data=null;
  if(url.includes('order_push_devices?'))data=[{endpoint:'https://example.test',subscription:{}}];
  if(url.includes('order_push_keys?'))data=[{keys:webpush.generateVAPIDKeys()}];
  if(url.includes('rpc/claim_order_push')){data=!claimed;claimed=true}
  return Response.json(data);
 });
 t.mock.method(webpush,'sendNotification',async (_device,payload)=>sent.push(JSON.parse(payload)));
 const row={items:[{quantity:2}],total_pence:2598,currency:'gbp',order_number:'pi_12345678',customer_name:'Private Name'};
 for(let attempt=0;attempt<2;attempt++)await notifyPaidOrder('order-id',row,new Date().toISOString());
 assert.deepEqual(sent,[{id:'order-id',body:'Order #12345678 · £25.98 paid · 2 items · Ready to pack'}]);
});

test('disconnect only deletes the selected device owned by the admin',async t=>{
 const {manageDevices}=await import('../lib/order-push.js');
 process.env.SUPABASE_SERVICE_ROLE_KEY='mock';
 const endpoint='https://web.push.apple.com/device-a', deleted=[];
 t.mock.method(global,'fetch',async(url,options)=>{
  assert.match(url,/admin_id=eq.admin-a/);
  if(options.method==='DELETE'){deleted.push(url);return new Response(null,{status:204})}
  return Response.json([{endpoint,enrolled_at:'2026-11-21T10:00:00Z'}]);
 });
 const admin={id:'admin-a'};
 const {devices}=await manageDevices('push_devices',{currentEndpoint:endpoint},admin);
 assert.equal(devices[0].current,true);
 assert.ok(!JSON.stringify(devices).includes(endpoint));
 await manageDevices('push_disconnect',{deviceId:'another-device'},admin);
 assert.equal(deleted.length,0);
 await manageDevices('push_disconnect',{deviceId:devices[0].id},admin);
 assert.equal(deleted.length,1);
 assert.ok(deleted[0].includes(encodeURIComponent(endpoint)));
});
