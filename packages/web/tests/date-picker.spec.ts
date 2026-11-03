import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/DatePicker/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** The React suite's Subject: id and name "date", at 06/03/1985 unless the attributes give a value. */
const picker = (attributes = '') =>
    `<pttrn-date-picker id="date" name="date" ${/\bvalue=/.test(attributes) ? '' : 'value="06/03/1985"'} ${attributes}></pttrn-date-picker>`;

/** The Usage example in `packages/react/src/components/DatePicker/DatePickerExample.tsx`: a required field. */
const USAGE = `<div style="width: 320px">
    <pttrn-date-picker id="date1" name="date1" required label="Date" helper-text="The date picker allows you to select a date."></pttrn-date-picker>
</div>`;

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const host = (page: Page) => page.locator('pttrn-date-picker').first();
const input = (page: Page) => page.getByRole('textbox', { name: 'Enter or choose date' });
const toggle = (page: Page) => page.getByRole('button', { name: 'Toggle calendar' });
const calendar = (page: Page) => page.getByRole('dialog', { name: 'Choose Date' });
// A day is a cell labelled with its full date.
const day = (page: Page, label: string) => calendar(page).locator(`td[aria-label="${label}"]`);
const selected = (page: Page) =>
    calendar(page)
        .locator('[data-selected], [aria-selected]')
        .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('aria-label')));
const record = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { changes: string[] }).changes = [];
        document.addEventListener('pttrn-change', (event) =>
            (window as unknown as { changes: string[] }).changes.push((event as CustomEvent).detail.value),
        );
    });
const changes = (page: Page) => page.evaluate(() => (window as unknown as { changes: string[] }).changes);
/** Whether focus is somewhere inside the calendar dialog. */
const focusInCalendar = (page: Page) =>
    calendar(page).evaluate((dialog) => {
        let focused = document.activeElement;
        while (focused?.shadowRoot?.activeElement) {
            if (focused.shadowRoot.activeElement === dialog || dialog.contains(focused.shadowRoot.activeElement)) {
                return true;
            }
            focused = focused.shadowRoot.activeElement;
        }
        return !!focused && dialog.contains(focused);
    });

test.describe('pttrn-date-picker', () => {
    test('submits its text with the form and requires a value when required', async ({ page }) => {
        await mount(page, `<form>${picker('required')}</form>`);
        const formValue = () => page.evaluate(() => new FormData(document.querySelector('form')!).get('date'));
        expect(await formValue()).toBe('06/03/1985');

        await input(page).fill('');
        expect(await formValue()).toBe('');
        expect(
            await host(page).evaluate((el) => (el as HTMLElement & { checkValidity: () => boolean }).checkValidity()),
        ).toBe(false);

        await page.evaluate(() => document.querySelector('form')!.reset());
        await expect(input(page)).toHaveValue('06/03/1985');
    });

    test('a label pointing at it focuses the text field', async ({ page }) => {
        await mount(page, `<label for="date">Departure</label>${picker()}`);
        await page.getByText('Departure').click();
        await expect(input(page)).toBeFocused();
    });

    test('the calendar opens under the field and Escape closes it', async ({ page }) => {
        await mount(page, `<div style="width: 320px">${picker()}</div>`);
        await toggle(page).click();
        const box = (await host(page).locator('[data-pttrn="input"]').boundingBox())!;
        const popup = (await calendar(page).boundingBox())!;
        expect(popup.x).toBeCloseTo(box.x, 0);
        expect(popup.y).toBeCloseTo(box.y + box.height + 4, 0);

        await page.keyboard.press('Escape');
        await expect(calendar(page)).toHaveCount(0);
        await expect(toggle(page)).toBeFocused();
    });

    test('the calendar change stays inside: only the text is reported', async ({ page }) => {
        await mount(page, picker());
        await record(page);
        await toggle(page).click();
        await day(page, '15 June 1985').click();
        expect(await changes(page)).toEqual(['06/15/1985']);
    });

    test('a label names the field in place of the default', async ({ page }) => {
        await mount(page, picker('label="Departure"'));
        await expect(page.getByRole('textbox', { name: 'Departure' })).toBeVisible();
    });
});

describeBehaviors(spec, {
    'renders-input': async ({ page }) => {
        await mount(page, picker());

        await expect(input(page)).toHaveValue('06/03/1985');
        await expect(input(page)).toHaveAttribute('placeholder', 'mm/dd/yyyy');

        await mount(page, picker('placeholder="Select Date"'));
        await expect(input(page)).toHaveAttribute('placeholder', 'Select Date');
    },
    typing: async ({ page }) => {
        await mount(page, picker('value=""'));
        await record(page);

        await input(page).pressSequentially('12');
        expect(await changes(page)).toEqual(['1', '12']);
    },
    'toggle-calendar': async ({ page }) => {
        await mount(page, picker());

        await expect(calendar(page)).toHaveCount(0);
        await toggle(page).click();
        await expect(calendar(page)).toHaveAttribute('aria-modal', 'true');
        await expect.poll(() => focusInCalendar(page)).toBe(true);

        await toggle(page).click();
        await expect(calendar(page)).toHaveCount(0);
    },
    'pick-date': async ({ page }) => {
        await mount(page, picker());
        await record(page);

        await toggle(page).click();
        await day(page, '15 June 1985').click();
        expect(await changes(page)).toEqual(['06/15/1985']);
        await expect(calendar(page)).toHaveCount(0);
        await expect(input(page)).toHaveValue('06/15/1985');
    },
    'stays-open': async ({ page }) => {
        await mount(page, picker('keep-open'));
        await record(page);

        await toggle(page).click();
        await day(page, '15 June 1985').click();
        expect(await changes(page)).toEqual(['06/15/1985']);
        await expect(calendar(page)).toBeVisible();
    },
    'calendar-shows-value': async ({ page }) => {
        await mount(page, picker());

        await toggle(page).click();
        await expect(calendar(page).locator('[data-title]')).toHaveText('June 1985');
        expect(await selected(page)).toEqual(['3 June 1985']);

        // Today is only where the calendar opens: with nothing typed, nothing is chosen.
        await mount(page, picker('value=""'));
        await toggle(page).click();
        const today = new Date();
        await expect(calendar(page).locator('[data-title]')).toHaveText(
            `${MONTHS[today.getMonth()]} ${today.getFullYear()}`,
        );
        await expect(
            day(page, `${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`),
        ).toHaveAttribute('tabindex', '0');
        expect(await selected(page)).toEqual([]);
    },
    'outside-click-closes': async ({ page }) => {
        await mount(page, `${picker()}<p style="margin-top: 480px">Outside</p>`);

        await toggle(page).click();
        await expect(calendar(page)).toBeVisible();
        await page.getByText('Outside').click();
        await expect(calendar(page)).toHaveCount(0);
    },
    'disabled-readonly': async ({ page }) => {
        await mount(page, picker('disabled'));
        await expect(input(page)).toBeDisabled();
        await expect(toggle(page)).toHaveCount(0);

        await mount(page, picker('readonly'));
        await expect(input(page)).toHaveAttribute('readonly');
        await expect(toggle(page)).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        await mount(page, picker());
        await toggle(page).click();
        await expect(calendar(page)).toBeVisible();
        let results = await new AxeBuilder({ page }).include('pttrn-date-picker').analyze();
        expect(results.violations).toEqual([]);

        for (const html of [picker(), USAGE]) {
            await mount(page, html);
            results = await new AxeBuilder({ page }).include('pttrn-date-picker').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
