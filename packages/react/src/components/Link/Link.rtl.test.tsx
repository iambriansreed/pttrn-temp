import { Link } from './Link';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor } from '-/rtl/util';

const link = () => screen.getByRole('link');

describe('Link (RTL)', () => {
    it('renders', async () => {
        render(<Link href="https://pttrn.iambrian.com" label="Example link" trailingIcon="external" />);

        expect(await screen.findByText('Example link')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-link': () => {
        render(<Link href="/pricing" label="Pricing" />);

        expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
    },
    external: () => {
        render(<Link href="https://example.com" label="Example" trailingIcon="external" />);

        expect(link()).toHaveAttribute('target', '_blank');
        expect(link()).toHaveAccessibleName('Example (opens in a new tab)');
    },
    target: () => {
        const { rerender } = render(<Link href="/a" label="A" />);
        expect(link()).toHaveAttribute('target', '_self');

        rerender(<Link href="/a" label="A" target="_parent" />);
        expect(link()).toHaveAttribute('target', '_parent');
    },
    'trailing-icon': async () => {
        render(<Link href="/next" label="Next" trailingIcon="chevron" />);

        expect(link()).toHaveAttribute('data-trailing-icon', 'chevron');
        const icon = link().querySelector('[data-link-icon]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        await waitFor(() => expect(icon?.querySelector('svg')).not.toBeNull());
    },
    variants: () => {
        render(<Link href="/a" label="A" size="small" variant="subtle" />);

        expect(link()).toHaveAttribute('data-size', 'small');
        expect(link()).toHaveAttribute('data-subtle');
    },
    'axe-clean': hasNoBasicA11yIssues(<Link href="https://example.com" label="Example" trailingIcon="external" />),
});
