import { useEffect, useState } from 'react';
import { SkeletonProps, SkeletonVariant } from '.';
import { Avatar } from '-/components/Avatar';
import { ExamplePlaceholder } from '-/components/ExamplePlaceholder';
import { ComponentExample, ComponentExampleRenderProps, Preset } from '-/utils/demo';

export const presets: Preset<SkeletonProps>[] = [
    {
        label: 'Loading Transition',
        propState: {
            width: '100px',
            height: '100px',
        },
    },
];

export const SkeletonExample: ComponentExample<SkeletonProps> = {
    render: ({ props, preset, Component }) => {
        if (preset?.label === 'Loading Transition') return <SkeletonTransition Component={Component} props={props} />;

        return <Component {...props} />;
    },
    presets,
};

function SkeletonTransition({
    Component,
    props,
}: Pick<ComponentExampleRenderProps<SkeletonProps>, 'Component' | 'props'>) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setTimeout(() => setLoaded(true), 3000);
    }, []);

    return <Component {...props}>{loaded && PROP_VARIANT_CHILDREN[props!.variant as SkeletonVariant]}</Component>;
}

const PROP_VARIANT_CHILDREN: Record<SkeletonVariant, SkeletonProps['children']> = {
    rectangular: <ExamplePlaceholder height="100px" width="100px" />,
    circular: <ExamplePlaceholder height="100px" style={{ borderRadius: '100%' }} width="100px" />,
    photo: (
        <ExamplePlaceholder height="100px" width="100px">
            Loaded
        </ExamplePlaceholder>
    ),
    profile: <Avatar color="error" name="Bob Robertson" />,
    thumbnail: <ExamplePlaceholder height="100px" width="100px" />,
};
