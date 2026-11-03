import arrowDown from '@ptrn/icons/KeyboardArrowDown.svg';
import { AsYouType, getCountryCallingCode } from 'libphonenumber-js';
import { PropertyValues, TemplateResult, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
    countryCodeData,
    countryCodes,
    guessUserCountryCode,
    isSupportedCountryCode,
    SupportedCountryCode,
} from '../../utils/country-codes';
import { define } from '../../utils/define';
import { icon } from '../../utils/icon';
import { InputBase } from '../../utils/input-base';
import styles from './input-phone.scss';

const MENU_ID = 'menu';
const optionId = (code: SupportedCountryCode) => `country-${code}`;
const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

/** The `detail` of `pttrn-change`: the number as shown and the country it belongs to. */
export type InputPhoneChangeDetail = { value: string; countryCode: SupportedCountryCode };

/**
 * An input that allows users to enter text phone numbers and select country codes for the phone number.
 *
 * A country button in front of the field shows the calling code and opens the list of countries (Enter, Space or
 * ArrowDown; the arrows move through it and wrap, Enter chooses, Escape closes). Only digits can be typed, and the
 * number is formatted for the country as it is typed, "(937) 555-1060" in the US, unless `disable-formatting`. The
 * field is "Phone number input" unless `aria-label` or `label` names it. It is a form control: it submits the number
 * under `name` and the country under `<name>-country-code`, and a form reset goes back to the `value` and
 * `country-code` attributes.
 *
 * @fires {CustomEvent<{ value: string; countryCode: string }>} pttrn-change - As the number is typed or cleared:
 *   `detail.value` is the number as shown, `detail.countryCode` its country. Choosing a country fires nothing; the next
 *   change carries it.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-input-phone
 */
export class PttrnInputPhone extends InputBase {
    static properties = {
        countryCode: { type: String, attribute: 'country-code' },
        disableFormatting: { type: Boolean, attribute: 'disable-formatting' },
        scrollLimit: { type: Number, attribute: 'scroll-limit' },
        renderFlag: { attribute: false },
        _active: { state: true },
        _announcement: { state: true },
    };

    static styles = styles;

    /**
     * The country of the number, an ISO 3166 two-letter code (React's `initialCountryCode`). Without one it is guessed
     * from the user's locale, and US when the locale names no supported country.
     */
    declare countryCode: SupportedCountryCode;
    /** Shows and reports the digits as typed instead of formatting them for the country. */
    declare disableFormatting: boolean;
    /** How many countries show before the list scrolls. */
    declare scrollLimit: number;
    /**
     * A JavaScript property, not an attribute: draws a decorative flag (or any icon) for a country, in the country
     * button and beside each country in the list. Return a string, a DOM node or a Lit template. No flags without it.
     */
    declare renderFlag: ((countryCode: SupportedCountryCode) => unknown) | undefined;
    /** The active country in the open list; null while it is closed. */
    declare _active: SupportedCountryCode | null;
    declare _announcement: string;

    private _announcements = 0;

    constructor() {
        super();
        this.countryCode = guessUserCountryCode();
        this.disableFormatting = false;
        this.scrollLimit = 5;
        this.renderFlag = undefined;
        this._active = null;
        this._announcement = '';
    }

    private get _country(): SupportedCountryCode {
        return isSupportedCountryCode(this.countryCode) ? this.countryCode : 'US';
    }

    private get _open() {
        return this._active !== null;
    }

    private get _locked() {
        return this._isDisabled || this.readOnly;
    }

    protected _formValue() {
        if (!this.name) return null;
        const data = new FormData();
        data.append(this.name, this.value);
        data.append(`${this.name}-country-code`, this._country);
        return data;
    }

    protected _resetValue() {
        super._resetValue();
        const code = this.getAttribute('country-code');
        this.countryCode = isSupportedCountryCode(code) ? code : guessUserCountryCode();
    }

    protected willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        if (this._locked) this._active = null;
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        const menu = this.renderRoot.querySelector<HTMLElement>(`#${MENU_ID}`);
        if (menu && this._open && !menu.matches(':popover-open')) menu.showPopover();
        if (changed.has('_active') && this._active) {
            this.renderRoot
                .querySelector(`#${optionId(this._active)}`)
                ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }

    /** Typing: only the digits count, formatted for the country unless formatting is off. */
    protected _onInput(event: Event) {
        let next = (event.target as HTMLInputElement).value;
        if (!this.disableFormatting && digits(this.value) !== digits(next)) {
            next = new AsYouType(this._country).input(next);
        }
        this.value = next;
        this._emitChange(next, { countryCode: this._country });
    }

    protected _clear() {
        this.value = '';
        this._emitChange('', { countryCode: this._country });
        this._input?.focus();
    }

