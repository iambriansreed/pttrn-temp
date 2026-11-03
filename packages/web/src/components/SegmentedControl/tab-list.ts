import { LitElement, PropertyDeclarations, html } from 'lit';
import { emit } from '../../utils/emit';

export type TabListChangeDetail = { value: string };

/**
 * One option of a tab list: the base of `pttrn-tab-group-item` and `pttrn-segmented-control-item`. The item is the tab
 * itself (the host carries `role="tab"`, `aria-selected` and `aria-disabled`), so a consumer can point it at the panel
 * it controls with `aria-controls` in the same tree.
 *
 * @slot icon - An SVG shown before the label while the item is not selected. Slot the `<svg>` itself so it takes the
 *   item's icon size.
 * @slot icon-selected - An SVG shown instead while the item is selected (as in React, no icon shows when it is
 *   missing).
 */
export class PttrnTabListItemBase extends LitElement {
    static properties: PropertyDeclarations = {
        value: { type: String, reflect: true },
        label: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        selected: { type: Boolean, reflect: true },
        _hasIcon: { state: true },
        _hasIconSelected: { state: true },
    };

    /** The value the list takes when this item is selected. Defaults to the label. */
    declare value: string;
    /** The text of the item. */
    declare label: string;
    /** Keeps the item from being selected; the arrow keys skip it. */
    declare disabled: boolean;
    /** Whether the item is the selected one. The list sets it from its `value`. */
    declare selected: boolean;
    declare _hasIcon: boolean;
    declare _hasIconSelected: boolean;

    constructor() {
        super();
        this.value = '';
        this.label = '';
        this.disabled = false;
        this.selected = false;
        this._hasIcon = false;
        this._hasIconSelected = false;
    }

    connectedCallback() {
        super.connectedCallback();
        if (!this.hasAttribute('role')) this.setAttribute('role', 'tab');
    }

    protected updated() {
        this.setAttribute('aria-selected', String(this.selected));
        if (this.disabled) this.setAttribute('aria-disabled', 'true');
        else this.removeAttribute('aria-disabled');
    }

    /** Whether the `icon` slot has content, which `icons-only` needs on every item. */
    get hasIcon() {
        return !!this.querySelector(':scope > [slot="icon"]');
    }

    protected renderIcons() {
        const onSlotChange = (event: Event, key: '_hasIcon' | '_hasIconSelected') => {
            this[key] = (event.target as HTMLSlotElement).assignedNodes().length > 0;
        };
        return html`<span aria-hidden="true" data-icon ?hidden=${this.selected || !this._hasIcon}
                ><slot name="icon" @slotchange=${(e: Event) => onSlotChange(e, '_hasIcon')}></slot></span
            ><span aria-hidden="true" data-icon ?hidden=${!this.selected || !this._hasIconSelected}
                ><slot name="icon-selected" @slotchange=${(e: Event) => onSlotChange(e, '_hasIconSelected')}></slot
            ></span>`;
    }
}

/**
 * A row of tabs, one selected at a time: the base of `pttrn-tab-group` and `pttrn-segmented-control`, the counterpart
 * of React's TabList utility. It renders the `tablist` and slots its items, and owns the selection and the keyboard:
 * roving focus (only the active item is in the tab order), the arrow keys move between enabled items and wrap, and
 * Enter or Space selects the active one.
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - After the user selects another item. `detail.value` is its
 *   value; the list's `value` is already updated.
 */
export class PttrnTabListBase extends LitElement {
    static properties: PropertyDeclarations = {
        label: { type: String },
        value: { type: String, reflect: true },
        size: { type: String, reflect: true },
        width: { type: String, reflect: true },
        _focusVisible: { state: true },
    };

    /** Names the list for assistive technology. */
    declare label: string;
    /** The value of the selected item. When no item has it, the first item is selected. */
    declare value: string;
    /** The size of the items. */
    declare size: 'small' | 'medium' | 'large';
    /** `hug` keeps the items at their content width; `fill` stretches them across the container. */
    declare width: 'hug' | 'fill';
    declare _focusVisible: boolean;

