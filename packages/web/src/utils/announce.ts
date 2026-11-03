/**
 * Announces `message` to assistive technology through a live region at the end of the document, as @ptrn/react's
 * `sendAriaLiveMessage` does: the previous region goes, a fresh one is added, so the same message is read again. The
 * region is visually hidden with inline styles because the page may not load the React base styles.
 */
export function announce(message: string, live: 'assertive' | 'polite' = 'polite') {
    document.querySelectorAll('[data-pttrn-aria-live]').forEach((element) => element.remove());
    const region = document.createElement('div');
    region.dataset.pttrnAriaLive = '';
    region.setAttribute('aria-live', live);
    region.setAttribute('role', 'alert');
    region.style.cssText =
        'position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(1px, 1px, 1px, 1px); white-space: nowrap;';
    region.textContent = message;
    document.body.append(region);
}
