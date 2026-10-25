// Cloudflare Worker: static site (via ASSETS) + POST /api/contact -> Google Sheets (Apps Script).

const MAX_BODY = 16 * 1024;

const FIELDS = {
  move: {
    required: 'mv-email',
    long: ['mv-move', 'mv-help', 'mv-notes'],
    short: ['mv-email', 'mv-org', 'mv-role', 'mv-priority', 'mv-region', 'mv-updates'],
  },
  docs: {
    required: 'docs-email',
    long: ['docs-notes'],
    short: ['docs-email', 'docs-org', 'docs-role', 'docs-deploy', 'docs-areas'],
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}

// Coerce to a trimmed, length-capped string; neutralise spreadsheet formulas.
function clean(value, max, skipEscape) {
  let s = Array.isArray(value) ? value.map(String).join(', ') : value == null ? '' : String(value);
  s = s.trim().slice(0, max);
  if (!skipEscape && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

async function handleContact(request, env) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method not allowed' }, 405, { Allow: 'POST' });
  }
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.toLowerCase().includes('application/json')) {
    return json({ ok: false, error: 'expected application/json' }, 400);
  }
  const len = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (len > MAX_BODY) return json({ ok: false, error: 'too large' }, 413);

  let text;
  try {
    text = await request.text();
  } catch (e) {
    return json({ ok: false, error: 'bad request' }, 400);
  }
  if (new TextEncoder().encode(text).length > MAX_BODY) return json({ ok: false, error: 'too large' }, 413);

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json({ ok: false, error: 'invalid body' }, 400);
  }

  // Honeypot: pretend success, forward nothing.
  if (data.website != null && String(data.website).trim() !== '') return json({ ok: true });

  const spec = Object.prototype.hasOwnProperty.call(FIELDS, data.form) ? FIELDS[data.form] : null;
  if (!spec) return json({ ok: false, error: 'invalid form' }, 400);

  const fields = {};
  for (const k of spec.short) fields[k] = clean(data[k], 300, /-email$/.test(k));
  for (const k of spec.long) fields[k] = clean(data[k], 2000);

  // Validate the raw (pre-escape) email.
  const email = String(data[spec.required] ?? '').trim().slice(0, 300);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid email' }, 400);

  if (!env.SHEETS_WEBHOOK_URL || !env.SHEETS_SECRET) {
    console.error('contact: SHEETS_WEBHOOK_URL or SHEETS_SECRET not configured');
    return json({ ok: false, error: 'not configured' }, 503);
  }

  const row = {
    secret: env.SHEETS_SECRET,
    form: data.form,
    submitted_at: new Date().toISOString(),
    page: clean(request.headers.get('Referer'), 300),
    country: request.cf?.country || '',
    ...fields,
  };

  try {
    const res = await fetch(env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    let out = null;
    try {
      out = await res.json();
    } catch (e) {
      /* non-JSON response */
    }
    if (res.ok && out && out.ok === true) return json({ ok: true });
    console.error('contact: sheets webhook failed, status ' + res.status);
    return json({ ok: false }, 502);
  } catch (e) {
    console.error('contact: sheets webhook ' + (e && e.name === 'TimeoutError' ? 'timeout' : 'error: ' + (e && e.name)));
    return json({ ok: false }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
