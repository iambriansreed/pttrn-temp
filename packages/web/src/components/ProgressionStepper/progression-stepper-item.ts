import { LitElement } from 'lit';
import { define } from '../../utils/define';

/**
 * One step of a `pttrn-progression-stepper`. It holds data and renders nothing itself: the stepper draws every step in
 * its own ordered list, so the list and its items stay one accessible structure.
 *
 * @element pttrn-progression-stepper-item
 */
export class PttrnProgressionStepperItem extends LitElement {
    static properties = {
        name: { type: String },
        subtext: { type: String },
    };

    /** The name of the step. */
    declare name: string;
    /** A second line under the name. The widget shows the current step's subtext in its header. */
    declare subtext: string;

    constructor() {
        super();
        this.name = '';
        this.subtext = '';
    }

    render() {
        return null;
    }

    updated() {
        // The stepper renders this step, so it redraws when the step changes.
        const stepper = this.parentElement;
        if (stepper?.localName === 'pttrn-progression-stepper') (stepper as LitElement).requestUpdate();
    }
}

define('pttrn-progression-stepper-item', PttrnProgressionStepperItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-progression-stepper-item': PttrnProgressionStepperItem;
    }
}
