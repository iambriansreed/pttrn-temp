import { LitElement, html } from 'lit';
import { define } from '../../utils/define';
import styles from './progression-stepper-bar.scss';

/** A whole number, or 0 for anything that is not a finite number. */
const whole = (value: number) => (Number.isFinite(value) ? Math.floor(value) : 0);

/**
 * A segmented bar that shows how many of a fixed number of steps are complete, with the count as text.
 *
 * The segments are decorative (`aria-hidden`); assistive technology reads only the count, "N of M steps completed.", so
 * put the bar next to the step it measures or under a heading that names the task. The bar is never focusable.
 *
 * React to Web Component mapping:
 *
 * | React           | Web Component                | Note                               |
 * | --------------- | ---------------------------- | ---------------------------------- |
 * | `stepCount`     | `step-count` attribute       |                                    |
 * | `stepCompleted` | `step-completed` attribute   | Clamped to 0 through `step-count`. |
 * | `size`          | `size` attribute (reflected) | `large` (default) or `small`.      |
 *
 * @element pttrn-progression-stepper-bar
 */
export class PttrnProgressionStepperBar extends LitElement {
    static properties = {
        stepCount: { type: Number, attribute: 'step-count' },
        stepCompleted: { type: Number, attribute: 'step-completed' },
        size: { type: String, reflect: true },
    };

    static styles = styles;

    /** The number of steps in the bar, from 2 to 10. */
    declare stepCount: number;
    /** The last step completed. Below 0 reads as 0 and above `step-count` as `step-count`. */
    declare stepCompleted: number;
    /** The height of the segments. */
    declare size: 'large' | 'small';

    constructor() {
        super();
        this.stepCount = 0;
        this.stepCompleted = 0;
        this.size = 'large';
    }

    render() {
        const count = Math.max(0, whole(this.stepCount));
        const completed = Math.max(0, Math.min(whole(this.stepCompleted), count));
        return html`
            <div data-pttrn="progression-stepper-bar" data-size=${this.size} style="--steps: ${count}">
                <div aria-hidden="true" data-steps>
                    ${Array.from(
                        { length: count },
                        (_, index) => html`<div ?data-complete=${index < completed} data-step=${index}></div>`,
                    )}
                </div>
                <span data-label>${completed} of ${count} steps completed.</span>
            </div>
        `;
    }
}

define('pttrn-progression-stepper-bar', PttrnProgressionStepperBar);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-progression-stepper-bar': PttrnProgressionStepperBar;
    }
}
