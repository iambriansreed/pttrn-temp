import { SvgAccountCircle } from '@ptrn/icons/AccountCircle';
import { SvgDarkMode } from '@ptrn/icons/DarkMode';
import { SvgDarkModeFill } from '@ptrn/icons/DarkModeFill';
import { SvgHelp } from '@ptrn/icons/Help';
import { SvgInfo } from '@ptrn/icons/Info';
import { SvgLicense } from '@ptrn/icons/License';
import { SvgLogout } from '@ptrn/icons/Logout';
import { SvgMenuBook } from '@ptrn/icons/MenuBook';
import { SvgSettings } from '@ptrn/icons/Settings';
import { Avatar } from '@ptrn/react/Avatar/Avatar';
import { AvatarGroup } from '@ptrn/react/AvatarGroup/AvatarGroup';
import { Button } from '@ptrn/react/Button/Button';
import { Card } from '@ptrn/react/Card/Card';
import { CheckboxOption } from '@ptrn/react/CheckboxOption/CheckboxOption';
import { DatePickerField } from '@ptrn/react/DatePickerField/DatePickerField';
import { Divider } from '@ptrn/react/Divider/Divider';
import { Flex } from '@ptrn/react/Flex';
import { Grid } from '@ptrn/react/Grid';
import { Input } from '@ptrn/react/Input/Input';
import { InputField } from '@ptrn/react/InputField/InputField';
import { ListItem } from '@ptrn/react/ListItem/ListItem';
import { Menu } from '@ptrn/react/Menu/Menu';
import { ProgressBar } from '@ptrn/react/ProgressBar/ProgressBar';
import { ProgressCircle } from '@ptrn/react/ProgressCircle/ProgressCircle';
import { RadioGroupField } from '@ptrn/react/RadioGroupField/RadioGroupField';
import { SearchBar } from '@ptrn/react/SearchBar/SearchBar';
import { SegmentedControl } from '@ptrn/react/SegmentedControl/SegmentedControl';
import { SelectField } from '@ptrn/react/SelectField/index';
import { Slider } from '@ptrn/react/Slider/Slider';
import { Switch } from '@ptrn/react/Switch/Switch';
import { TextareaField } from '@ptrn/react/TextareaField/TextareaField';
import { TimePickerField } from '@ptrn/react/TimePickerField/TimePickerField';
import { Tooltip } from '@ptrn/react/Tooltip/Tooltip';
import { Txt } from '@ptrn/react/Txt/Txt';
import { isDarkTheme } from '@ptrn/react/utils/uiContext';
import { useEffect, useRef, useState } from 'react';
import { Page } from 'src/components/Page';
import { action } from 'src/utils/actions';
import { useGlobalState } from 'src/utils/globalState';

type StateType = Date | string[] | boolean | number | string;

