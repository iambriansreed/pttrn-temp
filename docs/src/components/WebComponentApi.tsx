import { Table } from '@ptrn/react/Table';
import manifest from '@ptrn/web/custom-elements.json';
import { Markup } from 'components/Markup';
import { webComponents } from 'src/wc';

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

const componentTags = Object.values(webComponents).map((demo) => demo!.tag);

/**
 * The component an element belongs to: the longest component tag it is, or starts with. `pttrn-badge-dot` is its own
 * component, not a child of `pttrn-badge`, while `pttrn-accordion-item` belongs to `pttrn-accordion`.
 */
const ownerTag = (tagName: string) =>
    componentTags
        .filter((tag) => tagName === tag || tagName.startsWith(`${tag}-`))
        .sort((a, b) => b.length - a.length)[0];

// Every table names the member in a column of the same width, so the tables of one element line up; values take what
// they need and the description takes the rest.
const NAME_WIDTH = '11rem';
const VALUE_WIDTH = 'max-content';

const column = (key: string, label: string, width = '1fr') => ({ key, label, width, valign: 'top' as const });
const code = (text?: string) => (text ? <code>{text}</code> : '—');
const markup = (text?: string) => (text ? <Markup>{text}</Markup> : '—');

/**
 * The elements behind one component (its tag and any `<tag>-*` children) as the Custom Elements Manifest describes
 * them: attributes, events, slots and CSS parts. `@ptrn/web` builds the manifest from the element sources, and editors
 * and the MCP server read the same file, so these tables cannot drift from the code.
 */
export function WebComponentApi({ tag }: { tag: string }) {
    // The component's own element first, then its children. ownerTag keeps another component's elements out:
    // `pttrn-input-number` is not part of `pttrn-input`.
    const own = elements
        .filter((element) => ownerTag(element.tagName!) === tag)
        .sort((a, b) => (a.tagName === tag ? -1 : b.tagName === tag ? 1 : 0));
    if (own.length === 0) return null;

    return (
        <section data-wc-api>
            <h3 id="elements">Elements</h3>
            <p>
                From the package&apos;s Custom Elements Manifest, <code>@ptrn/web/custom-elements.json</code>, the file
                editors and the MCP server read too.
            </p>
            {own.map((element) => (
                <section data-wc-element key={element.tagName}>
                    <h4 id={element.tagName}>
                        <code>{`<${element.tagName}>`}</code>
                    </h4>
                    {markup(element.summary || element.description)}
                    {!!element.attributes?.length && (
                        <Table
                            columns={[
                                column('name', 'Attribute', NAME_WIDTH),
                                column('type', 'Type', VALUE_WIDTH),
                                column('default', 'Default', VALUE_WIDTH),
                                column('description', 'Description'),
                            ]}
                            data={element.attributes.map((attribute) => ({
                                id: attribute.name,
                                name: code(attribute.name),
                                type: code(attribute.type?.text),
                                default: code(attribute.default),
                                description: markup(attribute.description),
                            }))}
                            pageSize={100}
                            size="small"
                            title="Attributes"
                        />
                    )}
                    {!!element.events?.length && (
                        <Table
                            columns={[
                                column('name', 'Event', NAME_WIDTH),
                                column('type', 'Detail', VALUE_WIDTH),
                                column('description', 'Fires'),
                            ]}
                            data={element.events.map((event) => ({
                                id: event.name,
                                name: code(event.name),
                                type: code(event.type?.text),
                                description: markup(event.description),
                            }))}
                            pageSize={100}
                            size="small"
                            title="Events"
                        />
                    )}
                    {!!element.slots?.length && (
                        <Table
                            columns={[column('name', 'Slot', NAME_WIDTH), column('description', 'Takes')]}
                            data={element.slots.map((slot) => ({
                                id: slot.name || 'default',
                                name: code(slot.name || '(default)'),
                                description: markup(slot.description),
                            }))}
                            pageSize={100}
                            size="small"
                            title="Slots"
                        />
                    )}
                    {!!element.cssParts?.length && (
                        <Table
                            columns={[column('name', 'CSS part', NAME_WIDTH), column('description', 'Styles')]}
                            data={element.cssParts.map((part) => ({
                                id: part.name || '',
                                name: code(part.name),
                                description: markup(part.description),
                            }))}
                            pageSize={100}
                            size="small"
                            title="CSS parts"
                        />
                    )}
                </section>
            ))}
        </section>
    );
}
