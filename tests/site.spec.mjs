import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:8000';
const widths = [375, 768, 1440];
const pages = ['/', '/ideas/', '/privacy/', '/contact/', '/404.html'];

// Layout, overflow and console cleanliness across the breakpoints we support.
for (const width of widths) {
  for (const route of pages) {
    test(`${route} at ${width}px has readable layout`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toBeVisible();
      const stats = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(stats.scrollWidth, 'Horizontal overflow on ' + route).toBeLessThanOrEqual(stats.width + 3);
      expect(errors).toEqual([]);
      try {
        await page.screenshot({ path: `artifacts/${route.replaceAll('/', '') || 'home'}-${width}.png`, fullPage: true, timeout: 12000 });
      } catch (error) {
        await page.screenshot({ path: `artifacts/${route.replaceAll('/', '') || 'home'}-${width}-viewport.png`, fullPage: false, animations: 'disabled', timeout: 12000 });
      }
      await context.close();
    });
  }
}

test('FAQ controls reflect expanded and collapsed states', async ({ page }) => {
  await page.goto(BASE + '/');
  const first = page.locator('.faq-q').first();
  const second = page.locator('.faq-q').nth(1);
  const answerOne = page.locator('#' + await first.getAttribute('aria-controls'));
  const answerTwo = page.locator('#' + await second.getAttribute('aria-controls'));
  await expect(answerOne).toBeHidden();
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(answerOne).toBeVisible();
  await second.click();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(answerOne).toBeHidden();
  await expect(answerTwo).toBeVisible();
});

test('mobile navigation opens, closes and supports Escape', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 760 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  const toggle = page.locator('#burger');
  await expect(toggle).toBeVisible();
  await expect(page.locator('.mobile-cta')).toBeVisible();
  await expect(page.locator('.mobile-cta')).toHaveAttribute('href', /#request$/);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await ctx.close();
});

test('lead form validates input and offers a copy-based fallback', async ({ page }) => {
  await page.goto(BASE + '/ideas/');
  const form = page.locator('#ideasForm');
  await expect(form).toBeVisible();
  await expect(page.locator('#sendRequest')).toBeVisible();
  // The submit control must always expose an accessible name, whatever the wording.
  await expect(page.locator('#sendRequest')).not.toHaveText('');
  await page.locator('#name').fill('Test Visitor');
  await page.locator('#email').fill('sample@example.com');
  await page.locator('#offer').fill('Leadership coaching for senior managers');
  await page.locator('#buyerQuestion').fill('How is this different?');
  await page.locator('#consent').check();
  await page.locator('#copyRequest').click();
  await expect(page.locator('#status')).not.toBeEmpty();
  // Do not click Submit: production third-party delivery requires inbox activation.
});

test('lead form keeps its anti-spam and consent contract', async ({ page }) => {
  await page.goto(BASE + '/ideas/');
  // Honeypot must exist, be hidden from assistive tech and skipped in the tab order.
  const honey = page.locator('#form-honey');
  await expect(honey).toHaveCount(1);
  await expect(honey).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#ideasForm .trap')).toHaveAttribute('aria-hidden', 'true');
  // Consent must be an explicit, required opt-in carrying the consent field name.
  const consent = page.locator('#consent');
  await expect(consent).toHaveCount(1);
  await expect(consent).toBeRequired();
  await expect(consent).toHaveAttribute('name', 'consent_to_contact');
  // A manual copy path must exist so the form is still usable without a mail client.
  await expect(page.locator('#manualCopy')).toHaveCount(1);
  await expect(page.locator('#manualBody')).toHaveCount(1);
  // Intake mode is an implementation detail, but it must be one of the two known modes.
  await expect(page.locator('#ideasForm')).toHaveAttribute('data-intake-mode', /^(provider|email-fallback)$/);
});

