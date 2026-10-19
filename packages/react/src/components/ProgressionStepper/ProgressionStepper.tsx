import './progression-stepper.scss';
import { SvgCheck } from '@ptrn/icons/Check';
import { ElementProps } from '-/types/common';

/** A progress stepper item is a single step in the progress bar. */
export type ProgressionStepperItem = {
    /**
     * The name of the step.
     *
     * @type string
     * @required
     */
    name: string;
    /**
     * The subtext of the step.
     *
     * @type multiline
     */
    subtext?: string;
    /**
     * The link to navigate to when the step is clicked.
     *
     * @type {label: string; onClick: () => void}
     */
    touchLink?: { label: string; onClick: () => void };
};

export type ProgressionStepperProps = {
    /**
     * The steps to display in the progress bar.
     *
     * @example
     *     [{ name: 'Name of step 1' }, { name: 'Name of step 2' }, { name: 'Name of step 3' }];
     *
     * @type Array<ProgressionStepperItem>
     * @required
     */
    steps: ProgressionStepperItem[];
    /**
     * The last completed step in the progress bar. This is only applicable for the 'widget' variant.
     *
     * @default 0
     * @minimum 0
     */
    completedStep?: number;
    /**
     * The variant of the progress bar. Can be either horizontal, vertical, or widget.
     *
     * When on small width screens, the default will automatically switch to widget.
     *
     * @default horizontal
     */
    variant?: 'horizontal' | 'vertical' | 'widget';
};

/**
 * A progress stepper is a horizontal visual indicator that let’s the user know the progression of the current process.
 *
 * @example
 *     import { ProgressionStepper } from '@ptrn/react/ProgressionStepper';
 *
 *     <ProgressionStepper steps={[{ name: 'Step 1' }, { name: 'Step 2' }, { name: 'Step 3' }]} />;
 *
 * @name ProgressionStepper
 * @phase Stable
 */
export function ProgressionStepper({
    steps = [],
    completedStep: completedStepProp = 0,
    variant = 'horizontal',
    ...containerProps
}: ElementProps<ProgressionStepperProps, 'div'>) {
    const completedStepNumber = Math.max(0, Math.min(completedStepProp, steps.length));

    const currentStepNumber = Math.min(completedStepNumber + 1, steps.length);

    const currentStep = steps[currentStepNumber - 1];

    if (!steps?.length) return null;

    return (
        <div {...containerProps} data-pttrn="progression-stepper" data-variant={variant}>
            {variant === 'widget' && (
                <div data-header>
                    <span data-title>{currentStep.name}</span>
                    <span data-subtitle>
                        {currentStep?.subtext ||
                            (completedStepNumber === steps.length ? (
                                'Completed'
                            ) : (
                                <>
                                    Step {currentStepNumber} of {steps.length}
                                </>
                            ))}
                    </span>
                </div>
            )}
            <ol>
                {steps.map(({ name, subtext }, index) => {
                    const stepNum = index + 1;
                    let status: 'complete' | 'current' | 'incomplete' = 'incomplete';
                    if (completedStepNumber >= stepNum) status = 'complete';
                    else if (completedStepNumber + 1 === stepNum) status = 'current';

                    return (
                        <li
                            aria-current={status === 'current' ? 'step' : undefined}
                            data-status={status}
                            data-step={stepNum}
                            key={`step-${index}`}
                        >
                            <span data-line-circle>
                                <span data-line="before" />
                                <span data-circle>
                                    {status === 'complete' ? (
                                        <SvgCheck aria-hidden={true} />
                                    ) : (
                                        (variant !== 'widget' || status === 'current') && <span>{stepNum}</span>
                                    )}
                                </span>
                                <span data-line="after" />
                            </span>
                            {variant !== 'widget' ? (
                                <span data-content>
                                    <span data-name>{name}</span>
                                    {subtext && <span data-subtext>{subtext}</span>}
                                    {/* The check that marks a completed step is decorative, so the word carries it. */}
                                    {status === 'complete' && <span data-sr-only>, completed</span>}
                                </span>
                            ) : (
                                // The widget shows no names in the list; assistive technology still gets each step.
                                <span data-sr-only>{`${name}${status === 'complete' ? ', completed' : ''}`}</span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
