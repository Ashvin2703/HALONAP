/* HALONAP Admin Studio. Access is enforced by Supabase RLS (review_admins) and the /api/admin-* routes. */
(()=>{'use strict';
const sb=window.supabase?.createClient('https://ufhobvpuwhainuheewxb.supabase.co','sb_publishable_upE73V2Ve1wcxj8gXZ9U0A_e5EmKhNy');
const $=id=>document.getElementById(id);

/* ---------- tiny DOM helpers (text only, never innerHTML with data) ---------- */
function h(tag,props,...kids){
 const el=document.createElement(tag);
 if(props)for(const [k,v] of Object.entries(props)){
  if(v==null||v===false)continue;
  if(k==='class')el.className=v;
  else if(k==='text')el.textContent=v;
  else if(k==='style')el.style.cssText=v;
  else if(k.startsWith('aria-')||k.startsWith('data-'))el.setAttribute(k,v);
  else if(k in el)el[k]=v;
  else el.setAttribute(k,v===true?'':v);
 }
 for(const kid of kids.flat()){if(kid==null||kid===false||kid==='')continue;el.append(kid instanceof Node?kid:String(kid))}
 return el;
}
const ICONS={
 overview:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
 orders:'<path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
 customers:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.4 3.5 5.2"/>',
 products:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
 payments:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
 reviews:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
 messages:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
 marketing:'<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6l-6 4H4a1 1 0 0 0-1 1z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13"/>',
 analytics:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 settings:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
 external:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 alert:'<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 money:'<path d="M12 3v18M17 7.5c-.8-1.5-2.6-2.5-5-2.5-3 0-4.5 1.6-4.5 3.4 0 4.6 10 2.4 10 7.2 0 1.9-1.8 3.4-5 3.4-2.6 0-4.5-1.1-5.3-2.8"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 cart:'<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 8H6.3"/>'
};
function icon(name){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','i');s.setAttribute('aria-hidden','true');s.innerHTML=ICONS[name]||'';return s}

/* ---------- formatting ---------- */
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format((Number(n)||0)/100);
const ukDate=v=>new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const shortDate=v=>{const d=new Date(v);return isNaN(d)?'':d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})};
const clock=d=>d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
const pretty=s=>{const t=String(s||'—').replace(/_/g,' ');return t.charAt(0).toUpperCase()+t.slice(1)};
const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('')||'?';
const PAID=['paid','partially_refunded','refunded'];
const netPaid=o=>Math.max(0,Number(o.total_pence)-Number(o.refunded_pence||0))||0;
const orderRef=o=>o.order_number||String(o.id).slice(0,8);
const itemsText=o=>(Array.isArray(o.items)?o.items:[]).map(i=>[i.name||i.description||i.colour||i.color||'Sleep mask',i.quantity?'×'+i.quantity:''].join(' ')).join(', ');
const FULFIL=['pending','processing','dispatched','delivered','cancelled'];
const TONE={pending:'amber',processing:'blue',dispatched:'violet',delivered:'green',cancelled:'grey',paid:'green',partially_refunded:'amber',refunded:'grey',unpaid:'red',failed:'red',approved:'green',rejected:'red',new:'blue',in_progress:'amber',resolved:'green'};
const badge=(s,label)=>h('span',{class:'badge '+(TONE[s]||'grey'),text:label||pretty(s)});

/* ---------- UI building blocks ---------- */
function btn(label,opts={}){const b=h('button',{type:opts.type||'button',class:'btn'+(opts.kind?' btn-'+opts.kind:'')+(opts.sm?' btn-sm':''),onclick:opts.onclick||null});if(opts.icon)b.append(icon(opts.icon));if(label)b.append(h('span',{class:'lbl',text:label}));return b}
function linkBtn(label,href,iconName='external'){const a=h('a',{class:'btn',href,target:'_blank',rel:'noopener noreferrer'},h('span',{text:label}));a.append(icon(iconName));return a}
function notice(text,kind='warn'){return h('div',{class:'notice'+(kind==='warn'?'':' '+kind)},icon(kind==='info'?'info':'alert'),h('div',{text}))}
function empty(text){return h('div',{class:'empty',text})}
function panel(title,{sub,actions,flush}={}){const p=h('section',{class:'panel'+(flush?' panel-flush':'')});if(title||actions)p.append(h('div',{class:'panel-head'},h('div',null,title?h('h2',{text:title}):null,sub?h('p',{class:'panel-sub',text:sub}):null),actions?h('div',{class:'panel-actions'},actions):null));return p}
function kpi(label,value,sub,{iconName,onclick}={}){return h(onclick?'button':'div',{class:'kpi',type:onclick?'button':null,onclick:onclick||null},h('div',{class:'kpi-top'},h('span',{text:label}),iconName?h('span',{class:'kpi-icon'},icon(iconName)):null),h('div',{class:'kpi-value',text:value}),h('div',{class:'kpi-sub',text:sub||''}))}
function chips(options,current,onpick){const wrap=h('div',{class:'chips',role:'group'});for(const [value,label,count] of options){const c=h('button',{type:'button',class:'chip'+(value===current?' active':''),'aria-pressed':String(value===current)},h('span',{text:label}),count!=null?h('small',{text:String(count)}):null);c.onclick=()=>{wrap.querySelectorAll('.chip').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});c.classList.add('active');c.setAttribute('aria-pressed','true');onpick(value)};wrap.append(c)}return wrap}
function table(headers){const t=h('table'),tr=h('tr');headers.forEach(x=>{const [label,cls]=Array.isArray(x)?x:[x];tr.append(h('th',{class:cls||null,text:label}))});const body=h('tbody');t.append(h('thead',null,tr),body);return {wrap:h('div',{class:'table-wrap'},t),body}}
function searchBox(placeholder,value,oninput){const i=h('input',{type:'search',placeholder,value:value||'','aria-label':placeholder});i.oninput=()=>oninput(i.value);return h('label',{class:'search'},icon('search'),i)}
function bars(series,{dense}={}){const max=Math.max(1,...series.map(s=>s.value));return h('div',{class:'bars'+(dense?' dense':'')},series.map(s=>h('div',{class:'bar',title:s.title},h('div',{class:'bar-fill'+(s.value?'':' zero'),style:'height:'+Math.max(1.5,s.value/max*100)+'%'}),h('div',{class:'bar-label',text:s.label}))))}
let toastTimer;function toast(text){const t=$('toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3200)}
let uid=0;
function field(parent,label,type,value,hint){
 const wrap=h('div',{class:'field'});let input;
 if(type==='checkbox'){input=h('input',{type:'checkbox',checked:!!value});wrap.append(h('label',{class:'toggle'},input,h('span',{class:'toggle-track'}),h('span',{text:label})))}
 else{input=type==='textarea'?h('textarea'):h('input',{type});input.value=value??'';if(type==='number'){input.step='0.01';input.min='0'}input.id='f'+(++uid);wrap.append(h('label',{htmlFor:input.id,text:label}),input)}
 if(hint)wrap.append(h('p',{class:'hint',text:hint}));parent.append(wrap);return input;
}

/* ---------- data ---------- */
async function adminApi(path,body){const {data:{session}}=await sb.auth.getSession();const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session?.access_token},body:JSON.stringify(body)});const result=await r.json().catch(()=>({}));if(!r.ok)throw Error(result.error||'Request failed ('+r.status+')');return result}
let orders=[],user=null,loadError='',lastSync=null,settingsCache=null,counts={messages:0,reviews:0};
async function loadSettings(){if(!settingsCache){const r=await sb.from('store_settings').select('*').eq('id',true).maybeSingle();settingsCache=r.data}return settingsCache}
const threshold=()=>{const p=settingsCache?.free_delivery_threshold_pence??2500;return '£'+(p%100?(p/100).toFixed(2):p/100)};

