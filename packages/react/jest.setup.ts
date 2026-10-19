import '@testing-library/jest-dom';
import jestAxe from 'jest-axe';

const { toHaveNoViolations } = jestAxe;
expect.extend(toHaveNoViolations);

// jsdom has no layout, so it does not implement scrollIntoView; the roving-focus hooks call it on the active element.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
