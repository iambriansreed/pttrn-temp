import { Fragment } from 'react';

import { LinkProps, Link } from '.';
import { Txt } from '-/components/Txt';
import { useId } from '-/hooks/useId';
import { ComponentExample, Preset } from '-/utils/demo';

export const presets: Preset<LinkProps>[] = [];

export const LinkExample: ComponentExample<LinkProps> = {
    containerStyle: {
        width: '100%',
    },
    render: ({ props, Component }) => {
        return (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'center',
                    background: props.variant === 'subtle-inverse' ? 'black' : '',
                    minHeight: 'calc(var(--usa-spacing-15) + var(--usa-spacing-3) + var(--usa-spacing-05))',
                }}
            >
                <Component {...props} />
            </div>
        );
    },
    sections: [
        {
            title: 'Variants with Pseudo States',
            content: ({ props }) => <LinkDemo props={props} />,
        },
    ],
    presets,
};

/**
 * This component demonstrates the different pseudo states of the Link component.
 *
 * It is used in the LinkExample preset "Pseudo States", and also the Typography page.
 */
export function LinkDemo(params: { props?: LinkProps }) {
    const states = ['default', 'hover', 'active', 'disabled', 'visited', 'focus'];

    const id = useId();

    return (
        <div data-links-grid>
            <div />
            {states.map((state) => (
                <Txt key={state} variant="labels-large">
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                </Txt>
            ))}
            {['default', 'subtle', 'subtle-inverse'].map((kind) => (
                <Fragment key={`${kind}-row`}>
                    <Txt key={`${kind}-title`} variant="labels-large">
                        {kind.charAt(0).toUpperCase() + kind.slice(1)}
                    </Txt>
                    {states.map((state) => {
                        const attr: Record<string, unknown> = {};

                        if (state === 'disabled') {
                            attr['disabled'] = true;
                        } else if (state !== 'default') {
                            attr[`data-pseudo`] = state;
                        }

                        if (kind !== 'default') attr[`data-${kind}`] = true;

                        return (
                            <div data-kind={kind} key={`${kind}-${state}`}>
                                {!params.props ? (
                                    <a href={`https://pttrn.iambrian.com/fake-link/${id}+${kind}+${state}`} {...attr}>
                                        Link Text
                                    </a>
                                ) : (
                                    <Link
                                        {...params.props}
                                        label="Link Text"
                                        {...attr}
                                        variant={kind as LinkProps['variant']}
                                    />
                                )}
                            </div>
                        );
                    })}
                </Fragment>
            ))}
        </div>
    );
}
