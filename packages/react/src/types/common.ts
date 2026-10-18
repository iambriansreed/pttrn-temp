/**
 * There are no barrel files for this repository.
 *
 * Components should be imported directly like "import { Txt } from
 *
 * @ptrn/react/Txt".
 */

import { IconName } from '@ptrn/icons';
import {
    JSXElementConstructor,
    ReactNode,
    ComponentPropsWithoutRef,
    AriaRole,
    ChangeEvent,
    KeyboardEvent,
    CSSProperties,
} from 'react';

export type AlertVariant = 'error' | 'informational' | 'success' | 'warning';

/** Sets a ref to the given element. */
export type SetRef<T> = (instance: T | null) => void;

export type ElementProps<
    P extends Record<string, unknown>,
    E extends JSXElementConstructor<unknown> | keyof JSX.IntrinsicElements,
    O extends string = '',
> = Omit<ComponentPropsWithoutRef<E>, O | keyof P> & P;

export type ElementConstructorProps<
    E extends JSXElementConstructor<unknown> | keyof JSX.IntrinsicElements,
    O extends string = '',
> = Omit<ComponentPropsWithoutRef<E>, O>;

export type CSSVariables = `--${string}`;

export type CSSWithVariables = CSSProperties | (CSSProperties & { [key in CSSVariables]: unknown });

export type DataProps = Record<`data-${string}`, string>;

export type ButtonSize = 'large' | 'medium' | 'small' | 'x-small';

/** The name of an icon in the pttrn icon library. */
export type PttrnIcon = IconName;

export type CallToActionButton = {
    /**
     * The label of the call to action button.
     *
     * @required
     */
    label: string;
    /**
     * The callback function for the call to action button.
     *
     * @required
     */
    onClick: () => void;
    /** The size of the call to action button. */
    size?: ButtonSize;
};

export type CommonPropsLibrary = {
    /**
     * Indicates that the element is in an invalid state and displays the error theme.
     *
     * If set to true, an accompanying error message should be provided.
     *
     * @default false
     */
    invalid?: boolean;
    /** The id of the element. If not provided one will be generated. */
    id?: string;
    /**
     * Marks the element as active and displays active state theme.
     *
     * @default false
     */
    active?: boolean;
    /**
     * The content of the element.
     *
     * @required
     */
    children: ReactNode;
    /**
     * The size of the element.
     *
     * @default medium
     */
    size?: 'large' | 'medium' | 'small';
    /**
     * Determines if the element is [required](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required).
     *
     * @default false
     */
    required?: boolean;
    /**
     * Determines if the element is [disabled](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled).
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * Determines if the element is [readonly](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/readonly).
     *
     * @default false
     */
    readOnly?: boolean;
    /**
     * The [name](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#name) of the control.
     *
     * @required
     */
    name: string;
    /**
     * The value of the control.
     *
     * @required
     */
    optionValue?: string;
    /** The aria-label for the element. */
    'aria-label'?: string;
    /** Identifies the parent component. Helps with styling, debugging, and/or testing purposes. */
    owner?: string;
    /**
     * The ARIA role of the element.
     *
     * @type string
     */
    role?: AriaRole;
    /**
     * Inline styles to apply to the element.
     *
     * Allows for CSS variables to be passed in as well.
     */
    style?: CSSWithVariables;
};

export type CommonProps<K extends keyof CommonPropsLibrary> = Pick<CommonPropsLibrary, K>;

export type RequiredCommonProps<K extends keyof CommonPropsLibrary> = Required<Pick<CommonPropsLibrary, K>>;

/** The common properties for all input control components such as Input, TextArea, Select, etc. */
export type FieldControlProps<
    ValueType = string,
    ChangeContext = ChangeEvent<HTMLElement> | KeyboardEvent | undefined,
> = CommonProps<'aria-label' | 'disabled' | 'id' | 'invalid' | 'name' | 'readOnly' | 'required'> & {
    /**
     * The value of the field control.
     *
     * @required
     */
    value: ValueType | undefined;
    /**
     * The function to call when the value changes.
     *
     * @required
     */
    onChange: (next: ValueType | undefined, event?: ChangeContext) => void;
    /*
     * The aria-describedby attribute for the field control.
     */
    'aria-describedby'?: string;
    /*
     * The aria-errormessage attribute for the field control.
     */
    'aria-errormessage'?: string;
};
