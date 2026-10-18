# pttrn Demo Site

Demonstration application for the pttrn design system built with React & Vite. The app is itself built with pttrn components and provides an example of the components and documentation of their interfaces.

The packages this app relies on live in the same monorepo:

- [`@ptrn/react`](../packages/react): The React component library.
- [`@ptrn/icons`](../packages/icons): The icon set.
- [`@ptrn/styles`](../packages/styles): The USWDS design tokens and themes.
- [`@ptrn/web`](../packages/web): The Web Components, shown on the Web Component tab of each component page.

## Development

### Local Setup

To run the app locally:

1. Ensure you have `node` installed by running `node -v`.
2. Run `npm ci` from the monorepo root.
3. Run `npm run build` from the root once: the site imports `@ptrn/icons` and `@ptrn/web` from their build output.
4. Run `npm run dev` to start the site at http://localhost:8055.

If you serve the dev server through a local HTTPS proxy (for example `https://pttrn.local`), set `VITE_DEV_HOST=pttrn.local` in `docs/.env.local` so hot reloading connects through that origin.

Because this is an npm workspace, `@ptrn/react`, `@ptrn/icons`, and `@ptrn/styles` are linked from `packages/` automatically — changes to them show up in the demo app directly.

### Building

To build the application run `npm run build:docs` from the root. The application will be built to the `./dist` folder; `npm run preview` serves it, and `npm test` runs the Playwright suites against it (see `playwright.config.ts`).

### Contributing

See the [Contributing Guide](../CONTRIBUTING.md).
