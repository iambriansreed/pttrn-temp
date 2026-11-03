import '@ptrn/web/BannerAlert';
import { BannerAlertProps } from '@ptrn/react/BannerAlert';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs, flag } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnBannerAlert = 'pttrn-banner-alert' as unknown as ComponentType<any>;

/** The call to action shows only with a label and an onClick, as in React. The demo state may hold either one alone. */
const actionLabel = ({ callToAction }: Partial<BannerAlertProps>) =>
    callToAction?.label && typeof callToAction.onClick === 'function' ? callToAction.label : undefined;

/**
 * The React demo state rendered as the element. The header falls back like the React example's render does, and
 * `onClose` and `callToAction.onClick` listen for the element's events.
 */
function BannerAlertWc(props: Partial<BannerAlertProps>) {
    const { body, callToAction, elevated, header, onClose, variant } = props;
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const close = () => onClose?.();
        const action = () => callToAction?.onClick?.();
        element.addEventListener('pttrn-close', close);
        element.addEventListener('pttrn-action', action);
        return () => {
            element.removeEventListener('pttrn-close', close);
            element.removeEventListener('pttrn-action', action);
        };
    }, [onClose, callToAction]);

    return (
        <PttrnBannerAlert
            action-label={actionLabel(props)}
            body={body}
            closable={flag(typeof onClose === 'function')}
            elevated={flag(elevated)}
            header={header || 'This is a banner alert'}
            ref={ref}
            variant={variant}
        />
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function bannerAlertToHtml(props: Partial<BannerAlertProps>) {
    const attributes = attrs({
        variant: props.variant,
        header: props.header || 'This is a banner alert',
        body: props.body,
        elevated: !!props.elevated,
        closable: typeof props.onClose === 'function',
        'action-label': actionLabel(props),
    });
    return `<pttrn-banner-alert${attributes}></pttrn-banner-alert>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-banner-alert
    variant="success"
    header="Success"
    elevated
    closable
    action-label="Click me"
>
    Your request was processed successfully.
</pttrn-banner-alert>`;

export const bannerAlertWc: WebComponentDemo = {
    tag: 'pttrn-banner-alert',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. `closable` shows the Close button, which fires `pttrn-close` (remove the alert in the listener), and `action-label` shows a button that fires `pttrn-action`.',
    Wrapper: BannerAlertWc,
    toHtml: (props) => bannerAlertToHtml(props as Partial<BannerAlertProps>),
};
