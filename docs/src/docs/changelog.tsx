import { Markdown } from 'components/Markdown';
import { Page } from 'components/Page';
import { PACKAGES } from 'src/utils/packages';

const versionTable = [
    '| Package | Version | Changelog |',
    '| --- | --- | --- |',
    ...PACKAGES.map(
        (pkg) =>
            `| \`${pkg.name}\` | ${pkg.version} | ${pkg.changelog ? `[Notes](#${pkg.folder})` : 'No release yet'} |`,
    ),
].join('\n');

const intro = `# Changelog

This site was built from these package versions. It is rebuilt from \`main\` on every push, so between releases it can
show changes that are not on npm yet.

${versionTable}

${
    PACKAGES.some((pkg) => pkg.changelog)
        ? 'Each package keeps its own changelog, written by the release workflow from the changesets merged since the last release.'
        : 'No package has been released yet. When the release workflow\'s "Version Packages" pull request is merged, it writes each package\'s changelog from the changesets merged since, and the notes appear here.'
}
`;

/** A changelog's headings one level down, so each package's title sits under the page's. */
const demoteHeadings = (markdown: string) => markdown.replace(/^(#{1,5}) /gm, '#$1 ');

/** The package versions the site documents, and each package's changelog once a release has written one. */
export function Changelog() {
    return (
        <Page>
            <Markdown md={intro} />
            {PACKAGES.filter((pkg) => pkg.changelog).map((pkg) => (
                <section id={pkg.folder} key={pkg.folder} style={{ marginTop: 'var(--usa-spacing-5)' }}>
                    <Markdown idPrefix={pkg.folder} md={demoteHeadings(pkg.changelog!)} />
                </section>
            ))}
        </Page>
    );
}
