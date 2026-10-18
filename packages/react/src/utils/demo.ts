import { CSSProperties, isValidElement, ReactNode } from 'react';

import { AlertVariant, DataProps } from '-/types/common';
import { BlockConfig, ComponentMeta, TypeProperty } from '-/types/meta';

export type DemoAction = (message: string, variant?: AlertVariant) => void;

export type DemoSetState<Props = Record<string, unknown>> = (
    next: Partial<Props> | ((prev: Props) => Partial<Props>),
) => void;

export type TypePropertyDemo = Omit<TypeProperty, 'example'> & {
    libraryDefault?: TypeProperty['default'];
    label?: string;
    example?: any;
    disabled?: boolean;
};

export type TypePropertyDemoWithControls = Pick<TypeProperty, 'type'> &
    TypePropertyDemo & {
        haveControl: boolean;
        typeOptions: number[] | string[] | undefined;
        multiline?: boolean;
    };

export type ComponentExampleRenderProps<Props = Record<string, unknown>> = {
    props: Props;
    preset?: DemoPreset;
    setState: DemoSetState<Props>;
    Component: React.ComponentType<Props>;
    variant?: {
        name: string;
        value: unknown;
    };
    id: string;
};

export type ComponentExampleRender<Props = Record<string, unknown>> = (
    params: ComponentExampleRenderProps<Props>,
) => React.ReactNode;

export type ComponentVariantOverride<Props> = {
    [K in keyof Props]?: Props[K] | { options: Props[K][] };
};

export type ComponentPageSection<Props = Record<string, unknown>> = {
    title?: string;
    description?: string;
    content?: (params: {
        Component?: React.ComponentType<Props>;
        props: Props;
        CodeExample: CodeExample;
        CodePlayground: CodePlayground;
        Syntax: Syntax;
    }) => React.ReactNode;
    location?: 'afterDemo' | 'beforeDemo';
};

export type ComponentVariantOverrides<Props = Record<string, unknown>, PropName extends keyof Props = keyof Props> = {
    /**
     * Hide the variant entirely by setting to false.
     *
     * Set specific prop overrides for the variant. e.g. when demoing iconOnly, we want to set the icon prop.
     */
    [Key in PropName]?: ComponentVariantOverride<Props> | false;
};

export type ComponentExample<
    Props extends Record<string, unknown> = Record<string, unknown>,
    PropName extends keyof Props = keyof Props,
> = {
    /**
     * The style of the wrapping component.
     *
     * @example
     *     {width: '100%'} ,
     */
    containerStyle?: React.CSSProperties | ((propState: Props) => React.CSSProperties);
    /**
     * False to hide all or a record of variants to hide or modify props.
     *
     * Helpful for hiding or setting static default props for specific variants
     */
    variants?: ComponentVariantOverrides<Props> | boolean;
    /**
     * This is used to set the initial propState of the component.
     *
     * Specifically to highlight certain features of the component.
     */
    presets?: Preset<Props>[];
    /**
     * This is used to set the initial propState of the component before any preset propState is applied.
     *
     * Specifically to highlight certain features of the component.
     */
    defaultState?: Partial<Props>;
    /**
     * The component to render in the example.
     *
     * By default, this will be the component that is being documented.
     *
     * If you only need to update the props of the component, you can use renderProps.
     */
    render?: ComponentExampleRender<Props>;
    /**
     * We may not want certain props editable in the props table.
     *
     * Setting this to true will disable all props.
     *
     * Or you can pass an array of prop names to disable specific props.
     */
    disableProps?: PropName[] | true;
    /** The sections of the example. */
    sections?: ComponentPageSection<Props>[];
    /**
     * Whether to render the example in a full page layout.
     *
     * @default false
     */
    fullPage?: boolean;
    /**
     * Hide the demo entirely.
     *
     * @default false
     */
    hideDemo?: boolean;
    /**
     * Hide the usage section entirely.
     *
     * @default false
     */
    hideUsage?: boolean;
    /** Block Configs */
    blockConfigs?: BlockConfig[];
};

export type Syntax = (params: {
    code: string;
    language?: PrettyParser;
    style?: CSSProperties;
    pretty?: boolean;
}) => React.ReactNode;

export type CodeExample = (
    params: DataProps &
        any & {
            containerStyle?: CSSProperties;
            children: ReactNode;
            accessibility?: boolean;
            code?: {
                language?: PrettyParser | undefined;
                str: string;
            };
            style?: CSSProperties;
        },
) => JSX.Element;

export type CodePlaygroundProps = {
    defaultCode: string;
    defaultShowCode?: boolean;
};

export type CodePlayground = (params: CodePlaygroundProps) => JSX.Element;

export type PrettyParser = 'css' | 'estree' | 'html' | 'scss' | 'typescript';

