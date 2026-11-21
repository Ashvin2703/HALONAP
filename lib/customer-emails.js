import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import {database} from './commerce.js';

const SITE='https://halonap.com';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=p=>'£'+((Number(p)||0)/100).toFixed(2);
const firstName=n=>(typeof n==='string'&&n.trim()?n.trim().split(/\s+/)[0]:'there');
const ref=o=>o.order_number||String(o.id).slice(0,8);
const itemLines=items=>(Array.isArray(items)?items:[]).map(i=>'HALONAP Sleep Eye Mask · '+(i.colour||'Mask')+' × '+(i.quantity||1));

export function mailer(){
 const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD,SMTP_SECURE}=process.env;
 if(!SMTP_HOST||!SMTP_USER||!SMTP_PASSWORD)return null;
 const transport=nodemailer.createTransport({host:SMTP_HOST,port:Number(SMTP_PORT||465),secure:SMTP_SECURE==='true',auth:{user:SMTP_USER,pass:SMTP_PASSWORD},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000});
 return msg=>transport.sendMail({from:{name:'HALONAP Customer Care',address:SMTP_USER},replyTo:'hello@halonap.com',...msg});
}

// Email design matches HALONAP's signup "Verify Your Email" template: blush page, white rounded card,
// pink letter-spaced HALONAP heading and tagline, thin divider, dark heading, grey text and a pink pill button.
const C={page:'#fff4f8',card:'#ffffff',brand:'#a84273',tagline:'#a56b86',line:'#f5dce7',heading:'#29232a',text:'#666666',small:'#999999',button:'#c85c91',footer:'#b58a9f',panel:'#fff8fb'};
const FONT='Arial,Helvetica,sans-serif';

