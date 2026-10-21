-- Team copy approved by Ameera, Oct 21 2026 ("The copy OKs: Clue, Uqora, LOLA, and the postpartum title").
-- Paste into the Supabase SQL Editor and run once. Safe to re-run.
-- Same text as src/data/ (recorded in src/data/teamCopy.approvals.json).
--   p-uqora-control: effectiveness, doctor_opinion, badges (no Evidence-Based badge)
--   p-lola-tampon: safety.fdaStatus
--   privacy-review text (d-clue and the other providers that share it): "provider's current"

begin;

update public.product_catalog set effectiveness = 'Weak evidence. D-mannose, its main listed ingredient, did not prevent UTIs better than a placebo in a 2024 JAMA Internal Medicine trial of 598 women with recurrent UTIs (51.0% vs 55.7% saw a clinician for a suspected UTI within 6 months). Uqora Control itself has not been tested in a published trial.',
  doctor_opinion = 'The best evidence so far does not support D-mannose, the main ingredient listed here, for preventing UTIs. In a 2024 randomized trial in JAMA Internal Medicine, 598 women with recurrent UTIs took 2 g of D-mannose powder or a placebo every day for 6 months. D-mannose did not lower the share who saw a clinician for a suspected UTI (51.0% vs 55.7%, not a significant difference), and the authors concluded it should not be recommended to prevent UTIs. Uqora Control itself has not been tested in a published trial. If you get UTIs often, ask a clinician about prevention options with stronger evidence. Drinking enough water and peeing after sex are common, low-risk habits to keep up.',
  extra = jsonb_set(extra, '{badges}', '["UTI Focus"]'::jsonb)
where id = 'p-uqora-control';

update public.product_catalog set safety = jsonb_set(safety, '{fdaStatus}', to_jsonb('FDA-regulated Class II medical device (unscented menstrual tampon, product code HEB). LOLA says its tampons are FDA 510(k) cleared. FDA records list LOLA''s company, ALYK, Inc., with tampon 510(k) clearances held by its manufacturers, such as K151170 (Tosama 100% organic cotton tampon), but ayna could not match a clearance number to this exact product.'::text))
where id = 'p-lola-tampon';

update public.product_catalog set extra = jsonb_set(extra, '{privacy}', '{"dataStorage":"Review the provider''s current privacy policy for data storage details.","sellsData":"Review the provider''s current privacy policy for data sharing and sale disclosures.","hipaa":"Review the provider''s current privacy notices for applicable privacy protections.","keyPolicy":"Privacy practices can change. Verify the provider''s current policy before sharing sensitive health information."}'::jsonb)
where id in ('d-clue', 'd-nurx-bc', 'd-wisp-bc', 'd-hers', 'd-midi-health', 'd-natural-cycles', 'd-glow', 'd-maven', 'd-tia', 'd-ppd', 'd-initio', 'd-apple-health', 'd-visana', 'd-evernow')
  and extra->'privacy'->>'dataStorage' = 'Review the provider current privacy policy for data storage details.';

commit;
