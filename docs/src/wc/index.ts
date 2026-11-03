import { MetaComponentName } from 'src/meta';
import { accordionWc } from 'src/wc/accordion';
import { avatarWc } from 'src/wc/avatar';
import { badgeWc } from 'src/wc/badge';
import { badgeDotWc } from 'src/wc/badge-dot';
import { dividerWc } from 'src/wc/divider';
import { webComponents as webComponentNames } from 'src/wc/names';
import { skeletonWc } from 'src/wc/skeleton';
import { skeletonTextWc } from 'src/wc/skeleton-text';
import { tagWc } from 'src/wc/tag';
import { txtWc } from 'src/wc/txt';
import { WebComponentDemo } from 'src/wc/types';

/**
 * The components that have a Web Component version. Adding an entry here enables the Web Component tab on that
 * component's page; components without one show the tab disabled.
 */
export const webComponents: Partial<Record<MetaComponentName, WebComponentDemo>> = {
    Accordion: accordionWc,
    Avatar: avatarWc,
    Badge: badgeWc,
    BadgeDot: badgeDotWc,
    Divider: dividerWc,
    Skeleton: skeletonWc,
    SkeletonText: skeletonTextWc,
    Tag: tagWc,
    Txt: txtWc,
};

const listed = [...webComponentNames].sort().join(',');
const registered = Object.keys(webComponents).sort().join(',');
if (listed !== registered) {
    throw new Error(
        `src/wc/names.ts lists [${listed}] but src/wc/index.ts registers [${registered}]; keep them in step.`,
    );
}
