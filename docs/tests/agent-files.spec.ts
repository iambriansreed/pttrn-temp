// cspell:words llms
import fs from 'fs';
import path from 'path';

import { test, expect } from '@playwright/test';

import { components, gotoUrl } from './utils';

/**
 * The site serves the files coding agents read, rendered at build time from the metadata the MCP server serves:
 *
 * - `/llms.txt` (https://llmstxt.org) and `/DESIGN.md` are the files themselves, not the app shell the server falls back
 *   to for an unknown path, and each lists every Stable component with its import path and a link to its page.
 * - Every docs page llms.txt links to exists, so a link that drifts from the routes fails here instead of showing an
 *   agent the 404 page.
 */
const site = `https://${fs.readFileSync(path.resolve(import.meta.dirname, '../assets/CNAME'), 'utf-8').trim()}`;
const stable = components.filter((component) => component.phase === 'Stable');

const FILES = [
    { file: '/llms.txt', contentType: /^text\/plain/ },
    { file: '/DESIGN.md', contentType: /^text\/markdown/ },
];

for (const { file, contentType } of FILES) {
    test(`${file} is served and lists every Stable component`, async ({ request }) => {
        const response = await request.get(file);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toMatch(contentType);

        const text = await response.text();
        expect(text).toMatch(/^# pttrn/);

        const missing = stable
            .filter(
                ({ name, slug }) =>
                    !text.includes(`[${name}](${site}/${slug})`) || !text.includes(`\`@ptrn/react/${name}\``),
            )
            .map(({ name }) => name);
        expect(missing, 'Stable components without a link and an import path').toEqual([]);
    });
}

test('every docs page llms.txt links to exists', async ({ page, request }) => {
    const text = await (await request.get('/llms.txt')).text();
    const slugs = new Set(components.map((component) => `/${component.slug}`));
    const pages = [...text.matchAll(/\]\((https:\/\/[^/)]+)(\/[^)]*)\)/g)]
        .filter(([, origin, pathName]) => origin === site && !slugs.has(pathName) && !/\.(md|txt)$/.test(pathName))
        .map(([, , pathName]) => pathName);

    expect(pages).toContain('/ai-readiness');

    for (const pathName of pages) {
        await gotoUrl(page, pathName);
        await expect(page.getByText('Page not found'), `${pathName} is a page`).toHaveCount(0);
        await expect(page.locator('[data-main] :is(h1, h2, h3)').first(), `${pathName} has a heading`).toBeVisible();
    }
});
