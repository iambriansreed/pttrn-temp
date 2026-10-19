import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { BannerAlert, BannerAlertProps } from './BannerAlert';
import { BannerAlertExample } from './BannerAlertExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const presets = BannerAlertExample({ action: () => {} } as never).presets || [];

const Subject = (props: Partial<BannerAlertProps>) => (
    <BannerAlert body="There was an error processing your request." header="Error" {...props} />
);
const alert = () => screen.getByRole('alert');

describe('BannerAlert', () => {
    it('renders its child content ', () => {
        render(<Subject callToAction={{ label: 'Click me', onClick: () => {} }} onClose={() => {}} variant="error" />);

        expect(screen.getByText('Click me')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-content': () => {
        render(<Subject />);

        expect(alert()).toHaveAttribute('data-pttrn', 'banner-alert');
        expect(alert()).toContainElement(screen.getByText('Error'));
        expect(alert()).toContainElement(screen.getByText('There was an error processing your request.'));
    },
    variant: () => {
        const { rerender } = render(<Subject />);
        expect(alert()).toHaveAttribute('data-variant', 'informational');
        expect(alert().querySelector('[data-icon-bar] svg')).toHaveAttribute('data-pttrn-name', 'InfoFill');

        const icons = { error: 'ErrorFill', success: 'CheckCircleFill', warning: 'WarningFill' } as const;
        for (const [variant, icon] of Object.entries(icons)) {
            rerender(<Subject variant={variant as keyof typeof icons} />);
            expect(alert()).toHaveAttribute('data-variant', variant);
            expect(alert().querySelector('[data-icon-bar] svg')).toHaveAttribute('data-pttrn-name', icon);
        }
    },
    'close-button': async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        const { rerender } = render(<Subject onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(<Subject />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
    'call-to-action': async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        const { rerender } = render(<Subject callToAction={{ label: 'Retry', onClick }} />);

        await user.click(screen.getByRole('button', { name: 'Retry' }));
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(<Subject callToAction={{ label: '', onClick }} />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
    elevated: () => {
        const { rerender } = render(<Subject />);
        expect(alert()).not.toHaveAttribute('data-elevated');

        rerender(<Subject elevated />);
        expect(alert()).toHaveAttribute('data-elevated');
    },
    'icon-decorative': () => {
        render(<Subject variant="success" />);

        expect(alert().querySelector('[data-icon-bar]')).toHaveAttribute('aria-hidden', 'true');
    },
    'axe-clean': async () => {
        for (const preset of presets)
            await hasNoBasicA11yIssues(<Subject onClose={() => {}} {...preset.propState} />)();
    },
});
