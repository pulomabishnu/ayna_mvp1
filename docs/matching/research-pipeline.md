# Product research pipeline (P2, Oct 29 2026)

How a product goes from "Checking this product" to a real match. Safety facts
are always read from a source by a person. A model may draft, never decide.

```
 in            product_submissions (someone added a product ayna doesn't have, source 'ecosystem_add')
               catalog products with holds (npm run research:plan)
               product_review_queue (needs_clinician_review, recheck due)
   │
   ▼
 plan          npm run research:plan  → which missing facts hold back the most matches
   │
   ▼
 research      the team, per fact, from the best source (schema.js SOURCE_TYPES order):
               label > brand page > FDA / openFDA > guidance > research > retailer
               /admin/research may draft page sections with Claude + web search
               (api/research-product.js); drafts are never shown until approved
   │
   ▼
 passport      the fact goes into the product passport with source, URL and date
               (src/data/passport/reviews/*). "Brand doesn't publish it" is
               recorded as status 'unavailable' (shows "Brand doesn't share this")
   │
   ▼
 review        product_review_queue: needs_clinician_review → assigned → in_review
               → approved / needs_correction (staff only; PostHog product_review_*
               events carry the product id and status only)
   │
   ▼
 live          the engine reads the passport on the next build: the hold lifts by
               itself for everyone it applied to. No code change per product.
```

## What blocks a match today (Oct 29, panel of 7 sensitive personas)

`npm run research:plan` lists 165 products with at least one missing safety
fact that holds a match back for someone. The most common missing facts:
allergen information, medicine-interaction review (swallowed and hormone-active
products), and pregnancy or breastfeeding safety. Work the list top down.

## Rules (from CLAUDE.md, unchanged)

- Read the source itself; PubMed through NCBI E-utilities.
- Regulatory status from openFDA only; never round "registered" up to "cleared".
- State study size and design when they limit the finding.
- Every link must load.
- Team-written copy is locked; research goes next to it, labelled as ayna's check.
