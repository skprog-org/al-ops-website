import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../transformation/', import.meta.url));

// Every page = every directory containing index.html, plus the root.
function pages(dir = '', out = []) {
  for (const name of readdirSync(join(root, dir))) {
    if (name === 'assets' || name.startsWith('.')) continue;
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) {
      try { statSync(join(root, rel, 'index.html')); out.push('/' + rel + '/'); } catch {}
      pages(rel, out);
    }
  }
  return out;
}
const PAGES = ['/', ...pages()];

const settle = async (page) => {
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts?.ready);
};

for (const path of PAGES) {
  test.describe(path, () => {
    test('no horizontal page overflow', async ({ page }) => {
      await page.goto(path);
      await settle(page);
      const { sw, cw, offenders } = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth;
        const bad = [];
        for (const el of document.body.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width && r.right > cw + 1 && !el.closest('[data-allow-scroll], .vb-hero-art, pre, dialog:not([open])')) {
            // ignore children of an element that scrolls on its own
            let p = el.parentElement, scrolls = false;
            while (p && p !== document.body) {
              const o = getComputedStyle(p).overflowX;
              if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { scrolls = true; break; }
              p = p.parentElement;
            }
            if (!scrolls) bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(r.right)}`);
          }
        }
        return { sw: document.documentElement.scrollWidth, cw, offenders: bad.slice(0, 5) };
      });
      expect(sw, `scrollWidth ${sw} > viewport ${cw}; offenders: ${offenders.join(' | ')}`).toBeLessThanOrEqual(cw);
    });

    test('has viewport meta and an h1', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('images fit the viewport', async ({ page }) => {
      await page.goto(path);
      await settle(page);
      const issues = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth, out = [];
        for (const img of document.querySelectorAll('img')) {
          const r = img.getBoundingClientRect();
          if (r.width && r.width > cw + 1 && !img.closest('.diagram, .vb-hero-art, [data-allow-scroll]')) out.push(`img ${img.src.split('/').pop()} ${Math.round(r.width)}px`);
        }
        return out;
      });
      expect(issues).toEqual([]);
    });
  });
}

test.describe('navigation', () => {
  test('menu button toggles nav below 1100px; inline nav above', async ({ page, viewport }) => {
    await page.goto('/');
    await settle(page);
    const btn = page.locator('.menu-btn');
    const nav = page.locator('#primary-nav');
    if (viewport.width <= 1100) {
      await expect(btn).toBeVisible();
      await expect(nav).toBeHidden();
      await btn.click();
      await expect(btn).toHaveAttribute('aria-expanded', 'true');
      await expect(nav).toBeVisible();
      const box = await nav.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      await btn.click();
      await expect(nav).toBeHidden();
    } else {
      await expect(btn).toBeHidden();
      await expect(nav).toBeVisible();
    }
  });

  test('mobile menu links meet 44px tap target', async ({ page, viewport }) => {
    test.skip(viewport.width > 1100, 'mobile nav only');
    await page.goto('/');
    await page.locator('.menu-btn').click();
    const heights = await page.$$eval('#primary-nav a', (as) => as.filter((a) => a.offsetParent).map((a) => a.getBoundingClientRect().height));
    expect(heights.length).toBeGreaterThan(0);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  });
});

test('contact form fields fit and are usable', async ({ page, viewport }) => {
  await page.goto('/contact/');
  await settle(page);
  const fields = page.locator('form input:not([type=hidden]):not([type=checkbox]):not([type=radio]), form textarea, form select');
  const n = await fields.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const el = fields.nth(i);
    if (!(await el.isVisible())) continue;
    const b = await el.boundingBox();
    expect(b.x + b.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(b.height).toBeGreaterThanOrEqual(36);
  }
});

test('home hero screenshot', async ({ page }, info) => {
  await page.goto('/');
  await settle(page);
  await info.attach('home-fold', { body: await page.screenshot(), contentType: 'image/png' });
});
