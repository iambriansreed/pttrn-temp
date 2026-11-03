import { MetaComponentName } from 'src/meta';
import { accordionWc } from 'src/wc/accordion';
import { carouselWc } from 'src/wc/carousel';
import { fileUploadWc } from 'src/wc/file-upload';
import { fileUploadItemWc } from 'src/wc/file-upload-item';
import { webComponents as webComponentNames } from 'src/wc/names';
import { progressionStepperWc } from 'src/wc/progression-stepper';
import { progressionStepperBarWc } from 'src/wc/progression-stepper-bar';
import { tableWc } from 'src/wc/table';
import { WebComponentDemo } from 'src/wc/types';

/**
 * The components that have a Web Component version. Adding an entry here enables the Web Component tab on that
 * component's page; components without one show the tab disabled.
 */
export const webComponents: Partial<Record<MetaComponentName, WebComponentDemo>> = {
    Accordion: accordionWc,
    Carousel: carouselWc,
    FileUpload: fileUploadWc,
    FileUploadItem: fileUploadItemWc,
    ProgressionStepper: progressionStepperWc,
    ProgressionStepperBar: progressionStepperBarWc,
    Table: tableWc,
};

const listed = [...webComponentNames].sort().join(',');
const registered = Object.keys(webComponents).sort().join(',');
if (listed !== registered) {
    throw new Error(
        `src/wc/names.ts lists [${listed}] but src/wc/index.ts registers [${registered}]; keep them in step.`,
    );
}
