/* eslint-disable @cspell/spellchecker */
import { SvgChevronLeft } from '@ptrn/icons/ChevronLeft';
import { SvgChevronRight } from '@ptrn/icons/ChevronRight';
import { SvgMenu } from '@ptrn/icons/Menu';
import { Avatar } from '@ptrn/react/Avatar';
import { Button } from '@ptrn/react/Button';
import { Divider } from '@ptrn/react/Divider';
import { Fab } from '@ptrn/react/Fab/Fab';
import { ListItem, ListItemProps } from '@ptrn/react/ListItem';
import { PageControl } from '@ptrn/react/PageControl';
import { TabGroup } from '@ptrn/react/TabGroup/index';
import { Txt } from '@ptrn/react/Txt';
import { Fragment, useEffect, useState } from 'react';
import { Page } from 'components/Page';
import { Syntax } from 'src/components/Syntax';

const milestones: ListItemProps[] = [
    { label: 'Inspection', subText: 'July 7' },
    { label: 'Financing', subText: 'July 26' },
    { label: 'Pre-closing', subText: 'July 31' },
    { label: 'Closing day', subText: 'August 10' },
];

const team: ListItemProps[] = [
    {
        label: 'Agent: Jim Jones',
        leading: <Avatar initials="JJ" name="Agent: Jim Jones" />,
        subText: (
            <>
                <a href="mailto:jimmy@cbhome.com">jimmy@cbhome.com</a>
                <br />
                <a data-subtle href="tel:(805) 888-7900">
                    (805) 888-7900
                </a>
            </>
        ) as unknown as string,
    },
    {
        label: 'CES: Moana Waters',
        leading: <Avatar initials="MW" name="CES: Moana Waters" />,
        subText: (
            <>
                <a href="mailto:moana@cbhome.com">moana@cbhome.com</a>
                <br />
                <a data-subtle href="tel:(805) 888-7900">
                    (805) 888-7900
                </a>
            </>
        ) as unknown as string,
    },
];

