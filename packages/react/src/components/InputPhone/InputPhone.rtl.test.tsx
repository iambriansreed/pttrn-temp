/* eslint-disable react/no-multi-comp */
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { spec } from './spec';
import { InputPhone, InputPhoneProps } from '.';
import { Field } from '-/components/Field';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { fireEvent, render, screen, waitFor } from '-/rtl/util';
import { countryCodes, SupportedCountryCode } from '-/utils/countryCodes';

const TestBed = () => (
    <InputPhone aria-label="Phone number input" name="example-name" onChange={() => {}} value="9375551060" />
);

const renderWithCountry = (initialCountryCode: SupportedCountryCode) =>
    render(
        <InputPhone
            aria-label="Phone number input"
            initialCountryCode={initialCountryCode}
            name="example-name"
            onChange={() => {}}
            value=""
        />,
    );

const Subject = (props: Partial<InputPhoneProps>) => (
    <InputPhone initialCountryCode="GB" name="phone" onChange={() => {}} value="" {...props} />
);

/** Holds the value, so several digits can be typed into the controlled input. */
function Typed({ onChange, ...props }: Partial<InputPhoneProps>) {
    const [value, setValue] = useState<string | undefined>('');
    return (
        <Subject
            onChange={(next, country) => {
                onChange?.(next, country);
                setValue(next);
            }}
            value={value}
            {...props}
        />
    );
}

const input = () => screen.getByRole('textbox');
const countryButton = () => screen.getByRole('combobox');
const inputContainer = () =>
    document.querySelector('[data-pttrn-owner="input-phone"][data-pttrn="input"]') as HTMLElement;
const isOpen = () => countryButton().getAttribute('aria-expanded') === 'true';
// Role queries skip the floating list until it is positioned and are slow over 200+ options: plain DOM queries instead.
const listbox = () => document.querySelector('[role="listbox"]') as HTMLElement | null;
const listOptions = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
const optionFor = (country: string) =>
    listOptions().find((item) => item.querySelector('[data-text]')?.textContent === country) as HTMLElement;
const activeOption = () => document.getElementById(countryButton().getAttribute('aria-activedescendant') || '');
const liveRegion = () => document.querySelector('[data-pttrn-aria-live]');
// The list is positioned a tick after it opens and refuses pointer events until then.
const openList = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(countryButton());
    await waitFor(() => expect(listbox()).toHaveStyle({ pointerEvents: 'auto' }));
};

describe('InputPhone (RTL)', () => {
    it('has no basic a11y issues', hasNoBasicA11yIssues(<TestBed />));

    it('renders', () => {
        const { getAllByLabelText } = render(<TestBed />);

        expect(getAllByLabelText('Phone number input')[0]).toBeInTheDocument();
    });

    it('shows no flags by default', () => {
        const { getByRole } = renderWithCountry('GB');

        expect(getByRole('combobox', { name: 'select country code' }).querySelector('[data-test-flag]')).toBeNull();

        fireEvent.click(getByRole('combobox', { name: 'select country code' }));

        expect(document.querySelector('[data-test-flag]')).toBeNull();
    });

    it('renders a hidden flag for the selected country and each menu option with renderFlag', () => {
        const { getByRole } = render(
            <InputPhone
                aria-label="Phone number input"
                initialCountryCode="GB"
                name="example-name"
                onChange={() => {}}
                renderFlag={(code) => <i data-test-flag={code} />}
                value=""
            />,
        );

        const button = getByRole('combobox', { name: 'select country code' });
        const selected = button.querySelector('[data-test-flag="GB"]');
        expect(selected).toBeInTheDocument();
        expect(selected?.parentElement).toHaveAttribute('aria-hidden', 'true');

        fireEvent.click(button);

        // plain DOM queries: the floating menu has no layout in jsdom, so role queries skip it (and are slow on 200+ items)
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        expect(options).toHaveLength(countryCodes.length);
        options.forEach((option) => expect(option.querySelector('[data-test-flag]')).toBeInTheDocument());
    });
});

