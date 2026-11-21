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

// One premium HALONAP email design, matching halonap.com: warm cream page, "Halonap" wordmark with a gold "o",
// white rounded card, serif headline over a short gold rule, calm grey body text and a dark pill button.
// Table-based with inline styles so it holds up in Gmail, Apple Mail and Outlook. Web fonts fall back to Georgia/Arial.
const C={page:'#f3f2ee',card:'#ffffff',ink:'#272724',text:'#55554f',muted:'#8a8a82',line:'#ebe9e3',gold:'#d9a422',panel:'#f7f6f2',button:'#272724',footer:'#8a8a82'};
const SANS="'DM Sans',Arial,Helvetica,sans-serif",SERIF="'Playfair Display',Georgia,'Times New Roman',serif";
export const BRAND=C.ink;

export function layout({eyebrow,title,preheader,body,footerExtra='',signoff=true}){
 return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&amp;family=Playfair+Display&amp;display=swap" rel="stylesheet"><style>@media only screen and (max-width:600px){.hn-card{padding:34px 22px 30px!important}.hn-title{font-size:27px!important;line-height:34px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};"><tr><td align="center" style="padding:36px 14px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td align="center" style="padding:0 0 26px;"><a href="https://halonap.com" style="text-decoration:none;font-family:${SANS};font-size:34px;line-height:38px;font-weight:700;letter-spacing:-1.5px;color:${C.ink};">Hal<span style="color:${C.gold};">o</span>nap</a></td></tr>
<tr><td class="hn-card" style="background:${C.card};border-radius:20px;padding:46px 44px 38px;font-family:${SANS};">
${eyebrow?`<p style="margin:0 0 14px;text-align:center;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:2.2px;text-transform:uppercase;color:${C.muted};">${esc(eyebrow)}</p>`:''}
<h1 class="hn-title" style="margin:0;text-align:center;font-family:${SERIF};font-size:32px;line-height:40px;font-weight:400;letter-spacing:-0.5px;color:${C.ink};">${esc(title)}</h1>
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 28px;"><tr><td style="width:44px;height:2px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</td></tr></table>
${body}
${signoff?`<p style="margin:30px 0 0;font-family:${SANS};font-size:15px;line-height:24px;color:${C.text};">Sleep well,<br><span style="color:${C.ink};font-weight:700;">The HALONAP team</span></p>`:''}
</td></tr>
<tr><td align="center" style="padding:28px 20px 0;font-family:${SANS};font-size:12px;line-height:20px;color:${C.footer};">
<p style="margin:0 0 6px;font-family:${SERIF};font-size:15px;color:${C.ink};">Better sleep, brighter days.</p>
<p style="margin:0 0 14px;"><a href="https://halonap.com" style="color:${C.ink};text-decoration:none;">halonap.com</a> &nbsp;·&nbsp; <a href="mailto:hello@halonap.com" style="color:${C.ink};text-decoration:none;">hello@halonap.com</a> &nbsp;·&nbsp; <a href="https://www.instagram.com/halonap.co/" style="color:${C.ink};text-decoration:none;">Instagram</a></p>
<p style="margin:0;">HALONAP is a trading name of Ashvin Vattaparamban<br>81 Henry Street, Liverpool, L1 5BU, United Kingdom</p>${footerExtra}
</td></tr>
</table></td></tr></table></body></html>`;
}
export const p=(html,extra='')=>`<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:25px;color:${C.text};${extra}">${html}</p>`;
export const button=(href,label)=>`<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:10px auto 26px;"><tr><td align="center" bgcolor="${C.button}" style="border-radius:99px;"><a href="${esc(href)}" style="display:inline-block;padding:16px 38px;font-family:${SANS};font-size:15px;line-height:18px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:99px;">${esc(label)}</a></td></tr></table>`;
// Details panel for order information: rows of [label, valueHtml].
export const panel=rows=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;background:${C.panel};border-radius:14px;"><tr><td style="padding:6px 22px;">${rows.map(([label,value],i)=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:14px 0;${i?`border-top:1px solid ${C.line};`:''}"><p style="margin:0 0 4px;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:1.6px;text-transform:uppercase;color:${C.muted};">${esc(label)}</p><p style="margin:0;font-family:${SANS};font-size:15px;line-height:23px;color:${C.ink};word-break:break-word;">${value}</p></td></tr></table>`).join('')}</td></tr></table>`;
export const small=html=>`<p style="margin:14px 0 0;text-align:center;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">${html}</p>`;

export {esc,firstName,ref,itemLines};

export function orderConfirmationEmail(order){
 const a=order.shipping_address||{},address=[a.line1,a.line2,a.city,a.postal_code].filter(Boolean),lines=itemLines(order.items);
 const rows=[['Order reference',esc(ref(order))],['Your order',lines.map(esc).join('<br>')||'HALONAP Sleep Eye Mask'],['Total paid','<strong>'+esc(money(order.total_pence))+'</strong>'],...(address.length?[['Delivering to',address.map(esc).join('<br>')]]:[])];
 const html=layout({eyebrow:'Order confirmed',title:'Thank you for your order',preheader:'We have your order '+ref(order)+' and will email you when it ships.',
  body:p('Hello '+esc(firstName(order.customer_name))+',')+p('Your payment was successful and we are getting your HALONAP mask ready. We will email you again with tracking as soon as it is on its way.')+panel(rows)+p('Need to change something? Just reply to this email with your order reference as soon as possible.')+small('<a href="'+SITE+'/returns.html" style="color:'+BRAND+';">Returns policy</a> · <a href="'+SITE+'/terms.html" style="color:'+BRAND+';">Terms</a> · <a href="'+SITE+'/delivery.html" style="color:'+BRAND+';">Delivery</a>')});
 const text=['Hello '+firstName(order.customer_name)+',','','Thank you for your HALONAP order. Your payment was successful and we will email you with tracking when it is dispatched.','','Order reference: '+ref(order),...lines,'Total paid: '+money(order.total_pence),...(address.length?['','Delivering to:',...address]:[]),'','Need to change something? Reply to this email with your order reference.','Returns: '+SITE+'/returns.html','','Sleep well,','The HALONAP team'].join('\n');
 return {subject:'Order confirmed: '+ref(order)+' | HALONAP',html,text};
}

export function dispatchEmail(order,note=''){
 const extra=typeof note==='string'?note.trim().slice(0,300):'',lines=itemLines(order.items);
 const rows=[['Order reference',esc(ref(order))],['Your order',lines.map(esc).join('<br>')||'HALONAP Sleep Eye Mask'],...(order.tracking_number?[['Tracking number','<strong>'+esc(order.tracking_number)+'</strong>']]:[])];
 const html=layout({eyebrow:'Order dispatched',title:'Your order is on its way',preheader:'Your HALONAP order '+ref(order)+' has been dispatched.',
  body:p('Hello '+esc(firstName(order.customer_name))+',')+p('Good news: your HALONAP order has been packed and handed to our delivery partner.')+panel(rows)+(extra?p(esc(extra),'white-space:pre-line;'):'')+p('Questions about your delivery? Just reply to this email with your order reference.')});
 const text=['Hello '+firstName(order.customer_name)+',','','Your HALONAP order has been dispatched.','Order reference: '+ref(order),...lines,...(order.tracking_number?['Tracking number: '+order.tracking_number]:[]),'','Questions? Reply to this email with your order reference.','',...(extra?[extra,'']:[]),'Sleep well,','The HALONAP team','https://halonap.com'].join('\n');
 return {subject:'Your HALONAP order is on its way ('+ref(order)+')',html,text};
}

export function enquiryReceivedEmail(name,topic,ticket){
 const html=layout({eyebrow:'Customer care',title:"We've received your message",preheader:"We've received your enquiry. Your HALONAP reference is "+ticket+'.',
  body:p('Hello '+esc(firstName(name))+',')+p('Thank you for getting in touch with HALONAP. Our customer care team will review your enquiry and reply as soon as possible.')+panel([['Your reference','<strong>'+esc(ticket)+'</strong>'],['Enquiry type',esc(topic)]])+p('Need to add more details? Simply reply to this email and keep your reference in the subject.')+small('This is an automatic confirmation of your enquiry.')});
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
  footerExtra:`<p style="margin:14px 0 0;font-size:11px;line-height:18px;color:#8a8a82;">You are receiving this because you ordered from HALONAP (order ${esc(ref(order))}). <a href="${esc(optOut)}" style="color:#8a8a82;text-decoration:underline;">Don't send me review requests</a></p>`});
 const text=['Hello '+firstName(order.customer_name)+',','','Your HALONAP sleep mask should have been with you for about a week. How are you finding it?','','A short review really helps other people choose:',SITE+'/#reviews','','If anything is not right, just reply to this email.','','Sleep well,','The HALONAP team','','Stop review request emails: '+optOut].join('\n');
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
