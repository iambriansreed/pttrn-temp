import { Grid } from './Grid';
import { GridExample } from './GridExample';

import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { render } from '-/rtl/util';

const testBed = () => <Grid {...GridExample.defaultState}>{GridExample.defaultState?.children}</Grid>;

describe('Grid (RTL)', () => {
    it(`has no basic a11y issues - ${GridExample.defaultState}`, hasNoBasicA11yIssues(testBed()));

    it('renders', () => {
        const { getByText } = render(testBed());
        expect(getByText('Cell 1')).toBeInTheDocument();
        expect(getByText('Cell 2')).toBeInTheDocument();
    });

    it('treats columns as a maximum and wraps narrow columns when given a minimum width', () => {
        const { container } = render(
            <Grid columns={3} gap="24" minColumnWidth="300px">
                <div>One</div>
                <div>Two</div>
                <div>Three</div>
            </Grid>,
        );

        const columns = (container.firstChild as HTMLElement).style.gridTemplateColumns;
        expect(columns).toContain('auto-fill');
        expect(columns).toContain('min(100%, max(300px');
    });

    it('keeps a fixed number of columns without a minimum width', () => {
        const { container } = render(
            <Grid columns={3}>
                <div>One</div>
            </Grid>,
        );

        expect((container.firstChild as HTMLElement).style.gridTemplateColumns).toBe('repeat(3, minmax(auto, 1fr))');
    });
});
