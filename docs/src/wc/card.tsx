import '@ptrn/web/Card';
import { CardProps } from '@ptrn/react/Card';
import { ExamplePlaceholder } from '@ptrn/react/ExamplePlaceholder';
import { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnCard = 'pttrn-card' as unknown as ComponentType<any>;

/** The content the React example's render puts in the card. */
const placeholder = (
    <ExamplePlaceholder
        style={{ height: '200px', width: '100%', minWidth: 'min(250px, 100%)', backgroundColor: 'unset' }}
    />
);

/** The React demo state rendered as the element, with the same content as the React example. */
function CardWc({ variant }: Partial<CardProps>) {
    return <PttrnCard variant={variant}>{placeholder}</PttrnCard>;
}

/** The HTML a Web Component user writes for the current demo state. */
function cardToHtml({ variant }: Partial<CardProps>) {
    return `<pttrn-card${variant ? ` variant="${variant}"` : ''}>\n${renderToStaticMarkup(placeholder)}\n</pttrn-card>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-card variant="elevated" style="padding: var(--usa-spacing-2); max-width: 100%; width: 400px">
    <h3>Card Title</h3>
    <p>This is some content inside the card.</p>
</pttrn-card>`;

export const cardWc: WebComponentDemo = {
    tag: 'pttrn-card',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The element is the card: style it, and give it a role and aria-labelledby, directly.',
    Wrapper: CardWc,
    toHtml: (props) => cardToHtml(props as Partial<CardProps>),
};
