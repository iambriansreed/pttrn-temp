/* eslint-disable no-console */
/**
 * This script generates a new component with all the expected boilerplate.
 *
 * $ npx tsx .scripts/tasks/new-component.ts ${componentName}
 *
 * UI: new-comp - Create a new component with all the expected boilerplate
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

import { generateAndWriteComponentFile } from '.scripts/lib/generateComponentFile';
import { generateAndWriteExampleFile } from '.scripts/lib/generateExampleFile';
import { generateAndWriteStylesFile } from '.scripts/lib/generateStylesFile';
import { generateAndWriteTestFile } from '.scripts/lib/generateTestFile';
import { getComponentsDir } from '.scripts/lib/getComponentsDir';
import { kebabCase, capitalizeFirstLetter } from '.scripts/utils';

(async () => {
    const [nameArg, modeArg] = process.argv.slice(2);
    const force = modeArg === 'force';

    const componentName = getComponentNameOrExit(nameArg);
    const componentDirectoryPath = await createComponentDirectoryOrExit(componentName, force);

    const componentFilePath = path.join(componentDirectoryPath, `${componentName}.tsx`);

    await writeComponentFiles(componentName, componentDirectoryPath, componentFilePath);
    await updatePackageJson(componentName);

    console.info(`\n${componentName} component generated at ${componentFilePath}`);
})();

function getComponentNameOrExit(nameArg: string) {
    if (!nameArg?.trim()) {
        console.error('Please provide a component name.');
        process.exit(1);
    }

    const componentName = capitalizeFirstLetter(nameArg);

    if (!componentName) {
        console.error('Please provide a component name.');
        process.exit(1);
    }

    return componentName;
}

async function createComponentDirectoryOrExit(componentName: string, force: boolean) {
    const componentsDir = getComponentsDir();

    const componentDirectoryPath = path.resolve(componentsDir, componentName);

    const componentFilePath = path.join(componentDirectoryPath, `${componentName}.tsx`);

    try {
        await fs.access(componentFilePath);
        if (!force) {
            console.error(`Component ${componentName} already exists at ${componentFilePath}.`);

            process.exit(1);
        }
        execSync(`rm -rf ${componentDirectoryPath}`, { stdio: 'inherit' });
        return componentDirectoryPath;
    } catch {
        execSync(`mkdir -p ${componentDirectoryPath}`, { stdio: 'inherit' });

        return componentDirectoryPath;
    }
}

async function writeComponentFiles(componentName: string, componentDirectoryPath: string, componentFilePath: string) {
    await generateAndWriteComponentFile(componentName, componentFilePath);

    const componentExampleFilePath = path.join(componentDirectoryPath, `${componentName}Example.tsx`);
    await generateAndWriteExampleFile(componentName, componentExampleFilePath);

    const slug = kebabCase(componentName);
    const componentStyleFilePath = path.join(componentDirectoryPath, `${slug}.scss`);
    await generateAndWriteStylesFile(componentName, componentStyleFilePath);

    const componentTestFilePath = path.join(componentDirectoryPath, `${componentName}.rtl.test.tsx`);
    await generateAndWriteTestFile(componentName, componentTestFilePath);

    await fs.writeFile(path.join(componentDirectoryPath, 'index.tsx'), `export * from './${componentName}';\n`);
}

async function updatePackageJson(componentName: string) {
    const packageJsonData = JSON.parse(await fs.readFile(path.resolve('./package.json'), 'utf-8'));

    // add the component export to package.json
    packageJsonData.exports[`./${componentName}`] = `./dist/components/${componentName}/index.js`;
    packageJsonData.exports[`./${componentName}/*`] = `./dist/components/${componentName}/*.js`;

    // sort the object by keys alphabetically
    packageJsonData.exports = Object.fromEntries(
        Object.entries(packageJsonData.exports).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
    );

    await fs.writeFile(path.resolve('./package.json'), `${JSON.stringify(packageJsonData, null, 4)}\n`);
}
