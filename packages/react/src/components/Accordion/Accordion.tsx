/* eslint-disable @cspell/spellchecker */
import './accordion.scss';
import { SvgKeyboardArrowDown } from '@ptrn/icons/KeyboardArrowDown';
import { SvgKeyboardArrowUp } from '@ptrn/icons/KeyboardArrowUp';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { randomString } from '-/utils/random';

export type AccordionSection = {
    /**
     * The content of the accordion.
     *
     * @required
     */
    children: ReactNode;
    /**
     * The title of the accordion.
     *
     * @required
     */
    title: string;
    /** The subtitle of the accordion. */
    subtitle?: string;
    /** The leading element to display in the accordion header. */
    leading?: ReactNode;
    /** The trailing element to display in the accordion header. */
    trailing?: ReactNode;
    /**
     * If the accordion is initially open.
     *
     * This is ignored if the accordion section disabled property is true.
     *
     * @default false
     */
    isOpen?: boolean;
    /**
     * Indicates whether the accordion is disabled.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * The unique identifier for the accordion item.
     *
     * If not provided it will be generated automatically.
     */
    id?: string;
};

export type AccordionProps = {
    /**
     * Array of accordion sections
     *
     * @type Array<AccordionSection>
     * @required
     */
    items: AccordionSection[];
    /**
     * If true only one accordion section can be opened at a time
     *
     * @default true
     */
    singleOpen?: boolean;
};

/**
 * A vertical stack of collapsible panels or that allows customers to expand or collapse each panel individually to
 * reveal or hide their content.
 *
 * @example
 *     import { Accordion } from '@ptrn/react/Accordion';
 *
 *     <div style={{ width: 400 }}>
 *         <Accordion
 *             singleOpen={true}
 *             items={[
 *                 {
 *                     id: 1,
 *                     title: 'Lawrence Welk',
 *                     subtitle: 'The Champagne Music Maker',
 *                     children:
 *                         'Lawrence Welk was an American accordionist, bandleader, and television impresario, who hosted The Lawrence Welk Show from 1951 to 1982.',
 *                 },
 *                 {
 *                     id: 2,
 *                     title: 'Myron Floren',
 *                     subtitle: 'The Happy Norwegian',
 *                     children:
 *                         'Myron Floren was an American accordionist best known as the featured accordionist on The Lawrence Welk Show.',
 *                 },
 *             ]}
 *         />
 *     </div>;
 *
 * @name Accordion
 * @phase Stable
 */
export function Accordion({ items: itemsProp, singleOpen = true }: AccordionProps) {
    const items = useMemo(
        () =>
            itemsProp.map((item) => ({
                ...item,
                id: item.id || `accordion-item-${randomString(8)}`,
                isOpen: item.disabled ? false : item.isOpen || false,
            })),
        [itemsProp],
    );

    const [openSections, setOpenSections] = useState<string[]>(() => {
        return items.filter((item) => item.isOpen).map((item) => item.id);
    });

    useEffect(() => {
        // Update open sections based on the items prop
        setOpenSections(items.filter((item) => item.isOpen).map((item) => item.id));
    }, [items]);

    const toggleOpen = (itemId: string) => () =>
        setOpenSections((prev) => {
            const isSectionOpen = prev.includes(itemId);

            // If singleOpen is true, reset activeItems to only include the clicked item or empty if it was already active
            if (singleOpen) return isSectionOpen ? [] : [itemId];

            // If singleOpen is false, toggle the clicked item and keep others active
            return isSectionOpen ? prev.filter((activeItemId) => activeItemId !== itemId) : [...prev, itemId];
        });

    return (
        <div data-pttrn="accordion">
            {items.map(({ children, title, subtitle: subtitle, leading, trailing, disabled, id }, index) => {
                const isOpen = openSections.includes(id);
                return (
                    <section
                        data-disabled={disabled || undefined}
                        data-pttrn="accordion-item"
                        id={id}
                        key={id || index}
                    >
                        <button
                            aria-controls={`${id}-content`}
                            aria-expanded={isOpen}
                            data-header
                            disabled={disabled || undefined}
                            onClick={!disabled ? toggleOpen(id) : undefined}
                        >
                            {leading && <span data-leading>{leading}</span>}
                            <span data-title-subtitle>
                                <span data-title>{title}</span>
                                {subtitle && <span data-subtitle>{subtitle}</span>}
                            </span>
                            {trailing && <span data-trailing>{trailing}</span>}
                            <span data-arrow>{isOpen ? <SvgKeyboardArrowUp /> : <SvgKeyboardArrowDown />}</span>
                        </button>
                        {isOpen && (
                            <div data-content id={`${id}-content`}>
                                {children}
                            </div>
                        )}
                        <span data-divider />
                    </section>
                );
            })}
        </div>
    );
}
