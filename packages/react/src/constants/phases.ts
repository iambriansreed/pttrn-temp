import { ComponentPhase } from '-/types/meta';
import { ColorVariant } from '-/utils/colorVariants';

export const COMPONENT_PHASE_COLORS: Record<ComponentPhase, ColorVariant> = {
    Backlog: 'base',
    Dev: 'info',
    UXReview: 'accent-cool',
    Stable: 'success',
    Utility: 'accent-warm',
};
