import { test, expect, Page } from '@playwright/test';

/**
 * DebugMenu (dev project, :3000).
 *
 * The floating DebugMenu renders ONLY on localhost in a non-production build
 * (see src/components/DebugMenu/index.tsx — double gate). The dev server is
 * served from `localhost`, so it renders here; a production build strips it
 * entirely (asserted by build-time grep, not in e2e).
 *
 * What this proves:
 *   1. The menu appears on localhost and lists the registered experiment.
 *   2. Toggling a variant in the Experiments section ACTUALLY CHANGES the
 *      rendered UI — the <Support/> button copy flips control → test → back.
 *      This is the "switching does stuff" guarantee.
 *
 * Variant copy (flag: support-button-copy):
 *   control → "Buy me a coffee ☕"   test → "Support the dev 💜"
 */

// A docs page that embeds <Support/> (same page support-ab-test.spec.ts uses).
const PAGE_WITH_BUTTON =
  process.env.AB_PAGE ||
  '/docs/techniques/blogging-techniques/embed-structural-components/footer';

async function openMenu(page: Page) {
  const fab = page.getByRole('button', { name: 'Open debug menu' });
  await expect(fab, 'DebugMenu FAB renders on localhost').toBeVisible({ timeout: 15000 });
  await fab.click();
  await expect(page.getByRole('dialog', { name: 'Debug menu' })).toBeVisible();
}

test.describe('DebugMenu — experiments switching', () => {
  test('renders on localhost and lists the experiment', async ({ page }) => {
    await page.goto(PAGE_WITH_BUTTON, { waitUntil: 'domcontentloaded' });
    await openMenu(page);

    const dialog = page.getByRole('dialog', { name: 'Debug menu' });
    await expect(dialog).toContainText('Experiments');
    await expect(dialog).toContainText('support-button-copy');
    // Both variants are offered as toggle buttons.
    await expect(dialog.getByRole('button', { name: /control/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /test/ })).toBeVisible();
  });

  test('toggling a variant changes the rendered Support button copy', async ({ page }) => {
    await page.goto(PAGE_WITH_BUTTON, { waitUntil: 'domcontentloaded' });

    const btn = page.getByTestId('support-button');
    await expect(btn).toBeVisible();
    // Baseline: no override → control copy.
    await expect(btn).toContainText('Buy me a coffee');

    // Force "test" via the menu. The toggle writes ?ab-support-button-copy=test
    // and reloads, so the page comes back with the override applied.
    await openMenu(page);
    await page
      .getByRole('dialog', { name: 'Debug menu' })
      .getByRole('button', { name: /^test/ })
      .click();

    // After the menu-driven reload, the URL carries the override and the button
    // copy has flipped — proving the toggle drives the UI.
    await expect(page).toHaveURL(/ab-support-button-copy=test/);
    const btnAfter = page.getByTestId('support-button');
    await expect(btnAfter).toBeVisible();
    await expect(btnAfter).toContainText('Support the dev');
    await expect(btnAfter).not.toContainText('Buy me a coffee');
  });

  test('support page coffee CTA reflects the variant', async ({ page }) => {
    // The standalone navbar "coffee" button was replaced by a "Support" navbar
    // TAB → the /support page, whose Buy-Me-a-Coffee CTA now carries the SAME
    // experiment copy (support-button-copy). Assert the variant flips there.
    const coffee = page.getByTestId('support-coffee-button');

    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await expect(coffee).toBeVisible({ timeout: 15000 });
    await expect(coffee).toContainText('Buy me a coffee'); // control default

    // Force "test" straight via the URL override and reload the support page.
    await page.goto('/support?ab-support-button-copy=test', {
      waitUntil: 'domcontentloaded',
    });
    await expect(coffee).toBeVisible({ timeout: 15000 });
    await expect(coffee).toContainText('Support the dev');
    await expect(coffee).not.toContainText('Buy me a coffee');
  });

  test('clear overrides reverts to control', async ({ page }) => {
    // Start already forced to "test" via the URL override.
    await page.goto(`${PAGE_WITH_BUTTON}?ab-support-button-copy=test`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('support-button')).toContainText('Support the dev');

    await openMenu(page);
    await page
      .getByRole('dialog', { name: 'Debug menu' })
      .getByRole('button', { name: 'Clear overrides' })
      .click();

    // Clear strips the ab params and reloads → back to control copy.
    await expect(page).not.toHaveURL(/ab-support-button-copy/);
    await expect(page.getByTestId('support-button')).toContainText('Buy me a coffee');
  });
});