async function check(){
 if(!sb){$('loginMsg').textContent='Unable to load secure sign-in. Refresh this page.';return}
 const {data:{user:u}}=await sb.auth.getUser();
 if(!u){user=null;$('app').classList.add('hide');$('login').classList.remove('hide');return}
 const {data:member,error}=await sb.from('review_admins').select('user_id').eq('user_id',u.id).maybeSingle();
 if(error||!member){await sb.auth.signOut();$('loginMsg').textContent='This account does not have administrator access.';return}
 user=u;$('login').classList.add('hide');$('app').classList.remove('hide');
 $('adminEmail').textContent=u.email||'Admin';$('adminAvatar').textContent=initials(u.user_metadata?.full_name||u.email);
 await reload();
}
async function reload(){
 const {data,error}=await sb.from('customer_orders').select('id,order_number,items,total_pence,currency,payment_status,fulfillment_status,tracking_number,customer_name,customer_email,customer_phone,shipping_address,created_at,dispatched_at,refunded_pence,refund_status,attribution,inventory_issue,dispatch_email_sent_at,confirmation_email_sent_at,review_request_sent_at').order('created_at',{ascending:false}).limit(500);
 if(error)loadError=error.message;else{orders=data||[];loadError='';lastSync=new Date()}
 loadCounts();render();
}
async function loadCounts(){
 try{
  const [m,r]=await Promise.all([
   sb.from('customer_messages').select('id',{count:'exact',head:true}).or('support_status.is.null,support_status.eq.new'),
   sb.from('product_reviews').select('id',{count:'exact',head:true}).eq('status','pending')
  ]);
  counts={messages:m.count||0,reviews:r.count||0};renderNav();
 }catch(e){/* counts are a convenience only */}
}

/* ---------- navigation ---------- */
const PAGES=[
 {id:'overview',label:'Overview',icon:'overview',group:'Store',sub:'Today’s business at a glance.'},
 {id:'orders',label:'Orders',icon:'orders',group:'Store',sub:'Fulfil orders, add tracking and send dispatch emails.'},
 {id:'customers',label:'Customers',icon:'customers',group:'Store',sub:'Everyone who has ordered, and what they spent.'},
 {id:'products',label:'Products & Stock',icon:'products',group:'Store',sub:'Stock levels and availability per colour.'},
 {id:'payments',label:'Payments',icon:'payments',group:'Store',sub:'Stripe receipts, refund status and refunds.'},
 {id:'reviews',label:'Reviews',icon:'reviews',group:'Customers',sub:'Approve customer reviews before they go live.'},
 {id:'messages',label:'Customer Messages',icon:'messages',group:'Customers',sub:'Contact form enquiries and replies.'},
 {id:'marketing',label:'Marketing',icon:'marketing',group:'Growth',sub:'Campaign links and the sales they bring in.'},
 {id:'analytics',label:'Analytics',icon:'analytics',group:'Growth',sub:'Orders and paid revenue over time.'},
 {id:'settings',label:'Settings',icon:'settings',group:'Admin',sub:'Price, delivery, shop status and emails.'}
];
const AUTO_REFRESH=['overview','customers','analytics'];
let page=PAGES.some(p=>p.id===location.hash.slice(1))?location.hash.slice(1):'overview';
function go(id){if(location.hash.slice(1)===id){page=id;render()}else location.hash=id;closeNav()}
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(PAGES.some(p=>p.id===id)&&id!==page){page=id;closeDrawer();render();$('content').focus({preventScroll:true});window.scrollTo(0,0)}});
function renderNav(){
 const nav=$('nav');nav.replaceChildren();let group='';
 const pending=orders.filter(o=>(o.fulfillment_status||'pending')==='pending').length;
 const badgeFor={orders:pending,messages:counts.messages,reviews:counts.reviews};
 for(const p of PAGES){
  if(p.group!==group){group=p.group;nav.append(h('div',{class:'nav-group',text:group}))}
  const a=h('a',{href:'#'+p.id,class:'nav'+(page===p.id?' active':''),'aria-current':page===p.id?'page':null},icon(p.icon),h('span',{text:p.label}));
  if(badgeFor[p.id])a.append(h('span',{class:'nav-count',text:String(badgeFor[p.id]),'aria-label':badgeFor[p.id]+' need attention'}));
  a.onclick=e=>{e.preventDefault();go(p.id)};nav.append(a);
 }
}
function render(){
 renderNav();
 const def=PAGES.find(p=>p.id===page);
 $('pageTitle').textContent=def.label;$('pageSub').textContent=def.sub;document.title=def.label+' · HALONAP Admin';
 $('syncInfo').textContent=lastSync?'Latest 500 orders · synced '+clock(lastSync)+(AUTO_REFRESH.includes(page)?' · auto-refresh 30s':''):'';
 const view=h('div',{class:'view'});$('content').replaceChildren(view);
 if(loadError)view.append(notice('Order data could not be loaded: '+loadError,'danger'));
 Promise.resolve(VIEWS[page](view)).catch(err=>view.append(notice('Something went wrong: '+err.message,'danger')));
}
const openNav=()=>{document.body.classList.add('nav-open');$('menuBtn').setAttribute('aria-expanded','true')};
const closeNav=()=>{document.body.classList.remove('nav-open');$('menuBtn').setAttribute('aria-expanded','false')};

