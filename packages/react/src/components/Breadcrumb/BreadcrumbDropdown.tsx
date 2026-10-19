import { SvgChevronRight } from '@ptrn/icons/ChevronRight';
import { SvgMoreHoriz } from '@ptrn/icons/MoreHoriz';
import { useEffect } from 'react';
import { Button } from '-/components/Button';
import { ListItem } from '-/components/ListItem';
import { Menu } from '-/components/Menu';
import { useArrowNavigation } from '-/hooks/useArrowNavigation';
import { useFloating } from '-/hooks/useFloating';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { getElementById } from '-/utils/dom';
import { handleKeyDown } from '-/utils/handleKeyDown';
import { scrollListItemsStyle, ScrollListItemsStyleProps } from '-/utils/scrollListItemsStyle';
import { useIds } from '-/utils/useIds';

export type BreadcrumbItem = {
    /** The text of the crumb. */
    label: string;
    /** Where the crumb leads. */
    href: string;
};

export type BreadcrumbDropdownProps = ScrollListItemsStyleProps & {
    /** The pages folded into the menu. */
    items: BreadcrumbItem[];
    /** The id of the breadcrumb, which the menu id derives from. */
    id: string;
};

/**
 * The folded middle of a long trail: a menu button that lists the hidden pages as links. Focus moves into the menu
 * while it is open, the arrows move it, and Escape returns it to the button.
 */
export function BreadcrumbDropdown({ items: itemsProp, id, scrollLimit }: BreadcrumbDropdownProps) {
    const menuId = `${id}-menu`;
    const items = useIds(`breadcrumb-${id}`, itemsProp);

    const { activeElementId, setActiveElementId, arrowKeyCallbacks } = useArrowNavigation({
        ids: items.map((i) => i.id),
    });

    const closeMenu = () => setActiveElementId(null);
    const open = Boolean(activeElementId);

    const { elements, floatingStyles } = useFloating({
        hide: !open,
        offsetOptions: 4,
        refWidth: false,
    });

    // A click outside, or tabbing away, closes the menu.
    useOutsideClick({
        elements: [elements.floating, elements.reference],
        callback: () => closeMenu(),
        disabled: !open,
        handleTabs: true,
    });

    // Focus follows the active item while the menu is open. The menu mounts one render after it opens, so the first
    // attempt may find nothing and a retry on the next tick lands it.
    useEffect(() => {
        if (!activeElementId) return undefined;
        const focusActive = () => getElementById(activeElementId)?.focus();
        focusActive();
        const retry = setTimeout(focusActive, 0);
        return () => clearTimeout(retry);
    }, [activeElementId]);

    const closeAndRefocus = () => {
        closeMenu();
        elements.reference?.focus();
    };

    const label = `${items.length} more pages`;

    return (
        <li>
            <Button
                aria-controls={open ? menuId : undefined}
                aria-expanded={open}
                aria-haspopup="menu"
                icon={<SvgMoreHoriz />}
                iconOnly
                innerRef={elements.setReference}
                label={`Show ${label}`}
                onClick={() => (open ? closeMenu() : setActiveElementId(items[0]?.id))}
                onKeyDown={handleKeyDown({
                    ArrowDown: () => {
                        if (!open) setActiveElementId(items[0]?.id);
                    },
                })}
                size="small"
                variant="tertiary"
            />
            {open && (
                <Menu
                    id={menuId}
                    innerRef={elements.setFloating}
                    label={label}
                    onKeyDown={handleKeyDown(
                        {
                            ...arrowKeyCallbacks,
                            Escape: closeAndRefocus,
                        },
                        { preventDefault: true, stopPropagation: true },
                    )}
                    owner="Breadcrumb"
                    role="menu"
                    style={{
                        ...scrollListItemsStyle(scrollLimit, items.length),
                        ...floatingStyles,
                        width: 'fit-content',
                        maxWidth: '300px',
                        minWidth: '150px',
                    }}
                >
                    {items.map((item) => (
                        <ListItem
                            key={item.id}
                            role="menuitem"
                            {...item}
                            active={activeElementId === item.id}
                            tabIndex={activeElementId === item.id ? 0 : -1}
                        />
                    ))}
                </Menu>
            )}
            <SvgChevronRight aria-hidden />
        </li>
    );
}
