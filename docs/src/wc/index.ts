import { MetaComponentName } from 'src/meta';
import { accordionWc } from 'src/wc/accordion';
import { breadcrumbWc } from 'src/wc/breadcrumb';
import { webComponents as webComponentNames } from 'src/wc/names';
import { segmentedControlWc } from 'src/wc/segmented-control';
import { tooltipWc } from 'src/wc/tooltip';
import { WebComponentDemo } from 'src/wc/types';

/**
 * The components that have a Web Component version. Adding an entry here enables the Web Component tab on that
 * component's page; components without one show the tab disabled.
 */
export const webComponents: Partial<Record<MetaComponentName, WebComponentDemo>> = {
    Accordion: accordionWc,
    Breadcrumb: breadcrumbWc,
    SegmentedControl: segmentedControlWc,
    Tooltip: tooltipWc,
};

const listed = [...webComponentNames].sort().join(',');
const registered = Object.keys(webComponents).sort().join(',');
if (listed !== registered) {
    throw new Error(
        `src/wc/names.ts lists [${listed}] but src/wc/index.ts registers [${registered}]; keep them in step.`,
    );
}
