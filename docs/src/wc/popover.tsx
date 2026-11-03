import '@ptrn/web/Popover';
import { Button } from '@ptrn/react/Button';
import { PopoverProps } from '@ptrn/react/Popover';
import { Txt } from '@ptrn/react/Txt';
import { ComponentType, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnPopover = 'pttrn-popover' as unknown as ComponentType<any>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The trigger the React demo renders: a secondary Button labelled with the placement. */
const trigger = (placement: PopoverProps['placement']) => <Button label={`${placement}`} variant="secondary" />;

/**
 * The React demo state rendered as the element, under the same caption as the React demo. The calls to action become
 * `action-label` and `secondary-action-label`, and `pttrn-action` calls their `onClick`.
 */
function PopoverWc({
    header,
    content,
    placement,
    disabled,
    refWidth,
    callToAction,
    secondaryCallToAction,
}: Partial<PopoverProps>) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return undefined;
        const listener = (event: Event) => {
            const { action } = (event as CustomEvent<{ action: 'primary' | 'secondary' }>).detail;
            (action === 'primary' ? callToAction : secondaryCallToAction)?.onClick?.();
        };
        element.addEventListener('pttrn-action', listener);
        return () => element.removeEventListener('pttrn-action', listener);
    }, [callToAction, secondaryCallToAction]);

    return (
        <>
            <Txt style={{ marginBottom: `var(--usa-spacing-1)` }}>Click for a Popover</Txt>
            <PttrnPopover
                action-label={callToAction?.label || undefined}
                content={content}
                disabled={disabled ? '' : undefined}
                header={header}
                placement={placement}
                ref={ref}
                ref-width={refWidth ? '' : undefined}
                secondary-action-label={secondaryCallToAction?.label || undefined}
            >
                {trigger(placement)}
            </PttrnPopover>
        </>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function popoverToHtml({
    header,
    content,
    placement,
    disabled,
    refWidth,
    callToAction,
    secondaryCallToAction,
}: Partial<PopoverProps>) {
    const attrs = [
        header && `header="${escapeAttr(header)}"`,
        content && `content="${escapeAttr(content)}"`,
        placement && placement !== 'top' && `placement="${placement}"`,
        callToAction?.label && `action-label="${escapeAttr(callToAction.label)}"`,
        secondaryCallToAction?.label && `secondary-action-label="${escapeAttr(secondaryCallToAction.label)}"`,
        refWidth && 'ref-width',
        disabled && 'disabled',
    ].filter(Boolean);
    return `<pttrn-popover ${attrs.join(' ')}>\n${renderToStaticMarkup(trigger(placement))}\n</pttrn-popover>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-popover placement="bottom" header="Popover Header" content="This is a popover content" action-label="Action">
    <button type="button">Toggle popover</button>
</pttrn-popover>

<script>
    document.querySelector('pttrn-popover').addEventListener('pttrn-action', (event) => {
        console.log('Clicked the', event.detail.action, 'action');
    });
</script>`;

export const popoverWc: WebComponentDemo = {
    tag: 'pttrn-popover',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The first child element is the trigger; the action buttons fire `pttrn-action`.',
    Wrapper: PopoverWc,
    toHtml: popoverToHtml,
};
