import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Calendar/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

// Monday 10 June 2024. The grid covers that month in six weeks, from Sunday 26 May to Saturday 6 July.
const calendar = (attributes = 'value="2024-06-10"') => `<pttrn-calendar ${attributes}></pttrn-calendar>`;

/** Mirrors the presets in `packages/react/src/components/Calendar/CalendarExample.tsx`. */
const PRESETS = {
    'With selected date': calendar('value="2024-06-10"'),
    'No selected date': calendar(''),
};

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
const today = () => {
    const date = new Date();
    return {
        title: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
        day: `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
    };
};

const host = (page: Page) => page.locator('pttrn-calendar');
const title = (page: Page) => host(page).locator('[data-title]');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
// A day is a cell named with its full date.
const day = (page: Page, label: string) => host(page).locator(`td[aria-label="${label}"]`);
const days = (page: Page) => host(page).locator('tbody td');
const selected = (page: Page) =>
    host(page)
        .locator('[data-selected], [aria-selected]')
        .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('aria-label')));
// The selected day carries both marks; the active day is the one in the Tab order.
const expectSelected = async (page: Page, label: string) => {
    await expect(day(page, label)).toHaveAttribute('data-selected');
    await expect(day(page, label)).toHaveAttribute('aria-selected', 'true');
    expect(await selected(page)).toEqual([label]);
};
const expectActive = async (page: Page, label: string) => {
    await expect(day(page, label)).toHaveAttribute('tabindex', '0');
    await expect(day(page, label)).toBeFocused();
};
const setValue = (page: Page, value: string | null) =>
    host(page).evaluate(
        (el, next) => (next === null ? el.removeAttribute('value') : el.setAttribute('value', next)),
        value,
    );
/** Records each pttrn-change detail value. */
const record = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { changes: string[] }).changes = [];
        document.addEventListener('pttrn-change', (event) =>
            (window as unknown as { changes: string[] }).changes.push((event as CustomEvent).detail.value),
        );
    });
const changes = (page: Page) => page.evaluate(() => (window as unknown as { changes: string[] }).changes);
const focusedIsBody = (page: Page) => page.evaluate(() => document.activeElement === document.body);

test.describe('pttrn-calendar', () => {
    test('choosing a day sets value and fires pttrn-change with the Date', async ({ page }) => {
        await mount(page, calendar());
        const detail = page.evaluate(
            () =>
                new Promise<{ value: string; date: string }>((resolve) =>
                    document.addEventListener('pttrn-change', (event) => {
                        const { value, date } = (event as CustomEvent).detail;
                        resolve({ value, date: (date as Date).toDateString() });
                    }),
                ),
        );
        await day(page, '15 June 2024').click();
        expect(await detail).toEqual({ value: '2024-06-15', date: 'Sat Jun 15 2024' });
        await expect(host(page)).toHaveAttribute('value', '2024-06-15');
        await expectSelected(page, '15 June 2024');
    });

    test('valueAsDate reads and sets the value as a Date', async ({ page }) => {
        await mount(page, calendar());
        const read = await host(page).evaluate((el) =>
            (el as HTMLElement & { valueAsDate: Date }).valueAsDate.toDateString(),
        );
        expect(read).toBe('Mon Jun 10 2024');
        await host(page).evaluate(
            (el) => ((el as HTMLElement & { valueAsDate: Date }).valueAsDate = new Date(2025, 1, 3)),
        );
        await expect(host(page)).toHaveAttribute('value', '2025-02-03');
        await expect(title(page)).toHaveText('February 2025');
    });

    test('the navigation buttons show their labels as tooltips', async ({ page }) => {
        await mount(page, `<div style="padding-top: 80px">${calendar()}</div>`);
        await button(page, 'Next Year').hover();
        await expect(page.getByRole('tooltip')).toHaveText('Next Year');
    });

    test('a month later from the 31st stays in that month', async ({ page }) => {
        await mount(page, calendar('value="2024-01-31"'));
        await button(page, 'Next Month').click();
        await expect(day(page, '29 February 2024')).toHaveAttribute('tabindex', '0');
    });
});

describeBehaviors(spec, {
    'renders-month': async ({ page }) => {
        await mount(page, calendar());

        await expect(title(page)).toHaveText('June 2024');
        await expect(page.getByRole('grid', { name: 'June 2024' })).toBeVisible();

        const headers = page.getByRole('columnheader');
        expect(await headers.allTextContents()).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
        await expect(headers.first()).toHaveAttribute('abbr', 'Sunday');
        await expect(headers.last()).toHaveAttribute('abbr', 'Saturday');

        // One header row and six weeks.
        await expect(page.getByRole('row')).toHaveCount(7);
        await expect(days(page)).toHaveCount(42);
        await expect(days(page).first()).toHaveAttribute('aria-label', '26 May 2024');
        await expect(days(page).last()).toHaveAttribute('aria-label', '6 July 2024');
        await expect(day(page, '1 June 2024')).toBeVisible();
        await expect(day(page, '30 June 2024')).toBeVisible();
    },
    'highlights-value': async ({ page }) => {
        await mount(page, calendar());
        await expectSelected(page, '10 June 2024');
        await expect(day(page, '10 June 2024')).toHaveAttribute('role', 'gridcell');
        await expect(day(page, '10 June 2024')).toHaveAttribute('tabindex', '0');
        await expect(day(page, '11 June 2024')).toHaveAttribute('tabindex', '-1');
        await expect(host(page).locator('[tabindex="0"]')).toHaveCount(1);

        // Today is where the keys start, not a choice: nothing is selected.
        await mount(page, calendar(''));
        await expect(title(page)).toHaveText(today().title);
        await expect(day(page, today().day)).toHaveAttribute('tabindex', '0');
        expect(await selected(page)).toEqual([]);

        await mount(page, calendar('value="2024-02-31"'));
        await expect(day(page, today().day)).toHaveAttribute('tabindex', '0');
        expect(await selected(page)).toEqual([]);
    },
    'choose-day': async ({ page }) => {
        await mount(page, calendar());
        await record(page);

        await day(page, '15 June 2024').click();
        expect(await changes(page)).toEqual(['2024-06-15']);

        await day(page, '26 May 2024').click();
        expect(await changes(page)).toEqual(['2024-06-15', '2024-05-26']);
    },
    'month-year-buttons': async ({ page }) => {
        await mount(page, calendar());
        await record(page);

        await button(page, 'Next Month').click();
        await expect(title(page)).toHaveText('July 2024');
        await expect(page.getByRole('grid', { name: 'July 2024' })).toBeVisible();
        await expect(day(page, '10 July 2024')).toHaveAttribute('tabindex', '0');

        await button(page, 'Previous Month').click();
        await button(page, 'Previous Month').click();
        await expect(title(page)).toHaveText('May 2024');

        await button(page, 'Next Year').click();
        await expect(title(page)).toHaveText('May 2025');

        await button(page, 'Previous Year').click();
        await expect(title(page)).toHaveText('May 2024');
        await expect(day(page, '10 May 2024')).toHaveAttribute('tabindex', '0');
        expect(await changes(page)).toEqual([]);
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, calendar());
        await record(page);

        await day(page, '10 June 2024').focus();
        await page.keyboard.press('ArrowRight');
        await expectActive(page, '11 June 2024');
        await expect(day(page, '10 June 2024')).toHaveAttribute('tabindex', '-1');

        await page.keyboard.press('ArrowDown');
        await expectActive(page, '18 June 2024');
        await page.keyboard.press('ArrowLeft');
        await expectActive(page, '17 June 2024');
        await page.keyboard.press('ArrowUp');
        await expectActive(page, '10 June 2024');

        // Two weeks up crosses into May, and the grid follows.
        await page.keyboard.press('ArrowUp');
        await expectActive(page, '3 June 2024');
        await page.keyboard.press('ArrowUp');
        await expectActive(page, '27 May 2024');
        await expect(title(page)).toHaveText('May 2024');
        await expect(page.getByRole('grid', { name: 'May 2024' })).toBeVisible();
        expect(await changes(page)).toEqual([]);
    },
    'home-end-page-keys': async ({ page }) => {
        await mount(page, calendar('value="2024-06-12"'));

        await day(page, '12 June 2024').focus();
        await page.keyboard.press('Home');
        await expectActive(page, '9 June 2024');
        await page.keyboard.press('End');
        await expectActive(page, '15 June 2024');

        await page.keyboard.press('PageDown');
        await expectActive(page, '15 July 2024');
        await expect(title(page)).toHaveText('July 2024');
        await page.keyboard.press('PageUp');
        await expectActive(page, '15 June 2024');
        await expect(title(page)).toHaveText('June 2024');
    },
    'keyboard-choose': async ({ page }) => {
        await mount(page, calendar());
        await record(page);

        await day(page, '10 June 2024').focus();
        await page.keyboard.press('Enter');
        expect(await changes(page)).toEqual(['2024-06-10']);

        await page.keyboard.press('ArrowRight');
        await expectActive(page, '11 June 2024');
        await page.keyboard.press('Space');
        expect(await changes(page)).toEqual(['2024-06-10', '2024-06-11']);
    },
    'focus-trap': async ({ page }) => {
        await mount(page, calendar('value="2024-06-10" focus-trap'));

        await expectActive(page, '10 June 2024');
        await page.keyboard.press('Tab');
        await expect(button(page, 'Previous Year')).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expectActive(page, '10 June 2024');

        await mount(page, `${calendar()}<button type="button">After</button>`);
        expect(await focusedIsBody(page)).toBe(true);
        await day(page, '10 June 2024').focus();
        await page.keyboard.press('Tab');
        await expect(button(page, 'After')).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(day(page, '10 June 2024')).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(button(page, 'Next Year')).toBeFocused();
    },
    ids: async ({ page }) => {
        await mount(page, calendar('id="cal" value="2024-06-10"'));

        await expect(host(page).locator('[data-pttrn="calendar"]')).toHaveAttribute('id', 'cal');
        await expect(title(page)).toHaveAttribute('id', 'cal-title');
        await expect(page.getByRole('grid')).toHaveAttribute('aria-labelledby', 'cal-title');
        await expect(day(page, '10 June 2024')).toHaveAttribute('id', 'cal-option-06-10-2024');
        await expect(day(page, '26 May 2024')).toHaveAttribute('id', 'cal-option-05-26-2024');
    },
    'active-is-not-selected': async ({ page }) => {
        await mount(page, calendar());

        await day(page, '10 June 2024').focus();
        await page.keyboard.press('ArrowRight');
        await expectActive(page, '11 June 2024');
        await expectSelected(page, '10 June 2024');
        await expect(day(page, '11 June 2024')).not.toHaveAttribute('data-selected');

        await page.keyboard.press('End');
        await expectActive(page, '15 June 2024');
        await expectSelected(page, '10 June 2024');

        // In a month without the value nothing is selected, and coming back finds the value still selected.
        await button(page, 'Next Month').click();
        await expect(title(page)).toHaveText('July 2024');
        expect(await selected(page)).toEqual([]);
        await button(page, 'Previous Month').click();
        await expect(title(page)).toHaveText('June 2024');
        await expect(day(page, '15 June 2024')).toHaveAttribute('tabindex', '0');
        await expectSelected(page, '10 June 2024');
    },
    'value-change': async ({ page }) => {
        await mount(page, calendar());

        await setValue(page, '2024-08-20');
        await expect(title(page)).toHaveText('August 2024');
        await expectSelected(page, '20 August 2024');
        await expect(day(page, '20 August 2024')).toHaveAttribute('tabindex', '0');
        await page.waitForTimeout(50);
        expect(await focusedIsBody(page)).toBe(true);

        // A value of the same day, set again, does not undo the user's navigation.
        await button(page, 'Next Month').click();
        await expect(title(page)).toHaveText('September 2024');
        await host(page).evaluate((el) => {
            const calendarElement = el as HTMLElement & { value: string; requestUpdate: () => void };
            calendarElement.value = '';
            calendarElement.value = '2024-08-20';
        });
        await expect(title(page)).toHaveText('September 2024');
        await expect(day(page, '20 September 2024')).toHaveAttribute('tabindex', '0');

        // A value that goes away clears the selection and leaves the view.
        await setValue(page, null);
        await expect(title(page)).toHaveText('September 2024');
        await button(page, 'Previous Month').click();
        expect(await selected(page)).toEqual([]);

        // From no value to one, the view moves again.
        await setValue(page, '2025-01-01');
        await expect(title(page)).toHaveText('January 2025');
        await expectSelected(page, '1 January 2025');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-calendar').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
