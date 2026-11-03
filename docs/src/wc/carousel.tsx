import '@ptrn/web/Carousel';
import { Button } from '@ptrn/react/Button';
import { CarouselProps } from '@ptrn/react/Carousel';
import { COLOR_VARIANTS } from '@ptrn/react/utils/colorVariants';
import { ComponentType, CSSProperties } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnCarousel = 'pttrn-carousel' as unknown as ComponentType<any>;

type Props = Partial<CarouselProps> & { slideCount?: number };

/** The slide the React example renders (`CarouselExample.tsx`), so both tabs show the same content. */
const slide = (number: number) => {
    const color = COLOR_VARIANTS[(number + 3) % COLOR_VARIANTS.length];
    return (
        <div
            key={number}
            style={{
                backgroundColor: `var(--theme-color-${color}-lightest)`,
                color: `var(--theme-color-${color}-darker)`,
                borderRadius: '8px',
                minHeight: '180px',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            Slide {number}
            <Button label="Click me" onClick={() => {}} variant="tertiary" />
        </div>
    );
};

const numbers = (slideCount?: number) => Array.from({ length: slideCount || 7 }, (_, i) => i + 1);

/** The demo state as the element's attributes. */
const attributes = ({ label, itemWidth, gap }: Props) => ({
    label,
    'item-width': typeof itemWidth === 'number' ? `${itemWidth}px` : itemWidth,
    gap,
});

/** The React demo state rendered as the element with the example's slides. */
function CarouselWc({ style, slideCount, ...props }: Props) {
    return (
        <PttrnCarousel {...attributes(props)} style={style}>
            {numbers(slideCount).map(slide)}
        </PttrnCarousel>
    );
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const css = (style?: CSSProperties) =>
    Object.entries(style ?? {})
        .map(([property, value]) => `${property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`)
        .join('; ');

/** The HTML a Web Component user writes for the current demo state. */
function carouselToHtml({ style, slideCount, ...props }: Props) {
    const attrs = Object.entries({ ...attributes(props), style: css(style) })
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([name, value]) => `${name}="${escape(String(value))}"`);
    const slides = numbers(slideCount).map((number) => renderToStaticMarkup(slide(number)));
    return `<pttrn-carousel ${attrs.join(' ')}>\n${slides.join('\n')}\n</pttrn-carousel>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-carousel label="Featured stories" item-width="50%">
    <article><h3>Rivers</h3><p>Where the water runs between the mountains.</p></article>
    <article><h3>Canyons</h3><p>Rock walls at dusk.</p></article>
    <article><h3>Hills</h3><p>Green slopes under low clouds.</p></article>
    <article><h3>Coasts</h3><p>The shore at sunrise.</p></article>
</pttrn-carousel>`;

export const carouselWc: WebComponentDemo = {
    tag: 'pttrn-carousel',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Each child element is a slide.',
    Wrapper: CarouselWc,
    toHtml: carouselToHtml,
};
