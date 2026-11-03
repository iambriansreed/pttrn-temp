# Governance

How pttrn is run: who owns what, how a change gets in, how a component moves from an idea to stable, how things are retired, how releases are numbered, what is supported, and what comes next. This page describes what the repository does today. Where something has not been decided, a **Decision to make** note says so.

## How pttrn is run

Nathan Curtis describes three [team models for a design system](https://medium.com/eightshapes-llc/team-models-for-scaling-a-design-system-2cf9d03be6a0): solitary (one product team builds a system for itself and others adopt it), centralized (a team owns the system and serves the products that use it) and federated (people from the product teams decide together what goes in).

pttrn is centralized, with a team of one. One maintainer owns the system, reviews every change and decides what goes in; `.github/CODEOWNERS` names them for every path. Anyone can propose and build through issues and pull requests, including AI coding sessions, which open pull requests like any other contributor and go through the same review and the same checks.

> **Decision to make.** Nothing is published to npm yet, so the docs site is the only product that uses pttrn. When a second maintainer or a consuming team arrives, decide whether review stays with the maintainer or moves to a federated group, and write the rule here and in `.github/CODEOWNERS`.

## Who owns what

pttrn separates the design language (what things look like and what they mean: color, type, spacing, the anatomy of a component) from the implementation (the code, tests and docs that deliver it). pttrn does not invent its design language. It takes it from the U.S. Web Design System (USWDS), through the USWDS Design Kit in Figma, and owns everything from the exported tokens onward.

### The design language

| Layer                              | Owner                                                                                 | Source of truth                                                   | How it is held                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive tokens (`--usa-*`)       | USWDS                                                                                 | Variables in the USWDS Design Kit, exported with the pttrn plugin | `npm run tokens:check-uswds` and a weekly workflow compare them with the USWDS Core release recorded in `packages/styles/tokens/uswds.json` |
| Theme tokens (`--theme-*`)         | USWDS, except `project-theme-dark`, which `@ptrn/styles` derives from `project-theme` | The kit's USWDS Theme collection; `scripts/derive-dark-theme.ts`  | CI rebuilds the stylesheets and the token module from `packages/styles/tokens/` and fails if they differ from the committed files           |
| Component tokens (`--component-*`) | The component spec in the Figma kit                                                   | The same theme collection                                         | The same build check, plus `check:css-vars`, which fails a build that uses a custom property the catalog does not have                      |
| Prose styles (`prose.css`)         | USWDS (`usa-prose`)                                                                   | `packages/styles/prose.css`                                       | Docs Playwright suite                                                                                                                       |

A token changes in Figma first, then reaches code through the plugin export and the `@ptrn/styles` build (see Design Tokens). A pull request that edits the generated stylesheets by hand fails CI.

### The implementation

| Part                                | Owner                                                               | Source of truth                                                        | How it is held                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Behavior and accessibility contract | pttrn                                                               | `spec.ts` next to each React component                                 | Both test suites register one test per behavior id; `npm run lint:specs` fails a missing suite or a Stable component without a spec |
| React components (`@ptrn/react`)    | pttrn                                                               | `packages/react`, the reference implementation                         | Jest with jest-axe, the docs Playwright suite, the accessibility matrix in every theme, the visual baselines                        |
| Web Components (`@ptrn/web`)        | pttrn                                                               | `packages/web`, which follows the React component                      | The same spec, Playwright with axe, the visual baselines of the Web Component tab                                                   |
| Icons (`@ptrn/icons`)               | Google (Material Symbols, Apache 2.0) and pttrn (the `nowhere` set) | `packages/icons`                                                       | Build and package contents checks                                                                                                   |
| MCP server (`@ptrn/mcp`)            | pttrn                                                               | Built from the component metadata, the icons and the tokens            | `node:test`, including an integration test over stdio                                                                               |
| Docs site and Figma plugin          | pttrn                                                               | `docs` and `figma-plugin`, private workspaces that are never published | Docs Playwright suites; the plugin runs against a fake Figma file in its tests                                                      |

> **Decision to make.** USWDS is splitting into USWDS Core and USWDS Elements, and the Design Kit used here is a community beta. If the kit stops tracking USWDS Core, decide whether the tokens keep coming from the kit or come from the `@uswds/uswds` package, which the cross-check already reads.

## Contributing a change

The full workflow is in Contributing; this is the part that decides what gets in.

### Propose

Open an issue with a template: a bug report, a component or token request, or an improvement. A component or token request asks for the problem it solves (which products need it and why an existing component or composition does not cover it), the proposed API, the accessibility requirements (keyboard model, focus, labels, minimum target size, ARIA pattern) and a design reference. Security problems go through `SECURITY.md`, not a public issue.

The templates label each issue (`bug`, `proposal`, `enhancement`). There is no separate acceptance step: the maintainer agrees to a proposal in its issue, and building starts with the scaffold, which puts a new component in Dev.

### Build

- Branch from `main` and commit with Conventional Commits; a commit hook and CI both run commitlint.
- Scaffold a component with `npm run newc -- Name` in the package. The scaffold writes the component, its stylesheet, an example file, a behavior spec, a test file and the export entry.
- Write the spec first: anatomy, keyboard model, accessibility (roles and states, labels, focus, target size, motion) and the behaviors, each with a kebab-case id. The spec is the contract both implementations are tested against.
- Give the component JSDoc with `@name`, `@phase` and an `@example`. The docs site and the MCP server read them.
- Use tokens only. Add a changeset (`npx changeset`) when a published package changes.

### Review and merge

Every pull request carries the template's checklist and waits for a review from the code owner. CI runs on every pull request and again on every push to `main`, and `main.yml` deploys the docs and runs the release step only after it passes. The jobs:

- Commit messages (commitlint) on pull requests.
- Lint and typecheck: ESLint, Stylelint, TypeScript, Prettier, the component lint, the spec lint, the custom property check, and a check that the built token files match the committed ones.
- Unit tests for `@ptrn/react`, `@ptrn/mcp` and the Figma plugin.
- A consumer smoke test that installs the packed tarballs next to React 18 and React 19, type-checks them and server-renders a component.
- Playwright for `@ptrn/web` and for the docs site.
- The accessibility matrix: axe on every component's main example in `default`, `project-theme` and `project-theme-dark`.
- Visual regression against the committed baselines, in the same three themes.
- Package contents: what each publishable package would ship.

A failing accessibility or visual check is a review, not a flake. Fix the component or the token; never skip, quarantine or loosen a check to get a green build. Intended visual changes go through the "Update visual baselines" workflow and a reviewed diff of the new screenshots.

Branch protection is not turned on for `main` yet, so GitHub itself does not enforce the review or the checks. Turning it on, with these jobs as required status checks, is the first item on the roadmap.

### Porting to Web Components

The React component is the reference for behavior, accessibility and appearance; its Web Component follows. `packages/web/CONTRIBUTING.md` holds the rhythm, which goes into the pull request as a checklist:

1. Read the React component's spec, or write it there first.
2. Map the API: each React prop to an attribute, slot or event, reviewed by design and UX engineering before any code.
3. Scaffold with `npm run newc -- Name` in `packages/web`, which also registers the docs demo.
4. Build the element and its styles from the React SCSS.
5. Write the tests: one per spec behavior id with `describeBehaviors`, plus element-specific cases and an axe run.
6. Finish the docs demo; the Elements table comes from the Custom Elements Manifest.
7. Compare the React and Web Component tabs at the same preset, then add the Web Component tab to the visual baselines.
8. Lint, build, and update the component list in the README.

## Component lifecycle

Every component declares its phase with the `@phase` JSDoc tag. A component with no phase, or one the build does not recognize, is treated as Backlog. Moving a component to another phase is a pull request that changes the tag, reviewed like any other change.

| Phase     | Means                                                 | Enters when                                                                                                            | Leaves when                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dev       | Being built.                                          | `npm run newc` scaffolds it: component, stylesheet, example file, spec, test file and export entry, with `@phase Dev`. | The API is complete, the example presets cover its states, the JSDoc has an `@example`, every preset passes axe and every spec behavior has a test. It moves to UX Review.                                         |
| Backlog   | Started, then put on hold.                            | Work on a Dev component stops, or a component has no recognized `@phase`.                                              | Work resumes. It moves back to Dev.                                                                                                                                                                                |
| UX Review | Built, under design and accessibility review.         | The Dev exit criteria are met.                                                                                         | The review is done, the spec is complete, the accessibility matrix passes in every theme, the visual baselines are committed, the page fits a 320px screen and renders without console errors. It moves to Stable. |
| Stable    | Ready for production. Breaking changes follow semver. | The UX Review exit criteria are met.                                                                                   | It is deprecated (see the deprecation policy).                                                                                                                                                                     |
| Utility   | A building block: providers, portals, helpers.        | It exists to build other components rather than to be a product UI element.                                            | Not tracked. A utility follows the same review and versioning rules as any other export.                                                                                                                           |

CI runs its checks on every component past Backlog, whatever its phase, so most of these criteria are enforced for Dev and UX Review components too; what a phase adds is the review. One check is tied to a phase: `npm run lint:specs` refuses a Stable component without a spec.

Where each phase shows today:

- The components overview lists Stable, UX Review and Dev components, each with its phase, and lists utilities separately. Backlog components have a page and a navigation entry but are left out of the overview and out of the docs test suites.
- The `*Field` components are generated from their control and start in UX Review.
- The MCP server serves every component regardless of phase.

> **Decision to make.** For the first public release it was decided to ship Stable and Utility, mark UX Review as "preview" in the docs and the MCP, and hide Backlog and Dev. That rule is not applied yet. The UX Review phase also describes a UX team that pttrn does not have: today the maintainer does the design and accessibility review, and who else signs it off is open.

## Deprecation policy

What exists today:

- A prop is deprecated with the `@deprecated` JSDoc tag and a pointer to what to use instead (`ProgressBar`'s `successColor` and `successHidden` are the current examples). Editors strike the prop through; the docs site and the MCP do not show it yet.
- A token rename or removal in Figma reaches code through the token export, and `check:css-vars` lists every component stylesheet that used the old name. Consumers use the same custom properties, so a token rename is a change to the public API of `@ptrn/styles`.
- No component has been deprecated or removed, and nothing has been published, so no consumer has been broken yet.

> **Decision to make.** The rules below are proposed, not adopted. 1) Deprecate in a minor release: add `@deprecated` with the replacement, a changeset that says what to do, and a mark on the docs page and in the MCP data. A renamed token keeps its old name as an alias. 2) Keep the deprecated API working for at least one minor release before 1.0 and for at least one major release after it. 3) Remove it in a breaking release whose changeset carries the migration. A whole component would follow the same steps, with a deprecated phase or flag that the docs and the MCP can show.

