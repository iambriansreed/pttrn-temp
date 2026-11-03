import { LitElement, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { define } from '../../utils/define';
import { deepActiveElement, tabbables, trapTab } from '../../utils/focus';
import styles from './dialog.scss';

export type DialogCloseDetail = { reason: 'escape' | 'scrim' };

/**
 * Dialogs display important information that users need to acknowledge. They appear over the interface and may block
 * further interactions until an action is selected.
 *
 * Also known as: Tray, Drawer, Flyout, Sheet. `pttrn-modal` builds the standard header and footer on top of it.
 *
 * With `open` the element shows its content in a native `<dialog>` opened with `showModal()`: in the top layer, with
 * the rest of the page inert and its scrolling locked. Focus moves to the first control inside, Tab and Shift+Tab stay
 * inside, and closing returns focus to where it was. Escape and a click on the scrim fire `pttrn-close`, then close the
 * dialog unless the event is cancelled (`preventDefault()`), so the page can keep it open or close it itself.
 *
 * The dialog needs a name. `aria-labelledby` cannot reach from the `<dialog>` in the shadow root to a heading in your
 * content, so give the element `labelledby` with the heading's id (the element copies its text), or `label`.
 *
 * React to Web Component mapping:
 *
 * - `open` → `open`; `onClose` → the `pttrn-close` event
 * - `placement` → `placement`
 * - `showScrim` (default true) → `hide-scrim` (inverted)
 * - `widthFull` → `width-full`
 * - `disableFocusTrap` → `disable-focus-trap`
 * - `container` → `contained`: the dialog fills the nearest positioned ancestor instead of the screen, without the top
 *   layer, and the rest of the page stays usable, as in React
 * - `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-description` → `label`, `labelledby`, `describedby`,
 *   `description`
 * - `children` → the default slot
 *
 * @fires {CustomEvent<{ reason: 'escape' | 'scrim' }>} pttrn-close - When Escape or a click on the scrim asks to close.
 *   Cancel it to keep the dialog open.
 * @element pttrn-dialog
 * @slot - The content.
 * @csspart dialog - The box that holds the content.
 */
export class PttrnDialog extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        placement: { type: String, reflect: true },
        hideScrim: { type: Boolean, attribute: 'hide-scrim' },
        widthFull: { type: Boolean, attribute: 'width-full' },
        disableFocusTrap: { type: Boolean, attribute: 'disable-focus-trap' },
        contained: { type: Boolean, reflect: true },
        label: { type: String },
        labelledby: { type: String },
        describedby: { type: String },
        description: { type: String },
        _name: { state: true },
        _describedBy: { state: true },
    };

    static styles = styles;

    /** Whether the dialog shows. */
    declare open: boolean;
    /** Where the dialog shows on the screen. */
    declare placement: 'bottom' | 'center' | 'left' | 'right' | 'top';
    /** Hides the scrim that dims the page behind the dialog. */
    declare hideScrim: boolean;
    /** Stretches the dialog across the full width. */
    declare widthFull: boolean;
    /** Lets Tab leave the dialog. Dialogs should hold focus, so leave it off. */
    declare disableFocusTrap: boolean;
    /** Fills the nearest positioned ancestor instead of the screen, without blocking the rest of the page. */
    declare contained: boolean;
    /** The dialog's name, when it has no visible heading to point at. */
    declare label: string;
    /** The id of the heading (or ids, separated by spaces) that names the dialog, in the same document as the element. */
    declare labelledby: string;
    /** The id of the element (or ids) whose text describes the dialog. */
    declare describedby: string;
    /** A description of the dialog. */
    declare description: string;
    declare _name: string;
    declare _describedBy: string;

    /** Where focus was before the dialog opened, to return it there. */
    private _opener: HTMLElement | null = null;
    private readonly _observer = new MutationObserver(() => this._readReferences());

    constructor() {
        super();
        this.open = false;
        this.placement = 'center';
        this.hideScrim = false;
        this.widthFull = false;
        this.disableFocusTrap = false;
        this.contained = false;
        this.label = '';
        this.labelledby = '';
        this.describedby = '';
        this.description = '';
        this._name = '';
        this._describedBy = '';
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
        if (this.open) this._unlockScroll();
    }

    private get _dialog() {
        return this.renderRoot.querySelector('dialog');
    }

    private get _box() {
        return this.renderRoot.querySelector<HTMLElement>('[data-dialog-box]');
    }

    /** The text of the elements an id list points at, in the element's own tree, as aria-labelledby would read it. */
    private _textOf(ids: string) {
        const root = this.getRootNode() as Document | ShadowRoot;
        return ids
            .split(/\s+/)
            .filter(Boolean)
            .map((id) => root.getElementById(id)?.textContent?.trim() ?? '')
            .filter(Boolean)
            .join(' ');
    }

    private _readReferences() {
        this._name = this.labelledby ? this._textOf(this.labelledby) : '';
        this._describedBy = this.describedby ? this._textOf(this.describedby) : '';
    }

    protected willUpdate(changed: Map<string, unknown>) {
        if (changed.has('labelledby') || changed.has('describedby') || changed.has('open')) this._readReferences();
    }

    protected updated(changed: Map<string, unknown>) {
        if (!changed.has('open') && !changed.has('contained')) return;
        const dialog = this._dialog;
        if (!dialog) return;
        if (this.open && !dialog.open) this._show(dialog);
        else if (!this.open && dialog.open) this._hide(dialog);
        else if (this.open && changed.has('contained')) {
            dialog.close();
            this._show(dialog);
        }
    }

    private async _show(dialog: HTMLDialogElement) {
        const active = deepActiveElement();
        this._opener = active instanceof HTMLElement && active !== document.body ? active : this._opener;
        if (this.contained) dialog.show();
        else dialog.showModal();
        document.documentElement.style.overflow = 'hidden';
        // Watch the content the name and description are read from.
        this._observer.observe(this.getRootNode(), { subtree: true, childList: true, characterData: true });
        // Slotted elements render a microtask later; focus the first control once they have.
        await Promise.all(
            [...this.querySelectorAll('*')].map((element) => (element as Partial<LitElement>).updateComplete),
        );
        if (!this.open) return;
        const box = this._box;
        if (box) (tabbables(box)[0] ?? box).focus();
    }

    private _hide(dialog: HTMLDialogElement) {
        dialog.close();
        this._observer.disconnect();
        this._unlockScroll();
        this._opener?.focus();
        this._opener = null;
    }

    private _unlockScroll() {
        document.documentElement.style.overflow = '';
    }

    /** Asks to close; closes unless a listener cancels the event. */
    private _requestClose(reason: DialogCloseDetail['reason']) {
        const event = new CustomEvent<DialogCloseDetail>('pttrn-close', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { reason },
        });
        if (this.dispatchEvent(event)) this.open = false;
    }

    private _onCancel(event: Event) {
        // The native Escape handling would close the <dialog> behind the element's back.
        event.preventDefault();
        this._requestClose('escape');
    }

    private _onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape' && this.contained) {
            event.preventDefault();
            this._requestClose('escape');
            return;
        }
        if (!this.disableFocusTrap && this._box) trapTab(event, this._box);
    }

    render() {
        return html`<dialog
            aria-describedby=${ifDefined(this.describedby || this.description ? 'description' : undefined)}
            aria-label=${ifDefined(this.label || this._name || undefined)}
            aria-modal="true"
            data-placement=${this.placement || 'center'}
            data-pttrn="dialog"
            ?data-contained=${this.contained}
            @cancel=${this._onCancel}
            @keydown=${this._onKeyDown}
        >
            <div
                aria-hidden="true"
                data-scrim
                ?data-hidden=${this.hideScrim}
                @click=${() => this._requestClose('scrim')}
            ></div>
            <div data-dialog-box data-width-full=${this.widthFull} part="dialog" tabindex="-1">
                <slot></slot>
            </div>
            <span data-description hidden id="description"
                >${[this._describedBy, this.description].filter(Boolean).join(' ')}</span
            >
        </dialog>`;
    }
}

define('pttrn-dialog', PttrnDialog);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-dialog': PttrnDialog;
    }
}