/* ---------- Overview ---------- */
function overview(root){
 const hr=new Date().getHours(),first=(user?.user_metadata?.full_name||'').split(' ')[0];
 root.append(h('div',{class:'hello'},h('div',null,h('div',{class:'eyebrow',text:new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}),h('h2',{text:(hr<12?'Good morning':hr<18?'Good afternoon':'Good evening')+(first?', '+first:'')}),h('p',{text:'Your orders, customers and business insights in one place.'})),h('div',{class:'hello-mark',text:'✦'})));
 const paid=orders.filter(o=>PAID.includes(o.payment_status));
 const pending=orders.filter(o=>(o.fulfillment_status||'pending')==='pending').length;
 root.append(h('div',{class:'kpis'},
  kpi('Revenue',money(paid.reduce((s,o)=>s+netPaid(o),0)),'Paid, after refunds · last 500 orders',{iconName:'money'}),
  kpi('Total orders',String(orders.length),'Loaded order records',{iconName:'orders',onclick:()=>{orderFilter='All';go('orders')}}),
  kpi('Pending fulfilment',String(pending),pending?'Action required →':'All caught up',{iconName:'clock',onclick:()=>{orderFilter='pending';go('orders')}}),
  kpi('Customers',String(new Set(orders.map(o=>o.customer_email).filter(Boolean)).size),'Unique emails in orders',{iconName:'customers',onclick:()=>go('customers')})
 ));
 const alerts=h('div',{class:'stack'});root.append(alerts);
 (async()=>{const s=await loadSettings();const low=s?.low_stock_threshold??20;if(s?.shop_paused)alerts.append(notice('The shop is paused: customers cannot check out. Turn it back on in Settings.','danger'));const {data:inv}=await sb.from('product_inventory').select('colour,stock_quantity,is_active');for(const i of inv||[]){if(i.stock_quantity!==null&&i.stock_quantity<low)alerts.append(notice('Low stock: '+i.colour+' has '+i.stock_quantity+' left.'));if(i.is_active===false)alerts.append(notice(i.colour+' is hidden from the shop.','info'))}})();

 const grid=h('div',{class:'grid-main'});root.append(grid);
 // Last 30 days chart
 const days=[];const today=new Date();today.setHours(0,0,0,0);
 for(let i=29;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);days.push({d,orders:0,revenue:0})}
 for(const o of orders){const d=new Date(o.created_at);d.setHours(0,0,0,0);const slot=days.find(x=>x.d.getTime()===d.getTime());if(slot){slot.orders++;if(PAID.includes(o.payment_status))slot.revenue+=netPaid(o)}}
 const chart=panel('Last 30 days',{sub:'Paid revenue per day'});
 chart.append(bars(days.map(x=>({value:x.revenue,label:x.d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}),title:x.d.toLocaleDateString('en-GB')+': '+x.orders+' orders · '+money(x.revenue)})),{dense:true}));
 const sum30=days.reduce((a,x)=>({o:a.o+x.orders,r:a.r+x.revenue}),{o:0,r:0});
 chart.append(h('div',{class:'chart-legend'},h('div',null,h('strong',{text:money(sum30.r)}),'Revenue · 30 days'),h('div',null,h('strong',{text:String(sum30.o)}),'Orders · 30 days'),h('div',null,h('strong',{text:sum30.o?money(Math.round(sum30.r/Math.max(1,sum30.o))):'—'}),'Avg. order value')));
 grid.append(chart);
 // Stripe checkouts
 const cs=panel('Stripe checkouts',{sub:'Abandoned = opened Stripe checkout but did not pay before it expired (24 hours).'});
 const csArea=h('div',{class:'kpis kpis-inner',style:'grid-template-columns:repeat(2,minmax(0,1fr))'},h('p',{class:'muted',text:'Loading from Stripe…'}));cs.append(csArea);grid.append(cs);
 adminApi('/api/admin-orders',{action:'checkout_stats'}).then(st=>{const d=st.last_24h,w=st.last_7d;csArea.replaceChildren(
  kpi('Checkouts today',String(d.started),d.completed+' paid · '+d.open+' still open'),
  kpi('Abandoned today',String(d.abandoned),money(d.abandoned_pence)+' not paid'),
  kpi('Checkouts · 7 days',String(w.started),w.completed+' paid'+(st.truncated?' · latest 500':'')),
  kpi('Abandoned · 7 days',String(w.abandoned),w.started?Math.round(100*w.completed/w.started)+'% of checkouts paid':'No checkouts yet'))}).catch(err=>{csArea.replaceChildren(notice('Stripe checkouts could not be loaded: '+err.message,'danger'))});

 const recent=panel('Recent orders',{flush:true,actions:btn('View all orders →',{sm:true,onclick:()=>{orderFilter='All';go('orders')}})});
 if(orders.length)recent.append(orderTable(orders.slice(0,8)));else{const pad=h('div',{style:'padding:0 22px 22px'},empty('No synced orders yet. Stripe checkout and webhook delivery must be tested before orders appear.'));recent.append(pad)}
 root.append(recent);
}

/* ---------- Orders ---------- */
let orderFilter='All',orderQuery='';
function orderTable(rows){
 const {wrap,body}=table(['Order','Customer','Products',['Total','num'],'Payment','Fulfilment','']);
 for(const o of rows){
  const cu=h('td',null,h('div',{class:'person'},h('span',{class:'avatar',text:initials(o.customer_name||o.customer_email)}),h('div',null,h('span',{class:'cell-strong',text:o.customer_name||'Guest'}),h('span',{class:'sub',text:o.customer_email||'No email'}))));
  const fulfil=h('td',null,badge(o.fulfillment_status||'pending'));if(o.dispatch_email_sent_at)fulfil.append(h('span',{class:'sub',text:'Dispatch email sent'}));
  const manage=btn('Manage',{sm:true});manage.onclick=e=>{e.stopPropagation();details(o,'',manage)};
  const tr=h('tr',{class:'clickable'},
   h('td',null,h('span',{class:'cell-strong',text:orderRef(o)}),h('span',{class:'sub',text:shortDate(o.created_at)})),
   cu,h('td',{text:itemsText(o)||'—'}),h('td',{class:'num cell-strong',text:money(o.total_pence)}),
   h('td',null,o.payment_status?badge(o.payment_status):'—'),fulfil,h('td',{class:'num'},manage));
  tr.onclick=()=>details(o,'',manage);body.append(tr);
 }
 return wrap;
}
function ordersPage(root){
 const countOf=s=>orders.filter(o=>s==='All'||(o.fulfillment_status||'pending')===s).length;
 const p=panel(null,{flush:true});root.append(p);
 const bar=h('div',{class:'toolbar',style:'padding:18px 22px'});p.append(bar);
 const area=h('div');p.append(area);
 bar.append(searchBox('Search order, name, email, phone…',orderQuery,v=>{orderQuery=v;update()}),
  chips([['All','All',countOf('All')],...FULFIL.map(s=>[s,pretty(s),countOf(s)])],orderFilter,v=>{orderFilter=v;update()}),
  btn('Refresh',{icon:'refresh',onclick:reload}));
 function update(){
  area.replaceChildren();const q=orderQuery.toLowerCase();
  const rows=orders.filter(o=>(orderFilter==='All'||(o.fulfillment_status||'pending')===orderFilter)&&[o.order_number,o.customer_name,o.customer_email,o.customer_phone].some(v=>String(v||'').toLowerCase().includes(q)));
  if(rows.length)area.append(orderTable(rows));else area.append(h('div',{style:'padding:0 22px 22px'},empty(orders.length?'No orders match this search.':'No orders recorded yet.')));
 }
 update();
 if(orders.length===500)root.append(notice('Showing the latest 500 orders. Pagination is not yet enabled.','info'));
}

