import { jest } from '@jest/globals';
import { Card } from './Card';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Content = () => (
    <>
        <h3 id="card-title">Card Title</h3>
        <p>This is some content inside the card.</p>
    </>
);
const card = () => document.querySelector('[data-pttrn="card"]') as HTMLElement;

describe('Card', () => {
    it('renders', () => {
        render(
            <Card variant="elevated">
                <Content />
            </Card>,
        );

        expect(screen.getByText('Card Title')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-children': () => {
        render(
            <Card>
                <Content />
            </Card>,
        );

        expect(card()).toContainElement(screen.getByText('Card Title'));
        expect(card()).toContainElement(screen.getByText('This is some content inside the card.'));
    },
    variants: () => {
        const { rerender } = render(<Card>Content</Card>);
        expect(card()).toHaveAttribute('data-variant', 'elevated');

        rerender(<Card variant="outlined">Content</Card>);
        expect(card()).toHaveAttribute('data-variant', 'outlined');
    },
    'passes-attributes': () => {
        render(
            <Card aria-labelledby="card-title" data-testid="card" role="region" style={{ width: 400 }}>
                <Content />
            </Card>,
        );

        expect(screen.getByRole('region', { name: 'Card Title' })).toBe(card());
        expect(card()).toHaveAttribute('data-testid', 'card');
        expect(card()).toHaveStyle({ width: '400px' });
    },
    'inner-ref': () => {
        const innerRef = jest.fn();
        render(<Card innerRef={innerRef}>Content</Card>);

        expect(innerRef).toHaveBeenCalledWith(card());
    },
    'axe-clean': hasNoBasicA11yIssues(
        <Card aria-labelledby="card-title" role="region">
            <Content />
        </Card>,
    ),
});
