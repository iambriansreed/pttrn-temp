import './banner-alert.scss';
import { SvgCheckCircleFill } from '@ptrn/icons/CheckCircleFill';
import { SvgClose } from '@ptrn/icons/Close';
import { SvgErrorFill } from '@ptrn/icons/ErrorFill';
import { SvgInfoFill } from '@ptrn/icons/InfoFill';
import { SvgWarningFill } from '@ptrn/icons/WarningFill';
import { Button } from '-/components/Button';
import { ElementProps, AlertVariant, CallToActionButton } from '-/types/common';

export type BannerAlertProps = {
    /**
     * The color variant of the banner alert.
     *
     * @default informational
     */
    variant?: AlertVariant;
    /**
     * The function to call when the banner alert is closed. If not included the close button will not be displayed.
     *
     * @type () => void
     */
    onClose?: () => void;
    /**
     * The header of the banner alert.
     *
     * @required
     */
    header: string;
    /**
     * The body of the banner alert.
     *
     * @type multiline
     * @required
     */
    body: string;
    /**
     * This property may be undefined or an object containing required CallToActionButton properties.
     *
     * @type CallToActionButton
     */
    callToAction?: CallToActionButton;
    /**
     * Is the alert elevated. If true a drop shadow is added.
     *
     * @default false
     */
    elevated?: boolean;
};

/**
 * A visual and contextual message used to communicate an important message or notification to users relating to a
 * status or the body content of a page.
 *
 * @example
 *     import { BannerAlert } from '@ptrn/react/BannerAlert';
 *
 *     <div style={{ width: '100%', padding: '0 20px' }}>
 *         <BannerAlert
 *             elevated={true}
 *             variant="success"
 *             header="Success"
 *             body="Your request was processed successfully."
 *             onClose={() => sendSnackbar('Alert closed')}
 *             callToAction={{
 *                 label: 'Click me',
 *                 onClick: () => action('Call to action clicked!'),
 *             }}
 *         />
 *     </div>;
 *
 * @exampleDescription This example shows how to use the BannerAlert component with an error variant, a header, and a body message.
 *
 *
 *
 *
 * @name BannerAlert
 * @phase Stable
 */
export function BannerAlert({
    variant = 'informational',
    onClose,
    header,
    callToAction,
    body,
    elevated = false,
}: ElementProps<BannerAlertProps, 'div'>) {
    return (
        <div data-elevated={elevated || undefined} data-pttrn="banner-alert" data-variant={variant} role="alert">
            <div aria-hidden data-icon-bar>
                {variant === 'error' && <SvgErrorFill />}
                {variant === 'informational' && <SvgInfoFill />}
                {variant === 'success' && <SvgCheckCircleFill />}
                {variant === 'warning' && <SvgWarningFill />}
            </div>
            <div data-content>
                {(header || onClose) && (
                    <div data-header>
                        <span>{header}</span>
                        {typeof onClose === 'function' && (
                            <Button
                                icon={<SvgClose />}
                                iconOnly
                                label="Close"
                                onClick={onClose}
                                size="small"
                                variant="tertiary"
                            />
                        )}
                    </div>
                )}
                <div data-body>
                    <span>{body}</span>
                    {callToAction?.label && callToAction?.onClick && (
                        <Button
                            label={callToAction.label}
                            onClick={callToAction.onClick}
                            size="small"
                            variant="tertiary"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
