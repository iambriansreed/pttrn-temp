# Getting Started

This website is built entirely with the components, icons, styles, and utilities from the Pattern Design System. We proudly "eat our own dogfood"—see what that means [here](https://en.wikipedia.org/wiki/Eating_your_own_dog_food)! 🐶 The site is continuously updated as new features, components, and designs are added to Pattern.

You can find the source for every package in this monorepo at [https://github.com/pttrn/pttrn](https://github.com/pttrn/pttrn).

Interested in contributing to the Pattern Design System or have feedback about this website or any of our packages? Open an issue on the [GitHub issue tracker](https://github.com/pttrn/pttrn/issues).

## @ptrn/react

```bash
npm install @ptrn/react
```

The `@ptrn/react` package provides all React components, hooks, and utilities needed for development teams. It automatically includes all styles from `@ptrn/styles`, so you don't need to install `@ptrn/styles` separately. To apply styles, render the <a href="/styles#style-providers">StylesProvider</a>. Explore the available components on the <a data-testid="components-link" href="/components">components page</a>.

## @ptrn/icons

```bash
npm install @ptrn/icons
```

The `@ptrn/icons` package provides a comprehensive set of icons for development teams. Browse the full icon library on the <a data-testid="icons-link" href="/icons">icons page</a>.

## @ptrn/styles

```bash
npm install @ptrn/styles
```

The `@ptrn/styles` package is typically not used directly unless you are building with something other than React or need to access raw stylesheets and utilities. It contains the USWDS design tokens and themes, exported from the USWDS Design Kit in Figma, and the shared reset. You can browse the available stylesheets on the <a data-testid="styles-link" href="/style">styles page</a>.

### Versioning

All packages follow [semantic versioning](https://semver.org/).
