# Contact form to Google Sheets

An Apps Script web app that receives form submissions from the Cloudflare Worker and appends them to a Google Sheet.

## Setup

1. Create a new Google Sheet.
2. Open Extensions, then Apps Script, and paste the contents of `Code.gs` over the default file.
3. Open Project Settings, then Script properties, and add `SECRET`. Generate the value with:
   ```
   openssl rand -hex 32
   ```
   Optionally add `SHEET_ID` if the script is not bound to the sheet.
4. Choose Deploy, then New deployment, then Web app. Set Execute as to Me and Who has access to Anyone, then authorize when prompted.
5. Copy the web app URL ending in `/exec`.
6. From the repo root, store both values as Worker secrets:
   ```
   npx wrangler secret put SHEETS_WEBHOOK_URL   # the /exec URL
   npx wrangler secret put SHEETS_SECRET        # the same value as SECRET
   ```
   For local development, put the same two variables in `.dev.vars`.
7. Test with curl. The `-L` flag is needed because Apps Script answers with a 302 redirect:
   ```
   curl -L -X POST "$EXEC_URL" \
     -H "Content-Type: application/json" \
     -d '{"secret":"YOUR_SECRET","form":"move","submitted_at":"2026-01-01T00:00:00Z","mv-email":"test@example.com"}'
   ```
   Expect `{"ok":true}`. A wrong secret returns `{"ok":false,"error":"unauthorized"}`.

## Redeploying after edits

Saving the script does not update the live web app. Open Deploy, then Manage deployments, edit the existing deployment, and choose New version. The URL stays the same. Creating a new deployment instead gives a new URL.

## Tabs

- `Contact`: the move form. Columns: submitted_at, form, mv-email, mv-org, mv-role, mv-priority, mv-region, mv-move, mv-help, mv-notes, mv-updates, mv-readiness-id, page, country. `mv-readiness-id` matches `rd-id` in the `Readiness` tab.
- `Documentation requests`: the docs form. Columns: submitted_at, form, docs-email, docs-org, docs-role, docs-deploy, docs-areas, docs-notes, page, country.
- `Readiness`: saved when someone clicks "Discuss your result". Columns: submitted_at, form, rd-id (random UUID), rd-score, rd-band, rd-areas, rd-selected (full text of each ticked statement, grouped by area), rd-answers (Y/N per statement), page, country. No personal data.

Tabs are created on the first submission. Any new field the form sends is added as an extra column on the right.

## Data handling

The sheet holds personal data (email addresses, names of organisations and roles). Share it with as few people as possible and review access regularly. Rotate `SECRET` in both the script properties and the Worker secret if it is ever exposed.
