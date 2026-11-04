#!/usr/bin/env node
// Static SEO/AEO audit. Usage: node audit.mjs [--dist] [--launch]
// Reads ./transformation (or ./dist with --dist). No dependencies.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const LAUNCH = args.includes('--launch');
const ROOT = process.cwd();
const DIR = join(ROOT, args.includes('--dist') ? 'dist' : 'transformation');
const SITE = 'https://al-ops.ai';
const res = { FAIL: [], 'DRAFT-EXPECTED': [], MANUAL: [], PASS: [] };
const add = (g, m) => res[g].push(m);
const check = (ok, msg, draftExpected = false) =>
  add(ok ? 'PASS' : draftExpected && !LAUNCH ? 'DRAFT-EXPECTED' : 'FAIL', msg);
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);

if (!existsSync(DIR)) { console.error(`Missing ${DIR}. Run the build first.`); process.exit(2); }

function walk(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' || e.name.startsWith('.') ? [] :
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
}
const files = walk(DIR);
const pages = files.filter((f) => f.endsWith('index.html') || f.endsWith('404.html'));
const dec = (x) => x == null ? x : x.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'");
// attribute value, quoted (either quote, backreference) or unquoted (minified HTML)
const AV = `(?:(["'])(.*?)\\1|([^\\s"'>]+))`;
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\b${name}=${AV}`, 'i')); return m ? dec(m[2] ?? m[3]) : undefined; };
const tagsOf = (h, t) => [...h.matchAll(new RegExp(`<${t}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
const meta = (h, n) => { const t = tagsOf(h, 'meta').find((x) => [attr(x, 'name'), attr(x, 'property')].includes(n)); return t ? attr(t, 'content') : undefined; };

