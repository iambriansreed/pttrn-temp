import path from 'node:path';
import type { Page } from '@playwright/test';

export const BUNDLE = path.resolve(import.meta.dirname, '../dist/cdn/pttrn-web.min.js');
const TOKENS = ['tokens.css', 'themes/default.css'].map((file) =>
    path.resolve(import.meta.dirname, '../../styles', file),
);

/**
 * Renders `html` in a blank page with the design tokens and the built CDN bundle loaded, the way a consumer with no
 * bundler would use the package, and waits until every `pttrn-*` tag in `html` is defined. Tests run against `dist`, so
 * run `npm run build` first.
 */
export async function mount(page: Page, html: string) {
    const tags = [...new Set(html.match(/(?<=<)pttrn-[a-z0-9-]+/g) ?? [])];
    await page.setContent(html);
    for (const file of TOKENS) await page.addStyleTag({ path: file });
    await page.addScriptTag({ path: BUNDLE, type: 'module' });
    await page.evaluate((names) => Promise.all(names.map((name) => customElements.whenDefined(name))), tags);
}