export function Welcome() {
    const [state, setState] = useState<{ [key: string]: unknown }>({});

    const stateProps = <T extends StateType>(name: string, defaultValue?: T) => {
        return {
            value: (state[name] as T) || defaultValue,
            onChange: (value: T | undefined) => {
                setState((prevState) => ({
                    ...prevState,
                    [name]: value,
                }));
            },
            name,
        };
    };

    const { theme, setTheme } = useGlobalState();

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && state.volume) {
            const volume = Number(state.volume) / 11;
            audioRef.current.volume = volume;
            if (volume > 0.1) audioRef.current.play();
            else audioRef.current.pause();
        }
    }, [state.volume]);

    return (
        <Page style={{ padding: '0' }}>
            <audio autoPlay={!!state.volume} controls loop={!!state.volume} ref={audioRef} style={{ display: 'none' }}>
                <track kind="captions" />
                <source src="/audio-test.mp3" type="audio/mpeg" />
            </audio>
            <section
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 'var(--usa-spacing-5)',
                    textAlign: 'center',
                }}
            >
                <h2>pttrn: The Foundation for your next Project</h2>
                <p>
                    A set of custom designed components that you can extend and build on. pttrn makes following the
                    Pattern Design System easier than ever. Open Source. Open Code.
                </p>
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--usa-spacing-3)',
                        marginTop: 'var(--usa-spacing-1)',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    <Button as="a" href="/get-started" label="Get Started" size="small" variant="secondary" />
                    <Button as="a" href="/components" label="View Components" size="small" variant="secondary" />
                </div>
            </section>
            <section style={{ width: '100%', maxWidth: '1280px', padding: 'var(--usa-spacing-5)' }}>
                <Grid columns={3} gap="24" minColumnWidth="300px">
                    <Card
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--usa-spacing-2)',
                            padding: 'var(--usa-spacing-3)',
                            alignItems: 'flex-start',
                        }}
                        variant="outlined"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                console.log(
                                    'Form submitted with state:',
                                    JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
                                );
                            }}
                            style={{ display: 'contents' }}
                        >
                            <Txt variant="labels-base">Payment Method</Txt>
                            <Txt variant="body-small">All transactions are secure and encrypted</Txt>
                            <InputField
                                label="Name on Card"
                                size="small"
                                {...stateProps<string>('payment-name')}
                                placeholder="John Doe"
                            />
                            <Grid columns={[3, 1]} gap="16">
                                <InputField
                                    label="Card Number"
                                    size="small"
                                    {...stateProps<string>('payment-card-number')}
                                    placeholder="1234 5678 9012 3456"
                                    type="number"
                                />
                                <InputField
                                    label="CVV"
                                    size="small"
                                    {...stateProps<string>('payment-cvv')}
                                    placeholder="123"
                                    style={{ maxWidth: '90px' }}
                                />
                            </Grid>
                            <Grid columns={[4, 6]} gap="16" style={{ alignItems: 'end' }}>
                                <SelectField
                                    label="Expiration Month"
                                    size="small"
                                    {...stateProps<string>('payment-expiration')}
                                    options={Array.from({ length: 12 }, (_, i) => ({
                                        label: (i + 1).toString().padStart(2, '0'),
                                        value: (i + 1).toString().padStart(2, '0'),
                                    }))}
                                    placeholder="MM"
                                    scrollLimit={5}
                                />
                                <SelectField
                                    label="Expiration Year"
                                    size="small"
                                    {...stateProps<string>('payment-expiration-year')}
                                    options={Array.from({ length: 10 }, (_, i) => {
                                        const year = new Date().getFullYear() + i;
                                        return { label: year.toString(), value: year.toString() };
                                    })}
                                    placeholder="YYYY"
                                    scrollLimit={5}
                                />
                            </Grid>
                            <Divider />
                            <Txt variant="labels-base">Billing Address</Txt>
                            <Txt variant="body-small">The billing address associated with your payment method</Txt>
                            <div>
                                <CheckboxOption
                                    label="Same as Shipping Address"
                                    {...stateProps<boolean>('same-as-shipping')}
                                    checked={state['same-as-shipping'] as boolean}
                                    style={{ '--list-item-height': 'auto' }}
                                    value="true"
                                />
                            </div>
                            <Divider />
                            <TextareaField
                                label="Comments"
                                maxRows={2}
                                minRows={2}
                                size="small"
                                {...stateProps<string>('comments')}
                                placeholder="Add any additional comments here..."
                            />
                            <Flex gap="8">
                                <Button label="Submit" type="submit" variant="primary" />
                                <Button label="Cancel" onClick={() => {}} type="button" variant="secondary" />
                            </Flex>
                        </form>
                    </Card>
                    <Flex direction="column" gap="8">
                        <Card
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--usa-spacing-2)',
                                padding: 'var(--usa-spacing-3)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                            }}
                            variant="outlined"
                        >
                            <AvatarGroup
                                items={[
                                    { name: 'George Costanza', initials: 'GC', color: 'warning' },
                                    { name: 'Alice Johnson', image: '/avatar-01.png' },
                                    { name: 'Bob Smith', image: '/avatar-02.png' },
                                    { name: 'Diana Prince', image: '/avatar-05.png' },
                                    { name: 'Ethan Hunt', initials: 'EH', color: 'info' },
                                    { name: 'Charlie Brown', image: '/avatar-03.png' },
                                    { name: 'Frank Underwood', image: '/avatar-04.png' },
                                    { name: 'Fiona Glenanne', initials: 'FG', color: 'error' },
                                    { name: 'Hannah Baker', initials: 'HB', color: 'accent-cool' },
                                    { name: 'Irene Adler', initials: 'IA', color: 'secondary' },
                                ]}
                                max={5}
                                size="medium"
                                variant="stacked"
                            />
                            <Txt variant="subheader-medium">Team Members</Txt>
                            <Txt variant="body-small">Manage your team and permissions here. Lorem ipsum dolor.</Txt>
                            <Button label="Manage Team" variant="secondary" />
                        </Card>
                        <Flex
                            align="center"
                            direction="column"
                            gap="16"
                            style={{ padding: 'var(--usa-spacing-2)', alignContent: 'start' }}
                        >
                            <ProgressBar completion={75} label="Uploading Files..." size="large" />
                            <Slider
                                {...stateProps<number>('volume')}
                                label="Volume"
                                max={11}
                                min={0}
                                step={0.1}
                                value={state.volume as number | undefined}
                            />
                            <SearchBar
                                size="small"
                                {...stateProps<string>('search')}
                                placeholder="Search..."
                                trailing={<Txt style={{ color: 'var(--theme-color-base-medium)' }}>12 Results</Txt>}
                            />
                            <Input
                                showClearButton={false}
                                size="small"
                                {...stateProps<string>('http')}
                                leading="https://"
                                trailing={
                                    <Tooltip label="This is content in a tooltip.">
                                        {(triggerProps) => <SvgInfo {...triggerProps} />}
                                    </Tooltip>
                                }
                            />
                        </Flex>
                        <Flex justify="center">
                            <ProgressCircle label="Loading..." labelPosition="right" size="small" />
                        </Flex>
                        <Divider />
                        <div>
                            <RadioGroupField
                                label="Select your preferred contact method"
                                {...stateProps<string>('contact-method')}
                                aria-label="Choose a contact method"
                                helperText="How should we reach you for important updates?"
                                options={[
                                    {
                                        label: 'Email',
                                        value: 'email',
                                        description: 'We will send notifications to your email.',
                                    },
                                    {
                                        label: 'Phone',
                                        value: 'phone',
                                        description: 'We will call or text your phone number.',
                                    },
                                    {
                                        label: 'None',
                                        value: 'none',
                                        description: 'You will not receive notifications.',
                                    },
                                ]}
                                {...stateProps<string>('radio-example', 'phone')}
                            />
                        </div>
                    </Flex>
                    <Flex direction="column" gap="16">
                        <Grid columns={[1, 'auto']} gap="16">
                            <DatePickerField
                                label="Destination Date"
                                {...stateProps<string>('destination-date', '10/26/1985')}
                            />
                            <TimePickerField label="Time" {...stateProps<string>('destination-time', '01:21')} />
                        </Grid>
                        <Grid columns={[1, 'auto']} gap="16">
                            <DatePickerField
                                label="Present Date"
                                {...stateProps<string>('present-time', new Date().toLocaleDateString())}
                            />
                            <TimePickerField
                                label="Time"
                                {...stateProps<string>(
                                    'present-time-2',
                                    new Date().toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                    }),
                                )}
                            />
                        </Grid>
                        <Grid columns={[1, 'auto']} gap="16">
                            <DatePickerField
                                label="Last Date Departed"
                                {...stateProps<string>('last-time-departed', '10/26/1985')}
                            />
                            <TimePickerField label="Time" {...stateProps<string>('last-time-departed-2', '01:20')} />
                        </Grid>

                        <SegmentedControl
                            {...stateProps<string>('time-period', 'present')}
                            label="Menu"
                            options={[
                                { label: 'Posts', value: 'posts' },
                                { label: 'Media', value: 'media' },
                                { label: 'Pages', value: 'pages' },
                                { label: 'Comments', value: 'comments' },
                            ]}
                            value={(state['time-period'] as string) || 'present'}
                            width="fill"
                        />
                        <Menu
                            style={{ zIndex: 'unset', padding: 'var(--usa-spacing-1) var(--usa-spacing-1)' }}
                            width="100%"
                        >
                            <ListItem
                                label="Michael Scott"
                                leading={<Avatar image="/avatar-01.png" name="Michael Scott" />}
                                subText="michael.scott@email.com"
                            />
                            <Divider inset={2} padding />
                            <ListItem href="#/my-profile" label="My profile" leading={<SvgAccountCircle />} />
                            <ListItem href="#/settings" label="Settings" leading={<SvgSettings />} />
                            <ListItem
                                as="label"
                                label="Dark mode"
                                leading={isDarkTheme(theme) ? <SvgDarkModeFill /> : <SvgDarkMode />}
                                trailing={
                                    <Switch
                                        aria-label="Toggle dark mode"
                                        checked={isDarkTheme(theme)}
                                        name="dark-mode"
                                        onChange={() => {
                                            setTheme(isDarkTheme(theme) ? 'default' : 'project-theme-dark');
                                        }}
                                        value="dark-mode"
                                    />
                                }
                            />
                            <Divider inset={2} padding={false} thickness="light" />
                            <ListItem href="#/guide-tutorial" label="Guide and tutorial" leading={<SvgMenuBook />} />
                            <ListItem href="#/help-center" label="Help center" leading={<SvgHelp />} />
                            <Divider inset={2} padding />
                            <ListItem href="#/go-premium" label="Go premium" leading={<SvgLicense />} />
                            <ListItem
                                label="Log out"
                                leading={<SvgLogout />}
                                onClick={() => {
                                    action('Log out clicked');
                                }}
                                role="button"
                            />
                        </Menu>
                    </Flex>
                </Grid>
            </section>
        </Page>
    );
}