describeBehaviors(spec, {
    'renders-input': () => {
        render(<Subject required value="(937) 555-1060" />);

        expect(input()).toHaveValue('(937) 555-1060');
        expect(input()).toHaveAttribute('name', 'phone');
        expect(input()).toBeRequired();
        expect(input()).toHaveAttribute('autocomplete', 'off');
        expect(document.querySelector('[data-pttrn="input-phone"]')).toContainElement(input());
    },
    'country-button': () => {
        const { unmount } = render(<Subject />);
        expect(countryButton()).toHaveAccessibleName('select country code');
        expect(countryButton()).toHaveAttribute('aria-haspopup', 'listbox');
        expect(countryButton()).toHaveAttribute('aria-expanded', 'false');
        expect(countryButton()).not.toHaveAttribute('aria-controls');
        expect(countryButton()).toHaveTextContent('+44');
        expect(screen.getByText('+44')).toHaveAttribute('aria-hidden', 'true');
        expect(listbox()).toBeNull();

        unmount();
        render(<Subject initialCountryCode="FR" />);
        expect(countryButton()).toHaveTextContent('+33');
    },
    'opens-on-click': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.click(countryButton());
        expect(isOpen()).toBe(true);
        expect(countryButton()).toHaveFocus();
        const list = listbox() as HTMLElement;
        await waitFor(() => expect(list).not.toHaveStyle({ display: 'none' }));
        expect(countryButton()).toHaveAttribute('aria-controls', list.id);
        expect(countryButton()).toHaveAttribute('aria-owns', list.id);
        expect(list).toHaveAccessibleName('Select country code');
        expect(listOptions()).toHaveLength(countryCodes.length);
        expect(activeOption()).toBe(listOptions()[0]);
        expect(listOptions()[0]).toHaveAttribute('data-active');
        const selected = listOptions().filter((item) => item.getAttribute('aria-selected') === 'true');
        expect(selected).toEqual([optionFor('United Kingdom')]);
        expect(optionFor('United Kingdom')).toHaveTextContent('(+44)');
    },
    'choose-country': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await openList(user);
        await user.click(optionFor('France'));
        expect(isOpen()).toBe(false);
        expect(listbox()).toBeNull();
        expect(countryButton()).toHaveTextContent('+33');
        expect(liveRegion()).toHaveTextContent('Selected country code France');
        expect(liveRegion()).toHaveAttribute('aria-live', 'polite');
        expect(input()).toHaveFocus();
        // The country alone does not call onChange; it travels with the next value.
        expect(onChange).not.toHaveBeenCalled();
        await user.keyboard('6');
        expect(onChange).toHaveBeenCalledWith('6', 'FR');
    },
    keyboard: async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.tab();
        expect(countryButton()).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(isOpen()).toBe(true);
        expect(activeOption()).toBe(listOptions()[0]);
        await user.keyboard('{Escape}');
        expect(isOpen()).toBe(false);
        expect(countryButton()).toHaveFocus();

        await user.keyboard(' ');
        expect(isOpen()).toBe(true);
        await user.keyboard('{Escape}');
        expect(isOpen()).toBe(false);

        await user.keyboard('{ArrowDown}');
        expect(isOpen()).toBe(true);
        await user.keyboard('{ArrowDown}');
        expect(activeOption()).toBe(listOptions()[1]);
        await user.keyboard('{ArrowUp}{ArrowUp}');
        // Wraps from the first country to the last.
        expect(activeOption()).toBe(listOptions()[listOptions().length - 1]);
        expect(activeOption()).toHaveTextContent('Zimbabwe');
        await user.keyboard('{Enter}');
        expect(isOpen()).toBe(false);
        expect(countryButton()).toHaveTextContent('+263');
        expect(input()).toHaveFocus();
    },
    'outside-click-closes': async () => {
        const user = userEvent.setup();
        render(
            <>
                <Subject />
                <p>Outside</p>
            </>,
        );

        await user.click(countryButton());
        expect(isOpen()).toBe(true);
        fireEvent.mouseDown(screen.getByText('Outside'));
        await waitFor(() => expect(isOpen()).toBe(false));
    },
    'formats-as-typed': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const { unmount } = render(<Typed initialCountryCode="US" onChange={onChange} />);

        await user.type(input(), '9375551060');
        expect(input()).toHaveValue('(937) 555-1060');
        expect(onChange.mock.calls.slice(0, 4)).toEqual([
            ['9', 'US'],
            ['93', 'US'],
            ['(937)', 'US'],
            ['(937) 5', 'US'],
        ]);
        expect(onChange).toHaveBeenLastCalledWith('(937) 555-1060', 'US');

        unmount();
        onChange.mockClear();
        render(<Typed disableFormatting initialCountryCode="US" onChange={onChange} />);
        await user.type(input(), '9375551060');
        expect(input()).toHaveValue('9375551060');
        expect(onChange).toHaveBeenLastCalledWith('9375551060', 'US');
    },
    'digits-only': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.type(input(), 'ab');
        expect(onChange).not.toHaveBeenCalled();
        await user.type(input(), '7');
        expect(onChange).toHaveBeenCalledWith('7', 'GB');
    },
    states: () => {
        const { rerender } = render(<Subject disabled />);
        expect(input()).toBeDisabled();
        expect(countryButton()).toBeDisabled();
        expect(countryButton()).toHaveAttribute('aria-disabled', 'true');
        expect(inputContainer()).toHaveAttribute('data-disabled');
        fireEvent.click(countryButton());
        expect(isOpen()).toBe(false);

        rerender(<Subject readOnly />);
        expect(input()).toHaveAttribute('readonly');
        expect(countryButton()).toBeDisabled();
        expect(countryButton()).toHaveAttribute('aria-readonly', 'true');
        expect(inputContainer()).toHaveAttribute('data-readonly');

        rerender(<Subject invalid size="small" />);
        expect(input()).toHaveAttribute('aria-invalid', 'true');
        expect(inputContainer()).toHaveAttribute('data-invalid');
        expect(inputContainer()).toHaveAttribute('data-size', 'small');
    },
    labelled: () => {
        const { rerender } = render(<Subject />);
        expect(input()).toHaveAccessibleName('Phone number input');

        rerender(<Subject aria-label="Mobile number" />);
        expect(input()).toHaveAccessibleName('Mobile number');

        rerender(<Subject aria-describedby="phone-help" aria-errormessage="phone-error" />);
        expect(input()).toHaveAttribute('aria-describedby', 'phone-help');
        expect(input()).toHaveAttribute('aria-errormessage', 'phone-error');
    },
    'render-flag': async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Subject />);
        expect(countryButton().querySelector('[data-test-flag]')).toBeNull();

        unmount();
        render(<Subject renderFlag={(code) => <i data-test-flag={code} />} />);
        const flag = countryButton().querySelector('[data-test-flag="GB"]');
        expect(flag).toBeInTheDocument();
        expect(flag?.parentElement).toHaveAttribute('aria-hidden', 'true');

        await user.click(countryButton());
        const optionFlag = optionFor('France').querySelector('[data-test-flag="FR"]');
        expect(optionFlag).toBeInTheDocument();
        expect(optionFlag?.parentElement).toHaveAttribute('aria-hidden', 'true');
    },
    'axe-clean': async () => {
        // The open list first, while the document holds a single combobox.
        const user = userEvent.setup();
        const { container } = render(<Subject />);
        await openList(user);
        const { axe } = await import('jest-axe');
        expect(await axe(container)).toHaveNoViolations();

        await hasNoBasicA11yIssues(
            <Field controlId="phone" helperText="Include the area code." label="Phone number">
                <InputPhone
                    aria-describedby="phone-description"
                    aria-label="Phone number"
                    id="phone"
                    initialCountryCode="US"
                    name="phone"
                    onChange={() => {}}
                    value="(937) 555-1060"
                />
            </Field>,
        )();
    },
});
