/* HALONAP live chat inside "How can we help?". The assistant answers first; when the customer asks for a person"
   rings the HALONAP team (Admin Studio + phone/laptop alerts) and connects a live agent.
   All text is set with textContent. The message form stays in the page as a hidden fallback. */
(()=>{
 'use strict';
 const panel=document.querySelector('#contact .hc-form-panel');if(!panel)return;
 const KEY='halonap-live-chat';
 const money=p=>'£'+(p/100).toFixed(2);
 const S=()=>window.halonapSettings||{};
 const price=()=>Number.isInteger(S().price_pence)?S().price_pence:999;
 const std=()=>Number.isInteger(S().standard_delivery_pence)?S().standard_delivery_pence:299;
 const exp=()=>Number.isInteger(S().express_delivery_pence)?S().express_delivery_pence:399;
 const free=()=>Number.isInteger(S().free_delivery_threshold_pence)?S().free_delivery_threshold_pence:price()*2;
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n};

 // ---------- quick answers ----------
 const Bot=window.HalonapChatBot;if(!Bot)return;
 const CHIPS=['delivery','track','returns','price','product','cleaning'].map(k=>[k,Bot.chip(k)]);
 const reply=key=>Bot.answer(key,S());
 const after=key=>setChips(CHIPS.filter(c=>c[0]!==key).slice(0,4));

 // ---------- UI ----------
 panel.hidden=true;
 const box=el('div','lc');box.setAttribute('aria-label','HALONAP live chat');
 const ICON={send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  track:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  delivery:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="6" cy="18" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="18" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  returns:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  product:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 11c0-2 2-4 5-4h10c3 0 5 2 5 4s-2 4-4 4c-2 0-3-2-6-2s-4 2-6 2c-2 0-4-2-4-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  price:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor"/></svg>',
 phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  person:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'};
 const svg=(name)=>{const s=el('span','lc-ico');s.innerHTML=ICON[name]||'';return s};   // static icons only, never customer text
 // The HALONAP gold "o" (same mark as halonap-o.svg and the logo), on black.
 const brandAvatar=()=>{const a=el('span','lc-avatar lc-avatar-brand');a.setAttribute('aria-hidden','true');a.append(el('span','lc-o'));return a};
 const head=el('div','lc-head');const title=el('div','lc-title');
 const t1=el('strong',null,'HALONAP Support');const t2=el('span','lc-sub');const dot=el('span','lc-dot');const t2text=el('span',null,'Online · replies instantly');t2.append(dot,t2text);
 title.append(t1,t2);const headEnd=el('button','lc-head-btn','End chat');headEnd.type='button';headEnd.hidden=true;
 head.append(brandAvatar(),title,headEnd);
 const list=el('div','lc-list');list.setAttribute('role','log');list.setAttribute('aria-live','polite');
 const chips=el('div','lc-chips');
 const form=el('form','lc-input');const input=el('input');input.type='text';input.placeholder='Type your question…';input.maxLength=2000;input.setAttribute('aria-label','Your message');
 const sendBtn=el('button','lc-send');sendBtn.type='submit';sendBtn.setAttribute('aria-label','Send message');sendBtn.append(svg('send'));sendBtn.disabled=true;form.append(input,sendBtn);
 input.addEventListener('input',()=>{sendBtn.disabled=aiBusy||!input.value.trim()});
 const foot=el('div','lc-foot');
 const legal=el('p','lc-legal');const pl=el('a',null,'Privacy');pl.href='privacy.html';pl.target='_blank';pl.rel='noopener';
 legal.append('HALONAP Assistant · Ask for a person any time · ',pl);
 box.append(head,list,chips,form,foot,legal);
 panel.before(box);

 let state=JSON.parse(sessionStorage.getItem(KEY)||'null');   // {chat_id, token, after, status, agent, history}
 const transcript=[];
 const save=()=>sessionStorage.setItem(KEY,JSON.stringify(state));

 let lastSender=null;
 const clearList=()=>{list.replaceChildren();lastSender=null};
 // Turns emails, halonap.com links and https links in plain text into real links. Text stays text.
 function linkify(p,text){
  const re=/(https?:\/\/[^\s]+|halonap\.com\/[\w./-]+|[\w.+-]+@[\w-]+\.[a-z.]{2,})/gi;let i=0,m;
  while((m=re.exec(text))){
   const t=m[0].replace(/[.,;:!?)]+$/,'');if(m.index>i)p.append(text.slice(i,m.index));
   const mail=t.includes('@')&&!/^https?:/i.test(t);const a=el('a',null,t);
   a.href=mail?'mailto:'+t:(/^https?:/i.test(t)?t:'https://'+t);if(!mail){a.target='_blank';a.rel='noopener'}
   p.append(a);i=m.index+t.length;re.lastIndex=i;
  }
  if(i<text.length)p.append(text.slice(i));
 }
 function bubble(sender,text,{name,at}={}){
  const key=sender+'|'+(name||'');const grouped=lastSender===key&&sender!=='system';lastSender=key;
  const row=el('div','lc-msg lc-'+sender+(grouped?' lc-grouped':''));
  if(sender==='bot')row.append(brandAvatar());
  else if(sender==='agent'){const a=el('span','lc-avatar lc-avatar-agent',String(name||'T').trim().charAt(0).toUpperCase());a.setAttribute('aria-hidden','true');row.append(a)}
  const col=el('div','lc-col');
  if(name&&!grouped)col.append(el('span','lc-name',name));
  const p=el('p');linkify(p,String(text));col.append(p);
  if(sender!=='system')col.append(el('time','lc-time',new Date(at||Date.now()).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})));
  row.append(col);list.append(row);list.scrollTop=list.scrollHeight;return row;
 }
 function typingRow(){const t=el('div','lc-msg lc-bot lc-typing-row');const b=el('div','lc-typing');b.append(el('span'),el('span'),el('span'));t.append(brandAvatar(),b);list.append(t);list.scrollTop=list.scrollHeight;lastSender=null;return t}
 function typing(ms,then){const t=typingRow();setTimeout(()=>{t.remove();then()},ms)}
 function setChips(items){chips.replaceChildren();if(items.length)chips.append(el('span','lc-chips-label','Suggested'));for(const [key,label] of items){const c=el('button','lc-chip'+(key==='person'?' lc-chip-person':''),label);c.type='button';c.onclick=()=>key==='person'?askPerson():ask(label,key);chips.append(c)}}
 const homeChips=()=>setChips(CHIPS.slice(0,4));
 function botSay(text,after){typing(500+Math.min(900,text.length*6),()=>{bubble('bot',text,{name:'HALONAP Assistant'});transcript.push({sender:'bot',body:text});after&&after()})}
 function ask(label,key){bubble('customer',label);transcript.push({sender:'customer',body:label});botSay(reply(key),()=>after(key))}
 // Typed questions go to the Claude agent (/api/chat-ai). If it isn't set up or is down, the keyword bot answers.
 let aiOff=false,aiBusy=false;
 function keywordAnswer(q){
  const m=Bot.match(q);
  if(m.intent==='person'){askPerson();return}
  if(m.intent){botSay(reply(m.intent),()=>after(m.intent));return}
  // Two topics in one message: answer both rather than asking which.
  if(m.choices){const [a,b]=m.choices;botSay(reply(a),()=>botSay(reply(b),()=>after(b)));return}
  botSay('Sorry, I didn’t quite get that. Try a topic below, or type “talk to a person” and I’ll connect you to the HALONAP team.',()=>setChips(CHIPS.slice(0,4)));
 }
 async function answerFree(q){
  bubble('customer',q);transcript.push({sender:'customer',body:q});
  if(aiOff){keywordAnswer(q);return}
  aiBusy=true;sendBtn.disabled=true;chips.replaceChildren();
  const t=typingRow();
  try{
   const history=transcript.slice(-16).map(m=>({role:m.sender==='bot'?'assistant':'user',text:m.body}));
   const r=await fetch('/api/chat-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({history})});
   const j=await r.json().catch(()=>({}));t.remove();
   if(r.status===429){bubble('system',j.error||'You’re sending messages very quickly. Please wait a moment.');return}
   // Any other problem with the AI (not set up, down, timed out): the keyword bot answers instead.
   if(!r.ok||j.fallback||!j.reply){aiOff=true;keywordAnswer(q);return}
   if(j.reply){bubble('bot',j.reply,{name:'HALONAP Assistant'});transcript.push({sender:'bot',body:j.reply})}
   if(j.handoff){askPerson(j.handoff.topic);return}
   setChips(CHIPS.slice(0,3));
  }catch{t.remove();aiOff=true;keywordAnswer(q)}
  finally{aiBusy=false;sendBtn.disabled=!input.value.trim();input.focus()}
 }

 // ---------- talk to a person ----------
 // The customer asked for a person: connect straight away, no form. Name/email are optional on the server.
 let connecting=false;
 async function askPerson(preTopic){
  if(state?.chat_id||connecting)return;
  connecting=true;chips.replaceChildren();list.querySelector('.lc-welcome')?.remove();
  const t=String(preTopic||transcript.filter(m=>m.sender==='customer').map(m=>m.body).join(' ')).toLowerCase();
  const topic=/return|refund/.test(t)?'Returns or refund':/order|deliver|track|parcel|dispatch|cancel|address|arriv/.test(t)?'Order or delivery':/mask|product|size|fit|material|colou?r/.test(t)?'Product question':'Something else';
  setHead('waiting');showWaiting();
  try{
   const r=await api({action:'start',topic,transcript});
   state={chat_id:r.chat_id,token:r.token,after:0,status:'waiting',agent:null};
   // Keep the conversation on screen: skip the copy of it the server just saved.
   try{const first=await api({action:'poll',chat_id:state.chat_id,token:state.token,after:0});state.after=first.messages.reduce((n,m)=>Math.max(n,m.id),0)}catch{}
   save();startLive();
  }catch(err){
   waitingRow?.remove();waitingRow=null;setHead('bot');
   bubble('system',err.message||'We couldn’t connect you just now. Please email hello@halonap.com.');
  }finally{connecting=false}
 }

 async function api(body){
  const r=await fetch('/api/live-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(j.error||'Chat is unavailable. Please email hello@halonap.com.'),{status:r.status});return j;
 }

 let timer=null,waitingRow=null;
 function setHead(status){
  box.dataset.status=status;
  if(status==='bot'){t1.textContent='HALONAP Support';t2text.textContent='Online · replies instantly'}
  else if(status==='waiting'){t1.textContent='Connecting…';t2text.textContent='Finding a HALONAP team member for you'}
  else if(status==='active'){t1.textContent=(state.agent||'HALONAP team')+' is here';t2text.textContent='Live chat · HALONAP Customer Care'}
  else if(status==='closed'){t1.textContent='Chat ended';t2text.textContent='Thanks for chatting with HALONAP'}
 }
 function showWaiting(){if(waitingRow)return;waitingRow=el('div','lc-waiting');const ring=el('span','lc-ring');ring.append(el('span'),el('span'),el('span'));waitingRow.append(ring,el('p','lc-waiting-title','Connecting you to the HALONAP team…'),el('p',null,'Please keep this window open. You can type your question while you wait.'));list.append(waitingRow)}
 function startLive(){
  form.hidden=false;input.placeholder='Type a message…';chips.replaceChildren();
  headEnd.hidden=false;headEnd.onclick=endChat;foot.replaceChildren();
  setHead(state.status);if(state.status==='waiting')showWaiting();
  poll();clearInterval(timer);timer=setInterval(poll,2500);
 }
 async function poll(){
  if(!state?.chat_id)return;
  try{
   const r=await api({action:'poll',chat_id:state.chat_id,token:state.token,after:state.after});
   if(r.status==='active'&&state.status==='waiting'){waitingRow?.remove();waitingRow=null;bubble('system',(r.agent_name||'A team member')+' joined the chat.');state.status='active';state.agent=r.agent_name;setHead('active')}
   for(const m of r.messages){
    state.after=Math.max(state.after,m.id);
    if(m.sender==='system'){if(/left the chat|asked to talk/.test(m.body))continue;bubble('system',m.body)}
    else if(m.sender==='agent')bubble('agent',m.body,{name:r.agent_name||'HALONAP team',at:m.created_at});
    else if(m.sender==='customer'&&!document.querySelector('[data-local="'+m.id+'"]'))bubble('customer',m.body,{at:m.created_at}).dataset.local=m.id;
    else if(m.sender==='bot')bubble('bot',m.body,{name:'HALONAP Assistant'});
   }
   if(r.status!==state.status||r.agent_name!==state.agent){
    state.agent=r.agent_name;
    state.status=r.status;setHead(r.status);
    if(r.status==='closed')finish('The HALONAP team ended the chat. Thanks for getting in touch!');
   }
   save();
  }catch(err){if(err.status===403){reset()}}
 }
 async function endChat(){if(!state?.chat_id)return;try{await api({action:'close',chat_id:state.chat_id,token:state.token})}catch{}finish('You ended the chat. Thanks for getting in touch!')}
 function finish(note){
  clearInterval(timer);timer=null;waitingRow?.remove();waitingRow=null;bubble('system',note);
  state=null;sessionStorage.removeItem(KEY);setHead('closed');form.hidden=true;headEnd.hidden=true;
  const again=el('button','lc-go','Start a new chat');again.type='button';again.onclick=()=>{reset()};foot.replaceChildren(again);
 }
 function reset(){clearInterval(timer);timer=null;state=null;sessionStorage.removeItem(KEY);clearList();foot.replaceChildren();form.hidden=false;input.placeholder='Type your question…';box.dataset.status='bot';t1.textContent='HALONAP Support';t2text.textContent='Online · replies instantly';headEnd.hidden=true;greet()}

 form.onsubmit=async e=>{e.preventDefault();const q=input.value.trim();if(!q||aiBusy)return;input.value='';sendBtn.disabled=true;
  if(!state?.chat_id){answerFree(q);return}
  const row=bubble('customer',q);row.classList.add('lc-sending');
  try{const r=await api({action:'send',chat_id:state.chat_id,token:state.token,body:q});row.dataset.local=r.message.id;row.classList.remove('lc-sending')}
  catch(err){row.classList.add('lc-failed');row.title=err.message;if(err.status===409)finish('This chat has ended.')}
 };
 function greet(){
  const w=el('div','lc-welcome');
  w.append(brandAvatar(),el('p','lc-welcome-title','Hello, how can we help?'),el('p','lc-welcome-sub','Ask anything about HALONAP, your order or delivery. Our assistant answers straight away, and our team is here whenever you need a person.'));
  const grid=el('div','lc-topics');
  for(const [key,label] of [['track','Track my order'],['delivery','Delivery'],['returns','Returns'],['product','About the mask'],['price','Price & offers'],['cleaning','Cleaning & care']]){
   const b=el('button','lc-topic'+(key==='person'?' lc-topic-person':''));b.type='button';b.append(svg(key),el('span',null,label));
   b.onclick=()=>{grid.remove();ask(label,key)};grid.append(b);
  }
  w.append(grid);list.append(w);chips.replaceChildren();lastSender=null;
 }

 if(state?.chat_id){state.after=0;box.dataset.status=state.status;startLive()}else{box.dataset.status='bot';greet()}
})();
