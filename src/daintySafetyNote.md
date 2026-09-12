# Dainty redesign safety boundary

This redesign changes presentation only around existing Ayna behavior. It intentionally does not replace Supabase authentication, user/account identifiers, persistence stores, API routes, health-intake save logic, analytics/privacy logic, legal pages, or account deletion behavior.

Critical existing flows to preserve before merge:
- email/password, Google, and phone authentication
- health-intake persistence and existing user ecosystem data
- Browse/product routing and saved products
- Privacy Policy, Consumer Health Data Privacy, Terms, and Privacy Preferences
- Ask Ayna and existing API-backed product/recommendation flows
