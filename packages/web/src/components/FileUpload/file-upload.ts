import cloudUpload from '@ptrn/icons/CloudUpload.svg';
import errorFill from '@ptrn/icons/ErrorFill.svg';
import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { uniqueId } from '../../utils/id';
import {
    DEFAULT_ERROR_MESSAGE,
    type FileUploadItemCancelDetail,
    type FileUploadStatus,
} from '../FileUploadItem/file-upload-item';
import styles from './file-upload.scss';

const MB = 1048576;

/** A file in the list, the same shape as the React `FileEntry`. */
export type FileEntry = {
    id: string;
    fileName: string;
    /** In MB. */
    fileSize: number;
    status?: FileUploadStatus;
    /** 0 to 100. */
    progress?: number;
    errorMessage?: string;
};

export type FileEntryUpload = FileEntry & { file: File };
export type FileUploadFilesDetail<Entry extends FileEntry = FileEntry> = { files: Entry[] };
export type FileUploadCancelDetail = FileUploadItemCancelDetail & { id: string };

// Decorative, and 24px wide by default like the React icon components.
const icon = (svg: string) => unsafeSVG(svg.replace('<svg ', '<svg aria-hidden="true" width="24" '));
const ICONS = { cloudUpload: icon(cloudUpload), error: icon(errorFill) };

const randomId = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');

/** Whether `file` matches an `accept` list: exact MIME types as React checks them, plus `type/*` and `.ext`. */
function accepts(accept: string[], file: File) {
    if (!accept.length) return true;
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    return accept.some((entry) => {
        const rule = entry.toLowerCase();
        if (rule.startsWith('.')) return name.endsWith(rule);
        if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
        return type === rule;
    });
}

/** Failed files after the rest, then by name, as the React list orders them. */
const byStatusThenName = (a: FileEntry, b: FileEntry) =>
    (a.status === 'error' ? 1 : -1) + (b.status === 'error' ? -1 : 1) || a.fileName.localeCompare(b.fileName);

/**
 * A widget that allows customers to upload and attach one or more files: a drop zone with a Browse button that takes
 * files, rejects the wrong type or size, and lists every file with its progress or error.
 *
 * It is a form control: inside a `<form>` it submits the accepted files under its `name`, like a file input, and a form
 * reset clears them. Your code does the uploading: listen for `pttrn-upload`, send the files, and report progress by
 * setting the `files` property, which updates the entries it names and adds new ones. The list is made of
 * `pttrn-file-upload-item` elements. Cancelling a file fires `pttrn-cancel` and then removes the file from the list and
 * the form value; call `preventDefault()` on the event to keep it.
 *
 * The zone has no role: the title and subtitle are text and the icon is hidden. Browse is a native button that opens
 * the hidden file input. Name the accepted types and the size limit in `upload-subtitle`, since the accept list is
 * never read aloud. Dragging is a pointer-only shortcut, with Browse as the alternative.
 *
 * React to Web Component mapping:
 *
 * | React               | Web Component                        | Note                                                           |
 * | ------------------- | ------------------------------------ | -------------------------------------------------------------- |
 * | `dragAndDrop`       | `drag-and-drop` attribute            |                                                                |
 * | `multipleFiles`     | `multiple` attribute                 | As on a file input.                                            |
 * | `uploadSubtitle`    | `upload-subtitle` attribute          |                                                                |
 * | `acceptedFileTypes` | `accept` attribute                   | Comma-separated, as on a file input; also `type/*` and `.ext`. |
 * | `maxFileSize`       | `max-file-size` attribute            | In MB, 2 by default.                                           |
 * | `cancelButtonLabel` | `cancel-button-label` attribute      | `Cancel` by default.                                           |
 * | `files`             | `files` property                     | Merged into the list by `id`.                                  |
 * | `onUpload`          | `pttrn-upload` event                 | `detail.files`, each entry with its `File`.                    |
 * | `onError`           | `pttrn-error` event                  | `detail.files`, the rejected entries.                          |
 * | `onCancel`          | `pttrn-cancel` event                 | `detail.fileName` and `detail.id`; cancelable.                 |
 * | none                | `name` attribute, form participation | The accepted files are the form value.                         |
 *
 * @fires {CustomEvent<{ files: FileEntryUpload[] }>} pttrn-upload - With the files the user chose or dropped that
 *   passed the type and size checks, each with an `id`, its name, its size in MB, status `idle` and the `File`.
 * @fires {CustomEvent<{ files: FileEntryUpload[] }>} pttrn-error - With the files rejected for their type or size, each
 *   with status `error` and the reason in `errorMessage`.
 * @fires {CustomEvent<{ fileName: string; id: string }>} pttrn-cancel - When the user cancels a file. Cancelable:
 *   unless prevented, the file leaves the list and the form value.
 * @element pttrn-file-upload
 */
