import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function setup(){
 const dom=new JSDOM(read('index.html'),{url:'https://www.halonap.com/',runScripts:'outside-only'});
 const w=dom.window;w.alert=()=>{};w.eval(read('script.js'));
 return {dom,w,el:id=>w.document.getElementById(id)};
}
test('repeated Add to Bag cannot exceed checkout limit or erase the saved basket',()=>{
 const {dom,w,el}=setup();
 for(let i=0;i<98;i++)el('plus').click();
 el('addToBag').click();el('addToBag').click();
 assert.equal(el('bagCount').textContent,'99');
 assert.equal(JSON.parse(w.localStorage.getItem('halonap-cart-v1')).Black,99);
 dom.window.close();
});
test('mixed-colour quantities and remove keep subtotal correct',()=>{
 const {dom,w,el}=setup();el('addToBag').click();
 w.document.querySelector('[data-colour="Pink"]').click();el('plus').click();el('addToBag').click();
 assert.equal(el('bagCount').textContent,'3');assert.equal(el('subtotal').textContent,'£38.97');
 w.document.querySelector('[aria-label="Decrease Pink quantity"]').click();
 assert.equal(el('subtotal').textContent,'£25.98');dom.window.close();
});
test('bag and account overlays sit above product details',()=>{
 const {dom,w,el}=setup();const style=w.document.createElement('style');style.textContent=read('style.css');w.document.head.append(style);
 w.document.body.classList.add('shop-open');
 const z=id=>Number(w.getComputedStyle(el(id)).zIndex);
 assert.ok(z('overlay')>z('shop'));assert.ok(z('drawer')>z('overlay'));assert.ok(z('accountPanel')>z('shop'));
 dom.window.close();
});
async function authSetup(){
 const {dom,w,el}=setup();const callbacks=[];const user={id:'test-user',email:'test@example.com',user_metadata:{}};
 const query={select(){return this},eq(){return this},order(){return this},limit:async()=>({data:[]}),maybeSingle:async()=>({data:null}),upsert:async()=>({error:null})};
 const api={from:()=>query,auth:{onAuthStateChange:fn=>callbacks.push(fn),getSession:async()=>({data:{session:null}}),signOut:async()=>({error:null}),updateUser:async()=>({data:{user}})}};
 w.supabase={createClient:()=>api};w.eval(read('auth.js'));await new Promise(r=>setImmediate(r));
 return {dom,w,el,callbacks,user,api};
}
test('password recovery while signup selected does not require a name; signout restores signin fields',async()=>{
 const {dom,w,el,callbacks,user}=await authSetup();el('accountSwitch').click();
 callbacks.forEach(fn=>fn('PASSWORD_RECOVERY',{user}));
 assert.equal(el('accountFullName').required,false);
 el('accountPassword').value='Strong123!';el('accountConfirmPassword').value='Strong123!';
 await el('accountForm').onsubmit({preventDefault(){}});
 assert.equal(el('accountStatus').textContent,'Password updated successfully.');
 await el('accountSignOut').onclick();el('accountOpen').click();
 assert.equal(el('accountHeading').textContent,'Sign In');assert.equal(el('accountSubmit').textContent,'Sign In');
 assert.equal(el('accountConfirmPassword').required,false);assert.equal(el('accountConfirmWrap').hidden,true);
 assert.equal(el('accountEmail').hidden,false);assert.equal(el('accountPassword').value,'');
 dom.window.close();
});
test('failed signout keeps account visible and reports failure',async()=>{
 const {dom,el,callbacks,user,api}=await authSetup();callbacks.forEach(fn=>fn('SIGNED_IN',{user}));
 api.auth.signOut=async()=>({error:{message:'Network unavailable'}});
 await el('accountSignOut').onclick();assert.equal(el('accountStatus').textContent,'Network unavailable');assert.equal(el('accountSignedIn').hidden,false);dom.window.close();
});
