function dailyLimitAnswer(limit) {
  if (Number(limit) >= 50) {
    return 'You’ve reached today’s 50-chat ayna Pro limit. It resets tomorrow.';
  }
  return 'You’ve reached today’s 5 free Ask ayna chats. Free chats reset tomorrow. ayna Pro Early Access includes up to 50 Ask ayna chats a day.';
}

/**
 * Older clients still translate every HTTP 429 into the legacy weekly-limit
 * copy. During the Pro rollout only, turn the new daily quota into a normal
 * assistant response so every existing web/app chat surface shows the correct
 * reset period without changing the rollout-off behavior.
 */
export function quotaAwareResponse(res, { askAyna = false } = {}) {
  let statusCode = 200;
  const wrapped = {
    setHeader: (...args) => res.setHeader(...args),
    getHeader: (...args) => res.getHeader?.(...args),
    status(code) { statusCode = code; return wrapped; },
    json(body) {
      if (statusCode === 429 && body?.error === 'daily_limit_reached') {
        const limit = Number(body.limit) || 5;
        const payload = {
          answer: dailyLimitAnswer(limit),
          limitReached: true,
          usage: { used: Number(body.used) || limit, limit },
        };
        if (askAyna) {
          payload.profileUpdate = { frustrations: [], sensitivities: [], productsToAvoid: [], preference: null };
          payload.browseIntent = null;
        }
        return res.status(200).json(payload);
      }
      return res.status(statusCode).json(body);
    },
    end: (...args) => res.status(statusCode).end(...args),
  };
  return wrapped;
}
