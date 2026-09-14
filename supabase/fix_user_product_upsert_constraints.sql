-- Production compatibility migration for hosted tables that predate the
-- version-controlled table definitions in user_ecosystems.sql/user_reviews.sql.
--
-- Both clients use Supabase upsert(..., { onConflict: 'user_id,product_id' }).
-- PostgreSQL requires a matching UNIQUE/PRIMARY KEY constraint for that form of
-- ON CONFLICT. Older hosted versions of these tables used a surrogate `id`
-- primary key, so add the composite uniqueness without replacing that primary
-- key or deleting existing rows.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.user_ecosystems'::regclass
      AND c.contype IN ('p', 'u')
      AND (
        SELECT array_agg(a.attname ORDER BY a.attname)
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = k.attnum
      ) = ARRAY['product_id', 'user_id']::name[]
  ) THEN
    ALTER TABLE public.user_ecosystems
      ADD CONSTRAINT user_ecosystems_user_product_key UNIQUE (user_id, product_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.user_reviews'::regclass
      AND c.contype IN ('p', 'u')
      AND (
        SELECT array_agg(a.attname ORDER BY a.attname)
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = k.attnum
      ) = ARRAY['product_id', 'user_id']::name[]
  ) THEN
    ALTER TABLE public.user_reviews
      ADD CONSTRAINT user_reviews_user_product_key UNIQUE (user_id, product_id);
  END IF;
END $$;
