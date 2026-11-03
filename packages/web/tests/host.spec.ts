import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { mount } from './mount';

/** Every element in the built Custom Elements Manifest, so a new element is covered without being listed here. */
const manifest = JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, '../dist/custom-elements.json'), 'utf-8'),
) as { modules: { declarations?: { tagName?: string }[] }[] };
const TAGS = manifest.modules.flatMap((module) => module.declarations ?? []).flatMap(({ tagName }) => tagName ?? []);

test.describe('every element', () => {
    test('the manifest lists the elements', () => {
        expect(TAGS.length).toBeGreaterThan(0);
    });

    for (const tag of TAGS) {
        test(`${tag} is hidden by the hidden attribute`, async ({ page }) => {
            await mount(page, `<${tag} hidden>Content</${tag}>`);
            await expect(page.locator(tag)).toHaveCSS('display', 'none');
        });
    }
});
