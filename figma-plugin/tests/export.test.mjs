import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { fixture, loadPlugin, renameCollection, root } from './figma.mjs';
import { declarations, tokensOf } from './helpers.mjs';

const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const file = (result, name) => {
    const found = result.files.find((f) => f.name === name);
    assert.ok(found, `${name} is in the export`);
    return found.css;
};
const tokenFile = (result, name) => {
    const found = result.tokenFiles.find((f) => f.name === `tokens/${name}`);
    assert.ok(found, `tokens/${name} is in the export`);
    return JSON.parse(found.text);
};

describe('exporting the fixture with the kit theme collection', () => {
    let plugin;
    let result;
    before(async () => {
        plugin = loadPlugin();
        result = await plugin.exportTokens();
    });

    it('detects the USWDS Theme collection and splits its modes into theme files', () => {
        assert.equal(result.themeCollection, plugin.collectionId('USWDS Theme'));
        assert.deepEqual(
            result.files.map((f) => f.name),
            ['tokens.css', 'themes/default.css', 'themes/project-theme.css', 'themes/project-theme-dark.css'],
        );
        assert.equal(result.themes, 3);
        assert.equal(result.modeAttributes, 2);
        assert.deepEqual(
            result.themeOptions.map((o) => o.name),
            ['USWDS Theme', 'Density'],
        );
        assert.equal(result.skipped.length, 0);
    });

    it('declares primitives in :root and keeps the theme out of tokens.css', () => {
        const css = file(result, 'tokens.css');
        const blocks = declarations(css);
        assert.equal(blocks[':root']['--usa-color-red-50'], 'rgb(216 57 51)');
        assert.equal(blocks[':root']['--usa-color-black-transparent-10'], 'rgb(0 0 0 / 10%)');
        assert.equal(blocks[':root']['--usa-spacing-1'], '8px');
        assert.equal(blocks[':root']['--usa-font-weight-bold'], '700', 'a FONT_WEIGHT float stays unitless');
        assert.equal(blocks[':root']['--usa-font-family-sans'], '"Public Sans"');
        assert.equal(
            blocks[':root']['--spacing-usa-spacing-1'],
            '8px',
            'a clashing name takes its collection as prefix',
        );
        assert.equal(blocks[':root']['--brand-primary'], 'var(--usa-color-blue-60v)');
        assert.equal(blocks[':root']['--shadow-1'], '0px 1px 2px 0px rgb(0 0 0 / 10%)');
        assert.match(blocks[':root']['--brand-gradient'], /^linear-gradient\(/);
        assert.equal(blocks[':root']['--heading-xl'], 'normal 700 32px/40px "Public Sans"');
        assert.ok(!/\[data-uswds-theme="[^"]+"\] \{/.test(css), 'no theme block in tokens.css');
        assert.ok(!css.includes('--theme-color-ink:'), 'theme variables are in the theme files only');
    });

    it('scopes the other multi-mode collection with its own attribute and redeclares what aliases it', () => {
        const blocks = declarations(file(result, 'tokens.css'));
        assert.deepEqual(blocks[':root, [data-density="comfortable"]'], { '--density-gap': '16px' });
        assert.deepEqual(blocks['[data-density="comfortable"]'], { '--general-row-gap': 'var(--density-gap)' });
        assert.deepEqual(blocks['[data-density="compact"]'], {
            '--density-gap': '8px',
            '--general-row-gap': 'var(--density-gap)',
        });
    });

    it('writes one complete theme file per mode, with the aliases from other collections', () => {
        const dark = declarations(file(result, 'themes/project-theme-dark.css'));
        const selector = ':where(:root), [data-uswds-theme="project-theme-dark"]';
        assert.deepEqual(dark[selector], {
            '--theme-color-ink': 'var(--usa-color-white)',
            '--theme-color-primary': 'var(--usa-color-blue-60v)',
            '--theme-spacing-gap': 'var(--usa-spacing-05)',
            '--theme-focus-style': '"outline"',
            '--general-border-color': 'var(--theme-color-ink)',
        });
        const light = declarations(file(result, 'themes/default.css'));
        assert.equal(
            light[':where(:root), [data-uswds-theme="default"]']['--theme-color-ink'],
            'var(--usa-color-gray-90)',
        );
        assert.match(
            file(result, 'themes/default.css'),
            /The "default" mode of "USWDS Theme" \(its default\), complete\./,
        );
    });

    it('writes a manifest with provenance and every collection', () => {
        const manifest = tokenFile(result, 'manifest.json');
        assert.equal(manifest.source.figmaFile, fixture.name);
        assert.equal(manifest.source.exporter, 'pttrn Export Tokens');
        assert.equal(manifest.source.pluginVersion, version);
        assert.match(manifest.source.exportedAt, /^[A-Z][a-z]+ \d{1,2}, \d{4} at /);

        assert.deepEqual(
            manifest.collections.map((c) => c.slug),
            [
                'color',
                'spacing',
                'spacing-2',
                'font',
                'uswds-theme',
                'density',
                'general',
                'paint-styles',
                'effect-styles',
                'text-styles',
            ],
        );
        const theme = manifest.collections.find((c) => c.slug === 'uswds-theme');
        assert.deepEqual(theme, {
            name: 'USWDS Theme',
            slug: 'uswds-theme',
            kind: 'variables',
            attribute: 'data-uswds-theme',
            modes: ['default', 'project-theme', 'project-theme-dark'],
            defaultMode: 'default',
            theme: true,
            files: {
                default: 'uswds-theme/default.tokens.json',
                'project-theme': 'uswds-theme/project-theme.tokens.json',
                'project-theme-dark': 'uswds-theme/project-theme-dark.tokens.json',
            },
        });
        const density = manifest.collections.find((c) => c.slug === 'density');
        assert.equal(density.attribute, 'data-density');
        assert.equal(density.theme, undefined);
        assert.equal(manifest.collections.find((c) => c.slug === 'paint-styles').kind, 'styles');

        const listed = manifest.collections.flatMap((c) => (c.file ? [c.file] : Object.values(c.files)));
        for (const name of listed) tokenFile(result, name);
        assert.equal(result.tokenFiles.length, listed.length + 1);
    });

    it('writes DTCG tokens with types, aliases and the pttrn extension', () => {
        const color = tokensOf(tokenFile(result, 'color.tokens.json'));
        assert.deepEqual(color['color.usa.color.red.50'], {
            $type: 'color',
            $value: { colorSpace: 'srgb', components: [0.8471, 0.2235, 0.2], alpha: 1, hex: '#d83933' },
            $extensions: { pttrn: { css: '--usa-color-red-50', figma: '!-usa/color/red/50' } },
        });
        assert.equal(color['color.usa.color.black-transparent.10'].$value.alpha, 0.1);

        const spacing = tokensOf(tokenFile(result, 'spacing.tokens.json'));
        assert.deepEqual(spacing['spacing.usa.spacing.1'].$value, { value: 8, unit: 'px' });
        assert.equal(spacing['spacing.usa.spacing.1'].$type, 'dimension');
        const spacing2 = tokensOf(tokenFile(result, 'spacing-2.tokens.json'));
        assert.equal(spacing2['spacing-2.usa.spacing.1'].$extensions.pttrn.css, '--spacing-usa-spacing-1');

        const font = tokensOf(tokenFile(result, 'font.tokens.json'));
        assert.deepEqual(font['font.usa.font-weight.bold'], {
            $type: 'number',
            $value: 700,
            $extensions: { pttrn: { css: '--usa-font-weight-bold', figma: '!-usa/font-weight/bold' } },
        });
        assert.equal(font['font.usa.font-family.sans'].$type, 'fontFamily');
        assert.equal(font['font.usa.font-family.sans'].$value, 'Public Sans');

        const dark = tokensOf(tokenFile(result, 'uswds-theme/project-theme-dark.tokens.json'));
        assert.deepEqual(dark['uswds-theme.theme.color.ink'].$value, '{color.usa.color.white}');
        assert.equal(dark['uswds-theme.theme.color.ink'].$type, undefined, 'an alias carries no type of its own');
        assert.equal(dark['uswds-theme.theme.spacing.gap'].$value, '{spacing.usa.spacing.05}');
        assert.deepEqual(dark['uswds-theme.theme.focus.style'], {
            $type: 'string',
            $value: 'outline',
            $extensions: { pttrn: { css: '--theme-focus-style', figma: '#-theme/focus/style' } },
        });
        const light = tokensOf(tokenFile(result, 'uswds-theme/default.tokens.json'));
        assert.equal(light['uswds-theme.theme.color.ink'].$value, '{color.usa.color.gray.90}');

        const general = tokensOf(tokenFile(result, 'general.tokens.json'));
        assert.equal(general['general.general.border.color'].$value, '{uswds-theme.theme.color.ink}');
        assert.equal(general['general.general.row.gap'].$value, '{density.density.gap}');

        const paints = tokensOf(tokenFile(result, 'paint-styles.tokens.json'));
        assert.equal(paints['paint-styles.brand.primary'].$value, '{color.usa.color.blue.60v}');
        assert.equal(paints['paint-styles.brand.gradient'], undefined, 'a gradient has no DTCG form');

        const effects = tokensOf(tokenFile(result, 'effect-styles.tokens.json'));
        assert.deepEqual(effects['effect-styles.shadow.1'].$value, {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1, hex: '#000000' },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 1, unit: 'px' },
            blur: { value: 2, unit: 'px' },
            spread: { value: 0, unit: 'px' },
        });
        assert.equal(effects['effect-styles.shadow.1'].$type, 'shadow');

        const text = tokensOf(tokenFile(result, 'text-styles.tokens.json'));
        assert.equal(text['text-styles.heading.xl-font-family'].$type, 'fontFamily');
        assert.deepEqual(text['text-styles.heading.xl-font-size'].$value, { value: 32, unit: 'px' });
        assert.equal(text['text-styles.heading.xl-font-weight'].$value, 700);
        assert.deepEqual(text['text-styles.body-letter-spacing'].$value, { value: 0, unit: 'px' });
    });

    it('lists the properties that have no DTCG form in the stylesheet header', () => {
        const css = file(result, 'tokens.css');
        const header = css.slice(0, css.indexOf('*/'));
        assert.match(header, /properties have no DTCG form and are in the stylesheets only:/);
        for (const name of [
            '--brand-gradient',
            '--heading-xl',
            '--heading-xl-letter-spacing',
            '--body',
            '--body-line-height',
        ]) {
            assert.ok(header.includes(name), `${name} is listed as CSS-only`);
        }
        assert.equal(result.properties - result.tokens, 5);
    });

    it('describes the modes and the theme files in the header', () => {
        const css = file(result, 'tokens.css');
        assert.match(css, /\[data-uswds-theme\]\s+default \(default\), project-theme, project-theme-dark/);
        assert.match(css, /\[data-density\]\s+comfortable \(default\), compact/);
        assert.match(css, /themes\/project-theme-dark\.css/);
        assert.match(css, /Figma file: Fixture Kit/);
    });

    it('ends with the text style classes and element defaults', () => {
        const css = file(result, 'tokens.css');
        const indent = '\n    ';
        assert.ok(
            css.includes(
                `.heading-xl {${indent}font: var(--heading-xl);${indent}letter-spacing: var(--heading-xl-letter-spacing);\n}`,
            ),
        );
        assert.ok(css.includes(`\np {${indent}font: var(--body);`));
    });
});

