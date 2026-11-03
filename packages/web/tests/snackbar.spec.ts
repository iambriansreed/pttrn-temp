import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Snackbar/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const ICON = '<svg slot="icon" viewBox="0 0 16 16" data-testid="icon"><circle cx="8" cy="8" r="6" /></svg>';

const snackbar = (attributes = 'open', content = '') =>
    `<button type="button" id="opener" onclick="document.querySelector('pttrn-snackbar').open = true">Open</button>
    <pttrn-snackbar text="Saved" ${attributes}>${content}</pttrn-snackbar>`;

/** The React example has no presets; these are the states its suite checks with axe. */
const PRESETS = {
    Default: snackbar('open disable-focus-trap'),
    'With icon': snackbar('open', ICON),
};

const alert = (page: Page) => page.getByRole('alert');

/** Records `pttrn-close` reasons on the page. */
const recordCloses = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { closes: string[] }).closes = [];
        document.addEventListener('pttrn-close', (event) =>
            (window as unknown as { closes: string[] }).closes.push((event as CustomEvent).detail.reason),
        );
    });
const closes = (page: Page) => page.evaluate(() => (window as unknown as { closes: string[] }).closes);

test.describe('pttrn-snackbar', () => {
    test('sits at the bottom center of the screen, 600px wide and 56px tall', async ({ page }) => {
        await mount(page, snackbar());
        const box = await page.locator('pttrn-snackbar [data-snackbar-content]').boundingBox();
        const viewport = page.viewportSize()!;
        expect([box!.width, box!.height]).toEqual([600, 56]);
        expect(box!.x + box!.width / 2).toBeCloseTo(viewport.width / 2, 0);
        expect(box!.y + box!.height).toBeCloseTo(viewport.height - 8, 0);
    });

    test('the page behind stays clickable', async ({ page }) => {
        await mount(page, `${snackbar('open timeout="60000"')}<button type="button" id="other">Other</button>`);
        await page.locator('#other').click();
    });

    test('closing returns focus to the opener', async ({ page }) => {
        await mount(page, snackbar(''));
        await page.locator('#opener').click();
        await expect(page.getByRole('button', { name: 'Dismiss' })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(alert(page)).toHaveCount(0);
        await expect(page.locator('#opener')).toBeFocused();
    });

    test('a cut-short text shows whole in a tooltip on hover', async ({ page }) => {
        await mount(
            page,
            `<pttrn-snackbar open text="${'A very long message that does not fit. '.repeat(4)}"></pttrn-snackbar>`,
        );
        await page.locator('pttrn-snackbar [data-label]').hover();
        await expect(page.locator('pttrn-snackbar [data-pttrn="tooltip"]')).toBeVisible();
    });
});

describeBehaviors(spec, {
    'closed-by-default': async ({ page }) => {
        await mount(page, snackbar(''));
        await expect(alert(page)).toHaveCount(0);
    },
    'shows-text': async ({ page }) => {
        await mount(page, snackbar());
        await expect(alert(page)).toHaveText(/Saved/);
        // In the top layer, like React's portal at the end of the document.
        expect(
            await page.locator('pttrn-snackbar [data-pttrn="snackbar"]').evaluate((el) => el.matches(':popover-open')),
        ).toBe(true);
    },
    'dismiss-button': async ({ page }) => {
        await mount(page, snackbar());
        await recordCloses(page);
        await page.getByRole('button', { name: 'Dismiss' }).click();
        expect(await closes(page)).toEqual(['dismiss']);
        await expect(alert(page)).toHaveCount(0);

        await mount(page, snackbar('open close-button-label="Got it"'));
        await expect(page.getByRole('button', { name: 'Got it' })).toBeVisible();
    },
    'no-dismiss-button': async ({ page }) => {
        await mount(page, snackbar('open hide-close-button timeout="1000"'));
        await expect(alert(page)).toBeVisible();
        await expect(alert(page).getByRole('button')).toHaveCount(0);
    },
    'auto-dismiss': async ({ page }) => {
        // A paused clock, so only runFor moves time.
        await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
        await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
        await mount(page, snackbar('open timeout="2000"'));
        await recordCloses(page);
        await page.clock.runFor(1999);
        expect(await closes(page)).toEqual([]);
        await expect(alert(page)).toBeVisible();
        await page.clock.runFor(1);
        expect(await closes(page)).toEqual(['timeout']);
        await expect(alert(page)).toHaveCount(0);
    },
    'icon-decorative': async ({ page }) => {
        await mount(page, snackbar('open', ICON));
        await expect(page.getByTestId('icon')).toBeVisible();
        await expect(page.locator('pttrn-snackbar [data-snackbar-icon]')).toHaveAttribute('aria-hidden', 'true');
    },
    'focus-moves-in': async ({ page }) => {
        // Without a dismiss button there is nothing tabbable, so focus falls back to the content itself.
        await mount(page, snackbar('hide-close-button timeout="5000"'));
        await page.locator('#opener').click();
        await expect(alert(page)).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(alert(page)).toBeFocused();
    },
    managed: async ({ page }) => {
        await mount(page, '<pttrn-snackbar-manager></pttrn-snackbar-manager>');
        const send = (options: unknown) =>
            page.evaluate(async (detail) => {
                document.dispatchEvent(new CustomEvent('pttrn-snackbar-send', { detail }));
            }, options);
        await send({ text: 'Managed message', disableFocusTrap: true });
        await expect(alert(page)).toHaveText(/Managed message/);
        await send('Just text');
        await expect(alert(page)).toHaveText(/Just text/);
        await page.evaluate(() => document.dispatchEvent(new CustomEvent('pttrn-snackbar-clear')));
        await expect(alert(page)).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            await expect(alert(page)).toBeVisible();
            const results = await new AxeBuilder({ page }).include('pttrn-snackbar').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
