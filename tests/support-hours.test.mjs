import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import {teamOnline} from '../lib/support-hours.js';
import liveChat from '../api/live-chat.js';
import {runTool} from '../lib/chat-agent.js';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';

test('team is online 8am to 10pm UK time, in winter (GMT) and summer (BST)',()=>{
 const at=t=>teamOnline(new Date(t));
 assert.equal(at('2026-11-24T07:59:00Z'),false);assert.equal(at('2026-11-24T08:00:00Z'),true);
 assert.equal(at('2026-11-24T21:59:00Z'),true);assert.equal(at('2026-11-24T22:00:00Z'),false);
 assert.equal(at('2026-07-01T06:59:00Z'),false);assert.equal(at('2026-07-01T07:00:00Z'),true);   // 8am BST
 assert.equal(at('2026-07-01T20:59:00Z'),true);assert.equal(at('2026-07-01T21:00:00Z'),false);   // 10pm BST
});
function res(){return {code:200,setHeader(){},status(c){this.code=c;return this},json(x){this.body=x;return this},end(){return this}}}
test('outside hours no live chat starts and nobody is rung',async t=>{
 mock.timers.enable({apis:['Date'],now:Date.parse('2026-11-24T23:30:00Z')});t.after(()=>mock.timers.reset());
 global.fetch=()=>{throw Error('must not touch the database or ring anyone')};
 const r=res();await liveChat({method:'POST',headers:{},body:{action:'start',topic:'Returns'}},r);
 assert.equal(r.code,409);assert.equal(r.body.offline,true);assert.match(r.body.error,/8am to 10pm UK time/);
});
test('outside hours the AI keeps helping instead of handing over',async t=>{
 mock.timers.enable({apis:['Date'],now:Date.parse('2026-11-24T06:00:00Z')});t.after(()=>mock.timers.reset());
 const ctx={handoff:null,actions:[]};
 const out=await runTool('request_human',{topic:'Returns'},ctx);
 assert.equal(out.offline,true);assert.equal(ctx.handoff,null);
});
test('during hours the AI hands over',async t=>{
 mock.timers.enable({apis:['Date'],now:Date.parse('2026-11-24T12:00:00Z')});t.after(()=>mock.timers.reset());
 const ctx={handoff:null,actions:[]};await runTool('request_human',{topic:'Returns'},ctx);
 assert.deepEqual(ctx.handoff,{topic:'Returns'});
});
