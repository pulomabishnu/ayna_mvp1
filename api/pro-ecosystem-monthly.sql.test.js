import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../supabase/migrations/20261027160000_ecosystem_update_monthly.sql', import.meta.url),
  'utf8'
);
const canonical = readFileSync(new URL('../supabase/user_ecosystem_builds.sql', import.meta.url), 'utf8');

describe('monthly ecosystem update migration', () => {
  it('caps Free retakes per UTC calendar month', () => {
    expect(migration).toContain("date_trunc('month', now() at time zone 'UTC')");
    expect(migration).not.toContain("date_trunc('week'");
    expect(migration).toContain('and b.created_at >= v_month_start');
  });
  it('only replaces the function, keeps the pre-rollout lifetime quota and the Pro bypass', () => {
    expect(migration).toContain('create or replace function public.claim_ecosystem_build');
    expect(migration.replace(/--.*$/gm, '')).not.toMatch(/\b(update|delete|drop table|alter table)\b/i);
    expect(migration).toContain('if not coalesce(v_rules_enabled, false) then');
    expect(migration).toContain('public.pro_access_status(p_user_id)');
    expect(migration).toContain('grant execute on function public.claim_ecosystem_build(uuid, text, integer) to service_role');
  });
  it('keeps the canonical schema on the monthly window', () => {
    expect(canonical).toContain("date_trunc('month', now() at time zone 'UTC')");
  });
});
