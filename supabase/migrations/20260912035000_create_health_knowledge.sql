-- Privacy-first, server-only health knowledge used before external search.
-- Public schema keeps the server client simple, but browser roles receive no
-- table privileges and RLS is enabled as defense in depth. Only service_role
-- reads this table from Vercel server functions.

create table if not exists public.health_knowledge (
  id bigint generated always as identity primary key,
  slug text not null unique,
  topic text not null,
  aliases text[] not null default '{}',
  summary text not null,
  content text not null default '',
  source_names text[] not null default '{}',
  source_urls text[] not null default '{}',
  article_id text,
  review_status text not null default 'approved'
    check (review_status in ('approved', 'needs_review', 'retired')),
  active boolean not null default true,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.health_knowledge enable row level security;
revoke all on table public.health_knowledge from public, anon, authenticated;
grant select on table public.health_knowledge to service_role;

create index if not exists health_knowledge_active_review_idx
  on public.health_knowledge (active, review_status);

insert into public.health_knowledge
  (slug, topic, aliases, summary, source_names, article_id, review_status, active, reviewed_at)
values
  ('intimate-wash', 'Intimate Washes', array['intimate wash','vaginal wash','vulva wash','vulvar hygiene','vaginal hygiene','intimate care'], 'Why the vagina is self-cleaning, when to use or skip cleansers, and what OB-GYNs recommend for external care.', array['UpToDate','ACOG','CDC'], 'intimate-wash', 'approved', true, now()),
  ('heavy-bleeding', 'Heavy Menstrual Bleeding', array['heavy bleeding','heavy period','heavy periods','menorrhagia','heavy flow'], 'What counts as heavy bleeding, possible causes, when to seek care, and how it is evaluated and treated.', array['UpToDate','ACOG','CDC'], 'heavy-bleeding', 'approved', true, now()),
  ('menopause-basics', 'Menopause & Perimenopause', array['menopause','perimenopause','hot flashes','hot flushes','night sweats'], 'What perimenopause and menopause are, common symptoms, and how hormone therapy and lifestyle changes can help.', array['NAMS','UpToDate','ACOG'], 'menopause-basics', 'approved', true, now()),
  ('uti-prevention', 'UTI Prevention', array['uti','urinary tract infection','recurrent uti','bladder infection','urinary health'], 'Evidence-backed ways to reduce UTI risk and when to see a clinician for recurrent infections.', array['UpToDate','NIH','CDC'], 'uti-prevention', 'approved', true, now()),
  ('yeast-infection-basics', 'Yeast Infection Basics', array['yeast infection','candidiasis','vaginal yeast','vulvovaginal candidiasis'], 'What causes yeast infections, how to recognize them, when to treat at home versus see a clinician, and how to prevent recurrence.', array['UpToDate','CDC','ACOG'], 'yeast-infection-basics', 'approved', true, now()),
  ('period-pain-when-to-seek-care', 'Period Pain: When to Seek Care', array['period pain','period cramps','menstrual cramps','dysmenorrhea','painful period'], 'Normal cramps versus signs that something else may be going on, and what treatments and workups clinicians may suggest.', array['ACOG','UpToDate','Mayo Clinic'], 'period-pain-when-to-seek-care', 'approved', true, now()),
  ('pcos-basics', 'PCOS: What It Is and How It Is Managed', array['pcos','polycystic ovary syndrome','polycystic ovarian syndrome','irregular ovulation','hyperandrogenism'], 'Polycystic ovary syndrome explained: diagnosis, symptoms, and evidence-based treatment options including lifestyle and medication.', array['ACOG','Endocrine Society','UpToDate'], 'pcos-basics', 'approved', true, now()),
  ('pelvic-floor-dysfunction', 'Pelvic Floor Dysfunction', array['pelvic floor','pelvic floor dysfunction','pelvic floor therapy','pelvic floor pt','pelvic pressure'], 'What the pelvic floor does, common symptoms of dysfunction, and how pelvic floor physical therapy and at-home tools can help.', array['ACOG','UpToDate','APTA'], 'pelvic-floor-dysfunction', 'approved', true, now()),
  ('endometriosis-basics', 'Endometriosis: Symptoms, Diagnosis, and Care', array['endometriosis','endo pain','endometrioma','painful sex endometriosis'], 'What endometriosis is, how it is diagnosed, and treatment options from pain management to surgery and fertility support.', array['ACOG','Endometriosis Foundation of America','UpToDate'], 'endometriosis-basics', 'approved', true, now()),
  ('bacterial-vaginosis', 'Bacterial Vaginosis (BV)', array['bacterial vaginosis','bv','fishy odor','vaginal odor'], 'What causes BV, how it differs from a yeast infection, treatment options, and why it tends to recur.', array['CDC','ACOG','UpToDate'], 'bacterial-vaginosis', 'approved', true, now()),
  ('pmdd', 'PMDD: Premenstrual Dysphoric Disorder', array['pmdd','premenstrual dysphoric disorder','severe pms','pms mood','cycle mood'], 'How PMDD differs from PMS, what causes it, and evidence-based treatments including SSRIs, hormonal options, and lifestyle support.', array['ACOG','IAPMD','UpToDate'], 'pmdd', 'approved', true, now()),
  ('fibroids', 'Uterine Fibroids', array['fibroids','uterine fibroid','leiomyoma','uterine fibroids'], 'What fibroids are, why they can cause heavy bleeding and pain, and the range of treatment options from watchful waiting to surgery.', array['ACOG','NIH','UpToDate'], 'fibroids', 'approved', true, now()),
  ('iron-deficiency-anemia', 'Iron Deficiency & Anemia from Heavy Periods', array['iron deficiency','anemia','anaemia','low iron','ferritin','heavy periods anemia'], 'How heavy periods can deplete iron, symptoms to watch for, and how deficiency is addressed through diet, supplements, and treating the root cause.', array['ACOG','NIH','UpToDate'], 'iron-deficiency-anemia', 'approved', true, now()),
  ('ovarian-cysts', 'Ovarian Cysts', array['ovarian cyst','ovarian cysts','ruptured cyst','ovary cyst'], 'Most ovarian cysts are harmless and resolve on their own. Learn when monitoring is enough and when to seek care.', array['ACOG','Mayo Clinic','UpToDate'], 'ovarian-cysts', 'approved', true, now()),
  ('hormonal-birth-control', 'Hormonal Birth Control: Types, Benefits & Side Effects', array['birth control','hormonal birth control','contraception','contraceptive pill','iud','implant'], 'A plain-language guide to pills, patches, rings, shots, implants, and hormonal IUDs: how they work, common side effects, and how to choose.', array['ACOG','Planned Parenthood','UpToDate'], 'hormonal-birth-control', 'approved', true, now())
on conflict (slug) do update set
  topic = excluded.topic,
  aliases = excluded.aliases,
  summary = excluded.summary,
  source_names = excluded.source_names,
  article_id = excluded.article_id,
  review_status = excluded.review_status,
  active = excluded.active,
  reviewed_at = excluded.reviewed_at,
  updated_at = now();
