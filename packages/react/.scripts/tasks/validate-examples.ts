/* eslint-disable no-console */
/**
 * Example validation script.
 *
 * This script validates the examples in the components by extracting JSDoc examples and writing them to a temporary
 * directory.
 *
 * $ npx tsx .scripts/tasks/validate-examples.ts
 *
 * UI: val-ex - Validate that all components have examples and that the examples pass linting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { ComponentMeta } from 'src/types/meta';
import { getLocalMeta } from '../utils';

async function main() {
    const { typesMeta, componentsMeta } = await getLocalMeta(true);

    const getDefaultState = (prop: any): any => {
        if (prop.example) return prop.example;

        // if the prop is not required we don't need to set a default value
        if (!prop.required) return;

        if (prop.type === 'string' || prop.type === 'multiline') return `Example ${prop.name}`;

        if (prop.type === 'number') return '{0}';

        if (prop.type === 'boolean') return '{false}';

        if (prop.type === 'array') return '{[]}';

        if (prop.type === 'object') return '{{}}';

        if (typeof prop.type === 'string' && prop.type.startsWith('Array<')) return '{[]}';

        if (prop.options && prop.options.length > 0) {
            return `"${prop.options[0]}"`;
        }
    };

    const generatedExample = (component: ComponentMeta) => {
        const propsDef = typesMeta.find((meta) => meta.name === `${component.name}Props`);

        const propNames = propsDef?.properties?.map((prop) => prop.name) || [];

        const propsStringified =
            propsDef?.properties
                ?.map((prop) => {
                    if (prop.name === 'children') return null;

                    const strValue = prop.example || prop.default;

                    if (!strValue && !prop.required && prop.name !== 'value') return null;

                    let value = '';

                    if (prop.name === 'value') value = `{state}`;
                    else if (prop.type === 'string') value = `"${strValue || getDefaultState(prop) || ''}"`;
                    else if (typeof prop.type === 'string' && prop.type.startsWith('Array<'))
                        value = `{${strValue || ''}}`;
                    else if (prop.name.match(/^on[A-Z]/)) {
                        if (prop.name !== 'onChange') value = `{() => action('Called "${prop.name}" function')}`;
                        // some props have value and checked properties - we look for checked first
                        else if (propNames.includes('checked')) value = `{(checked) => setState(checked)}`;
                        else if (propNames.includes('value')) value = `{(nextValue) => setState(nextValue) }`;
                        else value = `{() => { console.warn('onChange function called') }}`;
                    }

                    return value ? `${prop.name}=${value}` : '';
                })
                .filter(Boolean)
                .join(' ') || '';

        let reactStuff = '';

        if (propsStringified.includes('setState')) {
            let stateType = propsDef?.properties?.find((prop) => prop.name === 'value')?.type || 'string';

            if (stateType === 'multiline') stateType = 'string';

            reactStuff = `const [state, setState] = useState<${stateType}>();`;
        }

        return `
   import { ${component.name} } from '@ptrn/react/${component.name}';

   export function Example() {

        ${reactStuff}

       return (
           ${
               (propNames.includes('children')
                   ? `<${component.name} ${propsStringified}>
               Example ${component.name}
           </${component.name}>`
                   : `<${component.name} ${propsStringified} />`) || ''
           }
       );
   }

   `;
    };

    const examplesDir = path.resolve(__dirname, '../.scripts/.tmp');
    execSync(`mkdir -p ${examplesDir}`, { stdio: 'inherit' });

    const exampleNames: string[] = [];

    const missingExamples: string[] = [];

    const examplePaths: string[] = [];

    componentsMeta.forEach((component) => {
        let example = component.usage?.code;

        const exampleFilePath = path.resolve(examplesDir, `${component.name}.tsx`);

        if (!example) {
            missingExamples.push(component.name);
            // If no example is found, we generate a default one
            example = generatedExample(component);
            // return;
        }

        /// make it pass linter
        example = example.replace('\nfunction', '\nexport function');
        if (example.includes('console.')) example = `/* eslint-disable no-console */${example}`;
        if (example.includes('React.')) example = `import React from 'react';\n${example}`;

        // write the example to a file
        fs.writeFileSync(exampleFilePath, example);

        exampleNames.push(component.name);
        examplePaths.push(exampleFilePath);
    });

    examplePaths.forEach((examplePath) => {
        execSync(`npx eslint "${examplePath}"`, { stdio: 'inherit' });
    });

    if (missingExamples.length > 0) {
        console.error(`\nMissing examples: \n\n`);

        missingExamples.forEach((c) => {
            console.error(` - /src/${c}.tsx\t\t/.scripts/.tmp/${c}.tsx`);
        });

        process.exit(1);
    }

    console.log(`Generated examples: ${exampleNames.join(', ')}.`);
}

main();
