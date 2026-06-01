import React from 'react';
import posthog from 'posthog-js';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

// Draggable "Bookmark BytesOfPurpose" affordance.
//
// The link's href is a `javascript:` BOOKMARKLET. A page cannot auto-install a
// bookmarklet (proven — see src/ingress-attribution-plan.md + test/e2e/bookmarklet-proof),
// so the user must DRAG this to their bookmarks bar. Clicking it would just run the JS
// in-place (confusing), so we intercept the click and show a drag-instructions modal.
//
// When later clicked FROM the bookmarks bar, the bookmarklet pings PostHog and
// redirects to the page with ?im=bookmarklet, which the ingress reader attributes.

// The bookmarklet body, minified into a single javascript: URL. When clicked from the
// bookmarks bar it:
//   1. sendBeacon()s a `bookmarklet_used` event STRAIGHT to PostHog ingestion — proven
//      to return {"status":"Ok"} (see test/e2e/bookmarklet-proof + the curl proof). This
//      survives the imminent navigation and captures the click even if the user was on
//      another origin where window.posthog doesn't exist.
//   2. redirects to the BytesOfPurpose page with ?im=bookmarklet, which the ingress
//      reader (src/posthog.js) also attributes as an `ingress` event, then strips.
// The PostHog project key is public/write-only, so embedding it in the bookmarklet is
// safe (same key already shipped in the client bundle).
function buildBookmarkletHref(key: string, host: string, home: string): string {
  // Build the JSON payload at click time so distinct_id/url reflect the moment.
  const beacon =
    'navigator.sendBeacon&&navigator.sendBeacon(' +
    JSON.stringify(host + '/i/v0/e/') +
    ',new Blob([JSON.stringify({api_key:' +
    JSON.stringify(key) +
    ',event:"bookmarklet_used",distinct_id:"bookmarklet-"+Date.now(),' +
    'properties:{from:location.href,$lib:"bookmarklet"}})],{type:"application/json"}));';
  const redirect = 'location.href=' + JSON.stringify(home) + '+"?im=bookmarklet";';
  const body = '(function(){try{' + beacon + redirect + '}catch(e){}})();';
  return 'javascript:' + body; // eslint-disable-line no-script-url
}

function BookmarkletButtonImpl(): JSX.Element {
  const [showHelp, setShowHelp] = React.useState(false);
  const {siteConfig} = useDocusaurusContext();
  const {posthogKey, posthogHost} = (siteConfig.customFields || {}) as {
    posthogKey?: string;
    posthogHost?: string;
  };
  // The bookmarklet should always return the user to the live site, even if they click
  // it while on another origin — so target the production URL, not location.origin.
  const home = siteConfig.url + (siteConfig.baseUrl || '/').replace(/\/$/, '');
  const href = buildBookmarkletHref(
    posthogKey || '',
    posthogHost || 'https://us.i.posthog.com',
    home,
  );

  // React (18+) blocks `javascript:` URLs passed to href via JSX (replaces them with a
  // security-error string). Assign the bookmarklet href imperatively via refs after
  // mount — setAttribute is not sanitized, and a real saved bookmarklet must be a
  // javascript: URL. (Verified by test/e2e ingress-attribution bookmarklet tests.)
  const primaryRef = React.useRef<HTMLAnchorElement>(null);
  const targetRef = React.useRef<HTMLAnchorElement>(null);
  React.useEffect(() => {
    primaryRef.current?.setAttribute('href', href);
    targetRef.current?.setAttribute('href', href);
  }, [href, showHelp]);

  const onClick = (e: React.MouseEvent) => {
    // Clicking runs the bookmarklet in-place (not useful) — intercept and teach the
    // user to DRAG it instead.
    e.preventDefault();
    setShowHelp(true);
    posthog.capture('bookmarklet_help_opened', {path: window.location.pathname});
  };

  const onDragStart = () => {
    posthog.capture('bookmarklet_dragged', {path: window.location.pathname});
  };

  return (
    <>
      <a
        ref={primaryRef}
        className={styles.btn}
        draggable
        onClick={onClick}
        onDragStart={onDragStart}
        title="Drag me to your bookmarks bar"
        data-testid="bookmarklet-btn">
        <span className={styles.pin} aria-hidden="true">🔖</span>
        Bookmark BytesOfPurpose
      </a>

      {showHelp && (
        <div
          className={styles.overlay}
          onClick={() => setShowHelp(false)}
          data-testid="bookmarklet-modal">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.close}
              onClick={() => setShowHelp(false)}
              aria-label="Close">
              ×
            </button>
            <h3 className={styles.title}>Save this bookmarklet</h3>
            <p className={styles.body}>
              <strong>Drag</strong> the button below up to your{' '}
              <strong>bookmarks bar</strong> 👆 to save it. Clicking it there later brings
              you back here — and helps us see that bookmarks bring readers back.
            </p>
            <div className={styles.pointer} aria-hidden="true">⤴︎</div>
            <a
              ref={targetRef}
              className={styles.dragTarget}
              draggable
              onClick={(e) => e.preventDefault()}
              onDragStart={onDragStart}
              data-testid="bookmarklet-drag-target">
              <span className={styles.pin} aria-hidden="true">🔖</span>
              Bookmark BytesOfPurpose
            </a>
            <p className={styles.hint}>
              No bookmarks bar visible? Press{' '}
              <kbd>⌘</kbd>
              <kbd>⇧</kbd>
              <kbd>B</kbd> (or <kbd>Ctrl</kbd>
              <kbd>⇧</kbd>
              <kbd>B</kbd>) to show it.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Client-only: the href embeds window.location.origin and it reacts to runtime clicks.
export default function BookmarkletButton(): JSX.Element {
  return <BrowserOnly>{() => <BookmarkletButtonImpl />}</BrowserOnly>;
}
