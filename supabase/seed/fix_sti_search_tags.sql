-- Searching "sti" returned zero results even though Wisp and Planned
-- Parenthood Direct genuinely offer STI care — "STI" only appeared in their
-- prose summary, not in tags/healthFunctions (the identity fields the search
-- scorer weights), so it was rejected as a passing mention, not a real match.
-- Appends to existing tags/health_functions rather than replacing them.
UPDATE product_catalog
SET
  tags = tags || '["sti", "std", "sexual-health"]'::jsonb,
  health_functions = health_functions || '["sti-treatment", "sexual-health"]'::jsonb
WHERE id = 'd-wisp-bc';

UPDATE product_catalog
SET
  tags = tags || '["sti", "std", "sexual-health"]'::jsonb,
  health_functions = health_functions || '["sti-treatment", "sexual-health"]'::jsonb
WHERE id = 'd-ppd';