export function Demo() {
    useEffect(() => {
        document.title = 'pttrn UI Demo';
        document.body.setAttribute('data-pttrn-code-demo', '');

        return () => {
            document.body.removeAttribute('data-pttrn-code-demo');
        };
    }, []);

    return (
        <Page>
            <Txt as="h1" style={{ margin: '16px 0' }} variant="heading-h3">
                Home Journey Mobile Experience
            </Txt>
            <div style={{ display: 'flex', gap: 24 }}>
                <div data-content-demo style={{ flex: 1, padding: '16px', backgroundColor: '#fff', width: '500px' }}>
                    <p>
                        Frontend development time:{' '}
                        <Txt as="span" variant="subheader-medium">
                            1 hour 10 minutes and 3 seconds.
                        </Txt>
                    </p>

                    <p>
                        We started creating this by copying and pasting the screen from Figma as a PNG into CoPilot and
                        added the following prompt:
                    </p>

                    <blockquote>
                        Create a React page that looks like the screenshot. Use the pttrn UI components.
                    </blockquote>

                    <p>
                        The CoPilot result was a great starting point using pttrn components and without prompting even
                        added pttrn Icons.
                    </p>

                    <Divider />

                    <p>The experience is built using the following pttrn UI components:</p>
                    <ul>
                        <li>Avatar</li>
                        <li>Button</li>
                        <li>Divider</li>
                        <li>Fab</li>
                        <li>ListItem</li>
                        <li>PageControl</li>
                        <li>TabGroup</li>
                        <li>Txt</li>
                    </ul>

                    <p>The experience is built using the following pttrn Icons:</p>
                    <ul>
                        <li>SvgChevronLeft</li>
                        <li>SvgChevronRight</li>
                        <li>SvgMenu</li>
                    </ul>

                    <p>
                        After an additional hour of development, we had a working front-end experience that matches the
                        Figma design, follows all Pattern Design System guidelines, and includes accessibility built-in.
                    </p>

                    <p>
                        The <b>Show All</b> button using the pttrn UI library:
                    </p>

                    <Syntax
                        code={`import { Button } from '@ptrn/react/Button';\n\n<Button label="Show all" onClick={handleShowAllClick} size="small" />
`}
                        language="typescript"
                    />

                    <p>
                        What the <b>Show All</b> button looks like in Figma property panel:
                    </p>
                    <img alt="Show All button in Figma" src="demo-show-all-button.png" style={{ maxWidth: '300px' }} />
                </div>
                <div style={{ flex: 1, maxWidth: 375, margin: '0 auto' }}>
                    <HomeJourneyMobile />
                </div>
            </div>
            <div style={{ marginTop: 24, backgroundColor: '#fff', padding: '16px' }}>
                <Txt as="h2" variant="heading-h4">
                    Source Code
                </Txt>
                <p>This is a very rough draft with the intent for speed and not accuracy or completeness.</p>
                <p>
                    Styles would normally be defined in a separate CSS file, but for the sake of this demo, they are
                    included inline.
                </p>
                <p>We are still developing the Carousel component, so we used a static example.</p>
                <Syntax
                    code={`export default function HomeJourneyMobile() {
    const [carouselIndex] = useState(1);

    const handleShowAllClick = () => {
        // Handle the show all click event
        console.log('Show all clicked');
    };

    return (
        <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'inherit' }}>
            <div
                style={{
                    background: 'var(--theme-color-primary-darker)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        color: 'var(--usa-color-white)',
                        padding: '12px',
                    }}
                >
                    <Txt style={{ flex: 1, textAlign: 'center' }} variant="heading-h6">
                        Home Journey
                    </Txt>
                    <Button
                        icon={<SvgMenu />}
                        label="Menu"
                        iconOnly
                        style={{ color: 'var(--usa-color-white)' }}
                        variant="tertiary"
                    />
                </div>
                <div
                    style={{
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'start',
                        borderTopLeftRadius: 'var(--theme-border-radius-lg)',
                        borderTopRightRadius: 'var(--theme-border-radius-lg)',
                        background: '#fff',
                    }}
                >
                    <Txt style={{ fontWeight: 600 }} variant="heading-h5">
                        Good morning, Sheri
                    </Txt>
                    <Txt variant="body-base">Thursday, July 3</Txt>
                </div>
            </div>
            <div style={{ margin: 0, borderRadius: 0, boxShadow: 'none', padding: 0 }}>
                <div style={{ position: 'relative' }}>
                    <img
                        alt="Home"
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                        style={{ width: '100%', height: 180, objectFit: 'cover' }}
                    />
                    <div
                        style={{
                            width: '100%',
                            position: 'absolute',
                            top: '30%',
                            height: '48px',
                        }}
                    >
                        <Fab
                            icon={<SvgChevronLeft />}
                            label="previous"
                            placement="top-left"
                            iconOnly
                            variant="neutral"
                        />
                        <Fab
                            icon={<SvgChevronRight />}
                            label="next"
                            placement="top-right"
                            iconOnly
                            variant="neutral"
                        />
                    </div>

                    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
                        <PageControl currentPage={carouselIndex} numPages={20} />
                    </div>
                </div>
                <div>
                    {items.map((item, index) => (
                        <Fragment key={item.label}>
                            {index > 0 && <Divider />}
                            <ListItem {...item} />
                        </Fragment>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--theme-color-base-lightest)' }} />
            <div style={{ padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, height: 56 }}>
                    <Txt style={{ fontWeight: 600, flex: 1 }} variant="heading-h5">
                        Milestones
                    </Txt>
                    <Button label="Show all" onClick={handleShowAllClick} size="small" />
                </div>
                <TabGroup
                    label="Milestone filter"
                    onChange={() => {}}
                    options={[
                        { label: 'Upcoming', value: 'upcoming' },
                        { label: 'Completed', value: 'completed', badge: 2 },
                    ]}
                    value="upcoming"
                />
                <div style={{ boxShadow: 'none', padding: '8px 0 0' }}>
                    {milestones.map((m, i) => (
                        <Fragment key={i}>
                            {i > 0 && <Divider />}
                            <ListItem key={i} {...m} />
                        </Fragment>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--theme-color-base-lightest)' }} />
            <div style={{ padding: 16 }}>
                <Txt style={{ fontWeight: 600, marginBottom: 8 }} variant="heading-h6">
                    Your team
                </Txt>
                <div data-style={{ boxShadow: 'none', padding: 0 }}>
                    {team.map((member, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: '1px solid #eee',
                            }}
                        >
                            <ListItem {...member} />
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ padding: 16, fontSize: 14, background: 'var(--theme-color-base-lightest)' }}>
                <ListItem href="#/terms-of-use" label="Terms of use" />
                <ListItem href="#/privacy-notice" label="Privacy Notice" />
                <ListItem
                    href="#/do-not-sell-or-share-my-personal-information"
                    label="Do Not Sell or Share My Personal Information"
                />
                <ListItem href="#/cookie-preferences" label="Cookie Preferences" />

                <ListItem label="Having trouble? Call us at 1-800-873-8111" />
                <Txt as="div" style={{ textAlign: 'center', marginTop: 16 }} variant="subheader-medium">
                    © Example, Inc.
                </Txt>
            </div>
        </div>
    );
}`}
                    language="typescript"
                />
            </div>
        </Page>
    );
}

