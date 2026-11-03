import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Modal/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const modal = (attributes = '', content = 'Example Modal') =>
    `<button type="button" onclick="document.querySelector('pttrn-modal').open = true">Open</button>
    <pttrn-modal header="Example header" description="Example description" ${attributes}>${content}</pttrn-modal>`;

/** Mirrors the presets in `packages/react/src/components/Modal/ModalExample.tsx`. */
const PRESETS = {
    'Modal (confirmation)': modal(
        'open action-label="Call to Action" cancel-button="Cancel"',
        '<p>This is a confirmation modal. It has a call to action and a cancel button.</p>',
    ),
    'Modal (scrolling)': modal(
        'open',
        `<div style="display: flex; flex-direction: column"><p>This is a demo of a scrolling modal.</p>${Array.from(
            { length: 30 },
            (_, index) => `<pttrn-list-item label="Option ${index + 1}"></pttrn-list-item>`,
        ).join('')}</div>`,
    ),
};

/** Records `pttrn-close` reasons and `pttrn-action` events on the page. */
const record = (page: Page) =>
    page.evaluate(() => {
        const log: string[] = [];
        (window as unknown as { log: string[] }).log = log;
        document.addEventListener('pttrn-close', (event) => log.push(`close:${(event as CustomEvent).detail.reason}`));
        document.addEventListener('pttrn-action', () => log.push('action'));
    });
const logged = (page: Page) => page.evaluate(() => (window as unknown as { log: string[] }).log);
const dialog = (page: Page) => page.getByRole('dialog');

test.describe('pttrn-modal', () => {
    test('a long content scrolls inside the modal, which stays within the screen', async ({ page }) => {
        await mount(page, `<!doctype html>${PRESETS['Modal (scrolling)']}`);
        const box = await page.locator('pttrn-modal pttrn-dialog [data-dialog-box]').boundingBox();
        expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
        const main = page.locator('pttrn-modal [data-modal-main]');
        expect(await main.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    });

    test('the footer puts the call to action last in a row, the cancel button before it', async ({ page }) => {
        await mount(page, PRESETS['Modal (confirmation)']);
        const [action, cancel] = await Promise.all([
            page.getByRole('button', { name: 'Call to Action' }).boundingBox(),
            page.getByRole('button', { name: 'Cancel' }).boundingBox(),
        ]);
        expect(action!.x).toBeGreaterThan(cancel!.x);
        expect(action!.y).toBe(cancel!.y);
    });

    test('closing returns focus to the opener', async ({ page }) => {
        await mount(page, modal());
        await page.getByRole('button', { name: 'Open' }).click();
        await expect(dialog(page)).toBeVisible();
        await page.getByRole('button', { name: 'close' }).click();
        await expect(dialog(page)).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Open' })).toBeFocused();
    });
});

describeBehaviors(spec, {
    'closed-by-default': async ({ page }) => {
        await mount(page, modal());
        await expect(dialog(page)).toHaveCount(0);
        await expect(page.getByText('Example Modal')).toBeHidden();
    },
    'header-and-description': async ({ page }) => {
        await mount(page, modal('open'));
        const named = page.getByRole('dialog', { name: 'Example header' });
        await expect(named).toBeVisible();
        await expect(named).toHaveAccessibleDescription('Example description');
        await expect(named).toHaveAttribute('aria-modal', 'true');
        await expect(page.getByText('Example header')).toBeVisible();
    },
    'close-button': async ({ page }) => {
        await mount(page, modal('open'));
        await record(page);
        await page.getByRole('button', { name: 'close' }).click();
        expect(await logged(page)).toEqual(['close:close']);
        await expect(dialog(page)).toHaveCount(0);
    },
    'call-to-action': async ({ page }) => {
        await mount(page, modal('open action-label="Confirm"'));
        await record(page);
        const confirm = page.getByRole('button', { name: 'Confirm' });
        await confirm.click();
        expect(await logged(page)).toEqual(['action']);
        expect(await confirm.evaluate((el) => !!el.closest('[data-modal-footer]'))).toBe(false);
        await expect(page.locator('pttrn-modal [data-modal-footer] pttrn-button[label="Confirm"]')).toHaveCount(1);
        await expect(dialog(page)).toBeVisible();
    },
    'cancel-button': async ({ page }) => {
        await mount(page, modal('open action-label="Confirm" cancel-button'));
        await record(page);
        await page.getByRole('button', { name: 'Cancel' }).click();
        expect(await logged(page)).toEqual(['close:cancel']);

        await mount(page, modal('open action-label="Confirm" cancel-button="Not now"'));
        await expect(page.getByRole('button', { name: 'Not now' })).toBeVisible();
    },
    'no-footer': async ({ page }) => {
        await mount(page, modal('open cancel-button'));
        await expect(page.locator('pttrn-modal [data-modal-footer]')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    },
    'escape-closes': async ({ page }) => {
        await mount(page, modal('open'));
        await record(page);
        await expect(page.getByRole('button', { name: 'close' })).toBeFocused();
        await page.keyboard.press('Escape');
        expect(await logged(page)).toEqual(['close:escape']);
        await expect(dialog(page)).toHaveCount(0);
    },
    'focus-moves-in': async ({ page }) => {
        await mount(page, modal());
        await page.getByRole('button', { name: 'Open' }).click();
        await expect(page.getByRole('button', { name: 'close' })).toBeFocused();
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            await expect(dialog(page)).toBeVisible();
            const results = await new AxeBuilder({ page }).include('pttrn-modal').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
