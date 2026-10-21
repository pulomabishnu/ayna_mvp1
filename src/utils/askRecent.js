/** Her last few questions, newest first, without repeats. */
export function recentQuestions(messages = [], limit = 4) {
  const out = [];
  for (let i = messages.length - 1; i >= 0 && out.length < limit; i -= 1) {
    const m = messages[i];
    if (m?.role === 'user' && typeof m.text === 'string' && m.text.trim() && !out.includes(m.text.trim())) out.push(m.text.trim());
  }
  return out;
}
