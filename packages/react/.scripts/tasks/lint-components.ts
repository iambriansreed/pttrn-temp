/* eslint-disable no-console */
/**
 * $ npx tsx .scripts/tasks/lint-components.ts
 *
 * UI: lint-comp - Lint all components for common issues
 */

import fs from 'fs';
import path from 'path';

import { getLocalMeta } from '../utils';

async function main() {
    const errors: string[] = [];

    const { componentsMeta, typesMeta } = await getLocalMeta(true);

    const packageJsonData = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'));

    fs.readdirSync(path.resolve('./src/components'), { withFileTypes: true }).forEach((dirent) => {
        if (!dirent.isDirectory() && dirent.name !== '.DS_Store') {
            errors.push(`❌ ${dirent.name} is in the components directory but is not a directory. Please remove it.`);
            return;
        }

        if (errors.length) return;
    });

    const hasExports = !!packageJsonData.exports;

    if (!hasExports) {
        errors.push('❌ package.json does not have an "exports" field. Please add it.');
    }

    componentsMeta.forEach(({ name, slug, phase }) => {
        if (hasExports) {
            const exports = [
                { key: `./${name}/*`, value: `./dist/components/${name}/*.js` },
                { key: `./${name}`, value: `./dist/components/${name}/index.js` },
            ];

            if (
                !exports.every(
                    ({ key, value }) => key in packageJsonData.exports && packageJsonData.exports[key] === value,
                )
            ) {
                errors.push(`❌ ${name} is not exported properly in package.json. Please add it to the exports.`);
                return;
            }
        }

        const indexPath = path.resolve(`./src/components/${name}/index.tsx`);

        const content = fs.readFileSync(path.resolve(`./src/components/${name}/${name}.tsx`), 'utf-8');

        if (!fs.existsSync(indexPath)) {
            errors.push(`❌ ${name} does not have an index.tsx file. Please create one.`);
            return;
        }

        // ensure the component file doesn't have any console logs/info that have been ignored
        if (content.includes('console.') && content.includes('no-console')) {
            errors.push(`❌ ${name} has console logging. Please remove them.`);
            return;
        }

        const hasDefaultDescription = content.includes(`Component description.`);
        const hasFunctionName = content.includes(`.pttrnName = '${name}'`);
        const hasDataName = content.includes(`data-pttrn="${slug}"`);
        const hasOwnerName = content.includes(`owner="${slug}"`);
        const hasDataUtilityName = content.includes(`data-pttrn-utility="${slug}"`);
        const hasDataOwnerName = content.includes(`data-pttrn-owner="${slug}"`);
        const isGenerated = content.includes(`@generated`);

        const sassNameMatch = content.match(/import '\.\/(.*)\.scss'/);

        const sassName = sassNameMatch?.[1];

        if (
            phase !== 'Utility' &&
            !isGenerated &&
            !hasDataName &&
            !hasDataUtilityName &&
            !hasDataOwnerName &&
            !hasOwnerName
        ) {
            errors.push(`❌ ${name} does not have a data-pttrn attribute. Please add it to the component.`);
        }

        if (sassName && sassName !== slug && sassName !== 'base') {
            errors.push(`❌ ${name} sass name does not match component slug "${sassName}"`);
        }

        if (hasFunctionName) {
            errors.push(`❌ ${name} should not have a pttrnName property`);
        }

        if (hasDefaultDescription) {
            errors.push(`❌ ${name} does not have a proper description`);
        }

        // lint component Properties

        const props = typesMeta?.find((t: { name: string }) => t.name === `${name}Props`);

        if (props?.properties) {
            // does not have duplicate property names
            const duplicatePropertyNames = props.properties.filter(
                (prop: { name: string }, index: number, self: { name: string }[]) =>
                    self.findIndex((prop2) => prop2.name === prop.name) !== index,
            );

            if (duplicatePropertyNames.length > 0) {
                errors.push(
                    `❌ ${name} has duplicate property names: ${duplicatePropertyNames.map((p) => p.name).join(', ')}`,
                );
            }

            // find duplicate property descriptions
            const duplicatePropertyDescriptions = props.properties
                .filter(
                    (prop, index, self) => self.findIndex((prop2) => prop2.description === prop.description) !== index,
                )
                .filter((prop) => !!prop.description);

            if (duplicatePropertyDescriptions.length > 0) {
                errors.push(
                    `❌ ${name} has duplicate property descriptions: ${duplicatePropertyDescriptions.map((p) => `${p.name} - ${p.description}`).join(', ')}`,
                );
            }
        }

        console.info(`✅ ${name} passes linting`);
    });

    if (errors.length > 0) {
        errors.forEach((error) => console.error(error));
        process.exit(1);
    }
}

main();
