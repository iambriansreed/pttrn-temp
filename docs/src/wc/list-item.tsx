import '@ptrn/web/ListItem';
import { ListItemProps } from '@ptrn/react/ListItem';
import { createExampleChildElement } from '@ptrn/react/utils/createExampleChildElement';
import { ComponentType, ReactElement, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { updateComponentContext } from 'src/components/ComponentProvider';
import { action } from 'src/utils/actions';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnListItem = 'pttrn-list-item' as unknown as ComponentType<any>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const flag = (value: unknown) => (value ? '' : undefined);

type DemoProps = Partial<ListItemProps> & {
    disabled?: boolean;
    readOnly?: boolean;
    'aria-disabled'?: boolean;
    'aria-readonly'?: boolean;
    active?: boolean;
};

/** The leading and trailing examples the React demo picks by name (Avatar, Checkbox, Icon…), as React elements. */
function slotContent(props: DemoProps, name: 'leading' | 'trailing'): ReactElement | null {
    return createExampleChildElement({
        exampleState: props,
        name,
        setState: updateComponentContext,
        action,
        id: (props as { id?: string }).id,
    }).element;
}

/** The React demo state rendered as the element; `onClick` becomes `clickable` and a `click` listener. */
function ListItemWc(props: DemoProps) {
    const { label, subText, href, role, onClick, as, width, active } = props;
    const ref = useRef<HTMLElement>(null);
    const leading = slotContent(props, 'leading');
    const trailing = slotContent(props, 'trailing');

    useEffect(() => {
        const element = ref.current;
        if (!element || !onClick) return undefined;
        const listener = (event: Event) => onClick(event as unknown as Parameters<NonNullable<typeof onClick>>[0]);
        element.addEventListener('click', listener);
        return () => element.removeEventListener('click', listener);
    }, [onClick]);

    return (
        <PttrnListItem
            active={flag(active)}
            aria-disabled={props['aria-disabled'] ? 'true' : undefined}
            aria-readonly={props['aria-readonly'] ? 'true' : undefined}
            clickable={flag(onClick || as === 'button')}
            disabled={flag(props.disabled)}
            href={href || undefined}
            label={label}
            readonly={flag(props.readOnly)}
            ref={ref}
            role={role || undefined}
            sub-text={subText || undefined}
            width={width === 'hug' ? 'hug' : undefined}
        >
            {leading && <span slot="leading">{leading}</span>}
            {trailing && <span slot="trailing">{trailing}</span>}
        </PttrnListItem>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function listItemToHtml(props: Record<string, unknown>) {
    const demo = props as DemoProps;
    const attrs = [
        `label="${escapeAttr(demo.label ?? '')}"`,
        demo.subText && `sub-text="${escapeAttr(demo.subText)}"`,
        demo.href && `href="${escapeAttr(demo.href)}"`,
        demo.role && `role="${escapeAttr(String(demo.role))}"`,
        (demo.onClick || demo.as === 'button') && 'clickable',
        demo.disabled && 'disabled',
        demo.readOnly && 'readonly',
        demo['aria-disabled'] && 'aria-disabled="true"',
        demo['aria-readonly'] && 'aria-readonly="true"',
        demo.active && 'active',
        demo.width === 'hug' && 'width="hug"',
    ].filter(Boolean);
    const slot = (name: 'leading' | 'trailing') => {
        const element = slotContent(demo, name);
        return element ? `<span slot="${name}">${renderToStaticMarkup(element)}</span>` : '';
    };
    const inner = [slot('leading'), slot('trailing')].filter(Boolean).join('\n');
    return `<pttrn-list-item ${attrs.join(' ')}>${inner ? `\n${inner}\n` : ''}</pttrn-list-item>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<div style="width: 300px">
    <pttrn-list-item label="File 13" sub-text="Last modified: Jan 21, 2024" clickable></pttrn-list-item>
    <pttrn-list-item label="Death Star Plans" sub-text="Last modified: May 25, 1977" href="#plans"></pttrn-list-item>
</div>

<script>
    document.querySelector('pttrn-list-item[clickable]').addEventListener('click', () => {
        console.log('Opening File 13');
    });
</script>`;

export const listItemWc: WebComponentDemo = {
    tag: 'pttrn-list-item',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Add `clickable` and listen for `click` for a button row, or set `href` for a link row; put icons, images or controls in the `leading` and `trailing` slots.',
    Wrapper: ListItemWc,
    toHtml: listItemToHtml,
};
