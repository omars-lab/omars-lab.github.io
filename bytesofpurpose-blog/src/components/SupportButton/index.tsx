import React from 'react';
import posthog from 'posthog-js';
import {EXPERIMENTS, resolveVariant} from '@site/src/experiments';
import {EspressoIcon} from './EspressoIcon';

// A/B experiment: which Support button copy drives more clicks?
//   control = "Buy me a coffee ☕"  |  test = "Buy me a coffee ☕"
// Variant resolution (incl. the localhost ?ab= URL override that works across
// all experiments) lives in src/experiments.ts. See the design doc
// (designs/*-ab-testing-framework.mdx) and the run-ab-test skill.
// The CTA links to Buy Me a Coffee (was a PayPal donate form).
const EXP = EXPERIMENTS['support-button-copy'];

const BUY_ME_A_COFFEE = 'https://buymeacoffee.com/omareid';

interface SupportProps {
  /** Optional label override; falls back to the A/B variant copy. */
  children?: React.ReactNode;
}

export const Support = ({children}: SupportProps) => {
  const [variant, setVariant] = React.useState<string>('control');
  const label = EXP.variants[variant] || EXP.variants.control;

  React.useEffect(() => resolveVariant(EXP, setVariant), []);

  return (
    <a
      className="button button--primary"
      data-testid="support-button"
      href={BUY_ME_A_COFFEE}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        posthog.capture('support button clicked', {
          page_path: window.location.pathname,
          // Tag the conversion with the variant so we can measure the split.
          [`$feature/${EXP.key}`]: variant,
          variant,
        })
      }
    >
      <EspressoIcon />
      {children || label}
    </a>
  );
};
