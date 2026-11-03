import { MetaComponentName } from 'src/meta';
import { accordionWc } from 'src/wc/accordion';
import { bannerAlertWc } from 'src/wc/banner-alert';
import { buttonWc } from 'src/wc/button';
import { cardWc } from 'src/wc/card';
import { chipWc } from 'src/wc/chip';
import { chipGroupWc } from 'src/wc/chip-group';
import { emptyStateWc } from 'src/wc/empty-state';
import { fabWc } from 'src/wc/fab';
import { inlineAlertWc } from 'src/wc/inline-alert';
import { webComponents as webComponentNames } from 'src/wc/names';
import { WebComponentDemo } from 'src/wc/types';

/**
 * The components that have a Web Component version. Adding an entry here enables the Web Component tab on that
 * component's page; components without one show the tab disabled.
 */
export const webComponents: Partial<Record<MetaComponentName, WebComponentDemo>> = {
    Accordion: accordionWc,
    BannerAlert: bannerAlertWc,
    Button: buttonWc,
    Card: cardWc,
    Chip: chipWc,
    ChipGroup: chipGroupWc,
    EmptyState: emptyStateWc,
    Fab: fabWc,
    InlineAlert: inlineAlertWc,
};

const listed = [...webComponentNames].sort().join(',');
const registered = Object.keys(webComponents).sort().join(',');
if (listed !== registered) {
    throw new Error(
        `src/wc/names.ts lists [${listed}] but src/wc/index.ts registers [${registered}]; keep them in step.`,
    );
}
