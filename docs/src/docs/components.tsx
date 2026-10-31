/* eslint-disable react/no-multi-comp */
import { Button } from '@ptrn/react/Button/Button';
import { Divider } from '@ptrn/react/Divider/Divider';
import { Flex } from '@ptrn/react/Flex';
import { Grid } from '@ptrn/react/Grid';
import { Tooltip } from '@ptrn/react/Tooltip/Tooltip';
import { COMPONENT_PHASE_COLORS as colors } from '@ptrn/react/constants/phases';
import { ElementProps } from '@ptrn/react/types/common';
import { COMPONENT_PHASES } from '@ptrn/react/types/meta';
import { Page } from 'components/Page';
import { componentsMeta } from 'src/meta';
import { showUtilityComponent } from 'src/routes';

export function Components() {
    return (
        <Page>
            <Flex direction="column" gap="40">
                <h2 id="components">Components</h2>
                <p>
                    Here you can find all the components available in the library. We are working on adding more
                    components.
                </p>
                <Grid columns={3} gap="24" minColumnWidth="200px" style={{ maxWidth: '900px' }}>
                    {componentsMeta
                        .filter(({ phase }) => phase !== 'Utility' && phase !== 'Backlog')
                        .map((component) => (
                            <div key={component.name}>
                                <Button
                                    as="a"
                                    href={`/${component.slug}`}
                                    label={component.name}
                                    style={{ height: 'auto', padding: 0, minWidth: 'fit-content' }}
                                    variant="tertiary"
                                    width="hug"
                                >
                                    {component.name}{' '}
                                    <Tooltip label={COMPONENT_PHASES[component.phase].title}>
                                        {(triggerProps) => <Dot {...triggerProps} color={colors[component.phase]} />}
                                    </Tooltip>
                                </Button>
                            </div>
                        ))}
                </Grid>
                <Flex>
                    <span>
                        Stable <Dot color={colors.Stable} />
                    </span>
                    <span>
                        UX Review <Dot color={colors.UXReview} />
                    </span>
                    <span>
                        Development <Dot color={colors.Dev} />
                    </span>
                </Flex>
                <Divider />
                <h2>Utility Components</h2>
                <p>
                    Utility components are used to build complex components by composing simpler ones. These are not
                    meant to be used directly in applications but can be useful in prototyping and building new
                    components.
                </p>
                <Grid columns={[1, 1, 1]} gap="32" style={{ maxWidth: '900px' }}>
                    {componentsMeta
                        .filter((component) => component.phase === 'Utility' && showUtilityComponent(component))
                        .map((component) => (
                            <div key={component.name}>
                                <Button
                                    as="a"
                                    href={`/${component.slug}`}
                                    label={component.name}
                                    style={{ height: 'auto', padding: 0, minWidth: 'fit-content' }}
                                    variant="tertiary"
                                    width="hug"
                                >
                                    {component.name}
                                </Button>
                            </div>
                        ))}
                </Grid>
            </Flex>
        </Page>
    );
}

function Dot({ color, ...props }: ElementProps<{ color: string }, 'span'>) {
    return (
        <span
            {...props}
            style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: color,
                marginRight: '8px',
            }}
        />
    );
}
