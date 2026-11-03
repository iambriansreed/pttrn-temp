import '@ptrn/web/Breadcrumb';
import { BreadcrumbProps } from '@ptrn/react/Breadcrumb';
import { ComponentType } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. */
const PttrnBreadcrumb = 'pttrn-breadcrumb' as unknown as ComponentType<any>;
const PttrnBreadcrumbItem = 'pttrn-breadcrumb-item' as unknown as ComponentType<any>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const variantAttr = (variant: BreadcrumbProps['variant']) => (variant && variant !== 'default' ? variant : undefined);

/** The React demo state (`items`, `variant`, `scrollLimit`) rendered as the `pttrn-breadcrumb` element tree. */
function BreadcrumbWc({ items = [], variant, scrollLimit }: Partial<BreadcrumbProps>) {
    return (
        <PttrnBreadcrumb scroll-limit={scrollLimit || undefined} variant={variantAttr(variant)}>
            {items.map(({ label, href }, index) => (
                <PttrnBreadcrumbItem href={href} key={index} label={label} />
            ))}
        </PttrnBreadcrumb>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function breadcrumbToHtml({ items = [], variant, scrollLimit }: Partial<BreadcrumbProps>) {
    const attrs = [
        variantAttr(variant) && `variant="${variantAttr(variant)}"`,
        scrollLimit && `scroll-limit="${scrollLimit}"`,
    ].filter(Boolean);
    const itemsHtml = items
        .map(
            ({ label, href }) =>
                `<pttrn-breadcrumb-item label="${escapeAttr(label)}" href="${escapeAttr(href)}"></pttrn-breadcrumb-item>`,
        )
        .join('\n');
    return `<pttrn-breadcrumb${attrs.length ? ` ${attrs.join(' ')}` : ''}>\n${itemsHtml}\n</pttrn-breadcrumb>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-breadcrumb scroll-limit="5">
    <pttrn-breadcrumb-item label="Brioche" href="#brioche"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Whole Wheat" href="#whole-wheat"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Sourdough" href="#sourdough"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Rye" href="#rye"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Multigrain" href="#multigrain"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Baguette" href="#baguette"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Focaccia" href="#focaccia"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Ciabatta" href="#ciabatta"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Pita" href="#pita"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Naan" href="#naan"></pttrn-breadcrumb-item>
    <pttrn-breadcrumb-item label="Flatbread" href="#flatbread"></pttrn-breadcrumb-item>
</pttrn-breadcrumb>`;

export const breadcrumbWc: WebComponentDemo = {
    tag: 'pttrn-breadcrumb',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens.',
    Wrapper: BreadcrumbWc,
    toHtml: breadcrumbToHtml,
};
