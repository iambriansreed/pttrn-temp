import { CODES } from './codes';
import { FlagProps } from '.';
import { ComponentExample, Preset } from '-/utils/demo';

export const presets: Preset<FlagProps>[] = [
    { label: 'Small', propState: { code: 'us', size: 16 } },
    { label: 'Large', propState: { code: 'us', size: 64 } },
    { label: 'European Union', propState: { code: '_European_Union' } },
];

export const FlagExample: ComponentExample<FlagProps> = {
    defaultState: { code: 'us' },
    presets,
    variants: false,
    sections: [
        {
            title: 'All flags',
            description: 'Every flag in the sprite, by code.',
            content: ({ Component }) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--usa-spacing-2)' }}>
                    {CODES.map((code) => (
                        <div
                            key={code}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--usa-spacing-1)',
                                width: 200,
                            }}
                        >
                            {Component && <Component code={code} />}
                            <code>{code}</code>
                        </div>
                    ))}
                </div>
            ),
        },
    ],
};