/* ---------- Order drawer ---------- */
let drawerOrderId=null,drawerOpener=null;
function openDrawer(){const s=$('scrim'),d=$('drawer');d.inert=false;s.hidden=false;requestAnimationFrame(()=>s.classList.add('show'));d.classList.add('open');d.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeDrawer(){const s=$('scrim'),d=$('drawer');if(!d.classList.contains('open'))return;d.classList.remove('open');d.setAttribute('aria-hidden','true');d.inert=true;s.classList.remove('show');setTimeout(()=>{s.hidden=true},200);document.body.style.overflow='';drawerOrderId=null;if(drawerOpener?.isConnected)drawerOpener.focus();drawerOpener=null}
async function afterOrderChange(id,text){await reload();const fresh=orders.find(x=>x.id===id);if(fresh&&drawerOrderId===id)details(fresh,text)}
function details(o,flash,opener){
 if(opener)drawerOpener=opener;
 const wasOpen=drawerOrderId===o.id;drawerOrderId=o.id;
 $('drawerTitle').textContent=orderRef(o);
 const body=$('drawerBody');body.replaceChildren();
 if(o.inventory_issue)body.append(notice('Stock action required: '+o.inventory_issue,'danger'));
 body.append(h('div',{class:'facts'},
  h('div',{class:'fact'},h('span',{text:'Placed'}),ukDate(o.created_at)),
  h('div',{class:'fact'},h('span',{text:'Total'}),h('strong',{text:money(o.total_pence)})),
  h('div',{class:'fact'},h('span',{text:'Payment'}),o.payment_status?badge(o.payment_status):'—',o.refunded_pence?h('div',{class:'sub muted',text:'Refunded '+money(o.refunded_pence)}):null),
  h('div',{class:'fact'},h('span',{text:'Fulfilment'}),badge(o.fulfillment_status||'pending'))));
 body.append(h('div',{class:'block'},h('h3',{text:'Items'}),h('p',{text:itemsText(o)||'—'})));
 const a=o.shipping_address||{};
 const cust=h('div',{class:'block'},h('h3',{text:'Customer'}),h('p',{class:'cell-strong',text:o.customer_name||'Guest'}));
 if(o.customer_email)cust.append(h('p',null,h('a',{href:'mailto:'+encodeURIComponent(o.customer_email),text:o.customer_email})));
 if(o.customer_phone)cust.append(h('p',{text:o.customer_phone}));
 body.append(cust,h('div',{class:'block'},h('h3',{text:'Delivery address'}),h('p',{text:[a.line1,a.line2,a.city,a.state,a.postal_code,a.country].filter(Boolean).join(', ')||'Delivery address not yet synced from Stripe'})));

 const upd=h('div',{class:'block'},h('h3',{text:'Update fulfilment'}));
 const status=h('select',{'aria-label':'Fulfilment status'});FULFIL.forEach(s=>status.append(h('option',{value:s,text:pretty(s)})));status.value=o.fulfillment_status||'pending';
 const tracking=h('input',{placeholder:'Tracking number','aria-label':'Tracking number',maxLength:120});tracking.value=o.tracking_number||'';
 const save=btn('Save order update',{kind:'primary'}),msg=h('p',{class:'msg',role:'status',text:flash||''});
 upd.append(h('div',{class:'form-grid',style:'margin-bottom:12px'},status,tracking),h('div',{class:'toolbar'},save),msg,
  h('p',{class:'hint',style:'margin-top:10px',text:'Marking an order dispatched emails the customer automatically (if turned on in Settings). Cancelling fulfilment does not refund payment or return stock: use Payments for refunds, and add stock only after goods are returned.'}));
 body.append(upd);

 const mails=h('div',{class:'block'},h('h3',{text:'Customer emails'}));
 const line=(on,text)=>h('li',null,h('span',{class:'dot'+(on?' on':'')}),h('span',{text}));
 mails.append(h('ul',{class:'timeline'},
  line(o.confirmation_email_sent_at,o.confirmation_email_sent_at?'Order confirmation sent '+ukDate(o.confirmation_email_sent_at):'Order confirmation not sent'),
  line(o.dispatch_email_sent_at,o.dispatch_email_sent_at?'Dispatch email sent '+ukDate(o.dispatch_email_sent_at):'Dispatch email not sent yet'),
  line(o.review_request_sent_at,o.review_request_sent_at?'Review request sent '+ukDate(o.review_request_sent_at):'Review request not sent yet')));
 if(o.fulfillment_status==='dispatched'&&o.customer_email){
  const resend=btn(o.dispatch_email_sent_at?'Resend dispatch email':'Send dispatch email',{sm:true});
  resend.style.marginTop='12px';mails.append(resend);
  resend.onclick=async()=>{if(o.dispatch_email_sent_at&&!confirm('Send the dispatch email to '+o.customer_email+' again?'))return;resend.disabled=true;msg.textContent='Sending dispatch email…';try{const result=await adminApi('/api/admin-orders',{action:'notify_dispatch',order_id:o.id,resend:true});const t=result.sent?'Dispatch email sent to '+o.customer_email:'Another admin just sent it. Nothing more was sent.';toast(t);await afterOrderChange(o.id,t)}catch(err){msg.textContent='Dispatch email failed: '+err.message;resend.disabled=false}};
 }
 body.append(mails);

 save.onclick=async()=>{
  save.disabled=true;msg.textContent='Saving…';
  const patch={fulfillment_status:status.value,tracking_number:tracking.value.trim()||null};
  if(status.value==='dispatched'&&!o.dispatched_at)patch.dispatched_at=new Date().toISOString();
  const {error}=await sb.from('customer_orders').update(patch).eq('id',o.id);
  let text=error?'Save failed: '+error.message:'Order updated successfully';msg.textContent=text;
  if(!error&&status.value==='dispatched'){msg.textContent='Order updated · sending dispatch email…';try{const result=await adminApi('/api/admin-orders',{action:'notify_dispatch',order_id:o.id,auto:true});text=result.disabled?'Order updated · automatic dispatch emails are turned off in Settings':result.sent?'Order updated · dispatch email sent to customer':'Order updated · dispatch email was already sent earlier'}catch(err){text='Order updated, but dispatch email failed: '+err.message+' Save again to retry.'}msg.textContent=text}
  save.disabled=false;
  if(!error){toast(text);await afterOrderChange(o.id,text)}
 };
 if(!wasOpen){openDrawer();body.scrollTop=0;$('drawerClose').focus()}
}

/* ---------- Customers ---------- */
let customerQuery='';
function customers(root){
 const map=new Map();
 orders.forEach(o=>{if(!o.customer_email)return;const k=o.customer_email.toLowerCase(),v=map.get(k)||{name:o.customer_name||'Customer',email:o.customer_email,orders:0,spent:0,last:o.created_at};v.orders++;if(PAID.includes(o.payment_status))v.spent+=netPaid(o);if(o.created_at>v.last)v.last=o.created_at;map.set(k,v)});
 const all=[...map.values()].sort((a,b)=>b.spent-a.spent);
 const repeat=all.filter(c=>c.orders>1).length;
 root.append(h('div',{class:'kpis three'},kpi('Customers',String(all.length),'Unique emails in orders',{iconName:'customers'}),kpi('Repeat customers',String(repeat),all.length?Math.round(100*repeat/all.length)+'% ordered more than once':'—',{iconName:'refresh'}),kpi('Avg. spend per customer',all.length?money(Math.round(all.reduce((n,c)=>n+c.spent,0)/all.length)):'—','Paid, after refunds',{iconName:'money'})));
 const p=panel(null,{flush:true});root.append(p);
 const area=h('div');
 p.append(h('div',{class:'toolbar',style:'padding:18px 22px'},searchBox('Search name or email…',customerQuery,v=>{customerQuery=v;update()})),area);
 function update(){area.replaceChildren();const q=customerQuery.toLowerCase();const rows=all.filter(c=>(c.name+' '+c.email).toLowerCase().includes(q));if(!rows.length){area.append(h('div',{style:'padding:0 22px 22px'},empty('No customers found.')));return}const {wrap,body}=table(['Customer','Email',['Orders','num'],['Paid spend','num'],'Last order']);for(const c of rows)body.append(h('tr',null,h('td',null,h('div',{class:'person'},h('span',{class:'avatar',text:initials(c.name)}),h('span',{class:'cell-strong',text:c.name}))),h('td',null,h('a',{href:'mailto:'+encodeURIComponent(c.email),text:c.email})),h('td',{class:'num',text:String(c.orders)}),h('td',{class:'num cell-strong',text:money(c.spent)}),h('td',{text:shortDate(c.last)})));area.append(wrap)}
 update();
 root.append(notice('This list contains customers from synced orders, not every registered account.','info'));
}

/* ---------- Products & Stock ---------- */
const SWATCH={Black:'#1f1f1f',Pink:'#e9b9c1',Grey:'#a3a39d'};
async function products(root){
 root.append(notice('Set real stock quantities before enabling stock limits. Blank stock means not yet configured. Prices are changed in Settings.','info'));
 const grid=h('div',{class:'product-grid'});root.append(grid);
 const {data,error}=await sb.from('product_inventory').select('colour,stock_quantity,is_active,updated_at').order('colour');
 if(error){root.append(notice('Could not load inventory: '+error.message,'danger'));return}
 const s=await loadSettings();const low=s?.low_stock_threshold??20;
 if(!data?.length)grid.append(empty('No products found.'));
 for(const item of data||[]){
  const isLow=item.stock_quantity!==null&&item.stock_quantity<low;
  const card=h('section',{class:'panel product-card'});grid.append(card);
  card.append(h('div',{class:'product-head'},h('span',{class:'swatch',style:'background:'+(SWATCH[item.colour]||'#ddd')}),h('div',{style:'flex:1;min-width:0'},h('h3',{text:item.colour}),h('p',{text:'HALONAP Sleep Eye Mask'})),item.is_active===false?badge('cancelled','Hidden'):badge('approved','Available')));
  card.append(h('div',null,h('div',{class:'stock-big',text:item.stock_quantity===null?'—':String(item.stock_quantity)}),h('div',{class:'kpi-sub',text:(item.stock_quantity===null?'Stock not configured':'in stock')+' · '+(item.updated_at?'updated '+ukDate(item.updated_at):'not yet updated')})));
  if(isLow)card.append(notice('Low stock: '+item.stock_quantity+' left (alert below '+low+').'));
  const stock=h('input',{type:'number',min:'0',step:'1',placeholder:'Stock not configured','aria-label':item.colour+' stock quantity'});stock.value=item.stock_quantity===null?'':String(item.stock_quantity);
  const status=h('select',{'aria-label':item.colour+' availability'},h('option',{value:'true',text:'Available'}),h('option',{value:'false',text:'Hidden / unavailable'}));status.value=String(item.is_active);
  const save=btn('Save changes',{kind:'primary'}),msg=h('span',{class:'msg',role:'status'});
  card.append(h('div',{class:'form-grid'},h('div',{class:'field'},h('label',{text:'Stock quantity'}),stock),h('div',{class:'field'},h('label',{text:'Availability'}),status)),h('div',{class:'toolbar'},save,msg));
  save.onclick=async()=>{const qty=stock.value.trim()===''?null:Number(stock.value);if(qty!==null&&(!Number.isSafeInteger(qty)||qty<0)){msg.textContent='Enter a valid whole number';return}save.disabled=true;const {error}=await sb.from('product_inventory').update({stock_quantity:qty,is_active:status.value==='true',updated_at:new Date().toISOString()}).eq('colour',item.colour);msg.textContent=error?'Save failed: '+error.message:'Saved successfully';if(!error)toast(item.colour+' stock saved');save.disabled=false};
 }
}

/* ---------- Payments ---------- */
async function paymentAction(action,o,button,msg,refundCell,payCell){
 button.disabled=true;msg.textContent='Contacting Stripe…';
 try{const result=await adminApi('/api/admin-payments',{action,order_id:o.id});Object.assign(o,result);msg.textContent='Stripe checked · Refunded '+money(result.refunded_pence)+' · '+(result.refund_status||'No refunds');refundCell.textContent=money(o.refunded_pence||0);if(o.payment_status)payCell.replaceChildren(badge(o.payment_status));if(action==='refund')toast('Refund requested for '+orderRef(o))}
 catch(error){msg.textContent=error.message}finally{button.disabled=false}
}
function payments(root){
 root.append(h('div',{class:'kpis three'},
  kpi('Order receipts',money(orders.reduce((n,o)=>n+Number(o.total_pence||0),0)),'Latest 500 orders',{iconName:'money'}),
  kpi('Refunded',money(orders.reduce((n,o)=>n+Number(o.refunded_pence||0),0)),'Confirmed successful refunds',{iconName:'refresh'}),
  kpi('Net receipts',money(orders.reduce((n,o)=>n+Number(o.total_pence||0)-Number(o.refunded_pence||0),0)),'Before Stripe fees',{iconName:'payments'})));
 root.append(notice('Refunds go to the original payment method. Stock is not returned automatically. Use Sync from Stripe to refresh pending refunds.','info'));
 const p=panel('Payments & refunds',{flush:true,actions:linkBtn('Stripe fees & payouts','https://dashboard.stripe.com/payments')});root.append(p);
 if(!orders.length){p.append(h('div',{style:'padding:0 22px 22px'},empty('No live orders yet. Test payments are kept separately.')));return}
 const {wrap,body}=table(['Order','Customer',['Total','num'],'Payment',['Refunded','num'],'Actions']);p.append(wrap);
 for(const o of orders){
  const msg=h('span',{class:'sub',text:o.refund_status?'Refund '+o.refund_status:''});
  const refundCell=h('td',{class:'num',text:money(o.refunded_pence||0)}),payCell=h('td',null,o.payment_status?badge(o.payment_status):'—');
  const sync=btn('Sync from Stripe',{sm:true}),refund=btn('Refund remaining',{sm:true,kind:'danger'});
  sync.onclick=()=>paymentAction('sync',o,sync,msg,refundCell,payCell);
  refund.onclick=()=>{if(confirm('Refund the remaining payment for '+orderRef(o)+'? This sends money back to the customer.'))paymentAction('refund',o,refund,msg,refundCell,payCell)};
  body.append(h('tr',null,h('td',null,h('span',{class:'cell-strong',text:orderRef(o)}),h('span',{class:'sub',text:shortDate(o.created_at)})),h('td',{text:o.customer_name||'Customer'}),h('td',{class:'num cell-strong',text:money(o.total_pence)}),payCell,refundCell,h('td',null,h('div',{class:'toolbar',style:'flex-wrap:nowrap'},sync,refund),msg)));
 }
}

/* ---------- Reviews ---------- */
let reviewFilter='pending';
async function reviews(root){
 const p=panel(null);root.append(p);
 const area=h('div',{class:'card-list'});let data=[];
 const bar=h('div',{class:'toolbar',style:'margin-bottom:18px'});p.append(bar,area);
 function drawBar(){const c=s=>data.filter(r=>s==='All'||r.status===s).length;bar.replaceChildren(chips([['pending','Pending',c('pending')],['approved','Approved',c('approved')],['rejected','Rejected',c('rejected')],['All','All',c('All')]],reviewFilter,v=>{reviewFilter=v;show()}),btn('Refresh',{icon:'refresh',onclick:load}))}
 function show(){
  area.replaceChildren();const visible=data.filter(r=>reviewFilter==='All'||r.status===reviewFilter);
  if(!visible.length){area.append(empty('No reviews in this category.'));return}
  for(const review of visible){
   const box=h('article',{class:'item-card'});area.append(box);
   const rating=Math.max(0,Math.min(5,Number(review.rating)||0));
   box.append(h('div',{class:'item-meta'},badge(review.status||'pending'),h('span',{text:shortDate(review.created_at)})),
    h('div',{style:'display:flex;align-items:center;gap:10px;flex-wrap:wrap'},h('h3',{text:review.name||'Customer'}),h('span',{class:'stars','aria-label':rating+' out of 5 stars',text:'★'.repeat(rating)+'☆'.repeat(5-rating)})),
    h('p',{text:review.review||''}));
   if(review.media_paths?.length){const gallery=h('div',{class:'media'});box.append(gallery);for(const path of review.media_paths){const url=sb.storage.from('review-media').getPublicUrl(path).data.publicUrl;if(/\.(mp4|webm|mov)$/i.test(path))gallery.append(h('video',{src:url,controls:true,preload:'metadata'}));else gallery.append(h('a',{href:url,target:'_blank',rel:'noopener noreferrer'},h('img',{src:url,alt:'Customer review photo',loading:'lazy'})))}}
   const actions=h('div',{class:'item-actions'}),msg=h('span',{class:'msg',role:'status'});box.append(actions);
   for(const [label,status,kind] of [['Approve','approved','primary'],['Reject','rejected',''],['Delete','delete','danger']]){
    const b=btn(label,{sm:true,kind});b.disabled=status===review.status;actions.append(b);
    b.onclick=async()=>{if(status==='delete'&&!confirm('Permanently delete this review?'))return;b.disabled=true;msg.textContent='Saving…';const result=status==='delete'?await sb.from('product_reviews').delete().eq('id',review.id):await sb.from('product_reviews').update({status}).eq('id',review.id);if(result.error){msg.textContent='Error: '+result.error.message;b.disabled=false}else{toast(status==='delete'?'Review deleted':'Review '+status);await load();loadCounts()}};
   }
   actions.append(msg);
  }
 }
 async function load(){area.replaceChildren(h('p',{class:'muted',text:'Loading reviews…'}));const res=await sb.from('product_reviews').select('id,name,rating,review,status,media_paths,created_at').order('created_at',{ascending:false}).limit(200);if(res.error){area.replaceChildren(notice('Could not load reviews: '+res.error.message,'danger'));return}data=res.data||[];drawBar();show()}
 drawBar();await load();
}

/* ---------- Customer Messages ---------- */
const SIGN='\n\nSleep well,\nHALONAP Customer Care';
const TEMPLATES={
 'Where is my order?':'Hi [name],\n\nThanks for getting in touch. Your order [order reference] was dispatched on [date] with tracking number [tracking]. UK Standard Delivery usually arrives within 3 business days of dispatch.\n\nIf it has not arrived by [date], reply here and we will sort it out straight away.'+SIGN,
 'Not dispatched yet':'Hi [name],\n\nThanks for your patience. Your order [order reference] is being packed and will be dispatched by [date]. You will get an email with your tracking number as soon as it leaves us.'+SIGN,
 'Return request':'Hi [name],\n\nWe are sorry the mask was not right for you. You can return it within 30 days of delivery. Please send it to:\n\n[return address]\n\nInclude your order reference [order reference] in the parcel. Once it arrives we will refund your original payment method within 5 business days.'+SIGN,
 'Faulty or damaged':'Hi [name],\n\nWe are really sorry about this. Could you reply with a photo of the issue? As soon as we see it we will send a replacement or a full refund, whichever you prefer. You will not need to pay for return postage.'+SIGN,
 'Product question':'Hi [name],\n\nGreat question. [answer]\n\nThe mask comes in Black, Pink and Grey, and standard UK delivery is free on orders of [threshold] or more.'+SIGN
};
let messageFilter='all';
async function messages(root){
 await loadSettings();
 const p=panel(null);root.append(p);
 const bar=h('div',{class:'toolbar',style:'margin-bottom:18px'}),area=h('div',{class:'card-list'});p.append(bar,area);let items=[];
 const ticket=m=>'HN-'+String(m.id||'').replace(/-/g,'').slice(0,10).toUpperCase();
 function drawBar(){const c=s=>items.filter(x=>s==='all'||(x.support_status||'new')===s).length;bar.replaceChildren(chips([['all','All',c('all')],['new','New',c('new')],['in_progress','In Progress',c('in_progress')],['resolved','Resolved',c('resolved')]],messageFilter,v=>{messageFilter=v;show()}),btn('Refresh',{icon:'refresh',onclick:load}))}
 function show(){
  area.replaceChildren();
  const shown=items.filter(x=>messageFilter==='all'||(x.support_status||'new')===messageFilter);
  if(!shown.length){area.append(empty('No messages in this category.'));return}
  for(const m of shown){
   const state=m.support_status||'new';
   const box=h('article',{class:'item-card'});area.append(box);
   box.append(h('div',{class:'item-meta'},badge(state),h('span',{text:ticket(m)}),h('span',{text:new Date(m.created_at).toLocaleString('en-GB')})),
    h('div',{class:'person'},h('span',{class:'avatar',text:initials(m.name)}),h('div',null,h('h3',{text:m.name||'Customer'}),h('a',{href:'mailto:'+encodeURIComponent(m.email)+'?subject='+encodeURIComponent('Re: HALONAP enquiry '+ticket(m)),text:m.email}))),
    h('p',{class:'muted',text:'Topic: '+(m.topic||'General enquiry')+(m.order_number?' · Order: '+m.order_number:'')+(m.phone?' · Phone: '+m.phone:'')}),
    h('div',{class:'message-body',text:m.message}));
   const statusSelect=h('select',{'aria-label':'Message status'},...[['new','New'],['in_progress','In Progress'],['resolved','Resolved']].map(([value,text])=>h('option',{value,text})));statusSelect.value=state;
   const tpl=h('select',{'aria-label':'Reply template'},...[['','Reply with template…'],...Object.keys(TEMPLATES).map(k=>[k,k])].map(([value,text])=>h('option',{value,text})));
   const del=btn('Delete',{sm:true,kind:'danger'}),status=h('span',{class:'msg',role:'status'});
   box.append(h('div',{class:'item-actions'},statusSelect,tpl,del,status));
   tpl.onchange=async()=>{const t=TEMPLATES[tpl.value];if(!t)return;const first=(m.name||'there').trim().split(/\s+/)[0];const text=t.replace(/\[name\]/g,first).replace(/\[order reference\]/g,m.order_number||'[order reference]').replace(/\[threshold\]/g,threshold());location.href='mailto:'+encodeURIComponent(m.email)+'?subject='+encodeURIComponent('Re: HALONAP enquiry '+ticket(m))+'&body='+encodeURIComponent(text);tpl.value='';if(state==='new'){await sb.from('customer_messages').update({support_status:'in_progress',is_read:true}).eq('id',m.id);await load();loadCounts()}};
   statusSelect.onchange=async()=>{statusSelect.disabled=true;const {error}=await sb.from('customer_messages').update({support_status:statusSelect.value,is_read:true}).eq('id',m.id);if(error){status.textContent='Update failed: '+error.message;statusSelect.value=state;statusSelect.disabled=false}else{toast('Message marked '+pretty(statusSelect.value).toLowerCase());await load();loadCounts()}};
   del.onclick=async()=>{if(!confirm('Delete this customer message?'))return;del.disabled=true;const {error}=await sb.from('customer_messages').delete().eq('id',m.id);if(error){status.textContent=error.message;del.disabled=false}else{toast('Message deleted');await load();loadCounts()}};
  }
 }
 async function load(){area.replaceChildren(h('p',{class:'muted',text:'Loading messages…'}));const {data,error}=await sb.from('customer_messages').select('id,name,email,phone,order_number,topic,message,is_read,support_status,created_at').order('created_at',{ascending:false}).limit(500);if(error){area.replaceChildren(notice('Unable to load messages: '+error.message,'danger'));return}items=data||[];drawBar();show()}
 drawBar();await load();
}

/* ---------- Marketing ---------- */
async function marketing(root){
 const p=panel('Create a campaign link',{sub:'Use the link in posts, WhatsApp or ads. Orders keep the campaign from the page where checkout started.'});root.append(p);
 const f=h('form',{class:'form-grid'}),fields={};p.append(f);
 for(const [key,label,ph] of [['name','Campaign name','Autumn launch'],['source','Source','instagram / whatsapp'],['medium','Medium','social / email'],['campaign','Campaign code','autumn_launch']]){
  const input=h('input',{required:true,maxLength:key==='name'?100:80,placeholder:ph});if(key!=='name'){input.pattern='[a-zA-Z0-9_-]+';input.title='Letters, numbers, - and _ only'}
  input.id='mk-'+key;fields[key]=input;f.append(h('div',{class:'field',style:'margin:0'},h('label',{htmlFor:input.id,text:label}),input));
 }
 const save=btn('Create campaign link',{kind:'primary',type:'submit'});f.append(h('div',null,save));
 const msg=h('p',{class:'msg',role:'status'});p.append(msg);
 p.append(h('p',{class:'hint',style:'margin-top:8px',text:'Sales below cover the latest 500 orders. Ad spend, impressions and external ad publishing require a connected ad account.'}));
 const listPanel=panel('Campaigns');root.append(listPanel);const list=h('div',{class:'card-list'});listPanel.append(list);
 f.onsubmit=async ev=>{ev.preventDefault();save.disabled=true;const row=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value.trim()]));const {error}=await sb.from('marketing_campaigns').insert(row);msg.textContent=error?'Could not save: '+error.message:'Campaign saved';save.disabled=false;if(!error){toast('Campaign saved');f.reset();await loadCampaigns()}};
 async function loadCampaigns(){
  const {data,error}=await sb.from('marketing_campaigns').select('*').order('created_at',{ascending:false});list.replaceChildren();
  if(error){list.append(notice(error.message,'danger'));return}
  if(!data?.length){list.append(empty('No campaigns yet. Create your first link above.'));return}
  for(const c of data){
   const url=new URL('https://halonap.com/');url.search=new URLSearchParams({utm_source:c.source,utm_medium:c.medium,utm_campaign:c.campaign}).toString();
   const linked=orders.filter(o=>o.attribution?.utm_campaign===c.campaign&&o.attribution?.utm_source===c.source&&o.attribution?.utm_medium===c.medium);
   const input=h('input',{readOnly:true,value:url.href,'aria-label':'Campaign link'});input.onclick=()=>input.select();
   const copy=btn('Copy',{sm:true,icon:'copy'});copy.onclick=async()=>{try{await navigator.clipboard.writeText(url.href);toast('Link copied')}catch(e){input.select()}};
   list.append(h('article',{class:'item-card campaign'},
    h('div',{style:'display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center'},h('h3',{text:c.name}),h('div',{class:'item-meta'},h('span',{class:'badge plain',text:c.source}),h('span',{class:'badge plain',text:c.medium}))),
    h('div',{class:'copy-row'},input,copy),
    h('p',{class:'muted',text:linked.length+' orders · '+money(linked.reduce((n,o)=>n+Number(o.total_pence||0)-Number(o.refunded_pence||0),0))+' net receipts'})));
  }
 }
 await loadCampaigns();
 const coupon=panel('Discount codes',{sub:'Stripe promotion codes are enabled at checkout. Create and manage codes in Stripe.',actions:linkBtn('Manage Stripe promotion codes','https://dashboard.stripe.com/coupons')});root.append(coupon);
}

