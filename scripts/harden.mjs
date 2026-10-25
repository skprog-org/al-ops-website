// Production hardening: copies ./transformation to ./dist, minifies HTML/CSS, obfuscates site JS,
// then verifies the CSP inline-script hashes and JS syntax. Exits non-zero on any failure.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { minify as minifyHtml } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import JavaScriptObfuscator from 'javascript-obfuscator';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'transformation');
const DIST = path.join(ROOT, 'dist');

const EXCLUDE = [/\.py$/, /\.hash$/, /^__pycache__$/, /^\.DS_Store$/, /^\.assetsignore$/, /^README\.md$/, /^build\.py$/, /^illustrations\.py$/];
const excluded = (name) => EXCLUDE.some((re) => re.test(name));

const stats = { copied: 0, html: 0, css: 0, js: 0, before: { html: 0, css: 0, js: 0 }, after: { html: 0, css: 0, js: 0 } };
const failures = [];

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const ent of await fs.readdir(from, { withFileTypes: true })) {
    if (excluded(ent.name)) continue;
    const s = path.join(from, ent.name), d = path.join(to, ent.name);
    if (ent.isDirectory()) await copyTree(s, d);
    else if (ent.isFile()) { await fs.copyFile(s, d); stats.copied++; }
  }
}

async function walk(dir, out = []) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(p, out); else out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(DIST, p).split(path.sep).join('/');
const isVendor = (p) => rel(p).startsWith('assets/vendor/');

const OBF = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  renameProperties: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  rotateStringArray: true,
  shuffleStringArray: true,
  splitStrings: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  numbersToExpressions: false,
  simplify: true,
  sourceMap: false,
  target: 'browser',
};

async function transform() {
  for (const file of await walk(DIST)) {
    const ext = path.extname(file);
    if (isVendor(file)) continue;
    if (ext === '.html') {
      const src = await fs.readFile(file, 'utf8');
      const out = await minifyHtml(src, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        minifyCSS: false,
        minifyJS: false,
        removeOptionalTags: false,
        removeAttributeQuotes: false,
        keepClosingSlash: true,
        // never touch script bodies (CSP hashes) or JSON-LD
        ignoreCustomFragments: [],
      });
      await fs.writeFile(file, out);
      stats.html++; stats.before.html += Buffer.byteLength(src); stats.after.html += Buffer.byteLength(out);
    } else if (ext === '.css') {
      const src = await fs.readFile(file, 'utf8');
      const res = new CleanCSS({ level: 1 }).minify(src);
      if (res.errors.length) { failures.push(`${rel(file)}: css errors ${res.errors.join('; ')}`); continue; }
      await fs.writeFile(file, res.styles);
      stats.css++; stats.before.css += Buffer.byteLength(src); stats.after.css += Buffer.byteLength(res.styles);
    } else if (ext === '.js' && rel(file).startsWith('assets/')) {
      const src = await fs.readFile(file, 'utf8');
      const isModule = /^\s*(import|export)\s/m.test(src);
      try {
        const res = JavaScriptObfuscator.obfuscate(src, { ...OBF, sourceType: isModule ? 'module' : 'script' });
        const out = res.getObfuscatedCode();
        await fs.writeFile(file, out);
        stats.js++; stats.before.js += Buffer.byteLength(src); stats.after.js += Buffer.byteLength(out);
      } catch (e) { failures.push(`${rel(file)}: obfuscation failed: ${e.message}`); }
    }
  }
}

async function checkJsSyntax() {
  const tmp = await fs.mkdtemp(path.join((await import('node:os')).tmpdir(), 'harden-'));
  try {
    for (const file of (await walk(path.join(DIST, 'assets'))).filter((f) => f.endsWith('.js'))) {
      const tmpFile = path.join(tmp, path.basename(file, '.js') + '.mjs'); // .mjs so import/export parse as module
      const code = await fs.readFile(file, 'utf8');
      // site.js is a classic script containing dynamic import(); it also parses fine as a module
      await fs.writeFile(tmpFile, code);
      const r = spawnSync(process.execPath, ['--check', tmpFile], { encoding: 'utf8' });
      if (r.status !== 0) failures.push(`${rel(file)}: syntax check failed: ${r.stderr.trim()}`);
    }
  } finally { await fs.rm(tmp, { recursive: true, force: true }); }
}

async function checkCspHashes() {
  const headers = await fs.readFile(path.join(DIST, '_headers'), 'utf8');
  const allowed = new Set([...headers.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((m) => m[1]));
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let checked = 0;
  for (const file of (await walk(DIST)).filter((f) => f.endsWith('.html'))) {
    const html = await fs.readFile(file, 'utf8');
    for (const m of html.matchAll(re)) {
      const attrs = m[1];
      if (/\bsrc\s*=/i.test(attrs)) continue;
      const type = (attrs.match(/\btype\s*=\s*["']?([^\s"'>]+)/i) || [])[1] || '';
      if (/json/i.test(type)) continue;
      const hash = crypto.createHash('sha256').update(m[2], 'utf8').digest('base64');
      checked++;
      if (!allowed.has(hash)) failures.push(`${rel(file)}: inline script hash sha256-${hash} not in _headers`);
    }
  }
  console.log(`CSP: ${checked} inline scripts checked against ${allowed.size} allowed hashes`);
}

const kb = (n) => (n / 1024).toFixed(1) + ' KB';

await fs.rm(DIST, { recursive: true, force: true });
await copyTree(SRC, DIST);
await transform();
await checkJsSyntax();
await checkCspHashes();

console.log(`Copied ${stats.copied} files to dist/`);
for (const k of ['html', 'css', 'js']) console.log(`${k.padEnd(5)} ${String(stats[k]).padStart(3)} files  ${kb(stats.before[k])} -> ${kb(stats.after[k])}`);
if (failures.length) {
  console.error('\nHARDEN FAILED:\n  ' + [...new Set(failures)].join('\n  '));
  process.exit(1);
}
console.log('harden OK');
