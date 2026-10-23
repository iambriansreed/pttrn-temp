import './progression-stepper-bar.scss';
import { cssWithVars } from '-/utils/cwv';

export type ProgressionStepperBarProps = {
    /**
     * The number of steps in the progress bar.
     *
     * @example
     *     5;
     *
     * @minimum 2
     * @maximum 10
     * @required
     */
    stepCount: number;
    /**
     * The last step completed.
     *
     * @example
     *     2;
     *
     * @default 0
     * @minimum 0
     */
    stepCompleted?: number;
    /**
     * The size of the progress bar.
     *
     * @default large
     */
    size?: 'large' | 'small';
};

/**
 * Component description coming soon.
 *
 * @name ProgressionStepperBar
 * @phase Stable
 */
export function ProgressionStepperBar({
    stepCount,
    stepCompleted: stepCompletedProp = 0,
    size = 'large',
    ...containerProps
}: ProgressionStepperBarProps) {
    const stepCompleted = Math.max(0, Math.min(stepCompletedProp, stepCount));

    return (
        <div
            data-pttrn="progression-stepper-bar"
            data-size={size}
            style={cssWithVars({ '--steps': stepCount })}
            {...containerProps}
        >
            {/* The segments picture the count below, which is the text assistive technology reads. */}
            <div aria-hidden data-steps>
                {Array.from({ length: stepCount }, (_, i) => (
                    <div data-complete={i < stepCompleted || undefined} data-step={i} key={i} />
                ))}
            </div>
            <span data-label>
                {String(stepCompleted)} of {String(stepCount)} steps completed.
            </span>
        </div>
    );
}
