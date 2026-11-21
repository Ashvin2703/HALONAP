// Builds the Supabase Auth email templates in docs/email-templates/ from the same layout as the
// website's own customer emails (lib/customer-emails.js). Run: node scripts/build_auth_email_templates.mjs
// Then paste each file into Supabase Dashboard → Authentication → Emails. {{ .X }} are Supabase variables.
import {writeFileSync,mkdirSync} from 'node:fs';
import {layout,p,button,small,panel} from '../lib/customer-emails.js';

const ignore=what=>small('If you did not '+what+', you can safely ignore this email.');
const templates={
 'confirm-signup':{subject:'Confirm your HALONAP account',eyebrow:'Welcome to HALONAP',title:'Confirm your email',preheader:'One tap to activate your HALONAP account.',
  body:p('Thank you for creating a HALONAP account. Please confirm your email address to activate it.','text-align:center;')+button('{{ .ConfirmationURL }}','Confirm my email')+ignore('create a HALONAP account')},
 'invite':{subject:"You've been invited to HALONAP",eyebrow:'You are invited',title:'Join HALONAP',preheader:'Accept your invitation to HALONAP.',
  body:p('You have been invited to create an account on halonap.com. Tap the button below to accept and set your password.','text-align:center;')+button('{{ .ConfirmationURL }}','Accept invitation')+ignore('expect this invitation')},
 'magic-link':{subject:'Your HALONAP sign-in link',eyebrow:'Sign in',title:'Your sign-in link',preheader:'Tap to sign in to HALONAP. The link works once.',
  body:p('Tap the button below to sign in to your HALONAP account. For your security, the link can only be used once and expires soon.','text-align:center;')+button('{{ .ConfirmationURL }}','Sign in to HALONAP')+ignore('ask to sign in')},
 'change-email':{subject:'Confirm your new HALONAP email address',eyebrow:'Account update',title:'Confirm your new email',preheader:'Confirm the change to your HALONAP email address.',
  body:p('Please confirm that you want to change the email address on your HALONAP account.','text-align:center;')+panel([['Current email','{{ .Email }}'],['New email','{{ .NewEmail }}']])+button('{{ .ConfirmationURL }}','Confirm email change')+small('If you did not ask for this change, please reply to this email straight away so we can protect your account.')},
 'reset-password':{subject:'Reset your HALONAP password',eyebrow:'Account security',title:'Reset your password',preheader:'Choose a new password for your HALONAP account.',
  body:p('We received a request to reset the password for your HALONAP account. Tap the button below to choose a new one.','text-align:center;')+button('{{ .ConfirmationURL }}','Choose a new password')+small('If you did not ask to reset your password, you can safely ignore this email. Your password will not change.')},
 'reauthentication':{subject:'Your HALONAP verification code',eyebrow:'Account security',title:'Your verification code',preheader:'Use this code to confirm it is you.',
  body:p('Enter this code to confirm it is you:','text-align:center;')+'<p style="margin:6px 0 22px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:34px;line-height:40px;letter-spacing:10px;font-weight:700;color:#272724;">{{ .Token }}</p>'+small('This code expires shortly. If you did not request it, you can ignore this email.')},
};
mkdirSync(new URL('../docs/email-templates/',import.meta.url),{recursive:true});
let readme='# HALONAP email templates\n\nEvery HALONAP email uses one design, defined in `lib/customer-emails.js` (cream page, "Halonap" wordmark with a gold "o", serif headline, dark pill button).\n\n## Sent by the website\nOrder confirmation, dispatch, review request and enquiry received. These are built in code, so there is nothing to paste.\n\n## Supabase Auth emails\nSupabase sends these. Paste each file into **Supabase Dashboard → Authentication → Emails**, in the template with the same name, and set the subject:\n\n| Supabase template | File | Subject |\n|---|---|---|\n';
const names={'confirm-signup':'Confirm signup','invite':'Invite user','magic-link':'Magic link','change-email':'Change email address','reset-password':'Reset password','reauthentication':'Reauthentication'};
for(const [file,t] of Object.entries(templates)){
 writeFileSync(new URL('../docs/email-templates/'+file+'.html',import.meta.url),layout({...t,signoff:true})+'\n');
 readme+=`| ${names[file]} | \`${file}.html\` | ${t.subject} |\n`;
}
readme+='\nTo change the design, edit `layout()` in `lib/customer-emails.js`, run `node scripts/build_auth_email_templates.mjs`, and paste the files again.\n';
writeFileSync(new URL('../docs/email-templates/README.md',import.meta.url),readme);
console.log('built',Object.keys(templates).length,'Supabase templates');
