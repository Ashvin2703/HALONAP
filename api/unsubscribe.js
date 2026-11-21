import {database} from '../lib/commerce.js';
import {validUnsubscribe} from '../lib/customer-emails.js';

const page=(title,text)=>`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | HALONAP</title><style>body{margin:0;background:#fff9fb;color:#372d34;font:16px/1.7 system-ui,-apple-system,sans-serif}main{max-width:560px;margin:80px auto;padding:0 24px}a{color:#82435e}</style></head><body><main><p><strong>HALONAP</strong></p><h1>${title}</h1><p>${text}</p><p><a href="https://halonap.com/">Back to HALONAP</a></p></main></body></html>`;

// GET shows the result page (link in the email); POST supports one-click List-Unsubscribe from mail apps.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).end()}
 const email=String(req.query?.e||'').toLowerCase(),token=String(req.query?.t||'');
 let ok=false;try{ok=validUnsubscribe(email,token)}catch{}
 res.setHeader('Content-Type','text/html; charset=utf-8');
 if(!ok)return res.status(400).send(page('Link not valid','This unsubscribe link is not valid or has expired. Email hello@halonap.com and we will remove you.'));
 try{await database('email_opt_outs?on_conflict=email',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify({email})})}
 catch(err){console.error('Opt-out failed',err?.message);return res.status(503).send(page('Please try again','We could not save your choice just now. Please try the link again, or email hello@halonap.com.'))}
 return res.status(200).send(page('You are unsubscribed','We will not send you review request emails again. You will still get emails about your orders, such as confirmations and dispatch updates.'));
}