export class PttrnFileUpload extends LitElement {
    static formAssociated = true;

    static properties = {
        name: { type: String, reflect: true },
        dragAndDrop: { type: Boolean, attribute: 'drag-and-drop', reflect: true },
        multiple: { type: Boolean, reflect: true },
        uploadSubtitle: { type: String, attribute: 'upload-subtitle' },
        accept: { type: String },
        maxFileSize: { type: Number, attribute: 'max-file-size' },
        cancelButtonLabel: { type: String, attribute: 'cancel-button-label' },
        files: { attribute: false },
        _entries: { state: true },
        _dragOver: { state: true },
        _disabled: { state: true },
    };

    static styles = styles;

    /** The name the files are submitted under in a form. */
    declare name: string;
    /** Lets files be dropped on the zone, and titles it "Drag and Drop". */
    declare dragAndDrop: boolean;
    /** Lets the user choose several files at once. */
    declare multiple: boolean;
    /** The line under the title. Name the accepted types and the size limit here. */
    declare uploadSubtitle: string;
    /** The accepted types, comma-separated, as on a file input. Empty accepts any type. */
    declare accept: string;
    /** The largest file accepted, in MB. */
    declare maxFileSize: number;
    /** The cancel buttons' tooltip and the start of their names. */
    declare cancelButtonLabel: string;
    /** Entries to show or update, matched by `id`: their status, progress and error message replace the listed ones. */
    declare files: FileEntry[];
    declare _entries: FileEntry[];
    declare _dragOver: boolean;
    declare _disabled: boolean;

