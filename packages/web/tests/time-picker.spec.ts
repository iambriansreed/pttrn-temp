import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/TimePicker/spec';
import { axNode } from './ax-node';
import { mount } from './mount';
import { describeBehaviors } from './spec';

/** The React suite's Subject: named "Time", submitted as "time", at 13:45 unless the attributes give a value. */
const picker = (attributes = '') =>
    `<pttrn-time-picker aria-label="Time" name="time" ${/\bvalue=/.test(attributes) ? '' : 'value="13:45"'} ${attributes}></pttrn-time-picker>`;

/** The Usage example in `packages/react/src/components/TimePicker/TimePickerExample.tsx`: a labelled field. */
const USAGE = `<div style="width: 320px">
    <label for="destination-time">Time</label>
    <pttrn-time-picker id="destination-time" name="time" aria-describedby="destination-time-help"></pttrn-time-picker>
    <p id="destination-time-help">The time picker allows you to select a time.</p>
</div>`;

const host = (page: Page) => page.locator('pttrn-time-picker').first();
const field = (page: Page) => host(page).locator('[data-pttrn="time-picker"]');
const segment = (page: Page, name: string) => page.getByRole('spinbutton', { name, exact: true });
const toggle = (page: Page) => page.getByRole('combobox');
const popup = (page: Page) => page.getByRole('dialog', { name: 'Select time' });
const listbox = (page: Page, name: string) => page.getByRole('listbox', { name, exact: true });
const option = (page: Page, list: string, name: string) =>
    listbox(page, list).getByRole('option', { name, exact: true });
const segmentsAttribute = (page: Page, attribute: string) =>
    page.getByRole('spinbutton').evaluateAll((nodes, name) => nodes.map((node) => node.getAttribute(name)), attribute);

/** Records each pttrn-change value. */
const record = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { changes: string[] }).changes = [];
        document.addEventListener('pttrn-change', (event) =>
            (window as unknown as { changes: string[] }).changes.push((event as CustomEvent).detail.value),
        );
    });
const lastChange = (page: Page) => page.evaluate(() => (window as unknown as { changes: string[] }).changes.at(-1));
const submitted = (page: Page) => page.evaluate(() => new FormData(document.querySelector('form')!).get('time'));

const openPopup = async (page: Page) => {
    await toggle(page).click();
    await expect(popup(page)).toBeVisible();
};

