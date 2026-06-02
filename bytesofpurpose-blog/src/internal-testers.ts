// Internal-tester roster for analytics filtering.
//
// Once a reader signs in (Phase D), src/posthog.js fetches /api/me and, if the
// signed-in email is on this list, registers `is_internal: true` as a PostHog
// super property — so the author's and testers' own traffic is hidden from
// reports by the project's internal-user filter. This is the email-keyed layer;
// the browser-keyed layer (?internal=1 → localStorage `bop_internal`) lives in
// src/posthog.js and works before sign-in.
//
// Add a tester by appending their sign-in email here. Case-insensitive.
export const INTERNAL_TESTER_EMAILS: ReadonlyArray<string> = [
  'omar_eid21@yahoo.com',
];

export const isInternalTester = (email: string): boolean =>
  INTERNAL_TESTER_EMAILS.some((x) => x.toLowerCase() === email.toLowerCase());