test('homepage keeps proof early, offers after proof and a short bounded navigation', async ({ page }) => {
  await page.goto(BASE + '/');
  const links = page.locator('#navLinks > a');
  const navCount = await links.count();
  expect(navCount, 'navigation must stay short').toBeGreaterThanOrEqual(4);
  expect(navCount, 'navigation must stay short').toBeLessThanOrEqual(7);
  const hrefs = await links.evaluateAll(as => as.map(a => a.getAttribute('href')));
  expect(hrefs.every(h => h && h.trim().length)).toBeTruthy();

  const sections = await page.evaluate(() =>
    [...document.querySelectorAll('main > section')].map(s => s.id || s.className));
  expect(sections.length).toBeGreaterThanOrEqual(5);
  expect(sections.length).toBeLessThanOrEqual(14);

  // The commercial argument: work is shown before it is sold.
  const proofAt = sections.indexOf('proof');
  expect(proofAt, 'a proof section must exist').toBeGreaterThanOrEqual(0);
  expect(proofAt, 'proof must appear near the top, not buried').toBeLessThanOrEqual(2);

  const offersAt = sections.indexOf('offers');
  expect(offersAt, 'an offers section must exist').toBeGreaterThanOrEqual(0);
  expect(offersAt, 'offers must come after proof').toBeGreaterThan(proofAt);

  expect(await page.locator('#proof .video-preview').count()).toBeGreaterThanOrEqual(1);
  expect(await page.locator('#proof .play-badge').count())
    .toBe(await page.locator('#proof .video-preview').count());

  // Deliverables must stay a real, described section rather than a bare list of promises.
  const deliverables = (await page.locator('#deliverables').textContent()) || '';
  expect(deliverables.trim().length).toBeGreaterThan(40);

  // Every in-page anchor must resolve to a real target.
  const missing = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute('href').slice(1))
    .filter(id => id && !document.getElementById(id)));
  expect(missing).toEqual([]);
});

test('lead page explains its real submission path without false confirmation', async ({ page }) => {
  await page.goto(BASE + '/ideas/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#ideasForm')).toBeVisible();
  for (const field of ['#name', '#email', '#url', '#offer']) {
    await expect(page.locator(field)).toBeVisible();
  }
  const notice = await page.locator('#ideasForm .hint').textContent();
  expect(notice).toMatch(/email|send/i);
});

test('contact page gives a direct founder-led route to a person', async ({ page }) => {
  await page.goto(BASE + '/contact/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  await expect(page.locator('main')).toContainText('Injam Haq');
  await expect(page.locator('footer a[href="/privacy/"]')).toBeVisible();
});

test('404 page offers safe recovery and is noindexed', async ({ page }) => {
  await page.goto(BASE + '/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/contact/"]').first()).toBeVisible();
});

test('visible forms, buttons, images and document landmark have accessible essentials', async ({ browser }) => {
  for (const route of ['/', '/ideas/', '/contact/', '/privacy/', '/404.html']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 840 } });
    const page = await ctx.newPage();
    await page.goto(BASE + route);
    const issues = await page.evaluate(() => {
      const out = [];
      if (!document.querySelector('main')) out.push('missing main landmark');
      if (document.querySelectorAll('h1').length !== 1) out.push('expected one h1');
      for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) out.push('image missing alt');
      for (const button of document.querySelectorAll('button')) {
        if (!button.textContent?.trim() && !button.getAttribute('aria-label')) out.push('unlabeled button');
      }
      for (const field of document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]),textarea,select')) {
        if (field.closest('[aria-hidden="true"]')) continue;
        const id = field.getAttribute('id');
        const described = id ? document.querySelector('label[for="' + id + '"]') : null;
        const wrapped = field.closest('label');
        if (!described && !wrapped && !field.getAttribute('aria-label')) out.push('unlabeled field');
      }
      return out;
    });
    expect(issues, route).toEqual([]);
    await ctx.close();
  }
});

test('quiet text meets WCAG AA contrast on its real background', async ({ page }) => {
  await page.goto(BASE + '/');
  const results = await page.evaluate(() => {
    function parse(c) {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map(v => parseFloat(v));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    function lum({ r, g, b }) {
      const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function ratio(fg, bg) {
      const a = lum(fg), b = lum(bg), hi = Math.max(a, b), lo = Math.min(a, b);
      return (hi + 0.05) / (lo + 0.05);
    }
    const selectors = ['.muted', '.transform-arrow', '.foot h4', '.copyline', '.note', '.asset p', '.offer p', '.faq-a p', '.foot p'];
    const out = [];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const fg = parse(getComputedStyle(el).color);
        if (!fg || fg.a === 0) continue;
        let node = el, bg = null;
        while (node) {
          const b = parse(getComputedStyle(node).backgroundColor);
          if (b && b.a > 0.9) { bg = b; break; }
          node = node.parentElement;
        }
        if (!bg) continue;
        const r = ratio(fg, bg);
        if (r < 4.5) out.push(sel + ' -> ' + r.toFixed(2) + ':1');
      }
    }
    return out;
  });
  expect(results, 'text below 4.5:1').toEqual([]);
});
