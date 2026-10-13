import { test, expect } from '@playwright/test';

const widths = [375, 768, 1440];
const pages = ['/', '/ideas/', '/privacy/', '/contact/', '/404.html'];

for (const width of widths) {
  for (const route of pages) {
    test(`${route} at ${width}px has readable layout`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:8000' + route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toBeVisible();
      const stats = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        headline: document.querySelector('h1')?.textContent,
      }));
      expect(stats.scrollWidth, 'Horizontal overflow on ' + route).toBeLessThanOrEqual(stats.width + 3);
      expect(errors).toEqual([]);
      try {
        await page.screenshot({ path: `artifacts/${route.replaceAll('/', '') || 'home'}-${width}.png`, fullPage: true, timeout: 12000 });
      } catch (error) {
        // Some headless Chromium instances cannot capture the entire contact page.
        // The layout and console checks above still run, and a viewport capture
        // preserves visual evidence without treating a screenshot transport error
        // as a website defect.
        await page.screenshot({ path: `artifacts/${route.replaceAll('/', '') || 'home'}-${width}-viewport.png`, fullPage: false, animations: 'disabled', timeout: 12000 });
      }
      await context.close();
    });
  }
}

test('FAQ controls reflect expanded and collapsed states', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/');
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
  await page.goto('http://127.0.0.1:8000/');
  const toggle = page.locator('#burger');
  await expect(toggle).toBeVisible();
  await expect(page.locator('.mobile-cta')).toBeVisible();
  await expect(page.locator('.mobile-cta')).toHaveAttribute('href','/ideas/#request');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await ctx.close();
});

test('lead form validates user input and copy fallback', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/ideas/');
  const form = page.locator('#ideasForm');
  await expect(form).toBeVisible();
  await expect(page.locator('#sendRequest')).toBeVisible();
  await expect(page.locator('#sendRequest')).toHaveText(/Prepare My Email Request/);
  await page.locator('#name').fill('Test Visitor');
  await page.locator('#email').fill('sample@example.com');
  await page.locator('#offer').fill('Leadership coaching for senior managers');
  await page.locator('#buyerQuestion').fill('How is this different?');
  await page.locator('#consent').check();
  await page.locator('#copyRequest').click();
  await expect(page.locator('#status')).not.toBeEmpty();
  // Do not click Submit: production third-party delivery requires inbox activation.
});

test('buyer journey has short navigation, early proof, clear offers and ten relevant FAQs', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/');
  const links = page.locator('#navLinks > a');
  await expect(links).toHaveCount(6); // Five straightforward destinations + primary sample CTA
  await expect(page.locator('#navLinks')).toContainText('Work samples');
  await expect(page.locator('#navLinks')).toContainText('How it works');
  await expect(page.locator('#navLinks')).toContainText('Services');
  await expect(page.locator('#navLinks')).toContainText('About');
  await expect(page.locator('#navLinks')).toContainText('Get started');
  await expect(page.locator('.faq-q')).toHaveCount(10);
  await expect(page.locator('main > section')).toHaveCount(10);
  const positions = await page.evaluate(() => [...document.querySelectorAll('main > section')].map(s => s.id || s.className));
  expect(positions.indexOf('proof')).toBe(1);
  expect(positions.indexOf('offers')).toBe(7);
  await expect(page.locator('#offers .offer')).toHaveCount(3);
  const unscopedPromises = await page.locator('#deliverables').textContent();
  expect(unscopedPromises).not.toContain('12 Authority posts');
  expect(unscopedPromises).toContain('written agreement');
  await expect(page.locator('.trust-intro-item')).toHaveCount(3);
  await expect(page.locator('#proof .video-preview')).toHaveCount(4);
  await expect(page.locator('#proof .play-badge')).toHaveCount(4);
  // Every internal section link must reference an actual document target.
  const missing = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute('href').slice(1))
    .filter(id => id && !document.getElementById(id)));
  expect(missing).toEqual([]);
});

test('lead page explains actual email submission and reaches a form without false confirmation', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/ideas/');
  await expect(page.locator('h1')).toContainText("See what we'd write");
  await expect(page.locator('#ideasForm')).toHaveAttribute('data-intake-mode', 'email-fallback');
  await expect(page.locator('#sendRequest')).toContainText('Prepare My Email Request');
  await expect(page.locator('#name')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#url')).toBeVisible();
  await expect(page.locator('#offer')).toBeVisible();
  const notice=await page.locator('#ideasForm .hint').textContent();
  expect(notice).toMatch(/email|send/i);
});

test('contact page has direct founder-led contact, scoped offer, and privacy link', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/contact/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Talk to a');
  await expect(page.locator('a[href="mailto:hello@cuttavo.studio"]')).toBeVisible();
  await expect(page.getByRole('link', { name: /Request a free sample/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ask about the Sprint/i })).toBeVisible();
  await expect(page.locator('main')).toContainText('Injam Haq');
  await expect(page.locator('footer a[href="/privacy/"]')).toBeVisible();
});

test('404 page offers safe recovery and is noindexed', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("That page isn't here");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.getByRole('link', { name: /Go to homepage/i })).toHaveAttribute('href','/');
  await expect(page.getByRole('link', { name: /Contact Cuttavo/i })).toHaveAttribute('href','/contact/');
});

test('visible forms, buttons, images and document landmark have accessible essentials', async ({ browser }) => {
  for (const route of ['/', '/ideas/', '/contact/', '/privacy/', '/404.html']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 840 } });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:8000'+route);
    const issues = await page.evaluate(() => {
      const out=[];
      if (!document.querySelector('main')) out.push('missing main landmark');
      if (document.querySelectorAll('h1').length !== 1) out.push('expected one h1');
      for (const img of document.querySelectorAll('img')) if(!img.hasAttribute('alt')) out.push('image missing alt');
      for (const button of document.querySelectorAll('button')) {
        if (!button.textContent?.trim() && !button.getAttribute('aria-label')) out.push('unlabeled button');
      }
      for (const field of document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]),textarea,select')) {
        if (field.closest('[aria-hidden="true"]')) continue;
        const id=field.getAttribute('id');
        const described=id ? document.querySelector('label[for="'+id+'"]') : null;
        const wrapped=field.closest('label');
        if(!described && !wrapped && !field.getAttribute('aria-label'))out.push('unlabeled field');
      }
      return out;
    });
    expect(issues, route).toEqual([]);
    await ctx.close();
  }
});
