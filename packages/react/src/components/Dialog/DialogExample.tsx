import { SvgClose } from '@ptrn/icons/Close';
import { useRef, useState } from 'react';
import { Dialog, DialogProps } from '.';
import { Button } from '-/components/Button';
import { Flex } from '-/components/Flex';
import { ComponentExample } from '-/utils/demo';

export const DialogExample: ComponentExample<DialogProps> = {
    render: ({ props, setState, Component }) => {
        const label = 'Open Dialog';
        return (
            <>
                <Button label={label} onClick={() => setState({ open: true })} />
                <Component data-example-component {...props} id="exampleId" onClose={() => setState({ open: false })}>
                    <div style={{ padding: 'var(--usa-spacing-2)' }}>
                        <Flex
                            align="center"
                            justify="space-between"
                            style={{
                                width: '100%',
                                marginBottom: 'var(--usa-spacing-2)',
                            }}
                        >
                            <h4>Dialog</h4>
                            <Button
                                icon={<SvgClose />}
                                iconOnly
                                label="Close dialog"
                                onClick={() => setState({ open: false })}
                                variant="tertiary"
                            />
                        </Flex>
                        <p>Hello, I am a ({props.placement}) dialog!</p>
                    </div>
                </Component>
            </>
        );
    },
    variants: false,
    sections: [
        {
            title: 'Contained Dialog',
            location: 'beforeDemo',
            content: function ContainedDialog() {
                const [open, setOpen] = useState(false);

                const container = useRef<HTMLDivElement | undefined>(undefined);

                return (
                    <div
                        ref={(node) => (container.current = node || undefined)}
                        style={{
                            border: '1px solid var(--theme-color-base-medium)',
                            padding: 'var(--usa-spacing-2)',
                            minHeight: 200,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <Button label="Open Dialog" onClick={() => setOpen(true)} />
                        <Dialog
                            container={container.current}
                            onClose={() => setOpen(false)}
                            open={open}
                            placement="right"
                        >
                            <div style={{ padding: 'var(--usa-spacing-2)' }}>
                                <Flex
                                    align="center"
                                    justify="space-between"
                                    style={{
                                        marginBottom: 'var(--usa-spacing-2)',
                                    }}
                                >
                                    <h4>Contained</h4>
                                    <Button
                                        icon={<SvgClose />}
                                        iconOnly
                                        label="Close dialog"
                                        onClick={() => setOpen(false)}
                                        variant="tertiary"
                                    />
                                </Flex>
                                <p>Hello, I am a contained dialog!</p>
                            </div>
                        </Dialog>
                    </div>
                );
            },
        },
    ],
};

// eslint-disable-next-line react/no-multi-comp
export const Usage = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button label="Open Dialog" onClick={() => setOpen(true)} />
            <Dialog onClose={() => setOpen(false)} open={open}>
                <div style={{ padding: 'var(--usa-spacing-2)' }}>
                    <Flex align="center" justify="space-between">
                        <h1>Dialog Title</h1>
                        <Button
                            icon={<SvgClose />}
                            iconOnly
                            label="Close dialog"
                            onClick={() => setOpen(false)}
                            variant="tertiary"
                        />
                    </Flex>
                    <p>This is the content of the dialog.</p>
                    <Button label="Cancel" onClick={() => setOpen(false)} variant="secondary" />
                </div>
            </Dialog>
        </>
    );
};
