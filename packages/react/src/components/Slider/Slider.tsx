import './slider.scss';
import { useEffect, useRef, useState } from 'react';
import { SliderIntervalDots } from './SliderIntervalDots';
import { useNormalizeSliderValue } from './useNormalizeSliderValue';
import { Txt } from '-/components/Txt';
import { CommonPropsLibrary } from '-/types/common';

export type SliderValue = number | [number, number];

export type SliderProps<Value> = Pick<CommonPropsLibrary, 'disabled' | 'readOnly'> & {
    /**
     * The label of the slider.
     *
     * @required
     */
    label: string;
    /**
     * The numerical value of the slider.
     *
     * Providing an array of two numbers will create a **range slider**.
     *
     * @required
     */
    value: Value;
    /**
     * Invoked with the new value when value changes.
     *
     * @required
     */
    onChange: (newValue: Value) => void;
    /**
     * The minimum value of the slider.
     *
     * @required
     */
    min: number;
    /**
     * The maximum value of the slider.;
     *
     * @required
     */
    max: number;
    /**
     * Indicates if marks should be displayed on the slider.
     *
     * @default false
     */
    marks?: boolean;
    /**
     * The number that specifies the granularity that the value must adhere to
     *
     * @default 1
     */
    step?: number;
    /**
     * Optional function to format the display of each number.
     *
     * Useful for currency, percentages, etc.
     */
    formatNumber?: (value: number, context?: 'max' | 'min' | 'rangeEnd' | 'rangeStart') => string;
    /**
     * The name of the slider input, useful for form submissions.
     *
     * @required
     */
    name: string;
};

/**
 * A control element that allows customers to select a value or adjust a setting by moving the handle along a horizontal
 * track.
 *
 * @example
 *     import { Slider } from '-/components/Slider';
 *
 *     () => {
 *         const [value, setValue] = useState(50);
 *
 *         return (
 *             <div style={{ width: '100%' }}>
 *                 <Slider
 *                     label="Slider Example"
 *                     max={100}
 *                     min={0}
 *                     name="slider-example"
 *                     onChange={setValue}
 *                     value={value}
 *                 />
 *                 <p>
 *                     <br />
 *                     Current Value: {value}
 *                 </p>
 *             </div>
 *         );
 *     };
 *
 * @name Slider
 * @phase Stable
 */
