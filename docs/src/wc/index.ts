import { MetaComponentName } from 'src/meta';
import { accordionWc } from 'src/wc/accordion';
import { avatarWc } from 'src/wc/avatar';
import { avatarGroupWc } from 'src/wc/avatar-group';
import { badgeWc } from 'src/wc/badge';
import { badgeDotWc } from 'src/wc/badge-dot';
import { bannerAlertWc } from 'src/wc/banner-alert';
import { breadcrumbWc } from 'src/wc/breadcrumb';
import { buttonWc } from 'src/wc/button';
import { calendarWc } from 'src/wc/calendar';
import { cardWc } from 'src/wc/card';
import { carouselWc } from 'src/wc/carousel';
import { checkboxWc } from 'src/wc/checkbox';
import { checkboxGroupWc } from 'src/wc/checkbox-group';
import { checkboxGroupFieldWc } from 'src/wc/checkbox-group-field';
import { checkboxOptionWc } from 'src/wc/checkbox-option';
import { chipWc } from 'src/wc/chip';
import { chipGroupWc } from 'src/wc/chip-group';
import { datePickerWc } from 'src/wc/date-picker';
import { dividerWc } from 'src/wc/divider';
import { emptyStateWc } from 'src/wc/empty-state';
import { fabWc } from 'src/wc/fab';
import { fileUploadWc } from 'src/wc/file-upload';
import { fileUploadItemWc } from 'src/wc/file-upload-item';
import { inlineAlertWc } from 'src/wc/inline-alert';
import { inputWc } from 'src/wc/input';
import { inputNumberWc } from 'src/wc/input-number';
import { linkWc } from 'src/wc/link';
import { listItemWc } from 'src/wc/list-item';
import { webComponents as webComponentNames } from 'src/wc/names';
import { pageControlWc } from 'src/wc/page-control';
import { paginationWc } from 'src/wc/pagination';
import { passwordWc } from 'src/wc/password';
import { progressBarWc } from 'src/wc/progress-bar';
import { progressCircleWc } from 'src/wc/progress-circle';
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
import { timePickerWc } from 'src/wc/time-picker';
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
    AvatarGroup: avatarGroupWc,
    Badge: badgeWc,
    BadgeDot: badgeDotWc,
    BannerAlert: bannerAlertWc,
    Breadcrumb: breadcrumbWc,
    Button: buttonWc,
    Calendar: calendarWc,
    Card: cardWc,
    Carousel: carouselWc,
    Checkbox: checkboxWc,
    CheckboxGroup: checkboxGroupWc,
    CheckboxGroupField: checkboxGroupFieldWc,
    CheckboxOption: checkboxOptionWc,
    Chip: chipWc,
    ChipGroup: chipGroupWc,
    DatePicker: datePickerWc,
    Divider: dividerWc,
    EmptyState: emptyStateWc,
    Fab: fabWc,
    FileUpload: fileUploadWc,
    FileUploadItem: fileUploadItemWc,
    InlineAlert: inlineAlertWc,
    Input: inputWc,
    InputNumber: inputNumberWc,
    Link: linkWc,
    ListItem: listItemWc,
    PageControl: pageControlWc,
    Pagination: paginationWc,
    Password: passwordWc,
    ProgressBar: progressBarWc,
    ProgressCircle: progressCircleWc,
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
    TimePicker: timePickerWc,
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