test.describe('pttrn-time-picker', () => {
    test('submits its value with the form, and a reset restores the value attribute', async ({ page }) => {
        await mount(page, `<form>${picker()}</form>`);
        expect(await submitted(page)).toBe('13:45');

        await segment(page, 'hours').focus();
        await page.keyboard.press('ArrowUp');
        expect(await submitted(page)).toBe('14:45');

        await page.evaluate(() => document.querySelector('form')!.reset());
        await expect(segment(page, 'hours')).toHaveText('01');
        expect(await submitted(page)).toBe('13:45');
    });

    test('a disabled fieldset disables it', async ({ page }) => {
        await mount(page, `<form><fieldset disabled>${picker()}</fieldset></form>`);
        await expect(field(page)).toHaveAttribute('data-disabled');
        await expect(segment(page, 'hours')).toHaveAttribute('tabindex', '-1');
    });

    test('segment ids come from the picker id, so two pickers never share one', async ({ page }) => {
        await mount(page, `${picker('id="depart"')}${picker('id="arrive"')}`);
        const ids = await page.getByRole('spinbutton').evaluateAll((nodes) => nodes.map((node) => node.id));
        expect(ids).toEqual([
            'depart-hours',
            'depart-minutes',
            'depart-meridiem',
            'arrive-hours',
            'arrive-minutes',
            'arrive-meridiem',
        ]);
    });

    test('the popup opens under the field', async ({ page }) => {
        await mount(page, `<div style="width: 320px">${picker()}</div>`);
        await openPopup(page);
        const fieldBox = (await field(page).boundingBox())!;
        const popupBox = (await popup(page).boundingBox())!;
        expect(popupBox.x).toBeCloseTo(fieldBox.x, 0);
        expect(popupBox.y).toBeCloseTo(fieldBox.y + fieldBox.height + 4, 0);
    });

    test('Tab stays among the listboxes while the popup is open', async ({ page }) => {
        await mount(page, picker());
        await openPopup(page);
        await expect(listbox(page, 'Select hours')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(listbox(page, 'Select minutes')).toBeFocused();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(listbox(page, 'Select hours')).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(listbox(page, 'Select meridiem')).toBeFocused();
    });
});

describeBehaviors(spec, {
    'shows-value': async ({ page }) => {
        await mount(page, `<form>${picker()}</form>`);
        await expect(segment(page, 'hours')).toHaveText('01');
        await expect(segment(page, 'hours')).toHaveAttribute('aria-valuetext', '01');
        await expect(segment(page, 'hours')).toHaveAttribute('aria-valuemin', '1');
        await expect(segment(page, 'hours')).toHaveAttribute('aria-valuemax', '12');
        await expect(segment(page, 'minutes')).toHaveText('45');
        await expect(segment(page, 'minutes')).toHaveAttribute('aria-valuemin', '0');
        await expect(segment(page, 'minutes')).toHaveAttribute('aria-valuemax', '59');
        await expect(segment(page, 'meridiem')).toHaveText('PM');
        await expect(segment(page, 'meridiem')).toHaveAttribute('aria-valuetext', 'PM');
        expect(await submitted(page)).toBe('13:45');
        await expect(field(page)).toHaveAttribute('data-value', '13:45');

        await host(page).evaluate((el) => el.setAttribute('value', ''));
        await expect(segment(page, 'hours')).toHaveText('12');
        await expect(segment(page, 'minutes')).toHaveText('00');
        await expect(segment(page, 'meridiem')).toHaveText('AM');
        expect(await submitted(page)).toBeNull();
        await expect(field(page)).not.toHaveAttribute('data-value');

        await host(page).evaluate((el) => el.setAttribute('value', 'later'));
        await expect(segment(page, 'hours')).toHaveText('--');
        await expect(segment(page, 'hours')).toHaveAttribute('aria-valuetext', 'Empty');
        await expect(segment(page, 'minutes')).toHaveText('--');
        await expect(segment(page, 'minutes')).toHaveAttribute('aria-valuetext', 'Empty');
    },
    labelled: async ({ page }) => {
        await mount(page, '<pttrn-time-picker name="time" value="13:45"></pttrn-time-picker>');
        expect(await axNode(page, 'pttrn-time-picker')).toMatchObject({ role: 'group', name: 'Time picker' });

        await host(page).evaluate((el) => el.setAttribute('aria-label', 'Arrival'));
        expect(await axNode(page, 'pttrn-time-picker')).toMatchObject({ role: 'group', name: 'Arrival' });
        await expect(page.getByRole('group', { name: 'Arrival' })).toBeVisible();
        expect(await segmentsAttribute(page, 'aria-label')).toEqual(['hours', 'minutes', 'meridiem']);
        await expect(toggle(page)).toHaveAccessibleName('Open Time Picker');

        await mount(
            page,
            '<label for="arrival">Arrival time</label><pttrn-time-picker id="arrival" name="time" value="13:45"></pttrn-time-picker>',
        );
        await page.getByText('Arrival time').click();
        await expect(segment(page, 'hours')).toBeFocused();
    },
    described: async ({ page }) => {
        await mount(
            page,
            `<label for="depart">Departure</label>
            <pttrn-time-picker id="depart" name="time" value="13:45" aria-describedby="depart-description"></pttrn-time-picker>
            <p id="depart-description">Boarding closes ten minutes before.</p>`,
        );
        expect(await axNode(page, 'pttrn-time-picker')).toMatchObject({
            role: 'group',
            description: 'Boarding closes ten minutes before.',
        });

        // The error message takes the place of the description when there is no aria-describedby.
        await mount(
            page,
            `<label for="depart">Departure</label>
            <pttrn-time-picker id="depart" name="time" value="13:45" invalid aria-errormessage="depart-field-error"></pttrn-time-picker>
            <p id="depart-field-error">Choose a time.</p>`,
        );
        expect(await axNode(page, 'pttrn-time-picker')).toMatchObject({ role: 'group', description: 'Choose a time.' });
    },
    typing: async ({ page }) => {
        await mount(page, `<form>${picker('value=""')}</form>`);
        await record(page);

        await segment(page, 'hours').focus();
        // A 3 can only be three o'clock, so the hours are complete and focus moves on.
        await page.keyboard.press('3');
        expect(await lastChange(page)).toBe('03:00');
        await expect(segment(page, 'minutes')).toBeFocused();
        await page.keyboard.type('45');
        expect(await lastChange(page)).toBe('03:45');
        await expect(segment(page, 'meridiem')).toBeFocused();
        await page.keyboard.press('p');
        expect(await lastChange(page)).toBe('15:45');
        await expect(segment(page, 'meridiem')).toHaveText('PM');
        expect(await submitted(page)).toBe('15:45');

        // A 1 may begin 10, 11 or 12, so the hours wait for a second digit.
        await segment(page, 'hours').focus();
        await page.keyboard.press('1');
        expect(await lastChange(page)).toBe('13:45');
        await expect(segment(page, 'hours')).toBeFocused();
        await page.keyboard.press('2');
        expect(await lastChange(page)).toBe('12:45');
        await expect(segment(page, 'minutes')).toBeFocused();

        await segment(page, 'hours').focus();
        await page.keyboard.press('Backspace');
        expect(await lastChange(page)).toBe('');
        expect(await submitted(page)).toBeNull();
        await page.keyboard.press('Enter');
        await expect(segment(page, 'hours')).not.toBeFocused();
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, picker('value="12:59"'));
        await record(page);

        await segment(page, 'hours').focus();
        await page.keyboard.press('ArrowUp');
        expect(await lastChange(page)).toBe('13:59');
        await expect(segment(page, 'hours')).toHaveText('01');
        await page.keyboard.press('ArrowDown');
        expect(await lastChange(page)).toBe('12:59');

        await page.keyboard.press('ArrowRight');
        await expect(segment(page, 'minutes')).toBeFocused();
        await page.keyboard.press('ArrowUp');
        expect(await lastChange(page)).toBe('12:00');
        await expect(segment(page, 'minutes')).toHaveText('00');

        await page.keyboard.press('ArrowRight');
        await expect(segment(page, 'meridiem')).toBeFocused();
        await page.keyboard.press('ArrowUp');
        expect(await lastChange(page)).toBe('00:00');
        await expect(segment(page, 'meridiem')).toHaveText('AM');

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await expect(segment(page, 'hours')).toBeFocused();
    },
    'toggle-popup': async ({ page }) => {
        await mount(page, picker());
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle(page)).toHaveAttribute('aria-haspopup', 'dialog');
        await expect(toggle(page)).not.toHaveAttribute('aria-controls');
        await expect(popup(page)).toHaveCount(0);
        await expect(field(page)).not.toHaveAttribute('data-open');

        await openPopup(page);
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
        const dialogId = await popup(page).getAttribute('id');
        await expect(toggle(page)).toHaveAttribute('aria-controls', dialogId!);
        await expect(toggle(page)).toHaveAccessibleName('Close Time Picker');
        await expect(popup(page)).toHaveAttribute('aria-modal', 'true');
        await expect(field(page)).toHaveAttribute('data-open');
        await expect(listbox(page, 'Select hours')).toBeFocused();
        await expect(listbox(page, 'Select hours').getByRole('option')).toHaveCount(12);
        await expect(listbox(page, 'Select minutes').getByRole('option')).toHaveCount(12);
        await expect(listbox(page, 'Select meridiem').getByRole('option')).toHaveCount(2);
        await expect(option(page, 'Select hours', '01')).toHaveAttribute('aria-selected', 'true');
        await expect(option(page, 'Select hours', '02')).toHaveAttribute('aria-selected', 'false');
        await expect(option(page, 'Select minutes', '45')).toHaveAttribute('aria-selected', 'true');
        await expect(option(page, 'Select meridiem', 'PM')).toHaveAttribute('aria-selected', 'true');

        await toggle(page).click();
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(popup(page)).toHaveCount(0);
        await expect(toggle(page)).not.toHaveAttribute('aria-controls');
    },
    'pick-time': async ({ page }) => {
        await mount(page, `<form>${picker()}</form>`);
        await record(page);

        await openPopup(page);
        await option(page, 'Select hours', '03').click();
        expect(await lastChange(page)).toBe('15:45');
        await expect(listbox(page, 'Select minutes')).toBeFocused();

        await option(page, 'Select minutes', '30').click();
        expect(await lastChange(page)).toBe('15:30');
        await expect(listbox(page, 'Select meridiem')).toBeFocused();

        await option(page, 'Select meridiem', 'AM').click();
        expect(await lastChange(page)).toBe('03:30');
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle(page)).toBeFocused();
        expect(await submitted(page)).toBe('03:30');
        await expect(segment(page, 'hours')).toHaveText('03');
        await expect(segment(page, 'minutes')).toHaveText('30');
        await expect(segment(page, 'meridiem')).toHaveText('AM');
    },
    'listbox-keyboard': async ({ page }) => {
        await mount(page, picker());
        await record(page);

        for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
        await expect(toggle(page)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
        const hours = listbox(page, 'Select hours');
        await expect(hours).toBeFocused();
        const optionId = (list: string, name: string) => option(page, list, name).getAttribute('id');
        await expect(hours).toHaveAttribute('aria-activedescendant', (await optionId('Select hours', '01'))!);

        await page.keyboard.press('ArrowDown');
        await expect(hours).toHaveAttribute('aria-activedescendant', (await optionId('Select hours', '02'))!);
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowUp');
        await expect(hours).toHaveAttribute('aria-activedescendant', (await optionId('Select hours', '12'))!);
        await page.keyboard.press('Enter');
        expect(await lastChange(page)).toBe('12:45');
        await expect(listbox(page, 'Select minutes')).toBeFocused();

        await page.keyboard.press('ArrowDown');
        await expect(listbox(page, 'Select minutes')).toHaveAttribute(
            'aria-activedescendant',
            (await optionId('Select minutes', '50'))!,
        );
        await page.keyboard.press('Space');
        expect(await lastChange(page)).toBe('12:50');
        await expect(listbox(page, 'Select meridiem')).toBeFocused();

        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        expect(await lastChange(page)).toBe('00:50');
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle(page)).toBeFocused();

        await page.keyboard.press('Space');
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    },
    'escape-closes': async ({ page }) => {
        await mount(page, picker());

        await toggle(page).focus();
        await page.keyboard.press('Enter');
        await expect(popup(page)).toBeVisible();
        await expect(listbox(page, 'Select hours')).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(popup(page)).toHaveCount(0);
        await expect(toggle(page)).toBeFocused();
    },
    'outside-click-closes': async ({ page }) => {
        await mount(page, `${picker()}<p style="margin-top: 400px">Outside</p>`);

        await openPopup(page);
        await page.getByText('Outside').click();
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(popup(page)).toHaveCount(0);
    },
    states: async ({ page }) => {
        await mount(page, picker('disabled'));
        await expect(field(page)).toHaveAttribute('data-disabled');
        expect(await segmentsAttribute(page, 'aria-disabled')).toEqual(['true', 'true', 'true']);
        expect(await segmentsAttribute(page, 'contenteditable')).toEqual(['false', 'false', 'false']);
        expect(await segmentsAttribute(page, 'tabindex')).toEqual(['-1', '-1', '-1']);
        await expect(toggle(page)).toHaveAttribute('aria-disabled', 'true');
        await expect(toggle(page)).toHaveAttribute('tabindex', '-1');
        await toggle(page).click({ force: true });
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');

        await mount(page, picker('readonly'));
        await expect(field(page)).toHaveAttribute('data-readonly');
        await expect(field(page)).not.toHaveAttribute('data-disabled');
        expect(await segmentsAttribute(page, 'aria-readonly')).toEqual(['true', 'true', 'true']);
        expect(await segmentsAttribute(page, 'contenteditable')).toEqual(['false', 'false', 'false']);
        expect(await segmentsAttribute(page, 'tabindex')).toEqual(['-1', '-1', '-1']);
        await expect(toggle(page)).toHaveAttribute('aria-disabled', 'true');
        await toggle(page).click({ force: true });
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');

        await mount(page, picker('invalid size="small"'));
        await expect(field(page)).toHaveAttribute('data-invalid');
        await expect(field(page)).toHaveAttribute('data-size', 'small');
        await expect(field(page)).not.toHaveAttribute('data-readonly');
        await expect(segment(page, 'hours')).toHaveAttribute('contenteditable', 'true');
        await expect(segment(page, 'hours')).toHaveAttribute('tabindex', '0');
        await expect(toggle(page)).not.toHaveAttribute('aria-disabled');
    },
    'invalid-segments': async ({ page }) => {
        await mount(page, picker());
        expect(await segmentsAttribute(page, 'aria-invalid')).toEqual([null, null, null]);

        await mount(page, `${picker('invalid aria-errormessage="time-error"')}<p id="time-error">Choose a time.</p>`);
        await expect(field(page)).toHaveAttribute('data-invalid');
        expect(await axNode(page, 'pttrn-time-picker')).toMatchObject({ description: 'Choose a time.' });
        expect(await segmentsAttribute(page, 'aria-invalid')).toEqual(['true', 'true', 'true']);
        const results = await new AxeBuilder({ page }).include('pttrn-time-picker').analyze();
        expect(results.violations).toEqual([]);

        // Disabled or read-only, an invalid field still says so.
        await mount(page, picker('invalid readonly'));
        expect(await segmentsAttribute(page, 'aria-invalid')).toEqual(['true', 'true', 'true']);

        await host(page).evaluate((el) => el.removeAttribute('invalid'));
        await expect(segment(page, 'hours')).not.toHaveAttribute('aria-invalid');
        expect(await segmentsAttribute(page, 'aria-invalid')).toEqual([null, null, null]);
    },
    'axe-clean': async ({ page }) => {
        // The open popup, the field on its own and the Usage example in a labelled field.
        await mount(page, picker());
        await openPopup(page);
        let results = await new AxeBuilder({ page }).include('pttrn-time-picker').analyze();
        expect(results.violations).toEqual([]);

        for (const html of [picker(), USAGE]) {
            await mount(page, html);
            results = await new AxeBuilder({ page }).include('pttrn-time-picker').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
