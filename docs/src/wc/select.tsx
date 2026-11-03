import '@ptrn/web/Avatar';
import '@ptrn/web/Select';
import '@ptrn/web/Tag';
import { Avatar } from '@ptrn/react/Avatar';
import { SelectOption, SelectProps } from '@ptrn/react/Select';
import { Tag } from '@ptrn/react/Tag';
import { ComponentType, isValidElement, ReactElement, ReactNode, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, flag } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnAvatar = 'pttrn-avatar' as unknown as ComponentType<any>;
const PttrnSelect = 'pttrn-select' as unknown as ComponentType<any>;
const PttrnSelectItem = 'pttrn-select-item' as unknown as ComponentType<any>;
const PttrnTag = 'pttrn-tag' as unknown as ComponentType<any>;

type DemoProps = Partial<SelectProps>;

/**
 * The presets' leading and trailing content (React Tag, Avatar and text), as the elements: the select copies an
 * option's slotted content into its shadow root, where the React components' page styles do not reach.
 */
function asElement(node: ReactNode): ReactNode {
    if (!isValidElement(node)) return node;
    const props = node.props as Record<string, unknown>;
    if (node.type === Tag) return <PttrnTag color={props.color} label={props.label} size={props.size} />;
    if (node.type === Avatar) return <PttrnAvatar name={props.name} size={props.size} />;
    return node;
}

const slotHtml = (node: ReactNode, slot: string) => {
    const element = asElement(node);
    return isValidElement(element)
        ? `<span slot="${slot}">${renderToStaticMarkup(element as ReactElement)}</span>`
        : '';
};

/** The attributes of `pttrn-select` for the demo state. */
const selectAttributes = (props: DemoProps) => ({
    'aria-label': props['aria-label'],
    name: props.name,
    value: props.value || undefined,
    placeholder: props.placeholder,
    size: props.size && props.size !== 'medium' ? props.size : undefined,
    'scroll-limit': props.scrollLimit,
    'menu-width': props.menuWidth || undefined,
    disabled: !!props.disabled,
    readonly: !!props.readOnly,
    invalid: !!props.invalid,
    required: !!props.required,
});

/** The React demo state rendered as the elements; `pttrn-change` calls the demo's `onChange`, as React's does. */
function SelectWc(props: DemoProps) {
    const ref = useRef<HTMLElement>(null);
    const { options = [], onChange } = props;
    const attributes = selectAttributes(props);

    useEffect(() => {
        const element = ref.current;
        if (!element || !onChange) return undefined;
        const listener = (event: Event) => onChange((event as CustomEvent<{ value: string }>).detail.value);
        element.addEventListener('pttrn-change', listener);
        return () => element.removeEventListener('pttrn-change', listener);
    }, [onChange]);

    return (
        <PttrnSelect
            aria-label={attributes['aria-label']}
            disabled={flag(attributes.disabled)}
            invalid={flag(attributes.invalid)}
            menu-width={attributes['menu-width']}
            name={attributes.name}
            placeholder={attributes.placeholder}
            readonly={flag(attributes.readonly)}
            ref={ref}
            required={flag(attributes.required)}
            scroll-limit={attributes['scroll-limit']}
            size={attributes.size}
            value={props.value ?? ''}
        >
            {options.map((option: SelectOption, index) => (
                <PttrnSelectItem
                    disabled={flag(option.disabled)}
                    key={`${option.value}-${index}`}
                    label={option.label}
                    sub-text={option.subText || undefined}
                    value={option.value}
                >
                    {option.leading && <span slot="leading">{asElement(option.leading)}</span>}
                    {option.trailing && <span slot="trailing">{asElement(option.trailing)}</span>}
                </PttrnSelectItem>
            ))}
        </PttrnSelect>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function selectToHtml(props: Record<string, unknown>) {
    const demo = props as DemoProps;
    const items = (demo.options ?? [])
        .map((option: SelectOption) => {
            const inner = [slotHtml(option.leading, 'leading'), slotHtml(option.trailing, 'trailing')]
                .filter(Boolean)
                .join('');
            return `<pttrn-select-item${attrs({
                value: option.value,
                label: option.label,
                'sub-text': option.subText,
                disabled: !!option.disabled,
            })}>${inner}</pttrn-select-item>`;
        })
        .join('\n');
    return `<pttrn-select${attrs(selectAttributes(demo))}>\n${items}\n</pttrn-select>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<div style="width: 320px">
    <pttrn-select
        label="Select an option"
        helper-text="The select allows you to choose one option from a list of options."
        name="example-select"
        placeholder="Select an option"
        scroll-limit="5"
    >
        <pttrn-select-item value="1" label="Option 1"></pttrn-select-item>
        <pttrn-select-item value="2" label="Option 2"></pttrn-select-item>
        <pttrn-select-item value="3" label="Option 3"></pttrn-select-item>
        <pttrn-select-item value="4" label="Option 4"></pttrn-select-item>
        <pttrn-select-item value="5" label="Option 5"></pttrn-select-item>
        <pttrn-select-item value="6" label="Option 6"></pttrn-select-item>
    </pttrn-select>
</div>`;

export const selectWc: WebComponentDemo = {
    tag: 'pttrn-select',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Choosing an option sets `value` and fires `pttrn-change`; the element submits `name` and `value` with its form. `label`, `helper-text` and `error-message` draw the field around it.',
    Wrapper: SelectWc,
    toHtml: selectToHtml,
};