export function Slider<V = SliderValue>({
    value: valueProp,
    onChange: onChangeProp,
    min,
    max,
    label,
    marks = false,
    step = 1,
    disabled = false,
    readOnly = false,
    name,
    formatNumber: formatNumberProp,
}: SliderProps<V>) {
    // The value prop drives the slider; the internal copy only covers a render before the parent catches up.
    const [internalValue, setInternalValue] = useState<V>((valueProp || min) as V);
    const value = (valueProp === undefined || valueProp === null ? internalValue : valueProp) as V;
    const onChange = (next: V) => {
        setInternalValue(next);
        onChangeProp?.(next);
    };

    const formatNumber: SliderProps<V>['formatNumber'] = (rawValue, context) =>
        formatNumberProp?.(rawValue, context) || rawValue.toString();
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef<0 | 1 | null>(null);
    const { normalizeSliderValue } = useNormalizeSliderValue({ min, max, step });

    const isRange = Array.isArray(value);
    let val0: number = isRange ? value[0] : value;
    let val1: number = isRange ? value[1] : value;

    // Always show the lower value first
    if (isRange && val0 > val1) {
        [val0, val1] = [val1, val0];
    }

    const displayValue = isRange
        ? [formatNumber(val0, 'rangeStart'), formatNumber(val1, 'rangeEnd')].join(' - ')
        : formatNumber(val0, 'rangeStart');

    const percent0 = Math.min(Math.max(((val0 - min) / (max - min)) * 100, 0), 100);
    const percent1 = Math.min(Math.max(((val1 - min) / (max - min)) * 100, 0), 100);

    const getValueFromPosition = (clientX: number) => {
        const slider = sliderRef.current;
        if (!slider) return min;
        const { left, width } = slider.getBoundingClientRect();
        let percent = (clientX - left) / width;
        percent = Math.max(0, Math.min(1, percent));
        return normalizeSliderValue(min + percent * (max - min));
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDraggingRef.current === null || disabled || readOnly) return;
        const newValue = getValueFromPosition(e.clientX);
        const normalValue = normalizeSliderValue(newValue);
        let nextValue: number | [number, number] = normalValue;
        if (isRange) nextValue = isDraggingRef.current === 0 ? [normalValue, val1] : [val0, normalValue];
        onChange(nextValue as V);
    };

    const handleMouseUp = () => {
        isDraggingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || readOnly) return;
        const clickValue = getValueFromPosition(e.clientX);
        let nextValue: number | [number, number] = normalizeSliderValue(clickValue);

        if (isRange) {
            if (Math.abs(clickValue - val0) < Math.abs(clickValue - val1)) {
                nextValue = [clickValue, val1];
                isDraggingRef.current = 0;
            } else {
                nextValue = [val0, clickValue];
                isDraggingRef.current = 1;
            }
        }

        onChange(nextValue as V);
    };

    const handleKnobMouseDown = (knobIndex: 0 | 1) => (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || readOnly) return;
        e.stopPropagation();
        isDraggingRef.current = knobIndex;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleKnobKeyDown = (knobIndex: 0 | 1) => (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled || readOnly) return;
        let newValue = knobIndex === 0 ? val0 : val1;
        if (e.key === 'ArrowLeft') newValue -= step;
        else if (e.key === 'ArrowRight') newValue += step;
        else return;
        newValue = normalizeSliderValue(newValue);

        let nextValue: number | [number, number] = newValue;
        if (isRange) {
            if (knobIndex === 0) nextValue = [newValue, val1];
            else nextValue = [val0, newValue];
        }

        onChange(nextValue as V);
    };

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div data-disabled={disabled || undefined} data-pttrn="slider" data-readonly={readOnly || undefined}>
            <input name={name} type="hidden" value={isRange ? `${val0},${val1}` : val0} />
            <div data-top-labels>
                <Txt variant="labels-small">{label}</Txt>
                <Txt data-value-label>{displayValue}</Txt>
            </div>
            <div data-slider-parent>
                {/* The knobs are the sliders and take the keyboard; the track only takes pointer clicks. */}
                <div aria-hidden="true" data-slider-body onClick={handleTrackClick} ref={sliderRef}>
                    <div data-slider-background />
                    <div
                        data-slider-fill
                        style={{
                            left: isRange ? `${percent0}%` : '0%',
                            width: isRange ? `${percent1 - percent0}%` : `${percent0}%`,
                        }}
                    />
                    {marks && (
                        <SliderIntervalDots max={max} min={min} step={step} value={isRange ? [val0, val1] : val0} />
                    )}
                </div>
                {isRange && (
                    <div
                        aria-disabled={disabled || undefined}
                        aria-label={`${label} start`}
                        aria-readonly={readOnly || undefined}
                        aria-valuemax={max}
                        aria-valuemin={min}
                        aria-valuenow={val0}
                        aria-valuetext={val0.toString()}
                        data-slider-knob
                        onKeyDown={handleKnobKeyDown(0)}
                        onMouseDown={handleKnobMouseDown(0)}
                        role="slider"
                        style={{ left: `calc(${percent0}% - 8px)` }}
                        tabIndex={disabled ? -1 : 0}
                    />
                )}
                <div
                    aria-disabled={disabled || undefined}
                    aria-label={isRange ? `${label} end` : label}
                    aria-readonly={readOnly || undefined}
                    aria-valuemax={max}
                    aria-valuemin={min}
                    aria-valuenow={val1}
                    aria-valuetext={isRange ? val1?.toString() : displayValue}
                    data-slider-knob
                    onKeyDown={handleKnobKeyDown(isRange ? 1 : 0)}
                    onMouseDown={handleKnobMouseDown(isRange ? 1 : 0)}
                    role="slider"
                    style={{ left: `calc(${percent1}% - 8px)` }}
                    tabIndex={disabled ? -1 : 0}
                />
            </div>
            <div data-bottom-labels>
                <Txt data-min-label variant="body-small">
                    {formatNumber(min, 'min')}
                </Txt>
                <Txt data-max-label variant="body-small">
                    {formatNumber(max, 'max')}
                </Txt>
            </div>
        </div>
    );
}
