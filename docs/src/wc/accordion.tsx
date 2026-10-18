/* eslint-disable @cspell/spellchecker */
import '@ptrn/web/Accordion';
import { AccordionProps } from '@ptrn/react/Accordion';
import { ComponentType, ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WebComponentDemo } from 'src/wc/types';

/**
 * The custom elements as React components. Typing them as components (rather than adding `ptrn-*` to the global JSX
 * namespace) keeps the tags out of the types the React package is checked against. An HTML boolean attribute is
 * "present or not", so pass `''` for on and `undefined` for off, never `false` (React 18 would write `open="false"`,
 * which still counts as present).
 */
const PtrnAccordion = 'ptrn-accordion' as unknown as ComponentType<any>;
const PtrnAccordionItem = 'ptrn-accordion-item' as unknown as ComponentType<any>;

/** The React demo state (`items`, `singleOpen`) rendered as the `ptrn-accordion` element tree. */
function AccordionWc({ items = [], singleOpen = true }: Partial<AccordionProps>) {
    return (
        <PtrnAccordion multiple={singleOpen ? undefined : ''}>
            {items.map(({ id, title, subtitle, leading, trailing, isOpen, disabled, children }, index) => (
                <PtrnAccordionItem
                    disabled={disabled ? '' : undefined}
                    heading={title}
                    key={id ?? index}
                    open={isOpen ? '' : undefined}
                    subtitle={subtitle}
                >
                    {leading && <span slot="leading">{leading}</span>}
                    {children}
                    {trailing && <span slot="trailing">{trailing}</span>}
                </PtrnAccordionItem>
            ))}
        </PtrnAccordion>
    );
}

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function nodeToHtml(node: ReactNode): string {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    return renderToStaticMarkup(node as ReactElement);
}

/** The HTML a Web Component user would write for the current demo state. */
function accordionToHtml({ items = [], singleOpen = true }: Partial<AccordionProps>) {
    const itemsHtml = items
        .map(({ title, subtitle, leading, trailing, isOpen, disabled, children }) => {
            const attrs = [
                `heading="${escapeAttr(title)}"`,
                subtitle && `subtitle="${escapeAttr(subtitle)}"`,
                isOpen && 'open',
                disabled && 'disabled',
            ].filter(Boolean);
            return [
                `<ptrn-accordion-item ${attrs.join(' ')}>`,
                leading && `<span slot="leading">${nodeToHtml(leading)}</span>`,
                nodeToHtml(children),
                trailing && `<span slot="trailing">${nodeToHtml(trailing)}</span>`,
                '</ptrn-accordion-item>',
            ]
                .filter(Boolean)
                .join('\n');
        })
        .join('\n');

    return `<ptrn-accordion${singleOpen ? '' : ' multiple'}>\n${itemsHtml}\n</ptrn-accordion>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web/dist/cdn/ptrn-web.min.js"></script>

<div style="width: 400px">
    <ptrn-accordion>
        <ptrn-accordion-item heading="Lawrence Welk" subtitle="The Champagne Music Maker">
            Lawrence Welk was an American accordionist, bandleader, and television impresario, who hosted The Lawrence Welk Show from 1951 to 1982.
        </ptrn-accordion-item>
        <ptrn-accordion-item heading="Myron Floren" subtitle="The Happy Norwegian">
            Myron Floren was an American accordionist best known as the featured accordionist on The Lawrence Welk Show.
        </ptrn-accordion-item>
    </ptrn-accordion>
</div>`;

export const accordionWc: WebComponentDemo = {
    tag: 'ptrn-accordion',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: AccordionWc,
    toHtml: accordionToHtml,
};
