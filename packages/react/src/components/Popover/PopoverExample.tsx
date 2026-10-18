import { PopoverProps } from '.';
import { Button } from '-/components/Button';
import { Txt } from '-/components/Txt';
import { ComponentExampleFn } from '-/utils/demo';

export const PopoverExample: ComponentExampleFn<PopoverProps> = ({ action }) => ({
    render: ({ props, Component }) => {
        return (
            <>
                <Txt style={{ marginBottom: `var(--usa-spacing-1)` }}>Click for a Popover</Txt>
                <Component {...props}>
                    {(triggerProps) => <Button label={`${props.placement}`} variant="secondary" {...triggerProps} />}
                </Component>
            </>
        );
    },
    presets: [
        {
            label: 'With CallToAction',
            propState: {
                header: 'With CallToAction',
                content: 'With CallToAction body',
                callToAction: {
                    label: 'CTA Button',
                    onClick: () => action('Call to action clicked!'),
                },
                children: () => null,
            },
        },
        {
            label: 'With both CallToActions',
            propState: {
                header: 'With both CallToActions',
                content: 'With both CallToActions body',
                callToAction: {
                    label: 'Primary',
                    onClick: () => action('Primary call to action clicked!'),
                },
                secondaryCallToAction: {
                    label: 'Secondary',
                    onClick: () => action('Secondary call to action clicked!'),
                },
                children: () => null,
            },
        },
    ],
    variants: false,
});
