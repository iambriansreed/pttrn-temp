import { ComplexAttributeConverter, LitElement, PropertyValues, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import styles from './slider.scss';

export type SliderValue = number | [number, number];
export type SliderFormatContext = 'max' | 'min' | 'rangeEnd' | 'rangeStart';

/** `"30"` is one value and `"70,80"` a range; anything else is no value. */
function parseValue(value: string | null): SliderValue | undefined {
    if (value === null || value.trim() === '') return undefined;
    const parts = value.split(',').map((part) => Number(part.trim()));
    if (parts.some((part) => Number.isNaN(part))) return undefined;
    return parts.length >= 2 ? [parts[0], parts[1]] : parts[0];
}

const valueConverter: ComplexAttributeConverter<SliderValue | undefined> = {
    fromAttribute: (value) => parseValue(value),
    toAttribute: (value) => (value === undefined ? null : Array.isArray(value) ? value.join(',') : String(value)),
};

/**
 * A control element that allows customers to select a value or adjust a setting by moving the handle along a horizontal
 * track.
 *
 * The label and the current value sit above the track, the minimum and maximum below it. Each knob is a slider that
 * ArrowRight and ArrowLeft move by `step`; a click on the track moves the nearest knob there, and a knob can be
 * dragged. Two values (`value="70,80"`, or an array) make a range with a start and an end knob. `formatNumber`, a
 * JavaScript property, formats every number shown and read. It is a form control: it submits `name` and the value
 * ("start,end" for a range) with its form, and a form reset goes back to the `value` attribute.
 *
 * @fires {CustomEvent<{ value: number | [number, number] }>} pttrn-change - As the user moves a knob. `detail.value` is
 *   the new value, two numbers for a range.
 * @element pttrn-slider
 */
export class PttrnSlider extends LitElement {
    static formAssociated = true;

    static properties = {
        label: { type: String },
        value: { converter: valueConverter },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        marks: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        readOnly: { type: Boolean, reflect: true, attribute: 'readonly' },
        name: { type: String, reflect: true },
        formatNumber: { attribute: false },
        _formDisabled: { state: true },
    };

    static styles = styles;

    /** Names the slider and its knobs ("label start" and "label end" for a range), and shows above the track. */
    declare label: string;
    /** One number, or two for a range (`"70,80"` as an attribute). The attribute is the default a form reset restores. */
    declare value: SliderValue | undefined;
    /** The lowest value. */
    declare min: number;
    /** The highest value. */
    declare max: number;
    /** The granularity the value keeps to, and how far an arrow key moves a knob. */
    declare step: number;
    /** Shows a dot at every step. */
    declare marks: boolean;
    /** Takes the knobs out of the tab order and ignores input. */
    declare disabled: boolean;
    /** Keeps the knobs focusable but ignores input. */
    declare readOnly: boolean;
    /** The name the value is submitted under in a form. */
    declare name: string;
    /**
     * A JavaScript property, not an attribute: formats each number shown and read, as currency or a percentage. It gets
     * the number and where it shows: `rangeStart` (also a single value), `rangeEnd`, `min` or `max`.
     */
    declare formatNumber: ((value: number, context?: SliderFormatContext) => string) | undefined;
    declare _formDisabled: boolean;

    private readonly _internals: ElementInternals;
    private _dragging: 0 | 1 | null = null;

    constructor() {
        super();
        this.label = '';
        this.value = undefined;
        this.min = 0;
        this.max = 100;
        this.step = 1;
        this.marks = false;
        this.disabled = false;
        this.readOnly = false;
        this.name = '';
        this.formatNumber = undefined;
        this._formDisabled = false;
        this._internals = this.attachInternals();
    }

    /** The form the slider belongs to. */
    get form() {
        return this._internals.form;
    }

    formDisabledCallback(disabled: boolean) {
        this._formDisabled = disabled;
    }

    formResetCallback() {
        this.value = parseValue(this.getAttribute('value'));
    }

    formStateRestoreCallback(state: string | File | FormData | null) {
        if (typeof state === 'string') this.value = parseValue(state);
    }

    private get _isDisabled() {
        return this.disabled || this._formDisabled;
    }

    private get _bounds(): [number, number] {
        const min = Number.isFinite(Number(this.min)) ? Number(this.min) : 0;
        const max = Number.isFinite(Number(this.max)) ? Number(this.max) : 100;
        return [min, max];
    }

    private get _step() {
        const step = Number(this.step);
        return step > 0 ? step : 1;
    }

    /** The value as numbers, the minimum when there is none, as the React Slider starts. */
    private get _values(): number[] {
        const value = this.value;
        if (Array.isArray(value)) return [Number(value[0]), Number(value[1])];
        if (typeof value === 'number' && !Number.isNaN(value)) return [value];
        return [this._bounds[0]];
    }

    private get _isRange() {
        return Array.isArray(this.value);
    }

    /** Clamps to the range and rounds to the step, as React's `useNormalizeSliderValue`. */
    private _normalize(value: number) {
        const [min, max] = this._bounds;
        const clamp = (n: number) => Math.min(Math.max(n, min), max);
        return clamp(parseFloat((Math.round(clamp(value) / this._step) * this._step).toFixed(10)));
    }

    private _format(value: number, context: SliderFormatContext) {
        return this.formatNumber?.(value, context) || value.toString();
    }

    private _percent(value: number) {
        const [min, max] = this._bounds;
        return max === min ? 0 : Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        // What the React hidden input carries: the value, or "start,end" for a range.
        this._internals.setFormValue(this._values.join(','));
    }

    private _set(index: 0 | 1, next: number) {
        const values = [...this._values];
        values[index] = next;
        const value: SliderValue = this._isRange ? [values[0], values[1]] : values[0];
        this.value = value;
        emit<{ value: SliderValue }>(this, 'pttrn-change', { value });
    }

    private _valueAt(clientX: number) {
        const track = this.renderRoot.querySelector<HTMLElement>('[data-slider-body]');
        if (!track) return this._bounds[0];
        const { left, width } = track.getBoundingClientRect();
        const [min, max] = this._bounds;
        const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
        return this._normalize(min + ratio * (max - min));
    }

    /** A press on the track moves the nearest knob there and keeps dragging it. */
    private _onTrackPointerDown(event: PointerEvent) {
        if (this._isDisabled || this.readOnly) return;
        const next = this._valueAt(event.clientX);
        const values = this._values;
        const index = this._isRange && Math.abs(next - values[0]) >= Math.abs(next - values[1]) ? 1 : 0;
        this._set(index, next);
        this._startDrag(event, index);
    }

    private _onKnobPointerDown(event: PointerEvent, index: 0 | 1) {
        if (this._isDisabled || this.readOnly) return;
        event.stopPropagation();
        this._startDrag(event, index);
    }

    private _startDrag(event: PointerEvent, index: 0 | 1) {
        this._dragging = index;
        (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    }

    private _onPointerMove(event: PointerEvent) {
        if (this._dragging === null || this._isDisabled || this.readOnly) return;
        const next = this._valueAt(event.clientX);
        if (next !== this._values[this._dragging]) this._set(this._dragging, next);
    }

    private _onPointerUp() {
        this._dragging = null;
    }

    private _onKnobKeyDown(event: KeyboardEvent, index: 0 | 1) {
        if (this._isDisabled || this.readOnly) return;
        const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        this._set(index, this._normalize(this._values[index] + this._step * direction));
    }

    /** A dot at every step between the ends; the ones inside the filled part are white. */
    private _renderMarks(low: number, high: number) {
        const [min, max] = this._bounds;
        const count = Math.floor((max - min) / this._step);
        const dots = [];
        for (let i = 1; i < count; i++) {
            const value = min + i * this._step;
            const filled = this._isRange ? value > low && value < high : value < low;
            dots.push(
                html`<div
                    data-interval-dot
                    ?data-filled-section=${filled}
                    style=${styleMap({ left: `${this._percent(value)}%` })}
                ></div>`,
            );
        }
        return dots;
    }

    private _renderKnob(index: 0 | 1, value: number, ariaLabel: string, valueText: string) {
        const [min, max] = this._bounds;
        return html`<div
            aria-disabled=${this._isDisabled ? 'true' : nothing}
            aria-label=${ariaLabel}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            aria-valuemax=${max}
            aria-valuemin=${min}
            aria-valuenow=${value}
            aria-valuetext=${valueText}
            data-slider-knob
            role="slider"
            style=${styleMap({ left: `calc(${this._percent(value)}% - var(--usa-spacing-1))` })}
            tabindex=${this._isDisabled ? -1 : 0}
            @keydown=${(event: KeyboardEvent) => this._onKnobKeyDown(event, index)}
            @pointerdown=${(event: PointerEvent) => this._onKnobPointerDown(event, index)}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
        ></div>`;
    }

    render() {
        const [min, max] = this._bounds;
        const values = this._values;
        const range = this._isRange;
        // The lower value shows first.
        const [low, high] = range ? [...values].sort((a, b) => a - b) : [values[0], values[0]];
        const start = this._format(low, 'rangeStart');
        const end = this._format(high, 'rangeEnd');
        const display = range ? `${start} - ${end}` : start;
        const p0 = this._percent(low);
        const p1 = this._percent(high);

        return html`<div data-pttrn="slider" ?data-disabled=${this._isDisabled} ?data-readonly=${this.readOnly}>
            <div data-top-labels>
                <span data-label>${this.label}</span>
                <span data-value-label>${display}</span>
            </div>
            <div data-slider-parent>
                <div
                    aria-hidden="true"
                    data-slider-body
                    @pointerdown=${this._onTrackPointerDown}
                    @pointermove=${this._onPointerMove}
                    @pointerup=${this._onPointerUp}
                    @pointercancel=${this._onPointerUp}
                >
                    <div data-slider-background></div>
                    <div
                        data-slider-fill
                        style=${styleMap({ left: range ? `${p0}%` : '0%', width: range ? `${p1 - p0}%` : `${p0}%` })}
                    ></div>
                    ${this.marks ? this._renderMarks(low, high) : nothing}
                </div>
                ${
                    range
                        ? html`${this._renderKnob(0, values[0], `${this.label} start`, this._format(values[0], 'rangeStart'))}
                          ${this._renderKnob(1, values[1], `${this.label} end`, this._format(values[1], 'rangeEnd'))}`
                        : this._renderKnob(0, values[0], this.label, display)
                }
            </div>
            <div data-bottom-labels>
                <span data-min-label>${this._format(min, 'min')}</span>
                <span data-max-label>${this._format(max, 'max')}</span>
            </div>
        </div>`;
    }
}

define('pttrn-slider', PttrnSlider);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-slider': PttrnSlider;
    }
}
