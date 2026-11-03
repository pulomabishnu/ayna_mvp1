-- Nov 2 (Ameera): Cora Overnight Pads is the same product as Cora Organic Pads
-- (its options include Overnight and Extra Heavy Overnight). Hidden, never
-- deleted: the row stays, is_active = false. Idempotent: safe to re-run.
update public.product_catalog set is_active = false where id = 'p-cora-overnight';
select id, name, is_active from public.product_catalog where id in ('p-cora-overnight', 'p-cora-organic-pads');
