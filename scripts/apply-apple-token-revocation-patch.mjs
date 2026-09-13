import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }

// After native Sign in with Apple succeeds through Supabase, relay Apple's
// single-use authorization code to our authenticated server endpoint. The
// refresh token returned by Apple never reaches localStorage or the app; the
// server encrypts it for account-deletion revocation.
{
  const path = 'src/mobile/hooks/useSupabaseAuth.js';
  let text = read(path);
  const marker = 'apple-token secure capture';
  if (!text.includes(marker)) {
    const anchor = `    if (error) throw error;

    // Apple only supplies name on the first authorization.`;
    if (!text.includes(anchor)) throw new Error('Missing Apple post-auth anchor');
    const replacement = `    if (error) throw error;

    // apple-token secure capture: Apple's authorization code is single-use.
    // Relay it immediately to the authenticated server so the resulting
    // refresh token can be encrypted server-side for future account deletion.
    if (result.authorizationCode) {
      try {
        const accessToken = data?.session?.access_token;
        if (accessToken) {
          const tokenStoreResponse = await fetch('/api/apple-token', {
            method: 'POST',
            headers: {
              Authorization: \`Bearer \${accessToken}\`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ authorizationCode: result.authorizationCode }),
          });
          if (!tokenStoreResponse.ok) {
            console.warn('[Ayna] Apple revocation-token capture is not configured on the server yet.');
          }
        }
      } catch {
        // Authentication itself succeeded. Never strand the user because a
        // revocation-token setup step is temporarily unavailable.
        console.warn('[Ayna] Apple revocation-token capture could not complete.');
      }
    }

    // Apple only supplies name on the first authorization.`;
    text = text.replace(anchor, replacement);
    write(path, text);
  }
}

// Document only variable names and safe setup expectations. Real Apple keys
// and the encryption key belong in the server environment, never in git.
{
  const path = '.env.example';
  let text = read(path);
  if (!text.includes('APPLE_TOKEN_ENCRYPTION_KEY=')) {
    const anchor = `SUPABASE_SERVICE_ROLE_KEY=\n`;
    if (!text.includes(anchor)) throw new Error('Missing .env Supabase server anchor');
    text = text.replace(anchor, `${anchor}\n# Sign in with Apple server credentials. Required to exchange Apple's one-time\n# authorization code for a refresh token and revoke that authorization when\n# the user deletes their ayna account. Never expose these as VITE_ variables.\n# APPLE_CLIENT_ID defaults to the native bundle ID co.aynahealth.app if blank.\nAPPLE_CLIENT_ID=\nAPPLE_TEAM_ID=\nAPPLE_KEY_ID=\n# Contents of the Apple .p8 private key. In a single-line env value, use \\n.\nAPPLE_PRIVATE_KEY=\n# Exactly 32 random bytes, base64 or 64-char hex. Example generation:\n#   openssl rand -base64 32\nAPPLE_TOKEN_ENCRYPTION_KEY=\n`);
    write(path, text);
  }
}

console.log('Apple revocation-token client wiring applied.');
