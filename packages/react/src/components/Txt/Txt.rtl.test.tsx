import { Txt } from './Txt';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const txt = () => document.querySelector('[data-pttrn="txt"]') as HTMLElement;

describe('Txt (RTL)', () => {
    it('renders', () => {
        render(<Txt>Example content</Txt>);

        expect(screen.getByText('Example content')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-text': () => {
        render(<Txt>Example content</Txt>);

        expect(txt().tagName).toBe('SPAN');
        expect(txt()).toHaveTextContent('Example content');
    },
    'as-element': () => {
        render(
            <Txt as="h2" variant="heading-h2">
                Section
            </Txt>,
        );

        expect(screen.getByRole('heading', { level: 2, name: 'Section' })).toBe(txt());
    },
    'variant-font': () => {
        const { rerender } = render(<Txt variant="labels-small">Label</Txt>);
        expect(txt().style.font).not.toBe('');

        rerender(<Txt inherit>Label</Txt>);
        expect(txt().style.font).toBe('');
    },
    'skeleton-fallback': () => {
        render(<Txt skeletonLines={2}>{null}</Txt>);

        expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('data-pttrn', 'skeleton-text');
        expect(document.querySelectorAll('[data-line]')).toHaveLength(2);
    },
    empty: () => {
        const { container } = render(<Txt>{null}</Txt>);

        expect(container).toBeEmptyDOMElement();
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Txt as="p">Example content</Txt>)();
        await hasNoBasicA11yIssues(<Txt skeletonLines={3}>{null}</Txt>)();
    },
});
