# Checklist (source of truth for audit.mjs)

## Site files
- robots.txt — explicit Allow for search + AI crawlers (see references/robots.txt.template), `Disallow: /api/`, `Sitemap:` line. While DRAFT=True: `Disallow: /` is DRAFT-EXPECTED.
- llms.txt — at root; H1 company name, blockquote summary, sections linking key pages (references/llms.txt.template).
- sitemap.xml — every published, indexable page (absolute canonical URLs, no 404/noindex).
- Favicon — real files: `/favicon.ico` or `.svg`, `apple-touch-icon.png` (180px), linked in `<head>`.
- 404 — branded "ALOps - Error 404", links back to home/key pages, **HTTP status 404** (never a redirect to `/`; that is a soft 404).

## Every indexable page
- `<title>`: `ALOps - Page Name`, ≤70 chars, unique. Home: `ALOps - Business Transformation, Starting with AI`.
- meta description ≤155 chars, unique.
- meta keywords present (about the page). meta author `ALOps Team`. `<html lang="en">`.
- canonical absolute, https, matches og:url, consistent host + trailing slash.
- Thumbnail: og:image + twitter:image, absolute URL, JPG/PNG 1200×630 (not webp), `twitter:card=summary_large_image`.
- Exactly one H1; headings do not skip levels (H1→H2→H3).
- JSON-LD parses; required props per @type (Organization name/url/logo; WebSite name/url; BreadcrumbList itemListElement with position/name/item; Article headline/author/datePublished; FAQPage only with visible Q&A); content matches visible page.
- Images: filename `alops-<descriptive-name>.<ext>` kebab-case; non-empty natural alt (≤~125 chars preferred); width+height set; below-fold `loading=lazy`; hero eager.

## Performance (lab, throttled mobile)
LCP ≤2.5 s · INP ≤200 ms (proxy: interaction latency) · CLS ≤0.1.

## Crawler access
- `_headers` has no blanket `X-Robots-Tag: noindex` at launch.
- `worker/index.js` bot filter must not 403 verified search/AI crawlers listed in the robots allow-list; Turnstile/rate limit must exempt them.
- MANUAL (Cloudflare dashboard): AI Crawl Control / "Block AI bots" off, managed robots.txt not overriding, Bot Fight Mode / WAF rules not challenging allowed bots.

## Launch (manual flip, only when user approves)
Set `DRAFT=False` in build.py; flip AI_CRAWLERS from Disallow to Allow; remove noindex `X-Robots-Tag` in `_headers` and Worker; **remove the AI crawler user-agents (gptbot, claudebot, oai-searchbot, chatgpt-user, perplexitybot …) from the Worker 403 block list in `worker/index.js` — this, not robots.txt, is what actually stops ChatGPT/Claude;** enable custom-domain routes in `wrangler.jsonc`; enforce HTTP→HTTPS + www/non-www + trailing slash at Cloudflare; run `audit.mjs --dist --launch`; then PageSpeed Insights, validator.schema.org and Rich Results Test on the live URL.
