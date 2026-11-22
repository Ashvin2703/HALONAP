function createAdminWorkflows({sb,node,section,notice,details,adminApi,ukDate,paymentAction}){
 const api=body=>adminApi('/api/admin-workflows',body);
 function button(parent,label,action){
  const b=node('button','btn',parent,label);
  b.type='button';
  b.onclick=async()=>{
   b.disabled=true;
   try{await action(b)}catch(err){notice(parent,err.message)}
   finally{b.disabled=false}
  };
  return b;
 }
 async function read(query){
  const {data,error}=await query;if(error)throw Error(error.message);return data;
 }
 async function pages(build){
  const rows=[];
  for(let offset=0;;offset+=250){
   const batch=await read(build().range(offset,offset+249));
   rows.push(...batch);if(batch.length<250)return rows;
  }
 }
 function input(parent,label,type='text'){
  const wrap=node('label','',parent,label+' ');
  const field=node('input','',wrap);field.type=type;return field;
 }
 function openOrder(parent,o){
  const a=node('a','btn',parent,o.order_number||'View order');
  a.href='/admin.html?order='+encodeURIComponent(o.id);return a;
 }
 function address(o){
  const a=o.shipping_address||{};
  return [o.customer_name,a.line1,a.line2,a.city,a.state,a.postal_code,a.country].filter(Boolean).join('\n');
 }
 function items(o){return (o.items||[]).map(i=>(i.colour||i.name||'Sleep mask')+' × '+i.quantity).join(', ')}
 async function packing(root){
  const p=section(root,'Packing & dispatch queue');
  const rows=await pages(()=>sb.from('customer_orders').select('*').in('payment_status',['paid','partially_refunded']).or('fulfillment_status.is.null,fulfillment_status.in.(pending,processing)').order('created_at').order('id'));
  if(!rows.length){notice(p,'No paid orders awaiting dispatch.');return}
  const selected=new Set(),checks=[];
  const bar=node('div','toolbar',p);
  const all=input(bar,'Select all','checkbox');
  all.onchange=()=>checks.forEach(c=>{c.checked=all.checked;c.onchange()});
  button(bar,'Print selected packing slips',()=>{
   if(!selected.size)throw Error('Select at least one order.');
   document.querySelector('#packingPrint')?.remove();
   const sheet=node('div','',document.body);sheet.id='packingPrint';
   for(const o of selected){
    const slip=node('article','',sheet);node('h1','',slip,'HALONAP');node('h2','',slip,'Packing slip');
    node('p','',slip,o.order_number);node('pre','',slip,address(o));node('h3','',slip,'Items');node('p','',slip,items(o));
   }
   window.addEventListener('afterprint',()=>sheet.remove(),{once:true});window.print();
  });
  for(const o of rows){
   const row=node('article','panel',p),bar=node('div','toolbar',row);
   const check=input(bar,'Select order','checkbox');checks.push(check);
   check.onchange=()=>{if(check.checked)selected.add(o);else selected.delete(o)};
   openOrder(bar,o);node('strong','',row,items(o));node('pre','',row,address(o));
   button(row,'Manage dispatch',()=>details(row,o));
  }
 }
 const stages=['Requested','Received','Inspected','Closed'];
 async function timeline(parent,o){
  const p=section(parent,'Timeline & private notes');
  const area=node('div','',p);
  async function refresh(){
   const entries=await pages(()=>sb.from('order_activity').select('*').eq('order_id',o.id).order('created_at').order('id'));
   const historic=[['Order recorded',o.created_at],['Confirmation emailed',o.confirmation_email_sent_at],['Dispatched',o.dispatched_at],['Dispatch emailed',o.dispatch_email_sent_at]];
   for(const [detail,created_at] of historic)if(created_at)entries.push({detail,created_at,kind:'Order'});
   entries.sort((a,b)=>a.created_at.localeCompare(b.created_at));area.replaceChildren();
   for(const e of entries)node('p','',area,ukDate(e.created_at)+' · '+e.kind+' · '+e.detail);
  }
  const note=input(p,'Private note');note.maxLength=4000;
  button(p,'Add note',async()=>{if(!note.value.trim())throw Error('Enter a note.');await read(sb.from('order_activity').insert({order_id:o.id,kind:'Note',detail:note.value.trim()}));note.value='';await refresh()});
  await refresh();
 }
 async function returnCase(parent,o){
  const p=section(parent,'Return management');
  async function draw(){
   const r=await read(sb.from('order_returns').select('*').eq('order_id',o.id).maybeSingle());
   p.replaceChildren();node('h2','',p,'Return management');
   if(!r){
    const reason=input(p,'Reason for return');reason.maxLength=2000;
    button(p,'Record return request',async()=>{if(!reason.value.trim())throw Error('Enter a return reason.');await read(sb.from('order_returns').insert({order_id:o.id,reason:reason.value.trim()}));await draw()});return;
   }
   node('p','',p,r.stage+' · '+r.reason);
   node('p','muted',p,'Refund status: '+(o.refund_status||'No refund recorded'));
   const next=stages[stages.indexOf(r.stage)+1];
   if(next)button(p,'Mark '+next.toLowerCase(),async()=>{await read(sb.from('order_returns').update({stage:next}).eq('order_id',o.id).eq('stage',r.stage));await draw()});
   if(r.stage==='Inspected'&&['paid','partially_refunded'].includes(o.payment_status)){
    const msg=node('p','muted',p);
    button(p,'Refund remaining payment',async b=>{if(confirm('Refund the remaining payment for '+o.order_number+' to the customer?'))await paymentAction('refund',o,b,msg)});
   }
  }
  await draw();
 }
 async function returns(root){
  const p=section(root,'Returns');
  const rows=await pages(()=>sb.from('order_returns').select('*,customer_orders(id,order_number,payment_status,refund_status)').order('created_at',{ascending:false}).order('order_id'));
  if(!rows.length)notice(p,'No returns recorded. Open an order to record a return request.');
  for(const r of rows){
   const row=node('article','panel',p);openOrder(row,r.customer_orders);node('p','',row,r.stage+' · '+r.reason+' · '+ukDate(r.created_at));node('small','',row,'Refund: '+(r.customer_orders.refund_status||'None recorded'));
  }
 }
 const csvCell=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
 function sales(root){
  const p=section(root,'Sales export'),bar=node('div','toolbar',p);
  const start=input(bar,'From (UTC)','date'),end=input(bar,'Through (UTC)','date');
  end.value=new Date().toISOString().slice(0,10);start.value=end.value.slice(0,8)+'01';
  const status=node('p','muted',p);
  button(bar,'Download CSV',async()=>{
   if(!start.value||!end.value||start.value>end.value)throw Error('Choose a valid date range.');
   const until=new Date(end.value+'T00:00:00Z');until.setUTCDate(until.getUTCDate()+1);
   const orders=await pages(()=>sb.from('customer_orders').select('id,order_number,created_at,currency,total_pence,refunded_pence,payment_status').gte('created_at',start.value+'T00:00:00Z').lt('created_at',until.toISOString()).order('created_at').order('id'));
   const lines=[['Order','Date (UTC)','Currency','Gross including delivery','Delivery','Refunded','Net after refunds','Payment status']];
   let missing=0;
   for(let i=0;i<orders.length;i+=10){
    status.textContent='Preparing '+(i+1)+' of '+orders.length+'…';
    const batch=orders.slice(i,i+10),{shipping}=await api({action:'delivery_amounts',ids:batch.map(o=>o.id)});
    for(const o of batch){
     const amount=n=>(n/100).toFixed(2);if(shipping[o.id]==null)missing++;
     lines.push([o.order_number,o.created_at,o.currency.toUpperCase(),amount(o.total_pence),shipping[o.id]==null?'':amount(shipping[o.id]),amount(o.refunded_pence||0),amount(o.total_pence-(o.refunded_pence||0)),o.payment_status]);
    }
   }
   const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='halonap-sales-'+start.value+'-'+end.value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   status.textContent=orders.length+' orders exported.'+(missing?' Delivery unavailable for '+missing+' rows.':'');
  });
 }
 function correspondence(parent,m,source){
  const area=node('div','',parent);
  button(area,'Conversation & reply',async()=>{
   const [incoming,form,replies,orders]=await Promise.all([
    pages(()=>sb.from('support_inbox').select('id,body,subject,created_at').eq('email',m.email.toLowerCase()).order('created_at').order('id')),
    pages(()=>sb.from('customer_messages').select('id,message,topic,created_at').eq('email',m.email).order('created_at').order('id')),
    pages(()=>sb.from('support_replies').select('id,body,subject,state,created_at').eq('email',m.email).order('created_at').order('id')),
    pages(()=>sb.from('customer_orders').select('id,order_number').eq('customer_email',m.email).order('id'))
   ]);
   area.replaceChildren();
   node('h3','',area,'Correspondence with '+m.email);
   const history=[...incoming.map(x=>({...x,who:'Received'})),...form.map(x=>({...x,who:'Contact form',body:x.message,subject:x.topic})),...replies.map(x=>({...x,who:x.state==='sent'?'Sent':'Delivery unconfirmed'}))].sort((a,b)=>a.created_at.localeCompare(b.created_at));
   for(const x of history){
    const entry=node('details','',area);node('summary','',entry,ukDate(x.created_at)+' · '+x.who+' · '+x.subject);node('pre','mail-text',entry,x.body);
   }
   if(orders.length){node('h3','',area,'Related orders');const links=node('div','toolbar',area);for(const o of orders)openOrder(links,o)}
   const label=node('label','',area,'Reply to '+m.email),draft=node('textarea','reply-draft',label);draft.maxLength=12000;draft.rows=5;
   let key=crypto.randomUUID();
   button(area,'Send reply',async()=>{
    if(!draft.value.trim())throw Error('Write a reply first.');
    if(!confirm('Send this reply to '+m.email+'?'))return;
    await api({action:'reply',source,sourceId:m.id,text:draft.value,requestId:key});key=crypto.randomUUID();
    node('p','',area,'Sent to '+m.email);node('pre','mail-text',area,draft.value);draft.value='';
   });
  });
 }
 async function inbox(root){
  const p=section(root,'hello@halonap.com inbox'),bar=node('div','toolbar',p),list=node('div','',p);
  let before=null,limit=30;
  const status=node('p','muted',p);
  async function show(){
   const rows=await read(sb.from('support_inbox').select('id,email,subject,body,created_at').order('created_at',{ascending:false}).limit(limit));
   list.replaceChildren();
   if(!rows.length)notice(list,'No synced email yet. Select Sync inbox to check the mailbox.');
   for(const m of rows){
    const box=node('details','panel',list);node('summary','',box,m.subject+' · '+m.email+' · '+ukDate(m.created_at));node('pre','mail-text',box,m.body);correspondence(box,m,'inbox');
   }
   if(rows.length===limit)button(list,'Show more synced messages',async()=>{limit+=30;await show()});
  }
  async function sync(cursor){
   status.textContent='Checking mailbox…';
   try{const result=await api({action:'sync_inbox',before:cursor});before=result.older;older.hidden=!before;await show();status.textContent='Mailbox checked.'}
   catch(err){status.textContent=err.message}
  }
  button(bar,'Sync inbox',()=>sync(null));
  const older=button(bar,'Import older messages',()=>sync(before));older.hidden=true;
  await show();await sync(null);
 }
 return {packing,returns,sales,timeline,returnCase,inbox,correspondence};
}
