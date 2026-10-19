import { TimePickerType } from './Segment';
import { useArrowNavigation } from '-/hooks/useArrowNavigation';
import { getElementById } from '-/utils/dom';
import { handleKeyDown } from '-/utils/handleKeyDown';

export type Option = {
    id: string;
    value: string;
    label: string;
};

export type TimePickerListboxProps = {
    options: Option[];
    selectedValue?: string;
    type: TimePickerType;
    onSelect?: (value: string) => void;
    onTab?: (e: React.KeyboardEvent) => void;
};

/**
 * TimePickerListbox component displays a listbox for selecting time values.
 *
 * @name TimePickerListbox
 * @parent TimePicker
 */
export function TimePickerListbox({ options, selectedValue, type: kind, onSelect, onTab }: TimePickerListboxProps) {
    const { activeElementId, arrowKeyCallbacks } = useArrowNavigation({
        ids: options.map((option) => option.id),
        defaultActiveId: (options.find((option) => option.value === selectedValue) || options[0])?.id || null,
    });

    const enterSpaceClick = () => {
        if (activeElementId) getElementById(activeElementId)?.click();
    };

    return (
        <div
            aria-activedescendant={activeElementId || undefined}
            aria-label={`Select ${kind}`}
            data-pttrn="time-picker-listbox"
            data-scroll-column={kind}
            data-type={kind}
            data-visible={true}
            id={`${kind}-listbox`}
            onClickCapture={(event) => {
                const target = event.target as HTMLSpanElement;
                if (target.dataset.value) onSelect?.(target.dataset.value);
            }}
            onKeyDown={handleKeyDown({
                ...arrowKeyCallbacks,
                Enter: enterSpaceClick,
                Space: enterSpaceClick,
                Tab: onTab,
            })}
            role="listbox"
            tabIndex={0}
        >
            {options.map((option, index) => (
                <span
                    aria-label={option.label}
                    aria-selected={option.value === selectedValue}
                    data-active={activeElementId === option.id || undefined}
                    data-index={index}
                    data-value={option.value}
                    id={option.id}
                    key={option.id}
                    role="option"
                >
                    {`${option.label}`.padStart(2, '0')}
                </span>
            ))}
        </div>
    );
}
