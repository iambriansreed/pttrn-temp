import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Dialog/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const CONTENT = `<div style="padding: var(--usa-spacing-2)">
    <h1 id="title">Dialog Title</h1>
    <p>This is the content of the dialog.</p>
    <button type="button" data-close>Close</button>
</div>`;

/** An opener button and the dialog, wired as a page would: the opener opens it, the close button closes it. */
const page_ = (attributes = 'labelledby="title"') => `
    <button type="button" id="opener" onclick="document.querySelector('pttrn-dialog').open = true">Open</button>
    <pttrn-dialog ${attributes}>${CONTENT}</pttrn-dialog>
    <div style="height: 3000px"></div>
    <script>
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-close]')) document.querySelector('pttrn-dialog').open = false;
        });
    </script>`;

/** Waits for the box's entrance animation, which slides or fades it in. */
const settled = (page: Page) =>
    page
        .locator('pttrn-dialog [data-dialog-box]')
        .evaluate((box) => Promise.all(box.getAnimations().map((animation) => animation.finished)));

const open = async (page: Page) => {
    await page.getByRole('button', { name: 'Open' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
};

/** Mirrors the React example: the dialog at each placement. */
const PRESETS = Object.fromEntries(
    ['center', 'top', 'bottom', 'left', 'right'].map((placement) => [
        placement,
        page_(`labelledby="title" placement="${placement}"`),
    ]),
);

/** Records `pttrn-close` reasons on the page. */
const recordCloses = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { closes: string[] }).closes = [];
        document.addEventListener('pttrn-close', (event) =>
            (window as unknown as { closes: string[] }).closes.push((event as CustomEvent).detail.reason),
        );
    });
const closes = (page: Page) => page.evaluate(() => (window as unknown as { closes: string[] }).closes);

test.describe('pttrn-dialog', () => {
    test('Tab and Shift+Tab stay in the dialog', async ({ page }) => {
        await mount(
            page,
            page_().replace(
                '<button type="button" data-close>',
                '<a href="#x">Link</a><button type="button" data-close>',
            ),
        );
        await open(page);
        const link = page.getByRole('link', { name: 'Link' });
        const close = page.getByRole('button', { name: 'Close' });
        await expect(link).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(close).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(link).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(close).toBeFocused();
    });

    test('cancelling pttrn-close keeps the dialog open', async ({ page }) => {
        await mount(page, page_());
        await page.evaluate(() => document.addEventListener('pttrn-close', (event) => event.preventDefault()));
        await open(page);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('the page behind is inert while the dialog is open', async ({ page }) => {
        await mount(page, page_());
        await open(page);
        expect(await page.evaluate(() => document.elementFromPoint(5, 5)?.closest('pttrn-dialog') !== null)).toBe(true);
        await page.getByRole('button', { name: 'Close' }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Open' })).toBeFocused();
    });

    test('a contained dialog fills its positioned container and leaves the page usable', async ({ page }) => {
        await mount(
            page,
            `<div id="box" style="position: relative; overflow: hidden; width: 500px; height: 300px; margin: 40px">
                <pttrn-dialog contained open placement="right" label="Contained">${CONTENT}</pttrn-dialog>
            </div><button type="button">Outside</button>`,
        );
        await settled(page);
        const [box, dialog] = await Promise.all([
            page.locator('#box').boundingBox(),
            page.locator('pttrn-dialog [data-dialog-box]').boundingBox(),
        ]);
        expect(dialog!.x + dialog!.width).toBeCloseTo(box!.x + box!.width, 0);
        expect(dialog!.height).toBeCloseTo(box!.height, 0);
        await page.getByRole('button', { name: 'Outside' }).click();
    });

    test('is 50% of a wide screen, as React', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 800 });
        await mount(page, page_());
        await open(page);
        await settled(page);
        expect((await page.locator('pttrn-dialog [data-dialog-box]').boundingBox())!.width).toBeCloseTo(700, 0);
    });
});

describeBehaviors(spec, {
    'closed-by-default': async ({ page }) => {
        await mount(page, page_());
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.getByText('This is the content of the dialog.')).toBeHidden();
        await expect(page.locator('pttrn-dialog [data-scrim]')).toBeHidden();
    },
    opens: async ({ page }) => {
        await mount(page, page_('labelledby="title" open'));
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(page.getByText('This is the content of the dialog.')).toBeVisible();
        // In the top layer, like React's portal: above everything else on the page.
        expect(await page.locator('pttrn-dialog dialog').evaluate((el) => el.matches(':modal'))).toBe(true);
    },
    'escape-closes': async ({ page }) => {
        await mount(page, page_('labelledby="title" open'));
        await recordCloses(page);
        await page.keyboard.press('Escape');
        expect(await closes(page)).toEqual(['escape']);
        await expect(page.getByRole('dialog')).toHaveCount(0);
    },
    'scrim-closes': async ({ page }) => {
        await mount(page, page_('labelledby="title" open'));
        await recordCloses(page);
        await page.mouse.click(5, 5);
        expect(await closes(page)).toEqual(['scrim']);
        await expect(page.getByRole('dialog')).toHaveCount(0);
    },
    'hide-scrim': async ({ page }) => {
        await mount(page, page_('labelledby="title" open hide-scrim'));
        const scrim = page.locator('pttrn-dialog [data-scrim]');
        await expect(scrim).toHaveAttribute('data-hidden');
        await expect(scrim).toHaveAttribute('aria-hidden', 'true');
        await expect(scrim).toBeHidden();
    },
    labelled: async ({ page }) => {
        await mount(
            page,
            `<pttrn-dialog open labelledby="title" describedby="desc" description="A description">${CONTENT}<p id="desc">Described</p></pttrn-dialog>`,
        );
        const dialog = page.getByRole('dialog', { name: 'Dialog Title' });
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(dialog).toHaveAccessibleDescription('Described A description');

        await mount(page, `<pttrn-dialog open label="Settings">${CONTENT}</pttrn-dialog>`);
        await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    },
    placement: async ({ page }) => {
        await mount(page, page_('labelledby="title" open'));
        const dialog = page.locator('pttrn-dialog dialog');
        await expect(dialog).toHaveAttribute('data-placement', 'center');
        await page.locator('pttrn-dialog').evaluate((el) => el.setAttribute('placement', 'right'));
        await expect(dialog).toHaveAttribute('data-placement', 'right');
        await settled(page);
        const box = await page.locator('pttrn-dialog [data-dialog-box]').boundingBox();
        expect(box!.x + box!.width).toBeCloseTo(page.viewportSize()!.width, 0);
        expect(box!.width).toBeCloseTo(280, 0);
    },
    'focus-moves-in': async ({ page }) => {
        await mount(page, page_());
        const opener = page.getByRole('button', { name: 'Open' });
        await open(page);
        await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(opener).toBeFocused();
    },
    'scroll-lock': async ({ page }) => {
        await mount(page, page_());
        const overflow = () => page.evaluate(() => document.documentElement.style.overflow);
        expect(await overflow()).toBe('');
        await open(page);
        expect(await overflow()).toBe('hidden');
        await page.keyboard.press('Escape');
        await expect.poll(overflow).toBe('');
    },
    'axe-clean': async ({ page }) => {
        // The box and the scrim fade in, and axe measures contrast on what is painted: without motion they are there at once.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            await open(page);
            const results = await new AxeBuilder({ page }).include('pttrn-dialog').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
