import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (f) => readFileSync(new URL(`../../supabase/${f}`, import.meta.url), 'utf8');
const sql = read('community_topic_privacy_2026-10-25.sql');
const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
const check = read('community_topic_privacy_2026-10-25_CHECK_READ_ONLY.sql').split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
  .replace(/'[^']*'/g, "''"); // labels and names, not statements

describe('community topic privacy migration', () => {
  it('never deletes rows or drops anything, and is safe to re-run', () => {
    expect(code).not.toMatch(/\bdelete\s+from\b|\bdrop\s+(table|column|view|function|trigger|policy)\b|\btruncate\b/i);
    expect(code).toMatch(/add column if not exists hidden_at timestamptz/);
    expect(code).toMatch(/create index if not exists community_posts_hidden_idx/);
    expect(code).toMatch(/create or replace trigger community_topics_hide_private_posts\s+before delete on public\.community_topics/);
    expect(code).toMatch(/if def !~\* 'hidden_at'/);
    expect(code).toMatch(/if not exists \(select 1 from pg_policies/);
  });
  it('a deleted non-public topic hides its posts instead of making them public', () => {
    const fn = code.slice(code.indexOf('function public.community_topics_hide_private_posts'), code.indexOf('create or replace trigger'));
    expect(fn).toMatch(/old\.visibility <> 'public' or old\.status <> 'visible'/);
    expect(fn).toMatch(/set hidden_at = coalesce\(p\.hidden_at, now\(\)\)\s+where p\.topic_id = old\.id/);
    expect(fn).toMatch(/return old;/);
  });
  it('removing a post from a non-public topic hides it; only a visible public topic sends it back to the feed', () => {
    const fn = code.slice(code.indexOf('function public.community_remove_post_from_topic'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    expect(body).toMatch(/if vis = 'public' and st = 'visible' then\s+update public\.community_posts set topic_id = null where id = pid;\s+else\s+update public\.community_posts set hidden_at/);
  });
  it('feed views and direct reads leave hidden posts out for everyone but the author', () => {
    expect(code).toMatch(/AND \(p\.hidden_at IS NULL OR p\.author_id = auth\.uid\(\)\)/);
    expect(code).toMatch(/AND \(p\.hidden_at IS NULL OR c\.author_id = auth\.uid\(\)\)/);
    expect(code).toMatch(/as restrictive for select\s+using \(hidden_at is null or author_id = auth\.uid\(\)\)/);
  });
  it('the check file only reads', () => {
    expect(check).not.toMatch(/\b(insert|update|delete|alter|create|drop|grant|truncate)\b/i);
  });
});
