import React from 'react';
import posthog from 'posthog-js';
import { EXPERIMENTS, resolveVariant } from '@site/src/experiments';

// The "Buy Me a Coffee" CTA, wired into the support-button-copy A/B experiment
// (control "Buy me a coffee ☕" / test "Support the dev 💜"). This is the same
// experiment that used to drive the standalone navbar button (NavbarCoffee) —
// it now lives on the dedicated /support page's coffee CTA instead.
//
// Variant copy lives in src/experiments.ts. The conversion event keeps the same
// 'support button clicked' name so the historical funnel is continuous; only the
// surface tag changes to 'support-page'.
const EXP = EXPERIMENTS['support-button-copy'];

const PAYPAL =
  'https://www.paypal.com/donate?business=UQ2SHCNPFYBJY&amount=1&no_recurring=0&item_name=Support+a+Developer&currency_code=USD';

export default function CoffeeButton(): JSX.Element {
  const [variant, setVariant] = React.useState<string>('control');
  const copy = EXP.variants[variant] || EXP.variants.control;

  React.useEffect(() => resolveVariant(EXP, setVariant), []);

  return (
    <a
      className="button button--primary button--lg"
      data-testid="support-coffee-button"
      href={PAYPAL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        posthog.capture('support button clicked', {
          page_path:
            typeof window !== 'undefined' ? window.location.pathname : undefined,
          surface: 'support-page',
          [`$feature/${EXP.key}`]: variant,
          variant,
        })
      }
    >
      {copy}
    </a>
  );
}