// ---------- site-level ----------
const robots = read(join(DIR, 'robots.txt'));
check(!!robots, 'robots.txt exists');
if (robots) {
  check(/^Sitemap:\s*https?:\/\//im.test(robots), 'robots.txt has Sitemap line');
  const star = (robots.match(/User-agent:\s*\*\s*\n((?:(?!User-agent:)[^\n]*\n?)*)/i) || [])[1] || '';
  check(!/^Disallow:\s*\/\s*$/im.test(star), 'robots.txt (User-agent: *) does not block entire site', true);
  check(/^Disallow:\s*\/(api\/?)?\s*$/im.test(robots), 'robots.txt disallows /api/ (or whole site while draft)', true);
  for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot']) {
    const blocked = new RegExp(`User-agent:\\s*${bot}\\s*\\n\\s*Disallow:\\s*/\\s*(\\n|$)`, 'i').test(robots);
    check(!blocked, `robots.txt does not block ${bot}`, true);
  }
}
const llms = read(join(DIR, 'llms.txt'));
check(!!llms, 'llms.txt exists');
if (llms) check(/^# .+/m.test(llms) && /^> .+/m.test(llms) && /\]\(https?:\/\//.test(llms), 'llms.txt has H1, summary and links');

const sm = read(join(DIR, 'sitemap.xml'));
check(!!sm, 'sitemap.xml exists');
const smUrls = sm ? [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) : [];
const routes = pages.filter((f) => f.endsWith('index.html')).map((f) => {
  const r = '/' + relative(DIR, f).replace(/index\.html$/, '');
  return SITE + r;
});
check(['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'].some((n) => existsSync(join(DIR, n))), 'favicon file exists (favicon.ico/svg)');
check(existsSync(join(DIR, 'apple-touch-icon.png')), 'apple-touch-icon.png exists');

const f404 = read(join(DIR, '404.html'));
check(!!f404, '404.html exists');
if (f404) {
  check(/ALOps - Error 404/.test(f404), '404 title is "ALOps - Error 404"');
  check(/href=["']\/["']/.test(f404), '404 links back to home');
}
const headers = read(join(DIR, '_headers')) || read(join(ROOT, 'transformation/_headers'));
if (headers) check(!/X-Robots-Tag:\s*noindex/i.test(headers), '_headers has no blanket X-Robots-Tag noindex', true);
const worker = read(join(ROOT, 'worker/index.js'));
if (worker) {
  const m = worker.match(/BLOCKED[\s\S]*?\]/);
  const blockedAI = ['gptbot', 'claudebot', 'oai-searchbot', 'perplexitybot', 'chatgpt-user'].filter((b) => worker.toLowerCase().includes(`'${b}'`));
  check(!blockedAI.length, `worker/index.js bot filter does not 403 AI crawlers${blockedAI.length ? ' (blocks: ' + blockedAI.join(', ') + ')' : ''}`, true);
}
const ign = read(join(ROOT, 'transformation/.assetsignore')) || '';
check(!/^(llms\.txt|favicon|apple-touch)/m.test(ign), '.assetsignore does not hide llms/favicon files');
if (args.includes('--dist')) for (const n of ['llms.txt', 'robots.txt', 'sitemap.xml']) check(existsSync(join(DIR, n)), `dist ships ${n}`);

// ---------- per-page ----------
const titles = new Map(), descs = new Map();
const SCHEMA_REQ = {
  Organization: ['name', 'url', 'logo'], WebSite: ['name', 'url'], BreadcrumbList: ['itemListElement'],
  Article: ['headline', 'author', 'datePublished'], FAQPage: ['mainEntity'], WebPage: ['name'],
};
for (const f of pages) {
  const p = '/' + relative(DIR, f).replace(/index\.html$/, '');
  const h = readFileSync(f, 'utf8');
  const is404 = f.endsWith('404.html');
  const robotsMeta = meta(h, 'robots') || '';
  const canonPre = attr(tagsOf(h, 'link').find((x) => attr(x, 'rel') === 'canonical') || '', 'href');
  if (!is404 && /noindex/i.test(robotsMeta) && canonPre && canonPre !== SITE + p) { add('PASS', `${p}: A/B variant, noindex by design (skipped)`); routes.splice(routes.indexOf(SITE + p), 1); continue; }
  const fail = (m, draft) => check(false, `${p}: ${m}`, draft);
  const ok = (c, m, draft) => { if (!c) fail(m, draft); };

  const title = dec((h.match(/<title>([^<]*)<\/title>/i) || [])[1] || '');
  ok(/^ALOps - .+/.test(title), `title "${title}" must be "ALOps - Page Name"`);
  ok(title.length > 0 && title.length <= 70, `title length ${title.length} (max 70)`);
  titles.set(title, [...(titles.get(title) || []), p]);
  const desc = meta(h, 'description') || '';
  ok(desc.length > 0 && desc.length <= 155, `description length ${desc.length} (1-155)`);
  descs.set(desc, [...(descs.get(desc) || []), p]);
  ok(!!meta(h, 'keywords'), 'meta keywords missing');
  ok(meta(h, 'author') === 'ALOps Team', 'meta author must be "ALOps Team"');
  ok(/^en/i.test(attr((h.match(/<html\b[^>]*>/i) || [''])[0], 'lang') || ''), 'html lang="en" missing');
  if (is404) continue;
  const canon = attr(tagsOf(h, 'link').find((x) => attr(x, 'rel') === 'canonical') || '', 'href');
  ok(canon === SITE + p, `canonical "${canon}" should be ${SITE + p}`);
  ok(meta(h, 'og:url') === canon, 'og:url must equal canonical');
  const og = meta(h, 'og:image');
  ok(!!og && /^https:\/\/.+\.(jpe?g|png)$/i.test(og), `og:image missing or not absolute JPG/PNG (${og || 'none'})`);
  ok(!!meta(h, 'twitter:image'), 'twitter:image missing');
  ok(meta(h, 'twitter:card') === 'summary_large_image', 'twitter:card should be summary_large_image');
  ok(!/noindex/i.test(meta(h, 'robots') || ''), 'robots meta is noindex', true);

  const mainHtml = (h.match(/<main\b[\s\S]*<\/main>/i) || [h])[0];
  const hs = [...mainHtml.matchAll(/<h([1-6])\b/gi)].map((m) => +m[1]);
  ok(hs.filter((x) => x === 1).length === 1, `expected exactly one H1, found ${hs.filter((x) => x === 1).length}`);
  const sk = hs.findIndex((x, i) => i > 0 && x > hs[i - 1] + 1);
  ok(sk < 0, `heading level skip in <main>: h${hs[sk - 1]}→h${hs[sk]} (sequence ${hs.join(',')})`);

  const ld = [...h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  ok(ld.length > 0, 'no JSON-LD schema');
  for (const m of ld) {
    try {
      const j = JSON.parse(m[1]);
      const nodes = j['@graph'] || [j];
      for (const n of nodes) for (const t of [].concat(n['@type'])) {
        const miss = (SCHEMA_REQ[t] || []).filter((k) => n[k] == null);
        ok(!miss.length, `schema ${t} missing ${miss.join(', ')}`);
      }
    } catch { fail('JSON-LD does not parse'); }
  }

  for (const m of h.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0], src = attr(tag, 'src') || '';
    const name = src.split('/').pop();
    if (/^data:/.test(src)) continue;
    if (!/logo|loader|icon/.test(name)) ok(/^alops-[a-z0-9]+(-[a-z0-9]+)*\.[a-z0-9]+$/.test(name), `image name "${name}" should be alops-<descriptive-name>`);
    const alt = attr(tag, 'alt');
    ok(alt && alt.trim().length > 0, `image ${name} missing alt`);
    if (alt && alt.length > 160) add('MANUAL', `${p}: alt for ${name} is ${alt.length} chars; consider shortening`);
    ok(attr(tag, 'width') && attr(tag, 'height'), `image ${name} lacks width/height (CLS)`);
  }
}
if (sm) {
  const missing = routes.filter((u) => !smUrls.includes(u));
  check(!missing.length, `sitemap lists all ${routes.length} pages` + (missing.length ? ` (missing: ${missing.slice(0, 5).join(', ')})` : ''));
}
for (const [t, ps] of titles) if (ps.length > 1) check(false, `duplicate title "${t}" on ${ps.join(', ')}`);
for (const [d, ps] of descs) if (d && ps.length > 1) check(false, `duplicate description on ${ps.join(', ')}`);

// ---------- manual ----------
for (const m of [
  'Unknown URL returns HTTP 404 (curl -I <live>/nope) and is not redirected to /',
  'HTTP→HTTPS, www/non-www and trailing-slash redirects on live domain',
  'Cloudflare: AI Crawl Control / Block AI bots off; managed robots.txt not overriding; Bot Fight Mode/WAF not challenging allowed bots',
  'PageSpeed Insights on live URL: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 (field data)',
  'validator.schema.org and Google Rich Results Test on live URLs',
  'Google Search Console + Bing Webmaster: submit sitemap',
]) add('MANUAL', m);

// ---------- report ----------
console.log(`SEO/AEO audit — ${relative(ROOT, DIR)}/ — ${LAUNCH ? 'LAUNCH' : 'DRAFT'} mode — ${pages.length} pages\n`);
for (const g of ['FAIL', 'DRAFT-EXPECTED', 'MANUAL']) {
  console.log(`## ${g} (${res[g].length})`);
  res[g].forEach((m) => console.log(' - ' + m));
  console.log();
}
console.log(`## PASS (${res.PASS.length})`);
process.exit(res.FAIL.length ? 1 : 0);
