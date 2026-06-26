import React from 'react';
import ComponentTypes from '@theme/NavbarItem/ComponentTypes';
import styles from './navbarSummary.module.css';

// One-line summary per navbar item, keyed by its `label`. The source of truth for the hover
// popups — keep in sync with the navbar items in docusaurus.config.js. An item with no entry
// here renders normally (no popup).
const SUMMARIES: Record<string, string> = {
  Craft: 'How I see the world: durable learnings, frameworks, and strategy. The lasting lessons.',
  Journey: 'How I see myself: faith and personal growth. Durable, inward.',
  Initiatives: 'The temporal half: dated experiments, project logs, and posts. What I actually did.',
  Thoughts: 'Thoughts I have not acted on yet: ideas I might build, and questions I ask myself. Acted-on ideas graduate to Initiatives.',
  Mindset: 'The quotes and ideas that moved me.',
  Legend: 'The map for the whole site: durable vs temporal, the post-kind emoji, and the glossaries.',
  Designs: 'Full system-design write-ups: how something was architected and shipped.',
  Vote: 'Tell me which upcoming posts you want next.',
  Todos: 'A rollup of every tracked task across the site: open, done, and scheduled.',
  Support: 'Ways to support the work: the shop, GitHub, LinkedIn, and a coffee.',
};

function normalizeComponentType(type: string | undefined, props: Record<string, unknown>): string {
  if (!type || type === 'default') {
    return 'items' in props ? 'dropdown' : 'default';
  }
  return type;
}

/**
 * Swizzled @theme/NavbarItem: identical to upstream, except a navbar item whose `label` has a
 * SUMMARY gets wrapped in a small hover/focus popup describing the section. The popup is a
 * DESKTOP affordance (shown via CSS on hover + focus-within); it is suppressed on the mobile
 * nav drawer (which has no hover) and on narrow screens, so it never interferes with touch nav.
 * Accessible: the wrapper is non-focusable (the link inside keeps its own focus), and the popup
 * also appears on keyboard focus-within so a tabbing user sees it.
 */
export default function NavbarItem({type, ...props}: {type?: string} & Record<string, any>): React.JSX.Element {
  const componentType = normalizeComponentType(type, props);
  const NavbarItemComponent = (ComponentTypes as Record<string, React.ComponentType<any>>)[componentType];
  if (!NavbarItemComponent) {
    throw new Error(`No NavbarItem component found for type "${type}".`);
  }

  // An `html` navbar item (e.g. the 2-line "Thoughts & Ideas" label) has no `label` to key the
  // summary by, so it carries an explicit `data-summary-key`. Pull it out of the props before
  // rendering so it is NOT forwarded onto the DOM as an unknown attribute.
  const {'data-summary-key': summaryKey, ...rest} = props;
  const item = <NavbarItemComponent {...rest} />;
  const summaryName =
    typeof props.label === 'string' ? props.label : typeof summaryKey === 'string' ? summaryKey : undefined;
  const summary = summaryName ? SUMMARIES[summaryName] : undefined;

  // Only desktop, left-positioned primary items get the popup (skip dropdowns + right-side
  // utility controls, where a popover would be awkward).
  if (!summary || componentType === 'dropdown' || props.position === 'right') {
    return item;
  }

  return (
    <span className={styles.navItemWrap}>
      {item}
      <span className={styles.summaryPopup} role="tooltip" aria-hidden="true">
        {summary}
      </span>
    </span>
  );
}
