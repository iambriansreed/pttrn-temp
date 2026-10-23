import './search-bar.scss';
import { SvgSearch } from '@ptrn/icons/Search';
import { useEffect, useMemo, useState } from 'react';
import { InputProps, Input } from '-/components/Input';
import { ListItem, ListItemProps } from '-/components/ListItem';
import { Menu } from '-/components/Menu';
import { Txt } from '-/components/Txt';
import { useArrowNavigation } from '-/hooks/useArrowNavigation';
import { useFloating } from '-/hooks/useFloating';
import { useId } from '-/hooks/useId';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { FieldControlProps } from '-/types/common';
import { handleKeyDown } from '-/utils/handleKeyDown';
import { scrollListItemsStyle, ScrollListItemsStyleProps } from '-/utils/scrollListItemsStyle';
import { sendAriaLiveMessage } from '-/utils/sendAriaLiveMessage';
import { useIds } from '-/utils/useIds';

/**
 * An option in a SearchBar component.
 *
 * Essentially the props for a ListItem.
 */
export type SearchBarOption = Pick<ListItemProps, 'label' | 'leading' | 'trailing'>;

export type SearchBarProps<O extends SearchBarOption = SearchBarOption> = Omit<
    FieldControlProps<string, O>,
    'invalid' | 'readOnly' | 'required'
> &
    Pick<InputProps, 'inputRef' | 'size' | 'trailing'> &
    ScrollListItemsStyleProps & {
        /**
         * The placeholder of the field.
         *
         * @default Search
         *
         * @required
         */
        placeholder: string;
        /**
         * Content to display in the menu.
         *
         * @example
         *     [
         *         { label: 'Apple Pie' },
         *         { label: 'Banana Split' },
         *         { label: 'Cherry Tart' },
         *         { label: 'Dragonfruit Sorbet' },
         *         { label: 'Elderberry Jam' },
         *         { label: 'Fig Newton' },
         *         { label: 'Grape Soda' },
         *         { label: 'Honeydew Smoothie' },
         *         { label: 'Ice Cream Sandwich' },
         *         { label: 'Jackfruit Pudding' },
         *     ];
         *
         * @type Array<SearchBarOption>
         */
        items?: O[];
        /**
         * Message to display when no results are found
         *
         * @type multiline
         */
        noResultsMessage?: string;
    };

/**
 * An input field that allows customers to input search queries and retrieve results.
 *
 * @example
 *     import { SearchBar } from '@ptrn/react/SearchBar';
 *
 *     () => {
 *         const [searchText, setSearchText] = useState('');
 *
 *         return (
 *             <SearchBar
 *                 aria-label="Example aria-label"
 *                 items={[
 *                     { label: 'Apple Pie' },
 *                     { label: 'Banana Split' },
 *                     { label: 'Cherry Tart' },
 *                     { label: 'Dragonfruit Sorbet' },
 *                     { label: 'Elderberry Jam' },
 *                     { label: 'Fig Newton' },
 *                     { label: 'Grape Soda' },
 *                     { label: 'Honeydew Smoothie' },
 *                     { label: 'Ice Cream Sandwich' },
 *                     { label: 'Jackfruit Pudding' },
 *                 ]}
 *                 name="example-name"
 *                 placeholder="Search"
 *                 value={searchText}
 *                 onChange={setSearchText}
 *             />
 *         );
 *     };
 *
 * @name SearchBar
 * @phase Stable
 */
