import { PageHeader } from './PageHeader';
import { Avatar } from '-/components/Avatar';
import { Breadcrumb } from '-/components/Breadcrumb';
import { Flex } from '-/components/Flex';
import { Txt } from '-/components/Txt';
import { BlockExample, Slot } from '-/utils/blocks';

export const blockConfigs = (
    <>
        <BlockExample name="Slots">
            <BlockExample.Component>
                <PageHeader
                    actions={<Slot height={32} label="Page actions slot" width={372} />}
                    subHeader={
                        <>
                            <Slot height="var(--usa-spacing-3)" label="Slot component" width={200} />
                            <Slot height="var(--usa-spacing-3)" label="Slot component 2" width={200} />
                        </>
                    }
                    title="Dashboard"
                />
            </BlockExample.Component>
            <BlockExample.Pattern>
                <Flex
                    direction="column"
                    padding={['20', '20', '0']}
                    style={{
                        background: 'var(--theme-page-background-color)',
                        width: '100%',
                    }}
                >
                    <Flex align="center" data-header gap="20" justify="space-between" style={{ width: '100%' }}>
                        <Txt variant="heading-h3">Dashboard</Txt>
                        <div
                            data-page-actions-slot
                            style={{
                                height: 'var(--usa-spacing-4)',
                                width: 'auto',
                            }}
                        >
                            <Slot height="100%" label="Page actions slot" width={372} />
                        </div>
                    </Flex>
                    <Flex
                        align="end"
                        data-subheader
                        justify="space-between"
                        style={{ height: 'calc(var(--usa-spacing-5) + var(--usa-spacing-05))', width: '100%' }}
                    >
                        <Slot height="var(--usa-spacing-3)" label="Slot component" width={200} />
                        <Slot height="var(--usa-spacing-3)" label="Slot component 2" width={200} />
                    </Flex>
                </Flex>
            </BlockExample.Pattern>
        </BlockExample>
        <BlockExample name="No Subheader">
            <BlockExample.Component>
                <PageHeader actions={<Slot height={32} label="Page actions slot" width={372} />} title="Dashboard" />
            </BlockExample.Component>
            <BlockExample.Pattern>
                <Flex
                    align="center"
                    data-header
                    gap="20"
                    justify="space-between"
                    style={{
                        background: 'var(--theme-page-background-color)',
                        padding: 'var(--usa-spacing-205)',
                        width: '100%',
                    }}
                >
                    <Txt variant="heading-h3">Dashboard</Txt>
                    <div data-page-actions-slot style={{ height: 'var(--usa-spacing-4)', width: 'auto' }}>
                        <Slot height="100%" label="Page actions slot" width={372} />
                    </div>
                </Flex>
            </BlockExample.Pattern>
        </BlockExample>
        <BlockExample name="With Breadcrumbs">
            <BlockExample.Component>
                <PageHeader
                    actions={<Slot height={32} label="Page actions slot" width={372} />}
                    breadcrumb={{
                        items: [
                            { label: 'Home', href: '#' },
                            { label: 'Analytics', href: '#' },
                            { label: 'Dashboard', href: '#' },
                        ],
                    }}
                    title="Dashboard"
                />
            </BlockExample.Component>
            <BlockExample.Pattern>
                <Flex direction="column" style={{ background: 'var(--theme-page-background-color)', width: '100%' }}>
                    <div style={{ padding: 'var(--usa-spacing-205) var(--usa-spacing-205) 0' }}>
                        <Breadcrumb
                            items={[
                                { label: 'Home', href: '#' },
                                { label: 'Analytics', href: '#' },
                                { label: 'Dashboard', href: '#' },
                            ]}
                        />
                    </div>
                    <Flex
                        align="center"
                        data-header
                        gap="20"
                        justify="space-between"
                        padding="20"
                        style={{ width: '100%' }}
                    >
                        <Txt variant="heading-h3">Dashboard</Txt>
                        <div data-page-actions-slot style={{ height: 'var(--usa-spacing-4)', width: 'auto' }}>
                            <Slot height="100%" label="Page actions slot" width={372} />
                        </div>
                    </Flex>
                </Flex>
                ;
            </BlockExample.Pattern>
        </BlockExample>
        <BlockExample name="Profile">
            <BlockExample.Component>
                <PageHeader
                    actions={<Slot height={32} label="Page actions slot" width={372} />}
                    avatar={{
                        name: 'Brian Blake',
                        size: 'xx-large',
                    }}
                    title="Dashboard"
                />
            </BlockExample.Component>
            <BlockExample.Pattern>
                <Flex
                    align="center"
                    data-header
                    gap="20"
                    justify="space-between"
                    padding="20"
                    style={{ background: 'var(--theme-page-background-color)', width: '100%' }}
                >
                    <Flex align="center" gap="16">
                        <Avatar name="Brian Blake" size="xx-large" />
                        <Txt variant="heading-h3">Dashboard</Txt>
                    </Flex>
                    <div data-page-actions-slot style={{ height: 'var(--usa-spacing-4)', width: 'auto' }}>
                        <Slot height="100%" label="Page actions slot" width={372} />
                    </div>
                </Flex>
            </BlockExample.Pattern>
        </BlockExample>
    </>
);
