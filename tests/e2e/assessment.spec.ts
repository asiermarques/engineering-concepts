import { expect, test, type Page } from '@playwright/test';

const open = async (page: Page, path = '/en/concepts/race-condition/') => {
  await page.goto(path);
  await expect(page.locator('.assessment')).toBeVisible();
};

async function answerAll(page: Page, mode: 'right' | 'wrong', confirmLabel = 'Confirm selection') {
  const groups = page.locator('.question');
  const count = await groups.count();
  for (let i = 0; i < count; i++) {
    const group = groups.nth(i);
    const checkboxes = group.getByRole('checkbox');
    if ((await checkboxes.count()) > 0) {
      await checkboxes.first().check();
      await group.getByRole('button', { name: confirmLabel }).click();
    } else {
      await group.locator('.option__button').nth(mode === 'right' ? 0 : 1).click();
    }
  }
}

test.describe('assessment', () => {
  test('answering a question shows the verdict and every explanation, and locks it', async ({ page }) => {
    await open(page);
    const first = page.locator('.question').first();
    const options = first.locator('.option__button');
    await options.nth(1).click();
    await expect(first.locator('.verdict')).toBeVisible();
    await expect(first.locator('.option__explanation')).toHaveCount(await first.locator('li.option').count());
    await expect(options.first()).toBeDisabled();
  });

  test('a multi-select question needs confirmation and reports missing options', async ({ page }) => {
    await open(page);
    const multi = page.locator('.question', { has: page.getByRole('checkbox') }).first();
    await expect(multi.getByText('Choose all the correct options, then confirm.')).toBeVisible();
    await expect(multi.getByRole('button', { name: 'Confirm selection' })).toBeDisabled();
    await multi.getByRole('checkbox').first().check();
    await expect(multi.locator('.verdict')).toHaveCount(0);
    await multi.getByRole('button', { name: 'Confirm selection' }).click();
    await expect(multi.locator('.verdict')).toBeVisible();
  });

  test('shows the Result after the last answer and repeating starts from scratch', async ({ page }) => {
    await open(page);
    await expect(page.locator('.assessment__result-text')).toHaveCount(0);
    await answerAll(page, 'right');
    await expect(page.locator('.assessment__result-text')).toHaveText(/^Result: \d+\/\d+$/);
    await page.getByRole('button', { name: 'Repeat assessment' }).click();
    await expect(page.locator('.assessment__result-text')).toHaveCount(0);
    await expect(page.locator('.verdict')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Assessment' })).toBeFocused();
  });

  test('is fully usable with the keyboard', async ({ page }) => {
    await open(page);
    const first = page.locator('.question').first().locator('.option__button').first();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.question').first().locator('.verdict')).toBeVisible();
  });

  test('every concept has an assessment of 3 to 5 questions in both languages', async ({ page }) => {
    const ids = ['race-condition', 'atomicity', 'synchronized-mutex', 'optimistic-locking', 'pessimistic-locking', 'idempotency', 'distributed-locking', 'transaction-isolation', 'coroutines-threads', 'fan-out-fan-in', 'concurrency-limiting', 'resilience', 'saga'];
    for (const locale of ['en', 'es']) {
      for (const id of ids) {
        await open(page, `/${locale}/concepts/${id}/`);
        const n = await page.locator('.question').count();
        expect(n, `${locale}/${id}`).toBeGreaterThanOrEqual(3);
        expect(n, `${locale}/${id}`).toBeLessThanOrEqual(5);
      }
    }
  });
});

test('Spanish assessment uses Resultado and the Spanish labels', async ({ page }) => {
  await open(page, '/es/concepts/race-condition/');
  await answerAll(page, 'right', 'Confirmar selección');
  await expect(page.locator('.assessment__result-text')).toHaveText(/^Resultado: \d+\/\d+$/);
  await expect(page.getByRole('button', { name: 'Repetir evaluación' })).toBeVisible();
});
