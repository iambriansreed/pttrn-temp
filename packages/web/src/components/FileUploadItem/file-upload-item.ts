import deleteIcon from '@ptrn/icons/Delete.svg';
import draft from '@ptrn/icons/Draft.svg';
import errorFill from '@ptrn/icons/ErrorFill.svg';
import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { uniqueId } from '../../utils/id';
import { hideTooltip, showTooltip, tooltip } from '../../utils/private-tooltip';
import styles from './file-upload-item.scss';

export type FileUploadStatus = 'complete' | 'error' | 'failed' | 'idle' | 'uploading';
export type FileUploadItemCancelDetail = { fileName: string };

export const DEFAULT_ERROR_MESSAGE = 'There was an error uploading the file. Please try again.';

// Decorative, and 24px wide by default like the React icon components.
const icon = (svg: string) => unsafeSVG(svg.replace('<svg ', '<svg aria-hidden="true" width="24" '));
const ICONS = { draft: icon(draft), delete: icon(deleteIcon), error: icon(errorFill) };

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

/** A size in MB as the React item shows it: KB below one MB, MB below one GB, GB past it, rounded up to two places. */
export function formatFileSize(fileSize?: number) {
    if (!fileSize || !Number.isFinite(fileSize)) return 'Unknown size';
    const bytes = fileSize * MB;
    const roundUp2 = (value: number) => Math.ceil(value * 100) / 100;
    if (bytes < MB) return `${roundUp2(bytes / KB)} KB`;
    if (bytes < GB) return `${roundUp2(bytes / MB)} MB`;
    return `${roundUp2(bytes / GB)} GB`;
}

/**
 * A component that represents an uploaded item and its status: the file name, its size and status over a progress bar
 * or an error alert, with a button that cancels it. Usually used inside `pttrn-file-upload`.
 *
 * The item has no role. The cancel button is named by `cancel-button-label` followed by the file name ("Cancel
 * holiday-photo.png"), and shows the label alone as its tooltip. The progress bar is a native `progress` element named
 * by its percentage, `aria-busy` until it reaches 100; with `status="error"` an alert takes its place and announces the
 * message. Both icons are hidden from assistive technology.
 *
 * React to Web Component mapping:
 *
 * | React               | Web Component                   | Note                                               |
 * | ------------------- | ------------------------------- | -------------------------------------------------- |
 * | `fileName`          | `file-name` attribute           | Truncated to its line, the full name in a tooltip. |
 * | `fileSize`          | `file-size` attribute           | In MB.                                             |
 * | `status`            | `status` attribute (reflected)  |                                                    |
 * | `progress`          | `progress` attribute            | 0 to 100.                                          |
 * | `errorMessage`      | `error-message` attribute       | Shown when `status` is `error`.                    |
 * | `cancelButtonLabel` | `cancel-button-label` attribute | `Cancel` by default.                               |
 * | `id`                | `id` attribute                  |                                                    |
 * | `onCancel`          | `pttrn-cancel` event            | `detail.fileName`.                                 |
 *
 * @fires {CustomEvent<{ fileName: string }>} pttrn-cancel - When the user presses the cancel button.
 * @element pttrn-file-upload-item
 */
export class PttrnFileUploadItem extends LitElement {
    static properties = {
        fileName: { type: String, attribute: 'file-name' },
        fileSize: { type: Number, attribute: 'file-size' },
        status: { type: String, reflect: true },
        progress: { type: Number },
        errorMessage: { type: String, attribute: 'error-message' },
        cancelButtonLabel: { type: String, attribute: 'cancel-button-label' },
        _truncated: { state: true },
    };

    static styles = styles;

    /** The name of the file. */
    declare fileName: string;
    /** The size of the file in MB. Missing or 0 reads "Unknown size". */
    declare fileSize: number | undefined;
    /** The upload status, shown after the size. `error` shows the error message in place of the progress bar. */
    declare status: FileUploadStatus | undefined;
    /** How much of the file has uploaded, from 0 to 100. */
    declare progress: number;
    /** The message when `status` is `error`. */
    declare errorMessage: string;
    /** The cancel button's tooltip and the start of its name. */
    declare cancelButtonLabel: string;
    declare _truncated: boolean;