describe('choosing the theme collection', () => {
    it('uses the chosen collection, remembers it in the file, and honors "none"', async () => {
        const plugin = loadPlugin();
        const density = plugin.collectionId('Density');

        const chosen = await plugin.exportTokens({ themeCollection: density });
        assert.equal(chosen.themeCollection, density);
        assert.deepEqual(
            chosen.files.map((f) => f.name),
            ['tokens.css', 'themes/comfortable.css', 'themes/compact.css'],
        );
        assert.equal(chosen.themes, 2);
        assert.equal(plugin.pluginData.themeCollection, density);
        const blocks = declarations(chosen.files.find((f) => f.name === 'tokens.css').css);
        assert.ok(blocks[':root, [data-uswds-theme="default"]'], 'the kit theme stays in tokens.css as mode blocks');
        assert.equal(blocks['[data-uswds-theme="project-theme-dark"]']['--theme-color-ink'], 'var(--usa-color-white)');
        const manifest = JSON.parse(chosen.tokenFiles.find((f) => f.name === 'tokens/manifest.json').text);
        assert.equal(manifest.collections.find((c) => c.slug === 'density').theme, true);
        assert.equal(manifest.collections.find((c) => c.slug === 'uswds-theme').theme, undefined);

        const remembered = await plugin.exportTokens();
        assert.equal(remembered.themeCollection, density, 'an export without a choice uses the saved one');

        const none = await plugin.exportTokens({ themeCollection: null });
        assert.equal(none.themeCollection, null);
        assert.deepEqual(none.files, []);
        assert.equal(none.themes, 0);
        assert.equal(plugin.pluginData.themeCollection, 'none');
        assert.ok(declarations(none.css)['[data-density="compact"]'], 'every mode stays in the single stylesheet');

        const still = await plugin.exportTokens();
        assert.equal(still.themeCollection, null, '"none" is remembered too');
    });

    it('falls back to a collection with "theme" in its name, then to none', async () => {
        const plugin = loadPlugin(renameCollection(fixture, 'USWDS Theme', 'Brand theme'));
        const result = await plugin.exportTokens();
        assert.equal(result.themeCollection, plugin.collectionId('Brand theme'));
        assert.deepEqual(
            result.files.map((f) => f.name),
            ['tokens.css', 'themes/default.css', 'themes/project-theme.css', 'themes/project-theme-dark.css'],
        );
        assert.match(result.files[0].css, /The modes of "Brand theme" \(\[data-brand-theme\]\)/);

        const none = await loadPlugin(renameCollection(fixture, 'USWDS Theme', 'Palette')).exportTokens();
        assert.equal(none.themeCollection, null);
        assert.deepEqual(none.files, []);
    });

    it('ignores an id that is not a multi-mode collection', async () => {
        const plugin = loadPlugin();
        const result = await plugin.exportTokens({ themeCollection: plugin.collectionId('Color') });
        assert.equal(result.themeCollection, null);
        assert.equal(plugin.pluginData.themeCollection, 'none');
    });
});

describe('a file without variables or styles', () => {
    it('reports an error instead of an empty export', async () => {
        const plugin = loadPlugin({ name: 'Empty', collections: [] });
        await assert.rejects(plugin.exportTokens(), /no local variables or styles/);
    });
});
