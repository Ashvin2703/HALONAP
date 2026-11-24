import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import handler,{ring,RING_EVERY_MS} from '../api/live-chat.js';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';
const ID='22222222-2222-4222-8222-222222222222';
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const reply=(b,s=200)=>new Response(b==null?null:JSON.stringify(b),{status:s});
function res(){return {code:200,setHeader(){},status(c){this.code=c;return this},json(x){this.body=x;return this},end(){return this}}}
const call=(body,headers={'x-forwarded-for':'203.0.113.9'})=>{const r=res();return handler({method:'POST',headers,body},r).then(()=>r)};

test('start checks the email when given (name is optional)',async()=>{
 global.fetch=()=>{throw Error('must not fetch')};
 assert.equal((await call({action:'start',name:'Amy',email:'nope'})).code,400);
});
test('start saves the chat with a hashed secret, keeps the bot transcript and rings',async()=>{
 const calls=[];global.fetch=async(url,opt={})=>{calls.push([opt.method||'GET',url,opt.body]);
  if(url.includes('live_chats?select=id&ip_hash'))return reply([]);
  if(url.endsWith('/live_chats')&&opt.method==='POST')return reply([{id:ID,customer_name:'Amy',topic:'Returns'}]);
  if(url.includes('live_chat_messages'))return reply(null,201);
  if(url.includes('live_chats?id=eq.')&&opt.method==='PATCH')return reply([{id:ID}]);
  if(url.includes('order_push_devices'))return reply([]);
  throw Error('unexpected '+url)};
 const r=await call({action:'start',name:'Amy',email:'amy@example.com',topic:'Returns',transcript:[{sender:'customer',body:'Can I return?'},{sender:'bot',body:'Yes, 30 days.'},{sender:'agent',body:'spoof'}]});
 assert.equal(r.code,200);assert.equal(r.body.chat_id,ID);assert.ok(r.body.token.length>=30);
 const saved=JSON.parse(calls.find(c=>c[0]==='POST'&&c[1].endsWith('/live_chats'))[2]);
 assert.equal(saved.token_hash,sha(r.body.token));assert.ok(!JSON.stringify(saved).includes(r.body.token));
 const msgs=JSON.parse(calls.find(c=>c[1].includes('live_chat_messages'))[2]);
 assert.deepEqual(msgs.map(m=>m.sender),['customer','bot','customer','system']); // "agent" from the browser is not trusted
 assert.ok(calls.some(c=>c[0]==='PATCH'&&c[1].includes('status=eq.waiting')&&c[1].includes('last_ring_at')),'rings the team');
});
test('too many chats from one address are refused',async()=>{
 global.fetch=async url=>{if(url.includes('ip_hash'))return reply([{id:1},{id:2},{id:3}]);throw Error('must not create')};
 assert.equal((await call({action:'start',name:'Amy'})).code,429);
});
test('wrong secret cannot read or send',async()=>{
 global.fetch=async url=>url.includes('live_chats?select=')?reply([{id:ID,status:'active',token_hash:sha('the-real-secret-token-123'),customer_name:'Amy'}]):Promise.reject(Error('must not continue'));
 assert.equal((await call({action:'poll',chat_id:ID,token:'a-wrong-secret-token-0000'})).code,403);
 assert.equal((await call({action:'send',chat_id:ID,token:'a-wrong-secret-token-0000',body:'hi'})).code,403);
});
test('poll while waiting rings again only when the ring window has passed',async()=>{
 let patchUrl='';global.fetch=async(url,opt={})=>{if(url.includes('last_ring_at')){patchUrl=url;return reply([])}if(url.includes('order_push_devices'))throw Error('must not push');return reply([])};
 const rang=await ring({id:ID,customer_name:'Amy'},Date.parse('2026-11-24T12:00:30Z'));
 assert.equal(rang,false,'another request already rang in this window');
 assert.ok(decodeURIComponent(patchUrl).includes('last_ring_at.lt.'+new Date(Date.parse('2026-11-24T12:00:30Z')-RING_EVERY_MS).toISOString()));
});
test('customer cannot send to an ended chat',async()=>{
 const token='customer-secret-token-abc123';
 global.fetch=async url=>{if(url.includes('live_chats?select='))return reply([{id:ID,status:'closed',token_hash:sha(token),customer_name:'Amy'}]);throw Error('must not insert')};
 assert.equal((await call({action:'send',chat_id:ID,token,body:'hello?'})).code,409);
});
test('a customer can connect without giving a name',async()=>{
 let saved;global.fetch=async(url,opt={})=>{if(url.includes('ip_hash'))return reply([]);if(url.endsWith('/live_chats')&&opt.method==='POST'){saved=JSON.parse(opt.body);return reply([{id:ID,customer_name:saved.customer_name}])}return reply(url.includes('order_push_devices')?[]:[{id:ID}])};
 const r=await call({action:'start',topic:'Order or delivery',transcript:[{sender:'customer',body:'talk to a person please'}]});
 assert.equal(r.code,200);assert.equal(saved.customer_name,'Website customer');assert.equal(saved.customer_email,null);
});
