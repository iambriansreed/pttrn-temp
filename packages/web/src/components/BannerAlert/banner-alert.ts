import checkCircleFill from '@ptrn/icons/CheckCircleFill.svg';
import close from '@ptrn/icons/Close.svg';
import errorFill from '@ptrn/icons/ErrorFill.svg';
import infoFill from '@ptrn/icons/InfoFill.svg';
import warningFill from '@ptrn/icons/WarningFill.svg';
import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import '../Button/button';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import styles from './banner-alert.scss';

export type BannerAlertVariant = 'error' | 'informational' | 'success' | 'warning';

const VARIANT_ICON: Record<BannerAlertVariant, string> = {
    error: errorFill,
    informational: infoFill,
    success: checkCircleFill,
    warning: warningFill,
};

/**
 * A visual and contextual message used to communicate an important message or notification to users relating to a
 * status or the body content of a page.
 *
 * React prop to Web Component mapping:
 *
 * - `variant`, `header`, `body`, `elevated` → attributes of the same name; text in the default slot takes the place of
 *   `body`.
 * - `onClose` → `closable`, which shows the Close button, and the `pttrn-close` event it fires. The element does not
 *   remove itself: remove or hide it in the listener, as the React parent does.
 * - `callToAction` → `action-label`, which shows the button, and the `pttrn-action` event it fires.
 *
 * @fires {CustomEvent<null>} pttrn-close - The Close button was activated.
 * @fires {CustomEvent<null>} pttrn-action - The call-to-action button was activated.
 * @element pttrn-banner-alert
 * @slot - The body text. Text here takes the place of `body`.
 */
export class PttrnBannerAlert extends LitElement {
    static properties = {
        variant: { type: String, reflect: true },
        header: { type: String },
        body: { type: String },
        elevated: { type: Boolean, reflect: true },
        closable: { type: Boolean, reflect: true },
        actionLabel: { type: String, attribute: 'action-label' },
        _hasContent: { state: true },
    };

    static styles = styles;

    /** The color variant, which also picks the icon. */
    declare variant: BannerAlertVariant;
    /** The header of the banner alert. */
    declare header: string;
    /** The body of the banner alert. Text in the default slot takes its place. */
    declare body: string;
    /** Adds a drop shadow. */
    declare elevated: boolean;
    /** Shows a Close button, which fires `pttrn-close`. */
    declare closable: boolean;
    /** The label of the call-to-action button, which fires `pttrn-action`. Without it there is no button. */
    declare actionLabel: string;
    declare _hasContent: boolean;

    constructor() {
        super();
        this.variant = 'informational';
        this.header = '';
        this.body = '';
        this.elevated = false;
        this.closable = false;
        this.actionLabel = '';
        this._hasContent = false;
    }

    private _onSlotChange(event: Event) {
        this._hasContent = (event.target as HTMLSlotElement)
            .assignedNodes()
            .some((node) => node.nodeType !== Node.TEXT_NODE || !!node.textContent?.trim());
    }

    render() {
        const icon = VARIANT_ICON[this.variant] ?? VARIANT_ICON.informational;
        return html`<div
            data-elevated=${ifDefined(this.elevated ? '' : undefined)}
            data-pttrn="banner-alert"
            data-variant=${this.variant}
            role="alert"
        >
            <div aria-hidden="true" data-icon-bar>${unsafeSVG(icon)}</div>
            <div data-content>
                ${
                    this.header || this.closable
                        ? html`<div data-header>
                              <span>${this.header}</span>
                              ${
                                  this.closable
                                      ? html`<pttrn-button
                                            icon-only
                                            label="Close"
                                            size="small"
                                            variant="tertiary"
                                            @click=${() => emit(this, 'pttrn-close', null)}
                                            >${unsafeSVG(close.replace('<svg', '<svg slot="icon"'))}</pttrn-button
                                        >`
                                      : nothing
                              }
                          </div>`
                        : nothing
                }
                <div data-body>
                    <span
                        ><slot @slotchange=${this._onSlotChange}></slot>${this._hasContent ? nothing : this.body}</span
                    >
                    ${
                        this.actionLabel
                            ? html`<pttrn-button
                                  label=${this.actionLabel}
                                  size="small"
                                  variant="tertiary"
                                  @click=${() => emit(this, 'pttrn-action', null)}
                              ></pttrn-button>`
                            : nothing
                    }
                </div>
            </div>
        </div>`;
    }
}

define('pttrn-banner-alert', PttrnBannerAlert);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-banner-alert': PttrnBannerAlert;
    }
}
