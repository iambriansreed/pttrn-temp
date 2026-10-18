/**
 * Update examples in each component file removing the function Example wrapper
 *
 * $ npx tsx .scripts/tasks/lint-jsdoc-example.ts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ComponentMeta, TypeMeta } from 'src/types/meta';

(async () => {
    execSync(`cd ../../docs && npm run meta`, { stdio: 'inherit' });

    const { componentsMeta, typesMeta } = JSON.parse(
        fs.readFileSync(path.resolve('../../docs/src/meta/data.json'), 'utf-8'),
    ) as {
        componentsMeta: ComponentMeta[];
        typesMeta: TypeMeta[];
    };
    const examples: Record<
        string,
        | {
              rawProps: string[];
              props: Record<string, string>;
              fragment: string;
          }
        | undefined
    > = {};

    componentsMeta.forEach((component) => {
        // ensure component.example contains only props available in the component
        // ensure all props are documented in the example
        const fragment = (component.usage?.code?.replace(/\n/g, ' ') || '').split(`<${component.name} `)[1];

        // split in to prop and values

        if (!fragment) {
            examples[component.name] = undefined;
        } else {
            const props: string[] = [];
            let idx = 0;
            while (idx < fragment.length) {
                // skip whitespace
                while (idx < fragment.length && /\s/.test(fragment[idx])) idx++;

                // match prop name before =
                const nameMatch = fragment.slice(idx).match(/^(\w+)(?==)/);
                if (!nameMatch) {
                    idx++;
                    continue;
                }
                const name = nameMatch[1];
                idx += name.length;

                // expect =
                if (fragment[idx] !== '=') {
                    continue;
                }
                idx++;

                // parse braced value { ... } with simple brace depth handling
                if (fragment[idx] === '{') {
                    let depth = 0;
                    const start = idx;
                    do {
                        if (fragment[idx] === '{') depth++;
                        else if (fragment[idx] === '}') depth--;
                        idx++;
                    } while (idx < fragment.length && depth > 0);
                    const raw = fragment.slice(start, idx); // includes the outer braces
                    props.push(`${name}=${raw}`);
                } else {
                    // unbraced value (string or identifier) until whitespace or / or >
                    const m = fragment.slice(idx).match(/^"([^"]*)"|'([^']*)'|[^\s/>]+/);
                    if (m) {
                        props.push(`${name}=${m[0]}`);
                        idx += m[0].length;
                    } else {
                        idx++;
                    }
                }
            }

            // split only on the first '=' so values containing '=' are preserved
            const keyAndValues = props.map((prop) => prop.split(/=(.+)/));

            examples[component.name] = {
                rawProps: props,
                props: Object.fromEntries(keyAndValues.map(([key, value]) => [key, value])),
                fragment,
            };
        }
    });

    const output: Record<string, unknown> = {};
    Object.entries(examples).forEach(([componentName, example]) => {
        if (!example) return;

        const { props, fragment, rawProps } = example;
        const properties = typesMeta.find((t) => t.name === `${componentName}Props`)?.properties;

        if (!properties) return;

        if (!props) {
            output[componentName] = {
                everyPropIncluded: false,
                missingProps: properties.map((prop) => prop.name),
                fragment,
                rawProps,
            };
            return;
        }

        const everyPropIncluded = properties?.every((prop) => props?.[prop.name] !== undefined);

        const missingProps = properties
            ?.filter((prop) => !(prop.name in props) && prop.name !== 'children')
            .map((prop) => prop.name);

        const invalidProps = Object.keys(props).filter((propName) => !properties.find((p) => p.name === propName));

        if (missingProps.length === 0 && invalidProps.length === 0) return;

        const filePath = `./src${componentsMeta.find((c) => c.name === componentName)?.file}`;

        // :( execSync(`code ${filePath}`);

        output[componentName] = {
            everyPropIncluded,
            missingProps,
            invalidProps: invalidProps.length > 0 ? invalidProps : undefined,
            props,
            file: filePath,
        };
    });

    fs.writeFileSync('.tmp/examples.json', JSON.stringify({ output }, null, 4));
})();
