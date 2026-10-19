import userEvent from '@testing-library/user-event';
import { Accordion, AccordionProps } from './Accordion';
import { presets } from './AccordionExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const CONTENT = ['Content one', 'Content two', 'Content three'];

/** Three sections, with per-section overrides, so each test states only what it changes. */
const items = (overrides: Partial<AccordionProps['items'][number]>[] = []) =>
    CONTENT.map((content, index) => ({
        id: `s${index + 1}`,
        title: `Section ${index + 1}`,
        children: <p>{content}</p>,
        ...overrides[index],
    }));

// The header's name includes its subtitle and slot content, so match the title within it.
const header = (n: number) => screen.getByRole('button', { name: new RegExp(`Section ${n}`) });
const isOpen = (n: number) => header(n).getAttribute('aria-expanded') === 'true';

describe('Accordion (RTL)', () => {
    it('renders its sections', () => {
        render(<Accordion {...presets[0].propState} />);

        expect(screen.getByText('Section 2')).toBeInTheDocument();
        expect(screen.getByText('Section 3')).toBeInTheDocument();
    });

    it('shows the subtitle, leading and trailing content in the header', () => {
        render(<Accordion items={items([{ subtitle: 'Subtitle', leading: <i>Lead</i>, trailing: <b>Trail</b> }])} />);

        const first = header(1);
        expect(first).toHaveTextContent('Subtitle');
        expect(first).toHaveTextContent('Lead');
        expect(first).toHaveTextContent('Trail');
    });
});

describeBehaviors(spec, {
    'closed-by-default': () => {
        render(<Accordion items={items()} />);

        [1, 2, 3].forEach((n) => expect(isOpen(n)).toBe(false));
        CONTENT.forEach((content) => expect(screen.queryByText(content)).not.toBeInTheDocument());
    },
    'open-initially': () => {
        render(<Accordion items={items([{}, { isOpen: true }])} />);

        expect(isOpen(2)).toBe(true);
        expect(screen.getByText(CONTENT[1])).toBeVisible();
        expect(isOpen(1)).toBe(false);
    },
    'toggle-on-click': async () => {
        const user = userEvent.setup();
        render(<Accordion items={items()} />);

        await user.click(header(1));
        expect(isOpen(1)).toBe(true);
        expect(screen.getByText(CONTENT[0])).toBeVisible();

        await user.click(header(1));
        expect(isOpen(1)).toBe(false);
        expect(screen.queryByText(CONTENT[0])).not.toBeInTheDocument();
    },
    'single-open': async () => {
        const user = userEvent.setup();
        render(<Accordion items={items()} />);

        await user.click(header(1));
        await user.click(header(2));
        expect(isOpen(1)).toBe(false);
        expect(isOpen(2)).toBe(true);
    },
    'multiple-open': async () => {
        const user = userEvent.setup();
        render(<Accordion items={items()} singleOpen={false} />);

        await user.click(header(1));
        await user.click(header(2));
        expect(isOpen(1)).toBe(true);
        expect(isOpen(2)).toBe(true);

        await user.click(header(1));
        expect(isOpen(1)).toBe(false);
        expect(isOpen(2)).toBe(true);
    },
    disabled: async () => {
        const user = userEvent.setup();
        render(<Accordion items={items([{}, { disabled: true }])} />);

        expect(header(2)).toBeDisabled();
        await user.click(header(2));
        expect(isOpen(2)).toBe(false);
        expect(screen.queryByText(CONTENT[1])).not.toBeInTheDocument();
    },
    'disabled-ignores-open': () => {
        render(<Accordion items={items([{}, { disabled: true, isOpen: true }])} />);

        expect(isOpen(2)).toBe(false);
        expect(screen.queryByText(CONTENT[1])).not.toBeInTheDocument();
    },
    'keyboard-toggle': async () => {
        const user = userEvent.setup();
        render(<Accordion items={items()} />);

        await user.tab();
        expect(header(1)).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(isOpen(1)).toBe(true);
        expect(header(1)).toHaveFocus();

        await user.keyboard(' ');
        expect(isOpen(1)).toBe(false);
    },
    'aria-controls': async () => {
        const user = userEvent.setup();
        render(<Accordion items={items()} />);

        const first = header(1);
        expect(first).toHaveAttribute('aria-expanded', 'false');
        const panelId = first.getAttribute('aria-controls');
        expect(panelId).toBeTruthy();

        await user.click(first);
        expect(first).toHaveAttribute('aria-expanded', 'true');
        const panel = document.getElementById(panelId!);
        expect(panel).toContainElement(screen.getByText(CONTENT[0]));
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<Accordion {...preset.propState} />)();
        }
    },
});
