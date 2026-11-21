# HALONAP email templates

Customer emails sent by the website (order confirmation, dispatch, review request, enquiry received) are built in `lib/customer-emails.js` and share the design of the Supabase signup "Verify Your Email" template.

Supabase Auth emails are set in the Supabase Dashboard, not in this repo:

- **Confirm signup**: already uses the HALONAP design.
- **Reset password**: paste `reset-password.html` into Supabase Dashboard → Authentication → Emails → **Reset Password** (subject: `HALONAP | Reset Your Password`).
