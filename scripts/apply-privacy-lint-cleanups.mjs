import fs from 'node:fs';

function update(path, transform) {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(path, after);
}

// These are old, unused AuthGate parameters/state that become blocking only
// because AuthGate is now part of the privacy-critical changed-file lint set.
update('src/components/AuthGate.jsx', (text) => text
  .replace(
    'export default function AuthGate({ isModal = false, onSkip, context, onBeforeOAuthRedirect, redirectTo }) {',
    'export default function AuthGate({ isModal = false, onSkip, context, onBeforeOAuthRedirect }) {'
  )
  .replace("  const [phoneSending, setPhoneSending] = useState(false);\n", '')
);

console.log('Privacy lint cleanups applied.');
