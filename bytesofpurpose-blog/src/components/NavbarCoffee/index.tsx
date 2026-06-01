import React from 'react';
import posthog from 'posthog-js';
import {EXPERIMENTS, resolveVariant} from '@site/src/experiments';

// The navbar "Buy Me a Coffee?" link, wired into the SAME A/B experiment as the
// docs-footer <Support/> button (flag: support-button-copy). Because the navbar
// shows on every page, the experiment is now visible site-wide (incl. the
// homepage) — and the localhost DebugMenu / ?ab-support-button-copy override
// flips it everywhere, not just on the one docs page that embeds <Support/>.
//
// Variant copy lives in src/experiments.ts:
//   control → "Buy me a coffee ☕"   test → "Support the dev 💜"
// We keep the existing .navbar-coffee styling + responsive icon/label split.
const EXP = EXPERIMENTS['support-button-copy'];

const PAYPAL =
  'https://www.paypal.com/donate?business=UQ2SHCNPFYBJY&amount=1&no_recurring=0&item_name=Support+a+Developer&currency_code=USD';

// Split a variant copy like "Buy me a coffee ☕" into a trailing/leading emoji
// (decorative icon) and the remaining words (the label). Falls back to a cup.
function splitCopy(copy: string): {icon: string; label: string} {
  const emoji = copy.match(/\p{Extended_Pictographic}/u)?.[0] ?? '☕';
  const label = copy.replace(/\p{Extended_Pictographic}/gu, '').trim();
  return {icon: emoji, label};
}

export default function NavbarCoffee(): React.JSX.Element {
  const [variant, setVariant] = React.useState<string>('control');
  const copy = EXP.variants[variant] || EXP.variants.control;
  const {icon, label} = splitCopy(copy);

  React.useEffect(() => resolveVariant(EXP, setVariant), []);

  return (
    <a
      className="navbar-coffee"
      href={PAYPAL}
      aria-label={`${label} (support via PayPal)`}
      onClick={() =>
        posthog.capture('support button clicked', {
          page_path:
            typeof window !== 'undefined' ? window.location.pathname : undefined,
          surface: 'navbar',
          // Tag the conversion with the variant so navbar + footer share the split.
          [`$feature/${EXP.key}`]: variant,
          variant,
        })
      }>
      <span className="navbar-coffee__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="navbar-coffee__label">{label}</span>
    </a>
  );
}
