# HALONAP email templates

Every HALONAP email uses one design, defined in `lib/customer-emails.js` (cream page, "Halonap" wordmark with a gold "o", serif headline, dark pill button).

## Sent by the website
Order confirmation, dispatch, review request and enquiry received. These are built in code, so there is nothing to paste.

## Supabase Auth emails
Supabase sends these. Paste each file into **Supabase Dashboard → Authentication → Emails**, in the template with the same name, and set the subject:

| Supabase template | File | Subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Confirm your HALONAP account |
| Invite user | `invite.html` | You've been invited to HALONAP |
| Magic link | `magic-link.html` | Your HALONAP sign-in link |
| Change email address | `change-email.html` | Confirm your new HALONAP email address |
| Reset password | `reset-password.html` | Reset your HALONAP password |
| Reauthentication | `reauthentication.html` | Your HALONAP verification code |

To change the design, edit `layout()` in `lib/customer-emails.js`, run `node scripts/build_auth_email_templates.mjs`, and paste the files again.
