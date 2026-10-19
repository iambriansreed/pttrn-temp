import { InlineAlert, InlineAlertProps } from './InlineAlert';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const VARIANTS = ['error', 'informational', 'success', 'warning'] as const;
const Subject = (props: Partial<InlineAlertProps>) => (
    <InlineAlert label="Example informational inline alert" {...props} />
);
const alert = () => screen.getByRole('alert');

describe('InlineAlert (RTL)', () => {
    it('renders', () => {
        render(<Subject variant="informational" />);

        expect(screen.getByText('Example informational inline alert')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-label': () => {
        render(<Subject />);

        expect(alert()).toHaveAttribute('data-pttrn', 'inline-alert');
        expect(alert()).toHaveTextContent('Example informational inline alert');
    },
    variant: () => {
        const { rerender } = render(<Subject />);
        expect(alert()).toHaveAttribute('data-variant', 'informational');
        expect(alert().querySelector('svg')).toHaveAttribute('data-pttrn-name', 'InfoFill');

        rerender(<Subject variant="error" />);
        expect(alert()).toHaveAttribute('data-variant', 'error');
        expect(alert().querySelector('svg')).toHaveAttribute('data-pttrn-name', 'ErrorFill');

        rerender(<Subject variant="success" />);
        expect(alert().querySelector('svg')).toHaveAttribute('data-pttrn-name', 'CheckCircleFill');

        rerender(<Subject variant="warning" />);
        expect(alert()).toHaveAttribute('data-variant', 'warning');
        expect(alert().querySelector('svg')).toBeInTheDocument();
    },
    identifiable: () => {
        render(
            <>
                <input aria-describedby="hint" aria-label="Email" />
                <Subject id="hint" owner="field" />
            </>,
        );

        expect(alert()).toHaveAttribute('id', 'hint');
        expect(alert()).toHaveAttribute('data-pttrn-owner', 'field');
        expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Example informational inline alert');
    },
    'icon-decorative': () => {
        for (const variant of VARIANTS) {
            const { unmount } = render(<Subject variant={variant} />);
            expect(alert().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
            unmount();
        }
    },
    'axe-clean': async () => {
        for (const variant of VARIANTS) await hasNoBasicA11yIssues(<Subject variant={variant} />)();
    },
});
