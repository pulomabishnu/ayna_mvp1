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
- 3 spins per person (`reward_campaigns.max_spins`). Each spin lands on a product she hasn't landed on yet when one is available. She can claim any product she landed on that still has units. If everything she landed on has since been claimed, she gets one more spin.
- One claim per person per campaign (unique constraint). Claiming is final.

## Reward pool
- A reward is either a catalog product (`product_id`) or a reward-only item (`name`, `brand`, `size`, `image_url`, `product_url`). Reward-only items never show in Shop and store no health claims.
- The PR haul pool is in `supabase/seed/free_product_pr_haul.sql` (22 products, 24 units). Re-running it updates units without touching what has been claimed. Add more products later on `/admin/campaign` (Add a product).

## Setup (nothing here has been run)
1. In the Supabase SQL Editor, apply in this order (each is safe to re-run):
   - `supabase/migrations/20261013150000_referrals.sql` (if not applied yet)
   - `supabase/migrations/20261019120000_referral_from_signup.sql` (records a referral from sign-up metadata, so a friend who confirms on another device still counts; also backfills)
   - `supabase/migrations/20261015120000_free_product_campaign.sql` (the campaign is created paused with an empty pool)
2. Run `supabase/seed/free_product_pr_haul.sql` to load the PR haul products, or add products on `/admin/campaign`.
3. In Vercel, set `ADMIN_EMAILS` (who can open `/admin/campaign`), `RESEND_API_KEY`, `CRON_SECRET`, and optionally `CAMPAIGN_TEAM_EMAIL`.
4. Press Launch on `/admin/campaign`. Friends count from that moment.

## Who gets what email
- **Team alerts** (on as soon as `RESEND_API_KEY` is set): an email to `CAMPAIGN_TEAM_EMAIL` (or everyone in `ADMIN_EMAILS`) when someone claims, and another with the full shipping address when they add or change it. Mark it shipped on `/admin/campaign`.
- **Emails to people** (off until `CAMPAIGN_EMAILS_ENABLED=1` and `CAMPAIGN_POSTAL_ADDRESS` are set): "unlocked" (hourly cron `/api/campaign-notify`, already in `vercel.json`), "claimed", "shipped". They never send with the postal-address placeholder in the footer.
- **The announcement** is not sent by the code. It is `emails/free-product/announcement.html` (`node scripts/render-campaign-emails.mjs` rebuilds it); send it as a Resend Broadcast to your audience so `{{{RESEND_UNSUBSCRIBE_URL}}}` is filled in. Send a test to yourself first.

## Tests
- `npx vitest run src/utils/freeProductCampaign.test.js api/campaign*.test.js api/_campaignEmail.test.js`
- `./scripts/test-campaign-sql.sh` real Postgres: eligibility, referral rules, spins, claims, and concurrent claims racing for the last units.
