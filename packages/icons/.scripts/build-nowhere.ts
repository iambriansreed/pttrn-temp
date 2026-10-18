// rename all icons in the assets/nowhere folder -
// 1. all lowercase
// 2. remove spaces
// 3. remove Type=

import fs from 'fs';

fs.readdirSync('assets/nowhere').forEach((file) => {
    if (file.endsWith('.svg')) {
        const newName = file
            .toLowerCase()
            .replace(/^type=/g, '')
            .replace(/ /g, '_');
        fs.renameSync(`assets/nowhere/${file}`, `assets/nowhere/${newName}`);
    }
});
