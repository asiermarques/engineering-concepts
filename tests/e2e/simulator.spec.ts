import { expect, test, type Page } from '@playwright/test';

const OPTIMISTIC = '/en/concepts/optimistic-locking/';

/** The 9 Concepts whose Static walkthrough became a Simulator (requirement 003). */
const SIMULATED = [
  'race-condition',
  'optimistic-locking',
  'pessimistic-locking',
  'distributed-locking',
  'transaction-isolation',
  'coroutines-threads',
  'concurrency-limiting',
  'fan-out-fan-in',
  'saga',
];

const simulator = (page: Page) => page.locator('.simulator').first();
const button = (page: Page, name: string) => simulator(page).getByRole('button', { name, exact: true });

async function open(page: Page, path = OPTIMISTIC) {
  await page.goto(path);
  await expect(simulator(page).locator('.simulator__counter')).toBeVisible();
}

test.describe('simulator', () => {
  test('starts on step 1 with only step 1 revealed, its state and Previous disabled', async ({ page }) => {
    await open(page);
    const sim = simulator(page);
    await expect(sim.locator('figcaption')).toContainText('Two clients edit the same account');
    await expect(sim.locator('.simulator__counter')).toHaveText('Step 1/6');
    await expect(sim.locator('tbody tr')).toHaveCount(1);
    await expect(sim.locator('tbody tr[aria-current="step"]')).toContainText('read: balance 100, version 3');
    await expect(sim.locator('.simulator__state')).toContainText('version 3');
    await expect(button(page, 'Previous')).toBeDisabled();
    await expect(button(page, 'Next')).toBeEnabled();
  });

  test('Next reveals and highlights the next step, with its state and its note', async ({ page }) => {
    await open(page);
    const sim = simulator(page);
    for (let i = 0; i < 3; i++) await button(page, 'Next').click();
    await expect(sim.locator('.simulator__counter')).toHaveText('Step 4/6');
    await expect(sim.locator('tbody tr')).toHaveCount(4);
    const current = sim.locator('tbody tr[aria-current="step"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText('0 rows (conflict)');
    await expect(sim.locator('.simulator__state')).toContainText('conflict');
    await expect(sim.locator('.simulator__note')).toContainText('0 affected rows');
  });

  test('Restart on the last step returns to step 1 with only step 1 revealed', async ({ page }) => {
    await open(page);
    for (let i = 0; i < 5; i++) await button(page, 'Next').click();
    await expect(button(page, 'Next')).toBeDisabled();
    await button(page, 'Restart').click();
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 1/6');
    await expect(simulator(page).locator('tbody tr')).toHaveCount(1);
  });

  test('is operable with the keyboard and announces each step change', async ({ page }) => {
    await open(page);
    const next = button(page, 'Next');
    await next.focus();
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    const live = simulator(page).locator('[aria-live="polite"]');
    await expect(live).toContainText('Step 2 of 6');
    await expect(live).toContainText('Client B: read: balance 100, version 3');
    await page.keyboard.press('Shift+Tab');
    await expect(button(page, 'Play')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(button(page, 'Previous')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(live).toContainText('Step 1 of 6');
  });

  test('starts again on step 1 after a reload or a locale switch and leaves Progress untouched', async ({ page }) => {
    await open(page);
    const before = await page.evaluate(() => localStorage.getItem('engineering-concepts:progress'));
    await button(page, 'Next').click();
    await button(page, 'Next').click();
    await page.reload();
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 1/6');
    await page.getByRole('link', { name: 'Español' }).click();
    await expect(page).toHaveURL(/\/es\/concepts\/optimistic-locking\/$/);
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Paso 1/6');
    expect(await page.evaluate(() => localStorage.getItem('engineering-concepts:progress'))).toBe(before);
  });

  test('lanes are readable at 360 px without horizontal page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page);
    for (let i = 0; i < 5; i++) await button(page, 'Next').click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await simulator(page).boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  });

  test('every simulated Concept shows a Simulator on step 1 in both locales', async ({ page }) => {
    for (const locale of ['en', 'es']) {
      for (const id of SIMULATED) {
        await open(page, `/${locale}/concepts/${id}/`);
        await expect(simulator(page).locator('.simulator__counter')).toHaveText(new RegExp(`^(Step|Paso) 1/\\d+$`));
        await expect(simulator(page).locator('.simulator__state')).not.toBeEmpty();
        await expect(simulator(page).locator('figcaption')).not.toBeEmpty();
      }
    }
  });
});

test.describe('simulator content', () => {
  test('Concurrency limiting shows 0 free permits and the waiting or rejected requests once all permits are in use', async ({ page }) => {
    await open(page, '/en/concepts/concurrency-limiting/');
    const state = simulator(page).locator('.simulator__state');
    while (!/Free permits: 0/.test((await state.textContent()) ?? '')) await button(page, 'Next').click();
    await expect(state).toContainText('Free permits: 0');
    await expect(state).toContainText(/waiting: 4|rejected: 4/);
  });

  test('Saga: at the failed shipment payment is charged and stock reserved; then refund, then stock release', async ({ page }) => {
    await open(page, '/en/concepts/saga/');
    const sim = simulator(page);
    const state = sim.locator('.simulator__state');
    while (!/fails/.test((await sim.locator('tbody tr[aria-current="step"]').textContent()) ?? '')) {
      await button(page, 'Next').click();
    }
    await expect(state).toContainText(/payment charged/i);
    await expect(state).toContainText(/stock reserved/i);
    await button(page, 'Next').click();
    await expect(sim.locator('tbody tr[aria-current="step"]')).toContainText('refund');
    await expect(state).toContainText(/payment refunded/i);
    await button(page, 'Next').click();
    await expect(sim.locator('tbody tr[aria-current="step"]')).toContainText('release');
    await expect(state).toContainText(/stock released/i);
  });
});

test.describe('simulator autoplay', () => {
  test('Play advances at a fixed pace and stops on the last step with Next disabled and Play shown again', async ({ page }) => {
    await page.clock.install();
    await open(page);
    await button(page, 'Play').click();
    await expect(button(page, 'Pause')).toBeVisible();
    await expect(simulator(page).locator('[aria-live="polite"]')).toContainText('Playing');
    await page.clock.runFor(1600);
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 2/6');
    await page.clock.runFor(1600 * 6);
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 6/6');
    await expect(button(page, 'Next')).toBeDisabled();
    await expect(button(page, 'Play')).toBeVisible();
  });

  test('Previous during autoplay pauses and goes back one step', async ({ page }) => {
    await page.clock.install();
    await open(page);
    await button(page, 'Play').click();
    await page.clock.runFor(1600 * 2);
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 3/6');
    await button(page, 'Previous').click();
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 2/6');
    await expect(button(page, 'Play')).toBeVisible();
    await page.clock.runFor(1600 * 3);
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 2/6');
  });

  test('never starts on its own', async ({ page }) => {
    await page.clock.install();
    await open(page);
    await page.clock.runFor(10_000);
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 1/6');
  });

  test('with reduced motion steps still advance, without transition animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await open(page);
    await button(page, 'Play').click();
    await page.clock.runFor(1600);
    await expect(simulator(page).locator('.simulator__counter')).toHaveText('Step 2/6');
    const animation = await simulator(page)
      .locator('tbody tr[aria-current="step"]')
      .evaluate((row) => getComputedStyle(row).animationName);
    expect(animation).toBe('none');
  });
});

test.describe('simulator without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Optimistic locking shows the Static walkthrough with every step, its state and its notes', async ({ page }) => {
    await page.goto('/es/concepts/optimistic-locking/');
    const walkthrough = page.locator('figure.walkthrough');
    await expect(walkthrough.locator('figcaption')).toContainText('Dos clientes editan la misma cuenta');
    await expect(walkthrough.locator('thead th').last()).toHaveText('Estado');
    await expect(walkthrough.locator('tbody tr.walkthrough__step')).toHaveCount(6);
    await expect(walkthrough.locator('tbody tr.walkthrough__step td.walkthrough__state').last()).toContainText('versión 5');
    expect(await walkthrough.locator('tbody .walkthrough__note').count()).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.simulator__counter')).toHaveCount(0);
  });

  test('every simulated Concept shows its Static walkthrough with a state for every step', async ({ page }) => {
    for (const id of SIMULATED) {
      await page.goto(`/en/concepts/${id}/`);
      const walkthrough = page.locator('figure.walkthrough');
      const steps = walkthrough.locator('tbody tr.walkthrough__step');
      expect(await steps.count()).toBeGreaterThanOrEqual(2);
      expect(await walkthrough.locator('td.walkthrough__state').count()).toBe(await steps.count());
    }
  });
});
