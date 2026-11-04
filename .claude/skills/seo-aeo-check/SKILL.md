---
name: seo-aeo-check
description: Audit and fix SEO (Google, Bing) and AEO (ChatGPT, Claude, Perplexity answer-engine) readiness of the AL Ops website. Checks robots.txt, llms.txt, sitemap.xml, favicon, per-page title/description/keywords/author/lang/canonical/thumbnail, JSON-LD schema, headings, image names and alt text, 404 behaviour, crawler access (headers, Worker bot filter, CDN) and Core Web Vitals. Use when asked for an "SEO check", "AEO check", launch-readiness review, or to review robots/llms.txt/sitemap/schema/meta tags. Not for copywriting or keyword research.
---

# SEO / AEO check — AL Ops site

Rules live in `checklist.md`. Read it first.

## Workflow
1. **Build** current output: `npm run build` (writes `transformation/`). For what actually ships, also run `npm run build:prod` (writes `dist/`) and add `--dist`.
2. **Audit**: `node .claude/skills/seo-aeo-check/scripts/audit.mjs [--dist] [--launch]`
   - Default is *draft mode*: noindex, `Disallow: /`, blocked AI crawlers are reported as `DRAFT-EXPECTED` (build.py `DRAFT=True`), not failures.
   - `--launch` treats those as FAIL. Run it before flipping `DRAFT`.
   - Output groups: FAIL / DRAFT-EXPECTED / MANUAL / PASS.
3. **Vitals** (optional): `node .claude/skills/seo-aeo-check/scripts/vitals.mjs [--dist]` — throttled mobile lab run of LCP / INP-proxy / CLS. Lab data, not field CWV.
4. **Fix** — only in the source, never in generated HTML:
   - `transformation/build.py` (`page()`, `ILLUS`, `AI_CRAWLERS`, robots/sitemap emission, add `llms.txt`)
   - `transformation/_headers`, `worker/index.js` (bot filter blocks AI UAs with 403), `wrangler.jsonc`
   - JSON-LD scripts are skipped by `scripts/harden.mjs` CSP hashing, so schema edits need no `_headers` hash change; other inline scripts do.
5. **Rebuild + re-audit** until FAIL is empty. Report each checklist item as pass / fail / manual.
6. **Do not flip `DRAFT` or deploy unasked.** List the launch-flip steps in `checklist.md` § Launch instead.

## Report format
Short table per group, then a prioritised fix list. Always end with the MANUAL items (live-URL checks: HTTP→HTTPS, www, PageSpeed Insights, Rich Results Test, Cloudflare AI-crawler settings).