/* ---------- Analytics ---------- */
function analytics(root){
 const counts={};
 orders.forEach(o=>{const d=(o.created_at||'').slice(0,7)||'Unknown';counts[d]??={orders:0,revenue:0};counts[d].orders++;if(PAID.includes(o.payment_status))counts[d].revenue+=netPaid(o)});
 const months=Object.entries(counts).sort((a,b)=>b[0].localeCompare(a[0]));
 if(!orders.length){root.append(panel('Order analytics').appendChild(empty('Analytics will appear when orders are synced.')).parentNode);return}
 const paid=orders.filter(o=>PAID.includes(o.payment_status)),rev=paid.reduce((n,o)=>n+netPaid(o),0);
 root.append(h('div',{class:'kpis three'},kpi('Paid revenue',money(rev),'Latest 500 orders',{iconName:'money'}),kpi('Paid orders',String(paid.length),'of '+orders.length+' orders',{iconName:'orders'}),kpi('Avg. order value',paid.length?money(Math.round(rev/paid.length)):'—','Paid, after refunds',{iconName:'cart'})));
 const monthName=k=>{const [y,m]=k.split('-');const d=new Date(Number(y),Number(m)-1,1);return isNaN(d)?k:d.toLocaleDateString('en-GB',{month:'short',year:'2-digit'})};
 const chart=panel('Paid revenue by month');chart.append(bars(months.slice(0,12).reverse().map(([k,v])=>({value:v.revenue,label:monthName(k),title:monthName(k)+': '+v.orders+' orders · '+money(v.revenue)}))));root.append(chart);
 const p=panel('Monthly breakdown',{flush:true});const {wrap,body}=table(['Month',['Orders','num'],['Paid revenue','num']]);p.append(wrap);
 for(const [k,v] of months)body.append(h('tr',null,h('td',{class:'cell-strong',text:k==='Unknown'?k:monthName(k)}),h('td',{class:'num',text:String(v.orders)}),h('td',{class:'num cell-strong',text:money(v.revenue)})));
 root.append(p);
}

