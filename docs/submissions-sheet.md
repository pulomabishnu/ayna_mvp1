# ayna submissions tracker (Google Sheet)

The sheet "ayna submissions tracker" (owner ameera@aynahealth.co) fills itself
every hour from the ayna site. Pieces:

- `api/admin-export.js`: server endpoint that returns rows per source, behind a
  secret token.
- `scripts/google-sheets/ayna-submissions.gs`: Apps Script pasted into the sheet.
- `supabase/contact_messages_2026-10-21.sql`: stores contact form messages
  (before this, they were only emailed).

**The sheet has shipping names, addresses and emails (Claims tab) and contact
form senders' emails. Share it only with the three founders.** It never
contains health data or quiz answers, and no account emails or phone numbers.

## Tabs

| Tab | What | Updates |
| --- | --- | --- |
| Claims | Free-product claims: product, status, **Shipped?**, ship-to name, address, shipping email | rows refresh when status changes |
| Campaign feedback | The campaign's feedback answers, with the claim ID and product they belong to | rows refresh when edited |
| Survey | "How are you liking ayna?" survey + purchase check-ins (anonymous) | new rows added |
| Reviews | Community review posts and product-page reviews: product, stars, text, @handle (blank if anonymous) | rows refresh |
| Contact | Contact form messages (name, email, reason, subject, message) | new rows added |
| Topics | Suggestions: topics, reads, products | new rows added |
| Partners | Product submissions and early-stage startups | rows refresh |
| Invites | Per inviter (@handle): links shared, opens, signups, verified signups | rewritten each sync |
| Signups | Per day (UTC): new accounts, verified accounts, SMS opt-ins, email opt-ins | rewritten each sync |
| Setup | Last synced time, hourly sync on/off, errors from the last sync | each sync |

You can add your own columns (notes, "packed by") to the right of the data. The
sync never touches them. Don't edit the ID column.

## Founder setup (once)

1. **Make a token.** Any long random string, at least 32 characters. For
   example, on a Mac run `openssl rand -hex 32` in Terminal, or use a password
   manager's generator (64 characters, letters and numbers). Keep it in the
   password manager; don't paste it into Slack or email.
2. **Vercel.** Project > Settings > Environment Variables > Add:
   name `ADMIN_EXPORT_TOKEN`, value = the token, environment **Production**
   only. Save, then redeploy production (Deployments > latest production > Redeploy)
   so the function picks it up.
3. **Supabase.** SQL Editor > New query > paste all of
   `supabase/contact_messages_2026-10-21.sql` > Run. It is safe to run twice.
   (Until it runs, the Contact tab shows an error on the Setup tab; the
   contact form keeps emailing you either way.)
4. **Open the sheet** "ayna submissions tracker" as ameera@aynahealth.co.
5. **Paste the script.** Extensions > Apps Script. Delete what is in `Code.gs`,
   paste all of `scripts/google-sheets/ayna-submissions.gs`, click Save.
6. **Script Properties.** In the Apps Script editor: Project Settings (gear) >
   Script Properties > Add script property, twice:
   - `AYNA_EXPORT_URL` = `https://www.aynahealth.co/api/admin-export`
     (the production domain exactly, with `www`; the script doesn't follow
     redirects, so the token is never sent anywhere else)
   - `AYNA_EXPORT_TOKEN` = the same token as in Vercel
   Save.
7. **Run `syncAyna` once.** Back in the editor, pick `syncAyna` in the function
   dropdown > Run. Google asks for permission (connect to an external service,
   edit this spreadsheet): Review permissions > choose the ayna account >
   Advanced > Go to project > Allow. The tabs appear; check the Setup tab says
   Status OK.
8. **Run `installTrigger` once.** Pick `installTrigger` > Run. The Setup tab
   shows "Hourly sync: On". After this the sheet updates every hour. There is
   also an **ayna** menu in the sheet (Sync now, Turn on hourly sync) after you
   reload it.

## If something breaks

- Setup tab lists the error per tab. `401` means the token in Script Properties
  doesn't match Vercel. `503` means `ADMIN_EXPORT_TOKEN` (32+ characters) or the
  Supabase keys aren't set in Vercel Production.
- To change the token: update it in Vercel (redeploy) and in Script Properties.
- To re-pull a tab from scratch: delete the tab, and in Script Properties delete
  `since_<source>` (for example `since_contact`), then Sync now.

## Security notes

- Token compared in constant time; wrong or missing token gets 401, requests
  are rate limited per IP, responses are `no-store`, rows are never logged.
- The endpoint reads only the tables listed in `READ_TABLES` in
  `api/admin-export.js`; a test fails if any source reads a health, quiz,
  intake, ecosystem or phone table.
- `invite_stats` has an email column; the export never selects it. Inviters
  show by public @handle.
- `contact_messages` has RLS on and no grants to app users: only the server can
  read or write it.
