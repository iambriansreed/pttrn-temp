import '@ptrn/web/Button';
import '@ptrn/web/Modal';
import { ModalProps } from '@ptrn/react/Modal';
import { ComponentType, ReactElement, ReactNode, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { updateComponentContext } from 'src/components/ComponentProvider';
import { attrs, flag } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnButton = 'pttrn-button' as unknown as ComponentType<any>;
const PttrnModal = 'pttrn-modal' as unknown as ComponentType<any>;

type DemoProps = Partial<ModalProps>;

/** `cancelButton` is true for "Cancel" or a string label; the attribute is present-and-empty or the label. */
const cancelAttribute = (cancelButton: DemoProps['cancelButton']) =>
    cancelButton === true ? '' : typeof cancelButton === 'string' && cancelButton ? cancelButton : undefined;

const nodeToHtml = (node: ReactNode) =>
    node === null || node === undefined || typeof node === 'boolean'
        ? ''
        : typeof node === 'string' || typeof node === 'number'
          ? String(node)
          : renderToStaticMarkup(node as ReactElement);

/**
 * The React example (an "Open Modal" button and the modal) rendered with the elements. The button and `pttrn-close`
 * drive the demo's `open`, as `onClose` does in React, and `pttrn-action` calls the call to action's `onClick`.
 */
function ModalWc({
    open,
    header,
    description,
    callToAction,
    cancelButton,
    buttonFormat,
    disableFocusTrap,
    children,
}: DemoProps) {
    const ref = useRef<HTMLDivElement>(null);
    const onAction = useRef(callToAction?.onClick);
    onAction.current = callToAction?.onClick;

    useEffect(() => {
        const root = ref.current;
        if (!root) return undefined;
        const onClick = (event: Event) => {
            if ((event.target as Element).closest?.('pttrn-button[data-open]')) updateComponentContext({ open: true });
        };
        const onClose = (event: Event) => {
            event.preventDefault();
            updateComponentContext({ open: false });
        };
        const onActionEvent = () => onAction.current?.();
        root.addEventListener('click', onClick);
        root.addEventListener('pttrn-close', onClose);
        root.addEventListener('pttrn-action', onActionEvent);
        return () => {
            root.removeEventListener('click', onClick);
            root.removeEventListener('pttrn-close', onClose);
            root.removeEventListener('pttrn-action', onActionEvent);
        };
    }, []);

    return (
        <div ref={ref} style={{ display: 'contents' }}>
            <PttrnButton data-open label="Open Modal" />
            <PttrnModal
                action-destructive={flag(callToAction?.destructive)}
                action-label={callToAction?.label || undefined}
                button-format={buttonFormat}
                cancel-button={cancelAttribute(cancelButton)}
                description={description}
                disable-focus-trap={flag(disableFocusTrap)}
                header={header}
                open={flag(open)}
            >
                {children}
            </PttrnModal>
        </div>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function modalToHtml(props: Record<string, unknown>) {
    const demo = props as DemoProps;
    const attributes = attrs({
        id: 'example-modal',
        open: !!demo.open,
        header: demo.header,
        description: demo.description,
        'action-label': demo.callToAction?.label,
        'action-destructive': !!demo.callToAction?.destructive,
        'cancel-button': cancelAttribute(demo.cancelButton) === '' ? true : cancelAttribute(demo.cancelButton),
        'button-format': demo.buttonFormat && demo.buttonFormat !== 'horizontal' ? demo.buttonFormat : undefined,
        'disable-focus-trap': !!demo.disableFocusTrap,
    });
    const content = nodeToHtml(demo.children);
    return `<pttrn-button label="Open Modal" onclick="document.getElementById('example-modal').open = true"></pttrn-button>
<pttrn-modal${attributes}>${content ? `\n${content}\n` : ''}</pttrn-modal>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-button label="Change email" onclick="document.getElementById('usage-modal').open = true"></pttrn-button>
<pttrn-modal
    id="usage-modal"
    header="Change your email"
    description="Confirm the change to your email address."
    action-label="Save"
    cancel-button
>
    <p>We will send a confirmation link to your new address.</p>
</pttrn-modal>

<script>
    document.querySelector('#usage-modal').addEventListener('pttrn-action', (event) => {
        event.target.open = false;
    });
</script>`;

export const modalWc: WebComponentDemo = {
    tag: 'pttrn-modal',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Set `open` to show the modal. The close and cancel buttons, Escape and the scrim fire `pttrn-close` and close it unless you cancel the event; the call to action fires `pttrn-action`.',
    Wrapper: ModalWc,
    toHtml: modalToHtml,
};
