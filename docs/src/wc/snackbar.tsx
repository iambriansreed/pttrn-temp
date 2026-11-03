import '@ptrn/web/Button';
import { SnackbarProps } from '@ptrn/react/Snackbar';
import { clearSnackbar, sendSnackbar } from '@ptrn/web/Snackbar';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { updateComponentContext } from 'src/components/ComponentProvider';
import { attrs, flag, iconHtml, slotted } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The elements as React components for the demo. A boolean attribute is '' for on and undefined for off. */
const PttrnButton = 'pttrn-button' as unknown as ComponentType<any>;
const PttrnSnackbar = 'pttrn-snackbar' as unknown as ComponentType<any>;
const PttrnSnackbarManager = 'pttrn-snackbar-manager' as unknown as ComponentType<any>;

type DemoProps = Partial<SnackbarProps>;

/** The attributes of `pttrn-snackbar` for the demo state. */
const snackbarAttributes = ({
    open,
    text,
    timeout,
    closeButton = true,
    closeButtonLabel,
    disableFocusTrap,
}: DemoProps) => ({
    open: !!open,
    text,
    timeout: timeout || undefined,
    'hide-close-button': closeButton === false,
    'close-button-label': closeButtonLabel && closeButtonLabel !== 'Dismiss' ? closeButtonLabel : undefined,
    'disable-focus-trap': !!disableFocusTrap,
});

/**
 * The React example rendered with the elements: the inline snackbar, driven by the demo's `open`, and the buttons that
 * launch one through `sendSnackbar()` and the page's `pttrn-snackbar-manager`, and clear it.
 */
function SnackbarWc(props: DemoProps) {
    const ref = useRef<HTMLDivElement>(null);
    const latest = useRef(props);
    latest.current = props;
    const attributes = snackbarAttributes(props);

    useEffect(() => {
        const root = ref.current;
        if (!root) return undefined;
        const onClick = async (event: Event) => {
            const button = (event.target as Element).closest?.('pttrn-button');
            if (button?.hasAttribute('data-inline')) updateComponentContext({ open: true });
            if (button?.hasAttribute('data-clear')) clearSnackbar();
            if (button?.hasAttribute('data-managed')) {
                const current = latest.current;
                sendSnackbar({
                    text: `Managed: ${current.text}`,
                    timeout: current.timeout,
                    closeButton: current.closeButton,
                    closeButtonLabel: current.closeButtonLabel,
                    disableFocusTrap: current.disableFocusTrap,
                    icon: (await iconHtml(current.icon, '')) || undefined,
                });
            }
        };
        const onClose = (event: Event) => {
            if ((event.target as Element).parentElement?.localName === 'pttrn-snackbar-manager') return;
            event.preventDefault();
            updateComponentContext({ open: false });
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
            <PttrnSnackbar
                close-button-label={attributes['close-button-label']}
                disable-focus-trap={flag(attributes['disable-focus-trap'])}
                hide-close-button={flag(attributes['hide-close-button'])}
                open={flag(attributes.open)}
                text={attributes.text}
                timeout={attributes.timeout}
            >
                {slotted(props.icon)}
            </PttrnSnackbar>
            <PttrnButton data-inline label="Launch Inline Snackbar" size="medium" />
            <br />
            <PttrnButton data-managed label="Launch Managed Snackbar" />
            <br />
            <PttrnButton data-clear label="Clear Managed Snackbar" />
            <PttrnSnackbarManager />
        </div>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
async function snackbarToHtml(props: Record<string, unknown>) {
    const demo = props as DemoProps;
    const icon = await iconHtml(demo.icon);
    return `<pttrn-snackbar${attrs(snackbarAttributes(demo))}>${icon ? `\n${icon}\n` : ''}</pttrn-snackbar>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-button label="Save" onclick="document.getElementById('usage-snackbar').open = true"></pttrn-button>
<pttrn-snackbar id="usage-snackbar" text="Your changes are saved" timeout="5000"></pttrn-snackbar>

<!--
    Or, from script: put one <pttrn-snackbar-manager> on the page and call
    sendSnackbar('Your changes are saved') and clearSnackbar() from @ptrn/web/Snackbar.
-->`;

export const snackbarWc: WebComponentDemo = {
    tag: 'pttrn-snackbar',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. Set `open` to show the snackbar; the dismiss button and the `timeout` fire `pttrn-close` and close it unless you cancel the event. From script, put a `pttrn-snackbar-manager` on the page and call `sendSnackbar()` and `clearSnackbar()`.',
    Wrapper: SnackbarWc,
    toHtml: snackbarToHtml,
};
