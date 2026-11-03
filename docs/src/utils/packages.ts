/**
 * The published packages and the versions this build of the site documents, read from each package's package.json when
 * the site is built, with the package's CHANGELOG.md when the release workflow has written one.
 */

const ROOT = '../../../packages/';

const names = import.meta.glob<string>('../../../packages/*/package.json', { eager: true, import: 'name' });
const versions = import.meta.glob<string>('../../../packages/*/package.json', { eager: true, import: 'version' });
const changelogs = import.meta.glob<string>('../../../packages/*/CHANGELOG.md', {
    eager: true,
    query: '?raw',
    import: 'default',
});

/** The order packages are listed in: the React library first, then what it builds on. */
const ORDER = ['react', 'web', 'styles', 'icons', 'mcp'];

export type PackageRelease = {
    /** The folder under `packages/`: `react`. */
    folder: string;
    /** The npm name: `@ptrn/react`. */
    name: string;
    version: string;
    /** The package's CHANGELOG.md, once a release has written one. */
    changelog?: string;
};

export const PACKAGES: PackageRelease[] = Object.keys(names)
    .map((file) => {
        const folder = file.slice(ROOT.length).split('/')[0];
        return {
            folder,
            name: names[file],
            version: versions[file],
            changelog: changelogs[`${ROOT}${folder}/CHANGELOG.md`],
        };
    })
    .sort((a, b) => {
        const rank = (folder: string) => (ORDER.includes(folder) ? ORDER.indexOf(folder) : ORDER.length);
        return rank(a.folder) - rank(b.folder) || a.folder.localeCompare(b.folder);
    });

/** The package the site header names: the site documents `@ptrn/react` first. */
export const DOCUMENTED_PACKAGE = PACKAGES.find((pkg) => pkg.folder === 'react') ?? PACKAGES[0];
