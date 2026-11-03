import '@ptrn/web/EmptyState';
import { EmptyStateProps } from '@ptrn/react/EmptyState';
import { ComponentType, isValidElement, ReactElement, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { version as webVersion } from '../../../packages/web/package.json';
import { attrs } from 'src/wc/demo-html';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnEmptyState = 'pttrn-empty-state' as unknown as ComponentType<any>;

/** The React demo state rendered as the element; `callToAction.onClick` listens for `pttrn-action`. */
function EmptyStateWc({ body, bodyAlign, callToAction, children, header }: Partial<EmptyStateProps>) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        const action = () => callToAction?.onClick?.();
        element?.addEventListener('pttrn-action', action);
        return () => element?.removeEventListener('pttrn-action', action);
    }, [callToAction]);

    return (
        <PttrnEmptyState
            action-label={callToAction?.label || undefined}
            action-size={callToAction?.size}
            body={body}
            body-align={bodyAlign}
            header={header}
            ref={ref}
        >
            {children}
        </PttrnEmptyState>
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function emptyStateToHtml({ body, bodyAlign, callToAction, children, header }: Partial<EmptyStateProps>) {
    const attributes = attrs({
        header,
        body,
        'body-align': bodyAlign,
        'action-label': callToAction?.label,
        'action-size': callToAction?.size,
    });
    const inner = isValidElement(children) ? `\n${renderToStaticMarkup(children as ReactElement)}\n` : '';
    return `<pttrn-empty-state${attributes}>${inner}</pttrn-empty-state>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-empty-state
    header="No results found"
    body="We couldn’t find any matching results. Try changing your search."
    action-label="Clear filters"
></pttrn-empty-state>`;

export const emptyStateWc: WebComponentDemo = {
    tag: 'pttrn-empty-state',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. An illustration goes inside the element, and `action-label` shows a button that fires `pttrn-action`.',
    Wrapper: EmptyStateWc,
    toHtml: (props) => emptyStateToHtml(props as Partial<EmptyStateProps>),
};
