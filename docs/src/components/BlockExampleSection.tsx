import { Flex } from '@ptrn/react/Flex';
import { SegmentedControl } from '@ptrn/react/SegmentedControl';
import { BlockConfig } from '@ptrn/react/types/meta';
import { useState } from 'react';
import { CodePlayground } from './CodePlayground';
import { kebabCase } from 'src/utils/kebabCase';

export function BlockExampleSection({ name, component, pattern, index }: BlockConfig & { index: number }) {
    const [value, setValue] = useState('component' as 'component' | 'pattern');

    return (
        <Flex direction="column" full gap="16" style={{ margin: 'var(--usa-spacing-5) 0' }}>
            <Flex align="center" full justify="space-between">
                <h3 id={kebabCase(`section-${name}`)}>{name}</h3>
                <SegmentedControl
                    label="Type"
                    onChange={(next) => setValue(next as 'component' | 'pattern')}
                    options={[
                        { label: 'Component', value: 'component' },
                        { label: 'Pattern', value: 'pattern' },
                    ]}
                    value={value}
                />
            </Flex>
            <CodePlayground defaultCode={value === 'component' ? component : pattern} defaultShowCode={index === 0} />
        </Flex>
    );
}
