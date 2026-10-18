import './select.scss';
import { SvgKeyboardArrowDown } from '@ptrn/icons/KeyboardArrowDown';
import { useMemo, KeyboardEvent, MouseEvent } from 'react';
import { ListItem, ListItemProps } from '-/components/ListItem';
import { Menu, MenuProps } from '-/components/Menu';
import { useArrowNavigation } from '-/hooks/useArrowNavigation';
import { useFloating } from '-/hooks/useFloating';
import { useId } from '-/hooks/useId';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { CommonProps, ElementProps, FieldControlProps } from '-/types/common';
import { getElementById } from '-/utils/dom';
import { handleKeyDown } from '-/utils/handleKeyDown';
import { scrollListItemsStyle, ScrollListItemsStyleProps } from '-/utils/scrollListItemsStyle';

/**
 * An option in a Select component.
 *
 * Essentially the props of ListItemProps.
 */
export type SelectOption = CommonProps<'disabled'> &
    Omit<ListItemProps, 'id' | 'onClick' | 'value'> & { value: string };

export type SelectItem = SelectOption & { id: string };

export type SelectProps = CommonProps<'size'> &
    FieldControlProps<string, KeyboardEvent | MouseEvent> &
    ScrollListItemsStyleProps & {
        /**
         * Array of options to display in the select
         *
         * @example
         *     [
         *         { id: '1', label: 'Option 1' },
         *         { id: '2', label: 'Option 2' },
         *         { id: '3', label: 'Option 3' },
         *         { id: '4', label: 'Option 4' },
         *         { id: '5', label: 'Option 5' },
         *         { id: '6', label: 'Option 6' },
         *         { id: '7', label: 'Option 7' },
         *         { id: '8', label: 'Option 8' },
         *         { id: '9', label: 'Option 9' },
         *         { id: '10', label: 'Option 10' },
         *     ];
         *
         * @type Array<SelectOption>
         * @required
         */
        options: SelectOption[];
        /**
         * Placeholder for the select
         *
         * @default Select one
         */
        placeholder?: string;
        /**
         * The width of the menu.
         *
         * If not provided, the menu will match the width of the select control.
         */
        menuWidth?: MenuProps['width'];
    };

/**
 * A field element that allows users to select one option from a list of available choices.
 *
 * For a more complete example with field usage, see the SelectField component.
 *
 * @example
 *     import { Select } from '@ptrn/react/Select';
 *
 *     () => {
 *         const OPTIONS = [
 *             { id: '1', label: 'Option 1', value: '1' },
 *             { id: '2', label: 'Option 2', value: '2' },
 *             { id: '3', label: 'Option 3', value: '3' },
 *             { id: '4', label: 'Option 4', value: '4' },
 *             { id: '5', label: 'Option 5', value: '5' },
 *             { id: '6', label: 'Option 6', value: '6' },
 *         ];
 *
 *         const [selected, setSelected] = useState<string | undefined>(undefined);
 *
 *         return (
 *             <div style={{ width: 320 }}>
 *                 <Field
 *                     controlId="example-select"
 *                     helperText="The select allows you to choose one option from a list of options."
 *                     label="Select an option"
 *                 >
 *                     <Select
 *                         id="example-select"
 *                         name="example-select"
 *                         onChange={setSelected}
 *                         options={OPTIONS}
 *                         placeholder="Select an option"
 *                         scrollLimit={5}
 *                         size="medium"
 *                         value={selected}
 *                     />
 *                 </Field>
 *             </div>
 *         );
 *     };
 *
 * @name Select
 * @phase Stable
 */
