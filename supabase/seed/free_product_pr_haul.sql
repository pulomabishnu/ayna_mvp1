-- PR haul reward pool for the free product campaign (49 products, 52 units).
-- Source: the ayna_pr_haul Google Sheet (photos and links are the sheet's own).
-- Reward-only items: they are not added to product_catalog, never show in Shop,
-- and carry no health or efficacy claims (name, brand, size, photo, link only).
--
-- Run after supabase/migrations/20261015120000_free_product_campaign.sql.
-- Safe to re-run: units are updated, already-claimed counts are kept, and the
-- database refuses a total below what has already been claimed.
-- Esther Formula 'Strips': the box doesn't name the variant yet (sheet says verify).
-- SKINN Tricholab: no photo found; links to an HSN search until we have the product page.
-- Still to identify (not added yet): Cooyan (silver box), 'Rouge Essence' eau de parfum, pink box
-- (possibly red wine skincare), pink patterned cylinder, orange 'Brightening
-- Vitamin C Serum' box, small bottle with blue label, green box with LED display.

with items (name, brand, size, category, image_url, product_url, units) as (
  values
  ('Moisturizing Barrier Cream', 'Kieró', '1.76 oz (50 g)', 'skincare', 'https://m.media-amazon.com/images/I/41vDShxlGZL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMRCRBP', 2),
  ('Refining Enzyme Cleanser', 'Kieró', '1.76 oz (50 g)', 'skincare', 'https://m.media-amazon.com/images/I/41E-3zetegL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMDSSY6', 1),
  ('Prime Sun Gel SPF 40', 'Kieró', '1.69 fl oz (50 ml)', 'sun care', 'https://m.media-amazon.com/images/I/51WPZ68tY9L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0HBVTHQDG', 1),
  ('Airy Sun Stick SPF 50', 'Kieró', '0.7 oz (20 g)', 'sun care', 'https://m.media-amazon.com/images/I/510gehXK8sL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0HBVSP2QH', 1),
  ('Pure Radiant Eye Cream', 'Kieró', '0.85 fl oz (25 ml)', 'skincare', 'https://m.media-amazon.com/images/I/41GVGotHmbL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMQZRF3', 1),
  ('Balance Toner Pads', 'Kieró', '60 pads / 6.26 fl oz', 'skincare', 'https://m.media-amazon.com/images/I/61+AE4eQd+L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRM64YB5', 2),
  ('Comfort Cleansing Balm', 'Kieró', '2.82 oz (80 g)', 'skincare', 'https://m.media-amazon.com/images/I/41r+dQ7-SPL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMXWM2M', 1),
  ('Mighty Patch Original', 'Hero Cosmetics', '36 patches', 'skincare', 'https://m.media-amazon.com/images/I/61p+1+md+8L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B074PVTPBW', 1),
  ('Pimple Correct Acne Clearing Gel Pen', 'Hero Cosmetics', '0.34 fl oz (10 ml)', 'skincare', 'https://m.media-amazon.com/images/I/61Le1S+bw0L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0G2DTH1GQ', 1),
  ('Mighty Cleanser', 'Hero Cosmetics', '5.07 fl oz (150 ml)', 'skincare', 'https://m.media-amazon.com/images/I/6140V0SQHdL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0H1NP4L26', 1),
  ('SPF 30 Mineral Sunscreen Facial Serum', 'TruSkin', '1 fl oz (30 ml)', 'sun care', 'https://m.media-amazon.com/images/I/61s72NcqCgL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0DX4M3GDJ', 1),
  ('Vitamin C Facial Serum', 'TruSkin', '1 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/61kOfe19nbL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B01EKUBU5Y', 1),
  ('Très Sleek Grande Titanium Wide Plate Flat Iron', 'FoxyBae', '1.75" plates', 'hair', 'https://cdn.shopify.com/s/files/1/1518/3834/files/FOX_WhiteRainbow_1_1c62b234-ad94-4e51-97e3-c2b10269bb64.jpg?v=1784571584', 'https://www.foxybae.com/products/rose-gold-titanium-1-75-wide-plate-flat-iron?variant=51121030889508', 1),
  ('Glycolic Acid Facial Polish Pads', 'Marée', '50 pads', 'skincare', 'https://m.media-amazon.com/images/I/81PMttir3EL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FNRS2FB7', 1),
  ('Retino Tightening HPR Retinoid Ampoule', 'Dr.Oracle', '1 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/51VZtJFLGaL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0CQMR3QBS', 1),
  ('Cyperus Rotundus Oil', 'Caramela Beauty', '2 fl oz (60 ml)', 'body', 'https://m.media-amazon.com/images/I/71X1UFEVRjL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0DRF1FYB6', 1),
  ('Vegan Kombucha Tea Essence', 'Dr.Ceuracle', '5.07 fl oz (150 ml)', 'skincare', 'https://m.media-amazon.com/images/I/61UHsNDRDBL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B08Y5XGM3Z', 1),
  ('Even Clearer Max Complexion Correction Pads', 'Peter Thomas Roth', '60 pads', 'skincare', 'https://cdn.shopify.com/s/files/1/0852/5650/3608/files/01_21-11-512_EvenClearer_Max_Pads_Closed_NoRef_300dpi_GREY_2000x2000_e8d38d5e-3b5c-4557-879a-d6d13953c022.jpg?width=500', 'https://www.peterthomasroth.com/products/goodbye-acne-max-complexion-correction-pads-2111512', 1),
  ('Aloe Vera Gel', 'Aloderma', '10.6 oz (300 g)', 'skincare', 'https://m.media-amazon.com/images/I/81V93GE4I0L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B097CGDN7J', 1),
  ('Redness Corrector', 'Kind Science', '1.7 fl oz (50 ml)', 'skincare', 'https://m.media-amazon.com/images/I/71ByaOx+SHL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0HFTXFM26', 1),
  ('COOL DOWN Slushy Spray', 'glowbeast', '1.69 fl oz (50 ml)', 'skincare', 'https://m.media-amazon.com/images/I/719jkB8BPGL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0H5QFQNWM', 1),
  ('Strawberry Blossoms Smoothing Body Scrub', 'Truly', null, 'body', 'https://cdn.shopify.com/s/files/1/0053/4462/4675/files/StrawberryBlossoms_ExfoliatingBodyScrub_pink_V4.jpg?width=500', 'https://www.trulybeauty.com/products/strawberry-blossoms-exfoliating-body-scrub', 1),
  ('CELLMAZING Firming Eye Cream', 'Torriden', '1.01 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/51Mm3s4GocL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0D2WQSDM9', 1),
  ('CELLMAZING Brightening Spot Toning Pad', 'Torriden', '70 pads / 5.91 fl oz (175 ml)', 'skincare', 'https://m.media-amazon.com/images/I/51RDLR6ETXL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FMWJXF6M', 1),
  ('DIVE-IN Hyaluronic Acid Serum', 'Torriden', '1.69 fl oz (50 ml)', 'skincare', 'https://m.media-amazon.com/images/I/71RK1J45GYL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B097PG84S9', 1),
  ('CELLMAZING Brightening Ampoule', 'Torriden', '1.01 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/51qhFTL02VL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0CQYBCZW5', 1),
  ('Jeju Matcha Tea Essence', 'Dr.Ceuracle', '5.07 fl oz (150 ml)', 'skincare', 'https://m.media-amazon.com/images/I/51T-11YiKCL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0G4QV7QVV', 1),
  ('Multi-Active Exosome Serum', 'Naturium', '1 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/614T9R--F3L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0HB55VX42', 1),
  ('Glutathione 7 Dark Spot Serum', 'manyo', '1.01 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/61aYjktnM9L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0GGH9DCKK', 1),
  ('Collagen Skin Lift Gummies', 'UPSA x Nourished', '30 gummies', 'supplement', 'https://m.media-amazon.com/images/I/71-p1fIYtiL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0GFGG7WN9', 1),
  ('Good Down There Vaginal Health Probiotic', 'The Good Bug', '1.06 oz (30 g)', 'supplement', 'https://cdn.shopify.com/s/files/1/0657/8225/1745/products/GoodDownThere_3.jpg?width=500', 'https://thegoodbug.com/products/good-down-there-for-vaginal-health', 1),
  ('MB-1 Metabolism Support', 'Arrae', '40 capsules', 'supplement', 'https://m.media-amazon.com/images/I/51cUawzhbWL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FZV4LDX2', 1),
  ('Tropic Lush Body Mist', 'The Crème Shop', '3.38 fl oz (100 ml)', 'fragrance', 'https://cdn.shopify.com/s/files/1/0930/8720/files/584514659_01.png?width=500', 'https://www.thecremeshop.com/products/tropic-lush-body-mist', 1),
  ('Cloud Kiss Body Mist', 'The Crème Shop', '3.38 fl oz (100 ml)', 'fragrance', 'https://m.media-amazon.com/images/I/61lr+qlMK3L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0GYTFS8C8', 1),
  ('Women''s 13-in-1 Supplement Gummies', 'CBB (Curvy Body Bears)', '60 gummies', 'supplement', 'https://m.media-amazon.com/images/I/51slr4TLhVL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0BWSMCMTZ', 1),
  ('Perfect PH Vaginal Probiotic Gummies', 'CBB (Curvy Body Bears)', '60 gummies', 'supplement', 'https://m.media-amazon.com/images/I/41qCKV-R2gL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0F7QXCGR5', 1),
  ('Strips', 'Esther Formula', '15 strips', 'supplement', 'https://m.media-amazon.com/images/I/51q39aFdEdL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FQN7VN4R', 1),
  ('Propolis Immune Support Throat Spray', 'Beekeeper''s Naturals', '1 fl oz (30 ml)', 'wellness', 'https://m.media-amazon.com/images/I/61cJqeCuw4L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B082QPJNG7', 2),
  ('Expanding Floss, Mint Eucalyptus', 'Burst', '40 yards', 'oral care', 'https://m.media-amazon.com/images/I/819+QRsQExL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0CQD8J54W', 1),
  ('Tricholab Amplifying Root Ritual Scalp Serum', 'SKINN by Dimitri James', null, 'hair', null, 'https://www.hsn.com/search?query=skinn%20tricholab', 1),
  ('Dry Shampoo Volume Paste', 'Eleven Australia', null, 'hair', 'https://m.media-amazon.com/images/I/71MGytFevvL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0CSGK5FZN', 1),
  ('Sea Salt Therapy Scalp Scaler', 'GROWUS', '8.8 oz (250 g)', 'hair', 'https://m.media-amazon.com/images/I/31e-kFd6dDL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FTG78VB4', 1),
  ('Boost Therapy Tripeptide Hair Density Serum', 'Coco & Eve', '2.03 fl oz (60 ml)', 'hair', 'https://m.media-amazon.com/images/I/51xmpBxUvcL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0DF2G14KF', 1),
  ('Scalp Serum+', 'BIGVITA', null, 'hair', 'https://m.media-amazon.com/images/I/51O7+TsgxZL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0D82212P3', 1),
  ('Hair Recovery Effector Plus Spot & Edge Concentrate', 'Refilled', '0.5 fl oz (15 ml)', 'hair', 'https://m.media-amazon.com/images/I/61AgTzHlPLL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0GMRT3ZLD', 1),
  ('The Gloss Shine Reviving Treatment', 'Overtone', '4 fl oz', 'hair', 'https://m.media-amazon.com/images/I/519LHuQXDeL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FBY9VW2W', 1),
  ('Follicle Drops Pre-Shampoo Scalp Oil', 'Najeau', '1.7 fl oz (50 ml)', 'hair', 'https://m.media-amazon.com/images/I/512842JgyVL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FM1JK11M', 1),
  ('Miracle Hair Treatment Spray', 'Eleven Australia', '4.2 fl oz (125 ml)', 'hair', 'https://m.media-amazon.com/images/I/61znTuF0FnL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B07XD66S4J', 1),
  ('Longevity Shots NAD+', 'Happy Aging', '10 x 1.7 fl oz (50 ml)', 'supplement', 'https://m.media-amazon.com/images/I/815f4MkEgZL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0DK3YYTCX', 1)
),
updated as (
  update public.reward_products rp
     set size = i.size, category = i.category, image_url = i.image_url, product_url = i.product_url,
         inventory_total = greatest(i.units, rp.inventory_claimed), updated_at = now()
    from items i
   where rp.campaign_id = 'free-product-2026' and rp.product_id is null
     and lower(rp.brand) = lower(i.brand) and lower(rp.name) = lower(i.name)
  returning rp.id
)
insert into public.reward_products (campaign_id, name, brand, size, category, image_url, product_url, inventory_total)
select 'free-product-2026', i.name, i.brand, i.size, i.category, i.image_url, i.product_url, i.units
from items i
where not exists (
  select 1 from public.reward_products rp
  where rp.campaign_id = 'free-product-2026' and rp.product_id is null
    and lower(rp.brand) = lower(i.brand) and lower(rp.name) = lower(i.name)
);

select count(*) as products, sum(inventory_total) as units
from public.reward_products where campaign_id = 'free-product-2026' and product_id is null;
