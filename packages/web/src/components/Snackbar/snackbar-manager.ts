import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import './snackbar';
import type { PttrnSnackbar } from './snackbar';

const SEND_EVENT = 'pttrn-snackbar-send';
const CLEAR_EVENT = 'pttrn-snackbar-clear';

/** What `sendSnackbar` takes: the snackbar's settings, with `icon` as SVG markup. */
export type SendSnackbarOptions = {
    text: string;
    timeout?: number;
    closeButton?: boolean;
    closeButtonLabel?: string;
    disableFocusTrap?: boolean;
    /** The SVG markup of a decorative icon. */
    icon?: string;
    /** Called when the snackbar closes. */
    onClose?: () => void;
};

/**
 * Shows a snackbar through the page's `pttrn-snackbar-manager`, replacing any it shows. A string is the text, with the
 * manager's default timeout.
 */
export function sendSnackbar(options: SendSnackbarOptions | string) {
    document.dispatchEvent(new CustomEvent(SEND_EVENT, { detail: options }));
}

/** Removes the snackbar the page's `pttrn-snackbar-manager` shows. */
export function clearSnackbar() {
    document.dispatchEvent(new CustomEvent(CLEAR_EVENT));
}

/**
 * Shows the snackbars `sendSnackbar()` asks for, one at a time, as React's SnackbarManager does. Put one on the page.
 *
 * React to Web Component mapping:
 *
 * - `defaultTimeout` → `default-timeout`
 * - `sendSnackbar`, `clearSnackbar` → the functions of the same names, exported by `@ptrn/web/Snackbar`
 *
 * @element pttrn-snackbar-manager
 */
export class PttrnSnackbarManager extends LitElement {
    static properties = {
        defaultTimeout: { type: Number, attribute: 'default-timeout' },
        _current: { state: true },
    };

    /** The timeout of a snackbar sent as a plain string, in milliseconds. */
    declare defaultTimeout: number;
    declare _current: SendSnackbarOptions | undefined;

    constructor() {
        super();
        this.defaultTimeout = 5000;
        this._current = undefined;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(SEND_EVENT, this._onSend);
        document.addEventListener(CLEAR_EVENT, this._onClear);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(SEND_EVENT, this._onSend);
        document.removeEventListener(CLEAR_EVENT, this._onClear);
    }

    private readonly _onSend = (event: Event) => {
        const detail = (event as CustomEvent<SendSnackbarOptions | string>).detail;
        if (!detail) {
            this._current = undefined;
            return;
        }
        // A new message replaces the one showing: close it first so the new one opens (and is announced) afresh.
        this._current = undefined;
        this.updateComplete.then(() => {
            this._current = typeof detail === 'string' ? { text: detail, timeout: this.defaultTimeout } : detail;
        });
    };

    private readonly _onClear = () => {
        this._current = undefined;
    };

    private _onClose(event: Event) {
        if ((event.target as PttrnSnackbar).localName !== 'pttrn-snackbar') return;
        const current = this._current;
        this._current = undefined;
        current?.onClose?.();
    }

    render() {
        const current = this._current;
        if (!current) return nothing;
        return html`<pttrn-snackbar
            close-button-label=${current.closeButtonLabel ?? 'Dismiss'}
            open
            text=${current.text}
            timeout=${current.timeout ?? nothing}
            ?disable-focus-trap=${!!current.disableFocusTrap}
            ?hide-close-button=${current.closeButton === false}
            @pttrn-close=${this._onClose}
            >${current.icon ? unsafeSVG(current.icon.replace('<svg', '<svg slot="icon"')) : nothing}</pttrn-snackbar
        >`;
    }
}

define('pttrn-snackbar-manager', PttrnSnackbarManager);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-snackbar-manager': PttrnSnackbarManager;
    }
}
