import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/BannerAlert/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const BODY = 'There was an error processing your request.';
const subject = (attributes = '') =>
    `<pttrn-banner-alert body="${BODY}" header="Error" ${attributes}></pttrn-banner-alert>`;

/** Mirrors the presets in `packages/react/src/components/BannerAlert/BannerAlertExample.tsx`. */
const PRESETS = {
    'With CallToAction': `<pttrn-banner-alert action-label="Click me" body="With CallToAction body" closable header="With CallToAction Header"></pttrn-banner-alert>`,
    'Without OnClose': `<pttrn-banner-alert body="Without OnClose body" header="Without OnClose Header"></pttrn-banner-alert>`,
};

const alert = (page: Page) => page.getByRole('alert');

/** Counts the `pttrn-*` events of a name that reach the document. */
async function counter(page: Page, name: string) {
    return page.evaluateHandle((event) => {
        const seen = { count: 0 };
        document.addEventListener(event, () => seen.count++);
        return seen;
    }, name);
}

test.describe('pttrn-banner-alert', () => {
    test('text in the default slot takes the place of body', async ({ page }) => {
        await mount(page, '<pttrn-banner-alert body="Ignored" header="Note">From the slot</pttrn-banner-alert>');
        await expect(page.getByText('From the slot')).toBeVisible();
        await expect(page.getByText('Ignored')).toHaveCount(0);
    });

    test('fills the width of its container, in a flex row too', async ({ page }) => {
        await mount(page, `<div style="display: flex; width: 500px">${subject()}</div>`);
        expect((await alert(page).boundingBox())!.width).toBe(500);
    });

    test('the Close button names itself with its tooltip', async ({ page }) => {
        await mount(page, `<div style="padding-top: 80px">${subject('closable')}</div>`);
        const close = page.getByRole('button', { name: 'Close' });
        await close.hover();
        await expect(page.getByRole('tooltip')).toHaveText('Close');
    });
});

describeBehaviors(spec, {
    'renders-content': async ({ page }) => {
        await mount(page, subject());
        await expect(alert(page)).toHaveAttribute('data-pttrn', 'banner-alert');
        await expect(alert(page).getByText('Error', { exact: true })).toBeVisible();
        await expect(alert(page).getByText(BODY)).toBeVisible();
    },
    variant: async ({ page }) => {
        await mount(page, subject());
        await expect(page.locator('pttrn-banner-alert')).toHaveAttribute('variant', 'informational');
        await expect(alert(page)).toHaveAttribute('data-variant', 'informational');
        const icon = alert(page).locator('[data-icon-bar] svg');
        await expect(icon).toHaveAttribute('data-pttrn-name', 'InfoFill');

        for (const [variant, name] of [
            ['error', 'ErrorFill'],
            ['success', 'CheckCircleFill'],
            ['warning', 'WarningFill'],
        ]) {
            await page
                .locator('pttrn-banner-alert')
                .evaluate((el, value) => el.setAttribute('variant', value), variant);
            await expect(alert(page)).toHaveAttribute('data-variant', variant);
            await expect(icon).toHaveAttribute('data-pttrn-name', name);
        }
    },
    'close-button': async ({ page }) => {
        await mount(page, subject('closable'));
        const closes = await counter(page, 'pttrn-close');
        await page.getByRole('button', { name: 'Close' }).click();
        expect(await closes.evaluate((seen) => seen.count)).toBe(1);
        await page.keyboard.press('Enter');
        expect(await closes.evaluate((seen) => seen.count)).toBe(2);

        await mount(page, subject());
        await expect(page.getByRole('button')).toHaveCount(0);
    },
    'call-to-action': async ({ page }) => {
        await mount(page, subject('action-label="Retry"'));
        const actions = await counter(page, 'pttrn-action');
        await page.getByRole('button', { name: 'Retry' }).click();
        expect(await actions.evaluate((seen) => seen.count)).toBe(1);

        await mount(page, subject('action-label=""'));
        await expect(page.getByRole('button')).toHaveCount(0);
    },
    elevated: async ({ page }) => {
        await mount(page, subject());
        await expect(alert(page)).not.toHaveAttribute('data-elevated');
        await expect(alert(page)).toHaveCSS('box-shadow', 'none');

        await mount(page, subject('elevated'));
        await expect(page.locator('pttrn-banner-alert')).toHaveAttribute('elevated', '');
        await expect(alert(page)).toHaveAttribute('data-elevated', '');
        await expect(alert(page)).not.toHaveCSS('box-shadow', 'none');
    },
    'icon-decorative': async ({ page }) => {
        await mount(page, subject('variant="success"'));
        await expect(alert(page).locator('[data-icon-bar]')).toHaveAttribute('aria-hidden', 'true');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-banner-alert').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
