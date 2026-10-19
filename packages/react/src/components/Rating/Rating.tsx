import './rating.scss';
import { SvgStarFill } from '@ptrn/icons/StarFill';
import { useRef } from 'react';
import { useControlledState } from '-/hooks/useControlledState';
import { handleKeyDown } from '-/utils/handleKeyDown';

export type RatingSize = 'large' | 'medium' | 'small';
export type RatingProps = {
    /**
     * The value of the rating between 0 and 5.
     *
     * @default 0
     * @minimum 0
     * @maximum 5
     */
    value?: number;
    /**
     * If included the component is interactive and this callback is fired when the user selects a new rating value.
     *
     * @param value - The new value of the rating.
     */
    onChange?: (value: number) => void;
    /**
     * The size of the rating.
     *
     * @default medium
     */
    size?: RatingSize;
};

const MAX_STARS = 5;
const iconWidths: Record<RatingSize, number> = {
    large: 32,
    medium: 24,
    small: 16,
};

/**
 * Descriptive and interactive controls that allow customers to indicate their feelings about an experience or product
 * on a scale of 1 to 5. Half sizes are displayed when interactive is false.
 *
 * @example
 *     import { Rating } from '@ptrn/react/Rating';
 *
 *     <Rating value={4.5} size="large" />;
 *
 * @name Rating
 * @phase Stable
 */
export function Rating({ size = 'medium', value: valueProp, onChange: onChangeProp }: RatingProps) {
    const [value, onChange] = useControlledState(valueProp, onChangeProp);
    const group = useRef<HTMLDivElement>(null);
    // The star that holds the choice: 3 for a value of 3, 5 for 4.5, none before a choice is made.
    const chosenStar = value === undefined ? 0 : Math.ceil(value);
    const choose = (star: number) => {
        const next = Math.min(MAX_STARS, Math.max(1, star));
        onChange(next);
        group.current?.querySelectorAll<HTMLButtonElement>(':scope > [data-star]')[next - 1]?.focus();
    };

    if (!onChangeProp)
        return (
            <div
                aria-label={value ? `${value} out of ${MAX_STARS} stars` : 'Rating'}
                data-pttrn="rating"
                data-size={size}
                role="img"
            >
                {Array.from({ length: MAX_STARS }, (_, index) => {
                    const fill = getFill(index + 1, value);
                    return (
                        <div data-fill={fill} data-star key={index} role="presentation" tabIndex={-1}>
                            <SvgStarFill width={iconWidths[size]} />
                            {fill === 'half' && (
                                <div data-fill-half>
                                    <div data-star>
                                        <SvgStarFill width={iconWidths[size]} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );

    return (
        <div
            aria-label={value ? `${value} out of ${MAX_STARS} stars` : 'Select a star rating'}
            data-pttrn="rating"
            data-size={size}
            ref={group}
            role="radiogroup"
        >
            {Array.from({ length: MAX_STARS }, (_, index) => {
                const fill = getFill(index + 1, value);
                const selected = chosenStar === index + 1;
                return (
                    <button
                        aria-checked={selected}
                        aria-label={`Rate ${index + 1}`}
                        data-fill={fill}
                        data-star
                        key={index}
                        onClick={() => onChange?.(index + 1)}
                        // The arrows move the choice as in any radio group; before a choice, the first star is the tab stop.
                        onKeyDown={handleKeyDown(
                            {
                                ArrowRight: () => choose(chosenStar + 1),
                                ArrowDown: () => choose(chosenStar + 1),
                                ArrowLeft: () => choose(chosenStar - 1),
                                ArrowUp: () => choose(chosenStar - 1),
                            },
                            { preventDefault: true },
                        )}
                        role="radio"
                        tabIndex={(chosenStar ? selected : index === 0) ? 0 : -1}
                        type="button"
                    >
                        <SvgStarFill width={iconWidths[size]} />
                        {fill === 'half' && (
                            <div data-fill-half>
                                <div data-star>
                                    <SvgStarFill width={iconWidths[size]} />
                                </div>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function getFill(num: number, value?: number): 'full' | 'half' | undefined {
    if (value === undefined) return undefined;
    if (value >= num) return 'full';
    if (value == num - 0.5) return 'half';
    return undefined;
}