export function SearchBar<O extends SearchBarOption>({
    items: itemsProp,
    noResultsMessage,
    placeholder = 'Search',
    id: idProp,
    inputRef,
    name,
    size = 'medium',
    value,
    onChange,
    disabled = false,
    scrollLimit,
    trailing,
    'aria-label': ariaLabel,
}: SearchBarProps<O>) {
    const id = useId(idProp);
    const menuId = `${id}-menu`;
    const noResultsId = `${id}-no-results`;

    const items = useIds(`search-bar-${id}`, itemsProp || []);

    const [hasFocus, setHasFocus] = useState(false);

    const filteredItems = useMemo(() => {
        const valueStr = value?.toString().trim().toLowerCase() || '';
        return items.filter((item) => !valueStr || item.label.toLowerCase().includes(valueStr));
    }, [items, value]);

    const hasQuery = !!value?.trim().length;
    const noResults = hasQuery && filteredItems.length === 0;

    useEffect(() => {
        if (noResults) sendAriaLiveMessage('No results found', 'assertive');
    }, [noResults, value]);

    // Choosing an option or pressing Escape closes the list until the next keystroke.
    const [dismissed, setDismissed] = useState(false);

    const { activeElementId, setActiveElementId, arrowKeyCallbacks } = useArrowNavigation({
        // The no-results row stands in for the options, so the active id stays valid while nothing matches.
        ids: noResults ? [noResultsId] : filteredItems.map((i) => i.id),
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
        callback: () => {
            setHasFocus(false);
            closeMenu();
        },
        disabled: !open,
        handleTabs: true,
    });

    const choose = (item: (typeof items)[number]) => {
        onChange(item.label, item);
        setDismissed(true);
        closeMenu();
    };

    useEffect(() => {
        if (!hasFocus || dismissed) return setActiveElementId(null);
        if (noResults) return setActiveElementId(noResultsId);
        if (activeElementId) return;
        setActiveElementId(hasQuery ? filteredItems[0].id : null);
    }, [hasFocus, dismissed, noResults, hasQuery, filteredItems, activeElementId, setActiveElementId, noResultsId]);

    return (
        <>
            <div data-pttrn="search-bar">
                <Input
                    aria-label={ariaLabel}
                    autoComplete="off"
                    containerRef={elements.setReference}
                    disabled={disabled}
                    id={id}
                    inputProps={{
                        'aria-controls': open ? menuId : undefined,
                        'aria-expanded': open,
                        'aria-haspopup': 'listbox',
                        'aria-activedescendant': activeElementId || undefined,
                        'aria-autocomplete': 'list',
                        role: 'combobox',
                        spellCheck: 'false',
                    }}
                    inputRef={(node) => {
                        if (!node) return;
                        inputRef?.(node);
                    }}
                    leading={<SvgSearch />}
                    name={name}
                    onChange={(str) => {
                        setDismissed(false);
                        onChange(str);
                    }}
                    onFocus={() => setHasFocus(true)}
                    // Up and Down move through the results (Down opens them); Left, Right and Space stay text editing.
                    // Enter chooses only while the list is open, so a closed search can still submit its form.
                    onKeyDown={handleKeyDown(
                        {
                            ArrowDown: (event) => {
                                setDismissed(false);
                                arrowKeyCallbacks.ArrowDown?.(event);
                            },
                            ArrowUp: (event) => {
                                if (open) arrowKeyCallbacks.ArrowUp?.(event);
                            },
                            ...(open
                                ? {
                                      Enter: () => {
                                          const item = filteredItems.find((entry) => entry.id === activeElementId);
                                          if (item) choose(item);
                                      },
                                      Escape: () => {
                                          setDismissed(true);
                                          closeMenu();
                                      },
                                  }
                                : {}),
                        },
                        { preventDefault: true, stopPropagation: true },
                    )}
                    owner="search-bar"
                    placeholder={placeholder}
                    size={size}
                    trailing={trailing}
                    value={value}
                />
            </div>
            <Menu
                aria-autocomplete={undefined}
                as="div"
                id={menuId}
                innerRef={elements.setFloating}
                label="Search results"
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
                    ...(open ? scrollListItemsStyle(scrollLimit, filteredItems.length) : {}),
                    ...floatingStyles,
                }}
                tabIndex={-1}
            >
                {activeElementId === noResultsId && (
                    <div
                        aria-disabled="true"
                        aria-selected="false"
                        data-pttrn="no-items-found"
                        id={noResultsId}
                        role="option"
                    >
                        <Txt as="div" variant="heading-h5">
                            No results found
                        </Txt>
                        {noResultsMessage && (
                            <Txt as="div" variant="body-base">
                                {noResultsMessage}
                            </Txt>
                        )}
                    </div>
                )}
                {filteredItems.map((item) => {
                    const isActive = activeElementId === item.id;
                    const isSelected = value == item.label;

                    return (
                        <ListItem
                            key={item.id}
                            {...item}
                            active={isActive || undefined}
                            aria-label={undefined}
                            aria-selected={isSelected}
                            as="li"
                            onClick={() => choose(item)}
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
