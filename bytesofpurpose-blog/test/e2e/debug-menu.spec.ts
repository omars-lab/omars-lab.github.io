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
 *      rendered UI — the /support coffee CTA flips its PRESENTATION
 *      (link ↔ styled button) control → test → back. This is the
 *      "switching does stuff" guarantee.
 *
 * Variant presentation (flag: support-button-copy, re-scoped 2026-06-01):
 *   identical copy ("Buy me a $5 coffee ☕") in both arms; control renders a
 *   plain text LINK, test renders a styled BUTTON (button--primary).
 */

// The /support page hosts the coffee CTA (CoffeeButton) wired to the experiment,
// and the DebugMenu renders on every localhost page. Override with AB_PAGE.
const PAGE_WITH_BUTTON = process.env.AB_PAGE || '/support';

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

  test('toggling a variant writes the override and reloads', async ({ page }) => {
    await page.goto(PAGE_WITH_BUTTON, { waitUntil: 'domcontentloaded' });

    const btn = page.getByTestId('support-coffee-button');
    await expect(btn).toBeVisible();

    // Force "test" via the menu. The toggle writes ?ab-support-button-copy=test
    // and reloads, so the page comes back with the override applied. (The copy
    // itself is identical across arms — the support-button-copy experiment now
    // differs in PRESENTATION on the /support page, asserted separately below —
    // so here we prove the DebugMenu drives the override + reload.)
    await openMenu(page);
    await page
      .getByRole('dialog', { name: 'Debug menu' })
      .getByRole('button', { name: /^test/ })
      .click();

    await expect(page).toHaveURL(/ab-support-button-copy=test/);
    await expect(page.getByTestId('support-coffee-button')).toBeVisible();
  });

  test('support page coffee CTA reflects the variant (link vs button)', async ({ page }) => {
    // The standalone navbar "coffee" button was replaced by a "Support" navbar
    // TAB → the /support page, whose coffee CTA is wired to the same experiment.
    // Both arms use identical COPY; the experiment differs in PRESENTATION:
    //   control → plain text link (no Infima button class)
    //   test    → styled primary button (button--primary)
    const coffee = page.getByTestId('support-coffee-button');

    // Control default: a text link, NOT a button.
    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await expect(coffee).toBeVisible({ timeout: 15000 });
    await expect(coffee).toContainText('Buy me a $5 coffee');
    await expect(coffee).not.toHaveClass(/button--primary/);

    // Force "test" → the CTA becomes a styled button.
    await page.goto('/support?ab-support-button-copy=test', {
      waitUntil: 'domcontentloaded',
    });
    await expect(coffee).toBeVisible({ timeout: 15000 });
    await expect(coffee).toContainText('Buy me a $5 coffee');
    await expect(coffee).toHaveClass(/button--primary/);
  });

  test('clear overrides reverts to control', async ({ page }) => {
    // Start already forced to "test" via the URL override.
    await page.goto(`${PAGE_WITH_BUTTON}?ab-support-button-copy=test`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/ab-support-button-copy=test/);

    await openMenu(page);
    await page
      .getByRole('dialog', { name: 'Debug menu' })
      .getByRole('button', { name: 'Clear overrides' })
      .click();

    // Clear strips the ab params and reloads → back to control (no override).
    await expect(page).not.toHaveURL(/ab-support-button-copy/);
    await expect(page.getByTestId('support-coffee-button')).toBeVisible();
  });
});
