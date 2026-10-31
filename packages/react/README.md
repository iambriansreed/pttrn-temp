# Pattern UI

`@ptrn/react` contains the React components of the Pattern Design System.

## Installation

```bash
npm install @ptrn/react
```

```bash
npm install react react-dom
```

Works with React 18.3 and React 19.

## Usage

Import the fonts once in your app's entry, so your bundler ships the font files, and render the styles provider once
to load the USWDS tokens, themes and base styles:

```tsx
import '@ptrn/styles/fonts.css';
import { StylesProvider } from '@ptrn/react/StylesProvider';
```

## Testing

To test all components

```bash
npm run test
```

To test a specific component

```bash
npm run test -t <componentname>
```

## Styles

Each component appends its own stylesheet to `<head>` the first time it is imported, so there is nothing to wire up
beyond the `StylesProvider` (or the `@ptrn/styles` imports) for tokens and themes.

To load the component CSS through your own pipeline instead (server rendering, a strict Content Security Policy),
import the bundled stylesheet and opt out of injection on the root element:

```tsx
import '@ptrn/react/styles/components.css';
```

```html
<html data-pttrn-styles="external"></html>
```
