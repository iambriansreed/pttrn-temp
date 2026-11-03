import type { Page } from '@playwright/test';

export type AxSummary = { role?: string; name?: string; description?: string };

/**
 * The accessibility node Chromium builds for the first element matching `selector` (shadow roots pierced): its role,
 * name and description as assistive technology gets them. Unlike Playwright's role locators, which read the DOM, this
 * includes what an element sets through ElementInternals (role, ariaLabel, ariaDescribedByElements).
 */
export async function axNode(page: Page, selector: string): Promise<AxSummary> {
    const cdp = await page.context().newCDPSession(page);
    try {
        const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
        const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
        const node = nodes[0];
        return {
            role: node?.role?.value as string | undefined,
            name: node?.name?.value as string | undefined,
            description: node?.description?.value as string | undefined,
        };
    } finally {
        await cdp.detach();
    }
}
