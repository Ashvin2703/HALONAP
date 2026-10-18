/* HALONAP admin-only order management. Access enforced by Supabase RLS. */
(async()=>{
 const client=window.supabase?.createClient('https://ufhobvpuwhainuheewxb.supabase.co','sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy');
 if(!client)return;
 const anchor=document.getElementById('reviewAdmin');if(!anchor)return;
 const section=document.createElement('section');section.id='orderAdmin';section.className='section review-admin';section.hidden=true;
 section.innerHTML='<div class="section-intro"><span class="eyebrow">HALONAP MANAGEMENT</span><h2>Order <em>Management</em></h2></div><div id="orderStats" style="display:flex;flex-wrap:wrap;gap:12px;margin:20px 0"></div><div id="adminOrderList"></div>';
 anchor.after(section);
 const stats=section.querySelector('#orderStats'),list=section.querySelector('#adminOrderList');
 const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
 const fmt=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format((n||0)/100);
 async function refresh(){
  const {data:{user}}=await client.auth.getUser();
  if(!user){section.hidden=true;return}
  const {data:member,error:membershipError}=await client.from('review_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(membershipError||!member){section.hidden=true;return}
  section.hidden=false;list.textContent='Loading orders…';
  const {data,error}=await client.from('customer_orders').select('id,order_number,items,total_pence,currency,payment_status,fulfillment_status,tracking_number,created_at,dispatched_at').order('created_at',{ascending:false}).limit(500);
  if(error){list.textContent='Could not load orders: '+error.message;return}
  const orders=data||[];
  const counts={Total:orders.length,Pending:orders.filter(o=>o.fulfillment_status==='pending').length,Processing:orders.filter(o=>o.fulfillment_status==='processing').length,Dispatched:orders.filter(o=>o.fulfillment_status==='dispatched').length,Delivered:orders.filter(o=>o.fulfillment_status==='delivered').length};
  stats.replaceChildren();
  for(const [name,count] of Object.entries(counts)){const b=el('div',name+': '+count);b.style.cssText='background:#fff8fa;border:1px solid #ead4dc;border-radius:12px;padding:16px;font-weight:600';stats.append(b)}
  list.replaceChildren();
  if(!orders.length){list.textContent='No orders recorded yet.';return}
  for(const o of orders){
   const card=el('article');card.style.cssText='background:#fff;border:1px solid #ead4dc;border-radius:14px;padding:18px;margin:12px 0;overflow-wrap:anywhere';
   const heading=el('strong','Order '+(o.order_number||o.id.slice(0,8)));const info=el('p',new Date(o.created_at).toLocaleString('en-GB')+' · '+fmt(o.total_pence)+' · Payment: '+(o.payment_status||'unknown'));
   const items=el('p',Array.isArray(o.items)?o.items.map(i=>(i.colour||i.name||'Mask')+' × '+(i.quantity||1)).join(', '):'');
   const label=el('label','Dispatch status: '),select=el('select');
   for(const value of ['pending','processing','dispatched','delivered','cancelled']){const opt=el('option',value);opt.value=value;select.append(opt)}
   select.value=o.fulfillment_status||'pending';label.append(select);
   const tracking=el('input');tracking.placeholder='Tracking number (optional)';tracking.value=o.tracking_number||'';tracking.maxLength=120;tracking.style.cssText='display:block;padding:10px;margin:10px 0;max-width:100%;box-sizing:border-box';
   const save=el('button','Save order status');save.type='button';save.className='btn';const message=el('span');message.style.marginLeft='10px';
   save.onclick=async()=>{save.disabled=true;message.textContent='Saving…';const update={fulfillment_status:select.value,tracking_number:tracking.value.trim()||null};if(select.value==='dispatched'&&!o.dispatched_at)update.dispatched_at=new Date().toISOString();const {error}=await client.from('customer_orders').update(update).eq('id',o.id);message.textContent=error?'Error: '+error.message:'Saved';save.disabled=false;if(!error)setTimeout(refresh,400)};
   card.append(heading,info,items,label,tracking,save,message);list.append(card);
  }
  if(orders.length===500){list.prepend(el('p','Showing latest 500 orders only.'))}
 }
 client.auth.onAuthStateChange(()=>setTimeout(refresh,0));await refresh();
})();