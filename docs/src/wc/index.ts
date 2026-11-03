import { MetaComponentName } from 'src/meta';
import { accordionWc } from 'src/wc/accordion';
import { avatarWc } from 'src/wc/avatar';
import { badgeWc } from 'src/wc/badge';
import { badgeDotWc } from 'src/wc/badge-dot';
import { bannerAlertWc } from 'src/wc/banner-alert';
import { breadcrumbWc } from 'src/wc/breadcrumb';
import { buttonWc } from 'src/wc/button';
import { calendarWc } from 'src/wc/calendar';
import { cardWc } from 'src/wc/card';
import { carouselWc } from 'src/wc/carousel';
import { chipWc } from 'src/wc/chip';
import { chipGroupWc } from 'src/wc/chip-group';
import { dividerWc } from 'src/wc/divider';
import { emptyStateWc } from 'src/wc/empty-state';
import { fabWc } from 'src/wc/fab';
import { fileUploadWc } from 'src/wc/file-upload';
import { fileUploadItemWc } from 'src/wc/file-upload-item';
import { inlineAlertWc } from 'src/wc/inline-alert';
import { inputWc } from 'src/wc/input';
import { inputNumberWc } from 'src/wc/input-number';
import { listItemWc } from 'src/wc/list-item';
import { webComponents as webComponentNames } from 'src/wc/names';
import { otpInputWc } from 'src/wc/otp-input';
import { pageControlWc } from 'src/wc/page-control';
import { paginationWc } from 'src/wc/pagination';
import { passwordWc } from 'src/wc/password';
import { progressionStepperWc } from 'src/wc/progression-stepper';
import { progressionStepperBarWc } from 'src/wc/progression-stepper-bar';
import { radioGroupWc } from 'src/wc/radio-group';
import { radioGroupFieldWc } from 'src/wc/radio-group-field';
import { searchBarWc } from 'src/wc/search-bar';
import { segmentedControlWc } from 'src/wc/segmented-control';
import { skeletonWc } from 'src/wc/skeleton';
import { skeletonTextWc } from 'src/wc/skeleton-text';
import { switchWc } from 'src/wc/switch';
import { switchOptionWc } from 'src/wc/switch-option';
import { tabGroupWc } from 'src/wc/tab-group';
import { tableWc } from 'src/wc/table';
import { tagWc } from 'src/wc/tag';
import { textareaWc } from 'src/wc/textarea';
import { tooltipWc } from 'src/wc/tooltip';
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
    BannerAlert: bannerAlertWc,
    Breadcrumb: breadcrumbWc,
    Button: buttonWc,
    Calendar: calendarWc,
    Card: cardWc,
    Carousel: carouselWc,
    Chip: chipWc,
    ChipGroup: chipGroupWc,
    Divider: dividerWc,
    EmptyState: emptyStateWc,
    Fab: fabWc,
    FileUpload: fileUploadWc,
    FileUploadItem: fileUploadItemWc,
    InlineAlert: inlineAlertWc,
    Input: inputWc,
    InputNumber: inputNumberWc,
    ListItem: listItemWc,
    OTPInput: otpInputWc,
    PageControl: pageControlWc,
    Pagination: paginationWc,
    Password: passwordWc,
    ProgressionStepper: progressionStepperWc,
    ProgressionStepperBar: progressionStepperBarWc,
    RadioGroup: radioGroupWc,
    RadioGroupField: radioGroupFieldWc,
    SearchBar: searchBarWc,
    SegmentedControl: segmentedControlWc,
    Skeleton: skeletonWc,
    SkeletonText: skeletonTextWc,
    Switch: switchWc,
    SwitchOption: switchOptionWc,
    TabGroup: tabGroupWc,
    Table: tableWc,
    Tag: tagWc,
    Textarea: textareaWc,
    Tooltip: tooltipWc,
    Txt: txtWc,
};

const listed = [...webComponentNames].sort().join(',');
const registered = Object.keys(webComponents).sort().join(',');
if (listed !== registered) {
    throw new Error(
        `src/wc/names.ts lists [${listed}] but src/wc/index.ts registers [${registered}]; keep them in step.`,
    );
}