export function Select({
    options: optionsProp = [],
    value = '',
    onChange,
    placeholder = 'Select one',
    size = 'medium',
    disabled,
    id: idProp,
    invalid = false,
    readOnly,
    name,
    scrollLimit,
    required = false,
    'aria-label': ariaLabel,
    menuWidth,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    ...elementProps
}: ElementProps<SelectProps, 'button'>) {
    const id = useId(idProp);

    const menuId = useMemo(() => `${id}-menu`, [id]);

    const { items, availableItems } = useMemo(() => {
        const nextItems = optionsProp.map((item, index): SelectItem => ({
            ...item,
            id: `${id}-item-${index}`,
            'aria-label': item.label,
            'aria-selected': value == item.value,
        }));

        return { items: nextItems, availableItems: nextItems.filter((item) => !item.disabled) };
    }, [optionsProp, id, value]);

    const selectedItem = useMemo((): SelectItem | undefined => items.find((o) => o.value === value), [items, value]);

    const { activeElementId, setActiveElementId, arrowKeyCallbacks } = useArrowNavigation({
        ids: availableItems.map((i) => i.id),
    });

    const closeMenu = () => setActiveElementId(null);
    const open = Boolean(activeElementId);

    const { elements, floatingStyles } = useFloating({
        hide: !open,
        offsetOptions: 4,
        //match reference width if menuWidth not provided
        refWidth: !menuWidth,
    });

    useOutsideClick({
        elements: [elements.floating, elements.reference],
        callback: closeMenu,
        disabled: !open,
    });

    const spaceEnter = () => {
        if (!open) {
            elements.reference?.click();
            return;
        }
        if (activeElementId) getElementById(activeElementId)?.click();
    };

    return (
        <>
            <input name={name} type="hidden" value={value} />
            <button
                aria-label={`${ariaLabel} ${selectedItem?.label || placeholder}`}
                {...elementProps}
                aria-activedescendant={activeElementId || undefined}
                aria-autocomplete="list"
                aria-controls={open ? menuId : undefined}
                aria-describedby={ariaDescribedBy || undefined}
                aria-disabled={disabled || readOnly || undefined}
                aria-errormessage={ariaErrorMessage || undefined}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-readonly={readOnly || undefined}
                aria-required={required || undefined}
                data-invalid={invalid || undefined}
                data-open={open || undefined}
                data-pttrn="select"
                data-size={size}
                id={id}
                onBlur={(event) => {
                    const targetOutsideOfMenu =
                        event.relatedTarget && !elements.floating?.contains(event.relatedTarget as Element);
                    if (targetOutsideOfMenu) closeMenu();
                }}
                onClick={() => {
                    if (disabled || readOnly || !items.length) return;

                    if (!open) {
                        const nextActiveId = selectedItem?.id || items[0].id;
                        setActiveElementId(nextActiveId);
                        return;
                    }

                    closeMenu();
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
                        'Ctrl+Option+Space': spaceEnter,
                    },
                    { preventDefault: true, stopPropagation: true },
                )}
                ref={elements.setReference}
                role="combobox"
                tabIndex={0}
                type="button"
            >
                <ListItem
                    as="span"
                    data-placeholder={!selectedItem || undefined}
                    data-pttrn-owner="select"
                    id={`${id}-selected-value`}
                    label={selectedItem?.label || placeholder}
                    leading={selectedItem?.leading}
                    onClick={undefined}
                    owner="select"
                    trailing={selectedItem?.trailing}
                />
                <SvgKeyboardArrowDown />
            </button>
            <Menu
                aria-autocomplete={undefined}
                as="div"
                id={menuId}
                innerRef={elements.setFloating}
                onClickCapture={() => {
                    // Prevent the menu from closing when clicking inside it
                    // maintain focus on the select control
                    elements.reference?.focus();
                }}
                onFocus={() => {
                    elements.reference?.focus();
                }}
                owner="select"
                role="listbox"
                style={{
                    ...(open ? scrollListItemsStyle(scrollLimit, items.length) : {}),
                    ...floatingStyles,
                }}
                tabIndex={-1}
                width={menuWidth}
            >
                {items.map((item) => {
                    const isActive = activeElementId === item.id;
                    const isSelected = value === item.value;

                    return (
                        <ListItem
                            key={item.id}
                            {...item}
                            active={isActive || undefined}
                            aria-label={undefined}
                            aria-selected={isSelected}
                            as="li"
                            onClick={() => {
                                if (item.disabled) return;
                                onChange(item.value);
                                closeMenu();
                            }}
                            owner="select"
                            role="option"
                            tabIndex={-1} //show && isActive ? -1 : 0}
                            value={undefined}
                        />
                    );
                })}
            </Menu>
        </>
    );
}
