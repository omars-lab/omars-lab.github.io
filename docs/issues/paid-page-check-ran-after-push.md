# The paid-page check ran after the push

## What happened

On 2026-11-05 a deploy shipped the paid test page (`docs/craft/premium-gating-demo.mdx`)
unlocked to gh-pages. The check that looks for a paid page's text in the build
(`scripts/verify-premium-encrypted.js`, "V5") caught it, but only after the push, so the
page was already public.

## Why

`make deploy` did these steps in this order:

1. read the passphrase from `.env`;
2. count paid pages with `premium-docs.js --count 2>/dev/null || echo 0`;
3. `yarn deploy`, which is `docusaurus deploy`: it builds **and** pushes in one step;
4. V5 on the `build/` folder.

Three gaps:

- **The check came after the push.** By step 4 the site was already live.
- **The count failed open.** If `premium-docs.js` errored, the count read as 0, and the
  "paid pages but no passphrase" stop never fired.
- **The build inside `docusaurus deploy` used the caches as they were.** A stale
  `.docusaurus` or webpack production cache skips the step that locks paid pages
  (`plugins/rehype-premium-encrypt.js`), so the page goes out as plain text even with the
  passphrase set.

The skill also said `docusaurus deploy` "ignores a prebuilt build/". That is wrong:
Docusaurus 3.9.1 has `--skip-build`, which pushes the `build/` folder already there.

## What replaced it

`.claude/skills/deploy-site/scripts/deploy.sh`, called by `make deploy`:

1. count paid pages, and stop if the count itself fails;
2. stop if there are paid pages and no passphrase;
3. clear `.docusaurus`, `build/` and only the production webpack caches (the development
   ones belong to running dev servers that share `node_modules`);
4. build once;
5. run V5 on that build, and stop with "nothing was pushed" if it fails;
6. push that same build with `docusaurus deploy --skip-build`.

`make deploy-check` runs steps 1 to 5 and pushes nothing.

The `.githooks/pre-push` hook still runs V5 on pushes of the source repo. It never covered the
gh-pages push, which Docusaurus makes from its own temporary clone, so the script is the gate
for that push.
