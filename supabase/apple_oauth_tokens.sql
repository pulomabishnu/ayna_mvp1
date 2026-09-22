-- Secure server-only storage for Sign in with Apple refresh tokens.
--
-- The browser/mobile client never reads or writes this table directly. The
-- service-role API exchanges Apple's one-time authorization code, encrypts the
-- returned refresh token with APPLE_TOKEN_ENCRYPTION_KEY (AES-256-GCM), and
-- stores only ciphertext + IV + authentication tag here so account deletion can
-- revoke the Apple authorization before deleting the ayna account.

create table if not exists public.apple_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_refresh_token text not null,
  encryption_iv text not null,
  encryption_tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.apple_oauth_tokens enable row level security;

-- No authenticated/anonymous policies are intentionally created. Only the
-- server-side Supabase service role may access this credential store.
revoke all on table public.apple_oauth_tokens from anon, authenticated;

grant all on table public.apple_oauth_tokens to service_role;

comment on table public.apple_oauth_tokens is
  'Server-only encrypted Sign in with Apple refresh tokens used solely for Apple authorization revocation during account deletion.';
