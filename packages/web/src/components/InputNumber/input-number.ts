import addIcon from '@ptrn/icons/Add.svg';
import removeIcon from '@ptrn/icons/Remove.svg';
import { ComplexAttributeConverter, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { define } from '../../utils/define';
import { FIELD_IDS, FieldControl } from '../../utils/field-control';
import { icon } from '../../utils/icon';
import styles from './input-number.scss';

/** A number, or undefined for anything that is not one (an empty field, `"abc"`). */
function toNumber(value: unknown): number | undefined {
    if (typeof value === 'number') return Number.isNaN(value) ? undefined : value;
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    const number = parseFloat(value);
    return Number.isNaN(number) ? undefined : number;
}

/** An empty or non-numeric attribute is no number, rather than the 0 or NaN Lit's `Number` would give. */
const optionalNumber: ComplexAttributeConverter<number | undefined> = {
    fromAttribute: (value) => toNumber(value),
    toAttribute: (value) => (value === undefined ? null : String(value)),
};

/** How long a held button waits before it repeats, and how the repeat speeds up, as React's `useLongPress`. */
const LONG_PRESS = { delay: 750, decrementPercent: 15, minimum: 100 };

/**
 * A input element that allows users to either input a numerical value or singularly increase or decrease the values by
 * pressing the (+) or (-).
 *
 * The value is a number, or undefined while the field is empty. The buttons are disabled where a step would leave the
 * range, and repeat while held; they are not tab stops, because ArrowUp and ArrowDown in the field do the same. It
 * needs a name: `label` (the visible label a Field gives the React InputNumber) or `aria-label`, and is "Input number"
 * without either. It is a form control: it submits `name` and the number with its form, mirrors the native input's
 * validity (`required`, `min`, `max`, `step`), and goes back to its `value` attribute on form reset.
 *
 * @fires {CustomEvent<{ value: number | undefined }>} pttrn-change - After the user types or presses a button.
 *   `detail.value` is the new number, or undefined when the field holds none.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-input-number
 */
export class PttrnInputNumber extends FieldControl {
    static properties = {
        value: { converter: optionalNumber },
        min: { converter: optionalNumber },
        max: { converter: optionalNumber },
        step: { type: Number },
        align: { type: String, reflect: true },
        size: { type: String, reflect: true },
    };

    static styles = styles;

    /** The current number, or undefined. The `value` attribute is the default, which a form reset goes back to. */
    declare value: number | undefined;
    /** The lowest accepted value. Ignored, with `max`, when it is greater than `max`. */
    declare min: number | undefined;
    /** The highest accepted value. */
    declare max: number | undefined;
    /** How much the buttons (and the arrow keys) move the value. */
    declare step: number;
    /** The field centered between the buttons, or left of them. */
    declare align: 'center' | 'left';
    /** The size of the field. */
    declare size: 'large' | 'medium' | 'small';

    private _pressTimer: ReturnType<typeof setTimeout> | undefined;
    private _pressDelay = LONG_PRESS.delay;

    constructor() {
        super();
        this.value = undefined;
        this.min = undefined;
        this.max = undefined;
        this.step = 1;
        this.align = 'center';
        this.size = 'medium';
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopPress();
    }

    protected get _validityAnchor() {
        return this.renderRoot?.querySelector('input') ?? null;
    }

    protected _formValue() {
        const value = toNumber(this.value);
        return value === undefined ? '' : String(value);
    }

    protected _resetValue() {
        this.value = toNumber(this.getAttribute('value'));
    }

    protected _restoreValue(state: string) {
        this.value = toNumber(state);
    }

    /** `min` and `max`, or neither when `min` is greater than `max`. */
    private get _bounds(): [number | undefined, number | undefined] {
        const min = toNumber(this.min);
        const max = toNumber(this.max);
        if (min !== undefined && max !== undefined && min > max) return [undefined, undefined];
        return [min, max];
    }

    private get _step() {
        return toNumber(this.step) ?? 1;
    }

    private _canStep(direction: 1 | -1) {
        if (this._isDisabled || this.readOnly) return false;
        const value = toNumber(this.value);
        if (value === undefined) return true;
        const [min, max] = this._bounds;
        const next = value + this._step * direction;
        return direction > 0 ? max === undefined || next <= max : min === undefined || next >= min;
    }

    /** Moves the value one step; false when it cannot, which ends a long press. */
    private _stepBy(direction: 1 | -1) {
        if (!this._canStep(direction)) return false;
        this.value = (toNumber(this.value) || 0) + this._step * direction;
        this._emitChange(this.value);
        return true;
    }

    private _startPress(direction: 1 | -1) {
        this._stopPress();
        const repeat = () => {
            if (!this._stepBy(direction)) return this._stopPress();
            this._pressTimer = setTimeout(() => {
                const decrement = (this._pressDelay * LONG_PRESS.decrementPercent) / 100;
                this._pressDelay = Math.max(LONG_PRESS.minimum, this._pressDelay - decrement);
                repeat();
            }, this._pressDelay);
        };
        repeat();
    }

    private _stopPress() {
        clearTimeout(this._pressTimer);
        this._pressTimer = undefined;
        this._pressDelay = LONG_PRESS.delay;
    }

    /** A click with no pointer press before it (assistive technology, `element.click()`) steps once. */
    private _onClick(event: MouseEvent, direction: 1 | -1) {
        if (event.detail === 0) this._stepBy(direction);
    }

    private _onInput(event: Event) {
        this.value = toNumber((event.target as HTMLInputElement).value);
        this._emitChange(this.value);
    }

    private _renderButton(direction: 1 | -1) {
        const disabled = !this._canStep(direction);
        return html`<button
            aria-controls=${FIELD_IDS.control}
            aria-label=${direction > 0 ? 'Increase value' : 'Decrease value'}
            tabindex="-1"
            type="button"
            ?disabled=${disabled}
            @click=${(event: MouseEvent) => this._onClick(event, direction)}
            @pointerdown=${() => this._startPress(direction)}
            @pointerleave=${this._stopPress}
            @pointerup=${this._stopPress}
            @pointercancel=${this._stopPress}
        >
            ${icon(direction > 0 ? addIcon : removeIcon)}
        </button>`;
    }

    render() {
        const disabled = this._isDisabled;
        const aria = this._controlAria;
        const [min, max] = this._bounds;
        const value = toNumber(this.value);

        return this._renderField(html`
            <div
                data-pttrn="input-number"
                data-size=${this.size}
                data-stepper-input
                ?data-centered=${this.align !== 'left'}
                ?data-disabled=${disabled}
                ?data-invalid=${this._isInvalid}
                ?data-readonly=${this.readOnly}
            >
                <input
                    aria-describedby=${aria.describedBy}
                    aria-errormessage=${aria.errorMessage}
                    aria-invalid=${aria.invalid}
                    aria-label=${this.ariaLabel || (this.label ? nothing : 'Input number')}
                    autocomplete="off"
                    data-input
                    data-stepper-input-element
                    id=${FIELD_IDS.control}
                    inputmode="numeric"
                    max=${max ?? nothing}
                    min=${min ?? nothing}
                    name=${this.name || nothing}
                    step=${this._step}
                    type="number"
                    .value=${live(value === undefined ? '' : String(value))}
                    ?disabled=${disabled}
                    ?readonly=${this.readOnly}
                    ?required=${this.required}
                    @input=${this._onInput}
                />
                <div aria-hidden="true" data-divider></div>
                ${this._renderButton(-1)} ${this._renderButton(1)}
            </div>
        `);
    }
}

define('pttrn-input-number', PttrnInputNumber);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-input-number': PttrnInputNumber;
    }
}
