export type IconType = 'material' | 'nowhere';

export type IconMeta = {
    name: IconName;
    type: IconType;
    variantFill?: IconName;
    variantUnfilled?: IconName;
    title: string;
    alias?: string;
};