## Versioning and support

### Releases

- Every published package (`@ptrn/react`, `@ptrn/web`, `@ptrn/icons`, `@ptrn/styles`, `@ptrn/mcp`) follows [semantic versioning](https://semver.org/) and is versioned on its own: `.changeset/config.json` neither fixes nor links them. The docs site and the Figma plugin are private and never versioned.
- Versions come from [changesets](https://github.com/changesets/changesets), not from commit messages. A change to a published package ships with a changeset that names the packages, the bump and the note for the changelog.
- On every push to `main`, after CI passes, the release job in `.github/workflows/main.yml` opens or updates a "Version Packages" pull request that bumps the versions and writes each package's `CHANGELOG.md`. Merging that pull request publishes, with npm provenance.
- Publishing is gated behind the `PTTRN_PUBLISH` repository variable, so merging to `main` cannot publish by accident. When one package bumps, the packages that depend on it get their dependency range updated.
- Every package is at 0.0.1 and nothing is on npm. The first public release is 0.1.0.

> **Decision to make.** How breaking changes are numbered before 1.0, and what 1.0 requires. The usual convention is a minor bump for a breaking change and a patch for everything else while the version starts with 0; a `major` changeset would go straight to 1.0.0.

### What is supported

- **React** 18 and 19. `@ptrn/react` and `@ptrn/icons` declare `^18.3.1 || ^19.0.0` as peer dependencies, and CI installs the packed tarballs next to each major, type-checks them and server-renders a component.
- **Node.js** 22 and later for every published package (`engines`). Working on the repository needs the version in `.nvmrc` (24).
- **Lit** 3 for the Web Components (`@ptrn/web` depends on `lit` `^3.3.0`).
- **Themes** `default`, `project-theme` and `project-theme-dark`, each covered by the accessibility matrix and the visual baselines.
- **Security fixes** for the latest published minor of each package (`SECURITY.md`).

> **Decision to make.** No browser support policy is written down (there is no `browserslist`). Decide which browsers the packages target and test against.

### What the docs site documents

The site header names the `@ptrn/react` version the site was built from and links to the changelog. The site is rebuilt from `main` on every push, so between releases it can show changes that are not on npm yet; the pending changesets list them.

> **Decision to make.** Versioned docs, one copy of the site per release, are not built. Decide whether they are needed once there is more than one release.

## Roadmap

What is left of the backlog that takes pttrn to its first public release and beyond, grouped by when it is planned. Items marked (maintainer) need the maintainer's accounts or a decision; everything else is repository work.

### Before the first public release

- Turn on branch protection for `main` with the CI jobs as required checks (maintainer).
- Decide the permanent home of the repository, then repoint every link, `repository` field and the Pages domain in one change. Links say `github.com/pttrn/pttrn` until then (maintainer).
- npm: confirm the `ptrn` organization, two-factor authentication and trusted publishing (or an `NPM_TOKEN`), then set `PTTRN_PUBLISH` (maintainer).
- Confirm who owns the Google Analytics tag in `docs/index.html`, or remove it (maintainer).
- Apply the phase rule for 0.1.0: hide Backlog and Dev, mark UX Review as preview in the docs and the MCP.
- Merge the Version Packages pull request at 0.1.0, make the repository public and publish.

### Next

- **Tokens.** Remove the export leftovers (the `--spacing-usa-spacing-*` duplicates, `--local-xx-spacing-4`, `--card-shadow`); add size tokens for the icon and control boxes that are literal today; decide which font type and font role modes to keep and document them; let the Figma plugin open the token pull request itself (maintainer: a GitHub token or app).
- **React.** Ship plain `.css` files imported as side effects, keeping the JavaScript style injector as an opt-in, so strict CSP and server-side style extraction work; type the props the metadata extracts without a type (`Flex` `align`, `justify`, `padding`) so the validator checks them; add example files and `@example` blocks where they are missing, Stable components first; audit the `eslint-disable` comments and the `Flag` sprite.
- **Icons.** Build Material Symbols from a pinned release instead of a sibling checkout, and emit into `dist/`.
- **Web Components.** Port the rest of the library in the order leaf components, one-state controls, form-associated controls with `ElementInternals`, then compositions. After four components, revisit sharing SCSS between React and Web Components.
- **MCP and AI readiness.** Read the MCP's component data from `@ptrn/react` instead of the docs metadata; validate HTML and Web Component code against the Custom Elements Manifest; an installable component registry with an agent skill; the hosted MCP server (maintainer: hostname and hosting account).
- **CI.** Pin GitHub Actions to commit SHAs and run `npm audit` (Dependabot already runs weekly).
- **Process.** Turn `plans/*.md` into architecture decision records with a status, and record the decisions behind this plan as new ones.

### Later

- Official React wrappers for the Web Components (`@lit/react`) and Angular and Vue typings from the manifest.
- Server rendering of the Web Components with declarative shadow DOM.
- Align `@ptrn/web` naming and events with USWDS Elements where they overlap, and document the differences.
- Figma Code Connect mappings, once a pttrn component library exists in Figma (maintainer).
- A usage scanner that reports which components and tokens consumer repositories use, and a CI flow that suggests the pttrn component for raw HTML in a consumer's pull request.
- Bundle size budgets per package and a performance smoke test for the docs site.
