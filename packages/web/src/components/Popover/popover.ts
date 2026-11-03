import closeIcon from '@ptrn/icons/Close.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { autoUpdate, place, type Placement } from '../../utils/floating';
import { trapTab } from '../../utils/focus';
import { uniqueId } from '../../utils/id';
import '../Tooltip/tooltip';
import styles from './popover.scss';

export type PopoverToggleDetail = { open: boolean };
export type PopoverActionDetail = { action: 'primary' | 'secondary' };

/**
 * Brief message that provide additional guidance and helps users perform an action if needed.
 *
 * Wrap the trigger: `<pttrn-popover header="Title" content="Message"><button>Open</button></pttrn-popover>`. The first
 * child element is the trigger; clicking it opens a panel next to it in the top layer (the Popover API), with an arrow,
 * a close button and up to two actions. Focus moves into the panel and stays there while it is open; the close button
 * and Escape close it and return focus to the trigger, and a click outside closes it.
 *
 * The trigger's `aria-describedby` names the panel's text, which the element keeps in a hidden `<span
 * slot="description">` child of its own, because the attribute cannot reach into a shadow root.
 *
 * React to Web Component mapping:
 *
 * - `header`, `content` → `header`, `content`
 * - `placement` → `placement`
 * - `disabled` → `disabled`
 * - `refWidth` → `ref-width`
 * - `callToAction`, `secondaryCallToAction` → `action-label`, `secondary-action-label` and the `pttrn-action` event
 * - `children` (a render function given the trigger props) → the default slot; the element wires the trigger itself.
 *
 * @fires {CustomEvent<{ open: boolean }>} pttrn-toggle - After the user opens or closes the popover.
 * @fires {CustomEvent<{ action: 'primary' | 'secondary' }>} pttrn-action - When an action button is clicked.
 * @element pttrn-popover
 * @slot - The trigger, one element.
 * @csspart panel - The floating panel.
 */
export class PttrnPopover extends LitElement {
    static properties = {
        header: { type: String },
        content: { type: String },
        placement: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        refWidth: { type: Boolean, attribute: 'ref-width' },
        actionLabel: { type: String, attribute: 'action-label' },
        secondaryActionLabel: { type: String, attribute: 'secondary-action-label' },
        open: { type: Boolean, reflect: true },
    };

    static styles = styles;

    /** The title of the panel. */
    declare header: string;
    /** The message of the panel. */
    declare content: string;
    /** Where the panel shows, flipping to the other side when there is no room. */
    declare placement: Placement;
    /** Renders the trigger with no popover. */
    declare disabled: boolean;
    /** Matches the panel's width to the trigger's. */
    declare refWidth: boolean;
    /** The label of the primary action button; without it there is none. */
    declare actionLabel: string;
    /** The label of the secondary action button; without it there is none. */
    declare secondaryActionLabel: string;
    /** Whether the panel is open. */
    declare open: boolean;

    private readonly _panelId = uniqueId('pttrn-popover');
    /** The light-DOM node holding the panel's text, so the trigger's aria-describedby can reach it. */
    private readonly _description = Object.assign(document.createElement('span'), { hidden: true });
    private _trigger: HTMLElement | null = null;
    private _stopUpdates: (() => void) | null = null;

    constructor() {
        super();
        this.header = '';
        this.content = '';
        this.placement = 'top';
        this.disabled = false;
        this.refWidth = false;
        this.actionLabel = '';
        this.secondaryActionLabel = '';
        this.open = false;
        this._description.id = this._panelId;
        this._description.slot = 'description';
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._unwire();
        this._hidePanel();
    }

    private get _panel() {
        return this.renderRoot.querySelector<HTMLElement>('[data-pttrn="popover"]');
    }

    private readonly _onTriggerClick = () => this._setOpen(!this.open, false);

    private _setOpen(open: boolean, returnFocus: boolean) {
        if (this.disabled || open === this.open) return;
        this.open = open;
        emit<PopoverToggleDetail>(this, 'pttrn-toggle', { open });
        if (!open && returnFocus) this._trigger?.focus();
    }

