/** Keep daily quotas, older weekly quotas and burst throttles distinct. */
export function askLimitError(code) {
  const message = code === 'daily_limit_reached' ? 'You’ve reached your daily Ask ayna allowance. It resets at midnight UTC.'
    : code === 'weekly_limit_reached' ? 'You’ve reached your weekly Ask ayna allowance.'
      : 'Please wait a moment before asking again.';
  return Object.assign(new Error(message), { code: 'ask_limit_reached' });
}
