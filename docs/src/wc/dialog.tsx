import '@ptrn/web/Button';
import '@ptrn/web/Dialog';
import closeIcon from '@ptrn/icons/Close.svg?raw';
import { DialogProps } from '@ptrn/react/Dialog';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { updateComponentContext } from 'src/components/ComponentProvider';
import { attrs, flag } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnButton = 'pttrn-button' as unknown as ComponentType<any>;
const PttrnDialog = 'pttrn-dialog' as unknown as ComponentType<any>;

const CLOSE_ICON = closeIcon.trim().replace('<svg', '<svg slot="icon"');
const TITLE_ID = 'exampleId-title';

/** The heading row of the React example (a Flex), as inline styles. */
const HEADER_STYLE =
    'display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: var(--usa-spacing-2)';

type DemoProps = Partial<DialogProps>;

/** The attributes of `pttrn-dialog` for the demo state. */
const dialogAttributes = ({ open, placement, showScrim = true, widthFull, disableFocusTrap }: DemoProps) => ({
    labelledby: TITLE_ID,
    open: !!open,
    placement: placement && placement !== 'center' ? placement : undefined,
    'hide-scrim': showScrim === false,
    'width-full': !!widthFull,
    'disable-focus-trap': !!disableFocusTrap,
});

/**
 * The React example (an "Open Dialog" button and a dialog with a heading, a close button and a line of text) rendered
 * with the elements. The buttons and `pttrn-close` drive the demo's `open`, as `onClose` does in React.
 */
function DialogWc(props: DemoProps) {
    const ref = useRef<HTMLDivElement>(null);
    const attributes = dialogAttributes(props);

    useEffect(() => {
        const root = ref.current;
        if (!root) return undefined;
        const close = () => updateComponentContext({ open: false });
        const onClick = (event: Event) => {
            const button = (event.target as Element).closest?.('pttrn-button');
            if (button?.hasAttribute('data-open')) updateComponentContext({ open: true });
            if (button?.hasAttribute('data-close')) close();
        };
        const onClose = (event: Event) => {
            event.preventDefault();
            close();
        };
        root.addEventListener('click', onClick);
        root.addEventListener('pttrn-close', onClose);
        return () => {
            root.removeEventListener('click', onClick);
            root.removeEventListener('pttrn-close', onClose);
        };
    }, []);

    return (
        <div ref={ref} style={{ display: 'contents' }}>
            <PttrnButton data-open label="Open Dialog" />
            <PttrnDialog
                disable-focus-trap={flag(attributes['disable-focus-trap'])}
                hide-scrim={flag(attributes['hide-scrim'])}
                labelledby={TITLE_ID}
                open={flag(attributes.open)}
                placement={attributes.placement}
                width-full={flag(attributes['width-full'])}
            >
                <div style={{ padding: 'var(--usa-spacing-2)' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginBottom: 'var(--usa-spacing-2)',
                        }}
                    >
                        <h4 id={TITLE_ID}>Dialog</h4>
                        <PttrnButton
                            dangerouslySetInnerHTML={{ __html: CLOSE_ICON }}
                            data-close
                            icon-only
                            label="Close dialog"
                            variant="tertiary"
                        />
                    </div>
                    <p>Hello, I am a ({props.placement}) dialog!</p>
                </div>
            </PttrnDialog>
        </div>
    );
}

/** The HTML a Web Component user writes for the current demo state; the buttons open and close it. */
function dialogToHtml(props: Record<string, unknown>) {
    const demo = props as DemoProps;
    return `<pttrn-button label="Open Dialog" onclick="document.getElementById('example-dialog').open = true"></pttrn-button>
<pttrn-dialog id="example-dialog"${attrs(dialogAttributes(demo))}>
    <div style="padding: var(--usa-spacing-2)">
        <div style="${HEADER_STYLE}">
            <h4 id="${TITLE_ID}">Dialog</h4>
            <pttrn-button icon-only label="Close dialog" variant="tertiary" onclick="this.closest('pttrn-dialog').open = false">${CLOSE_ICON}</pttrn-button>
        </div>
        <p>Hello, I am a (${demo.placement ?? 'center'}) dialog!</p>
    </div>
</pttrn-dialog>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-button label="Open Dialog" onclick="document.getElementById('usage-dialog').open = true"></pttrn-button>
<pttrn-dialog id="usage-dialog" labelledby="usage-dialog-title">
    <div style="padding: var(--usa-spacing-2)">
        <h1 id="usage-dialog-title">Dialog Title</h1>
        <p>This is the content of the dialog.</p>
        <pttrn-button label="Cancel" variant="secondary" onclick="this.closest('pttrn-dialog').open = false"></pttrn-button>
    </div>
</pttrn-dialog>`;

export const dialogWc: WebComponentDemo = {
    tag: 'pttrn-dialog',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Set `open` to show the dialog; Escape and the scrim fire `pttrn-close` and close it unless you cancel the event. Name it with `labelledby` (the id of its heading) or `label`.',
    Wrapper: DialogWc,
    toHtml: dialogToHtml,
};