    private _syncTrigger() {
        const trigger = this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])')?.assignedElements()[0];
        if (trigger !== this._trigger) this._unwire();
        if (this.disabled || !trigger) {
            this._unwire();
            this._description.remove();
            return;
        }
        if (this._description.parentNode !== this) this.append(this._description);
        if (this._trigger) return;
        this._trigger = trigger as HTMLElement;
        this._trigger.setAttribute('aria-describedby', this._panelId);
        this._trigger.addEventListener('click', this._onTriggerClick);
    }

    private _unwire() {
        if (!this._trigger) return;
        if (this._trigger.getAttribute('aria-describedby') === this._panelId)
            this._trigger.removeAttribute('aria-describedby');
        this._trigger.removeEventListener('click', this._onTriggerClick);
        this._trigger = null;
    }

    protected willUpdate(changed: Map<string, unknown>) {
        if (changed.has('disabled') && this.disabled) this.open = false;
    }

    protected updated(changed: Map<string, unknown>) {
        this._syncTrigger();
        this._description.textContent = this.open ? [this.header, this.content].filter(Boolean).join(' ') : '';
        if (changed.has('open')) {
            if (this.open) this._showPanel();
            else this._hidePanel();
        } else if (this._stopUpdates) {
            this._position();
        }
    }

    private _showPanel() {
        const panel = this._panel;
        if (!panel || !this._trigger) return;
        panel.showPopover();
        this._position();
        this._stopUpdates = autoUpdate(this._trigger, panel, () => this._position());
        document.addEventListener('mousedown', this._onDocumentMouseDown);
        // Focus moves to the panel itself, as React's focus trap does in a browser (the panel is not yet visible when the
        // trap starts, so it falls back to the panel): Tab then reaches the close button and the actions.
        panel.focus();
    }

    private _hidePanel() {
        this._stopUpdates?.();
        this._stopUpdates = null;
        document.removeEventListener('mousedown', this._onDocumentMouseDown);
    }

    private _position() {
        const panel = this._panel;
        const arrow = this.renderRoot.querySelector<HTMLElement>('[data-arrow]');
        if (!panel || !this._trigger) return;
        const { placement } = place(this._trigger, panel, {
            placement: this.placement,
            offset: 22,
            arrow,
            arrowPadding: 8,
            matchWidth: this.refWidth,
        });
        panel.dataset.placement = placement;
        // React aims the arrow of a trigger-wide panel at the start, the middle or the end, not at the trigger's center.
        if (this.refWidth && arrow && /^(top|bottom)/.test(placement)) {
            const x = parseFloat(arrow.style.left) || 0;
            if (placement.endsWith('-start')) arrow.style.left = '16px';
            else if (placement.endsWith('-end')) arrow.style.left = `${(x * 2 || 32) - 16}px`;
        }
    }

    /** A click outside the trigger and the panel closes the popover. */
    private readonly _onDocumentMouseDown = (event: MouseEvent) => {
        const path = event.composedPath();
        if (path.includes(this._panel as EventTarget) || path.includes(this._trigger as EventTarget)) return;
        this._setOpen(false, false);
    };

    private _onPanelKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this._setOpen(false, true);
            return;
        }
        if (this._panel) trapTab(event, this._panel);
    }

    private _action(action: PopoverActionDetail['action']) {
        emit<PopoverActionDetail>(this, 'pttrn-action', { action });
    }

    private _renderPanel() {
        const button = (label: string, variant: 'primary' | 'secondary', action: PopoverActionDetail['action']) =>
            html`<button data-size="small" data-variant=${variant} type="button" @click=${() => this._action(action)}>
                <span data-button-label>${label}</span><span aria-hidden="true" data-touch-target></span>
            </button>`;
        return html`<div
            data-placement=${this.placement}
            data-pttrn="popover"
            part="panel"
            popover="manual"
            tabindex="-1"
            @keydown=${this._onPanelKeyDown}
        >
            <header>
                <span data-header>${this.header}</span>
                <pttrn-tooltip label="Close" placement="top">
                    <button
                        data-close
                        data-size="medium"
                        data-variant="tertiary"
                        type="button"
                        @click=${() => this._setOpen(false, true)}
                    >
                        <span aria-hidden="true" data-button-icon>${unsafeSVG(closeIcon)}</span
                        ><span aria-hidden="true" data-touch-target></span>
                    </button>
                </pttrn-tooltip>
            </header>
            <div data-content>
                <div data-text>${this.content}</div>
                <div data-cta-row>
                    ${this.secondaryActionLabel ? button(this.secondaryActionLabel, 'secondary', 'secondary') : nothing}
                    ${this.actionLabel ? button(this.actionLabel, 'primary', 'primary') : nothing}
                </div>
            </div>
            <div data-arrow></div>
        </div>`;
    }

    render() {
        return html`<slot @slotchange=${() => this._syncTrigger()}></slot>
            ${this.open && !this.disabled ? this._renderPanel() : nothing}`;
    }
}

define('pttrn-popover', PttrnPopover);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-popover': PttrnPopover;
    }
}
