# pttrn migration plan

Legend: **[YOU]** = needs you (accounts, DNS, repo settings, decisions). **[CLAUDE]** = I do it in the repo.

## Phases

1. **Phase 1: get the site up with the new branding.** Repair the move, rename bspk to pttrn, fix the license and attribution, merge `.vscode`, replace the country icons with `flag-icons`, add the Figma plugin page, deploy to GitHub Pages, make the repo public.
2. **Phase 2: publish the packages to npm.** `@ptrn/react|web|icons|styles`, on a GitHub Release. `@ptrn/react` is today's `@ptrn/ui` (renamed first, see the Decided list); `@ptrn/web` is the new Web Components package (see `.plans/web-components.md`).

## Brief

- Rename bspk to pttrn.
- Merge all `.vscode` folders and settings files into the root.
- On pushes to main the demo site (`web`) is built and deployed via GitHub Pages as a static site, domain already set up `pttrn.iambrian.com`.
- Add a demo page explaining how to use the Figma plugin, pulled from its README.
- Make no references to outside repos.

## Decided

- **Two names on purpose.** GitHub org, repo, site, prose and identifiers are `pttrn`. The npm org is **`ptrn`** (one t; `pttrn` was not available on npm), so every npm package name uses the `@ptrn/` scope.
- GitHub: org `pttrn`, repo **`pttrn/pttrn`**. The repo exists and is empty. Local git is initialized at the project root on `main` with `origin` set and no commits. The old history is wiped, so there is nothing old to make public.
- Repo must be **public**: a free org cannot use Pages on a private repo.
- Packages: `@bspk/ui|icons|styles` become **`@ptrn/ui|icons|styles`**, published to **npm** (public), not GitHub Packages. All three names returned 404 on npm, so they look free.
- Package rename: `@ptrn/ui` becomes **`@ptrn/react`** (directory `packages/ui` becomes `packages/react`), because "ui" stops meaning anything once there is a second UI package. A new framework-free **`@ptrn/web`** (Lit Web Components, `packages/web`) sits beside it. `@ptrn/icons` and `@ptrn/styles` stay. Nothing is published yet, so the rename is free of consumers. It ships as its own commit before any Web Component work (about 483 references in 117 files). Phase 1 below still says `ui` because it records what was done before this decision.
- Workspaces: `bspk-demo` becomes **`ptrn-web`** and `export-tokens` becomes **`ptrn-figma-plugin`**. Both stay `"private": true` and are **never published** which is why they don't use the npm org scope.
- Site: `web/` builds static and deploys to GitHub Pages at **pttrn.iambrian.com**.
- Description: `React design system monorepo: UI components, icons, design-token styles, a Figma token exporter, and the dogfood/docs site.`
- Unchanged: the `nowhere` theme and `StylesProviderNowhere`.
- `attribution.md` is done: trimmed, repo table removed, credits Brian S. Reed as creator while at Anywhere Real Estate, and lists the other contributors (jessica-mcintosh, emilefleming) with GitHub profile links. The only intended outside links are the original org (`github.com/Anywhererealestate`) and those profiles. It is exempt from the bspk rename.
- License: **CC BY 4.0** for the whole repo. The upstream `@bspk/*` packages declare `CC-BY-4.0` and carry "Copyright 2025/2026 Anywhere Real Estate" notices, so the CC0 `LICENSE` was wrong (CC0 can't be applied to CC BY material). Steps in Phase 1, step 3.
- Flags: the whole `country` icon set (232 flags + 232 currency symbols, 464 SVGs, 1.9 MB) is removed from `@ptrn/icons`. Only `InputPhone` used it, and only the flags; nothing used the symbols. `InputPhone` gets its flags from **`flag-icons`** (MIT, on npm) instead, loaded through its **CSS classes** (`fi fi-us`): apps import the `flag-icons` stylesheet, the same way they import `@ptrn/styles`. The currency symbols are dropped. Steps in Phase 1, step 8.
- Node: `"engines": { "node": ">=24" }` in the root, `web` and `figma-plugin` (matches `.nvmrc`, v24.11.1). The three published packages under `packages/` (`ui`, `icons`, `styles`) stay at `>=22`, so consumers on Node 22 aren't warned. Step 1.
- `plan.md` is gitignored at the root, so it stays local.

## Assumptions (tell me if wrong)

- "settings file" means the `.vscode/settings.json` files, not `.claude/settings.local.json`. (Confirmed.)
- Publishing (Phase 2) runs when a **GitHub Release** is published. Each package is skipped if its version is already on npm. (Revisit in Phase 2.)
- All package versions are 0.0.1 (done: ui, icons, styles, web, figma-plugin, root, lockfile).
- Links: the old `github.com/iambriansreed/bspk` links (15) are repointed to `pttrn/pttrn`. The one link to someone else's repo, `github.com/motdotla/dotenv` in a comment in `web/playwright.config.ts`, is removed. Third-party tooling links stay (CDN stylesheets, the cspell `$schema` line pointing at `streetsidesoftware/cspell`), and so do the intentional `attribution.md` links.

## Open decisions

- [ ] **[YOU]** Phase 2: confirm the publish trigger (GitHub Release) and versions (unchanged).

# Phase 2: publish the packages to npm

### 11. Publish packages to npm

- [ ] **[YOU]** `npm login` with an account that can publish to the `ptrn` org, and turn on 2FA. Create an npm **automation token** and save it as the repo secret `NPM_TOKEN`.
- [ ] **[YOU]** Publish the first GitHub Release. Then confirm the four packages appear at `npmjs.com/org/ptrn`.
