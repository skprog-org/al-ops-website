---
name: al-ops-website-ci-cd
version: 1.0.0
description: |
  End-to-end change-to-production pipeline for the AL Ops website (repo al-gmc/al-ops-website,
  Cloudflare Worker "al-ops-website" serving al-ops.com): pull, branch, edit build.py, rebuild,
  verify the generated diff, run the responsive suite, commit / merge --no-ff / push, production
  build, wrangler dry-run and deploy, live verification, and reading Worker error logs through
  the Cloudflare MCP. Use when asked to "deploy the website", "ship al-ops-website", "commit, push,
  merge and deploy", "check the Cloudflare/wrangler error logs", or "ci-cd" for al-ops-website.
---

# AL Ops website: CI/CD

Repo: this repository (GitHub `al-gmc/al-ops-website`, branch `main`).
Worker: `al-ops-website` on the team Cloudflare account. Custom domains
`al-ops.com` and `www.al-ops.com` (attached in the dashboard, not in `wrangler.jsonc`).
There is **no** Workers Builds auto-deploy: every deploy is a manual `npx wrangler deploy`.

Each step below lists the command and the failure it has actually hit before.

## 0. Environment gotchas (check first)

- **Network from Node/git:** run `git push/fetch`, `npx wrangler ...`, `npx playwright ...` and
  `npm install` with the sandbox disabled. Inside the sandbox Node fails every connect with
  `EBADF` and git can't reach the keychain (`could not read Username ... Device not configured`).
  Quick probe:
  `node -e "fetch('https://dash.cloudflare.com').then(r=>console.log('ok',r.status)).catch(e=>console.log('fail',e.cause?.code))"`
  If it still fails outside the sandbox, something on the Mac (firewall/VPN) is blocking `node`;
  tell the user, don't keep retrying.
- **GitHub auth:** if push asks for a username, `gh auth status`. Not logged in → ask the user to
  run `! gh auth login` then `! gh auth setup-git`.
- **Wrangler auth:** `npx wrangler whoami`. "Not logged in / could not be refreshed" → ask the
  user to run `! npx wrangler login` (interactive; you cannot do it).
- **`.env`:** must exist at the repo root with `POSTHOG_KEY` and `POSTHOG_HOST` (template:
  `.env.example`; gitignored). `build.py` reads it via `build_env()`. **Without it the build
  silently drops the PostHog meta tag and the cookie-consent banner from every page.** If missing,
  copy the values from the committed `transformation/index.html`
  (`<meta name="posthog" content="phc_..." data-host="...">`) into `.env` before building.

## 1. Sync

```bash
git checkout main && git pull origin main
npm install --no-audit --no-fund        # whenever package.json / lockfile changed
```

## 2. Branch and edit

- Branch per change: `feat/...`, `fix/...`, `chore/...`.
- **All page content, copy, CSS and JS live in `transformation/build.py`.** Never hand-edit the
  generated `transformation/**/index.html`, `sitemap.xml`, `robots.txt`, `llms.txt` — the build
  overwrites them. `_headers` (CSP) is hand-maintained.
- Settings at the top of `build.py`: `SITE_URL` (currently `https://al-ops.com`; drives canonicals,
  OG URLs, JSON-LD, sitemap, robots, llms.txt), `DRAFT`. Keep `transformation/README.md`'s
  settings table in sync when changing them.
- Turnstile allowed hostnames: `TURNSTILE_HOSTNAMES` in `wrangler.jsonc` `vars`. **The deploy
  overwrites the live value with the repo value**, so every domain the Worker serves must be listed
  (al-ops.com, www.al-ops.com, al-ops.ai, www.al-ops.ai, both workers.dev hosts), or the gate
  403s real visitors on the missing domain. Before deploying a vars change, compare with live:
  Cloudflare MCP `GET /accounts/{id}/workers/scripts/al-ops-website/settings` → `bindings`.

## 3. Rebuild and verify the generated diff

```bash
npm run build                      # python3 build.py --no-still → "built 38 pages"
git status --short
```

Verify only the intended lines changed. For a domain/URL change, this proves nothing else moved:

```bash
git diff -U0 -- transformation ':!transformation/build.py' ':!transformation/README.md' \
 | grep '^[-+]' | grep -v '^[-+][-+]' | sed 's/OLD\.domain/X/g; s/NEW\.domain/X/g; s/^[-+]//' \
 | sort | uniq -c | awk '$1%2'      # empty output = only the domain changed
```

Red flag: `name="posthog"` or the `.cc` cookie section disappearing from the diff → `.env` missing
(step 0). Restore with `git checkout -- transformation` (keep build.py), fix `.env`, rebuild.

Spot-check new markup with Python rather than long grep regexes (ugrep hits complexity limits):
`python3 -c "s=open('transformation/contact/index.html').read(); i=s.find('NEEDLE'); print(s[i-160:i+60])"`

