import { test, type PlaywrightTestArgs } from '@playwright/test';
import type { ComponentSpec } from '../../react/src/types/meta';

export type { ComponentSpec };

export type BehaviorTests = Record<string, (args: PlaywrightTestArgs) => Promise<void>>;

/**
 * Registers one test per behavior in the React component's `spec.ts`, the same contract the React suite is held to: a
 * behavior without a test fails, and a test for a behavior the spec does not list fails. This is what keeps the Web
 * Component at parity with the React component.
 *
 * @example
 *     import { spec } from '../../react/src/components/Accordion/spec';
 *     import { describeBehaviors } from './spec';
 *
 *     describeBehaviors(spec, {
 *         'toggle-on-click': async ({ page }) => {
 *             // ...
 *         },
 *     });
 */
export function describeBehaviors(spec: ComponentSpec, tests: BehaviorTests) {
    const ids = spec.behaviors.map((behavior) => behavior.id);
    const unknown = Object.keys(tests).filter((id) => !ids.includes(id));

    test.describe(`${spec.name} behaviors (spec.ts)`, () => {
        if (unknown.length) {
            test('tests only behaviors the spec lists', () => {
                throw new Error(
                    `${spec.name}/spec.ts does not list: ${unknown.join(', ')}. Add the behavior to the spec or remove the test.`,
                );
            });
        }

        for (const behavior of spec.behaviors) {
            const run = tests[behavior.id];
            // Playwright reads the fixtures a test uses from its destructured first parameter.
            test(`${behavior.id}: ${behavior.description}`, async ({ page, context, request }) => {
                if (!run) {
                    throw new Error(
                        `${spec.name}/spec.ts lists "${behavior.id}" but the Web Component suite has no test for it.`,
                    );
                }
                await run({ page, context, request });
            });
        }
    });
}
