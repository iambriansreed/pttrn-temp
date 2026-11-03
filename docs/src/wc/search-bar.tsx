import '@ptrn/web/SearchBar';
import { SearchBarOption, SearchBarProps } from '@ptrn/react/SearchBar';
import { ComponentType, ReactNode } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import {
    Attributes,
    defined,
    elementHtml,
    escapeHtml,
    fieldAttributes,
    useElementEvent,
    USAGE_DESCRIPTION,
} from 'src/wc/field-demo';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. */
const PttrnSearchBar = 'pttrn-search-bar' as unknown as ComponentType<any>;
const PttrnSearchBarItem = 'pttrn-search-bar-item' as unknown as ComponentType<any>;

type DemoProps = Partial<SearchBarProps> & { trailing?: ReactNode };

const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
const count = (value: unknown) => (typeof value === 'number' && value > 0 ? value : undefined);

/** The React props as attributes; `items` become `pttrn-search-bar-item` children (their label; see the notes). */
const searchBarAttributes = (props: DemoProps): Attributes => ({
    ...fieldAttributes(props),
    value: text(props.value),
    placeholder: props.placeholder && props.placeholder !== 'Search' ? props.placeholder : undefined,
    'no-results-message': text(props.noResultsMessage),
    'scroll-limit': count(props.scrollLimit),
});

const labels = (items: unknown) =>
    (Array.isArray(items) ? (items as SearchBarOption[]) : [])
        .map((item) => item?.label)
        .filter((label): label is string => typeof label === 'string' && !!label);

const slotText = (node: ReactNode) => (typeof node === 'string' || typeof node === 'number' ? String(node) : '');

/** The React demo state (the props table) rendered as the elements; typing and choosing update it as onChange does. */
function SearchBarWc(props: DemoProps) {
    const ref = useElementEvent<CustomEvent<{ value: string }>>('pttrn-change', (event) =>
        props.onChange?.(event.detail.value),
    );
    return (
        <PttrnSearchBar {...defined(searchBarAttributes(props))} ref={ref}>
            {labels(props.items).map((label, index) => (
                <PttrnSearchBarItem key={`${label}-${index}`} label={label} />
            ))}
            {props.trailing ? <span slot="trailing">{props.trailing}</span> : null}
        </PttrnSearchBar>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function searchBarToHtml(props: Record<string, unknown>) {
    const { items, trailing } = props as DemoProps;
    const inner = [
        ...labels(items).map((label) => elementHtml('pttrn-search-bar-item', { label })),
        slotText(trailing) && `<span slot="trailing">${escapeHtml(slotText(trailing))}</span>`,
    ]
        .filter(Boolean)
        .join('\n');
    return elementHtml('pttrn-search-bar', searchBarAttributes(props as DemoProps), inner && `\n${inner}\n`);
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-search-bar aria-label="Example aria-label" name="example-name" style="width: 320px">
    <pttrn-search-bar-item label="Apple Pie"></pttrn-search-bar-item>
    <pttrn-search-bar-item label="Banana Split"></pttrn-search-bar-item>
    <pttrn-search-bar-item label="Cherry Tart"></pttrn-search-bar-item>
    <pttrn-search-bar-item label="Dragonfruit Sorbet"></pttrn-search-bar-item>
    <pttrn-search-bar-item label="Elderberry Jam"></pttrn-search-bar-item>
</pttrn-search-bar>

<script type="module">
    document
        .querySelector('pttrn-search-bar')
        .addEventListener('pttrn-change', (event) => console.log(event.detail.value, event.detail.item));
</script>`;

export const searchBarWc: WebComponentDemo = {
    tag: 'pttrn-search-bar',
    usage: USAGE,
    usageDescription: `${USAGE_DESCRIPTION} Each result is a \`pttrn-search-bar-item\` child; the search bar filters them as the user types.`,
    Wrapper: SearchBarWc,
    toHtml: searchBarToHtml,
};
