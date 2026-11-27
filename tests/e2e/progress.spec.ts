import { expect, test, type Page } from '@playwright/test';

const OPTIMISTIC = '/en/concepts/optimistic-locking/';
const TOPIC = '/en/topics/backend-concurrency/';

const open = async (page: Page, path: string) => {
  await page.goto(path);
  await expect(page.locator('.assessment')).toBeVisible();
};

/** Answers the first `count` questions, always choosing each question's first option. */
async function answerFirstQuestions(page: Page, count: number) {
  const groups = page.locator('.question');
  for (let i = 0; i < count; i++) {
    const group = groups.nth(i);
    const boxes = group.getByRole('checkbox');
    if ((await boxes.count()) > 0) {
      await boxes.first().check();
      await group.getByRole('button', { name: /Confirm selection|Confirmar selección/ }).click();
    } else {
      await group.locator('.option__button').first().click();
    }
  }
}

test.describe('saved progress', () => {
  test('a half-done assessment survives a reload and a locale switch', async ({ page }) => {
    await open(page, OPTIMISTIC);
    await answerFirstQuestions(page, 2);
    await expect(page.locator('.verdict')).toHaveCount(2);

    await page.reload();
    await expect(page.locator('.assessment')).toBeVisible();
    await expect(page.locator('.verdict')).toHaveCount(2);
    await expect(page.locator('.question').first().locator('.option__explanation').first()).toBeVisible();

    await page.getByRole('link', { name: 'Español' }).click();
    await expect(page.locator('.assessment')).toBeVisible();
    await expect(page.locator('.verdict')).toHaveCount(2);
  });

  test('retrying clears the answers but a completed assessment shows its Result after reload', async ({ page }) => {
    await open(page, OPTIMISTIC);
    const total = await page.locator('.question').count();
    await answerFirstQuestions(page, total);
    await expect(page.locator('.assessment__result-text')).toBeVisible();
    await page.reload();
    await expect(page.locator('.assessment__result-text')).toBeVisible();

    await page.getByRole('button', { name: 'Repeat assessment' }).click();
    await page.reload();
    await expect(page.locator('.assessment')).toBeVisible();
    await expect(page.locator('.verdict')).toHaveCount(0);
  });

  test('the topic map shows mastered, in progress and not started concepts, and the home card counts mastered', async ({ page }) => {
    // Seed saved Progress the way the site stores it: one mastered, one in progress.
    await page.goto('/en/');
    await page.evaluate(() => {
      localStorage.setItem(
        'engineering-concepts:progress',
        JSON.stringify({
          version: 1,
          concepts: {
            'race-condition': { answers: {}, last: { correct: 2, total: 4 }, best: { correct: 4, total: 4 } },
            atomicity: { answers: { 'unknown-challenge': ['a'] }, last: null, best: null },
          },
        }),
      );
    });
    await page.reload();
    await expect(page.locator('[data-testid="topic-mastered"]').first()).toHaveText('1/13 mastered');

    await page.goto(TOPIC);
    const status = (id: string) => page.locator(`[data-concept-id="${id}"] [data-testid="concept-status"]`);
    await expect(status('race-condition')).toContainText('Mastered');
    await expect(status('race-condition')).toContainText('2/4');
    await expect(page.locator('[data-concept-id="race-condition"]')).toHaveAttribute('data-status', 'mastered');
    await expect(status('atomicity')).toContainText('In progress');
    await expect(status('saga')).toContainText('Not started');
  });

  test('completing an assessment is reflected on the topic map', async ({ page }) => {
    await open(page, OPTIMISTIC);
    await answerFirstQuestions(page, 1);
    await page.goto(TOPIC);
    await expect(page.locator('[data-concept-id="optimistic-locking"] [data-testid="concept-status"]')).toContainText('In progress');
  });

  test('without JavaScript the topic map and home cards stay readable without status', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(TOPIC);
    await expect(page.locator('[data-testid="concept-list"] > li')).toHaveCount(13);
    await expect(page.locator('[data-testid="concept-status"]').first()).toBeHidden();
    await page.goto('/en/');
    await expect(page.locator('[data-testid="topic-mastered"]').first()).toBeHidden();
    await context.close();
  });

  test('blocked storage shows a notice and the assessment still works', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    const page = await context.newPage();
    await open(page, '/en/concepts/race-condition/');
    await expect(page.getByText("Progress can't be saved in this browser", { exact: false })).toBeVisible();
    await answerFirstQuestions(page, 1);
    await expect(page.locator('.verdict')).toHaveCount(1);
    await context.close();
  });

  test('no notice appears when storage works', async ({ page }) => {
    await open(page, '/en/concepts/race-condition/');
    await expect(page.getByText("Progress can't be saved", { exact: false })).toHaveCount(0);
  });
});

test.describe('progress panel', () => {
  const seed = async (page: Page) => {
    await page.goto('/en/');
    await page.evaluate(() =>
      localStorage.setItem(
        'engineering-concepts:progress',
        JSON.stringify({ version: 1, concepts: { 'race-condition': { answers: {}, last: { correct: 4, total: 4 }, best: { correct: 4, total: 4 } } } }),
      ),
    );
    await page.reload();
    await expect(page.locator('[data-testid="topic-mastered"]').first()).toHaveText('1/13 mastered');
  };

  test('reset needs an in-page confirmation and can be cancelled', async ({ page }) => {
    await seed(page);
    await page.getByRole('button', { name: 'Reset progress' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('[data-testid="topic-mastered"]').first()).toHaveText('1/13 mastered');

    await page.getByRole('button', { name: 'Reset progress' }).click();
    await page.getByRole('button', { name: 'Yes, reset' }).click();
    await expect(page.locator('[data-testid="topic-mastered"]').first()).toHaveText('0/13 mastered');
    await page.goto(TOPIC);
    await expect(page.locator('[data-concept-id="race-condition"] [data-testid="concept-status"]')).toContainText('Not started');
  });

  test('reset is operable with the keyboard only (Spanish)', async ({ page }) => {
    await page.goto('/es/');
    await page.evaluate(() =>
      localStorage.setItem(
        'engineering-concepts:progress',
        JSON.stringify({ version: 1, concepts: { 'race-condition': { answers: {}, last: { correct: 1, total: 1 }, best: { correct: 1, total: 1 } } } }),
      ),
    );
    await page.reload();
    await page.getByRole('button', { name: 'Reiniciar progreso' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="topic-mastered"]').first()).toHaveText('0/13 dominados');
  });

  test('exports the progress and imports it in another browser, rejecting invalid files', async ({ page, browser }) => {
    await seed(page);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export progress' }).click()]);
    const path = await download.path();
    const fs = await import('node:fs');
    const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
    expect(Object.keys(exported).sort()).toEqual(['concepts', 'version']);

    const other = await (await browser.newContext()).newPage();
    await other.goto('/en/');
    await expect(other.locator('[data-testid="topic-mastered"]').first()).toHaveText('0/13 mastered');
    await other.locator('input[type="file"]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('nope') });
    await expect(other.getByText("This file can't be imported", { exact: false })).toBeVisible();
    await expect(other.locator('[data-testid="topic-mastered"]').first()).toHaveText('0/13 mastered');

    await other.locator('input[type="file"]').setInputFiles(path);
    await other.getByRole('button', { name: 'Yes, import' }).click();
    await expect(other.locator('[data-testid="topic-mastered"]').first()).toHaveText('1/13 mastered');
    await other.goto(TOPIC);
    await expect(other.locator('[data-concept-id="race-condition"] [data-testid="concept-status"]')).toContainText('Mastered');
  });
});
