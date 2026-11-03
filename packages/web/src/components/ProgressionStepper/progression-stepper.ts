import check from '@ptrn/icons/Check.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import styles from './progression-stepper.scss';

type Step = { name: string; subtext: string };
type Status = 'complete' | 'current' | 'incomplete';

const CHECK = unsafeSVG(check.replace('<svg ', '<svg aria-hidden="true" '));

/** A step's value: the property once the item is upgraded, the attribute before. */
const read = (item: Element, key: keyof Step) => String((item as Partial<Step>)[key] ?? item.getAttribute(key) ?? '');

/**
 * A progress stepper is a horizontal visual indicator that lets the user know the progression of the current process.
 *
 * The steps are `pttrn-progression-stepper-item` children. The stepper draws them as one ordered list in its shadow
 * root, a list item per step with `aria-current="step"` on the current one, so the items themselves render nothing. A
 * completed step shows an `aria-hidden` check and says "completed" in visually hidden text. The stepper has no name or
 * landmark of its own: introduce it with a heading. With no steps nothing renders.
 *
 * React to Web Component mapping:
 *
 * | React               | Web Component                             | Note                                            |
 * | ------------------- | ----------------------------------------- | ----------------------------------------------- |
 * | `steps[]`           | child `<pttrn-progression-stepper-item>`s | One per step, in order.                         |
 * | `steps[].name`      | `name` attribute on the item              |                                                 |
 * | `steps[].subtext`   | `subtext` attribute on the item           |                                                 |
 * | `steps[].touchLink` | none                                      | The React component does not use it.            |
 * | `completedStep`     | `completed-step` attribute                | Clamped to 0 through the step count.            |
 * | `variant`           | `variant` attribute (reflected)           | `horizontal` (default), `vertical` or `widget`. |
 *
 * @element pttrn-progression-stepper
 */
export class PttrnProgressionStepper extends LitElement {
    static properties = {
        completedStep: { type: Number, attribute: 'completed-step' },
        variant: { type: String, reflect: true },
    };

    static styles = styles;

    /** The last completed step. The next one is current. Below 0 completes nothing; past the last step completes all. */
    declare completedStep: number;
    /** The layout: a horizontal or vertical trail, or a compact widget with a header naming the current step. */
    declare variant: 'horizontal' | 'vertical' | 'widget';

    private readonly _observer = new MutationObserver(() => this.requestUpdate());

    constructor() {
        super();
        this.completedStep = 0;
        this.variant = 'horizontal';
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, { childList: true, attributes: true, subtree: true });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
    }

    private get _steps(): Step[] {
        return [...this.children]
            .filter((child) => child.localName === 'pttrn-progression-stepper-item')
            .map((item) => ({ name: read(item, 'name'), subtext: read(item, 'subtext') }));
    }

    render() {
        const steps = this._steps;
        if (!steps.length) return nothing;

        const completedStep = Number.isFinite(this.completedStep) ? Math.floor(this.completedStep) : 0;
        const completed = Math.max(0, Math.min(completedStep, steps.length));
        const status = (number: number): Status =>
            completed >= number ? 'complete' : completed + 1 === number ? 'current' : 'incomplete';

        return html`
            <div data-pttrn="progression-stepper" data-variant=${this.variant}>
                ${this.variant === 'widget' ? this._header(steps, completed) : nothing}
                <ol>
                    ${steps.map((step, index) => this._step(step, index + 1, status(index + 1)))}
                </ol>
            </div>
        `;
    }

    /** The widget's header: the current step's name over its subtext, "Step N of M", or "Completed". */
    private _header(steps: Step[], completed: number) {
        const number = Math.min(completed + 1, steps.length);
        const { name, subtext } = steps[number - 1];
        const subtitle = subtext || (completed === steps.length ? 'Completed' : `Step ${number} of ${steps.length}`);
        return html`<div data-header>
            <span data-title>${name}</span>
            <span data-subtitle>${subtitle}</span>
        </div>`;
    }

    private _step({ name, subtext }: Step, number: number, status: Status) {
        const widget = this.variant === 'widget';
        const complete = status === 'complete';
        // A completed step shows a check; the widget shows only the current step's number.
        const mark = complete ? CHECK : !widget || status === 'current' ? html`<span>${number}</span>` : nothing;
        // The check is decorative, so the words carry it. The widget shows no names but still gives each one to
        // assistive technology.
        const text = widget
            ? html`<span data-sr-only>${name}${complete ? ', completed' : ''}</span>`
            : html`<span data-content>
                  <span data-name>${name}</span>
                  ${subtext ? html`<span data-subtext>${subtext}</span>` : nothing}
                  ${complete ? html`<span data-sr-only>, completed</span>` : nothing}
              </span>`;

        return html`<li
            aria-current=${status === 'current' ? 'step' : nothing}
            data-status=${status}
            data-step=${number}
        >
            <span data-line-circle>
                <span data-line="before"></span>
                <span data-circle>${mark}</span>
                <span data-line="after"></span>
            </span>
            ${text}
        </li>`;
    }
}

define('pttrn-progression-stepper', PttrnProgressionStepper);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-progression-stepper': PttrnProgressionStepper;
    }
}
