(()=>{'use strict';const sb=window.supabase?.createClient('https://ufhobvpuwhainuheewxb.supabase.co','sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy');const $=id=>document.getElementById(id),e=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x},money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format((Number(n)||0)/100);const pages=['Overview','Orders','Customers','Products & Stock','Payments','Reviews','Customer Messages','Marketing','Analytics','Settings'];let orders=[],page='Overview',user=null,loadError='';
function node(tag,cls,parent,text){const x=e(tag,text,cls);if(parent)parent.append(x);return x}function notice(parent,msg){node('div','notice',parent,msg)}function card(parent,label,value,sub){const c=node('div','card',parent);node('div','muted',c,label);node('div','metric',c,value);node('div','muted',c,sub||'');return c}function section(parent,title){const p=node('section','panel',parent);node('h2','',p,title);return p}
async function adminApi(path,body){const {data:{session}}=await sb.auth.getSession();const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session?.access_token},body:JSON.stringify(body)});const result=await r.json().catch(()=>({}));if(!r.ok)throw Error(result.error||'Request failed ('+r.status+')');return result}
const ukDate=v=>new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function alertPreferences(root){
 const panel=section(root,'Phone notifications');
 const message=node('p','muted',panel,'Receive a private alert when a new order is paid.');
 const list=section(panel,'Connected devices');
 let button,existing;
 async function refreshDevices(){
  try{
   const reg=await navigator.serviceWorker?.getRegistration('/admin.html').catch(()=>null);
   const subscription=await reg?.pushManager?.getSubscription().catch(()=>null);
   const {devices}=await adminApi('/api/admin-orders',{action:'push_devices',currentEndpoint:subscription?.endpoint});
   list.replaceChildren();node('h3','',list,'Connected devices');
   if(button)button.textContent=devices.some(device=>device.current)?'Send test alert':'Enable order alerts';
   if(!devices.length)node('p','muted',list,'No devices connected.');
   for(const device of devices){
    const row=node('div','toolbar',list);
    const label=(device.current?'This device · ':'')+device.label+' · '+device.id.slice(0,6);
    node('span','',row,label+' · Added '+ukDate(device.added));
    const remove=node('button','btn',row,'Disconnect');
    remove.onclick=async()=>{
     if(!confirm('Stop HALONAP order alerts on '+label+'?'))return;
     remove.disabled=true;
     try{
      await adminApi('/api/admin-orders',{action:'push_disconnect',deviceId:device.id});
      if(device.current){existing=null;await subscription?.unsubscribe().catch(()=>false)}
      message.textContent='Disconnected '+label+'.';await refreshDevices();
     }catch(err){message.textContent=err.message;remove.disabled=false}
    };
   }
  }catch(err){notice(list,'Unable to load connected devices: '+err.message)}
 }
 refreshDevices();
 if(!('PushManager' in window)||!('serviceWorker' in navigator)||!('Notification' in window)){
  message.textContent='On iPhone, add this admin page to your Home Screen from Safari, then open it there. On Android, open this page in Chrome.';return;
 }
 button=node('button','btn',panel,'Enable order alerts');
 panel.insertBefore(button,list);
 message.setAttribute('role','status');
 let registration,applicationServerKey;
 const blockedHelp=/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg/.test(navigator.userAgent)
  ? 'In Safari, open Settings → Websites → Notifications and allow halonap.com.'
  : 'Open the site settings beside the address bar and allow Notifications for halonap.com.';
 async function prepare(){
  button.disabled=true;
  message.textContent='Preparing notifications on this device…';
  let timeout;
  try{
   await navigator.serviceWorker.register('/order-alerts-worker.js',{scope:'/admin.html'});
   const ready=Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{
    timeout=setTimeout(()=>reject(Error('Notification setup timed out. Open /admin.html directly and try again.')),15000);
   })]);
   const [reg,{key}]=await Promise.all([ready,adminApi('/api/admin-orders',{action:'push_key'})]);
   applicationServerKey=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
   existing=await reg.pushManager.getSubscription();
   registration=reg;
   message.textContent=Notification.permission==='denied'?blockedHelp:'Receive an alert on this device when a new order is paid.';
  }catch(err){message.textContent=err.message;button.textContent='Retry setup'}
  finally{clearTimeout(timeout);button.disabled=false}
 }
 button.onclick=async()=>{
  if(!registration){await prepare();return}
  button.disabled=true;
  try{
   if(Notification.permission==='denied')throw Error(blockedHelp);
   message.textContent='Waiting for notification permission…';
   // Subscribe directly in the click handler so Safari retains the user gesture.
   const subscription=existing||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
   message.textContent='Registering this device and sending a test alert…';
   await adminApi('/api/admin-orders',{action:'push_enable',subscription:subscription.toJSON()});
   existing=subscription;
   message.textContent='Enabled. A test notification has been sent to this device.';
   await refreshDevices();
  }catch(err){message.textContent=err.name==='NotAllowedError'?blockedHelp:err.message}
  finally{button.disabled=false}
 };
 prepare();
}
async function check(){if(!sb){$('loginMsg').textContent='Unable to load secure sign-in. Refresh this page.';return}const {data:{user:u}}=await sb.auth.getUser();if(!u){user=null;$('app').classList.add('hide');$('login').classList.remove('hide');return}const {data:member,error}=await sb.from('review_admins').select('user_id').eq('user_id',u.id).maybeSingle();if(error||!member){await sb.auth.signOut();$('loginMsg').textContent='This account does not have administrator access.';return}user=u;$('login').classList.add('hide');$('app').classList.remove('hide');$('adminEmail').textContent=u.email||'Admin';
 const target=new URLSearchParams(location.search).get('order');
 if(target)page='Orders';
 await reload();
 if(target){
  const found=await sb.from('customer_orders').select('*').eq('id',target).maybeSingle();
  if(found.data){details($('content'),found.data);$('orderDetails').scrollIntoView()}
  else notice($('content'),'This order could not be loaded.');
 }}
