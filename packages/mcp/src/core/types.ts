export type Prop = {
    name: string;
    required: boolean;
    description: string;
    /** Type as TypeScript source, for example `boolean` or `'small' | 'large'`. */
    type: string;
    /** Allowed values when the type is a union of literals. */
    options?: string[];
    default?: unknown;
};

export type Component = {
    name: string;
    slug: string;
    description: string;
    /** Import path, for example `@ptrn/react/Button`. */
    import: string;
    dependencies: string[];
    /** Example JSX from the docs, when the component has one. */
    usage?: string;
    props: Prop[];
    /** The behavior specification from the component's `spec.ts`, when it has one. */
    spec?: ComponentSpec;
};

/** Mirrors `ComponentSpec` in @ptrn/react's `src/types/meta.ts`. */
export type ComponentSpec = {
    name: string;
    summary: string;
    anatomy: { part: string; role?: string; description: string }[];
    keyboard: { keys: string[]; description: string }[];
    accessibility: { roles: string; labels: string; focus: string; targetSize?: number; motion?: string };
    behaviors: { id: string; description: string }[];
};

export type Icon = {
    name: string;
    title: string;
    kind: string;
    /** Search synonyms. */
    alias: string;
    /** Import path, for example `@ptrn/icons/Person`. */
    import: string;
    /** Named export, for example `SvgPerson`. */
    export: string;
};

export type Token = {
    /** CSS custom property, including the leading dashes. */
    name: string;
    /** Group, the first word after the USWDS prefixes (`color`, `spacing`, `font`, `component`). */
    kind: string;
    /** Value in the `default` USWDS theme (or the only value, for a token no theme changes). */
    value: string;
    /** Values in the other USWDS themes (`project-theme`, `project-theme-dark`), where they differ. */
    themes?: Record<string, string>;
    description: string;
};

export type Meta = {
    /** `@ptrn/react` version the data was built from. */
    version: string;
    generated: string;
};

export type Catalog = {
    meta: Meta;
    components: Component[];
    icons: Icon[];
    tokens: Token[];
};
