# HALONAP free local staging plan

No paid Supabase branch or production changes are required.

## Setup (local machine)
1. Install Docker Desktop, Node.js, and Supabase CLI (check current CLI installation guidance).
2. Clone this repository and create a separate local development branch.
3. Run `supabase init` if no local configuration exists, then `supabase start`. This starts a local PostgreSQL/Auth/Storage stack.
4. Import **schema and RLS policies only**, reviewed from production migrations or a sanitized schema export. Do not copy customer records, credentials, live tokens, or real review media.
5. Create synthetic products and test inventory (Black 2, Pink 1, Grey 1), mock customers and approved/pending reviews.
6. Run the website/API locally with Stripe **test-mode** credentials and test webhook signing secret, never live credentials.
7. Validate existing unit tests: `node --test tests/*.test.mjs`. Ensure tests do not call production endpoints.

## Critical acceptance tests
- Two concurrent checkouts for the last unit: only one stock reservation succeeds; the other receives a sold-out response.
- Reservations expire and release stock after timeout or checkout cancellation.
- Paid webhook consumes reservation exactly once; duplicate and out-of-order events are idempotent.
- No paid order can produce negative stock; failed payment releases reservations.
- Pending review media is inaccessible via unauthenticated direct URL; approved media remains visible.
- Existing approved image URLs are inventoried and migration tested before changing bucket visibility.
- RLS tests cover anonymous, customer, and admin permissions.
- Checkout delivery wording is 3–5 business days; privacy link resolves.
- Run mobile visual checks and Core Web Vitals locally or in a free preview environment.

## Important constraints
- Existing checkout.js and webhook.js point to production Supabase URLs. Parameterize these before any local integration testing, and verify all test endpoints are isolated.
- Do not turn the production `review-media` bucket private without a migration for approved media URLs.
- Do not deploy or merge without owner approval.
- Local tests do **not** establish real production concurrent-visitor capacity.
- A public Vercel preview is not a substitute for an isolated database if it still uses production environment variables.