    private readonly _progressId = uniqueId('pttrn-file-upload-item-progress');
    private readonly _cancelTipId = uniqueId('pttrn-file-upload-item-cancel');
    private readonly _nameTipId = uniqueId('pttrn-file-upload-item-name');
    private readonly _resize = new ResizeObserver(() => this._measure());

    constructor() {
        super();
        this.fileName = '';
        this.fileSize = undefined;
        this.status = undefined;
        this.progress = 0;
        this.errorMessage = DEFAULT_ERROR_MESSAGE;
        this.cancelButtonLabel = 'Cancel';
        this._truncated = false;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._resize.disconnect();
        this.renderRoot.querySelectorAll<HTMLElement>('[data-tooltip]').forEach((tip) => hideTooltip(tip));
    }

    protected firstUpdated() {
        const name = this.renderRoot.querySelector('[data-file-name]');
        if (name) this._resize.observe(name);
    }

    protected updated(changed: PropertyValues<this>) {
        if (changed.has('fileName')) this._measure();
    }

    /** Whether the name is cut off, which gives it a tooltip with the full name, as the React Truncated does. */
    private _measure() {
        const name = this.renderRoot.querySelector<HTMLElement>('[data-file-name]');
        if (name) this._truncated = name.scrollWidth > name.clientWidth;
    }

    private _tip(id: string) {
        return this.renderRoot.querySelector<HTMLElement>(`#${id}`);
    }

    private _cancel() {
        emit<FileUploadItemCancelDetail>(this, 'pttrn-cancel', { fileName: this.fileName });
    }

    private _status() {
        if (this.status === 'error') {
            return html`<div data-alert data-variant="error" role="alert">
                ${ICONS.error}<span data-txt>${this.errorMessage || DEFAULT_ERROR_MESSAGE}</span>
            </div>`;
        }
        const progress = Number.isFinite(this.progress) ? this.progress : 0;
        const completion = Math.max(0, Math.min(100, Math.round(progress)));
        return html`<div data-align="left" data-progress-bar data-size="large">
            <progress
                aria-busy=${completion < 100 ? 'true' : 'false'}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow=${completion}
                id=${this._progressId}
                max="100"
                .value=${completion}
            >
                ${completion}%
            </progress>
            <div aria-hidden="true" data-bar style="--width: ${completion}%"></div>
            <label for=${this._progressId}>${completion}%</label>
        </div>`;
    }

    render() {
        const label = this.cancelButtonLabel || 'Cancel';
        const details = [formatFileSize(this.fileSize), this.status].filter(Boolean).join(' • ');
        const truncated = this._truncated;

        return html`
            <div data-pttrn="file-upload-item">
                <div data-row>
                    <div data-icon>${ICONS.draft}</div>
                    <div data-info>
                        <span
                            aria-labelledby=${truncated ? this._nameTipId : nothing}
                            data-file-name
                            data-truncated
                            role=${truncated ? 'note' : nothing}
                            @mouseenter=${(e: Event) => truncated && showTooltip(e.currentTarget as Element, this._tip(this._nameTipId))}
                            @mouseleave=${() => hideTooltip(this._tip(this._nameTipId))}
                            >${this.fileName}</span
                        >
                        ${truncated ? tooltip(this._nameTipId, this.fileName) : nothing}
                        <span data-file-details>${details}</span>
                    </div>
                    <button
                        aria-label=${`${label} ${this.fileName}`}
                        data-size="large"
                        data-variant="tertiary"
                        type="button"
                        @blur=${() => hideTooltip(this._tip(this._cancelTipId))}
                        @click=${this._cancel}
                        @focus=${(e: Event) => showTooltip(e.currentTarget as Element, this._tip(this._cancelTipId))}
                        @mouseenter=${(e: Event) => showTooltip(e.currentTarget as Element, this._tip(this._cancelTipId))}
                        @mouseleave=${() => hideTooltip(this._tip(this._cancelTipId))}
                    >
                        <span aria-hidden="true" data-button-icon>${ICONS.delete}</span
                        ><span aria-hidden="true" data-touch-target></span>
                    </button>
                    ${tooltip(this._cancelTipId, label)}
                </div>
                <div data-status>${this._status()}</div>
            </div>
        `;
    }
}

define('pttrn-file-upload-item', PttrnFileUploadItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-file-upload-item': PttrnFileUploadItem;
    }
}
