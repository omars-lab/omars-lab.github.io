import React from 'react';
import posthog from 'posthog-js';
import {EXPERIMENTS, resolveVariant} from '@site/src/experiments';
import {EspressoIcon} from './EspressoIcon';

// A/B experiment: which Support button copy drives more clicks?
//   control = "Donate $5 for ☕️ in Paypal →"  |  test = "Buy me a $5 coffee ☕"
// Variant resolution (incl. the localhost ?ab= URL override that works across
// all experiments) lives in src/experiments.ts. See the design doc
// (designs/*-ab-testing-framework.mdx) and the run-ab-test skill.
const EXP = EXPERIMENTS['support-button-copy'];

interface SupportProps {
  /** Optional label override; falls back to the A/B variant copy. */
  children?: React.ReactNode;
}

export const Support = ({children}: SupportProps) => {
  const [variant, setVariant] = React.useState<string>('control');
  const label = EXP.variants[variant] || EXP.variants.control;

  React.useEffect(() => resolveVariant(EXP, setVariant), []);

  return (
    <form
      action="https://www.paypal.com/donate"
      method="post"
      target="_top"
      onSubmit={() =>
        posthog.capture('support button clicked', {
          page_path: window.location.pathname,
          // Tag the conversion with the variant so we can measure the split.
          [`$feature/${EXP.key}`]: variant,
          variant,
        })
      }
    >
      <input type="hidden" name="business" value="UQ2SHCNPFYBJY" />
      <input type="hidden" name="amount" value="1" />
      <input type="hidden" name="no_recurring" value="0" />
      <input type="hidden" name="item_name" value="Support a Developer" />
      <input type="hidden" name="currency_code" value="USD" />
      <button type="submit" className="button button--primary" data-testid="support-button">
        <EspressoIcon />
        {children || label}
      </button>
      {/* PayPal 1×1 tracking pixel. `border` is a deprecated HTML attr (not a
          valid React img prop), so drop it; a 1×1 pixel has no visible border. */}
      <img alt="" style={{border: 0}} src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
    </form>
  );
};
