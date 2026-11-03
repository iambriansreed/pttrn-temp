import { SvgLink } from '@ptrn/icons/Link';
import { SvgMenu } from '@ptrn/icons/Menu';
import { Card } from '@ptrn/react/Card/Card';
import { Fab } from '@ptrn/react/Fab/Fab';
import { Portal } from '@ptrn/react/Portal/Portal';
import { Txt } from '@ptrn/react/Txt';
import { useFloating } from '@ptrn/react/hooks/useFloating';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { kebabCase } from 'src/utils/kebabCase';

type NavItem = {
    title: string;
    hash: string;
    level: number;
    element: HTMLElement;
};

/**
 * Displays the nav targets in the screen.
 *
 * All headers (h1-h6) within the main content area are used to build the nav.
 *
 * Use title attribute on headers to set the text used in the nav. If title is not set, the text content of the header
 * is used.
 *
 * If id is not set on the header, it will be generated from the title or text content.
 *
 * @name NavContents
 */
export function NavContents() {
    const location = useLocation();
    const [menuItems, setMenuItems] = useState<NavItem[]>([]);

    useEffect(() => {
        const mainElement = document.querySelector<HTMLElement>('[data-main]');

        const nextMenuItems: NavItem[] = Array.from(
            mainElement?.querySelectorAll<HTMLElement>(`h1, h2, h3, h4, h5, h6`) || [],
        )
            .filter((element) => {
                // element does not exist in code playgrounds
                return !element.closest('[data-code-editor]') && !element.closest('[data-example]');
            })
            .map((element) => {
                const title = element.title || element.textContent;
                element.id = element.id || kebabCase(title);
                const next = {
                    title: title,
                    hash: `#${element.id}`,
                    level: parseInt(element.tagName.substring(1), 10) - 2,
                    element,
                };
                element.dataset.navTarget = 'true';
                return next;
            });

        setMenuItems(nextMenuItems);
    }, [location.pathname]);

    const [isOpen, setIsOpen] = useState(false);

    const { elements, floatingStyles } = useFloating({
        placement: 'bottom-end',
    });

    const [transitionStyles, setTransitionStyles] = useState<React.CSSProperties>({});

    const previousIsOpen = useRef(isOpen);

    useEffect(() => {
        if (previousIsOpen.current !== isOpen) {
            if (isOpen) {
                setTransitionStyles({
                    opacity: 1,
                    transform: 'translateY(0)',
                    transition: 'opacity 300ms ease-in, transform 300ms ease-in',
                });
            } else {
                setTransitionStyles({
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    transition: 'opacity 300ms ease-out, transform 300ms ease-out',
                });
            }
            previousIsOpen.current = isOpen;
        }
    }, [isOpen]);

    return menuItems.length < 2 ? null : (
        <>
            <Fab
                container="page"
                data-nav-button
                icon={<SvgMenu />}
                iconOnly
                innerRef={elements.setReference}
                label="On this page"
                onClick={() => setIsOpen(!isOpen)}
                onMouseOver={() => setIsOpen(true)}
                placement="top-right"
                variant="neutral"
            />
            {isOpen && (
                <Card
                    data-nav-contents
                    innerRef={elements.setFloating}
                    onMouseLeave={() => setIsOpen(false)}
                    style={{ ...floatingStyles, ...transitionStyles }}
                >
                    <Txt as="div" variant="body-small">
                        On this page
                    </Txt>
                    <nav>
                        {menuItems.flatMap(
                            (link, index) =>
                                !!link && (
                                    <Link
                                        data-level={link.level}
                                        data-pttrn="link"
                                        data-selected={location.hash === link.hash || undefined}
                                        data-subtle
                                        key={`${link.hash}-${index}`}
                                        to={link.hash}
                                    >
                                        {link.title}
                                    </Link>
                                ),
                        )}
                    </nav>
                </Card>
            )}
            {menuItems.map((link, index) => (
                <Portal container={link.element} key={index}>
                    <a aria-label={link.title} data-nav-link href={link.hash}>
                        <SvgLink />
                    </a>
                </Portal>
            ))}
        </>
    );
}
