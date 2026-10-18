/// <reference lib="dom" />

interface ZipFile {
    name: string;
    data: Uint8Array;
}

interface ExportResult {
    css: string;
    files: { name: string; css: string }[];
    themes: number;
    skipped: string[];
    images: { name: string; bytes: Uint8Array }[];
    fileName: string;
    imageDir: string;
    figmaFile: string;
    properties: number;
    modeAttributes: number;
}

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(data: Uint8Array) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

// Minimal ZIP writer (stored, no compression), so the plugin needs no dependency. Images are already compressed.
function createZip(files: ZipFile[]) {
    const encoder = new TextEncoder();
    const DOS_DATE = 0x21; // 1980-01-01
    const UTF8_FLAG = 0x0800;
    const parts: Uint8Array[] = [];
    const directory: Uint8Array[] = [];
    let offset = 0;

    for (const { name, data } of files) {
        const nameBytes = encoder.encode(name);
        const crc = crc32(data);

        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, UTF8_FLAG, true);
        local.setUint16(12, DOS_DATE, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, data.length, true);
        local.setUint32(22, data.length, true);
        local.setUint16(26, nameBytes.length, true);
        parts.push(new Uint8Array(local.buffer), nameBytes, data);

        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(8, UTF8_FLAG, true);
        entry.setUint16(14, DOS_DATE, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, data.length, true);
        entry.setUint32(24, data.length, true);
        entry.setUint16(28, nameBytes.length, true);
        entry.setUint32(42, offset, true);
        directory.push(new Uint8Array(entry.buffer), nameBytes);

        offset += 30 + nameBytes.length + data.length;
    }

    const directorySize = directory.reduce((total, part) => total + part.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);

    return new Blob([...parts, ...directory, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

(() => {
    const ui = collect({
        main: 'main',
        working: '[data-working]',
        status: '[data-status]',
        percent: '[data-percent]',
        progress: '[data-progress]',
        bar: '[data-bar]',
        complete: '[data-complete]',
        file: '[data-file]',
        properties: '[data-properties]',
        propertiesLabel: '[data-properties-label]',
        modesCell: '[data-modes-cell]',
        modes: '[data-modes]',
        modesLabel: '[data-modes-label]',
        themesCell: '[data-themes-cell]',
        themes: '[data-themes]',
        themesLabel: '[data-themes-label]',
        imagesCell: '[data-images-cell]',
        images: '[data-images]',
        imagesLabel: '[data-images-label]',
        download: '[data-download]',
        copy: '[data-copy]',
        feedback: '[data-feedback]',
        skipped: '[data-skipped]',
        skippedText: '[data-skipped-text]',
        skippedList: '[data-skipped-list]',
        again: '[data-again]',
        error: '[data-export-error]',
        errorMessage: '[data-error-message]',
        retry: '[data-retry]',
    });
    if (!ui) return;

    type State = 'working' | 'complete' | 'error';
    const sections: Record<State, HTMLElement> = { working: ui.working, complete: ui.complete, error: ui.error };

    let result: ExportResult | null = null;
    let copyTimer = 0;

    function collect<K extends string>(selectors: Record<K, string>) {
        const found = {} as Record<K, HTMLElement>;
        for (const key of Object.keys(selectors) as K[]) {
            const element = document.querySelector<HTMLElement>(selectors[key]);
            if (!element) return null;
            found[key] = element;
        }
        return found;
    }

    const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

    // Keep the start and the end, so a long file name still shows its extension.
    function shorten(text: string, max = 30) {
        if (text.length <= max) return text;
        const tail = Math.floor((max - 1) * 0.45);
        return `${text.slice(0, max - 1 - tail)}\u2026${text.slice(text.length - tail)}`;
    }

    // The window is sized to its content, so ask the plugin to resize after every change.
    function fit() {
        requestAnimationFrame(() => {
            const height = Math.ceil(ui!.main.getBoundingClientRect().height);
            parent.postMessage({ pluginMessage: { type: 'RESIZE', height } }, '*');
        });
    }

    function show(state: State) {
        (Object.keys(sections) as State[]).forEach((key) => (sections[key].hidden = key !== state));
        fit();
    }

    function setProgress(label: string, fraction: number) {
        const percent = Math.round(fraction * 100);
        ui!.status.textContent = label;
        ui!.percent.textContent = `${percent}%`;
        ui!.bar.style.width = `${percent}%`;
        ui!.progress.setAttribute('aria-valuenow', String(percent));
    }

    function feedback(text: string, isError = false, full = text) {
        ui!.feedback.textContent = text;
        ui!.feedback.title = full;
        ui!.feedback.classList.toggle('is-error', isError);
        fit();
    }

    function start() {
        result = null;
        setProgress('Starting export', 0);
        feedback('');
        show('working');
        parent.postMessage({ pluginMessage: { type: 'EXPORT' } }, '*');
    }

    // Figma's iframe often blocks the async clipboard API, so fall back to execCommand.
    async function copyText(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch {
            // fall through to the textarea fallback
        }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);

        try {
            textarea.select();
            if (!document.execCommand('copy')) throw new Error('The browser rejected the copy command.');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    function download(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function showResult(next: ExportResult) {
        result = next;
        const images = next.images.length;

        ui!.file.textContent = next.figmaFile;
        ui!.file.title = next.figmaFile;

        ui!.properties.textContent = next.properties.toLocaleString();
        ui!.propertiesLabel.textContent = plural(next.properties, 'property', 'properties');
        ui!.modes.textContent = String(next.modeAttributes);
        ui!.modesLabel.textContent = plural(next.modeAttributes, 'mode set', 'mode sets');
        ui!.themes.textContent = String(next.themes);
        ui!.themesLabel.textContent = plural(next.themes, 'theme', 'themes');
        ui!.images.textContent = String(images);
        ui!.imagesLabel.textContent = plural(images, 'image', 'images');
        ui!.modesCell.hidden = next.modeAttributes === 0;
        ui!.themesCell.hidden = next.themes === 0;
        ui!.imagesCell.hidden = images === 0;

        ui!.download.textContent = images || next.files.length ? 'Download ZIP' : 'Download CSS';

        const skipped = next.skipped.length;
        ui!.skipped.hidden = skipped === 0;
        ui!.skippedText.textContent = `${skipped} ${plural(skipped, 'item was', 'items were')} skipped`;
        ui!.skippedList.replaceChildren(
            ...next.skipped.map((reason) => {
                const item = document.createElement('li');
                item.textContent = reason;
                return item;
            }),
        );

        feedback('');
        show('complete');
    }

    ui.copy.onclick = () => {
        if (!result) return;

        copyText(result.css)
            .then(() => {
                feedback('Copied to the clipboard.');
                ui!.copy.textContent = 'Copied';
                clearTimeout(copyTimer);
                copyTimer = window.setTimeout(() => (ui!.copy.textContent = 'Copy CSS'), 2000);
            })
            .catch((err) => feedback(`Could not copy: ${err}`, true));
    };

    ui.download.onclick = () => {
        const current = result;
        if (!current) return;

        try {
            const cssFile = `${current.fileName}.css`;

            if (current.images.length === 0 && current.files.length === 0) {
                download(new Blob([current.css], { type: 'text/css' }), cssFile);
                feedback(`Downloaded ${shorten(cssFile)}`, false, `Downloaded ${cssFile}`);
                return;
            }

            // A split export ships the base and theme files in place of the single stylesheet.
            const stylesheets = current.files.length ? current.files : [{ name: cssFile, css: current.css }];
            const encoder = new TextEncoder();
            const files: ZipFile[] = [
                ...stylesheets.map(({ name, css }) => ({ name, data: encoder.encode(css) })),
                ...current.images.map(({ name, bytes }) => ({ name: `${current.imageDir}/${name}`, data: bytes })),
            ];
            download(createZip(files), `${current.fileName}.zip`);
            feedback(`Downloaded ${shorten(`${current.fileName}.zip`)}`, false, `Downloaded ${current.fileName}.zip`);
        } catch (err) {
            feedback(`Could not download: ${err}`, true);
        }
    };

    ui.retry.onclick = start;
    ui.again.onclick = start;

    window.onmessage = ({ data }) => {
        const message = data?.pluginMessage;

        if (message?.type === 'EXPORT_PROGRESS') {
            setProgress(message.label, message.fraction);
        } else if (message?.type === 'EXPORT_RESULT') {
            showResult(message);
        } else if (message?.type === 'EXPORT_ERROR') {
            ui!.errorMessage.textContent = message.message;
            show('error');
        }
    };

    start();
})();
