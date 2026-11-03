import { LitElement, html } from 'lit';
import { define } from '../../utils/define';
import { uniqueId } from '../../utils/id';
import { TooltipController, tooltipTemplate } from '../../utils/tooltip-controller';
import styles from './tooltip.scss';

/**
 * Brief message that provide additional guidance and helps users perform an action if needed.
 *
 * Wrap the trigger: `<pttrn-tooltip label="Explains the button"><button>Click me</button></pttrn-tooltip>`. The first
 * child element is the trigger; hovering or focusing it shows the tooltip in the top layer (the Popover API), and
 * leaving it hides it.
 *
 * The tooltip names a trigger that has no name of its own (an icon-only button) with `aria-labelledby`. A trigger with
 * text, `aria-label` or `aria-labelledby` keeps its name and gets the tooltip as `aria-describedby` instead, as the
 * React Button does, so a visible label is never replaced. Neither attribute can reach into a shadow root, so the
 * element keeps the text in a `<span role="tooltip" slot="tooltip">` child of its own (in the same tree as the trigger)
 * and shows it through the `tooltip` slot. With no `label`, or when `disabled`, the trigger renders alone.
 *
 * React to Web Component mapping:
 *
 * - `label` → `label`
 * - `placement` → `placement`
 * - `disabled` → `disabled`
 * - `showTail` (default true) → `hide-tail` (inverted: a boolean attribute cannot default to true)
 * - `children` (a render function given the trigger props) → the default slot; the element wires the trigger itself.
 *
 * @element pttrn-tooltip
 * @slot - The trigger, one element.
 * @csspart tooltip - The floating box.
 */
export class PttrnTooltip extends LitElement {
    static properties = {
        label: { type: String },
        placement: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        hideTail: { type: Boolean, attribute: 'hide-tail', reflect: true },
    };

    static styles = styles;

    /** The tooltip text. */
    declare label: string;
    /** Where the tooltip shows, flipping to the opposite side when there is no room. */
    declare placement: 'top' | 'bottom' | 'left' | 'right';
    /** Renders the trigger with no tooltip. */
    declare disabled: boolean;
    /** Hides the arrow that points at the trigger. */
    declare hideTail: boolean;

    private readonly _tooltipId = uniqueId('pttrn-tooltip');
    /** The light-DOM node holding the text, so the trigger's aria-labelledby can reach it. */
    private _text: HTMLSpanElement | null = null;
    private _trigger: Element | null = null;
    /** The aria attribute the element added to the trigger, so it removes only its own wiring. */
    private _wiredAttribute: 'aria-labelledby' | 'aria-describedby' | null = null;
    private readonly _tooltip = new TooltipController(this, {
        popover: () => this.renderRoot.querySelector<HTMLElement>('[data-pttrn="tooltip"]'),
        placement: () => this.placement,
        tail: () => !this.hideTail,
    });

    constructor() {
        super();
        this.label = '';
        this.placement = 'top';
        this.disabled = false;
        this.hideTail = false;
    }

    private get _active() {
        return !!this.label && !this.disabled;
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.hasUpdated) this._sync();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._unwire();
    }

    protected updated() {
        this._sync();
    }

    /** Keeps the light-DOM text node and the trigger's wiring in step with `label`, `disabled` and the slotted trigger. */
    private _sync() {
        const trigger = this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])')?.assignedElements()[0];
        if (trigger !== this._trigger) {
            this._unwire();
            this._trigger = trigger ?? null;
        }

        if (!this._active || !this.isConnected) {
            this._unwire();
            this._text?.remove();
            return;
        }

        if (!this._text) {
            this._text = document.createElement('span');
            this._text.id = this._tooltipId;
            this._text.setAttribute('role', 'tooltip');
            this._text.slot = 'tooltip';
        }
        if (this._text.textContent !== this.label) this._text.textContent = this.label;
        if (this._text.parentNode !== this) this.append(this._text);

        if (this._trigger && !this._wiredAttribute) this._wire(this._trigger);
    }

    private _wire(trigger: Element) {
        // A trigger with a name of its own (its text, aria-label or aria-labelledby) keeps it: replacing a visible label
        // with the tooltip text would break label-in-name (WCAG 2.5.3). The tooltip names only a trigger with none.
        const named =
            !!trigger.textContent?.trim() ||
            trigger.hasAttribute('aria-label') ||
            trigger.hasAttribute('aria-labelledby');
        const attribute = named ? 'aria-describedby' : 'aria-labelledby';
        const ids = (trigger.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
        trigger.setAttribute(attribute, [...ids, this._tooltipId].join(' '));
        this._wiredAttribute = attribute;
        this._tooltip.attach(trigger);
    }

    private _unwire() {
        const trigger = this._trigger;
        if (!trigger || !this._wiredAttribute) return;
        const ids = (trigger.getAttribute(this._wiredAttribute) ?? '')
            .split(/\s+/)
            .filter((id) => id && id !== this._tooltipId);
        if (ids.length) trigger.setAttribute(this._wiredAttribute, ids.join(' '));
        else trigger.removeAttribute(this._wiredAttribute);
        this._wiredAttribute = null;
        this._tooltip.attach(null);
    }

    render() {
        return html`
            <slot @slotchange=${() => this._sync()}></slot>
            ${tooltipTemplate(html`<slot name="tooltip"></slot>`)}
        `;
    }
}

define('pttrn-tooltip', PttrnTooltip);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-tooltip': PttrnTooltip;
    }
}
