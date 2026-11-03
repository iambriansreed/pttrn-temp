import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { mount } from './mount';

type Attribute = { name: string; default?: string };

/** Every element in the built Custom Elements Manifest, so a new element is covered without being listed here. */
const manifest = JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, '../dist/custom-elements.json'), 'utf-8'),
) as { modules: { declarations?: { tagName?: string; attributes?: Attribute[] }[] }[] };
const ELEMENTS = manifest.modules
    .flatMap((module) => module.declarations ?? [])
    .flatMap(({ tagName, attributes = [] }) => (tagName ? [{ tag: tagName, attributes }] : []));

/** The attribute value a manifest default stands for: a quoted string or a number. Booleans and others have none. */
const literal = (value?: string) =>
    value && /^('.*'|-?\d+(\.\d+)?)$/.test(value) ? value.replace(/^'|'$/g, '') : null;

/** The rendered shadow DOM, without Lit's markers, to compare two states of an element. */
const shadow = (page: Page, tag: string) =>
    page
        .locator(tag)
        .first()
        .evaluate((element) => element.shadowRoot?.innerHTML.replace(/<!--[^>]*-->/g, '') ?? '');

test.describe('every element', () => {
    test('the manifest lists the elements', () => {
        expect(ELEMENTS.length).toBeGreaterThan(0);
    });

    for (const { tag, attributes } of ELEMENTS) {
        test(`${tag} is hidden by the hidden attribute`, async ({ page }) => {
            await mount(page, `<${tag} hidden>Content</${tag}>`);
            await expect(page.locator(tag)).toHaveCSS('display', 'none');
        });

        // Removing an attribute sets a Lit property to null, not back to its default; the element must render the
        // default all the same, as React does when a prop goes back to undefined (the docs demos do exactly this).
        const withDefaults = attributes.filter((attribute) => literal(attribute.default) !== null);
        if (withDefaults.length) {
            test(`${tag} renders its defaults again when an attribute is removed`, async ({ page }) => {
                await mount(page, `<${tag}>Content</${tag}>`);
                const initial = await shadow(page, tag);
                for (const attribute of withDefaults) {
                    await page
                        .locator(tag)
                        .first()
                        .evaluate(
                            (element, [name, value]) => {
                                element.setAttribute(name, value);
                                element.removeAttribute(name);
                            },
                            [attribute.name, literal(attribute.default)!],
                        );
                    await expect.poll(() => shadow(page, tag), `after removing ${attribute.name}`).toBe(initial);
                }
            });
        }
    }
});
