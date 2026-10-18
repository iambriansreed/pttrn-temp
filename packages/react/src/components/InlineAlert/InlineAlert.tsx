import './inline-alert.scss';
import { SvgCheckCircleFill } from '@ptrn/icons/CheckCircleFill';
import { SvgErrorFill } from '@ptrn/icons/ErrorFill';
import { SvgInfoFill } from '@ptrn/icons/InfoFill';
import { ReactNode } from 'react';
import { SvgWarningTwoTone } from './SvgWarningTwoTone';
import { Txt } from '-/components/Txt';
import { AlertVariant, CommonProps } from '-/types/common';

export type InlineAlertProps = CommonProps<'owner'> & {
    /**
     * The content of the inline alert.
     *
     * @type multiline
     * @required
     */
    label: string;
    /**
     * The color variant of the inline alert.
     *
     * @default informational
     */
    variant?: AlertVariant;
    /** The id of the inline alert. */
    id?: string;
};

/**
 * Inline alerts provide contextual feedback messages for typical user actions with a handful of available and flexible
 * alert messages.
 *
 * @example
 *     import { InlineAlert } from '@ptrn/react/InlineAlert';
 *
 *     <InlineAlert variant="informational">Example informational inline alert</InlineAlert>;
 *
 * @name InlineAlert
 * @phase Stable
 */
export function InlineAlert({ label, variant = 'informational', id, owner }: InlineAlertProps) {
    return (
        <div
            data-pttrn="inline-alert"
            data-pttrn-owner={owner || undefined}
            data-variant={variant}
            id={id}
            role="alert"
        >
            {VARIANT_ICON[variant]}
            <Txt variant="body-small">{label}</Txt>
        </div>
    );
}

const VARIANT_ICON: Record<AlertVariant, ReactNode> = {
    error: <SvgErrorFill />,
    informational: <SvgInfoFill />,
    success: <SvgCheckCircleFill />,
    warning: <SvgWarningTwoTone />,
};
