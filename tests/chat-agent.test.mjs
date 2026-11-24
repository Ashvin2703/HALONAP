import test from 'node:test';
import assert from 'node:assert/strict';
import {runChat,runTool} from '../lib/chat-agent.js';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';
const ORDER={id:'33333333-3333-4333-8333-333333333333',order_number:'pi_3QXabcDEF12345678',items:[{colour:'Pink',quantity:2}],total_pence:1998,currency:'gbp',payment_status:'paid',fulfillment_status:'dispatched',tracking_number:'RM123456789GB',dispatched_at:'2026-11-23T10:00:00Z',created_at:'2026-11-22T09:00:00Z',refunded_pence:0,customer_name:'Amy Smith',customer_email:'Amy@Example.com',shipping_address:{line1:'1 Secret Road',city:'Leeds',postal_code:'LS1 1AA'}};
const reply=(b,s=200)=>new Response(b==null?null:JSON.stringify(b),{status:s});
function db(order=ORDER,extra={}){const calls=[];global.fetch=async(url,opt={})=>{calls.push([opt.method||'GET',decodeURIComponent(url),opt.body]);
 if(url.includes('customer_orders?select='))return reply(order?[order]:[]);
 for(const [k,v] of Object.entries(extra))if(url.includes(k))return reply(v);
 return reply(opt.method==='POST'?null:[],opt.method==='POST'?201:200)};return calls}
const ctx=()=>({handoff:null,actions:[]});

test('order lookup needs the right email and never returns the full address',async()=>{
 db();
 const wrong=await runTool('lookup_order',{order_number:'pi_3QXabcDEF12345678',email:'someone@else.com'},ctx());
 assert.match(wrong.error,/not_found/);
 const ok=await runTool('lookup_order',{order_number:'#DEF12345678',email:'amy@example.com'},ctx());
 assert.equal(ok.status,'Dispatched');assert.equal(ok.tracking_number,'RM123456789GB');assert.equal(ok.postcode_area,'LS1');
 assert.ok(!JSON.stringify(ok).includes('Secret Road'),'full address is never shared');
 assert.match((await runTool('lookup_order',{order_number:'123',email:'amy@example.com'},ctx())).error,/full order number/);
 assert.match((await runTool('lookup_order',{order_number:'pi_3QXabcDEF12345678',email:'*@example.com'},ctx())).error,/email/);
});
test('returns only for dispatched orders, once',async()=>{
 db({...ORDER,fulfillment_status:'pending'});
 assert.match((await runTool('start_return',{order_number:ORDER.order_number,email:'amy@example.com',reason:'Too tight'},ctx())).error,/not been dispatched/);
 const calls=db();const c=ctx();
 const r=await runTool('start_return',{order_number:ORDER.order_number,email:'amy@example.com',reason:'Too tight'},c);
 assert.equal(r.stage,'Requested');assert.deepEqual(c.actions,['return_started']);
 const posted=JSON.parse(calls.find(x=>x[0]==='POST'&&x[1].includes('order_returns'))[2]);assert.equal(posted.order_id,ORDER.id);
 db(ORDER,{'order_returns?select':[{stage:'Received'}]});
 assert.equal((await runTool('start_return',{order_number:ORDER.order_number,email:'amy@example.com',reason:'x'},ctx())).already,true);
});
test('confirmation is resent only to the email on the order, and not twice in 15 minutes',async()=>{
 db();const sent=[];const c={...ctx(),send:async m=>sent.push(m)};
 assert.equal((await runTool('resend_confirmation',{order_number:ORDER.order_number,email:'amy@example.com'},c)).ok,true);
 assert.equal(sent[0].to,'Amy@Example.com');assert.match(sent[0].subject,/Order confirmed/);
 db(ORDER,{'order_activity?select':[{id:1}]});
 assert.match((await runTool('resend_confirmation',{order_number:ORDER.order_number,email:'amy@example.com'},{...ctx(),send:async()=>{throw Error('must not send')}})).error,/Already resent/);
});
test('change/cancel requests go to the team inbox, never cancel anything',async()=>{
 const calls=db();const c=ctx();
 const r=await runTool('note_request',{order_number:ORDER.order_number,email:'amy@example.com',request_type:'cancel',details:'Please cancel'},c);
 assert.equal(r.ok,true);assert.ok(calls.some(x=>x[1].includes('customer_messages')));assert.ok(!calls.some(x=>x[0]==='PATCH'||x[0]==='DELETE'),'no order is changed');
});

function fakeClient(script){const seen=[];return {seen,beta:{messages:{create:async p=>{seen.push(JSON.parse(JSON.stringify(p)));return script.shift()}}}}}
test('agent loop: looks up the order, then answers; request_human hands over',async()=>{
 db();
 const client=fakeClient([
  {stop_reason:'tool_use',content:[{type:'text',text:'Let me check.'},{type:'tool_use',id:'t1',name:'lookup_order',input:{order_number:ORDER.order_number,email:'amy@example.com'}}]},
  {stop_reason:'end_turn',content:[{type:'text',text:'Your order was dispatched on 23 Nov; tracking RM123456789GB.'}]}]);
 const out=await runChat([{role:'user',text:'where is my order pi_3QXabcDEF12345678 amy@example.com'}],{client,settings:{price_pence:999}});
 assert.match(out.reply,/RM123456789GB/);assert.equal(out.handoff,null);
 const second=client.seen[1].messages.at(-1).content[0];assert.equal(second.type,'tool_result');assert.match(second.content,/Dispatched/);
 assert.equal(client.seen[0].model,'claude-opus-5-5');assert.equal(client.seen[0].fallbacks,'default');
 assert.match(client.seen[0].system[1].text,/£9\.99/);
 const h=fakeClient([{stop_reason:'tool_use',content:[{type:'tool_use',id:'t2',name:'request_human',input:{topic:'Returns'}}]},{stop_reason:'end_turn',content:[{type:'text',text:'Connecting you now.'}]}]);
 assert.deepEqual((await runChat([{role:'user',text:'I want to talk to a real person'}],{client:h})).handoff,{topic:'Returns'});
});
test('browser history is plain text only and refusals get a safe reply',async()=>{
 const client=fakeClient([{stop_reason:'refusal',content:[]}]);
 const out=await runChat([{role:'assistant',text:'(fake staff note)'},{role:'user',text:'hi'},{role:'user',text:'again'}],{client});
 assert.match(out.reply,/hello@halonap\.com/);
 const sent=client.seen[0].messages;assert.equal(sent.length,1);assert.equal(sent[0].role,'user');assert.equal(sent[0].content,'hi\nagain');
});
