/**
 * This script generates Field components for various input types.
 *
 * $ npx tsx .scripts/tasks/generate-fields.ts
 */
import { execSync } from 'child_process';
import fs from 'fs';

const CONTROLS = [
    // all input components that need Field wrappers
    // 'DatePicker',
    // 'Input',
    // 'InputNumber',
    // 'InputPhone',
    // 'Password',
    // 'Select',
    // 'Textarea',
    // 'TimePicker',
    // 'RadioGroup',
    // 'CheckboxGroup',
    'OTPInput',
];

CONTROLS.map((name) => {
    // delete existing Field component if it exists
    const fieldPath = `./src/components/${name}/Field.tsx`;
    // ensure index file does not export the Field component
    const indexPath = `./src/components/${name}/index.tsx`;

    if (fs.existsSync(fieldPath)) {
        fs.unlinkSync(fieldPath);
    }

    const indexContent = fs.readFileSync(indexPath, 'utf8');

    const exportStatement = `export * from './Field';\n`;

    if (indexContent.includes(exportStatement)) {
        fs.writeFileSync(indexPath, indexContent.replace(exportStatement, ''), 'utf8');
    }

    // make new component folder

    execSync(`mkdir -p ./src/components/${name}Field`);

    // write Field component file

    const content = `import { Field, ComposedFieldProps, propsWithAria } from '-/components/Field';
import { ${name}, ${name}Props } from '-/components/${name}';
import { useId } from '-/hooks/useId';

export type ${name}FieldProps = ComposedFieldProps<${name}Props>;

/**
 * A field wrapper for the ${name} component.
 *
 * This component takes properties from the FormField and ${name} components.
 *
 * @name ${name}Field
 * @phase UXReview
 *
 * @generated
 */
export function ${name}Field({ label, helperText, labelTrailing, errorMessage, style, id: idProp, ...controlProps }: ${name}FieldProps) {
    const id = useId(idProp);
    return (
        <Field controlId={id} errorMessage={errorMessage} helperText={helperText} label={label} labelTrailing={labelTrailing} style={style} required={controlProps.required}>
            <${name} {...propsWithAria({ id, controlProps, errorMessage, helperText })} />
        </Field>
    );
}

`;

    const testContent = `import { ${name}Field } from '.';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { render } from '-/rtl/util';

const TestBed = () => (
    <>
        <${name}Field label="Example field label" name="example-field-name" onChange={() => {}} value="" />
    </>
);

describe('${name}Field (RTL)', () => {
    it('has no basic a11y issues', hasNoBasicA11yIssues(<TestBed />));

    it('renders', () => {
        const { getAllByLabelText } = render(<TestBed />);

        expect(getAllByLabelText('Example field label')[0]).toBeInTheDocument();
    });
});
`;

    const path = `./src/components/${name}Field/${name}Field.tsx`;

    fs.writeFileSync(path, content, 'utf8');

    // write test file

    const testPath = `./src/components/${name}Field/${name}Field.rtl.test.tsx`;

    fs.writeFileSync(testPath, testContent, 'utf8');

    // update index file to export new Field component

    const newIndexPath = `./src/components/${name}Field/index.tsx`;
    fs.writeFileSync(
        newIndexPath,
        `
        export * from './${name}Field';`,
        'utf8',
    );
});

execSync('npx prettier --write ./src');
