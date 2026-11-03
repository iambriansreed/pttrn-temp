import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/FileUploadItem/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** The item with the React suite's Subject props, each test overriding what it changes. */
const item = (attributes: Record<string, string | number | undefined> = {}) => {
    const all = {
        'file-name': 'holiday-photo.png',
        'file-size': 1.2,
        id: 'photo',
        progress: 40,
        status: 'uploading',
        ...attributes,
    };
    const list = Object.entries(all)
        .filter(([, value]) => value !== undefined)
        .map(([name, value]) => `${name}="${value}"`);
    return `<div style="width: 600px"><pttrn-file-upload-item ${list.join(' ')}></pttrn-file-upload-item></div>`;
};

/** Mirrors the presets in `packages/react/src/components/FileUploadItem/FileUploadItemExample.tsx`. */
const PRESETS = {
    'long file name': item({
        'file-name': 'I-think-this-is-a-long-file-name.txt',
        status: 'uploading',
        'cancel-button-label': 'Close',
        'file-size': 10,
        id: '10',
        progress: undefined,
    }),
    'state: uploading': item({
        'file-name': 'basic-file.png',
        status: 'uploading',
        'file-size': 1.2,
        'cancel-button-label': 'Cancel',
        id: '1.2',
        progress: undefined,
    }),
    'state: success': item({
        'file-name': 'success-story.pdf',
        status: 'complete',
        'cancel-button-label': 'Bye',
        'file-size': 42,
        id: '42',
        progress: 100,
    }),
    'state: failed': item({
        'file-name': 'file-name.txt',
        status: 'error',
        'error-message': 'File too large. Please upload a smaller file.',
        'cancel-button-label': 'Escape',
        'file-size': 10000000,
        id: '10000000',
        progress: undefined,
    }),
};

const host = (page: Page) => page.locator('pttrn-file-upload-item');
const details = (page: Page) => host(page).locator('[data-file-details]');
// The button names its file, after the visible tooltip text.
const cancelButton = (page: Page, label = 'Cancel') =>
    page.getByRole('button', { name: `${label} holiday-photo.png`, exact: true });
const progressbar = (page: Page, name: string) => page.getByRole('progressbar', { name, exact: true });
const tooltip = (page: Page) => page.getByRole('tooltip');
const set = (page: Page, attributes: Record<string, string | null>) =>
    host(page).evaluate((el, attrs) => {
        for (const [name, value] of Object.entries(attrs)) {
            if (value === null) el.removeAttribute(name);
            else el.setAttribute(name, value);
        }
    }, attributes);
/** Collects pttrn-cancel details on the window. */
const listen = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { cancels: unknown[] }).cancels = [];
        document.addEventListener('pttrn-cancel', (event) =>
            (window as unknown as { cancels: unknown[] }).cancels.push((event as CustomEvent).detail),
        );
    });
const cancels = (page: Page) => page.evaluate(() => (window as unknown as { cancels: unknown[] }).cancels);

test.describe('pttrn-file-upload-item', () => {
    test('a cut-off name gets a tooltip with the full name', async ({ page }) => {
        await mount(page, item({ 'file-name': `${'very-'.repeat(30)}long.png` }));
        const name = host(page).locator('[data-file-name]');
        await expect(name).toHaveAttribute('role', 'note');
        await name.hover();
        await expect(tooltip(page)).toHaveText(`${'very-'.repeat(30)}long.png`);
        await expect(page.getByRole('note')).toHaveAccessibleName(`${'very-'.repeat(30)}long.png`);

        await set(page, { 'file-name': 'short.png' });
        await expect(name).not.toHaveAttribute('role');
    });

    test('the tooltip sits above the button and hides on blur', async ({ page }) => {
        await mount(page, `<div style="padding-top: 100px">${item()}</div>`);
        await cancelButton(page).focus();
        await expect(tooltip(page)).toBeVisible();
        const tip = (await tooltip(page).boundingBox())!;
        const button = (await cancelButton(page).boundingBox())!;
        expect(tip.y + tip.height).toBeLessThanOrEqual(button.y);
        expect(Math.abs(tip.x + tip.width / 2 - (button.x + button.width / 2))).toBeLessThan(1);

        await cancelButton(page).blur();
        await expect(tooltip(page)).toBeHidden();
    });

    test('reflects status', async ({ page }) => {
        await mount(page, item());
        await expect(host(page)).toHaveAttribute('status', 'uploading');
    });
});

