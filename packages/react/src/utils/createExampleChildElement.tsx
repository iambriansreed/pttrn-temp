import { SvgContentCopy } from '@ptrn/icons/ContentCopy';
import { SvgDiamond } from '@ptrn/icons/Diamond';
import { ReactElement } from 'react';
import { DemoAction, DemoSetState } from './demo';
import { Avatar } from '-/components/Avatar';
import { Button } from '-/components/Button';
import { Checkbox } from '-/components/Checkbox';
import { Img } from '-/components/Img';
import { Radio } from '-/components/Radio';
import { Switch } from '-/components/Switch';
import { Tag } from '-/components/Tag';
import { Txt } from '-/components/Txt';

export type ExampleChildElementProps = {
    exampleState: Record<string, any>;
    name: string;
    setState: DemoSetState;
    action: DemoAction;
    id?: string;
};

/**
 * Returns example leading and trailing components for use in component examples. Allows which type of element is
 * rendered to be determined by the example state.
 */
export function createExampleChildElement({ exampleState, name, setState, action, id }: ExampleChildElementProps): {
    element: ReactElement | null;
    componentName?: string;
} {
    const componentName = exampleState[name];

    if (componentName === 'Checkbox' || componentName === 'Radio' || componentName === 'Switch') {
        let As: typeof Checkbox | typeof Radio | typeof Switch = Checkbox;
        if (componentName === 'Radio') As = Radio;
        else if (componentName === 'Switch') As = Switch;

        const toggleName = `data-${name}-toggle-${id}`;

        return {
            element: (
                <As
                    aria-label={`${componentName} demo`}
                    checked={exampleState[toggleName]}
                    disabled={exampleState.disabled}
                    name={`${name}-toggle`}
                    onChange={(checked: boolean) => {
                        setState({ [toggleName]: checked });
                    }}
                    onClick={() => action(`${name} ${componentName} clicked`)}
                    readOnly={exampleState.readOnly}
                    value={`${name}-${componentName}`}
                />
            ),
            componentName,
        };
    }

    if (componentName === 'Button')
        return {
            element: (
                <Button icon={<SvgContentCopy />} label="LI Button" onClick={() => action('ListItem button clicked')} />
            ),
            componentName,
        };

    if (componentName === 'Img') return { element: <Img alt="placeholder" src="/placeholder.svg" /> };

    if (componentName === 'Avatar') return { element: <Avatar hideTooltip={false} name="List Item" /> };

    if (componentName === 'Tag') {
        return { element: <Tag label="Tag" /> };
    }

    if (componentName === 'Txt') return { element: <Txt>Text</Txt> };

    if (componentName === 'Icon') return { element: <SvgDiamond /> };

    return { element: null };
}
