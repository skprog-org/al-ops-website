#!/usr/bin/env node
// Throttled mobile lab probe for LCP / CLS / interaction latency (INP proxy).
// Usage: node vitals.mjs [--dist] [path ...]   (run from repo root; needs `npm i` for playwright)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const root = join(process.cwd(), args.includes('--dist') ? 'dist' : 'transformation');
const paths = args.filter((a) => a.startsWith('/'));
const targets = paths.length ? paths : ['/', '/about/', '/platform/', '/trust/', '/perspectives/glossary/'];
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let f = join(root, p);
  try {
    if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
    res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
let bad = 0;
console.log('Lab data (4x CPU, slow-4G), NOT field CWV. Confirm with PageSpeed Insights on the live URL.\n');
for (const t of targets) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.addInitScript(() => {
    window.__v = { lcp: 0, cls: 0, inp: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.inp = Math.max(window.__v.inp, e.duration); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  });
  await page.goto(`http://localhost:${port}${t}`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.body.click()).catch(() => {});
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  const v = await page.evaluate(() => window.__v);
  const ok = v.lcp <= 2500 && v.cls <= 0.1 && v.inp <= 200;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${t.padEnd(32)} LCP ${v.lcp.toFixed(0)}ms  INP~${v.inp.toFixed(0)}ms  CLS ${v.cls.toFixed(3)}`);
  await page.close();
}
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
