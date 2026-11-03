import type { Page } from '@playwright/test';

/**
 * The computed color a design token resolves to on the page, such as `rgb(0, 94, 162)`, to compare with the computed
 * style of an element that should use it. Read in the page so a theme change is picked up.
 */
export function tokenColor(page: Page, token: `--${string}`) {
    return page.evaluate((name) => {
        const probe = document.createElement('div');
        probe.style.color = `var(${name})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
    }, token);
}

/** The computed length a design token resolves to on the page, such as `16px`. */
export function tokenLength(page: Page, token: `--${string}`) {
    return page.evaluate((name) => {
        const probe = document.createElement('div');
        probe.style.width = `var(${name})`;
        probe.style.position = 'absolute';
        document.body.append(probe);
        const width = getComputedStyle(probe).width;
        probe.remove();
        return width;
    }, token);
}
