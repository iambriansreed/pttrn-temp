/**
 * This file is used to build the meta types for the project. It's used in the build-meta.ts file and also copied in to
 * the meta output file.
 */

export const COMPONENT_PHASES: Record<
    ComponentPhase,
    {
        title: string;
        id: ComponentPhase;
        description: string;
    }
> = {
    Backlog: {
        title: 'Backlog',
        id: 'Backlog',
        description:
            'The component has been initiated but is currently on hold. It awaits further development and is not actively being worked on at this time.',
    },
    Dev: {
        title: 'Development',
        id: 'Dev',
        description:
            'The component is actively under development. This phase includes the creation of visual elements and integration tests to ensure comprehensive functionality.',
    },
    UXReview: {
        title: 'UX Review',
        id: 'UXReview',
        description:
            'The component is being carefully evaluated by our UX team. They are ensuring that it aligns with our high standards of aesthetics and user experience and is accessible to all users.',
    },
    Stable: {
        title: 'Stable',
        id: 'Stable',
        description:
            'The component has successfully passed all reviews and is ready for use. It is now officially released and ready for use in a production environment.',
    },
    Utility: {
        title: 'Utility',
        id: 'Utility',
        description: "The component progress isn't tracked as it's a utility component.",
    },
};

export type BaseMeta = {
    name: string;
    description?: string;
    file: string;
    example?: string;
};

export type TypeMeta = BaseMeta & {
    id: string;
    references?: string[];
    properties?: TypeProperty[];
    components?: string[];
};

export type TypeProperty = {
    name: string;
    description?: string;
    type?: string[] | string;
    exampleType?: string;
    default?: unknown;
    required?: boolean;
    options?: number[] | string[];
    variants?: string[];
    references?: string[];
    minimum?: number;
    maximum?: number;
    example?: string;
    arrayType?: string;
};

export type BlockConfig = {
    name: string;
    component: string;
    pattern: string;
};

export type ComponentMeta = BaseMeta & {
    slug: string;
    dependencies: string[];
    css: string;
    hasTouchTarget: boolean;
    usage?: {
        code: string;
        description?: string;
    };
    phase: ComponentPhase;
    generated?: boolean;
    blockConfigs?: BlockConfig[];
    /** The component's behavior specification, from `spec.ts` next to its source. */
    spec?: ComponentSpec;
};

/** A named piece of a component and the role it plays. */
export type SpecPart = {
    part: string;
    /** The element or ARIA role that part is exposed as. */
    role?: string;
    description: string;
};

/** One line of the keyboard model. */
export type SpecKey = {
    /** The keys, as `Enter`, `Space`, `ArrowDown`, `Shift+Tab`. */
    keys: string[];
    description: string;
};

export type SpecAccessibility = {
    /** How roles, states and relationships are exposed: `aria-expanded`, `aria-controls`, live regions. */
    roles: string;
    /** The labels the component needs and where they come from. */
    labels: string;
    /** Where focus lands, how it moves, what happens on open and close. */
    focus: string;
    /** The minimum size of each pointer target in CSS pixels, when the component has pointer targets. */
    targetSize?: number;
    /** What animates and what `prefers-reduced-motion` changes, when the component animates. */
    motion?: string;
};

/**
 * A behavior every implementation must have. Its `id` is the contract: the React tests and the Web Component tests each
 * register a test per id, and a test run fails when one is missing.
 */
export type SpecBehavior = {
    /** Kebab-case, unique within the component: `toggle-on-click`. */
    id: string;
    description: string;
};

/**
 * The behavior specification of a component: what it is made of, how the keyboard drives it, what it owes assistive
 * technology, and the behaviors every implementation must pass. Each component keeps one in `spec.ts` next to its
 * source. The React tests and the Web Component tests import it, the docs render it and the MCP serves it.
 */
export type ComponentSpec = {
    /** The component name, matching its folder. */
    name: string;
    /** One sentence: what it is and what it does. */
    summary: string;
    anatomy: SpecPart[];
    /** Empty for a component the keyboard does not operate. */
    keyboard: SpecKey[];
    accessibility: SpecAccessibility;
    behaviors: SpecBehavior[];
};

export type UtilityMeta = BaseMeta & {
    param?: string;
    returns?: string;
};

export type ComponentPhase = 'Backlog' | 'Dev' | 'Stable' | 'Utility' | 'UXReview';
