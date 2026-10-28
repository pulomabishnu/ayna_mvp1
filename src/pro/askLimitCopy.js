// One place for what Ask ayna and product chats say when a limit is hit
// (audit, Oct 28). Product chats and Ask share one monthly allowance:
// Free 5 a month, Pro up to 50, reset on the 1st (api/_proFeatures.js).
// The only other 429 is the short burst cap (20 in 10 minutes).
export const ASK_SIGN_IN = 'Sign in to chat with ayna. Free accounts get 5 chats a month.';
export const ASK_MONTHLY_LIMIT = "You've used this month's free chats. They reset on the 1st, or get ayna Pro for up to 50 a month.";
export const ASK_BURST_LIMIT = "That's a lot of questions at once. Try again in a few minutes.";

/** The error code for a 429 from /api/ask-ayna or /api/product-chat. */
export const askLimitCode = (data) => (data?.error === 'rate_limited' ? 'rate_limited' : 'weekly_limit_reached');
