import fs from 'node:fs';
import path from 'node:path';

/**
 * The markup of an icon from `@ptrn/icons` (the raw `.svg` file a consumer pastes or inlines), with a `slot` attribute
 * so it lands in the element's icon slot.
 */
export function icon(name: string, slot = 'icon') {
    const markup = fs.readFileSync(path.resolve(import.meta.dirname, '../../icons', `${name}.svg`), 'utf8').trim();
    return slot ? markup.replace('<svg', `<svg slot="${slot}"`) : markup;
}
