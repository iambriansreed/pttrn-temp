import { Table } from '@ptrn/react/Table';
import { Txt } from '@ptrn/react/Txt';
import manifest from '@ptrn/web/custom-elements.json';
import { Markup } from 'components/Markup';

type Typed = { name: string; type?: { text: string }; default?: string; description?: string };
type Named = { name?: string; description?: string };
type Element = {
    tagName?: string;
    customElement?: boolean;
    summary?: string;
    description?: string;
    attributes?: Typed[];
    events?: Typed[];
    slots?: Named[];
    cssParts?: Named[];
};

const elements = (manifest as unknown as { modules: { declarations?: Element[] }[] }).modules
    .flatMap((module) => module.declarations ?? [])
    .filter((declaration) => declaration.customElement && declaration.tagName);

const column = (key: string, label: string, width = 'auto') => ({ key, label, width, valign: 'top' as const });
const code = (text?: string) => (text ? <code>{text}</code> : '');

/**
 * The elements behind one component (its tag and any `<tag>-*` children) as the Custom Elements Manifest describes
 * them: attributes, events, slots and CSS parts. `@ptrn/web` builds the manifest from the element sources, and editors
 * and the MCP server read the same file, so this table cannot drift from the code.
 */
export function WebComponentApi({ tag }: { tag: string }) {
    const own = elements.filter((element) => element.tagName === tag || element.tagName?.startsWith(`${tag}-`));
    if (own.length === 0) return null;

    return (
        <section data-wc-api>
            <h3 id="elements">Elements</h3>
            <p>
                From the package&apos;s Custom Elements Manifest, <code>@ptrn/web/custom-elements.json</code>, the file
                editors and the MCP server read too.
            </p>
            {own.map((element) => (
                <div key={element.tagName}>
                    <Txt as="h4" id={element.tagName} variant="heading-h5">
                        <code>{`<${element.tagName}>`}</code>
                    </Txt>
                    {!!(element.summary || element.description) && (
                        <Markup>{element.summary || element.description || ''}</Markup>
                    )}
                    {!!element.attributes?.length && (
                        <Table
                            columns={[
                                column('name', 'Attribute'),
                                column('type', 'Type'),
                                column('default', 'Default'),
                                column('description', 'Description', '1fr'),
                            ]}
                            data={element.attributes.map((attribute) => ({
                                id: attribute.name,
                                name: code(attribute.name),
                                type: code(attribute.type?.text),
                                default: code(attribute.default),
                                description: attribute.description ?? '',
                            }))}
                            pageSize={100}
                            size="small"
                        />
                    )}
                    {!!element.events?.length && (
                        <Table
                            columns={[
                                column('name', 'Event'),
                                column('type', 'Detail'),
                                column('description', 'Fires', '1fr'),
                            ]}
                            data={element.events.map((event) => ({
                                id: event.name,
                                name: code(event.name),
                                type: code(event.type?.text),
                                description: event.description ?? '',
                            }))}
                            pageSize={100}
                            size="small"
                        />
                    )}
                    {!!element.slots?.length && (
                        <Table
                            columns={[column('name', 'Slot'), column('description', 'Takes', '1fr')]}
                            data={element.slots.map((slot) => ({
                                id: slot.name || 'default',
                                name: code(slot.name || '(default)'),
                                description: slot.description ?? '',
                            }))}
                            pageSize={100}
                            size="small"
                        />
                    )}
                    {!!element.cssParts?.length && (
                        <Table
                            columns={[column('name', 'CSS part'), column('description', 'Styles', '1fr')]}
                            data={element.cssParts.map((part) => ({
                                id: part.name || '',
                                name: code(part.name),
                                description: part.description ?? '',
                            }))}
                            pageSize={100}
                            size="small"
                        />
                    )}
                </div>
            ))}
        </section>
    );
}