export type ComponentExampleFn<Props extends Record<string, unknown> = Record<string, unknown>> = (params: {
    setState: DemoSetState<Props>;
    action: DemoAction;
    componentsMeta: ComponentMeta[];
}) => ComponentExample<Props>;

export type OnHandlers = `on${string}`;

export type Preset<Props> = {
    /**
     * A description of the design pattern this preset demonstrates. When applied, it showcases the specific use case or
     * behavior of the component.
     */
    designPattern?: boolean | string;
    /** The name of the preset. This is used to display the preset in the UI. */
    label: string;
    /** The props of the component. This is used to set props of the component. These values can't be changed in the UI. */
    propState: Omit<Props, OnHandlers> & Record<OnHandlers, unknown>;
    /**
     * Hide the demo option for this preset.
     *
     * @default false
     */
    hideDemoOption?: boolean;
    /** Hide the playground for this preset. */
    hidePlayground?: boolean;
    /** Preset used for block examples. */
    block?: boolean;
};

export type DemoPreset<P = Record<string, unknown>> = Preset<P> & {
    value: string;
};

export function createUid(prefix: string = 'uid'): string {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export function reactElementToString(element: React.ReactElement): string {
    if (!isReactElement(element)) return '';
    const subComponentName = typeof element.type === 'string' ? element.type : element.type.name || 'Component';
    return componentToString(subComponentName, element.props);
}

export function componentToString<Props extends Record<string, any> = Record<string, any>>(
    componentName: string,
    propState: Props,
    propsMeta?: TypePropertyDemo[],
): string {
    const propsString = Object.entries(propState)
        .map(([key, value]) => {
            const propMeta = propsMeta?.find((prop) => prop.name === key);

            let formattedValue;
            if (typeof value === 'string') {
                formattedValue = `"${value}"`;
                if (propMeta?.type === 'PttrnIcon') formattedValue = `{<Svg${value} />}`;
            } else if (typeof value === 'boolean' || typeof value === 'number') {
                formattedValue = `{${value}}`;
            } else if (isReactElement(value)) {
                const subComponentName = typeof value.type === 'string' ? value.type : value.type.name || 'Component';
                formattedValue = `{${componentToString(subComponentName, value.props)}}`;
            } else if (Array.isArray(value)) {
                return ` ${key}={[${value
                    .map((item) => (isValidElement(item) ? convertReactToCodeString(item) : item))
                    .join(', ')}]}`;
            } else if (typeof value === 'object') {
                formattedValue = `{${JSON.stringify(value, null, 2)}}`;
            } else if (value === null) {
                formattedValue = '{null}';
            } else if (value === undefined) {
                return ''; // skip undefined props
            } else {
                formattedValue = `{${value.toString()}}`;
            }
            return `    ${key}=${formattedValue}`;
        })
        .filter(Boolean)
        .join('\n');

    return `<${componentName}\n${propsString}\n/>`;
}

function isReactElement(value: any): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value.$$typeof === Symbol.for('react.element') ||
            (value.type && (typeof value.type === 'string' || typeof value.type === 'function')))
    );
}

export function kebabCase(str: string): string {
    return (
        str
            .normalize('NFD') // Normalize to decompose accents
            .replace(/[\u0300-\u036f&()']/g, '') // Remove accents
            // Handle camelCase by inserting hyphens between lowercase and uppercase
            .replace(/([a-zA-Z])([A-Z][a-z])/g, '$1-$2')
            // do it again for the next uppercase letter
            .replace(/([a-zA-Z])([A-Z][a-z])/g, '$1-$2')
            .replace(/[^a-zA-Z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
            .replace(/^-+|-+$/g, '') // Trim leading or trailing hyphens
            .replace(/--+/g, '-') // Replace multiple hyphens with a single hyphen
            .toLowerCase()
    ); // Convert to lowercase
}

export function convertReactToCodeString(element: React.ReactElement): string {
    return `<${element.type}${Object.entries(element.props)
        .map(([key, value]) => {
            if (typeof value === 'string') {
                return ` ${key}="${value}"`;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                return ` ${key}={${value}}`;
            } else if (typeof value === 'function') {
                return ` ${key}={() => {}}`;
            } else if (isValidElement(value)) {
                return ` ${key}={${convertReactToCodeString(value)}}`;
            } else if (Array.isArray(value)) {
                return ` ${key}={[${value
                    .map((item) => (isValidElement(item) ? convertReactToCodeString(item) : '...')) // Simplified for brevity
                    .join(', ')}]}`;
            } else if (value === null) {
                return ` ${key}={null}`;
            } else if (value === undefined) {
                return ` ${key}={undefined}`;
            } else {
                return ` ${key}={${JSON.stringify(value)}}`;
            }
        })
        .join('')}>${element.props.children ? '...' : ''}</${element.type}>`;
}
