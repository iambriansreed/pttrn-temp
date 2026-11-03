import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

/**
 * A decorative `@ptrn/icons` SVG (imported as a string, `import add from '@ptrn/icons/Add.svg'`) hidden from assistive
 * technology, as the React icons are when passed `aria-hidden`.
 */
export function icon(markup: string) {
    return unsafeSVG(markup.replace('<svg', '<svg aria-hidden="true"'));
}
