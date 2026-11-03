import closeIcon from '@ptrn/icons/Close.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import '../Button/button';
import '../Dialog/dialog';
import type { DialogCloseDetail } from '../Dialog/dialog';
import styles from './modal.scss';

export type ModalCloseDetail = { reason: DialogCloseDetail['reason'] | 'close' | 'cancel' };

/** The width below which the buttons grow to medium, as React's UIContext `isMobile`. */
const MOBILE = '(width < 640px)';

/**
 * A Dialog with a standard header, close button and footer, for information the user has to acknowledge.
 *
 * Built on `pttrn-dialog`: in the top layer, the page inert, focus held inside and returned on close. The header names
 * the dialog and the description describes it. The close button, the cancel button, Escape and the scrim fire a
 * cancelable `pttrn-close`, then close the modal unless it is cancelled; the call to action fires `pttrn-action`.
 *
 * React to Web Component mapping:
 *
 * - `open` → `open`; `onClose` → the `pttrn-close` event
 * - `header`, `description` → `header`, `description`
 * - `callToAction` → `action-label` (and `action-destructive`) and the `pttrn-action` event
 * - `cancelButton` → `cancel-button`: present for "Cancel", or its value as the label
 * - `buttonFormat` → `button-format`
 * - `disableFocusTrap` → `disable-focus-trap`; `container` → `contained`
 * - `children` → the default slot
 *
 * @fires {CustomEvent<{ reason: 'escape' | 'scrim' | 'close' | 'cancel' }>} pttrn-close - When the user asks to close.
 *   Cancel it to keep the modal open.
 * @fires {CustomEvent<Record<string, never>>} pttrn-action - When the call to action is clicked.
 * @element pttrn-modal
 * @slot - The content.
 */
export class PttrnModal extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        header: { type: String },
        description: { type: String },
        actionLabel: { type: String, attribute: 'action-label' },
        actionDestructive: { type: Boolean, attribute: 'action-destructive' },
        cancelButton: { type: String, attribute: 'cancel-button' },
        buttonFormat: { type: String, attribute: 'button-format', reflect: true },
        disableFocusTrap: { type: Boolean, attribute: 'disable-focus-trap' },
        contained: { type: Boolean },
        _mobile: { state: true },
    };

    static styles = styles;

    /** Whether the modal shows. */
    declare open: boolean;
    /** The title; it names the dialog. */
    declare header: string;
    /** Describes the dialog to assistive technology. */
    declare description: string;
    /** The label of the call to action; without it there is no footer. */
    declare actionLabel: string;
    /** Draws the call to action as destructive. */
    declare actionDestructive: boolean;
    /** Adds a cancel button next to the call to action: present for "Cancel", or set to its label. */
    declare cancelButton: string | null;
    /** How the footer buttons sit: in a row, or stacked on a phone. */
    declare buttonFormat: 'horizontal' | 'vertical';
    /** Lets Tab leave the modal. Modals should hold focus, so leave it off. */
    declare disableFocusTrap: boolean;
    /** Fills the nearest positioned ancestor instead of the screen. */
    declare contained: boolean;
    declare _mobile: boolean;

    private readonly _media = window.matchMedia(MOBILE);
    private readonly _onMedia = () => (this._mobile = this._media.matches);

    constructor() {
        super();
        this.open = false;
        this.header = '';
        this.description = '';
        this.actionLabel = '';
        this.actionDestructive = false;
        this.cancelButton = null;
        this.buttonFormat = 'horizontal';
        this.disableFocusTrap = false;
        this.contained = false;
        this._mobile = this._media.matches;
    }

    connectedCallback() {
        super.connectedCallback();
        this._media.addEventListener('change', this._onMedia);
        this._onMedia();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._media.removeEventListener('change', this._onMedia);
    }

    /** Asks to close; closes unless a listener cancels the event. */
    private _requestClose(reason: ModalCloseDetail['reason']) {
        const event = new CustomEvent<ModalCloseDetail>('pttrn-close', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { reason },
        });
        if (this.dispatchEvent(event)) this.open = false;
    }

    /** The inner dialog's own request (Escape, the scrim) becomes the modal's. */
    private _onDialogClose(event: CustomEvent<DialogCloseDetail>) {
        event.stopPropagation();
        event.preventDefault();
        this._requestClose(event.detail.reason);
    }

    private _footer() {
        if (!this.actionLabel) return nothing;
        const size = this._mobile ? 'medium' : 'small';
        const width = this.buttonFormat === 'vertical' && this._mobile ? 'fill' : 'hug';
        const cancel = this.cancelButton === null ? '' : this.cancelButton || 'Cancel';
        return html`<div data-button-format=${this.buttonFormat || 'horizontal'} data-modal-footer>
            <pttrn-button
                label=${this.actionLabel}
                size=${size}
                variant="primary"
                width=${width}
                ?destructive=${this.actionDestructive}
                @click=${() => emit(this, 'pttrn-action', {})}
            ></pttrn-button>
            ${
                cancel
                    ? html`<pttrn-button
                          label=${cancel}
                          size=${size}
                          variant="tertiary"
                          width=${width}
                          @click=${() => this._requestClose('cancel')}
                      ></pttrn-button>`
                    : nothing
            }
        </div>`;
    }

    render() {
        return html`<pttrn-dialog
            description=${this.description}
            label=${this.header}
            placement="center"
            ?contained=${this.contained}
            ?disable-focus-trap=${this.disableFocusTrap}
            .open=${this.open}
            @pttrn-close=${this._onDialogClose}
        >
            <div data-pttrn="modal">
                <div data-modal-header>
                    <div data-modal-title>${this.header}</div>
                    <pttrn-button
                        icon-only
                        label="close"
                        size=${this._mobile ? 'medium' : 'small'}
                        variant="tertiary"
                        @click=${() => this._requestClose('close')}
                        >${unsafeSVG(closeIcon.replace('<svg', '<svg slot="icon"'))}</pttrn-button
                    >
                </div>
                <div data-modal-main><slot></slot></div>
                ${this._footer()}
            </div>
        </pttrn-dialog>`;
    }
}

define('pttrn-modal', PttrnModal);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-modal': PttrnModal;
    }
}