// eslint-disable-next-line react/no-multi-comp
export default function HomeJourneyMobile() {
    const [carouselIndex] = useState(1);

    const handleShowAllClick = () => {
        // Handle the show all click event
        console.log('Show all clicked');
    };

    return (
        <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'inherit' }}>
            <div
                style={{
                    background: 'var(--theme-color-primary-darker)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        color: 'var(--usa-color-white)',
                        padding: '12px',
                    }}
                >
                    <Txt style={{ flex: 1, textAlign: 'center' }} variant="heading-h6">
                        Home Journey
                    </Txt>
                    <Button
                        icon={<SvgMenu />}
                        iconOnly
                        label="Menu"
                        style={{ color: 'var(--usa-color-white)' }}
                        variant="tertiary"
                    />
                </div>
                <div
                    style={{
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'start',
                        borderTopLeftRadius: 'var(--theme-border-radius-lg)',
                        borderTopRightRadius: 'var(--theme-border-radius-lg)',
                        background: '#fff',
                    }}
                >
                    <Txt style={{ fontWeight: 600 }} variant="heading-h5">
                        Good morning, Sheri
                    </Txt>
                    <Txt variant="body-base">Thursday, July 3</Txt>
                </div>
            </div>
            <div style={{ margin: 0, borderRadius: 0, boxShadow: 'none', padding: 0 }}>
                <div style={{ position: 'relative' }}>
                    <img
                        alt="Home"
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                        style={{ width: '100%', height: 180, objectFit: 'cover' }}
                    />
                    <div
                        style={{
                            width: '100%',
                            position: 'absolute',
                            top: '30%',
                            height: '48px',
                        }}
                    >
                        <Fab
                            icon={<SvgChevronLeft />}
                            iconOnly
                            label="previous"
                            placement="top-left"
                            variant="neutral"
                        />
                        <Fab icon={<SvgChevronRight />} iconOnly label="next" placement="top-right" variant="neutral" />
                    </div>

                    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
                        <PageControl currentPage={carouselIndex} numPages={20} />
                    </div>
                </div>
                <div>
                    {[
                        {
                            label: '$2,145,000',
                            subText: 'Price',
                        },
                        {
                            label: '303 29th Ave. Seattle, WA 98122',
                            subText: 'Address',
                        },
                        {
                            label: 'August 10 (in 31 days)',
                            subText: 'Estimated closing date',
                        },
                    ].map((item, index) => (
                        <Fragment key={item.label}>
                            {index > 0 && <Divider />}
                            <ListItem {...item} />
                        </Fragment>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--theme-color-base-lightest)' }} />
            <div style={{ padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, height: 56 }}>
                    <Txt style={{ fontWeight: 600, flex: 1 }} variant="heading-h5">
                        Milestones
                    </Txt>
                    <Button label="Show all" onClick={handleShowAllClick} size="small" />
                </div>
                <TabGroup
                    label="Milestone filter"
                    onChange={() => {}}
                    options={[
                        { label: 'Upcoming', value: 'upcoming' },
                        { label: 'Completed', value: 'completed', badge: 2 },
                    ]}
                    value="upcoming"
                />
                <div style={{ boxShadow: 'none', padding: '8px 0 0' }}>
                    {milestones.map((m, i) => (
                        <Fragment key={i}>
                            {i > 0 && <Divider />}
                            <ListItem key={i} {...m} />
                        </Fragment>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--theme-color-base-lightest)' }} />
            <div style={{ padding: 16 }}>
                <Txt style={{ fontWeight: 600, marginBottom: 8 }} variant="heading-h6">
                    Your team
                </Txt>
                <div data-style={{ boxShadow: 'none', padding: 0 }}>
                    {team.map((member, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: '1px solid #eee',
                            }}
                        >
                            <ListItem {...member} />
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ padding: 16, fontSize: 14, background: 'var(--theme-color-base-lightest)' }}>
                <ListItem href="#/terms-of-use" label="Terms of use" />
                <ListItem href="#/privacy-notice" label="Privacy Notice" />
                <ListItem
                    href="#/do-not-sell-or-share-my-personal-information"
                    label="Do Not Sell or Share My Personal Information"
                />
                <ListItem href="#/cookie-preferences" label="Cookie Preferences" />

                <ListItem label="Having trouble? Call us at 1-800-873-8111" />
                <Txt as="div" style={{ textAlign: 'center', marginTop: 16 }} variant="subheader-medium">
                    © Example, Inc.
                </Txt>
            </div>
        </div>
    );
}
