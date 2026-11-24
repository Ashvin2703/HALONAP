import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx={};vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../chat-bot.js',import.meta.url),'utf8'),ctx);
const Bot=ctx.HalonapChatBot;
const intent=q=>{const m=Bot.match(q);return m.intent||(m.choices?'choices:'+m.choices.join('+'):'none')};

// Real-style questions, including typos and casual wording, and the topic each should reach.
const CASES={
 delivery:['how much is delivery','whats the shipping cost','do you do next day?','how long does delivery take','is there free delivery','delivary price?','postage to london'],
 late:['my order hasnt arrived','I still havent received my mask','where is my order??','wheres my parcel','order is late','it never came','not recieved yet'],
 track:['how do i track my order','tracking number please','has my order been dispatched','order status'],
 abroad:['do you ship to ireland','can I order from the USA','international shipping?','do you deliver outside the uk'],
 returns:['can i return it','how do I get a refund','I changed my mind','can I send it back','retrun policy'],
 faulty:['the strap is broken','my mask arrived damaged','you sent the wrong item','stitching came apart, faulty'],
 change:['I want to cancel my order','can i change my address','cancle order pls'],
 price:['how much is it','what is the price','is there a black friday deal'],
 code:['where do I put my discount code','do you have a voucher','apply promo code'],
 payment:['can i pay with paypal','do you take apple pay','is checkout secure'],
 product:['will it fit a big head','is it good for side sleepers','does it smudge makeup','does it block all light','good for eyelash extensions'],
 material:['what material is it made of','is it memory foam','I have sensitive skin'],
 cleaning:['how do i wash it','can it go in the washing machine','how to clean'],
 colours:['what colours do you have','do you have it in gray'],
 account:['I forgot my password','how do I log in'],
 contact:['what is your whatsapp','whats your email'],
 person:['can I talk to a person','I want to speak to someone','human please','customer service'],
 greet:['hi','hello there'],
 thanks:['thanks','thank you so much'],
 sleep:['any tips to sleep better','I cant sleep at night','help with jet lag','I work night shifts'],
 warranty:['is there a warranty','is it guaranteed'],
 gift:['is it good as a christmas gift','do you do gift wrapping'],
 stock:['is pink in stock','when will grey be back in stock'],
 about:['who are you','where are you based','is halonap a real company','tell me about halonap'],
 inbox:['what comes in the box','does it come with earplugs'],
 specs:['what are the dimensions','how much does it weigh','where is it made'],
 compare:['how is it different from a flat mask','why halonap'],
 reviews:['what do customers say','is it worth it, any reviews'],
 vat:['do you charge vat','can I get an invoice'],
 privacy:['how do you use my data','delete my personal data gdpr']
};
for(const [want,qs] of Object.entries(CASES))test('understands: '+want,()=>{for(const q of qs)assert.equal(intent(q),want,'"'+q+'"')});

test('unclear questions do not guess',()=>{for(const q of ['asdfgh','what is the meaning of life','banana'])assert.equal(intent(q),'none',q)});
test('answers use live prices from Settings',()=>{
 const s={price_pence:999,price_compare_at_pence:1299,standard_delivery_pence:299,express_delivery_pence:399,free_delivery_threshold_pence:1998};
 assert.match(Bot.answer('price',s),/£9\.99 per mask, down from £12\.99/);
 assert.match(Bot.answer('delivery',s),/£2\.99.*£19\.98.*£3\.99/);
 assert.doesNotMatch(Bot.answer('price',{...s,price_compare_at_pence:null}),/down from/);
 assert.match(Bot.answer('abroad',s),/United Kingdom only/);
});

// The training bank: real-style customer questions (typos, slang, short and long) for every topic.
// Add any question a customer asks that the bot gets wrong here, then add keywords until it passes.
const BANK=JSON.parse(readFileSync(new URL('./fixtures/chat-questions.json',import.meta.url),'utf8'));
test('training bank: every question reaches the right topic',()=>{
 const wrong=[];let n=0;
 for(const [want,qs] of Object.entries(BANK))for(const q of qs){n++;const m=Bot.match(q);if(!(m.intent===want||(m.choices&&m.choices[0]===want)))wrong.push(want+' <- '+(m.intent||m.choices||'none')+': '+q)}
 assert.ok(n>=300,'bank has '+n+' questions');
 assert.deepEqual(wrong,[]);
});
test('every topic in the bank has an answer',()=>{for(const k of Object.keys(BANK))if(!['person'].includes(k))assert.ok(Bot.answer(k,{price_pence:999}),k)});
