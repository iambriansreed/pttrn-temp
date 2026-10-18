# pttrn Demo Site

Demonstration application for the pttrn design system built with React & Vite. The app is itself built with pttrn components and provides an example of the components and documentation of their interfaces.

The packages this app relies on live in the same monorepo:

- [`@ptrn/react`](../packages/react): The React component library.
- [`@ptrn/icons`](../packages/icons): The icon set.
- [`@ptrn/styles`](../packages/styles): The USWDS design tokens and themes.

## Development

### Local Setup

To run the app locally:

1. Ensure you have `node` installed by running `node -v`.
2. Run `npm i` from the monorepo root.
3. Run `npm run dev --workspace ptrn-docs` to start the application in dev mode.

Because this is an npm workspace, `@ptrn/react`, `@ptrn/icons`, and `@ptrn/styles` are linked from `packages/` automatically — changes to them show up in the demo app directly.

### Building

To build the application run `npm run build --workspace ptrn-docs`. The application will be built to the `./dist` folder.

### Contributing

See the [Contributing Guide](../CONTRIBUTING.md).