    /** The item the arrow keys move and Enter selects. */
    private _active: PttrnTabListItemBase | null = null;
    private _focusWithin = false;
    private readonly _observer = new MutationObserver(() => this.requestUpdate());

    constructor() {
        super();
        this.label = '';
        this.value = '';
        this.size = 'medium';
        this.width = 'hug';
        this._focusVisible = false;
        this.addEventListener('click', (event) => this._onClick(event));
        this.addEventListener('keydown', (event) => this._onKeyDown(event));
        this.addEventListener('focusin', (event) => this._onFocusIn(event));
        this.addEventListener('focusout', (event) => this._onFocusOut(event));
    }

    /** The tag of the items this list holds. */
    protected get itemTag() {
        return '';
    }

    /** The items, in order. */
    get items(): PttrnTabListItemBase[] {
        return [...this.children].filter((child): child is PttrnTabListItemBase => child.localName === this.itemTag);
    }

    protected valueOf(item: PttrnTabListItemBase) {
        return item.value || item.label;
    }

    /** The selected item: the one whose value matches, or the first. */
    protected get selectedItem(): PttrnTabListItemBase | undefined {
        const items = this.items;
        return items.find((item) => this.valueOf(item) === this.value) ?? items[0];
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['value', 'label', 'disabled', 'slot'],
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
    }

    protected updated() {
        this.syncItems();
    }

    /** Copies the list's state onto its items: selection, roving tabindex, size, width and the active highlight. */
    protected syncItems() {
        const items = this.items;
        const selected = this.selectedItem;
        if (this._active && !items.includes(this._active)) this._active = null;
        const focusable = this._active ?? selected;
        for (const item of items) {
            item.selected = item === selected;
            item.tabIndex = item === focusable ? 0 : -1;
            item.dataset.size = this.size;
            item.dataset.width = this.width;
            item.toggleAttribute('data-active', this._focusWithin && item === this._active);
        }
    }

    /** The item an event came from, if it came from one. */
    private _itemFrom(event: Event) {
        const items: EventTarget[] = this.items;
        return event.composedPath().find((node) => items.includes(node)) as PttrnTabListItemBase | undefined;
    }

    private _select(item: PttrnTabListItemBase) {
        if (item.disabled) return;
        const value = this.valueOf(item);
        if (item === this.selectedItem && value === this.value) return;
        this.value = value;
        emit<TabListChangeDetail>(this, 'pttrn-change', { value });
    }

    private _onClick(event: MouseEvent) {
        const item = this._itemFrom(event);
        if (!item || item.disabled) return;
        this._active = item;
        this._select(item);
        this.syncItems();
    }

    private _onKeyDown(event: KeyboardEvent) {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (step) {
            const enabled = this.items.filter((item) => !item.disabled);
            if (!enabled.length) return;
            event.preventDefault();
            const current = this._active ? enabled.indexOf(this._active) : -1;
            const next =
                current === -1 && step === 1 ? enabled[0] : enabled[(current + step + enabled.length) % enabled.length];
            this._active = next;
            this.syncItems();
            next.focus();
            next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (this._active) this._select(this._active);
        }
    }

    private _onFocusIn(event: FocusEvent) {
        const item = this._itemFrom(event);
        if (item && !item.disabled) this._active = item;
        this._focusWithin = true;
        this._focusVisible = (event.target as Element).matches(':focus-visible');
        this.syncItems();
    }

    private _onFocusOut(event: FocusEvent) {
        if (this.contains(event.relatedTarget as Node | null)) return;
        this._focusWithin = false;
        this._focusVisible = false;
        this.syncItems();
    }

    /** The row; subclasses add their own data attributes and content around it. */
    protected renderList() {
        return html`<div
            aria-label=${this.label}
            data-size=${this.size}
            data-width=${this.width}
            role="tablist"
            ?data-focus-visible=${this._focusVisible}
        >
            <slot @slotchange=${() => this.requestUpdate()}></slot>
        </div>`;
    }

    render() {
        return this.renderList();
    }
}