describeBehaviors(spec, {
    'renders-file': async ({ page }) => {
        await mount(page, item());

        const name = host(page).locator('[data-file-name]');
        await expect(name).toHaveText('holiday-photo.png');
        await expect(name).toHaveAttribute('data-truncated');
        await expect(details(page)).toHaveText('1.2 MB • uploading');
        await expect(host(page).locator('[data-row]').getByRole('button')).toHaveAccessibleName(
            'Cancel holiday-photo.png',
        );
        await expect(host(page).locator('[data-status]').getByRole('progressbar')).toHaveAccessibleName('40%');
    },
    'formats-size': async ({ page }) => {
        await mount(page, item({ 'file-size': 0.5, status: undefined }));
        await expect(details(page)).toHaveText('512 KB');

        await set(page, { 'file-size': '1.43', status: 'complete' });
        await expect(details(page)).toHaveText('1.43 MB • complete');

        await set(page, { 'file-size': '1536', status: 'uploading' });
        await expect(details(page)).toHaveText('1.5 GB • uploading');

        // Rounded up, not off: 1.001 MB reads 1.01 MB.
        await set(page, { 'file-size': '1.001' });
        await expect(details(page)).toHaveText('1.01 MB • uploading');

        await set(page, { 'file-size': '0' });
        await expect(details(page)).toHaveText('Unknown size • uploading');
        await set(page, { 'file-size': null });
        await expect(details(page)).toHaveText('Unknown size • uploading');
    },
    progress: async ({ page }) => {
        await mount(page, item({ progress: 42.4 }));
        await expect(progressbar(page, '42%')).toHaveAttribute('aria-valuenow', '42');
        await expect(progressbar(page, '42%')).toHaveAttribute('aria-busy', 'true');
        await expect(host(page).locator('[data-progress-bar]')).toHaveAttribute('data-align', 'left');
        await expect(page.getByRole('alert')).toHaveCount(0);

        await set(page, { progress: '100', status: 'complete' });
        await expect(progressbar(page, '100%')).toHaveAttribute('aria-valuenow', '100');
        await expect(progressbar(page, '100%')).toHaveAttribute('aria-busy', 'false');

        await set(page, { progress: null });
        await expect(progressbar(page, '0%')).toHaveAttribute('aria-valuenow', '0');

        await set(page, { progress: '150' });
        await expect(progressbar(page, '100%')).toHaveAttribute('aria-valuenow', '100');
        await set(page, { progress: '-5' });
        await expect(progressbar(page, '0%')).toHaveAttribute('aria-valuenow', '0');
    },
    'error-alert': async ({ page }) => {
        await mount(page, item({ 'error-message': 'File too large.', status: 'error' }));
        const alert = page.getByRole('alert');
        await expect(alert).toHaveText('File too large.');
        await expect(alert).toHaveAttribute('data-variant', 'error');
        await expect(host(page).locator('[data-status] [role="alert"]')).toHaveCount(1);
        await expect(page.getByRole('progressbar')).toHaveCount(0);
        await expect(details(page)).toHaveText('1.2 MB • error');

        await set(page, { 'error-message': null });
        await expect(page.getByRole('alert')).toHaveText('There was an error uploading the file. Please try again.');
    },
    cancel: async ({ page }) => {
        await mount(page, item());
        await listen(page);

        const button = cancelButton(page);
        await expect(button).toHaveAttribute('type', 'button');
        await expect(button).toHaveAttribute('data-variant', 'tertiary');
        await expect(button).toHaveAttribute('data-size', 'large');
        await expect(button.locator('[data-button-label]')).toHaveCount(0);

        await button.click();
        expect(await cancels(page)).toEqual([{ fileName: 'holiday-photo.png' }]);
        await expect(tooltip(page)).toBeVisible();
    },
    'cancel-label': async ({ page }) => {
        await mount(page, item({ 'cancel-button-label': 'Remove' }));
        await expect(page.getByRole('button', { name: /^Cancel/ })).toHaveCount(0);
        const button = cancelButton(page, 'Remove');
        await button.hover();
        await expect(tooltip(page)).toHaveText('Remove');
        // The name comes from aria-label, so the tooltip is not also the label.
        await expect(button).not.toHaveAttribute('aria-labelledby');

        await set(page, { 'cancel-button-label': '' });
        await expect(cancelButton(page, 'Cancel')).toBeVisible();
        await expect(tooltip(page)).toHaveText('Cancel');
    },
    keyboard: async ({ page }) => {
        await mount(page, item());
        await listen(page);

        await page.keyboard.press('Tab');
        await expect(cancelButton(page)).toBeFocused();
        await expect(tooltip(page)).toBeVisible();
        await page.keyboard.press('Enter');
        expect(await cancels(page)).toHaveLength(1);
        await page.keyboard.press('Space');
        expect(await cancels(page)).toEqual([{ fileName: 'holiday-photo.png' }, { fileName: 'holiday-photo.png' }]);

        // The button is the only stop.
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    },
    'icon-decorative': async ({ page }) => {
        await mount(page, item());
        await expect(host(page).locator('[data-icon] svg')).toHaveAttribute('aria-hidden', 'true');
        expect(
            await cancelButton(page).evaluate(
                (button) => !!button.querySelector('svg')?.closest('[aria-hidden="true"]'),
            ),
        ).toBe(true);

        await set(page, { status: 'error' });
        await expect(page.getByRole('alert')).toBeVisible();
        const hidden = await host(page).evaluate((el) =>
            [...el.shadowRoot!.querySelectorAll('svg')].map((svg) => !!svg.closest('[aria-hidden="true"]')),
        );
        expect(hidden).toEqual([true, true, true]);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-file-upload-item').analyze();
            expect(results.violations).toEqual([]);
        }
        // With the tooltip open, too.
        await mount(page, PRESETS['state: uploading']);
        await page.getByRole('button').focus();
        const results = await new AxeBuilder({ page }).include('pttrn-file-upload-item').analyze();
        expect(results.violations).toEqual([]);
    },
});
