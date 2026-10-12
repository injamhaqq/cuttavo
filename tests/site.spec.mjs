import { test, expect } from '@playwright/test';

const widths = [375, 768, 1440];
const pages = ['/', '/ideas/', '/privacy/'];

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
      await page.screenshot({ path: `artifacts/${route.replaceAll('/', '') || 'home'}-${width}.png`, fullPage: true });
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
  await expect(page.locator('#sendRequest')).toHaveText(/Submit My Free Sample Request/);
  await page.locator('#name').fill('Test Visitor');
  await page.locator('#email').fill('sample@example.com');
  await page.locator('#offer').fill('Leadership coaching for senior managers');
  await page.locator('#buyerQuestion').fill('How is this different?');
  await page.locator('#consent').check();
  await page.locator('#copyRequest').click();
  await expect(page.locator('#status')).not.toBeEmpty();
  // Do not click Submit: production third-party delivery requires inbox activation.
});
