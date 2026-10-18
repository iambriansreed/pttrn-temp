/**
 * The token files the plugin exports are what @ptrn/styles builds its stylesheets from, so the two must agree: building
 * the plugin's token files with the package's build must reproduce every declaration of the plugin's own stylesheets,
 * except the properties the plugin lists as having no DTCG form.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { loadPlugin, root } from './figma.mjs';
import { declarations } from './helpers.mjs';

const stylesBuild = path.resolve(root, '../packages/styles/build.ts');
const tsx = path.resolve(root, '../node_modules/tsx/dist/cli.mjs');

describe('building the exported token files with @ptrn/styles', () => {
    let dir;
    let result;
    before(async () => {
        dir = mkdtempSync(path.join(tmpdir(), 'pttrn-plugin-round-trip-'));
        result = await loadPlugin().exportTokens();
        for (const { name, text } of result.tokenFiles) {
            const target = path.join(dir, name);
            mkdirSync(path.dirname(target), { recursive: true });
            writeFileSync(target, text);
        }
        execFileSync(
            process.execPath,
            [tsx, stylesBuild, '--tokens', path.join(dir, 'tokens'), '--out', path.join(dir, 'out')],
            {
                stdio: 'pipe',
            },
        );
    });
    after(() => rmSync(dir, { recursive: true, force: true }));

    it('reproduces the plugin stylesheets from the token files', () => {
        const header = result.files[0].css.slice(0, result.files[0].css.indexOf('*/'));
        const cssOnly = new Set(header.match(/--[a-z0-9-]+/g));
        assert.ok(cssOnly.size > 0, 'the fixture has properties with no DTCG form');

        for (const { name, css } of result.files) {
            const built = declarations(readFileSync(path.join(dir, 'out', name), 'utf8'));
            const exported = declarations(css);
            for (const selector of Object.keys(exported)) {
                if (!selector.startsWith(':') && !selector.startsWith('[')) continue; // text style classes and elements
                for (const property of Object.keys(exported[selector])) {
                    if (cssOnly.has(property)) delete exported[selector][property];
                }
                if (Object.keys(exported[selector]).length === 0) delete exported[selector];
            }
            for (const selector of Object.keys(exported)) {
                if (!selector.startsWith(':') && !selector.startsWith('[')) delete exported[selector];
            }
            assert.deepEqual(built, exported, `${name} builds to the same declarations`);
        }
    });

    it('lists the theme files and the typed catalog among the built files', () => {
        const catalog = readFileSync(path.join(dir, 'out', 'tokens.js'), 'utf8');
        assert.match(catalog, /"--theme-color-ink": \{/);
        assert.match(catalog, /"project-theme-dark": "var\(--usa-color-white\)"/);
        assert.match(readFileSync(path.join(dir, 'out', 'tokens.d.ts'), 'utf8'), /\| "--usa-color-red-50"/);
    });
});
