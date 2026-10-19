import { Table } from '@ptrn/react/Table';
import { Tag } from '@ptrn/react/Tag';
import { Txt } from '@ptrn/react/Txt';
import { Fragment } from 'react';
import { Markup } from 'components/Markup';
import { ComponentSpec } from 'src/meta';
import { webComponents } from 'src/wc';

const column = (key: string, label: string, width = 'auto') => ({
    key,
    label,
    width,
    valign: 'top' as const,
});

/**
 * The component's behavior specification, from `spec.ts` next to its source: anatomy, keyboard model, accessibility
 * requirements and the behaviors every implementation is tested against. The same data drives the React and Web
 * Component suites and is served by the MCP server.
 */
export function SpecSection({ name, spec }: { name: string; spec: ComponentSpec }) {
    const hasWebComponent = name in webComponents;

    return (
        <section data-spec>
            <h3 id="specification">Specification</h3>
            <p>{spec.summary}</p>

            <Txt as="h4" id="anatomy" variant="heading-h5">
                Anatomy
            </Txt>
            <Table
                columns={[column('part', 'Part'), column('role', 'Role'), column('description', 'Description', '1fr')]}
                data={spec.anatomy.map((part) => ({
                    id: part.part,
                    part: <code>{part.part}</code>,
                    role: part.role ? <code>{part.role}</code> : '',
                    description: part.description,
                }))}
                pageSize={100}
                size="small"
            />

            <Txt as="h4" id="keyboard" variant="heading-h5">
                Keyboard
            </Txt>
            {spec.keyboard.length === 0 ? (
                <p>The keyboard does not operate this component.</p>
            ) : (
                <Table
                    columns={[column('keys', 'Keys'), column('description', 'Does', '1fr')]}
                    data={spec.keyboard.map((entry, index) => ({
                        id: `${index}`,
                        keys: (
                            <span data-keys>
                                {entry.keys.map((key, i) => (
                                    <Fragment key={key}>
                                        {i > 0 && ' '}
                                        <kbd>{key}</kbd>
                                    </Fragment>
                                ))}
                            </span>
                        ),
                        description: entry.description,
                    }))}
                    pageSize={100}
                    size="small"
                />
            )}

            <Txt as="h4" id="accessibility-requirements" variant="heading-h5">
                Accessibility
            </Txt>
            <Table
                columns={[column('topic', 'Requirement'), column('text', 'Detail', '1fr')]}
                data={[
                    { id: 'roles', topic: 'Roles and states', text: spec.accessibility.roles },
                    { id: 'labels', topic: 'Labels', text: spec.accessibility.labels },
                    { id: 'focus', topic: 'Focus', text: spec.accessibility.focus },
                    ...(spec.accessibility.targetSize
                        ? [
                              {
                                  id: 'target',
                                  topic: 'Target size',
                                  text: `Each pointer target is at least ${spec.accessibility.targetSize} by ${spec.accessibility.targetSize} CSS pixels.`,
                              },
                          ]
                        : []),
                    ...(spec.accessibility.motion
                        ? [{ id: 'motion', topic: 'Motion', text: spec.accessibility.motion }]
                        : []),
                ]}
                pageSize={100}
                size="small"
            />

            <Txt as="h4" id="behaviors" variant="heading-h5">
                Behaviors
            </Txt>
            <p>
                Each behavior is a test in the React suite{hasWebComponent && ' and in the Web Component suite'}. A
                suite that misses one fails, so this list is what both implementations are held to.
            </p>
            <Table
                columns={[
                    column('behavior', 'Behavior'),
                    column('description', 'Description', '1fr'),
                    column('tested', 'Tested in'),
                ]}
                data={spec.behaviors.map((behavior) => ({
                    id: behavior.id,
                    behavior: <code>{behavior.id}</code>,
                    description: <Markup>{behavior.description}</Markup>,
                    tested: (
                        <span style={{ display: 'flex', gap: 'var(--usa-spacing-05)', flexWrap: 'wrap' }}>
                            <Tag color="success" label="React" size="x-small" variant="flat" />
                            {hasWebComponent && (
                                <Tag color="success" label="Web Component" size="x-small" variant="flat" />
                            )}
                        </span>
                    ),
                }))}
                pageSize={100}
                size="small"
            />
        </section>
    );
}
