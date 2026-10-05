-- Exact product/package matches reviewed from the user-provided Amazon results on 2026-10-04.
-- Test prices only. A team admin must recheck the live listing and approve each row for live payment.
insert into public.pilot_product_prices (product_id,variant_id,variant_label,amount,currency,retailer_url,live_approved) values
  -- Source row 63: DivaCup - Menstrual Cup - Feminine Hygiene - Leak Free - BPA Free - Model 0
  ('p-diva-cup','40325944410193','Model 0',3498,'usd','https://www.amazon.com/dp/B07KGZ9NMV',false),
  -- Source row 97: Stay Dry Disposable Nursing Pads, 100 Count
  ('p-lansinoh-pads','28396272058440','100 Pads',1149,'usd','https://www.amazon.com/dp/B0070SKP1O',false),
  -- Source row 99: Stay Dry Disposable Nursing Pads, 36 Count
  ('p-lansinoh-pads','29251765829704','36 Pads',635,'usd','https://www.amazon.com/dp/B003U3SWEA',false),
  -- Source row 128: Nursing Cups, Postpartum Essentials, The Real Silverette, Medium
  ('p-silverette-cups','40049460707433','M / No O Feel',7999,'usd','https://www.amazon.com/dp/B07XGC8RBB',false),
  -- Source row 129: Nursing Cups, Postpartum Essentials, Real Silverette, M O-Feel
  ('p-silverette-cups','40106524704873','M / Add O Feel',9598,'usd','https://www.amazon.com/dp/B0B4H6GXCW',false),
  -- Source row 162: pH-D Feminine Health Boric Acid Foam Wash, Sensitive, 6 Fl Oz, Pack of 1
  ('p-phd-wash','','',897,'usd','https://www.amazon.com/dp/B0FK84ZWXK',false),
  -- Source row 205: OrganiCup Menstrual Cup by AllMatters - Size B - Superior to Pads & Tampons - Voted Best Menstrual Cup by Reviewed - Made in Germany - Soft and Flexible
  ('p-organicup','42702906425556','B',2767,'usd','https://www.amazon.com/dp/B072KZM9P3',false),
  -- Source row 209: Flex Cup Starter Kit (Full Fit - Size 02) | Reusable Menstrual Cup + 2 Free Menstrual Discs | Pull-Tab for Easy Removal | Tampon + Pad Alternative | Lasts up to 10 Years | Capacity
  ('p-flex-cup','39775383126112','Size 02',2849,'usd','https://www.amazon.com/dp/B07QHG6ZY8',false)
on conflict (product_id,variant_id) do nothing;
