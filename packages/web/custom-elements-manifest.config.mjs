/**
 * Custom Elements Manifest for @ptrn/web (https://custom-elements-manifest.open-wc.org). The build writes
 * dist/custom-elements.json from the element sources: tags, attributes and properties from `static properties`, and the
 * slots, events and CSS parts the JSDoc declares with @slot, @fires and @csspart. The docs, editors and the MCP read
 * it, so an element's public surface lives in its source and nowhere else.
 */
/** Internal state (`_name`, declared `state: true`) is not part of an element's API, so it leaves the manifest. */
const dropInternalState = {
    name: 'pttrn-drop-internal-state',
    packageLinkPhase({ customElementsManifest }) {
        for (const module of customElementsManifest.modules ?? []) {
            for (const declaration of module.declarations ?? []) {
                if (declaration.attributes) {
                    declaration.attributes = declaration.attributes.filter(
                        (attribute) => !(attribute.fieldName ?? attribute.name).startsWith('_'),
                    );
                }
                if (declaration.members) {
                    declaration.members = declaration.members.filter((member) => !member.name.startsWith('_'));
                }
            }
        }
    },
};

export default {
    plugins: [dropInternalState],
    globs: ['src/components/**/*.ts'],
    exclude: ['src/components/**/index.ts'],
    outdir: 'dist',
    litelement: true,
    dependencies: false,
    packagejson: false,
};
