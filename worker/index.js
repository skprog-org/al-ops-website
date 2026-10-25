// Cloudflare Worker: static site (via ASSETS) + POST /api/contact -> Google Sheets (Apps Script).

const MAX_BODY = 16 * 1024;

// ---- Bot protection ---------------------------------------------------------
// Case-insensitive substring matches against the User-Agent header.
const BLOCKED_UA = [
  // tools and headless automation
  'curl', 'wget', 'python-requests', 'python-urllib', 'scrapy', 'httrack', 'go-http-client',
  'libwww', 'java/', 'okhttp', 'axios', 'node-fetch', 'headlesschrome', 'phantomjs',
  'selenium', 'puppeteer', 'playwright',
  // AI crawlers
  'gptbot', 'chatgpt-user', 'oai-searchbot', 'claudebot', 'claude-web', 'anthropic-ai', 'ccbot',
  'perplexitybot', 'bytespider', 'google-extended', 'amazonbot', 'applebot-extended', 'cohere-ai',
  'diffbot', 'imagesiftbot', 'omgilibot', 'facebookbot', 'meta-externalagent', 'youbot',
];

const GATE_COOKIE = '__gate';
const GATE_TTL = 12 * 60 * 60; // seconds
const MAX_TOKEN = 2048;
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function isBlockedUA(ua) {
  if (!ua || !ua.trim()) return true;
  const l = ua.toLowerCase();
  return BLOCKED_UA.some((b) => l.includes(b));
}

function text(body, status, extra = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

const enc = new TextEncoder();

function b64u(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(str) {
  if (!/^[A-Za-z0-9_-]+$/.test(str)) return null;
  const pad = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  try {
    const bin = atob(pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch (e) {
    return null;
  }
}

function hmacKey(secret, usage) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

async function makeCookieValue(secret) {
  const expiry = String(Math.floor(Date.now() / 1000) + GATE_TTL);
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), enc.encode(expiry));
  return expiry + '.' + b64u(mac);
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

async function hasValidGate(request, env) {
  const v = getCookie(request, GATE_COOKIE);
  if (!v || v.length > 200) return false;
  const dot = v.indexOf('.');
  if (dot < 1) return false;
  const expiry = v.slice(0, dot);
  if (!/^\d{1,12}$/.test(expiry) || Number(expiry) <= Date.now() / 1000) return false;
  const mac = b64uDecode(v.slice(dot + 1));
  if (!mac) return false;
  try {
    // crypto.subtle.verify compares the MAC in constant time.
    return await crypto.subtle.verify('HMAC', await hmacKey(env.GATE_SECRET, 'verify'), mac, enc.encode(expiry));
  } catch (e) {
    return false;
  }
}

function cookieHeader(value, url) {
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  return GATE_COOKIE + '=' + value + '; Path=/; Max-Age=' + GATE_TTL + '; HttpOnly; ' + (local ? '' : 'Secure; ') + 'SameSite=Lax';
}

async function handleGate(request, env, url) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405, { Allow: 'POST' });
  const len = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (len > 4096) return json({ ok: false, error: 'too large' }, 413);
  let token;
  try {
    const body = await request.text();
    if (body.length > 4096) return json({ ok: false, error: 'too large' }, 413);
    token = JSON.parse(body).token;
  } catch (e) {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  if (typeof token !== 'string' || !token || token.length > MAX_TOKEN) {
    return json({ ok: false, error: 'invalid token' }, 400);
  }
  try {
    const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.set('remoteip', ip);
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form, signal: AbortSignal.timeout(10000) });
    const out = await res.json();
    if (res.ok && out && out.success === true) {
      return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader(await makeCookieValue(env.GATE_SECRET), url) });
    }
  } catch (e) {
    console.error('gate: siteverify ' + (e && e.name === 'TimeoutError' ? 'timeout' : 'error: ' + (e && e.name)));
  }
  return json({ ok: false }, 403);
}

