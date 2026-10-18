/* eslint-disable no-console */
/**
 * This script generates a new component test with all the expected boilerplate.
 *
 * $ npx tsx .scripts/tasks/create-tests.ts
 *
 * UI: newt - Create new tests for components that don't have them yet
 */

import fs from 'fs';
import { generateAndWriteTestFile } from '.scripts/lib/generateTestFile';
import { getComponentFiles } from '.scripts/lib/getComponentFiles';

const blackList: { [key: string]: true } = {};

(async () => {
    const components = (await getComponentFiles()).filter(filterNonPertinentComponents);

    components.forEach(({ name, filePath }) => {
        const testFilePath = filePath.replace('.tsx', '.rtl.test.tsx');

        if (fs.existsSync(testFilePath)) {
            console.log(`🆒 \x1b[33m${name}\x1b[0m Test already exists\x1b[90m at ${testFilePath}\x1b[0m`);

            return;
        }

        generateAndWriteTestFile(name, testFilePath);
        console.log(`✅ \x1b[32m${name}\x1b[0m Generated\x1b[90m at ${testFilePath}\x1b[0m`);
    });
})();

function filterNonPertinentComponents({ name }: { name: string }) {
    if (name.startsWith('StylesProvider')) {
        return false;
    }

    if (blackList[name]) return false;

    return true;
}
