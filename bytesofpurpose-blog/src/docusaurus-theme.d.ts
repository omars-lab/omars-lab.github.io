/**
 * Ambient type references for standalone `tsc` (yarn typecheck).
 *
 * Docusaurus resolves `@theme/*` / `@theme-original/*` / `@site/*` aliases at
 * BUILD time via webpack; bare `tsc` doesn't know them unless the ambient
 * declaration files shipped by these packages are pulled into the program.
 * These triple-slash references load them so swizzled theme components
 * (src/theme/**) and pages that import `@theme/Layout` typecheck. Without this,
 * every `@theme/*` import errors "Cannot find module" and `@theme/Layout`'s
 * Props (title/description/noFooter) are unknown.
 *
 * See https://docusaurus.io/docs/typescript-support.
 */

/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

// The posthog instance is stashed on window in the `loaded` callback
// (src/posthog.js) so non-module code (the bookmarklet) and runtime checks can
// reach it. Declare it so `window.posthog` typechecks.
import type {PostHog} from 'posthog-js';
declare global {
  interface Window {
    posthog?: PostHog;
  }
}
