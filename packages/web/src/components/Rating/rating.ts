import starFill from '@ptrn/icons/StarFill.svg';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { icon } from '../../utils/icon';
import styles from './rating.scss';

const MAX_STARS = 5;

/** A number from an attribute or property, or undefined for none. */
function toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const number = Number(value);
    return Number.isNaN(number) ? undefined : number;
}

/** How a star is filled for a value: full up to it, half for a .5 value. */
function fillOf(star: number, value: number | undefined): 'full' | 'half' | undefined {
    if (value === undefined) return undefined;
    if (value >= star) return 'full';
    if (value === star - 0.5) return 'half';
    return undefined;
}

/**
 * Descriptive and interactive controls that allow customers to indicate their feelings about an experience or product
 * on a scale of 1 to 5. Half sizes are displayed when interactive is false.
 *
 * Without `interactive` it is one image named "4.5 out of 5 stars" ("Rating" before any value). With `interactive`
 * (React's `onChange`) it is a radio group of five "Rate N" stars: the chosen star is the tab stop (the first one
 * before a choice), and the arrow keys move the choice and focus. An interactive rating is a form control: inside a
 * `<form>` it submits `name` and the chosen number, and a form reset goes back to the `value` attribute.
 *
 * @fires {CustomEvent<{ value: number }>} pttrn-change - After the user chooses a star. `detail.value` is its number.
 * @element pttrn-rating
 */
export class PttrnRating extends LitElement {
    static formAssociated = true;

    static properties = {
        value: { type: Number },
        size: { type: String, reflect: true },
        interactive: { type: Boolean, reflect: true },
        name: { type: String, reflect: true },
    };

    static styles = styles;

    /** The rating between 0 and 5; a .5 value half-fills a star while read-only. */
    declare value: number | undefined;
    /** The size of the stars. */
    declare size: 'large' | 'medium' | 'small';
    /** Lets the user choose a rating, as passing `onChange` does in React. Read-only without it. */
    declare interactive: boolean;
    /** The name the chosen rating is submitted under in a form. */
    declare name: string;

    private readonly _internals: ElementInternals;

    constructor() {
        super();
        this.value = undefined;
        this.size = 'medium';
        this.interactive = false;
        this.name = '';
        this._internals = this.attachInternals();
    }

    /** The form the rating belongs to. */
    get form() {
        return this._internals.form;
    }

    formResetCallback() {
        this.value = toNumber(this.getAttribute('value'));
    }

    formStateRestoreCallback(state: string | File | FormData | null) {
        if (typeof state === 'string') this.value = toNumber(state);
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        const value = toNumber(this.value);
        this._internals.setFormValue(this.interactive && value ? String(value) : null);
    }

    /** The star that holds the choice: 3 for a value of 3, 5 for 4.5, none before a choice is made. */
    private get _chosenStar() {
        const value = toNumber(this.value);
        return value === undefined ? 0 : Math.ceil(value);
    }

    private get _label() {
        const value = toNumber(this.value);
        if (value) return `${value} out of ${MAX_STARS} stars`;
        return this.interactive ? 'Select a star rating' : 'Rating';
    }

    private _choose(star: number, focus = false) {
        const next = Math.min(MAX_STARS, Math.max(1, star));
        this.value = next;
        emit<{ value: number }>(this, 'pttrn-change', { value: next });
        if (!focus) return;
        this.updateComplete.then(() =>
            this.renderRoot
                .querySelectorAll<HTMLButtonElement>('[data-pttrn="rating"] > [data-star]')
                [next - 1]?.focus(),
        );
    }

    /** The arrows move the choice as in any radio group. */
    private _onKeyDown(event: KeyboardEvent) {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step || event.shiftKey) return;
        event.preventDefault();
        this._choose(this._chosenStar + step, true);
    }

    private _renderStar(fill: 'full' | 'half' | undefined) {
        return html`${icon(starFill)}${
            fill === 'half' ? html`<div data-fill-half><div data-star>${icon(starFill)}</div></div>` : nothing
        }`;
    }

    render() {
        const value = toNumber(this.value);
        const stars = Array.from({ length: MAX_STARS }, (_, index) => index + 1);

        if (!this.interactive) {
            return html`<div aria-label=${this._label} data-pttrn="rating" data-size=${this.size} role="img">
                ${stars.map((star) => {
                    const fill = fillOf(star, value);
                    return html`<div data-fill=${fill ?? nothing} data-star role="presentation" tabindex="-1">
                        ${this._renderStar(fill)}
                    </div>`;
                })}
            </div>`;
        }

        const chosen = this._chosenStar;
        return html`<div aria-label=${this._label} data-pttrn="rating" data-size=${this.size} role="radiogroup">
            ${stars.map((star) => {
                const fill = fillOf(star, value);
                const selected = chosen === star;
                return html`<button
                    aria-checked=${String(selected)}
                    aria-label=${`Rate ${star}`}
                    data-fill=${fill ?? nothing}
                    data-star
                    role="radio"
                    tabindex=${(chosen ? selected : star === 1) ? 0 : -1}
                    type="button"
                    @click=${() => this._choose(star)}
                    @keydown=${this._onKeyDown}
                >
                    ${this._renderStar(fill)}
                </button>`;
            })}
        </div>`;
    }
}

define('pttrn-rating', PttrnRating);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-rating': PttrnRating;
    }
}
