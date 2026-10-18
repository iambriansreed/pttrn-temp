import { Page } from '@playwright/test';
import data from '../src/meta/data.json' with { type: 'json' };

const { componentsMeta, typesMeta } = data;

/** Navigates relative to the configured baseURL and waits for the network to settle. */
async function gotoUrl(page: Page, pathName: string) {
    await page.goto(pathName);
    return await page.waitForLoadState('networkidle');
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
