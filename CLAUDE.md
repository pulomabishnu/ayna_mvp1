# CLAUDE.md

## PRISM tracing (do not remove)

This project sends traces to PRISM. Env vars: `PRISMTRACE_API_KEY`,
`PRISMTRACE_PROJECT_ID`, `PRISMTRACE_HOST`.

Tracing is currently wired at: `api/_prismTrace.js`, `api/_llm.js` (wraps `callAnthropic` / `callOpenAI` / `callGemini`, so `callWithFallback` is covered too), `api/ask-ayna.js`, `api/product-chat.js`, `api/search-suggestions.js`, `api/discover-products.js`, `api/llm-recommendations.js`, `api/product-insights.js`, `api/sms-webhook.js`, `src/utils/conversationId.js` (`getAppSessionId`: one id per browser tab, sent as `conversationId` in the body by `ProfileChatbot.jsx`, `ProductModal.jsx`, `fetchSearchSuggestions.js`, `fetchLlmRecommendations.js`, `fetchProductInsights.js` so one visit is one PRISM session). Each route passes `trace.messages` (what the user said/did) and `trace.formatOutput` (what the user sees) so PRISM shows the conversation, not the raw prompt and JSON — do the same for any new model call, `.env.example`, `api/_prismTrace.test.js`

**Standing rule.** Whenever you add or change an agent, chain, graph, tool,
retriever, or any entry point that calls a model, wire it to PRISM before you
finish. Unwired code is invisible in the dashboard. If you are unsure whether
something is covered, assume it is not and wire it.
