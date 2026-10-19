# Contributing to pttrn

pttrn is the Pattern Design System: `@ptrn/react`, `@ptrn/web`, `@ptrn/icons`, `@ptrn/styles`, `@ptrn/mcp`, the docs site that dogfoods them, and the Figma plugin that exports the tokens. It is one npm workspace, so one clone and one `npm ci` gives you everything.

## Names

- `pttrn` is the name everywhere: the repository, the site, prose, `data-pttrn` attributes, events, and custom element tags.
- `@ptrn` is only the npm scope, because `pttrn` was taken on npm. Things that follow the npm name follow it too (the `ptrn-mcp` bin, `ptrn-docs`).

## Setup

Use the Node version in `.nvmrc` (`nvm use`). Then:

```bash
npm ci
npm run build   # icons, then react, then web. The docs site and the MCP server build on top of these.
npm run dev     # docs site at http://localhost:8055, after generating the component metadata
```

| Script                   | What it does                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `npm run build`          | Builds the publishable packages in dependency order.                                                       |
| `npm run build:docs`     | Builds the docs site into `docs/dist`.                                                                     |
| `npm run build:plugin`   | Builds the Figma plugin.                                                                                   |
| `npm run lint`           | ESLint, Stylelint and TypeScript in every workspace that has them.                                         |
| `npm test`               | Every workspace's tests. Build first; several suites run on `dist`.                                        |
| `npm run pretty`         | Prettier over the repo.                                                                                    |
| `npm run check:pack`     | Dry-runs `npm pack` for every package and checks what would ship.                                          |
| `npm run smoke:consumer` | Installs the packed tarballs into a throwaway project and renders a component (pass `-- 19` for React 19). |
| `npx changeset`          | Records a release note for a package you changed (see Releases).                                           |

## Workflow

1. Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/). The hook and CI both run commitlint. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Use the package or area as the scope: `react`, `web`, `icons`, `styles`, `mcp`, `docs`, `plugin`, `tokens`, `ci`. Mark breaking changes with `!` after the type or a `BREAKING CHANGE:` footer.
3. If you changed a published package, add a changeset: `npx changeset`. Pick the packages, pick the bump, and write the note the way a consumer reading the changelog would want it. Docs-only and tooling-only changes need no changeset.
4. Open a pull request. CI runs lint, typecheck, the unit tests, the Playwright suites and the accessibility matrix across every theme. All of it has to pass; `main` is protected and the checks are required.
5. After merge, the release workflow keeps a "Version Packages" pull request up to date. Merging that one publishes to npm.

## Adding or changing a component

React lives in `packages/react`; Web Components live in `packages/web`.

- Scaffold with `npm run newc -- ComponentName` inside the package. You get the component, its stylesheet, an example file (the presets the docs and tests use), a behavior spec, a test file and the export entry.
- Write the spec first. `spec.ts` next to the component states what it is made of (anatomy), how the keyboard drives it, what it owes assistive technology (roles and states, labels, focus, target size, motion) and the behaviors every implementation must pass, each with a kebab-case id. The React suite and the Web Component suite register one test per id with `describeBehaviors(spec, …)`; a missing test fails the run, and `npm run lint:specs` in `@ptrn/react` fails a Web Component whose React counterpart has no spec. The docs render the spec on the component page and the MCP serves it.
- Every component carries JSDoc with `@name`, `@phase` (`Backlog`, `Dev`, `UXReview`, `Stable`, or `Utility`) and an `@example`. The docs site and the MCP server read these, so the documentation cannot drift from the code.
- No `className` prop. Consumers restyle through the `style` prop, which is typed to accept CSS custom properties, so an override is visible in the markup and scoped to that subtree.
- Styles use tokens only. A build check fails on any CSS variable that does not exist in `@ptrn/styles`.
- Rules that protect users go into the code (a label that cannot be omitted). Rules that protect taste go into the guidance (a maximum number of tabs).
- A React component is the reference; its Web Component counterpart matches its behavior, accessibility and appearance. The porting rhythm and conventions are in [`packages/web/CONTRIBUTING.md`](packages/web/CONTRIBUTING.md).

Coding conventions are in [GUIDELINES.md](GUIDELINES.md).

## Tests

- `@ptrn/react`: Jest, Testing Library (with user-event) and jest-axe. Every preset in the example file gets an axe check, and every behavior in the component's `spec.ts` gets a test (keyboard, focus, state, ARIA relationships).
- `@ptrn/web`: Playwright against the built package, with axe. The suite registers the same spec behaviors as the React suite, which is what holds the two implementations at parity.
- `@ptrn/mcp`: `node:test`, including an integration test that drives the server through the real MCP client over stdio.
- Docs: Playwright. Console errors on every page, axe on every component in every theme (`npm run test:a11y`), and a screenshot of every component's main example in every theme against the baselines in `docs/tests/visual/__screenshots__` (`npm run test:visual`). A visual difference is a review, not a flake: when the change is intended, run the "Update visual baselines" workflow (or `npm run test:visual:update` on Linux), look at the diff and commit the new baselines. The comparison tolerance is not a knob to turn.
- Figma plugin: `node:test` runs the compiled plugin against a fake Figma file and builds its token files with `@ptrn/styles`.

Accessibility checks are required status checks. Never skip, disable or quarantine a test to get a green build; fix the cause or ask for help in the pull request.

## Docs

Component pages are generated from the TypeScript types and JSDoc (`npm run meta` in `packages/react`, run automatically by `npm run dev` and `npm run build:docs`). Prose pages are Markdown in `docs/src/docs`. This file and `GUIDELINES.md` are rendered by the site from the repository root, so there is one copy of each.

## Tokens

Tokens come from the USWDS Design Kit in Figma, exported with the plugin in `figma-plugin` into `packages/styles`. See [`packages/styles/README.md`](packages/styles/README.md) for how to refresh them.

## Releases

Releases use [changesets](https://github.com/changesets/changesets). Configuration is in `.changeset/config.json`. Publishing is gated behind the `PTTRN_PUBLISH` repository variable until the first public release, so merging to `main` never publishes by accident.

## Reporting issues

Open an issue with one of the templates: bug, component or token request, or improvement. Security problems go through [SECURITY.md](SECURITY.md), not a public issue.

## Conduct and license

Everyone here follows the [Code of Conduct](CODE_OF_CONDUCT.md). By contributing you agree your work is released under the repository [LICENSE](LICENSE) (MIT); see [NOTICE.md](NOTICE.md) for where the code came from.
