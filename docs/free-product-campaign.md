# Free product campaign

3 thoughtful answers + 3 friends who join and verify = 1 free product, picked with a spin.

## Pages
- `/free-product` progress (account, 3 answers, 3 friends, invite link)
- `/free-product/reward` spin, claim, address, status
- `/admin/campaign` team view (ADMIN_EMAILS only): launch/pause/end, reward pool, people, fulfillment, CSV
- You page shows a small card with progress or the claimed reward
- `/join?ref=<code>` invite links (first touch wins, 30 days)

## Rules (all enforced in Postgres, `campaign_progress`)
- Own account verified: Supabase confirmed it (`email_confirmed_at` or `phone_confirmed_at`). One function: `campaign_user_is_verified`.
- 3 answers, each at least 120 characters after collapsing whitespace, at least 12 words, not repeated characters or one phrase repeated, not a copy of another answer. Distinct answers only count once in the database too.
- 3 friends whose accounts were created at or after launch, attributed within 7 days of signing up (existing referrals policy), verified, not the same inbox as you (plus-addresses and Gmail dots ignored), not the same inbox as another friend.
- One claim per person per campaign (unique constraint). Claiming is final.

## Setup (nothing here has been run)
1. Apply `supabase/migrations/20261013150000_referrals.sql` if it is not applied yet.
2. Apply `supabase/migrations/20261015120000_free_product_campaign.sql`. The campaign is created paused with an empty pool.
3. Add products and units on `/admin/campaign` (catalog ids from `product_catalog`).
4. Press Launch. Friends count from that moment.
5. Emails are off. To turn them on later: set `RESEND_API_KEY`, `CAMPAIGN_EMAILS_ENABLED=1`, `CAMPAIGN_POSTAL_ADDRESS`, and add the hourly cron for `/api/campaign-notify` in `vercel.json`. The announcement is a mockup in `emails/free-product/announcement.html` (`node scripts/render-campaign-emails.mjs` rebuilds it); send it as a Resend broadcast so `{{{RESEND_UNSUBSCRIBE_URL}}}` is filled in.

## Tests
- `npx vitest run src/utils/freeProductCampaign.test.js api/campaign*.test.js api/_campaignEmail.test.js`
- `./scripts/test-campaign-sql.sh` real Postgres: eligibility, referral rules, spins, claims, and concurrent claims racing for the last units.