// Inline script for the gate page. Its sha256 goes into the page CSP.
const GATE_SCRIPT = `(function(){
var box=document.getElementById('ts'),msg=document.getElementById('msg'),retry=document.getElementById('retry'),wid=null;
function say(t){msg.textContent=t;}
function fail(t){say(t);retry.hidden=false;}
function pass(token){
  say('Verifying...');
  fetch('/api/gate',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token})})
    .then(function(r){if(r.ok){location.reload();}else{fail('Verification failed. Please try again.');}})
    .catch(function(){fail('Network error. Please try again.');});
}
function draw(){
  retry.hidden=true;say('');
  var o={sitekey:box.getAttribute('data-sitekey'),callback:pass,
    'error-callback':function(){fail('The check could not be completed. Please try again.');},
    'expired-callback':function(){fail('The check expired. Please try again.');}};
  if(wid!==null){window.turnstile.reset(wid);}else{wid=window.turnstile.render(box,o);}
}
retry.addEventListener('click',draw);
var tries=0,t=setInterval(function(){
  if(window.turnstile){clearInterval(t);draw();}
  else if(++tries>150){clearInterval(t);fail('The check failed to load. Please try again.');}
},100);
})();`;

let gateHash;
async function gateScriptHash() {
  if (!gateHash) {
    gateHash = b64Std(await crypto.subtle.digest('SHA-256', enc.encode(GATE_SCRIPT)));
  }
  return gateHash;
}

function b64Std(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function gatePage(env) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Checking your browser</title>
<style>
html,body{margin:0;height:100%}
body{background:#03141E;color:#EAF6F4;font-family:'Inter Tight',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box}
main{max-width:420px}
h1{font-size:1.6rem;font-weight:600;margin:0 0 12px}
p{margin:0 0 20px;line-height:1.5;opacity:.85}
#ts{min-height:65px;display:flex;justify-content:center}
#msg{min-height:1.5em;margin:16px 0 8px}
button{font:inherit;color:#03141E;background:#EAF6F4;border:0;border-radius:6px;padding:8px 18px;cursor:pointer}
</style>
</head>
<body>
<main>
<h1>Checking your browser</h1>
<p>This site is private. Please complete the quick check below to continue.</p>
<div id="ts" data-sitekey="${esc(env.TURNSTILE_SITE_KEY)}"></div>
<div id="msg" role="status" aria-live="polite"></div>
<button id="retry" type="button" hidden>Try again</button>
<noscript><p>JavaScript is required to complete this check. Please enable JavaScript and reload the page.</p></noscript>
</main>
<script async defer src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>
<script>${GATE_SCRIPT}</script>
</body>
</html>`;
  const hash = await gateScriptHash();
  return new Response(html, {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Content-Security-Policy':
        "default-src 'none'; script-src 'sha256-" + hash + "' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
    },
  });
}

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

    // (a) robots.txt is always public.
    if (url.pathname === '/robots.txt') return env.ASSETS.fetch(request);

    // (b) pre-filter
    if (isBlockedUA(request.headers.get('User-Agent'))) return text('Forbidden', 403);

    // (c) per-IP rate limit (skipped when the binding is absent, e.g. local dev)
    if (env.RATE_LIMITER) {
      try {
        const key = request.headers.get('CF-Connecting-IP') || 'unknown';
        const { success } = await env.RATE_LIMITER.limit({ key });
        if (!success) return text('Too Many Requests', 429, { 'Retry-After': '60' });
      } catch (e) {
        console.error('ratelimit: error ' + (e && e.name));
      }
    }

    // (d) gate, fail closed when not configured
    if (!env.TURNSTILE_SECRET || !env.GATE_SECRET || !env.TURNSTILE_SITE_KEY || /^REPLACE_/.test(env.TURNSTILE_SITE_KEY)) {
      console.error('gate: TURNSTILE_SECRET, GATE_SECRET or TURNSTILE_SITE_KEY not configured');
      return text('not configured', 503);
    }
    if (url.pathname === '/api/gate') return handleGate(request, env, url);
    if (!(await hasValidGate(request, env))) {
      if (url.pathname.startsWith('/api/')) {
        return json({ ok: false, error: 'verification required' }, 403);
      }
      return gatePage(env);
    }

    if (url.pathname === '/api/contact') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
