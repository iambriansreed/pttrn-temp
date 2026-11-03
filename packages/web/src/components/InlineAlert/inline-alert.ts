import checkCircleFill from '@ptrn/icons/CheckCircleFill.svg';
import errorFill from '@ptrn/icons/ErrorFill.svg';
import infoFill from '@ptrn/icons/InfoFill.svg';
import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import styles from './inline-alert.scss';

export type AlertVariant = 'error' | 'informational' | 'success' | 'warning';

/** The two-tone warning icon of @ptrn/react (`SvgWarningTwoTone`): the triangle in the variant tone, the mark in ink. */
const WARNING_TWO_TONE = `<svg data-pttrn-name="WarningTwoTone" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2.72503 21C2.5417 21 2.37503 20.9542 2.22503 20.8625C2.07503 20.7708 1.95837 20.65 1.87503 20.5C1.7917 20.35 1.74587 20.1875 1.73753 20.0125C1.7292 19.8375 1.77503 19.6667 1.87503 19.5L11.125 3.5C11.225 3.33333 11.3542 3.20833 11.5125 3.125C11.6709 3.04167 11.8334 3 12 3C12.1667 3 12.3292 3.04167 12.4875 3.125C12.6459 3.20833 12.775 3.33333 12.875 3.5L22.125 19.5C22.225 19.6667 22.2709 19.8375 22.2625 20.0125C22.2542 20.1875 22.2084 20.35 22.125 20.5C22.0417 20.65 21.925 20.7708 21.775 20.8625C21.625 20.9542 21.4584 21 21.275 21H2.72503ZM12 18C12.2834 18 12.5209 17.9042 12.7125 17.7125C12.9042 17.5208 13 17.2833 13 17C13 16.7167 12.9042 16.4792 12.7125 16.2875C12.5209 16.0958 12.2834 16 12 16C11.7167 16 11.4792 16.0958 11.2875 16.2875C11.0959 16.4792 11 16.7167 11 17C11 17.2833 11.0959 17.5208 11.2875 17.7125C11.4792 17.9042 11.7167 18 12 18ZM12 15C12.2834 15 12.5209 14.9042 12.7125 14.7125C12.9042 14.5208 13 14.2833 13 14V11C13 10.7167 12.9042 10.4792 12.7125 10.2875C12.5209 10.0958 12.2834 10 12 10C11.7167 10 11.4792 10.0958 11.2875 10.2875C11.0959 10.4792 11 10.7167 11 11V14C11 14.2833 11.0959 14.5208 11.2875 14.7125C11.4792 14.9042 11.7167 15 12 15Z" fill="currentColor"/><path d="M12.7125 17.7125C12.5208 17.9042 12.2833 18 12 18C11.7167 18 11.4792 17.9042 11.2875 17.7125C11.0958 17.5208 11 17.2833 11 17C11 16.7167 11.0958 16.4792 11.2875 16.2875C11.4792 16.0958 11.7167 16 12 16C12.2833 16 12.5208 16.0958 12.7125 16.2875C12.9042 16.4792 13 16.7167 13 17C13 17.2833 12.9042 17.5208 12.7125 17.7125Z" data-second-tone/><path d="M12.7125 14.7125C12.5208 14.9042 12.2833 15 12 15C11.7167 15 11.4792 14.9042 11.2875 14.7125C11.0958 14.5208 11 14.2833 11 14V11C11 10.7167 11.0958 10.4792 11.2875 10.2875C11.4792 10.0958 11.7167 10 12 10C12.2833 10 12.5208 10.0958 12.7125 10.2875C12.9042 10.4792 13 10.7167 13 11V14C13 14.2833 12.9042 14.5208 12.7125 14.7125Z" data-second-tone/></svg>`;

const VARIANT_ICON: Record<AlertVariant, string> = {
    error: errorFill,
    informational: infoFill,
    success: checkCircleFill,
    warning: WARNING_TWO_TONE,
};

/**
 * Inline alerts provide contextual feedback messages for typical user actions with a handful of available and flexible
 * alert messages.
 *
 * React prop to Web Component mapping:
 *
 * - `label` → `label` attribute, or the text in the default slot.
 * - `variant`, `owner` → attributes of the same name.
 * - `id` → `id` on the element. The element holds the alert, so a field's aria-describedby or aria-errormessage can point
 *   at it.
 *
 * @element pttrn-inline-alert
 * @slot - The message. Text here takes the place of `label`.
 */
export class PttrnInlineAlert extends LitElement {
    static properties = {
        label: { type: String },
        variant: { type: String, reflect: true },
        owner: { type: String, reflect: true },
        _hasContent: { state: true },
    };

    static styles = styles;

    /** The message. Text in the default slot takes its place. */
    declare label: string;
    /** The color variant, which also picks the icon. */
    declare variant: AlertVariant;
    /** The component the alert belongs to, such as a field, as the React `owner` prop (`data-pttrn-owner`). */
    declare owner: string | undefined;
    declare _hasContent: boolean;

    constructor() {
        super();
        this.label = '';
        this.variant = 'informational';
        this.owner = undefined;
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
            data-pttrn="inline-alert"
            data-pttrn-owner=${ifDefined(this.owner || undefined)}
            data-variant=${this.variant}
            role="alert"
        >
            ${unsafeSVG(icon.replace('<svg', '<svg aria-hidden="true"'))}
            <span data-txt
                ><slot @slotchange=${this._onSlotChange}></slot>${this._hasContent ? nothing : this.label}</span
            >
        </div>`;
    }
}

define('pttrn-inline-alert', PttrnInlineAlert);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-inline-alert': PttrnInlineAlert;
    }
}
