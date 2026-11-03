import { version as webVersion } from '../../../packages/web/package.json';
import { USAGE_DESCRIPTION } from 'src/wc/field-demo';
import { radioGroupToHtml, RadioGroupWc } from 'src/wc/radio-group';
import { WebComponentDemo } from 'src/wc/types';

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-radio-group label="Delivery" helper-text="Choose how you want it delivered." name="delivery" required>
        <pttrn-radio-group-item value="standard" label="Standard" description="3 to 5 business days"></pttrn-radio-group-item>
        <pttrn-radio-group-item value="express" label="Express" description="Next business day"></pttrn-radio-group-item>
    </pttrn-radio-group>
</form>`;

/**
 * RadioGroupField has no element of its own: `pttrn-radio-group` with a `label` renders the field (a fieldset named by
 * its legend, the helper text or the error), as every `@ptrn/web` form control does.
 */
export const radioGroupFieldWc: WebComponentDemo = {
    tag: 'pttrn-radio-group',
    usage: USAGE,
    usageDescription: `${USAGE_DESCRIPTION} RadioGroupField is \`pttrn-radio-group\` with a \`label\`: the group renders the fieldset, its legend and the helper text or error itself.`,
    Wrapper: RadioGroupWc,
    toHtml: radioGroupToHtml,
};
