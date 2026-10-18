# Changesets

Every change to a published package (`@ptrn/react`, `@ptrn/web`, `@ptrn/icons`, `@ptrn/styles`, `@ptrn/mcp`) ships with a changeset: a small markdown file in this folder that names the packages, the bump (`major`, `minor`, `patch`) and the note that goes into the changelog.

```bash
npx changeset
```

The release workflow turns pending changesets into a "Version Packages" pull request that bumps versions and writes each package's `CHANGELOG.md`. Merging that pull request publishes. The docs site and the Figma plugin are private workspaces and are never versioned or published.

Write the note for the consumer reading the changelog: what changed for them and what, if anything, they must do.