## 4. Responsive tests (required before every deploy)

```bash
npx playwright install chromium     # after any Playwright version bump ("Executable doesn't exist")
npx playwright test --reporter=line 2>&1 | grep -E '^\s*[0-9]+ (passed|failed|skipped|flaky)|Error:'
```

~920 tests, ~6 min. Known flake: the `navigation` tests (menu toggle, 44px tap target) at
mobile/tablet sizes sometimes time out under full parallel load. Rerun failures in isolation:
`npx playwright test -g "navigation|contact form|home hero" --reporter=line`.
If they pass alone, and also pass on `main` without the change (`git stash` → rerun →
`git stash pop`), treat it as flake and say so in the report. Anything that fails in isolation
blocks the deploy.

## 5. Commit, merge, push

```bash
git add <specific files>   # build.py + regenerated outputs; never .env, dist/, test-results/
git commit -m "<type>: <summary>

<why>

Co-Authored-By: <attribution line from the session>"
git checkout main
git fetch origin && git log --oneline main..origin/main     # someone else may have pushed
git merge --no-ff -m "Merge branch '<branch>': <summary>" <branch>
git push origin main
```

Push rejected (non-fast-forward): `git fetch`, inspect `git log main..origin/main` and
`git diff --stat main...origin/main` (especially `wrangler.jsonc`, `worker/index.js`,
`build.py`), then `git merge --no-edit origin/main`, re-check anything your change depends on,
push again. Never force-push.

## 6. Production build and deploy

```bash
npm run build:prod          # build + scripts/harden.mjs → "harden OK", copies to dist/
find dist -type f | wc -l   # should equal "Copied N files"; wrangler's count includes dirs
npx wrangler deploy --dry-run          # check bindings, esp. TURNSTILE_HOSTNAMES
npx wrangler deploy --message "<short summary>"
```

Record the `Current Version ID`.

## 7. Verify live

al-ops.com sits behind Super Bot Fight Mode (`definitely_automated: managed_challenge`), so
**curl gets 403 "Just a moment..." from the zone, not from the Worker.** That's expected; real
browsers and verified crawlers (Googlebot, Bingbot) pass. Verify content via workers.dev:

```bash
W=https://al-ops-website.skprog577.workers.dev
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
for p in / /contact/ /sitemap.xml /llms.txt; do printf "%s " $p; curl -s -o /dev/null -w "%{http_code}\n" -A "$UA" -H "Accept: text/html" $W$p; done
curl -s -A "$UA" -H "Accept: text/html" $W/ | grep -oE 'canonical" href="https://[^/"]+'
```

Plus a grep for whatever the change added. `https://al-ops.com/robots.txt` is reachable with curl
and shows the `Sitemap:` line.

## 8. Error logs (Cloudflare MCP)

Use the `cloudflare` plugin MCP (`mcp__plugin_cloudflare_cloudflare__*`; install with
`claude plugin marketplace add cloudflare/skills` + `claude plugin install cloudflare@cloudflare`,
then `/reload-plugins` and OAuth). The old claude.ai "Cloudflare Developer Platform" connector
returns 410 — don't use it. `wrangler tail` only streams new requests.

With `execute`, `POST /accounts/${accountId}/workers/observability/telemetry/query`, `dry: true`,
timeframe last 7 days (retention), filter `$metadata.service eq al-ops-website`:

- errors: add `$metadata.error exists`; `view: "events"` for samples.
- breakdown: `view: "calculations"`, `chartType: "aggregate"`, `ignoreSeries: true`,
  `calculations: [{operator:"count"}]`, `groupBys` on `http.response.status_code` (number),
  `server.address`, `url.path`, `user_agent.original`.
- **429 and 403 are not flagged as errors** — always run an unfiltered status breakdown too.
- detected issues: `GET .../workers/observability/issues`.
- deploy history: `GET .../workers/scripts/al-ops-website/deployments`.

Normal background: scanner 404/405 (`.npmrc`, `.netrc`, `/actuator/env`, `/graphql`), 429 bursts
from scanners hitting the 300 req/60s rate limit, 403 on `/api/*` probes, DigiCert DCV 404s.
Real problems: 5xx, `gate:` log lines, 403s on `POST /api/gate` from real browsers, errors on
`/api/contact`.

## Report back

Commits / merge SHA pushed, test counts (call out flakes), deploy version ID, what was verified
live, and anything left open. Don't claim al-ops.com was verified from curl if it was challenged.

## Open items as of 2026-11-10

- al-ops.ai is not routed to this Worker; if kept, redirect it to al-ops.com.
- Zone `ai_bots_protection: block` contradicts robots.txt allowing answer-engine crawlers (AEO).
- Stale observability issue "gate: TURNSTILE_SECRET ... not configured" (Oct 26) can be resolved.