/* ---------- Settings ---------- */
async function settings(root){
 const {data,error}=await sb.from('store_settings').select('*').eq('id',true).single();
 if(error){root.append(notice(error.message,'danger'));return}
 settingsCache=data;
 const pounds=p=>((Number(p)||0)/100).toFixed(2),toPence=v=>String(v).trim()===''?null:Math.round(Number(v)*100);
 root.append(h('p',{class:'muted',style:'margin:0',text:'Signed in as '+(user?.email||'')}));

 // Price: changed through the server so Stripe, checkout and the website stay in step.
 const pp=panel('Price',{sub:'One price for every colour.'});root.append(pp);
 pp.append(h('div',{class:'price-now'},h('strong',{text:money(data.price_pence)}),h('span',{class:'muted',text:'per mask · current price'})));
 const priceIn=field(pp,'New price (£)','number',pounds(data.price_pence),'Saving creates a new price in Stripe for Black, Pink and Grey. New checkouts use it straight away and the website price updates on the next page load. Orders already paid are not affected. Google’s product listing is refreshed within about 6 hours.');
 const priceBtn=btn('Change price',{kind:'gold'}),priceMsg=h('p',{class:'msg',role:'status'});pp.append(h('div',{class:'toolbar'},priceBtn),priceMsg);
 priceBtn.onclick=async()=>{const pence=toPence(priceIn.value);if(!Number.isInteger(pence)||pence<100||pence>100000){priceMsg.textContent='Enter a price between £1.00 and £1,000.00.';return}if(pence===data.price_pence){priceMsg.textContent='That is already the current price.';return}if(!confirm('Change the price from '+money(data.price_pence)+' to '+money(pence)+'? New customers will be charged '+money(pence)+' per mask.'))return;priceBtn.disabled=true;priceMsg.textContent='Updating Stripe…';try{const r=await adminApi('/api/admin-settings',{action:'set_price',price_pence:pence});const t='Price changed to '+money(r.price_pence)+'.'+(r.compare_cleared?' The sale “was” price was cleared because it was not above the new price.':'')+(r.warnings?.length?' Note: '+r.warnings.join(', ')+'.':'');toast(t);render()}catch(err){priceMsg.textContent='Price not changed: '+err.message;priceBtn.disabled=false}};

 const form=h('form',{class:'view'});root.append(form);
 const cols=h('div',{class:'grid-2'});form.append(cols);
 const left=h('div',{class:'view',style:'align-content:start'}),right=h('div',{class:'view',style:'align-content:start'});cols.append(left,right);

 const p=panel('Shop settings');left.append(p);const fields={};
 for(const [key,label,type] of [['announcement','Top announcement','text'],['support_email','Customer contact email','email']]){fields[key]=field(p,label,type,data[key]);fields[key].required=true;fields[key].maxLength=key==='announcement'?200:254}
 p.querySelector('.field').append(h('p',{class:'hint',text:'The current homepage design has no top announcement bar, so this text is saved but not shown on the website.'}));
 const wasIn=field(p,'Sale “was” price (£), leave blank for no sale','number',data.price_compare_at_pence==null?'':pounds(data.price_compare_at_pence),'Shows the old price crossed out next to the current price. Under UK pricing rules a “was” price should be one you really charged for a reasonable time.');
 p.append(notice('Contact email changes the website contact links. It does not change the signup email sender or email delivery service.','info'));

 const d=panel('Delivery');left.append(d);
 const stdIn=field(d,'UK Standard delivery (£)','number',pounds(data.standard_delivery_pence));
 const expIn=field(d,'UK Express delivery (£)','number',pounds(data.express_delivery_pence));
 const freeIn=field(d,'Free standard delivery from (£)','number',pounds(data.free_delivery_threshold_pence??2500),'Checkout gives free standard delivery when the basket is at least this amount. Delivery prices on the website update automatically.');

 const ps=panel('Pause the shop',{sub:'Stop new orders while you are away.'});right.append(ps);
 const pausedIn=field(ps,'Pause the shop: stop new orders','checkbox',data.shop_paused);
 const pauseMsgIn=field(ps,'Message shown to customers while paused','text',data.pause_message,'For example: “We’re away until 2 January. Orders reopen then.” Shown in a bar at the top of the website, and at checkout.');pauseMsgIn.maxLength=200;

 const st=panel('Stock alert');right.append(st);
 const lowIn=field(st,'Warn when stock is below','number',String(data.low_stock_threshold??20),'Shown on Overview and Products & Stock, and in the daily brief.');lowIn.step='1';

 const de=panel('Dispatch email');right.append(de);
 const dispIn=field(de,'Email customers automatically when an order is marked dispatched','checkbox',data.dispatch_email_enabled!==false);
 const noteIn=field(de,'Extra message in the dispatch email (optional)','textarea',data.dispatch_email_note,'For example: “Thank you for supporting a small UK brand!”');noteIn.maxLength=300;noteIn.rows=3;

 const save=btn('Save settings',{kind:'gold',type:'submit'}),msg=h('span',{class:'msg',role:'status',text:'Changes apply to new page loads and checkouts.'});
 form.append(h('div',{class:'save-bar'},msg,save));
 form.onsubmit=async ev=>{ev.preventDefault();
  const free=toPence(freeIn.value),std=toPence(stdIn.value),exp=toPence(expIn.value),was=toPence(wasIn.value),low=Number(lowIn.value);
  const bad=!Number.isInteger(free)||free<0||free>20000?'Free delivery amount must be between £0 and £200.':!Number.isInteger(std)||std<0||std>2000?'Standard delivery must be between £0 and £20.':!Number.isInteger(exp)||exp<0||exp>3000?'Express delivery must be between £0 and £30.':was!==null&&(!Number.isInteger(was)||was<=data.price_pence)?'The “was” price must be higher than the current price ('+money(data.price_pence)+').':!Number.isSafeInteger(low)||low<0||low>10000?'Stock alert must be a whole number from 0 to 10,000.':'';
  if(bad){msg.textContent=bad;return}
  if(pausedIn.checked&&!data.shop_paused&&!confirm('Pause the shop? Customers will not be able to check out until you turn this off.'))return;
  save.disabled=true;msg.textContent='Saving…';
  const patch={announcement:fields.announcement.value.trim(),support_email:fields.support_email.value.trim(),free_delivery_threshold_pence:free,standard_delivery_pence:std,express_delivery_pence:exp,price_compare_at_pence:was,shop_paused:pausedIn.checked,pause_message:pauseMsgIn.value.trim(),low_stock_threshold:low,dispatch_email_enabled:dispIn.checked,dispatch_email_note:noteIn.value.trim(),updated_at:new Date().toISOString()};
  const {error}=await sb.from('store_settings').update(patch).eq('id',true);
  if(!error){Object.assign(data,patch);settingsCache={...settingsCache,...patch};toast('Settings saved')}
  msg.textContent=error?'Save failed: '+error.message:'Saved. '+(patch.shop_paused?'The shop is PAUSED. ':'')+'New website page loads and checkouts use these settings.';save.disabled=false};
}

const VIEWS={overview,orders:ordersPage,customers,products,payments,reviews,messages,marketing,analytics,settings};

/* ---------- wiring ---------- */
$('menuBtn').append(icon('menu'));
$('refreshAll').append(icon('refresh'),h('span',{class:'lbl',text:'Refresh'}));
$('refreshAll').onclick=async()=>{const b=$('refreshAll');b.disabled=true;settingsCache=null;await reload();b.disabled=false;toast('Up to date')};
$('menuBtn').onclick=()=>document.body.classList.contains('nav-open')?closeNav():openNav();
$('navScrim').onclick=closeNav;
$('drawerClose').onclick=closeDrawer;$('scrim').onclick=closeDrawer;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeNav()}});
setInterval(()=>{if(user&&!document.hidden&&AUTO_REFRESH.includes(page)&&!drawerOrderId)reload()},30000);
$('loginForm').onsubmit=async ev=>{ev.preventDefault();$('loginMsg').textContent='Signing in…';const {error}=await sb.auth.signInWithPassword({email:$('email').value,password:$('password').value});$('loginMsg').textContent=error?error.message:'';if(!error)await check()};
$('logout').onclick=async()=>{await sb.auth.signOut();closeNav();await check()};
check();
})();
