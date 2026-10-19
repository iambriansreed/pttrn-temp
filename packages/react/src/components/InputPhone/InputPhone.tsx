import './input-phone.scss';
import { SvgKeyboardArrowDown } from '@ptrn/icons/KeyboardArrowDown';
import { AsYouType, getCountryCallingCode } from 'libphonenumber-js';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { Button } from '-/components/Button';
import { Input, InputProps } from '-/components/Input';
import { ListItem } from '-/components/ListItem';
import { Menu } from '-/components/Menu';
import { useArrowNavigation } from '-/hooks/useArrowNavigation';
import { useFloating } from '-/hooks/useFloating';
import { useId } from '-/hooks/useId';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { FieldControlProps } from '-/types/common';
import { countryCodeData, countryCodes, SupportedCountryCode } from '-/utils/countryCodes';
import { getElementById } from '-/utils/dom';
import { guessUserCountryCode } from '-/utils/guessUserCountryCode';
import { handleKeyDown } from '-/utils/handleKeyDown';
import { scrollListItemsStyle, ScrollListItemsStyleProps } from '-/utils/scrollListItemsStyle';
import { sendAriaLiveMessage } from '-/utils/sendAriaLiveMessage';
import { useIds } from '-/utils/useIds';

const SELECT_OPTIONS = countryCodes.map((code) => {
    const countryCodeDetails = countryCodeData[code];
    return {
        value: code,
        label: `${countryCodeDetails?.name}`,
        countryCallingCode: getCountryCallingCode(code),
    };
});

export type InputPhoneProps = FieldControlProps<string, SupportedCountryCode> &
    Pick<InputProps, 'inputRef' | 'size'> &
    ScrollListItemsStyleProps & {
        /**
         * The default country code to select when the component is rendered. If not provided, it will attempt to guess
         * based on the user's locale. If the guessed country code is not supported, it will default to 'US'. Based on
         * [ISO](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes) 2-digit country codes.
         *
         * @type string
         */
        initialCountryCode?: SupportedCountryCode;
        /**
         * Disables formatting of the phone number input in the UI. values returned by `onChange` are always
         * unformatted.
         *
         * @type boolean
         */
        disableFormatting?: boolean;
        /**
         * Renders a decorative flag (or any icon) for a country, shown in the country button and beside each country in
         * the menu. No flags are shown when omitted. The result is hidden from assistive technology.
         *
         * @type (countryCode: SupportedCountryCode) => ReactNode
         */
        renderFlag?: (countryCode: SupportedCountryCode) => ReactNode;
    };

/**
 * An input that allows users to enter text phone numbers and select country codes for the phone number.
 *
 * This is the base element and if used must contain the field label contextually.
 *
 * For a more complete example with field usage, see the InputPhoneField component.
 *
 * @example
 *     import { InputPhone } from '-/components/InputPhone';
 *
 *     () => {
 *         const [value, onChange] = useState<string | undefined>();
 *
 *         return (
 *             <div style={{ width: 320 }}>
 *                 <Field
 *                     controlId="example-input-phone"
 *                     helperText="The phone input allows you to enter a phone number with country code."
 *                     label="Example Input Phone"
 *                 >
 *                     <InputPhone
 *                         aria-label="Phone Number"
 *                         id="example-input-phone"
 *                         initialCountryCode="US"
 *                         name="example-name"
 *                         onChange={onChange}
 *                         value={value}
 *                     />
 *                 </Field>
 *             </div>
 *         );
 *     };
 *
 * @name InputPhone
 * @phase Stable
 */
