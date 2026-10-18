/* eslint-disable no-console */
/**
 * Build script for pttrn UI
 *
 * This script compiles TypeScript files, processes CSS files, and prepares the final distribution package.
 *
 * It performs the following tasks:
 *
 * 1. Compiles TypeScript files using `tsc`
 * 2. Processes SASS files using `npm run sass`.
 * 3. Copies the font, token and theme stylesheets from `@ptrn/styles` into dist/styles.
 * 4. Creates importable CSS files for them.
 * 5. Creates importable CSS files for each component.
 * 6. Translates import paths from aliases to relative paths.
 * 7. Moves the temporary build directory to the final distribution directory.
 * 8. Updates the package exports to include component directories.
 *
 * $ npx tsx build.ts
 */
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

import packageData from './package.json';

import { compilerOptions } from './tsconfig.json';

const exec = util.promisify(child_process.exec);
const writeFile = util.promisify(fs.writeFile);
const readDir = util.promisify(fs.readdir);
const readFile = (filePath: string) => util.promisify(fs.readFile)(filePath, 'utf-8');

const STYLES_SOURCE_DIR = path.dirname(import.meta.resolve('@ptrn/styles/package.json').split('file:')[1]);

const distPath = path.resolve('./dist');
const distStylesPath = path.resolve('./dist/styles');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';

async function main() {
    const startTime = Date.now();

    console.log(`${BLUE}Building pttrn UI...${RESET}`);

    await exec(`rm -rf ${distPath} && mkdir -p ${distStylesPath}`);

    await exec('tsc --project ./tsconfig.build.json && npm run sass');

    // copy the font, token and theme stylesheets from @ptrn/styles into dist/styles
    await exec(
        `cp ${path.resolve(STYLES_SOURCE_DIR, 'fonts.css')} ${path.resolve(STYLES_SOURCE_DIR, 'tokens.css')} ${distStylesPath}/`,
    );
    await exec(`cp -R ${path.resolve(STYLES_SOURCE_DIR, 'themes')} ${distStylesPath}/`);

    await Promise.all([fileProcessing(), componentExports()]);

    // copy dist to dist

    const endTime = Date.now();

    console.log(`${GREEN}pttrn UI build completed successfully (${(endTime - startTime) / 1000}s)${RESET}`);
}

main();

async function fileProcessing() {
    const allFiles = await readDir(distPath, { encoding: 'utf-8', recursive: true, withFileTypes: true });

    Promise.all(
        allFiles.map(async (dirent) => {
            if (!dirent.isFile()) return;

            const filePath = path.resolve(dirent.parentPath, dirent.name);

            // make importable .css files
            if (filePath.endsWith('.css')) {
                return createImportableCss(await readFile(filePath), filePath.replace(/\.css$/, '.css.js'));
            }

            // fix import paths in .js files
            if (filePath.endsWith('.js')) {
                let newFileContent = await readFile(filePath);

                // fix import paths for styles
                newFileContent = cssImportsInjected(newFileContent);

                // fix import paths for '@ptrn/styles. The css files are now in the dist/styles directory.
                newFileContent = newFileContent.replaceAll("import '@ptrn/styles/", "import '-/styles/");

                // translate alias imports to relative paths
                newFileContent = aliasToRelative(newFileContent, filePath);

                return writeFile(filePath, newFileContent, 'utf-8');
            }
        }),
    );
}

// Create a mapping of TypeScript alias paths to relative paths
const tsConfigPathsToRelative = Object.fromEntries(
    Object.entries(compilerOptions.paths).map(([aliasPath, relativePaths]) => {
        // Convert the alias path to a relative path
        const relativePath = relativePaths[0].replace(/\/\*$/, '/');
        return [
            aliasPath.replace(/\/\*$/, '/'),
            path.resolve(compilerOptions.baseUrl ?? '.', relativePath.replace('/src/', '/dist/')),
        ];
    }),
);

/**
 * This function converts TypeScript alias paths to relative paths based on the current file's location. It reads the
 * tsConfigPathsToRelative object to find the corresponding relative path for each alias import in the file content.
 */
function aliasToRelative(fileContent: string, filePath: string) {
    const aliasImportMatches = fileContent.matchAll(
        new RegExp(`import (.*)'(${Object.keys(tsConfigPathsToRelative).join('|')})([^']+)';`, 'g'),
    );

    for (const match of aliasImportMatches) {
        const [fullMatch, importedValue, aliasPathMatched, actualImportedFile] = match;

        const relativePath = tsConfigPathsToRelative[aliasPathMatched] || '';
        const relativeFilePath =
            path.relative(path.dirname(filePath), path.resolve(relativePath, actualImportedFile)) || '.';
        const newImport = `import ${importedValue}'${relativeFilePath}';`;

        fileContent = fileContent.replace(fullMatch, newImport);
    }

    return fileContent;
}

function cssImportsInjected(fileContent: string) {
    return fileContent.replace(/import ['"]([^'"]+\/)?([^.]+)\.(s?css)['"];?/g, (_match, importPath = '', name) => {
        const nextImportPath = importPath || '';
        return `import '${nextImportPath}${name}.css.js';`;
    });
}

async function componentExports() {
    const nextExports: Record<string, string> = { ...packageData['static-exports'] };

    await Promise.all(
        (await readDir(path.resolve('./dist/components'), { withFileTypes: true }))
            //
            .map(async (dirent) => {
                //
                if (!dirent.isDirectory() || dirent.name.startsWith('.')) return;

                nextExports[`./${dirent.name}`] = `./dist/components/${dirent.name}/index.js`;
                nextExports[`./${dirent.name}/*`] = `./dist/components/${dirent.name}/*.js`;

                const files = await Promise.all(
                    (await readDir(`${'./dist/components'}/${dirent.name}`))
                        .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
                        .map(async (file) => ({
                            filePath: `${'./dist/components'}/${dirent.name}/${file}`,
                            content: await readFile(`${'./dist/components'}/${dirent.name}/${file}`),
                        })),
                );

                // look for files in each folder with the @export tag and add them to nextExports
                files.forEach(async ({ filePath, content }) => {
                    const nameMatch = content.match(/ \* @name\W([^\W]+)/)?.[1];
                    const exportMatch = content.match(/ \* @export/);

                    if (exportMatch && nameMatch) {
                        nextExports[`./${nameMatch}`] = filePath;
                    }
                });
            }),
    );

    (packageData.exports as Record<string, string>) = Object.fromEntries(
        Object.entries(nextExports).sort(([aKey, aValue], [bKey, bValue]) => {
            if (aKey === bKey) {
                return aValue.localeCompare(bValue);
            }
            return aKey.localeCompare(bKey);
        }),
    ) as Record<string, string>;

    return writeFile(path.resolve('./package.json'), `${JSON.stringify(packageData, null, 4)}\n`, 'utf-8');
}

async function createImportableCss(cssContent: string, destPath: string, id?: string) {
    return await writeFile(
        destPath,
        `/** * This file is generated by the build script.
* Do not edit this file directly. */
const style = document.createElement('style');
style.appendChild(document.createTextNode(\`${cssContent}\`));
document.head.appendChild(style);
${id ? `\ndocument.querySelector('#${id}')?.remove(); style.id = '${id}';` : ''}`,
    );
}