    private readonly _internals: ElementInternals;
    private readonly _inputId = uniqueId('pttrn-file-upload-input');
    /** The chosen files that passed the checks, by entry id: the form value. */
    private readonly _chosen = new Map<string, File>();

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.name = '';
        this.dragAndDrop = false;
        this.multiple = false;
        this.uploadSubtitle = '';
        this.accept = '';
        this.maxFileSize = 2;
        this.cancelButtonLabel = 'Cancel';
        this.files = [];
        this._entries = [];
        this._dragOver = false;
        this._disabled = false;
    }

    /** The form this element belongs to, as on a native control. */
    get form() {
        return this._internals.form;
    }

    private get _accept() {
        return this.accept
            .split(',')
            .map((type) => type.trim())
            .filter(Boolean);
    }

    protected willUpdate(changed: PropertyValues<this>) {
        if (changed.has('files')) this._merge(this.files ?? []);
        if (changed.has('name')) this._updateFormValue();
    }

    /** Updates the listed entries `files` names and adds the rest, as the React component merges its `files` prop. */
    private _merge(files: FileEntry[]) {
        let entries = this._entries;
        for (const file of files) {
            const index = entries.findIndex((entry) => entry.id === file.id);
            if (index === -1) {
                entries = [...entries, { ...file }];
                continue;
            }
            const existing = entries[index];
            if (
                existing.status !== file.status ||
                existing.progress !== file.progress ||
                existing.errorMessage !== file.errorMessage
            ) {
                const updated = {
                    ...existing,
                    status: file.status,
                    progress: file.progress || 0,
                    errorMessage: file.errorMessage,
                };
                entries = entries.map((entry, at) => (at === index ? updated : entry));
            }
        }
        this._entries = entries;
    }

    private _updateFormValue() {
        if (!this.name || !this._chosen.size) {
            this._internals.setFormValue(null);
            return;
        }
        const value = new FormData();
        for (const file of this._chosen.values()) value.append(this.name, file);
        this._internals.setFormValue(value);
    }

    /** Checks each file's type and size, lists them all, and reports the accepted and the rejected ones. */
    private _add(files: File[]) {
        if (!files.length || this._disabled) return;
        const limit = (Number.isFinite(this.maxFileSize) ? this.maxFileSize : 2) * MB;
        const accept = this._accept;

        const entries = files.map((file): FileEntryUpload => {
            let status: FileUploadStatus = 'idle';
            let errorMessage = '';
            if (!accepts(accept, file)) {
                status = 'error';
                errorMessage = `File type not accepted: ${file.name}`;
            }
            if (file.size > limit) {
                status = 'error';
                errorMessage = `File too large. Please upload a smaller file: ${file.name}`;
            }
            return {
                id: randomId(),
                fileName: file.name,
                status,
                fileSize: file.size / MB,
                progress: 0,
                errorMessage,
                file,
            };
        });

        // The list keeps no File, as the React state does not.
        this._entries = [
            ...this._entries,
            ...entries.map(({ id, fileName, fileSize, status, progress, errorMessage }) => ({
                id,
                fileName,
                fileSize,
                status,
                progress,
                errorMessage,
            })),
        ];
        const rejected = entries.filter((entry) => entry.status === 'error');
        const accepted = entries.filter((entry) => entry.status === 'idle');
        for (const entry of accepted) this._chosen.set(entry.id, entry.file);
        this._updateFormValue();

        if (rejected.length) emit<FileUploadFilesDetail<FileEntryUpload>>(this, 'pttrn-error', { files: rejected });
        if (accepted.length) emit<FileUploadFilesDetail<FileEntryUpload>>(this, 'pttrn-upload', { files: accepted });
    }

    private _onChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this._add([...(input.files ?? [])]);
        // Choosing the same file again should still fire change.
        input.value = '';
    }

    private _browse() {
        this.renderRoot.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    }

    private _onDrag(event: DragEvent, over: boolean) {
        if (!this.dragAndDrop) return;
        event.preventDefault();
        this._dragOver = over;
    }

    private _onDrop(event: DragEvent) {
        if (!this.dragAndDrop) return;
        event.preventDefault();
        this._dragOver = false;
        this._add([...(event.dataTransfer?.files ?? [])]);
    }

    /** An item's cancel, passed on from this element with the entry id; unless prevented the file leaves the list. */
    private _onCancel(event: CustomEvent<FileUploadItemCancelDetail>) {
        event.stopPropagation();
        const id = (event.target as HTMLElement).id;
        // Dispatched directly rather than through emit(): this one is cancelable.
        const proceed = this.dispatchEvent(
            new CustomEvent<FileUploadCancelDetail>('pttrn-cancel', {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: { fileName: event.detail.fileName, id },
            }),
        );
        if (!proceed) return;
        this._entries = this._entries.filter((entry) => entry.id !== id);
        this._chosen.delete(id);
        this._updateFormValue();
    }

    formResetCallback() {
        this._entries = [];
        this._chosen.clear();
        this._merge(this.files ?? []);
        this._updateFormValue();
    }

    formDisabledCallback(disabled: boolean) {
        this._disabled = disabled;
    }

    render() {
        let title = 'Drag and Drop';
        if (!this.dragAndDrop) title = this.multiple ? 'Upload Files' : 'Upload a File';
        const files = this.files ?? [];
        const zoneError = files.length === 1 && files[0].status === 'error';

        return html`
            <div
                class=${classMap({ 'drag-over': this._dragOver })}
                data-pttrn="file-upload"
                @dragleave=${(event: DragEvent) => this._onDrag(event, false)}
                @dragover=${(event: DragEvent) => this._onDrag(event, true)}
                @drop=${this._onDrop}
            >
                ${ICONS.cloudUpload}
                <span data-txt="body-large">${title}</span>
                ${this.uploadSubtitle ? html`<span data-txt="body-small">${this.uploadSubtitle}</span>` : nothing}
                <input
                    accept=${this._accept.join(', ') || nothing}
                    hidden
                    id=${this._inputId}
                    ?multiple=${this.multiple}
                    type="file"
                    @change=${this._onChange}
                />
                <button ?disabled=${this._disabled} type="button" @click=${this._browse}>
                    <span data-button-label>Browse</span><span aria-hidden="true" data-touch-target></span>
                </button>
                ${
                    zoneError
                        ? html`<div data-alert data-variant="error" role="alert">
                              ${ICONS.error}<span data-txt="body-small"
                                  >${files[0].errorMessage || DEFAULT_ERROR_MESSAGE}</span
                              >
                          </div>`
                        : nothing
                }
            </div>
            <div data-file-entries @pttrn-cancel=${this._onCancel}>
                ${repeat(
                    [...this._entries].sort(byStatusThenName),
                    (entry) => entry.id,
                    (entry) =>
                        html`<pttrn-file-upload-item
                            .cancelButtonLabel=${this.cancelButtonLabel}
                            .errorMessage=${entry.errorMessage || DEFAULT_ERROR_MESSAGE}
                            .fileName=${entry.fileName}
                            .fileSize=${entry.fileSize}
                            id=${entry.id}
                            .progress=${entry.progress ?? 0}
                            .status=${entry.status}
                        ></pttrn-file-upload-item>`,
                )}
            </div>
        `;
    }
}

define('pttrn-file-upload', PttrnFileUpload);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-file-upload': PttrnFileUpload;
    }
}
