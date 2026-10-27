/** Keep daily quotas, older weekly quotas and burst throttles distinct. */
export function askLimitError(code) {
  const message = code === 'daily_limit_reached' ? 'You’ve reached today’s Ask ayna limit. Free accounts get 5 chats a day, and ayna Pro includes up to 50 a day.'
    : code === 'weekly_limit_reached' ? 'You’ve reached your Ask ayna allowance. ayna Pro includes a higher daily limit.'
      : 'Please wait a moment before asking again.';
  return Object.assign(new Error(message), { code: 'ask_limit_reached' });
}
