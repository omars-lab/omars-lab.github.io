# `make deploy` ran on whatever Node the shell had

**What happened (2026-11-05).** `make deploy` from a Claude session died at the
`build-blog-ui` step, inside `yarn add`: `serialize-javascript@7.0.5: The engine "node" is
incompatible with this module. Expected >=20.0.0. Got 18.19.0`. The repo's `.nvmrc` says 22,
but nothing read it. The shell's bare `node` on this Mac is v18, and the deploy-site skill
still said "with Node 20". The workaround was a hand-typed `env PATH=…v22…/bin:$PATH make
deploy`, which every caller had to remember.

**Why the approach changed.** Omar: "it should worry about all this". The deploy tool should
pick its own Node, not the person running it.

**What replaced it.**
- The top of the `Makefile` reads `.nvmrc` and, when nvm has that version installed, puts its
  `bin` first on `PATH` for every recipe. Any shell, any target, the right Node.
- `make node-check` is the first step of `deploy` and `deploy-check`. It fires only when the
  version is not installed, and says to `nvm install` it, instead of failing minutes later.
- The deploy-site skill now says to run `make deploy` from any shell.

Checked: from a shell with only v18 on `PATH`, `make node-check` prints `node v22.22.3`.
