import { useEffect } from 'react';
import { Avatar, AvatarProps, SizeVariant } from '-/components/Avatar';
import { ListItem } from '-/components/ListItem';
import { Menu } from '-/components/Menu';
import { Portal } from '-/components/Portal';
import { useArrowNavigation } from '-/hooks/useArrowNavigation';
import { useFloating } from '-/hooks/useFloating';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { getElementById } from '-/utils/dom';
import { handleKeyDown } from '-/utils/handleKeyDown';
import { scrollListItemsStyle } from '-/utils/scrollListItemsStyle';
import { useIds } from '-/utils/useIds';

export type AvatarGroupOverflowProps = {
    /** The number of overflow avatars */
    overflow: number;
    /** The size of the avatar group */
    size: SizeVariant;
    /** The avatars in the overflow */
    items: AvatarProps[];
};

export function AvatarGroupOverflow({ items: itemsProp, overflow, size }: AvatarGroupOverflowProps) {
    const items = useIds(`avatar-overflow`, itemsProp);
    const menuId = `avatar-overflow-menu-${items[0]?.id}`;

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

    // Focus follows the active item while the menu is open. The menu mounts through a portal one render after it
    // opens, so the first attempt may find nothing and a retry on the next tick lands it.
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

    return (
        <>
            <button
                aria-controls={open ? menuId : undefined}
                aria-expanded={open}
                aria-haspopup="menu"
                data-pttrn="avatar"
                data-pttrn-owner="avatar-overflow"
                data-size={size}
                onClick={() => (open ? closeMenu() : setActiveElementId(items[0]?.id))}
                onKeyDown={handleKeyDown({
                    ArrowDown: () => {
                        if (!open) setActiveElementId(items[0]?.id);
                    },
                })}
                ref={elements.setReference}
                type="button"
            >
                <span data-overflow-count>+{overflow}</span>
                <span data-sr-only>{` more avatar${overflow > 1 ? 's' : ''}`}</span>
            </button>
            {open && (
                <Portal>
                    <Menu
                        id={menuId}
                        innerRef={elements.setFloating}
                        label={`${overflow} more avatar${overflow > 1 ? 's' : ''}`}
                        onKeyDown={handleKeyDown(
                            {
                                ...arrowKeyCallbacks,
                                Escape: closeAndRefocus,
                            },
                            { preventDefault: true, stopPropagation: true },
                        )}
                        role="menu"
                        style={{
                            ...floatingStyles,
                            ...scrollListItemsStyle(5, items.length),
                            '--list-item-height': `var(--usa-spacing-6)`,
                            paddingRight: 'var(--usa-spacing-2)',
                        }}
                        width="fit-content"
                    >
                        {items.map((item, index) => (
                            <ListItem
                                active={activeElementId === item.id}
                                aria-label={item.name}
                                id={item.id}
                                key={index}
                                label={item.name}
                                leading={<Avatar {...item} hideTooltip size="small" />}
                                role="menuitem"
                                tabIndex={activeElementId === item.id ? 0 : -1}
                            />
                        ))}
                    </Menu>
                </Portal>
            )}
        </>
    );
}
