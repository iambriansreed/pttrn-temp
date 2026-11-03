import { version as webVersion } from '../../../packages/web/package.json';
import { checkboxGroupToHtml, CheckboxGroupWc } from 'src/wc/checkbox-group';
import { USAGE_DESCRIPTION } from 'src/wc/field-demo';
import { WebComponentDemo } from 'src/wc/types';

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form style="width: 320px">
    <pttrn-checkbox-group label="Toppings" helper-text="Choose any you like." name="toppings" select-all required>
        <pttrn-checkbox-group-item value="cheese" label="Cheese" checked></pttrn-checkbox-group-item>
        <pttrn-checkbox-group-item value="olives" label="Olives" description="Black or green"></pttrn-checkbox-group-item>
        <pttrn-checkbox-group-item value="peppers" label="Peppers"></pttrn-checkbox-group-item>
    </pttrn-checkbox-group>
</form>`;

/**
 * CheckboxGroupField has no element of its own: `pttrn-checkbox-group` with a `label` renders the field (a fieldset
 * named by its legend, the helper text or the error), as every `@ptrn/web` form control does.
 */
export const checkboxGroupFieldWc: WebComponentDemo = {
    tag: 'pttrn-checkbox-group',
    usage: USAGE,
    usageDescription: `${USAGE_DESCRIPTION} CheckboxGroupField is \`pttrn-checkbox-group\` with a \`label\`: the group renders the fieldset, its legend and the helper text or error itself.`,
    Wrapper: CheckboxGroupWc,
    toHtml: checkboxGroupToHtml,
};