    /** Ignore keys that would type a non-digit; shortcuts (Ctrl or Cmd with V, C, X, A, Z) get through. */
    private _onInputKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key.length === 1 && !/[0-9]/.test(event.key)) event.preventDefault();
    }

    private _move(step: 1 | -1) {
        const index = this._active ? countryCodes.indexOf(this._active) : -1;
        this._active =
            index < 0 ? countryCodes[0] : countryCodes[(index + step + countryCodes.length) % countryCodes.length];
    }

    private _choose(code: SupportedCountryCode) {
        this.countryCode = code;
        this._active = null;
        this._announcements += 1;
        this._announcement = `Selected country code ${countryCodeData[code].name}`;
        this._input?.focus();
    }

    /** Enter and Space open the list on the first country, or choose the active one. */
    private _spaceEnter() {
        if (!this._open) this._active = countryCodes[0];
        else if (this._active) this._choose(this._active);
    }

    private _onButtonKeyDown(event: KeyboardEvent) {
        if (event.shiftKey) return;
        const key = event.key === ' ' || event.key === 'Spacebar' ? 'Space' : event.key;
        if (key === 'ArrowDown' || key === 'ArrowRight') this._move(1);
        else if (key === 'ArrowUp' || key === 'ArrowLeft') this._move(-1);
        else if (key === 'Space' || key === 'Enter') this._spaceEnter();
        else if (key === 'Escape') this._active = null;
        else return;
        event.preventDefault();
        event.stopPropagation();
    }

    private _onButtonClick(event: MouseEvent) {
        event.preventDefault();
        if (this._locked) return;
        this._active = this._open ? null : countryCodes[0];
    }

    /** Leaving the element (a click or Tab outside) closes the list. */
    private _onFocusOut(event: FocusEvent) {
        if (!this.renderRoot.contains(event.relatedTarget as Node | null)) this._active = null;
    }

    private _flag(code: SupportedCountryCode): TemplateResult | typeof nothing {
        return this.renderFlag ? html`<span aria-hidden="true" data-flag>${this.renderFlag(code)}</span>` : nothing;
    }

    private _renderCountryButton() {
        const open = this._open;
        const active = open && this._active ? optionId(this._active) : undefined;
        return html`<button
            aria-activedescendant=${active ?? nothing}
            aria-controls=${open ? MENU_ID : nothing}
            aria-disabled=${this._isDisabled ? 'true' : nothing}
            aria-expanded=${String(open)}
            aria-haspopup="listbox"
            aria-label="select country code"
            aria-owns=${open ? MENU_ID : nothing}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            data-button
            data-country-button
            data-size="medium"
            data-variant="tertiary"
            name=${this.name ? `${this.name}-country-code` : nothing}
            role="combobox"
            type="button"
            ?disabled=${this._locked}
            @click=${this._onButtonClick}
            @keydown=${this._onButtonKeyDown}
        >
            ${this._flag(this._country)}
            <span aria-hidden="true">+${getCountryCallingCode(this._country)}</span>
            ${icon(arrowDown)}
            <span aria-hidden="true" data-touch-target></span>
        </button>`;
    }

    private _renderList() {
        if (!this._open) return nothing;
        const limit = Number(this.scrollLimit);
        const country = this._country;
        return html`<div
            aria-label="Select country code"
            data-pttrn-owner="input-phone"
            data-pttrn-utility="menu"
            id=${MENU_ID}
            popover="manual"
            role="listbox"
            style=${styleMap(
                limit > 0 && limit <= countryCodes.length
                    ? { maxHeight: `calc((var(--usa-spacing-6) + var(--usa-spacing-05)) * ${limit})` }
                    : {},
            )}
            tabindex="-1"
            @mousedown=${(event: MouseEvent) => event.preventDefault()}
        >
            ${countryCodes.map((code) => {
                const flag = this._flag(code);
                return html`<div
                    aria-selected=${String(code === country)}
                    data-action
                    data-pttrn="list-item"
                    id=${optionId(code)}
                    role="option"
                    tabindex="-1"
                    ?data-active=${code === this._active}
                    @click=${() => this._choose(code)}
                >
                    ${flag === nothing ? nothing : html`<span data-leading>${flag}</span>`}
                    <span data-item-label><span data-text data-truncated>${countryCodeData[code].name}</span></span>
                    <span data-trailing>(+${getCountryCallingCode(code)})</span>
                </div>`;
            })}
        </div>`;
    }

    render() {
        const box = this._renderInputBox({
            type: 'text',
            autocomplete: 'off',
            inputmode: 'tel',
            clearable: true,
            owner: 'input-phone',
            fallbackLabel: 'Phone number input',
            leading: this._renderCountryButton(),
            onKeyDown: (event) => this._onInputKeyDown(event),
        });
        return html`<div data-pttrn="input-phone" @focusout=${this._onFocusOut}>
                ${this._renderField(box)} ${this._renderList()}
            </div>
            ${keyed(
                this._announcements,
                html`<div aria-live="polite" data-sr-only role="alert">${this._announcement}</div>`,
            )}`;
    }
}

define('pttrn-input-phone', PttrnInputPhone);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-input-phone': PttrnInputPhone;
    }
}
