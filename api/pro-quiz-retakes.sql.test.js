import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../supabase/migrations/20261027014500_pro_quiz_retakes.sql', import.meta.url),
  'utf8'
);
const canonical = readFileSync(
  new URL('../supabase/user_ecosystem_builds.sql', import.meta.url),
  'utf8'
);

describe('personalization retake migration', () => {
  it('preserves the pre-rollout lifetime quota until Pro feature rules are enabled', () => {
    expect(migration).toContain('if not coalesce(v_rules_enabled, false) then');
    expect(migration).toContain('Applying the migration alone must not change product');
  });

  it('marks one historical build per user as the initial personalization', () => {
    expect(migration).toContain('row_number() over (partition by user_id order by created_at, build_id) as rn');
    expect(migration).toContain('set is_initial = (r.rn = 1)');
  });

  it('uses a UTC Monday-Sunday weekly window for Free retakes once rollout is enabled', () => {
    expect(migration).toContain("date_trunc('week', now() at time zone 'UTC')");
    expect(migration).toContain('and b.is_initial = false');
    expect(migration).toContain('and b.created_at >= v_week_start');
  });

  it('keeps retries idempotent and lets active Pro bypass the weekly cap', () => {
    expect(migration).toContain('public.pro_access_status(p_user_id)');
    expect(migration).toMatch(/where b\.user_id = p_user_id and b\.build_id = p_build_id/);
    expect(migration).toContain('return query select true, 0;');
  });

  it('keeps the canonical schema aligned with initial-vs-retake accounting', () => {
    expect(canonical).toContain('is_initial boolean not null default false');
    expect(canonical).toContain('user_ecosystem_builds_weekly_retakes_idx');
    expect(canonical).toContain('Re-presenting the same build_id is always free');
  });
});
