import { LitElement, html, nothing } from 'lit';
import { define } from '../../utils/define';
import { deepActiveElement, tabbables, trapTab } from '../../utils/focus';
import { TooltipController, tooltipTemplate } from '../../utils/tooltip-controller';
import '../Button/button';
import styles from './snackbar.scss';

export type SnackbarCloseDetail = { reason: 'dismiss' | 'timeout' };

/**
 * A brief message about something the user did, shown over the page until it is dismissed or times out.
 *
 * With `open` the element shows its text at the bottom of the screen, in the top layer (the Popover API), as an alert
 * that is announced when it appears. Focus moves into it and Tab stays inside while it is open, as in React (a click
 * outside lets focus go). The dismiss button and the `timeout` fire a cancelable `pttrn-close`, then close it unless
 * the event is cancelled. A snackbar with no dismiss button and no timeout cannot be dismissed, so give it one of the
 * two. `sendSnackbar()` and `pttrn-snackbar-manager` show one from anywhere on the page.
 *
 * React to Web Component mapping:
 *
 * - `open`, `text`, `timeout` → `open`, `text`, `timeout`
 * - `onClose` → the `pttrn-close` event
 * - `closeButton` (default true) → `hide-close-button` (inverted)
 * - `closeButtonLabel` → `close-button-label`
 * - `icon` → the `icon` slot
 * - `disableFocusTrap` → `disable-focus-trap`
 *
 * @fires {CustomEvent<{ reason: 'dismiss' | 'timeout' }>} pttrn-close - When the dismiss button is clicked or the
 *   timeout runs out. Cancel it to keep the snackbar open.
 * @element pttrn-snackbar
 * @slot icon - A decorative icon before the text.
 * @csspart content - The bar with the icon, the text and the dismiss button.
 */
export class PttrnSnackbar extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        text: { type: String },
        timeout: { type: Number },
        hideCloseButton: { type: Boolean, attribute: 'hide-close-button' },
        closeButtonLabel: { type: String, attribute: 'close-button-label' },
        disableFocusTrap: { type: Boolean, attribute: 'disable-focus-trap' },
        _hasIcon: { state: true },
        _truncated: { state: true },
    };

    static styles = styles;

    /** Whether the snackbar shows. */
    declare open: boolean;
    /** The message. */
    declare text: string;
    /** Closes the snackbar after this many milliseconds. Without it, only the dismiss button closes it. */
    declare timeout: number | undefined;
    /** Leaves out the dismiss button; give the snackbar a `timeout` then. */
    declare hideCloseButton: boolean;
    /** The label of the dismiss button. */
    declare closeButtonLabel: string;
    /** Lets Tab leave the snackbar. */
    declare disableFocusTrap: boolean;
    declare _hasIcon: boolean;
    /** Whether the text was cut short when last hovered, which renders its tooltip. */
    declare _truncated: boolean;

    private _timer: ReturnType<typeof setTimeout> | undefined;
    /** Where focus was before the snackbar opened, to return it there. */
    private _opener: HTMLElement | null = null;
    /** Tab stays inside until a click outside lets focus go, as React's focus trap does. */
    private _trapping = false;
    private readonly _tooltip = new TooltipController(this, {
        popover: () => this.renderRoot.querySelector<HTMLElement>('[data-pttrn="tooltip"]'),
    });

    constructor() {
        super();
        this.open = false;
        this.text = '';
        this.timeout = undefined;
        this.hideCloseButton = false;
        this.closeButtonLabel = 'Dismiss';
        this.disableFocusTrap = false;
        this._hasIcon = false;
        this._truncated = false;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this._timer);
        document.removeEventListener('mousedown', this._onDocumentMouseDown);
    }

    private get _container() {
        return this.renderRoot.querySelector<HTMLElement>('[data-pttrn="snackbar"]');
    }

    private get _content() {
        return this.renderRoot.querySelector<HTMLElement>('[data-snackbar-content]');
    }

    protected updated(changed: Map<string, unknown>) {
        if (changed.has('open')) {
            if (this.open) this._show();
            else this._hide();
        }
        if (changed.has('open') || changed.has('timeout')) {
            clearTimeout(this._timer);
            if (this.open && this.timeout) this._timer = setTimeout(() => this._requestClose('timeout'), this.timeout);
        }
    }

    private async _show() {
        const active = deepActiveElement();
        this._opener = active instanceof HTMLElement && active !== document.body ? active : null;
        this._container?.showPopover();
        this._trapping = !this.disableFocusTrap;
        document.addEventListener('mousedown', this._onDocumentMouseDown);
        await Promise.all(
            [...(this._content?.querySelectorAll('*') ?? [])].map(
                (element) => (element as Partial<LitElement>).updateComplete,
            ),
        );
        const content = this._content;
        if (this.open && content && !this.disableFocusTrap) (tabbables(content)[0] ?? content).focus();
    }

    private _hide() {
        document.removeEventListener('mousedown', this._onDocumentMouseDown);
        // The content is gone, so focus that was in it fell back to the body: return it to where it came from.
        const active = deepActiveElement();
        if (!active || active === document.body) this._opener?.focus();
        this._opener = null;
    }

    private readonly _onDocumentMouseDown = (event: MouseEvent) => {
        if (!event.composedPath().includes(this._content as EventTarget)) this._trapping = false;
    };

    /** Asks to close; closes unless a listener cancels the event. */
    private _requestClose(reason: SnackbarCloseDetail['reason']) {
        clearTimeout(this._timer);
        const event = new CustomEvent<SnackbarCloseDetail>('pttrn-close', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { reason },
        });
        if (this.dispatchEvent(event)) this.open = false;
    }

    private _onKeyDown(event: KeyboardEvent) {
        if (this._trapping && this._content) trapTab(event, this._content);
    }

    /** Shows the whole text in a tooltip while the pointer is on it, when it is cut short. */
    private async _onTextOver(event: MouseEvent) {
        const text = event.currentTarget as HTMLElement;
        this._truncated = text.scrollWidth > text.clientWidth;
        if (!this._truncated) return;
        await this.updateComplete;
        this._tooltip.attach(text);
        this._tooltip.show();
    }

    render() {
        if (!this.open) return nothing;
        return html`<div aria-live="off" data-pttrn="snackbar" popover="manual">
            <div data-snackbar-content part="content" role="alert" tabindex="-1" @keydown=${this._onKeyDown}>
                <div data-snackbar-icon-text>
                    <span aria-hidden="true" data-snackbar-icon ?hidden=${!this._hasIcon}
                        ><slot
                            name="icon"
                            @slotchange=${(event: Event) =>
                                (this._hasIcon = (event.target as HTMLSlotElement).assignedNodes().length > 0)}
                        ></slot
                    ></span>
                    <span data-label @mouseover=${this._onTextOver} @mouseleave=${() => this._tooltip.hide()}
                        >${this.text}</span
                    >
                </div>
                ${
                    this.hideCloseButton
                        ? nothing
                        : html`<pttrn-button
                              label=${this.closeButtonLabel || 'Dismiss'}
                              variant="tertiary"
                              @click=${() => this._requestClose('dismiss')}
                          ></pttrn-button>`
                }
            </div>
            ${this._truncated ? html`<span aria-hidden="true">${tooltipTemplate(this.text)}</span>` : nothing}
        </div>`;
    }
}

define('pttrn-snackbar', PttrnSnackbar);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-snackbar': PttrnSnackbar;
    }
}