export function layout({eyebrow,title,preheader,body,footerExtra=''}){
 return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:35px 15px;background:${C.page};font-family:${FONT};"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<div style="max-width:520px;margin:auto;background:${C.card};border-radius:18px;padding:40px 25px;text-align:center;">
<h1 style="color:${C.brand};letter-spacing:4px;font-size:32px;margin:0 0 10px;">HALONAP</h1>
<p style="color:${C.tagline};font-size:13px;margin:0;">Better Sleep, Brighter Days</p>
<hr style="border:0;border-top:1px solid ${C.line};margin:25px 0;">
${eyebrow?`<p style="color:${C.tagline};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">${esc(eyebrow)}</p>`:''}
<h2 style="color:${C.heading};margin:0 0 18px;">${esc(title)}</h2>
${body}
<p style="color:${C.text};line-height:1.7;margin:26px 0 0;">Sleep well,<br><strong style="color:${C.heading};">HALONAP Customer Care</strong></p>
<p style="color:${C.small};font-size:12px;line-height:1.6;margin:30px 0 0;">Questions? Reply to this email or write to <a href="mailto:hello@halonap.com" style="color:${C.brand};">hello@halonap.com</a>.</p>
<p style="color:${C.footer};font-size:12px;line-height:1.6;margin-top:35px;">© HALONAP · halonap.com<br>HALONAP is a trading name of Ashvin Vattaparamban · 81 Henry Street, Liverpool, L1 5BU</p>${footerExtra}
</div></body></html>`;
}
export const p=(html,extra='')=>`<p style="color:${C.text};line-height:1.7;margin:0 0 14px;${extra}">${html}</p>`;
export const button=(href,label)=>`<a href="${esc(href)}" style="display:inline-block;background:${C.button};color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:30px;font-weight:bold;margin:20px 0;">${esc(label)}</a>`;
// Soft pink details box for order information: rows of [label, value]. Left-aligned for readability.
export const panel=rows=>`<div style="background:${C.panel};border:1px solid ${C.line};border-radius:14px;padding:18px 20px;margin:18px 0;text-align:left;">${rows.map(([label,value],i)=>`<div style="color:${C.tagline};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;${i?'margin-top:14px;':''}">${esc(label)}</div><div style="color:${C.heading};font-size:15px;line-height:1.6;margin-top:3px;overflow-wrap:anywhere;">${value}</div>`).join('')}</div>`;
export const small=html=>`<p style="color:${C.small};font-size:12px;line-height:1.6;margin:10px 0 0;">${html}</p>`;
export const BRAND=C.brand;

export {esc,firstName,ref,itemLines};

export function orderConfirmationEmail(order){
 const a=order.shipping_address||{},address=[a.line1,a.line2,a.city,a.postal_code].filter(Boolean),lines=itemLines(order.items);
 const rows=[['Order reference',esc(ref(order))],['Your order',lines.map(esc).join('<br>')||'HALONAP Sleep Eye Mask'],['Total paid','<strong>'+esc(money(order.total_pence))+'</strong>'],...(address.length?[['Delivering to',address.map(esc).join('<br>')]]:[])];
 const html=layout({eyebrow:'Order confirmed',title:'Thank you for your order',preheader:'We have your order '+ref(order)+' and will email you when it ships.',
  body:p('Hello '+esc(firstName(order.customer_name))+',')+p('Your payment was successful and we are getting your HALONAP mask ready. We will email you again with tracking as soon as it is on its way.')+panel(rows)+p('Need to change something? Just reply to this email with your order reference as soon as possible.')+small('<a href="'+SITE+'/returns.html" style="color:'+BRAND+';">Returns policy</a> · <a href="'+SITE+'/terms.html" style="color:'+BRAND+';">Terms</a> · <a href="'+SITE+'/delivery.html" style="color:'+BRAND+';">Delivery</a>')});
 const text=['Hello '+firstName(order.customer_name)+',','','Thank you for your HALONAP order. Your payment was successful and we will email you with tracking when it is dispatched.','','Order reference: '+ref(order),...lines,'Total paid: '+money(order.total_pence),...(address.length?['','Delivering to:',...address]:[]),'','Need to change something? Reply to this email with your order reference.','Returns: '+SITE+'/returns.html','','Sleep well,','HALONAP Customer Care'].join('\n');
 return {subject:'Order confirmed: '+ref(order)+' | HALONAP',html,text};
}

export function dispatchEmail(order,note=''){
 const extra=typeof note==='string'?note.trim().slice(0,300):'',lines=itemLines(order.items);
 const rows=[['Order reference',esc(ref(order))],['Your order',lines.map(esc).join('<br>')||'HALONAP Sleep Eye Mask'],...(order.tracking_number?[['Tracking number','<strong>'+esc(order.tracking_number)+'</strong>']]:[])];
 const html=layout({eyebrow:'Order dispatched',title:'Your order is on its way',preheader:'Your HALONAP order '+ref(order)+' has been dispatched.',
  body:p('Hello '+esc(firstName(order.customer_name))+',')+p('Good news: your HALONAP order has been packed and handed to our delivery partner.')+panel(rows)+(extra?p(esc(extra),'white-space:pre-line;'):'')+p('Questions about your delivery? Just reply to this email with your order reference.')});
 const text=['Hello '+firstName(order.customer_name)+',','','Your HALONAP order has been dispatched.','Order reference: '+ref(order),...lines,...(order.tracking_number?['Tracking number: '+order.tracking_number]:[]),'','Questions? Reply to this email with your order reference.','',...(extra?[extra,'']:[]),'Sleep well,','HALONAP Customer Care','https://halonap.com'].join('\n');
 return {subject:'Your HALONAP order is on its way ('+ref(order)+')',html,text};
}

export function enquiryReceivedEmail(name,topic,ticket){
 const html=layout({eyebrow:'Customer care',title:"We've received your message",preheader:"We've received your enquiry. Your HALONAP reference is "+ticket+'.',
  body:p('Hello '+esc(firstName(name))+',')+p('Thank you for getting in touch with HALONAP. Our customer care team will review your enquiry and reply as soon as possible.')+panel([['Your reference','<strong>'+esc(ticket)+'</strong>'],['Enquiry type',esc(topic)]])+p('Need to add more details? Simply reply to this email and keep your reference in the subject.')+button(SITE,'Visit HALONAP')+small('This is an automatic confirmation of your enquiry.')});
 const text=['Hello '+firstName(name)+',','','Thank you for contacting HALONAP. We have received your enquiry.','Your reference number: '+ticket,'Topic: '+topic,'','Our customer care team will review your message and respond as soon as possible.','If you need to add information, reply to this email and include your reference number.','','Better sleep, brighter days.','HALONAP Customer Care',SITE].join('\n');
 return {subject:'HALONAP | Enquiry received ('+ticket+')',html,text};
}

function unsubscribeToken(email){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw Error('Unsubscribe is not configured');
 return crypto.createHmac('sha256','halonap-email-opt-out:'+key).update(email.toLowerCase()).digest('hex').slice(0,32);
}
export function unsubscribeUrl(email){return SITE+'/api/unsubscribe?e='+encodeURIComponent(email.toLowerCase())+'&t='+unsubscribeToken(email)}
export function validUnsubscribe(email,token){
 if(typeof email!=='string'||typeof token!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[0-9a-f]{32}$/.test(token))return false;
 const expected=unsubscribeToken(email);return crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(token));
}

export function reviewRequestEmail(order){
 const optOut=unsubscribeUrl(order.customer_email);
 const html=layout({eyebrow:'How are you sleeping?',title:'How is your HALONAP mask?',preheader:'A quick review helps other people sleep better.',
  body:p('Hello '+esc(firstName(order.customer_name))+',')+p('Your HALONAP sleep mask should have been with you for about a week now. We would love to know how you are finding it.')+p('If you have a minute, a short review (and a photo, if you like) really helps other people choose, and helps a small UK brand grow.')+button(SITE+'/#reviews','Write a Review')+p('If anything is not right with your mask, just reply to this email and we will sort it out.'),
  footerExtra:`<p style="color:#b58a9f;font-size:11px;line-height:1.6;margin:12px 0 0;">You are receiving this because you ordered from HALONAP (order ${esc(ref(order))}). <a href="${esc(optOut)}" style="color:#b58a9f;">Don't send me review requests</a></p>`});
 const text=['Hello '+firstName(order.customer_name)+',','','Your HALONAP sleep mask should have been with you for about a week. How are you finding it?','','A short review really helps other people choose:',SITE+'/#reviews','','If anything is not right, just reply to this email.','','Sleep well,','HALONAP Customer Care','','Stop review request emails: '+optOut].join('\n');
 return {subject:'How is your HALONAP sleep mask?',html,text,headers:{'List-Unsubscribe':'<'+optOut+'>','List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}};
}

// Claim a timestamp column, send, and release the claim if sending fails, so each email goes at most once.
export async function sendOnce(order,column,build,send){
 const now=new Date().toISOString();
 const claimed=await database('customer_orders?id=eq.'+encodeURIComponent(order.id)+'&'+column+'=is.null',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({[column]:now})});
 if(!Array.isArray(claimed)||claimed.length!==1)return false;
 try{await send({to:order.customer_email,...build(order)});return true}
 catch(err){await database('customer_orders?id=eq.'+encodeURIComponent(order.id),{method:'PATCH',body:JSON.stringify({[column]:null})}).catch(()=>{});throw err}
}

export async function sendOrderConfirmation(orderId,send=mailer()){
 if(!send)return 'not_configured';
 const rows=await database('customer_orders?select=id,order_number,items,total_pence,customer_name,customer_email,shipping_address,confirmation_email_sent_at&id=eq.'+encodeURIComponent(orderId));
 const order=rows?.[0];
 if(!order?.customer_email||order.confirmation_email_sent_at)return 'skipped';
 return await sendOnce(order,'confirmation_email_sent_at',orderConfirmationEmail,send)?'sent':'skipped';
}
