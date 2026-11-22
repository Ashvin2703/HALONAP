import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import handler from '../api/admin-workflows.js';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
function setup(rows){
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://halonap.com/admin.html'});
 const w=dom.window,root=w.document.querySelector('main');
 w.eval(readFileSync(new URL('../admin-workflows.js',import.meta.url),'utf8'));
 function node(tag,cls,parent,value){const n=w.document.createElement(tag);n.className=cls;n.textContent=value||'';parent.append(n);return n}
 const apiCalls=[];
 const sb={from(name){
  const q={select(){return q},in(){return q},or(){return q},gte(){return q},lt(){return q},eq(){return q},order(){return q},range(a,b){return {data:(rows[name]||[]).slice(a,b+1)}},maybeSingle(){return {data:rows[name]?.[0]}},update(patch){Object.assign(rows[name][0],patch);return q},then(done){done({data:rows[name]})}};
  return q;
 }};
 const ops=w.createAdminWorkflows({node,sb,section:(parent,text)=>{const s=node('section','',parent);node('h2','',s,text);return s},notice:(p,s)=>node('p','',p,s),ukDate:x=>x,adminApi:async (_path,body)=>{apiCalls.push(body);return {shipping:Object.fromEntries(body.ids.map(id=>[id,299]))}}});
 return {root,w,ops,apiCalls};
}
test('packing slips contain only selected orders',async()=>{
 const rows=[1,2].map(id=>({id,order_number:'HN'+id,customer_name:'Name'+id,shipping_address:{postal_code:'POST'+id},items:[{colour:'Black',quantity:id}]}));
 const {root,w,ops}=setup({customer_orders:rows});await ops.packing(root);
 root.querySelectorAll('input')[1].click();let output;w.print=()=>{output=w.document.querySelector('#packingPrint').textContent};
 root.querySelector('button').click();assert.match(output,/POST1/);assert.doesNotMatch(output,/POST2/);
});
test('sales export reads past 500 and includes actual shipping and net',async()=>{
 const rows=Array.from({length:501},(_,i)=>({id:String(i),order_number:'HN'+i,created_at:'2026-11-01',currency:'gbp',total_pence:1598,refunded_pence:100,payment_status:'partially_refunded'}));
 const {root,w,ops,apiCalls}=setup({customer_orders:rows});let blob;
 w.URL.createObjectURL=x=>{blob=x;return 'blob:test'};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};w.setTimeout=()=>{};
 ops.sales(root);await root.querySelector('button').onclick();
 assert.equal(apiCalls.flatMap(x=>x.ids).length,501);
 const reader=new w.FileReader();await new Promise(resolve=>{reader.onload=resolve;reader.readAsText(blob)});
 assert.match(reader.result,/"HN500".*"15.98","2.99","1.00","14.98"/);
});
test('return stage advances without triggering a payment',async()=>{
 const r={stage:'Requested',reason:'Fit'};const {root,ops,apiCalls}=setup({order_returns:[r]});
 await ops.returnCase(root,{id:'order',payment_status:'paid'});await root.querySelector('button').onclick();
 assert.equal(r.stage,'Received');assert.equal(apiCalls.length,0);
});
test('mailbox, reply and export endpoint requires an admin session',async()=>{
 for(const action of ['sync_inbox','reply','delivery_amounts']){
  let status;const res={setHeader(){},status(n){status=n;return this},json(){}};
  await handler({method:'POST',headers:{},body:{action}},res);assert.equal(status,401);
 }
});
