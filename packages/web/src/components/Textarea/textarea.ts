import { PropertyValues, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import { FIELD_IDS, FieldControl } from '../../utils/field-control';
import styles from './textarea.scss';

/**
 * A component that allows users to input large amounts of text that could span multiple lines.
 *
 * The field grows with its content between `min-rows` and `max-rows`, then scrolls. It needs a name: `label` (the
 * visible label a Field gives the React Textarea) or `aria-label`. It is a form control: it submits `name` and `value`
 * with its form, mirrors the native textarea's validity (`required`, `maxlength`), and goes back to its `value`
 * attribute on form reset.
 *
 * @fires {CustomEvent<{ value: string }>} pttrn-change - After the user changes the text. `detail.value` is the new
 *   value.
 * @fires {Event} change - With `pttrn-change`, so code that listens for the native event works too.
 * @element pttrn-textarea
 */
export class PttrnTextarea extends FieldControl {
    static properties = {
        value: { type: String },
        placeholder: { type: String },
        size: { type: String, reflect: true },
        maxLength: { type: Number, attribute: 'maxlength' },
        minRows: { type: Number, attribute: 'min-rows' },
        maxRows: { type: Number, attribute: 'max-rows' },
    };

    static styles = styles;

    /** The current value. The `value` attribute is the default value, which a form reset goes back to. */
    declare value: string;
    /** Shown while the field is empty. */
    declare placeholder: string;
    /** The size of the field. */
    declare size: 'large' | 'medium' | 'small';
    /** The maximum number of characters the field accepts, enforced by the textarea itself. */
    declare maxLength: number | undefined;
    /** The minimum number of rows the field shows, 3 to 10. */
    declare minRows: number;
    /** The maximum number of rows the field grows to before it scrolls, 3 to 10. */
    declare maxRows: number;

    constructor() {
        super();
        this.value = '';
        this.placeholder = '';
        this.size = 'medium';
        this.maxLength = undefined;
        this.minRows = 4;
        this.maxRows = 10;
    }

    protected get _validityAnchor() {
        return this.renderRoot?.querySelector('textarea') ?? null;
    }

    protected _formValue() {
        return this.value;
    }

    protected _resetValue() {
        this.value = this.getAttribute('value') ?? '';
    }

    protected _restoreValue(state: string) {
        this.value = state;
    }

    protected willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        if (this.value === null || this.value === undefined) this.value = '';
    }

    private _onInput(event: Event) {
        this.value = (event.target as HTMLTextAreaElement).value;
        this._emitChange(this.value);
    }

    render() {
        const disabled = this._isDisabled;
        const aria = this._controlAria;
        const value = String(this.value ?? '');

        return this._renderField(html`
            <div
                data-pttrn="textarea"
                data-size=${this.size}
                style=${styleMap({ '--min-rows': String(this.minRows), '--max-rows': String(this.maxRows) })}
                ?data-disabled=${disabled}
                ?data-invalid=${this._isInvalid}
                ?data-readonly=${this.readOnly}
            >
                <textarea
                    aria-describedby=${aria.describedBy}
                    aria-errormessage=${aria.errorMessage}
                    aria-invalid=${aria.invalid}
                    aria-label=${aria.label}
                    id=${FIELD_IDS.control}
                    maxlength=${this.maxLength ?? nothing}
                    name=${this.name || nothing}
                    placeholder=${this.placeholder || nothing}
                    wrap="hard"
                    .value=${live(value)}
                    ?disabled=${disabled}
                    ?readonly=${this.readOnly}
                    ?required=${this.required}
                    @blur=${(event: FocusEvent) => ((event.target as HTMLTextAreaElement).scrollTop = 0)}
                    @input=${this._onInput}
                ></textarea>
                <!-- The trailing line break gives an empty last line its height, as in React. -->
                <div aria-hidden="true" data-replicated-value>${`${value}\n`}</div>
            </div>
        `);
    }
}

define('pttrn-textarea', PttrnTextarea);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-textarea': PttrnTextarea;
    }
}