async function reload(){const {data,error}=await sb.from('customer_orders').select('id,order_number,items,total_pence,currency,payment_status,fulfillment_status,tracking_number,customer_name,customer_email,customer_phone,shipping_address,created_at,dispatched_at,refunded_pence,refund_status,attribution,inventory_issue,dispatch_email_sent_at,confirmation_email_sent_at,review_request_sent_at').order('created_at',{ascending:false}).limit(500);if(error){loadError=error.message;render();return}orders=data||[];loadError='';render()}
function render(){const nav=$('nav');nav.replaceChildren();pages.forEach(p=>{const b=node('button','nav'+(page===p?' active':''),nav);const icons=['◈','▤','♙','▣','£','★','✉','✦','▥','⚙'];node('span','nav-icon',b,icons[pages.indexOf(p)]);node('span','',b,p);b.onclick=()=>{page=p;render()}});$('pageTitle').textContent=page;const root=$('content');root.replaceChildren();if(loadError)notice(root,'Order data could not be loaded: '+loadError);node('p','muted',root,'Latest 500 orders · Overview, Customers and Analytics refresh every 30 seconds while open.');if(page==='Overview')overview(root);else if(page==='Orders')ordersPage(root);else if(page==='Customers')customers(root);else if(page==='Products & Stock')products(root);else if(page==='Payments')payments(root);else if(page==='Reviews')reviews(root);else if(page==='Customer Messages')messages(root);else if(page==='Marketing')marketing(root);else if(page==='Analytics')analytics(root);else settings(root)}
function overview(root){const welcome=node('div','welcome',root);const copy=node('div','',welcome);node('div','eyebrow',copy,'HALONAP · BUSINESS OVERVIEW');node('h2','',copy,'Welcome to your admin studio');node('p','',copy,'Your orders, customers and business insights in one place.');node('div','welcome-mark',welcome,'✦');const paid=orders.filter(o=>['paid','partially_refunded','refunded'].includes(o.payment_status));const cards=node('div','cards',root);card(cards,'Revenue from loaded paid orders',money(paid.reduce((s,o)=>s+(Math.max(0,Number(o.total_pence)-Number(o.refunded_pence||0))||0),0)),'Up to 500 recent orders');card(cards,'Total orders',String(orders.length),'Loaded order records');card(cards,'Pending fulfilment',String(orders.filter(o=>(o.fulfillment_status||'pending')==='pending').length),'Action required');card(cards,'Customers',String(new Set(orders.map(o=>o.customer_email).filter(Boolean)).size),'Unique emails in orders');const alerts=node('div','',root);(async()=>{if(!settingsCache){const r=await sb.from('store_settings').select('*').eq('id',true).maybeSingle();settingsCache=r.data}const low=settingsCache?.low_stock_threshold??20;if(settingsCache?.shop_paused)notice(alerts,'⏸ The shop is paused: customers cannot check out. Turn it back on in Settings.');const {data:inv}=await sb.from('product_inventory').select('colour,stock_quantity,is_active');for(const i of inv||[]){if(i.stock_quantity!==null&&i.stock_quantity<low)notice(alerts,'⚠️ Low stock: '+i.colour+' has '+i.stock_quantity+' left.');if(i.is_active===false)notice(alerts,i.colour+' is hidden from the shop.')}})();const cs=section(root,'Stripe checkouts');const csArea=node('div','cards',cs);node('p','muted',cs,'Abandoned = the customer opened Stripe checkout but did not pay before it expired (24 hours).');node('p','muted',csArea,'Loading from Stripe…');adminApi('/api/admin-orders',{action:'checkout_stats'}).then(st=>{csArea.replaceChildren();const d=st.last_24h,w=st.last_7d;card(csArea,'Checkouts today',String(d.started),d.completed+' paid · '+d.open+' still open');card(csArea,'Abandoned today',String(d.abandoned),money(d.abandoned_pence)+' not paid');card(csArea,'Checkouts · 7 days',String(w.started),w.completed+' paid'+(st.truncated?' · showing latest 500':''));card(csArea,'Abandoned · 7 days',String(w.abandoned),w.started?Math.round(100*w.completed/w.started)+'% of checkouts paid':'No checkouts yet')}).catch(err=>{csArea.replaceChildren();notice(csArea,'Stripe checkouts could not be loaded: '+err.message)});const p=section(root,'Recent orders');const b=node('button','btn',p,'View all orders →');b.onclick=()=>{page='Orders';render()};orderTable(p,orders.slice(0,8),false);if(!orders.length)notice(p,'No synced orders yet. Stripe checkout and webhook delivery must be tested before orders appear.')}
function orderTable(parent,rows,editable){const wrap=node('div','',parent),t=node('table','',wrap),head=node('thead','',t),tr=node('tr','',head);['Order','Customer','Products','Total','Payment','Fulfilment',...(editable?['Manage']:[])].forEach(s=>node('th','',tr,s));const body=node('tbody','',t);rows.forEach(o=>{const r=node('tr','',body),c=(value)=>node('td','',r,value||'—');const d=new Date(o.created_at);c((o.order_number||String(o.id).slice(0,8))+' · '+(isNaN(d)?'':d.toLocaleDateString('en-GB')));const cu=c(o.customer_name||'Guest');node('small','',cu,o.customer_email||'No email');const items=Array.isArray(o.items)?o.items:[];c(items.map(i=>[i.name||i.description||i.colour||i.color||'Sleep mask',i.quantity?'×'+i.quantity:''].join(' ')).join(', ')||'—');c(money(o.total_pence));c(o.payment_status||'—');c((o.fulfillment_status||'pending')+(o.dispatch_email_sent_at?' · 📧 emailed':''));if(editable){const td=c('');const btn=node('button','btn',td,'Manage');btn.onclick=()=>details(parent,o)}})}
function ordersPage(root){alertPreferences(root);const p=section(root,'Order management');const bar=node('div','toolbar',p),search=node('input','',bar);search.placeholder='Search order, name, email…';search.setAttribute('aria-label','Search orders');const filter=node('select','',bar);['All','pending','processing','dispatched','delivered','cancelled'].forEach(s=>{const op=node('option','',filter,s);op.value=s});const refresh=node('button','btn',bar,'↻ Refresh');refresh.onclick=reload;const area=node('div','',p);function update(){area.replaceChildren();const q=search.value.toLowerCase(),s=filter.value;orderTable(area,orders.filter(o=>(s==='All'||(o.fulfillment_status||'pending')===s)&&[o.order_number,o.customer_name,o.customer_email,o.customer_phone].some(v=>String(v||'').toLowerCase().includes(q))),true)}search.oninput=update;filter.onchange=update;update();if(orders.length===500)notice(p,'Showing the latest 500 orders. Pagination is not yet enabled.')}
function details(parent,o){const old=$('orderDetails');if(old)old.remove();const p=section(parent,'Manage order '+(o.order_number||String(o.id).slice(0,8)));p.id='orderDetails';if(o.inventory_issue)notice(p,'Stock action required: '+o.inventory_issue);notice(p,'Cancelling fulfilment does not refund payment or return stock. Use Payments for refunds; add stock only after goods are returned.');const a=o.shipping_address||{};node('p','',p,'Customer: '+[o.customer_name,o.customer_email,o.customer_phone].filter(Boolean).join(' · '));node('p','',p,'Delivery: '+[a.line1,a.line2,a.city,a.state,a.postal_code,a.country].filter(Boolean).join(', '));const status=node('select','',p);['pending','processing','dispatched','delivered','cancelled'].forEach(s=>{const op=node('option','',status,s);op.value=s});status.value=o.fulfillment_status||'pending';const tracking=node('input','',p);tracking.placeholder='Tracking number';tracking.value=o.tracking_number||'';tracking.setAttribute('aria-label','Tracking number');const save=node('button','btn primary',p,'Save order update'),msg=node('p','muted',p);const mailBox=node('div','toolbar',p);node('span','muted',mailBox,(o.confirmation_email_sent_at?'✅ Order confirmation sent '+ukDate(o.confirmation_email_sent_at):'Order confirmation not sent')+' · '+(o.dispatch_email_sent_at?'📧 Dispatch email sent '+ukDate(o.dispatch_email_sent_at):'📧 Dispatch email not sent yet')+(o.review_request_sent_at?' · ⭐ Review request sent '+ukDate(o.review_request_sent_at):''));if(o.fulfillment_status==='dispatched'&&o.customer_email){const resend=node('button','btn',mailBox,o.dispatch_email_sent_at?'Resend dispatch email':'Send dispatch email');resend.onclick=async()=>{if(o.dispatch_email_sent_at&&!confirm('Send the dispatch email to '+o.customer_email+' again?'))return;resend.disabled=true;msg.textContent='Sending dispatch email…';try{const result=await adminApi('/api/admin-orders',{action:'notify_dispatch',order_id:o.id,resend:true});msg.textContent=result.sent?'Dispatch email sent to '+o.customer_email:'Another admin just sent it. Nothing more was sent.';await reload()}catch(err){msg.textContent='Dispatch email failed: '+err.message;resend.disabled=false}}}save.onclick=async()=>{save.disabled=true;const patch={fulfillment_status:status.value,tracking_number:tracking.value.trim()||null};if(status.value==='dispatched'&&!o.dispatched_at)patch.dispatched_at=new Date().toISOString();const {error}=await sb.from('customer_orders').update(patch).eq('id',o.id);msg.textContent=error?'Save failed: '+error.message:'Order updated successfully';if(!error&&status.value==='dispatched'){msg.textContent='Order updated · sending dispatch email…';try{const result=await adminApi('/api/admin-orders',{action:'notify_dispatch',order_id:o.id,auto:true});msg.textContent=result.disabled?'Order updated · automatic dispatch emails are turned off in Settings':result.sent?'Order updated · dispatch email sent to customer':'Order updated · dispatch email was already sent earlier'}catch(err){msg.textContent='Order updated, but dispatch email failed: '+err.message+' Save again to retry.'}}save.disabled=false;if(!error)await reload()};p.scrollIntoView({behavior:'smooth',block:'start'})}
function customers(root){const p=section(root,'Customers from orders');notice(p,'This list contains customers from synced orders, not every registered account.');const map=new Map();orders.forEach(o=>{if(!o.customer_email)return;const k=o.customer_email.toLowerCase(),v=map.get(k)||{name:o.customer_name||'Customer',email:o.customer_email,orders:0,spent:0};v.orders++;if(['paid','partially_refunded','refunded'].includes(o.payment_status))v.spent+=Math.max(0,Number(o.total_pence)-Number(o.refunded_pence||0))||0;map.set(k,v)});const t=node('table','',p),h=node('tr','',t);['Customer','Email','Orders','Paid spend'].forEach(x=>node('th','',h,x));map.forEach(v=>{const r=node('tr','',t);[v.name,v.email,String(v.orders),money(v.spent)].forEach(x=>node('td','',r,x))})}
async function products(root){const p=section(root,'Products & stock control');notice(p,'Set real stock quantities before enabling stock limits. Blank stock means not yet configured. Stripe prices are managed in Stripe, not here.');const area=node('div','',p);const {data,error}=await sb.from('product_inventory').select('colour,stock_quantity,is_active,updated_at').order('colour');if(error){notice(area,'Could not load inventory: '+error.message);return}if(!settingsCache){const r=await sb.from('store_settings').select('*').eq('id',true).maybeSingle();settingsCache=r.data}const low=settingsCache?.low_stock_threshold??20;for(const item of data||[]){const row=node('div','panel',area);node('h2','',row,'HALONAP Sleep Eye Mask · '+item.colour);if(item.stock_quantity!==null&&item.stock_quantity<low)notice(row,'⚠️ Low stock: '+item.stock_quantity+' left (alert below '+low+').');const controls=node('div','toolbar',row);const stock=node('input','',controls);stock.type='number';stock.min='0';stock.step='1';stock.placeholder='Stock not configured';stock.value=item.stock_quantity===null?'':String(item.stock_quantity);stock.setAttribute('aria-label',item.colour+' stock quantity');const status=node('select','',controls);for(const [label,value] of [['Available','true'],['Hidden / unavailable','false']]){const opt=node('option','',status,label);opt.value=value}status.value=String(item.is_active);const save=node('button','btn primary',controls,'Save changes'),msg=node('span','muted',controls);save.onclick=async()=>{const qty=stock.value.trim()===''?null:Number(stock.value);if(qty!==null&&(!Number.isSafeInteger(qty)||qty<0)){msg.textContent='Enter a valid whole number';return}save.disabled=true;const {error}=await sb.from('product_inventory').update({stock_quantity:qty,is_active:status.value==='true',updated_at:new Date().toISOString()}).eq('colour',item.colour);msg.textContent=error?'Save failed: '+error.message:'Saved successfully';save.disabled=false}}}
async function paymentAction(action,o,button,msg){
 button.disabled=true;msg.textContent='Contacting Stripe…';
 try{const {data:{session}}=await sb.auth.getSession();const response=await fetch('/api/admin-payments',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session?.access_token},body:JSON.stringify({action,order_id:o.id})});const result=await response.json();if(!response.ok)throw Error(result.error||'Payment update failed');Object.assign(o,result);msg.textContent='Stripe checked · Refunded '+money(result.refunded_pence)+' · '+(result.refund_status||'No refunds');}catch(error){msg.textContent=error.message;}finally{button.disabled=false;}
}
function payments(root){const p=section(root,'Stripe payments & refunds');const g=node('div','cards',p);card(g,'Order receipts',money(orders.reduce((n,o)=>n+Number(o.total_pence||0),0)),'Latest 500 orders');card(g,'Refunded',money(orders.reduce((n,o)=>n+Number(o.refunded_pence||0),0)),'Confirmed successful refunds');card(g,'Net receipts',money(orders.reduce((n,o)=>n+Number(o.total_pence||0)-Number(o.refunded_pence||0),0)),'Before Stripe fees');notice(p,'Refunds go to the original payment method. Stock is not returned automatically. Use Sync from Stripe to refresh pending refunds.');if(!orders.length)notice(p,'No live orders yet. Test payments are kept separately.');for(const o of orders){const box=node('div','panel',p);node('strong','',box,o.order_number||o.id);node('p','',box,(o.customer_name||'Customer')+' · '+money(o.total_pence)+' · '+o.payment_status);const bar=node('div','toolbar',box),msg=node('p','muted',box,'Refunded '+money(o.refunded_pence||0)+(o.refund_status?' · '+o.refund_status:''));const sync=node('button','btn',bar,'Sync from Stripe');sync.onclick=()=>paymentAction('sync',o,sync,msg);const refund=node('button','btn',bar,'Refund remaining payment');refund.onclick=()=>{if(confirm('Refund the remaining payment for '+(o.order_number||o.id)+'? This sends money back to the customer.'))paymentAction('refund',o,refund,msg);};}const a=node('a','btn',p,'Stripe fees & payouts ↗');a.href='https://dashboard.stripe.com/payments';a.target='_blank';a.rel='noopener noreferrer';}
async function reviews(root){const p=section(root,'Customer review approvals');const controls=node('div','toolbar',p);const filter=node('select','',controls);['All','pending','approved','rejected'].forEach(v=>{const o=node('option','',filter,v);o.value=v});const refresh=node('button','btn',controls,'↻ Refresh');const area=node('div','',p);let reviewsData=[];function show(){area.replaceChildren();const visible=reviewsData.filter(r=>filter.value==='All'||r.status===filter.value);if(!visible.length){notice(area,'No reviews in this category.');return}for(const review of visible){const box=node('article','panel',area);node('div','eyebrow',box,(review.status||'pending').toUpperCase()+' · '+new Date(review.created_at).toLocaleDateString('en-GB'));node('h2','',box,(review.name||'Customer')+' · '+'★'.repeat(Math.max(0,Math.min(5,Number(review.rating)||0))));node('p','',box,review.review||'');const gallery=node('div','toolbar',box);for(const path of review.media_paths||[]){const url=sb.storage.from('review-media').getPublicUrl(path).data.publicUrl;if(/\\.(mp4|webm|mov)$/i.test(path)){const v=node('video','',gallery);v.src=url;v.controls=true;v.preload='metadata';v.style.maxWidth='200px'}else{const a=node('a','',gallery);a.href=url;a.target='_blank';a.rel='noopener noreferrer';const img=node('img','',a);img.src=url;img.alt='Customer review photo';img.loading='lazy';img.style.cssText='width:110px;height:110px;object-fit:cover;border-radius:12px'}}const actions=node('div','toolbar',box),msg=node('span','muted',actions);for(const [label,status] of [['Approve','approved'],['Reject','rejected'],['Delete','delete']]){const b=node('button','btn'+(status==='approved'?' primary':''),actions,label);b.disabled=status===review.status;b.onclick=async()=>{if(status==='delete'&&!confirm('Permanently delete this review?'))return;b.disabled=true;msg.textContent='Saving…';const result=status==='delete'?await sb.from('product_reviews').delete().eq('id',review.id):await sb.from('product_reviews').update({status}).eq('id',review.id);if(result.error){msg.textContent='Error: '+result.error.message;b.disabled=false}else await load()}}}}async function load(){area.replaceChildren();node('p','muted',area,'Loading reviews…');const {data,error}=await sb.from('product_reviews').select('id,name,rating,review,status,media_paths,created_at').order('created_at',{ascending:false}).limit(200);if(error){area.replaceChildren();notice(area,'Could not load reviews: '+error.message);return}reviewsData=data||[];show()}filter.onchange=show;refresh.onclick=load;await load()}
async function marketing(root){const p=section(root,'Campaign links & sales');notice(p,'Create a link, then use it in your posts, WhatsApp or ads. Orders keep the campaign from the page where checkout started. Sales below cover the latest 500 orders. Ad spend, impressions and external ad publishing require a connected ad account.');const f=node('form','toolbar',p);const fields={};for(const [key,label] of [['name','Campaign name'],['source','Source: instagram / whatsapp'],['medium','Medium: social / email'],['campaign','Campaign code: autumn_launch']]){const labelNode=node('label','muted',f,label);const input=node('input','',labelNode);input.required=true;input.maxLength=key==='name'?100:80;if(key!=='name')input.pattern='[a-zA-Z0-9_-]+';fields[key]=input;}const save=node('button','btn primary',f,'Create campaign link'),msg=node('p','muted',p),list=node('div','',p);f.onsubmit=async ev=>{ev.preventDefault();save.disabled=true;const row=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value.trim()]));const {error}=await sb.from('marketing_campaigns').insert(row);msg.textContent=error?'Could not save: '+error.message:'Campaign saved';save.disabled=false;if(!error){f.reset();await loadCampaigns();}};async function loadCampaigns(){const {data,error}=await sb.from('marketing_campaigns').select('*').order('created_at',{ascending:false});list.replaceChildren();if(error){notice(list,error.message);return}for(const c of data||[]){const box=node('div','panel',list);node('h2','',box,c.name);const url=new URL('https://halonap.com/');url.search=new URLSearchParams({utm_source:c.source,utm_medium:c.medium,utm_campaign:c.campaign}).toString();const input=node('input','',box);input.readOnly=true;input.value=url.href;input.style.width='100%';input.setAttribute('aria-label','Campaign link');input.onclick=()=>input.select();const linked=orders.filter(o=>o.attribution?.utm_campaign===c.campaign&&o.attribution?.utm_source===c.source&&o.attribution?.utm_medium===c.medium);node('p','',box,linked.length+' orders · '+money(linked.reduce((n,o)=>n+Number(o.total_pence||0)-Number(o.refunded_pence||0),0))+' net receipts');}}await loadCampaigns();const coupon=section(root,'Discount codes');node('p','',coupon,'Stripe promotion codes are enabled at checkout. Create and manage codes in Stripe.');const a=node('a','btn',coupon,'Manage Stripe promotion codes ↗');a.href='https://dashboard.stripe.com/coupons';a.target='_blank';a.rel='noopener noreferrer';}
function analytics(root){const p=section(root,'Order analytics');const counts={};orders.forEach(o=>{const d=(o.created_at||'').slice(0,7)||'Unknown';counts[d]??={orders:0,revenue:0};counts[d].orders++;if(['paid','partially_refunded','refunded'].includes(o.payment_status))counts[d].revenue+=Math.max(0,Number(o.total_pence)-Number(o.refunded_pence||0))||0});const t=node('table','',p),h=node('tr','',t);['Month','Orders','Paid revenue'].forEach(x=>node('th','',h,x));Object.entries(counts).sort((a,b)=>b[0].localeCompare(a[0])).forEach(([k,v])=>{const r=node('tr','',t);[k,String(v.orders),money(v.revenue)].forEach(x=>node('td','',r,x))});if(!orders.length)notice(p,'Analytics will appear when orders are synced.')}
let settingsCache=null;const threshold=()=>{const p=settingsCache?.free_delivery_threshold_pence??2500;return '£'+(p%100?(p/100).toFixed(2):p/100)};
const SIGN='\n\nSleep well,\nHALONAP Customer Care';
const TEMPLATES={
 'Where is my order?':'Hi [name],\n\nThanks for getting in touch. Your order [order reference] was dispatched on [date] with tracking number [tracking]. UK Standard Delivery usually arrives within 3 business days of dispatch.\n\nIf it has not arrived by [date], reply here and we will sort it out straight away.'+SIGN,
 'Not dispatched yet':'Hi [name],\n\nThanks for your patience. Your order [order reference] is being packed and will be dispatched by [date]. You will get an email with your tracking number as soon as it leaves us.'+SIGN,
 'Return request':'Hi [name],\n\nWe are sorry the mask was not right for you. You can return it within 30 days of delivery. Please send it to:\n\n[return address]\n\nInclude your order reference [order reference] in the parcel. Once it arrives we will refund your original payment method within 5 business days.'+SIGN,
 'Faulty or damaged':'Hi [name],\n\nWe are really sorry about this. Could you reply with a photo of the issue? As soon as we see it we will send a replacement or a full refund, whichever you prefer. You will not need to pay for return postage.'+SIGN,
 'Product question':'Hi [name],\n\nGreat question. [answer]\n\nThe mask comes in Black, Pink and Grey, and standard UK delivery is free on orders of [threshold] or more.'+SIGN
};
async function messages(root){
 if(!settingsCache){const {data}=await sb.from('store_settings').select('free_delivery_threshold_pence').eq('id',true).maybeSingle();settingsCache=data}
 const p=section(root,'Customer Messages');
 const controls=node('div','toolbar',p);
 const filter=node('select','',controls);
 ['All','New','In Progress','Resolved'].forEach((x,i)=>{const o=node('option','',filter,x);o.value=['all','new','in_progress','resolved'][i]});
 const refresh=node('button','btn',controls,'↻ Refresh');
 const area=node('div','',p);let items=[];
 function ticket(m){return 'HN-'+String(m.id||'').replace(/-/g,'').slice(0,10).toUpperCase()}
 function show(){
  area.replaceChildren();
  const shown=items.filter(x=>filter.value==='all'||(x.support_status||'new')===filter.value);
  if(!shown.length){notice(area,'No messages in this category.');return}
  for(const m of shown){
   const box=node('article','panel',area);
   const state=m.support_status||'new';
   node('div','eyebrow',box,ticket(m)+' · '+state.replace('_',' ').toUpperCase()+' · '+new Date(m.created_at).toLocaleString('en-GB'));
   node('h2','',box,m.name||'Customer');
   const a=node('a','',box,m.email);a.href='mailto:'+encodeURIComponent(m.email)+'?subject='+encodeURIComponent('Re: HALONAP enquiry '+ticket(m));
   node('p','muted',box,'Topic: '+(m.topic||'General enquiry')+(m.order_number?' · Order: '+m.order_number:'')+(m.phone?' · Phone: '+m.phone:''));
   const body=node('p','',box,m.message);body.style.whiteSpace='pre-wrap';
   const actions=node('div','toolbar',box);
   const statusSelect=node('select','',actions);
   [['new','New'],['in_progress','In Progress'],['resolved','Resolved']].forEach(([value,label])=>{const o=node('option','',statusSelect,label);o.value=value});
   statusSelect.value=state;
   const tpl=node('select','',actions);tpl.setAttribute('aria-label','Reply template');[['','Reply with template…'],...Object.keys(TEMPLATES).map(k=>[k,k])].forEach(([v,l])=>{const o=node('option','',tpl,l);o.value=v});
   tpl.onchange=async()=>{const t=TEMPLATES[tpl.value];if(!t)return;const first=(m.name||'there').trim().split(/\s+/)[0];const body=t.replace(/\[name\]/g,first).replace(/\[order reference\]/g,m.order_number||'[order reference]').replace(/\[threshold\]/g,threshold());location.href='mailto:'+encodeURIComponent(m.email)+'?subject='+encodeURIComponent('Re: HALONAP enquiry '+ticket(m))+'&body='+encodeURIComponent(body);tpl.value='';if(state==='new'){await sb.from('customer_messages').update({support_status:'in_progress',is_read:true}).eq('id',m.id);await load()}};
   const del=node('button','btn',actions,'Delete');
   const status=node('span','muted',actions,'');
   statusSelect.onchange=async()=>{
    statusSelect.disabled=true;
    const {error}=await sb.from('customer_messages').update({support_status:statusSelect.value,is_read:true}).eq('id',m.id);
    if(error){status.textContent='Update failed: '+error.message;statusSelect.value=state;statusSelect.disabled=false}else await load();
   };
   del.onclick=async()=>{if(!confirm('Delete this customer message?'))return;del.disabled=true;const {error}=await sb.from('customer_messages').delete().eq('id',m.id);if(error){status.textContent=error.message;del.disabled=false}else await load()};
  }
 }
 async function load(){area.replaceChildren();notice(area,'Loading messages…');const {data,error}=await sb.from('customer_messages').select('id,name,email,phone,order_number,topic,message,is_read,support_status,created_at').order('created_at',{ascending:false}).limit(500);if(error){area.replaceChildren();notice(area,'Unable to load messages: '+error.message);return}items=data||[];show()}
 filter.onchange=show;refresh.onclick=load;await load();
}
async function settings(root){
 const top=section(root,'Storefront settings');node('p','muted',top,'Signed in as '+(user?.email||''));
 const {data,error}=await sb.from('store_settings').select('*').eq('id',true).single();if(error){notice(top,error.message);return}
 settingsCache=data;
 const pounds=p=>((Number(p)||0)/100).toFixed(2),toPence=v=>String(v).trim()===''?null:Math.round(Number(v)*100);
 const field=(parent,label,type,value,hint)=>{const l=node('label','',parent,label);l.style.display='block';const i=node(type==='textarea'?'textarea':'input','',l);if(type!=='textarea')i.type=type;i.style.cssText='display:block;width:100%;margin:8px 0 '+(hint?'6px':'18px');if(type==='checkbox'){i.style.cssText='margin:0 8px 0 0';l.style.cssText='display:flex;align-items:center;margin:4px 0 14px';l.prepend(i);i.checked=!!value}else i.value=value??'';if(type==='number'){i.step='0.01';i.min='0'}if(hint)node('p','muted',parent,hint);return i};

 // Price: changed through the server so Stripe, checkout and the website stay in step.
 const pp=section(root,'Price');
 node('p','',pp,'Current price: '+money(data.price_pence)+' per mask (all colours)');
 const priceIn=field(pp,'New price (£)','number',pounds(data.price_pence),'Saving creates a new price in Stripe for Black, Pink and Grey. New checkouts use it straight away and the website price updates on the next page load. Orders already paid are not affected. Google’s product listing is refreshed within about 6 hours.');
 const priceBtn=node('button','btn primary',pp,'Change price'),priceMsg=node('p','muted',pp);
 priceBtn.onclick=async()=>{const pence=toPence(priceIn.value);if(!Number.isInteger(pence)||pence<100||pence>100000){priceMsg.textContent='Enter a price between £1.00 and £1,000.00.';return}if(pence===data.price_pence){priceMsg.textContent='That is already the current price.';return}if(!confirm('Change the price from '+money(data.price_pence)+' to '+money(pence)+'? New customers will be charged '+money(pence)+' per mask.'))return;priceBtn.disabled=true;priceMsg.textContent='Updating Stripe…';try{const r=await adminApi('/api/admin-settings',{action:'set_price',price_pence:pence});priceMsg.textContent='Price changed to '+money(r.price_pence)+'.'+(r.compare_cleared?' The sale “was” price was cleared because it was not above the new price.':'')+(r.warnings?.length?' Note: '+r.warnings.join(', ')+'.':'');await settings(root.replaceChildren()||root)}catch(err){priceMsg.textContent='Price not changed: '+err.message;priceBtn.disabled=false}};

 const form=node('form','',root),p=section(form,'Shop settings'),fields={};
 for(const [key,label,type] of [['announcement','Top announcement','text'],['support_email','Customer contact email','email']]){fields[key]=field(p,label,type,data[key]);fields[key].required=true;fields[key].maxLength=key==='announcement'?200:254}
 node('p','muted',p,'The current homepage design has no top announcement bar, so this text is saved but not shown on the website.');
 const wasIn=field(p,'Sale “was” price (£), leave blank for no sale','number',data.price_compare_at_pence==null?'':pounds(data.price_compare_at_pence),'Shows the old price crossed out next to the current price. Under UK pricing rules a “was” price should be one you really charged for a reasonable time.');
 const d=section(form,'Delivery');
 const stdIn=field(d,'UK Standard delivery (£)','number',pounds(data.standard_delivery_pence));
 const expIn=field(d,'UK Express delivery (£)','number',pounds(data.express_delivery_pence));
 const freeIn=field(d,'Free standard delivery from (£)','number',pounds(data.free_delivery_threshold_pence??2500),'Checkout gives free standard delivery when the basket is at least this amount. Delivery prices on the website update automatically.');
 const ps=section(form,'Pause the shop');
 const pausedIn=field(ps,'Pause the shop: stop new orders','checkbox',data.shop_paused);
 const pauseMsgIn=field(ps,'Message shown to customers while paused','text',data.pause_message,'For example: “We’re away until 2 January. Orders reopen then.” Shown in a bar at the top of the website, and at checkout.');pauseMsgIn.maxLength=200;
 const st=section(form,'Stock alert');
 const lowIn=field(st,'Warn when stock is below','number',String(data.low_stock_threshold??20),'Shown on Overview and Products & Stock, and in the daily brief.');lowIn.step='1';
 const de=section(form,'Dispatch email');
 const dispIn=field(de,'Email customers automatically when an order is marked dispatched','checkbox',data.dispatch_email_enabled!==false);
 const noteIn=field(de,'Extra message in the dispatch email (optional)','textarea',data.dispatch_email_note,'For example: “Thank you for supporting a small UK brand!”');noteIn.maxLength=300;noteIn.rows=3;
 const save=node('button','btn primary',form,'Save settings'),msg=node('p','muted',form);
 notice(form,'Contact email changes the website contact links. It does not change the signup email sender or email delivery service.');
 form.onsubmit=async ev=>{ev.preventDefault();
  const free=toPence(freeIn.value),std=toPence(stdIn.value),exp=toPence(expIn.value),was=toPence(wasIn.value),low=Number(lowIn.value);
  const bad=!Number.isInteger(free)||free<0||free>20000?'Free delivery amount must be between £0 and £200.':!Number.isInteger(std)||std<0||std>2000?'Standard delivery must be between £0 and £20.':!Number.isInteger(exp)||exp<0||exp>3000?'Express delivery must be between £0 and £30.':was!==null&&(!Number.isInteger(was)||was<=data.price_pence)?'The “was” price must be higher than the current price ('+money(data.price_pence)+').':!Number.isSafeInteger(low)||low<0||low>10000?'Stock alert must be a whole number from 0 to 10,000.':'';
  if(bad){msg.textContent=bad;return}
  if(pausedIn.checked&&!data.shop_paused&&!confirm('Pause the shop? Customers will not be able to check out until you turn this off.'))return;
  save.disabled=true;
  const patch={announcement:fields.announcement.value.trim(),support_email:fields.support_email.value.trim(),free_delivery_threshold_pence:free,standard_delivery_pence:std,express_delivery_pence:exp,price_compare_at_pence:was,shop_paused:pausedIn.checked,pause_message:pauseMsgIn.value.trim(),low_stock_threshold:low,dispatch_email_enabled:dispIn.checked,dispatch_email_note:noteIn.value.trim(),updated_at:new Date().toISOString()};
  const {error}=await sb.from('store_settings').update(patch).eq('id',true);
  if(!error){Object.assign(data,patch);settingsCache={...settingsCache,...patch}}
  msg.textContent=error?'Save failed: '+error.message:'Saved. '+(patch.shop_paused?'The shop is PAUSED. ':'')+'New website page loads and checkouts use these settings.';save.disabled=false};
}
setInterval(()=>{if(user&&!document.hidden&&['Overview','Customers','Analytics'].includes(page))reload();},30000);
$('loginForm').onsubmit=async ev=>{ev.preventDefault();$('loginMsg').textContent='Signing in…';const {error}=await sb.auth.signInWithPassword({email:$('email').value,password:$('password').value});$('loginMsg').textContent=error?error.message:'';if(!error)await check()};$('logout').onclick=async()=>{await sb.auth.signOut();await check()};check()})();
