import React from 'react';
import posthog from 'posthog-js';
import { EXPERIMENTS, resolveVariant } from '@site/src/experiments';

// The coffee CTA, wired into the support-button-copy A/B experiment. Post the
// 2026-06-01 re-scope the variants differ ONLY in PRESENTATION (identical copy):
//   control → "Buy me a coffee ☕ →"  rendered as a plain text LINK
//   test    → "Buy me a coffee ☕"    rendered as a styled BUTTON
// (the same experiment that used to drive the standalone navbar button). The copy
// lives once in src/experiments.ts (same in both arms); the conversion event keeps
// the same 'support button clicked' name so the historical funnel stays continuous.
const EXP = EXPERIMENTS['support-button-copy'];

const BUY_ME_A_COFFEE = 'https://buymeacoffee.com/omareid';

interface CoffeeButtonProps {
  // Class applied to the LINK-style (control) variant so it matches the other
  // channel CTAs. The button-style (test) variant uses Infima button classes.
  linkClassName?: string;
}

export default function CoffeeButton({ linkClassName }: CoffeeButtonProps): React.JSX.Element {
  const [variant, setVariant] = React.useState<string>('control');
  const copy = EXP.variants[variant] || EXP.variants.control;

  React.useEffect(() => resolveVariant(EXP, setVariant), []);

  const isButton = variant === 'test';

  // Link-style (control) matches the channel CTAs ("Connect on LinkedIn →"):
  // append a trailing arrow only when the copy doesn't already include one.
  const linkLabel = /[→›»]\s*$/.test(copy) ? copy : `${copy} →`;

  return (
    <a
      className={isButton ? 'button button--primary button--lg' : linkClassName}
      data-testid="support-coffee-button"
      href={BUY_ME_A_COFFEE}
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
      {isButton ? copy : linkLabel}
    </a>
  );
}
