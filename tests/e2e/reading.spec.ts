import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('root lists the topics as cards and a card leads to its topic', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose a topic');
    const cards = page.locator('[data-testid="topic-list"] > li');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('13 concepts');
    await cards.first().getByRole('link', { name: 'Concurrency and consistency in backend' }).click();
    await expect(page).toHaveURL(/\/en\/topics\/backend-concurrency\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Concurrency and consistency in backend');
  });

  test('language switcher on the root leads to the Spanish home page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Español' }).click();
    await expect(page).toHaveURL(/\/es\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Elige un tema');
    await expect(page.getByRole('link', { name: 'Concurrencia y consistencia en backend' })).toBeVisible();
  });
});

test.describe('topic page', () => {
  test('shows the concepts in order with their learning objectives', async ({ page }) => {
    await page.goto('/en/topics/backend-concurrency/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Concurrency and consistency in backend');
    const titles = await page.locator('[data-testid="concept-list"] > li h2').allTextContents();
    expect(titles).toHaveLength(13);
    expect(titles.slice(0, 3)).toEqual(['Race condition', 'Atomicity', 'Synchronized and mutex']);
    expect(titles.at(-1)).toBe('Saga');
    await expect(page.getByText('Explain why reading, checking and writing is not safe.')).toBeVisible();
  });

  test('keeps the same topic when switching language and links back to the home page', async ({ page }) => {
    await page.goto('/en/topics/backend-concurrency/');
    await page.getByRole('link', { name: 'Español' }).click();
    await expect(page).toHaveURL(/\/es\/topics\/backend-concurrency\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Concurrencia y consistencia en backend');
    await page.getByRole('link', { name: 'Todos los temas' }).click();
    await expect(page).toHaveURL(/\/es\/$/);
  });
});

test.describe('concept page', () => {
  test('keeps the same concept when switching language', async ({ page }) => {
    await page.goto('/en/concepts/race-condition/');
    await page.getByRole('link', { name: 'Español' }).click();
    await expect(page).toHaveURL(/\/es\/concepts\/race-condition\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Race condition');
    await expect(page.getByRole('heading', { name: 'Evaluación' })).toBeVisible();
  });

  test('language switcher is reachable with the keyboard and marks the current language without color', async ({ page }) => {
    await page.goto('/en/concepts/race-condition/');
    const current = page.locator('[data-testid="language-switcher"] [aria-current="true"]');
    await expect(current).toHaveText(/English/);
    await expect(current).toContainText('current language');
    const spanish = page.getByRole('link', { name: 'Español' });
    for (let i = 0; i < 5 && !(await spanish.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(spanish).toBeFocused();
  });

  test('navigates to the next and the previous concept', async ({ page }) => {
    await page.goto('/en/concepts/race-condition/');
    const nav = page.getByRole('navigation', { name: 'Concept navigation' });
    await expect(nav.getByRole('link', { name: /Previous/ })).toHaveCount(0);
    await nav.getByRole('link', { name: /Next: Atomicity/ }).click();
    await expect(page).toHaveURL(/\/en\/concepts\/atomicity\/$/);
    await page.getByRole('navigation', { name: 'Concept navigation' }).getByRole('link', { name: /Previous: Race condition/ }).click();
    await expect(page).toHaveURL(/\/en\/concepts\/race-condition\/$/);
  });

  test('links back to its topic', async ({ page }) => {
    await page.goto('/en/concepts/atomicity/');
    await page.getByRole('link', { name: 'All concepts' }).click();
    await expect(page).toHaveURL(/\/en\/topics\/backend-concurrency\/$/);
  });

  test('the last concept has no next link', async ({ page }) => {
    await page.goto('/es/concepts/saga/');
    const nav = page.getByRole('navigation', { name: 'Navegación entre conceptos' });
    await expect(nav.getByRole('link', { name: /Siguiente/ })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /Anterior/ })).toHaveCount(1);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('reading works: code is highlighted, tables render, and the assessment warns', async ({ page }) => {
    await page.goto('/en/concepts/race-condition/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Race condition');
    await expect(page.locator('pre.astro-code').first()).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
    // Playwright's text engine skips <noscript> descendants, so assert on the element itself.
    const notice = page.locator('.assessment-section .notice');
    await expect(notice).toBeVisible();
    expect(await notice.textContent()).toContain('The assessment needs JavaScript');
    await expect(page.locator('.assessment')).toHaveCount(0);
  });

  test('the static walkthrough of the Optimistic locking simulation is complete in Spanish', async ({ page }) => {
    await page.goto('/es/concepts/optimistic-locking/');
    const walkthrough = page.locator('figure.walkthrough');
    await expect(walkthrough.locator('tbody tr').first()).toBeVisible();
    expect(await walkthrough.locator('tbody tr').count()).toBeGreaterThanOrEqual(5);
    await expect(walkthrough.locator('figcaption')).not.toBeEmpty();
  });
});
