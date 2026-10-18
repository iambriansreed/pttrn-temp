/**
 * Regenerate package exports.
 *
 * $ npx tsx .scripts/tasks/generate-exports.ts
 */
import fs from 'fs';
import path from 'path';
import util from 'util';

// eslint-disable-next-line no-restricted-imports
import packageData from '../../package.json';

const readDir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = (filePath: string) => util.promisify(fs.readFile)(filePath, 'utf-8');

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

componentExports();
