import { PageControl } from './PageControl';
import { presets } from './PageControlExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const dots = () => Array.from(document.querySelectorAll<HTMLElement>('[data-pttrn="page-control"] [data-dot]'));

describe('PageControl (RTL)', () => {
    it('renders', () => {
        render(<PageControl currentPage={1} numPages={3} />);

        expect(screen.getByLabelText('Page 1 of 3')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'image-label': () => {
        const { rerender } = render(<PageControl currentPage={2} numPages={4} />);
        expect(screen.getByRole('img', { name: 'Page 2 of 4' })).toHaveAttribute('data-pttrn', 'page-control');

        rerender(<PageControl currentPage={3} numPages={4} />);
        expect(screen.getByRole('img', { name: 'Page 3 of 4' })).toBeInTheDocument();
    },
    dots: () => {
        render(<PageControl currentPage={2} numPages={4} />);

        expect(dots()).toHaveLength(4);
        expect(dots().map((dot) => dot.getAttribute('data-size'))).toEqual(['medium', 'medium', 'medium', 'medium']);
        expect(dots().filter((dot) => dot.hasAttribute('data-active'))).toHaveLength(1);
        expect(dots()[1]).toHaveAttribute('data-active');
        dots().forEach((dot) => expect(dot).toHaveAttribute('aria-hidden', 'true'));
    },
    window: () => {
        const { rerender } = render(<PageControl currentPage={5} numPages={10} />);
        expect(dots()).toHaveLength(5);
        expect(dots().map((dot) => dot.getAttribute('data-dot'))).toEqual(['2', '3', '4', '5', '6']);
        expect(dots().map((dot) => dot.getAttribute('data-size'))).toEqual([
            'x-small',
            'small',
            'medium',
            'small',
            'x-small',
        ]);
        expect(dots()[2]).toHaveAttribute('data-active');

        rerender(<PageControl currentPage={1} numPages={10} />);
        expect(dots().map((dot) => dot.getAttribute('data-dot'))).toEqual(['0', '1', '2', '3', '4']);
        expect(dots().map((dot) => dot.getAttribute('data-size'))).toEqual([
            'medium',
            'medium',
            'medium',
            'small',
            'x-small',
        ]);
        expect(dots()[0]).toHaveAttribute('data-active');

        rerender(<PageControl currentPage={10} numPages={10} />);
        expect(dots().map((dot) => dot.getAttribute('data-dot'))).toEqual(['5', '6', '7', '8', '9']);
        expect(dots().map((dot) => dot.getAttribute('data-size'))).toEqual([
            'x-small',
            'small',
            'medium',
            'medium',
            'medium',
        ]);
        expect(dots()[4]).toHaveAttribute('data-active');
    },
    invalid: () => {
        const { container, rerender } = render(<PageControl currentPage={1} numPages={1} />);
        expect(container).toBeEmptyDOMElement();

        rerender(<PageControl currentPage={0} numPages={3} />);
        expect(container).toBeEmptyDOMElement();

        rerender(<PageControl currentPage={4} numPages={3} />);
        expect(container).toBeEmptyDOMElement();
    },
    variants: () => {
        const { rerender } = render(<PageControl currentPage={1} numPages={3} />);
        expect(screen.getByRole('img')).toHaveAttribute('data-variant', 'flat');

        rerender(<PageControl currentPage={1} numPages={3} variant="floating" />);
        expect(screen.getByRole('img')).toHaveAttribute('data-variant', 'floating');
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<PageControl {...preset.propState} />)();
    },
});
