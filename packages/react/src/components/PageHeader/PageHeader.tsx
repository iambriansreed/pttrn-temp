import { Avatar, AvatarProps } from '-/components/Avatar';
import { Breadcrumb, BreadcrumbProps } from '-/components/Breadcrumb';
import './page-header.scss';

export type PageHeaderProps = {
    /**
     * The actions slot content.
     *
     * Appears in the top right of the header next to the title.
     */
    actions?: React.ReactNode;
    /**
     * Breadcrumb properties.
     *
     * If provided, a breadcrumb will be rendered above the title.
     */
    breadcrumb?: BreadcrumbProps;
    /**
     * The avatar slot content.
     *
     * Appears to the left of the title.
     */
    avatar?: AvatarProps;
    /**
     * The subheader slot content.
     *
     * Appears below the header.
     */
    subHeader?: React.ReactNode;
    /**
     * The page title content.
     *
     * Appears as the main title of the page.
     */
    title: string;
};

/**
 * A standard page header component.
 *
 * @example
 *     import { PageHeader } from '@ptrn/react/PageHeader';
 *
 *     <PageHeader
 *         actions={<Slot height={32} label="Page actions slot" width={372} />}
 *         subHeader={
 *             <>
 *                 <Slot height="var(--usa-spacing-3)" label="Slot component" width={200} />
 *                 <Slot height="var(--usa-spacing-3)" label="Slot component 2" width={200} />
 *             </>
 *         }
 *         title="Page Title"
 *     />;
 *
 * @name PageHeader
 * @phase UXReview
 */
export function PageHeader({ actions, breadcrumb, avatar, subHeader, title }: PageHeaderProps) {
    return (
        <span data-pttrn="page-header">
            {breadcrumb && (
                <div data-breadcrumb>
                    <Breadcrumb {...breadcrumb} />
                </div>
            )}
            <div data-has-avatar={!!avatar} data-header>
                <div data-title>
                    {avatar && <Avatar {...avatar} size="xx-large" />}
                    <h1>{title}</h1>
                </div>
                {actions && <div data-page-actions>{actions}</div>}
            </div>
            {subHeader && <div data-subheader>{subHeader}</div>}
        </span>
    );
}
