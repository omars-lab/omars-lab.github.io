import {test, expect} from '@playwright/test';

/**
 * KanbanBoard on the durable Experiments page (/craft/product-management/experiments).
 *
 * The board is generated from blog frontmatter (scripts/generate-kanban-data.js →
 * kanban-data.json) and rendered by src/components/KanbanBoard. The experiment posts stay on
 * the /initiatives blog; the board itself lives on the Craft experiments page. That page +
 * the experiment card are PUBLISHED, so this runs in both dev (:3000) and the prod build.
 *
 * Asserts the three things the board promises:
 *   1. the board renders its columns,
 *   2. an experiment card appears (the support-button-copy experiment),
 *   3. clicking a card opens the detail modal with a link to the full post.
 */

const BOARD_POST = '/craft/product-management/experiments';

test.describe('KanbanBoard — Experimentation board', () => {
  test.beforeEach(async ({page}) => {
    await page.goto(BOARD_POST, {waitUntil: 'domcontentloaded'});
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('renders the board with columns and an experiment card', async ({page}) => {
    // The board is a section labeled "Experimentation board".
    const board = page.getByRole('region', {name: /experimentation board/i});
    await expect(board).toBeVisible();

    // The "Running" column exists (the support-button-copy experiment is stage: running).
    await expect(board.getByText('Running', {exact: false})).toBeVisible();

    // The experiment card is present (its title).
    await expect(board.getByText('Support CTA: link vs button')).toBeVisible();
  });

  test('clicking a card opens the modal with a link to the post', async ({page}) => {
    const board = page.getByRole('region', {name: /experimentation board/i});
    await board.getByText('Support CTA: link vs button').click();

    // The modal is a dialog.
    const dialog = page.getByRole('dialog', {name: /card details/i});
    await expect(dialog).toBeVisible();

    // It links to the full post.
    const link = dialog.getByRole('link', {name: /read the full post/i});
    await expect(link).toHaveAttribute('href', /\/initiatives\/support-button-copy/);

    // Escape closes it.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
