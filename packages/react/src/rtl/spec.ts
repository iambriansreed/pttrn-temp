import { ComponentSpec } from '-/types/meta';

export type BehaviorTests = Record<string, () => Promise<void> | void>;

/**
 * Registers one test per behavior in a component's `spec.ts`, so the spec and the suite cannot drift: a behavior
 * without a test fails, and a test for a behavior the spec does not list fails.
 *
 * @example
 *     import { spec } from './spec';
 *     import { describeBehaviors } from '-/rtl/spec';
 *
 *     describeBehaviors(spec, {
 *         'toggle-on-click': async () => {
 *             // ...
 *         },
 *     });
 */
export function describeBehaviors(spec: ComponentSpec, tests: BehaviorTests) {
    const ids = spec.behaviors.map((behavior) => behavior.id);
    const unknown = Object.keys(tests).filter((id) => !ids.includes(id));

    describe(`${spec.name} behaviors (spec.ts)`, () => {
        if (unknown.length) {
            it('tests only behaviors the spec lists', () => {
                throw new Error(
                    `${spec.name}/spec.ts does not list: ${unknown.join(', ')}. Add the behavior to the spec or remove the test.`,
                );
            });
        }

        for (const behavior of spec.behaviors) {
            const run = tests[behavior.id];
            it(`${behavior.id}: ${behavior.description}`, async () => {
                if (!run) {
                    throw new Error(
                        `${spec.name}/spec.ts lists "${behavior.id}" but the React suite has no test for it.`,
                    );
                }
                await run();
            });
        }
    });
}
