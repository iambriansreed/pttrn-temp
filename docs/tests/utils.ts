import { Page } from '@playwright/test';
import data from '../src/meta/data.json' with { type: 'json' };

const { componentsMeta, typesMeta } = data;

/** Navigates relative to the configured baseURL and waits for the network to settle. */
/**
 * Opens a docs page and waits for it to settle. The site fades its content in (`#root.loaded` in main.tsx), so a test
 * that measures the page too early sees it half transparent: axe then reports the blended colors as contrast failures.
 * Waits for the network, the fade, and any other running finite animation, capped so a stuck one cannot hang a test.
 */
async function gotoUrl(page: Page, pathName: string) {
    await page.goto(pathName);
    await page.waitForLoadState('networkidle');
    await page.locator('#root.loaded').waitFor({ state: 'attached' });
    await page.evaluate(async () => {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const running = document
            .getAnimations()
            .filter(
                (animation) =>
                    animation.playState === 'running' && animation.effect?.getTiming().iterations !== Infinity,
            )
            .map((animation) => animation.finished.catch(() => undefined));
        await Promise.race([Promise.all(running), new Promise((resolve) => setTimeout(resolve, 3000))]);
    });
}

/** Every documented component except the ones still in Backlog, which have no page worth testing yet. */
const components = [...componentsMeta.filter((component) => component.phase !== 'Backlog')].sort((a, b) =>
    a.name.localeCompare(b.name),
);

/**
 * The components whose page renders a live demo: they have a usage example, at least one prop to drive the demo with,
 * and are not Blocks, which render pattern examples instead. Utilities such as Portal, StylesProvider or Truncated
 * document themselves without a demo.
 */
const componentsWithDemo = components.filter((component) => {
    const props = typesMeta.find((type) => type.name === `${component.name}Props`);
    const isBlock = 'blockConfigs' in component && !!component.blockConfigs;
    return !!component.usage && !!props?.properties?.length && !isBlock;
});

export { components, componentsWithDemo, gotoUrl };
