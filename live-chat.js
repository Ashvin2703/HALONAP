/* HALONAP live chat inside "How can we help?". A free quick-answer bot first; "Talk to a person"
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
 const after=key=>setChips([['person','Talk to a person'],...CHIPS.filter(c=>c[0]!==key).slice(0,4)]);

 // ---------- UI ----------
 panel.hidden=true;
 const box=el('div','lc');box.setAttribute('aria-label','HALONAP live chat');
 const head=el('div','lc-head');const dot=el('span','lc-dot');const title=el('div','lc-title');
 const t1=el('strong',null,'Chat with HALONAP'),t2=el('span','lc-sub','Instant answers, or talk to our team');title.append(t1,t2);head.append(dot,title);
 const list=el('div','lc-list');list.setAttribute('role','log');list.setAttribute('aria-live','polite');
 const chips=el('div','lc-chips');
 const form=el('form','lc-input');const input=el('input');input.type='text';input.placeholder='Type your question…';input.maxLength=2000;input.setAttribute('aria-label','Your message');
 const sendBtn=el('button','lc-send','Send');sendBtn.type='submit';form.append(input,sendBtn);
 const foot=el('div','lc-foot');
 box.append(head,list,chips,form,foot);
 panel.before(box);

 let state=JSON.parse(sessionStorage.getItem(KEY)||'null');   // {chat_id, token, after, status, agent, history}
 const transcript=[];
 const save=()=>sessionStorage.setItem(KEY,JSON.stringify(state));

 function bubble(sender,text,{name}={}){
  const row=el('div','lc-msg lc-'+sender);
  if(name)row.append(el('span','lc-name',name));
  row.append(el('p',null,text));list.append(row);list.scrollTop=list.scrollHeight;return row;
 }
 function typing(ms,then){const t=el('div','lc-msg lc-bot lc-typing');t.append(el('span'),el('span'),el('span'));list.append(t);list.scrollTop=list.scrollHeight;setTimeout(()=>{t.remove();then()},ms)}
 function setChips(items){chips.replaceChildren();for(const [key,label] of items){const c=el('button','lc-chip'+(key==='person'?' lc-chip-person':''),label);c.type='button';c.onclick=()=>key==='person'?askPerson():ask(label,key);chips.append(c)}}
 const homeChips=()=>setChips([...CHIPS,['person','Talk to a person']]);
 function botSay(text,after){typing(500+Math.min(900,text.length*6),()=>{bubble('bot',text,{name:'HALONAP Assistant'});transcript.push({sender:'bot',body:text});after&&after()})}
 function ask(label,key){bubble('customer',label);transcript.push({sender:'customer',body:label});botSay(reply(key),()=>after(key))}
 function answerFree(q){
  bubble('customer',q);transcript.push({sender:'customer',body:q});
  const m=Bot.match(q);
  if(m.intent==='person'){askPerson();return}
  if(m.intent){botSay(reply(m.intent),()=>after(m.intent));return}
  if(m.choices){botSay('Happy to help. Which of these is it about?',()=>setChips([...m.choices.map(k=>[k,Bot.chip(k)]),['person','Talk to a person']]));return}
  botSay('Sorry, I didn’t quite get that. Try a topic below, or talk to a person from the HALONAP team.',()=>setChips([['person','Talk to a person'],...CHIPS.slice(0,4)]));
 }

 // ---------- talk to a person ----------
 function askPerson(){
  if(state?.chat_id)return;
  chips.replaceChildren();form.hidden=true;
  const card=el('form','lc-card');
  card.append(el('p','lc-card-title','Connect with our team'),el('p','lc-card-sub','We’ll ring the HALONAP team now. Please keep this window open.'));
  const name=el('input');name.placeholder='Your name';name.required=true;name.maxLength=120;name.autocomplete='name';name.setAttribute('aria-label','Your name');
  const email=el('input');email.type='email';email.placeholder='Email (so we can follow up)';email.maxLength=254;email.autocomplete='email';email.setAttribute('aria-label','Email address');
  const topic=el('select');topic.setAttribute('aria-label','What is it about?');for(const o of ['Order or delivery','Returns or refund','Product question','Something else']){topic.append(el('option',null,o))}
  const go=el('button','lc-go','Call the team');go.type='submit';const back=el('button','lc-back','Back to quick answers');back.type='button';
  const msg=el('p','lc-err');msg.setAttribute('role','status');
  card.append(name,email,topic,go,back,msg);list.append(card);list.scrollTop=list.scrollHeight;name.focus();
  back.onclick=()=>{card.remove();form.hidden=false;homeChips()};
  card.onsubmit=async e=>{e.preventDefault();if(!card.reportValidity())return;go.disabled=true;msg.textContent='';
   try{
    const r=await api({action:'start',name:name.value,email:email.value,topic:topic.value,transcript});
    state={chat_id:r.chat_id,token:r.token,after:0,status:'waiting',agent:null};save();
    card.remove();list.replaceChildren();startLive();
   }catch(err){msg.textContent=err.message;go.disabled=false}};
 }

 async function api(body){
  const r=await fetch('/api/live-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(j.error||'Chat is unavailable. Please email hello@halonap.com.'),{status:r.status});return j;
 }

 let timer=null,waitingRow=null;
 function setHead(status){
  box.dataset.status=status;
  if(status==='waiting'){t1.textContent='Calling the HALONAP team…';t2.textContent='We’ll connect you as soon as someone answers'}
  else if(status==='active'){t1.textContent=(state.agent||'HALONAP team')+' is here';t2.textContent='Live chat · HALONAP Customer Care'}
  else if(status==='closed'){t1.textContent='Chat ended';t2.textContent='Thanks for chatting with HALONAP'}
 }
 function showWaiting(){if(waitingRow)return;waitingRow=el('div','lc-waiting');const ring=el('span','lc-ring');ring.append(el('span'),el('span'),el('span'));waitingRow.append(ring,el('p',null,'Ringing the team. You can type your question below while you wait.'));list.append(waitingRow)}
 function startLive(){
  form.hidden=false;input.placeholder='Type a message…';chips.replaceChildren();
  const end=el('button','lc-end','End chat');end.type='button';end.onclick=endChat;foot.replaceChildren(end);
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
    else if(m.sender==='agent')bubble('agent',m.body,{name:r.agent_name||'HALONAP team'});
    else if(m.sender==='customer'&&!document.querySelector('[data-local="'+m.id+'"]'))bubble('customer',m.body).dataset.local=m.id;
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
  state=null;sessionStorage.removeItem(KEY);setHead('closed');form.hidden=true;
  const again=el('button','lc-chip','Start a new chat');again.type='button';again.onclick=()=>{reset()};foot.replaceChildren(again);
 }
 function reset(){clearInterval(timer);timer=null;state=null;sessionStorage.removeItem(KEY);list.replaceChildren();foot.replaceChildren();form.hidden=false;input.placeholder='Type your question…';box.dataset.status='bot';t1.textContent='Chat with HALONAP';t2.textContent='Instant answers, or talk to our team';greet()}

 form.onsubmit=async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;input.value='';
  if(!state?.chat_id){answerFree(q);return}
  const row=bubble('customer',q);row.classList.add('lc-sending');
  try{const r=await api({action:'send',chat_id:state.chat_id,token:state.token,body:q});row.dataset.local=r.message.id;row.classList.remove('lc-sending')}
  catch(err){row.classList.add('lc-failed');row.title=err.message;if(err.status===409)finish('This chat has ended.')}
 };
 function greet(){bubble('bot','Hi! I’m the HALONAP assistant. Ask me anything, or pick a topic below. You can talk to a person at any time.',{name:'HALONAP Assistant'});homeChips()}

 if(state?.chat_id){state.after=0;box.dataset.status=state.status;startLive()}else{box.dataset.status='bot';greet()}
})();
