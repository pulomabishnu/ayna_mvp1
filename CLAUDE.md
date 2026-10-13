# CLAUDE.md

## PRISM tracing (do not remove)

This project sends traces to PRISM. Env vars: `PRISMTRACE_API_KEY`,
`PRISMTRACE_PROJECT_ID`, `PRISMTRACE_HOST`.

Tracing is currently wired at: `api/_prismTrace.js`, `api/_llm.js` (wraps `callAnthropic` / `callOpenAI` / `callGemini`, so `callWithFallback` is covered too), `api/ask-ayna.js`, `api/product-chat.js`, `api/search-suggestions.js`, `api/discover-products.js`, `api/llm-recommendations.js`, `api/product-insights.js`, `api/sms-webhook.js`, `src/utils/conversationId.js` (`getAppSessionId`: one id per browser tab, sent as `conversationId` in the body by `ProfileChatbot.jsx`, `ProductModal.jsx`, `fetchSearchSuggestions.js`, `fetchLlmRecommendations.js`, `fetchProductInsights.js` so one visit is one PRISM session). Each route passes `trace.messages` (what the user said/did) and `trace.formatOutput` (what the user sees) so PRISM shows the conversation, not the raw prompt and JSON — do the same for any new model call, `.env.example`, `api/_prismTrace.test.js`

**Standing rule.** Whenever you add or change an agent, chain, graph, tool,
retriever, or any entry point that calls a model, wire it to PRISM before you
finish. Unwired code is invisible in the dashboard. If you are unsure whether
something is covered, assume it is not and wire it.

## Catalog content accuracy (health claims)

Product and startup entries (`src/data/*.js`, `supabase/seed/*.sql`) are
health information people act on. An outside reviewer found false FDA claims
in the catalog (2026-10-02: Joylux, Embr, ThermaCare, and Inito were all
labeled "FDA-cleared" when they are not). Rules for adding or editing any entry:

- **Read the source itself, not a search snippet.** For PubMed papers, fetch
  the abstract through NCBI E-utilities (`efetch.fcgi?db=pubmed&id=…&rettype=abstract`);
  PubMed pages block automated fetches. If you can't read a source, don't cite it.
- **Regulatory status comes from the FDA, never from the brand or from memory.**
  Check openFDA (`api.fda.gov/device/510k.json`, `registrationlisting.json`).
  "FDA-registered" or "FDA-listed", "Class I exempt", "general wellness",
  "510(k)-cleared" (give the K-number), and "approved" are different things;
  never round one up to another. If the brand claims a clearance you can't
  find, say "per the brand" and say it wasn't found.
- **State the study's size and design when they limit the finding**: animal
  or cell study, open-label, no control group, n=10, a combination product, a
  leave-on product used to support a rinse-off one. Don't call a result
  significant if the paper doesn't, and don't call an open-label study "controlled".
- **Every link must load.** Don't construct URLs; check each with a request.
- **No unsourced claims.** If a sentence has no source you have read, cut it.
