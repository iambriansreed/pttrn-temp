import arrowDown from '@ptrn/icons/KeyboardArrowDown.svg';
import { PropertyValues, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { FIELD_IDS, FieldControl } from '../../utils/field-control';
import { autoUpdate, place } from '../../utils/floating';
import './select-item';
import type { PttrnSelectItem } from './select-item';
import styles from './select.scss';

const MENU_ID = 'menu';

type Option = {
    id: string;
    value: string;
    label: string;
    subText: string;
    disabled: boolean;
    source: PttrnSelectItem;
    leading: Node[];
    trailing: Node[];
};

/** Copies an item's content for one slot, so it can show in the list and in the control. */
const cloneSlot = (item: Element, slot: string) =>
    [...item.children]
        .filter((child) => child.slot === slot)
        .map((child) => {
            const copy = child.cloneNode(true) as Element;
            copy.removeAttribute('slot');
            return copy;
        });

/**
 * A field control that opens a list of options and takes one of them as its value.
 *
 * The control is a combobox showing the selected option or the placeholder; it opens a listbox of the
 * `pttrn-select-item` children in the top layer (the Popover API), as wide as the control unless `menu-width` says
 * otherwise. Focus stays on the control and the active option is virtual (`aria-activedescendant`). Choosing an option
 * sets `value` and fires `pttrn-change` (and `change`). The element takes part in forms (ElementInternals): it submits
 * `name` and `value`, follows a disabled `<fieldset>` and resets with its form. `label`, `helper-text` and
 * `error-message` draw the Field around it.
 *
 * React to Web Component mapping:
 *
 * - `options` → `pttrn-select-item` children (`value`, `label`, `sub-text`, `disabled`; `leading` and `trailing` are
 *   slots)
 * - `value`, `onChange` → `value` and the `pttrn-change` event
 * - `placeholder`, `size`, `name`, `disabled`, `readOnly`, `required`, `invalid` → the attributes of the same names
 *   (`readonly`)
 * - `scrollLimit` → `scroll-limit`; `menuWidth` → `menu-width`
 * - `aria-label` → `aria-label`, read before the current option
 * - The surrounding `Field` → `label`, `helper-text`, `error-message`
 *
 * Escape also closes the list.
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - After the user chooses an option.
 * @element pttrn-select
 * @slot - `pttrn-select-item` elements.
 */
export class PttrnSelect extends FieldControl {
    static properties = {
        value: { type: String },
        placeholder: { type: String },
        size: { type: String, reflect: true },
        scrollLimit: { type: Number, attribute: 'scroll-limit' },
        menuWidth: { type: String, attribute: 'menu-width' },
        _options: { state: true },
        _active: { state: true },
    };

    static styles = styles;

    /** The value of the selected option. */
    declare value: string;
    /** Shown while no option is selected. */
    declare placeholder: string;
    /** The size of the control. */
    declare size: 'small' | 'medium' | 'large';
    /** The most options the list shows before it scrolls. */
    declare scrollLimit: number | undefined;
    /** The width of the list, as a CSS length. Without it the list is as wide as the control. */
    declare menuWidth: string;
    declare _options: Option[];
    /** The id of the active option; the list is open while there is one. */
    declare _active: string | null;

    private _stopUpdates: (() => void) | null = null;
    /** The copies of the selected option's leading and trailing content shown in the control. */
    private _controlParts: { value: string; leading: Node[]; trailing: Node[] } | null = null;
    private readonly _observer = new MutationObserver(() => this._readItems());

    constructor() {
        super();
        this.value = '';
        this.placeholder = 'Select one';
        this.size = 'medium';
        this.scrollLimit = undefined;
        this.menuWidth = '';
        this._options = [];
        this._active = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
        this._readItems();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
        this._close();
    }

    private _readItems() {
        this._options = [...this.querySelectorAll<PttrnSelectItem>(':scope > pttrn-select-item')].map(
            (item, index) => ({
                id: `option-${index}`,
                value: item.getAttribute('value') ?? '',
                label: item.getAttribute('label') ?? '',
                subText: item.getAttribute('sub-text') ?? '',
                disabled: item.hasAttribute('disabled'),
                source: item,
                leading: cloneSlot(item, 'leading'),
                trailing: cloneSlot(item, 'trailing'),
            }),
        );
        this._controlParts = null;
    }

    protected _formValue() {
        return this.value || null;
    }

    protected _resetValue() {
        this.value = this.getAttribute('value') ?? '';
    }

    protected _restoreValue(state: string) {
        this.value = state;
    }

    private get _open() {
        return this._active !== null;
    }

    private get _selected() {
        return this._options.find((option) => option.value === this.value);
    }

    private get _control() {
        return this.renderRoot.querySelector<HTMLButtonElement>(`#${FIELD_IDS.control}`);
    }

    private get _menu() {
        return this.renderRoot.querySelector<HTMLElement>(`#${MENU_ID}`);
    }

    protected willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        if (this.value === null || this.value === undefined) this.value = '';
        if ((this._isDisabled || this.readOnly) && this._open) this._active = null;
    }

    protected updated(changed: PropertyValues) {
        super.updated(changed);
        if (changed.has('_active')) {
            const wasOpen = changed.get('_active') !== null && changed.get('_active') !== undefined;
            if (this._open && !wasOpen) this._showMenu();
            else if (!this._open && wasOpen) this._hideMenu();
            if (this._open) {
                this.renderRoot
                    .querySelector(`#${this._active}`)
                    ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }

    private _showMenu() {
        const menu = this._menu;
        const control = this._control;
        if (!menu || !control) return;
        menu.showPopover();
        const update = () =>
            place(control, menu, { placement: 'bottom-start', offset: 4, matchWidth: !this.menuWidth });
        update();
        this._stopUpdates = autoUpdate(control, menu, update);
        document.addEventListener('mousedown', this._onDocumentMouseDown);
    }

    private _hideMenu() {
        this._stopUpdates?.();
        this._stopUpdates = null;
        const menu = this._menu;
        if (menu?.matches(':popover-open')) menu.hidePopover();
        document.removeEventListener('mousedown', this._onDocumentMouseDown);
    }

    private _close() {
        this._active = null;
    }

    /** Opens on the selected option, or the first. */
    private _openList() {
        if (this._isDisabled || this.readOnly || !this._options.length) return;
        this._active = (this._selected ?? this._options[0]).id;
    }

    private _choose(option: Option) {
        if (option.disabled) return;
        this._close();
        if (option.value === this.value) return;
        this.value = option.value;
        this._emitChange(this.value);
    }

    private readonly _onDocumentMouseDown = (event: MouseEvent) => {
        const path = event.composedPath();
        if (path.includes(this._menu as EventTarget) || path.includes(this._control as EventTarget)) return;
        this._close();
    };

    private _onClick() {
        if (this._open) this._close();
        else this._openList();
    }

    /** Moves the active option among the enabled ones, wrapping at the ends; from nothing, to the first. */
    private _move(step: number) {
        const available = this._options.filter((option) => !option.disabled);
        if (!available.length) return;
        const index = available.findIndex((option) => option.id === this._active);
        this._active =
            index === -1 ? available[0].id : available[(index + step + available.length) % available.length].id;
    }

    private _onKeyDown(event: KeyboardEvent) {
        if (this._isDisabled || this.readOnly) return;
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (step) {
            if (!this._open && event.key === 'ArrowDown') this._openList();
            else this._move(step);
        } else if (event.key === 'Enter' || event.key === ' ') {
            const active = this._options.find((option) => option.id === this._active);
            if (!this._open) this._openList();
            else if (active) this._choose(active);
        } else if (event.key === 'Escape' && this._open) {
            this._close();
        } else {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }

    /** Leaving the control for anything outside the list closes it. */
    private _onBlur(event: FocusEvent) {
        const next = event.relatedTarget as Node | null;
        if (next && !this._menu?.contains(next)) this._close();
    }

    /** The selected option's leading and trailing content, copied for the control. */
    private _selectedParts(option: Option | undefined) {
        if (!option) return { leading: [], trailing: [] };
        if (this._controlParts?.value !== option.value) {
            this._controlParts = {
                value: option.value,
                leading: cloneSlot(option.source, 'leading'),
                trailing: cloneSlot(option.source, 'trailing'),
            };
        }
        return this._controlParts;
    }

    private _listItem(label: string, subText: string, leading: Node[], trailing: Node[]) {
        return html`${leading.length ? html`<span data-leading>${leading}</span>` : nothing}<span data-item-label
                ><span data-text>${label}</span>${subText ? html`<span data-sub-text>${subText}</span>` : nothing}</span
            >${trailing.length ? html`<span data-trailing>${trailing}</span>` : nothing}`;
    }

    private _renderMenu() {
        const limit = Number(this.scrollLimit);
        const scrolls = this._open && limit > 0 && limit <= this._options.length;
        return html`<div
            data-pttrn-utility="menu"
            id=${MENU_ID}
            popover="manual"
            role="listbox"
            style=${styleMap({
                width: this.menuWidth || undefined,
                maxHeight: scrolls ? `calc((var(--usa-spacing-6) + var(--usa-spacing-05)) * ${limit})` : undefined,
            })}
            tabindex="-1"
            @mousedown=${(event: MouseEvent) => event.preventDefault()}
        >
            ${this._options.map(
                (option) =>
                    html`<div
                        aria-selected=${String(option.value === this.value)}
                        data-pttrn="list-item"
                        id=${option.id}
                        role="option"
                        tabindex="-1"
                        ?aria-disabled=${option.disabled}
                        ?data-action=${!option.disabled}
                        ?data-active=${option.id === this._active}
                        ?data-disabled=${option.disabled}
                        @click=${() => this._choose(option)}
                    >
                        ${this._listItem(option.label, option.subText, option.leading, option.trailing)}
                    </div>`,
            )}
        </div>`;
    }

    render() {
        const selected = this._selected;
        const disabled = this._isDisabled;
        const aria = this._controlAria;
        const parts = this._selectedParts(selected);
        const current = selected?.label || this.placeholder;
        const name = [this.ariaLabel || this.label, current].filter(Boolean).join(' ');

        return html`${this._renderField(
                html`<button
                    aria-activedescendant=${this._active ?? nothing}
                    aria-autocomplete="list"
                    aria-controls=${this._open ? MENU_ID : nothing}
                    aria-describedby=${aria.describedBy}
                    aria-disabled=${disabled || this.readOnly ? 'true' : nothing}
                    aria-errormessage=${aria.errorMessage}
                    aria-expanded=${String(this._open)}
                    aria-haspopup="listbox"
                    aria-invalid=${aria.invalid}
                    aria-label=${name}
                    aria-readonly=${this.readOnly ? 'true' : nothing}
                    aria-required=${this.required ? 'true' : nothing}
                    data-pttrn="select"
                    data-size=${this.size || 'medium'}
                    id=${FIELD_IDS.control}
                    role="combobox"
                    tabindex="0"
                    type="button"
                    ?data-invalid=${this._isInvalid}
                    ?data-open=${this._open}
                    @blur=${this._onBlur}
                    @click=${this._onClick}
                    @keydown=${this._onKeyDown}
                >
                    <span data-pttrn="list-item" ?data-placeholder=${!selected}
                        >${this._listItem(current, '', parts.leading, parts.trailing)}</span
                    >${unsafeSVG(arrowDown)}
                </button>`,
            )}${this._renderMenu()}<slot hidden></slot>`;
    }
}

define('pttrn-select', PttrnSelect);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-select': PttrnSelect;
    }
}
