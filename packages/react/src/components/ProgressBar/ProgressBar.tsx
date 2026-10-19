import './progress-bar.scss';
import { useId } from '-/hooks/useId';
import { cssWithVars } from '-/utils/cwv';

export type ProgressBarProps = {
    /**
     * The size of the progressbar.
     *
     * @default large
     */
    size?: 'large' | 'small';
    /**
     * The current progress of the progressbar.
     *
     * @example
     *     42;
     *
     * @default 0
     * @minimum 0
     * @maximum 100
     *
     * @required
     */
    completion: number;
    /**
     * The label alignment of the progressbar.
     *
     * @default center
     */
    align?: 'center' | 'left';
    /** The label of the progressbar. */
    label: string;
    /**
     * If true and completion = 100, displays the progress bar in the success color.
     *
     * @deprecated This has a very narrow use-case. See guidelines for more information.
     * @default false
     */
    successColor?: boolean;
    /**
     * Whether to hide the success color when the progress bar is complete.
     *
     * @deprecated This has a very narrow use-case. See guidelines for more information.
     * @default false
     */
    successHidden?: boolean;
};

/**
 * A progress bar is a horizontal visual indicator that let’s the user know the progression of a task or operation
 * occurring in the background.
 *
 * @example
 *     import { ProgressBar } from '@ptrn/react/ProgressBar';
 *
 *     <ProgressBar label="Example label" completion={50} />;
 *
 * @name ProgressBar
 * @phase Stable
 */
export function ProgressBar({
    size = 'large',
    completion: completionProp = 0,
    align = 'center',
    label,
    successColor = false,
    successHidden = false,
}: ProgressBarProps) {
    const id = useId();
    const completion = Math.max(0, Math.min(100, Math.round(completionProp))); // Ensure completion is between 0 and 100

    if (successHidden && completion === 100) return null;

    return (
        <div
            data-align={align}
            data-pttrn="progress-bar"
            data-size={size}
            data-success={successColor && completion === 100 ? 'color' : undefined}
        >
            <progress
                aria-busy={completion < 100}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={completion}
                id={id}
                max="100"
                value={completion}
            >
                {completion}%
            </progress>
            <div aria-hidden data-bar style={cssWithVars({ '--width': `${completion}%` })} />
            <label htmlFor={id}>{label}</label>
        </div>
    );
}