export function InputPhone({
    value,
    onChange,
    disableFormatting,
    renderFlag,
    initialCountryCode,
    disabled,
    readOnly,
    name,
    id: idProp,
    invalid = false,
    required = false,
    size = 'medium',
    inputRef,
    scrollLimit = 5,
    'aria-label': ariaLabel = 'Phone number input',
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
}: InputPhoneProps) {
    const id = useId(idProp);
    const menuId = useMemo(() => `${id}-menu`, [id]);

    const items = useIds(`input-phone-${id}`, SELECT_OPTIONS);

    const [countryCode, setCountryCode] = useState<SupportedCountryCode>(initialCountryCode || guessUserCountryCode());

    const inputInternalRef = useRef<HTMLInputElement | null>(null);

    const { activeElementId, setActiveElementId, arrowKeyCallbacks } = useArrowNavigation({
        ids: items.map((i) => i.id),
    });

    const closeMenu = () => setActiveElementId(null);
    const open = Boolean(activeElementId);

    const { elements, floatingStyles } = useFloating({
        hide: !open,
        offsetOptions: 4,
        refWidth: true,
    });

    useOutsideClick({
        elements: [elements.floating, elements.reference],
        callback: () => closeMenu(),
        disabled: !open,
    });

    const spaceEnter = () => {
        if (!open) {
            // The floating reference is the Input container, not this button, so open the list directly.
            setActiveElementId(items[0]?.id || null);
            return;
        }
        if (activeElementId) getElementById(activeElementId)?.click();
    };

    const callingCode = useMemo(() => getCountryCallingCode(countryCode), [countryCode]);

    const handleChange = (newValue?: string) => {
        const numericChange = value?.replace(/\D/g, '') !== newValue?.replace(/\D/g, '');

        // only format if the numeric value has changed
        if (!disableFormatting && numericChange) {
            const formatter = new AsYouType(countryCode);
            newValue = formatter.input(`${newValue}`);
        }

        onChange(newValue, countryCode);
    };

    return (
        <>
            <div data-pttrn="input-phone">
                <Input
                    aria-describedby={ariaDescribedBy}
                    aria-errormessage={ariaErrorMessage}
                    aria-label={ariaLabel || undefined}
                    autoComplete="off"
                    containerRef={elements.setReference}
                    disabled={disabled}
                    id={id}
                    inputMode="tel"
                    inputRef={(node) => {
                        inputRef?.(node);
                        inputInternalRef.current = node;
                    }}
                    invalid={invalid}
                    leading={
                        <Button
                            aria-activedescendant={open ? activeElementId || undefined : undefined}
                            aria-controls={open ? menuId : undefined}
                            aria-disabled={disabled || undefined}
                            aria-expanded={open}
                            aria-haspopup="listbox"
                            aria-label="select country code"
                            aria-owns={menuId}
                            aria-readonly={readOnly || undefined}
                            disabled={disabled || readOnly}
                            label="Open country code menu"
                            name={`${name}-country-code`}
                            onClick={(event) => {
                                const nextOpen = !open;
                                if (nextOpen) {
                                    setActiveElementId(items[0]?.id || null);
                                } else {
                                    setActiveElementId(null);
                                }
                                event.preventDefault();
                            }}
                            onKeyDown={handleKeyDown(
                                {
                                    ...arrowKeyCallbacks,
                                    ArrowDown: (event) => {
                                        if (!open) spaceEnter();
                                        arrowKeyCallbacks.ArrowDown?.(event);
                                    },
                                    Space: spaceEnter,
                                    Enter: spaceEnter,
                                    Escape: closeMenu,
                                    'Ctrl+Option+Space': spaceEnter,
                                },
                                { preventDefault: true, stopPropagation: true },
                            )}
                            role="combobox"
                            variant="tertiary"
                        >
                            {renderFlag && <span aria-hidden>{renderFlag(countryCode)}</span>}
                            <span aria-hidden>{`+${callingCode}`}</span>
                            <SvgKeyboardArrowDown />
                        </Button>
                    }
                    name={name}
                    onChange={handleChange}
                    onKeyDown={(event) => {
                        // ignore non numeric keys
                        if (event.key.length === 1 && !/[0-9]/.test(event.key)) event.preventDefault();
                    }}
                    owner="input-phone"
                    readOnly={readOnly}
                    required={required}
                    size={size}
                    value={value}
                />
            </div>
            {open && (
                <Menu
                    aria-autocomplete={undefined}
                    as="div"
                    id={menuId}
                    innerRef={elements.setFloating}
                    label="Select country code"
                    onClickCapture={() => {
                        // Prevent the menu from closing when clicking inside it
                        // maintain focus on the select control
                        inputInternalRef.current?.focus();
                    }}
                    onFocus={() => {
                        inputInternalRef.current?.focus();
                    }}
                    owner="input-phone"
                    role="listbox"
                    style={{
                        ...(open ? scrollListItemsStyle(scrollLimit, items.length) : {}),
                        ...floatingStyles,
                    }}
                    tabIndex={-1}
                >
                    {items.map(({ countryCallingCode, ...item }) => (
                        <ListItem
                            {...item}
                            active={item.id === activeElementId}
                            aria-selected={item.value === countryCode}
                            key={item.id}
                            leading={
                                renderFlag ? (
                                    <span aria-hidden>{renderFlag(item.value as SupportedCountryCode)}</span>
                                ) : null
                            }
                            onClick={() => {
                                setCountryCode(item.value as SupportedCountryCode);
                                sendAriaLiveMessage(`Selected country code ${item.label}`);
                                closeMenu();
                                inputInternalRef.current?.focus();
                            }}
                            role="option"
                            trailing={`(+${countryCallingCode})`}
                        />
                    ))}
                </Menu>
            )}
        </>
    );
}
