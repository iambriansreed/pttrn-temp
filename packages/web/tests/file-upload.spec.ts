import AxeBuilder from '@axe-core/playwright';
import { expect, test, type FileChooser, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/FileUpload/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const MB = 1048576;

type Entry = {
    id: string;
    fileName: string;
    fileSize: number;
    status?: string;
    progress?: number;
    errorMessage?: string;
};
type FilePayload = { name: string; mimeType: string; buffer: Buffer };

const png = (name: string, bytes = 1024): FilePayload => ({
    name,
    mimeType: 'image/png',
    buffer: Buffer.alloc(bytes, 'x'),
});

const UPLOADING: Entry = { id: 'u1', fileName: 'photo.png', fileSize: 1.5, status: 'uploading', progress: 40 };
const FAILED: Entry = { id: 'f1', fileName: 'notes.txt', fileSize: 1, status: 'error', errorMessage: 'Not allowed' };
const COMPLETE: Entry = { id: 'c1', fileName: 'done.pdf', fileSize: 0.5, status: 'complete', progress: 100 };

/** Mirrors the presets in `packages/react/src/components/FileUpload/FileUploadExample.tsx`. */
const EXAMPLE =
    'accept="image/png, image/gif, image/svg+xml, image/jpeg" max-file-size="1" upload-subtitle="SVG, PNG, JPG or GIF (max. 1MB)"';
const PRESETS = {
    'multiple files': `<pttrn-file-upload multiple ${EXAMPLE}></pttrn-file-upload>`,
    'Drag and Drop Multiple Files': `<pttrn-file-upload drag-and-drop multiple ${EXAMPLE}></pttrn-file-upload>`,
};

const host = (page: Page) => page.locator('pttrn-file-upload').first();
const zone = (page: Page) => host(page).locator('[data-pttrn="file-upload"]');
const fileInput = (page: Page) => host(page).locator('input[type="file"]');
const browse = (page: Page) => page.getByRole('button', { name: 'Browse' });
const items = (page: Page) => host(page).locator('pttrn-file-upload-item');
const itemNames = (page: Page) =>
    items(page).evaluateAll((list) =>
        list.map((item) => item.shadowRoot?.querySelector('[data-file-name]')?.textContent),
    );

/** Records every pttrn-upload, pttrn-error and pttrn-cancel detail, with each File as its name, size and type. */
async function record(page: Page) {
    await page.evaluate(() => {
        const log: { type: string; detail: unknown }[] = [];
        (window as unknown as { log: typeof log }).log = log;
        for (const type of ['pttrn-upload', 'pttrn-error', 'pttrn-cancel']) {
            document.addEventListener(type, (event) => {
                const detail = (event as CustomEvent).detail;
                const files = detail.files?.map((entry: { file?: File }) => ({
                    ...entry,
                    file: entry.file && { name: entry.file.name, size: entry.file.size, type: entry.file.type },
                }));
                log.push({ type, detail: files ? { files } : detail });
            });
        }
    });
}
const events = (page: Page, type: string) =>
    page.evaluate(
        (name) =>
            (window as unknown as { log: { type: string; detail: unknown }[] }).log
                .filter((entry) => entry.type === name)
                .map((entry) => entry.detail),
        type,
    );

const setFiles = (page: Page, files: Entry[]) =>
    host(page).evaluate((el, value) => ((el as HTMLElement & { files: unknown }).files = value), files);

/** Drags `files` over the zone and drops them, as a browser would. */
async function drop(page: Page, files: { name: string; type: string }[]) {
    const dataTransfer = await page.evaluateHandle((list) => {
        const transfer = new DataTransfer();
        for (const { name, type } of list) transfer.items.add(new File(['x'], name, { type }));
        return transfer;
    }, files);
    await zone(page).dispatchEvent('dragover', { dataTransfer });
    await zone(page).dispatchEvent('drop', { dataTransfer });
}

test.describe('pttrn-file-upload', () => {
    test('submits the accepted files with its form, and a reset clears them', async ({ page }) => {
        await mount(
            page,
            `<form><pttrn-file-upload multiple name="attachments" accept="image/png"></pttrn-file-upload></form>`,
        );
        await fileInput(page).setInputFiles([png('a.png'), png('b.png'), { ...png('c.txt'), mimeType: 'text/plain' }]);
        const submitted = () =>
            page.evaluate(() =>
                new FormData(document.querySelector('form')!).getAll('attachments').map((file) => (file as File).name),
            );
        expect(await submitted()).toEqual(['a.png', 'b.png']);
        expect(await host(page).evaluate((el) => (el as HTMLElement & { form: HTMLFormElement }).form?.tagName)).toBe(
            'FORM',
        );

        await page.evaluate(() => document.querySelector('form')!.reset());
        expect(await submitted()).toEqual([]);
        await expect(items(page)).toHaveCount(0);
    });

    test('cancelling removes the file unless the event is prevented', async ({ page }) => {
        await mount(page, `<form><pttrn-file-upload multiple name="attachments"></pttrn-file-upload></form>`);
        await record(page);
        await fileInput(page).setInputFiles([png('a.png'), png('b.png')]);

        await page.getByRole('button', { name: 'Cancel a.png' }).click();
        expect(await events(page, 'pttrn-cancel')).toEqual([{ fileName: 'a.png', id: expect.any(String) }]);
        expect(await itemNames(page)).toEqual(['b.png']);
        expect(
            await page.evaluate(() =>
                new FormData(document.querySelector('form')!).getAll('attachments').map((file) => (file as File).name),
            ),
        ).toEqual(['b.png']);

        await page.evaluate(() => document.addEventListener('pttrn-cancel', (event) => event.preventDefault()));
        await page.getByRole('button', { name: 'Cancel b.png' }).click();
        expect(await itemNames(page)).toEqual(['b.png']);
    });

    test('a disabled fieldset disables Browse', async ({ page }) => {
        await mount(page, `<form><fieldset disabled><pttrn-file-upload></pttrn-file-upload></fieldset></form>`);
        await expect(browse(page)).toBeDisabled();
    });

    test('accepts type wildcards and extensions too', async ({ page }) => {
        await mount(page, `<pttrn-file-upload multiple accept="image/*, .pdf"></pttrn-file-upload>`);
        await record(page);
        await fileInput(page).setInputFiles([
            png('a.png'),
            { name: 'b.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') },
            { name: 'c.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
        ]);
        const [upload] = (await events(page, 'pttrn-upload')) as { files: Entry[] }[];
        expect(upload.files.map((entry) => entry.fileName)).toEqual(['a.png', 'b.pdf']);
    });
});

describeBehaviors(spec, {
    'renders-zone': async ({ page }) => {
        await mount(page, '<pttrn-file-upload upload-subtitle="PNG or GIF (max. 2MB)"></pttrn-file-upload>');

        await expect(zone(page)).toContainText('Upload a File');
        await expect(page.getByText('PNG or GIF (max. 2MB)')).toBeVisible();
        await expect(browse(page)).toBeVisible();
        await expect(zone(page).locator('svg').first()).toHaveAttribute('aria-hidden', 'true');

        await expect(fileInput(page)).toBeHidden();
        await expect(fileInput(page)).not.toHaveAttribute('multiple');
        await host(page).evaluate((el) => el.setAttribute('accept', 'image/png,image/gif'));
        await expect(fileInput(page)).toHaveAttribute('accept', 'image/png, image/gif');

        // A second file upload on the page keeps its own input id.
        await mount(page, '<pttrn-file-upload></pttrn-file-upload><pttrn-file-upload></pttrn-file-upload>');
        const ids = await page
            .locator('pttrn-file-upload input[type="file"]')
            .evaluateAll((inputs) => inputs.map((input) => input.id));
        expect(ids[0]).toBeTruthy();
        expect(ids[0]).not.toBe(ids[1]);
    },
    browse: async ({ page }) => {
        // Listen before anything happens: adding a filechooser listener turns on the browser's file chooser
        // interception asynchronously, and a key press sent right after waitForEvent could open the picker first.
        const choosers: FileChooser[] = [];
        page.on('filechooser', (chooser) => choosers.push(chooser));
        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');

        await page.keyboard.press('Tab');
        await expect(browse(page)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect.poll(() => choosers.length).toBe(1);
        expect(choosers[0].isMultiple()).toBe(false);
        // Close the first chooser: the browser ignores a second picker while one is still open.
        await choosers[0].setFiles([]);

        await browse(page).click();
        await expect.poll(() => choosers.length).toBe(2);
    },
    'uploads-selection': async ({ page }) => {
        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');
        await record(page);

        await fileInput(page).setInputFiles(png('photo.png'));

        expect(await events(page, 'pttrn-error')).toEqual([]);
        expect(await events(page, 'pttrn-upload')).toEqual([
            {
                files: [
                    {
                        id: expect.stringMatching(/^[a-z0-9]{8}$/),
                        fileName: 'photo.png',
                        fileSize: 1024 / MB,
                        status: 'idle',
                        progress: 0,
                        errorMessage: '',
                        file: { name: 'photo.png', size: 1024, type: 'image/png' },
                    },
                ],
            },
        ]);

        const item = items(page).first();
        await expect(item).toContainText('photo.png');
        await expect(item.locator('[data-file-details]')).toHaveText('1 KB • idle');
        await expect(item.getByRole('progressbar', { name: '0%' })).toHaveAttribute('aria-valuenow', '0');
    },
    'rejects-type': async ({ page }) => {
        await mount(page, '<pttrn-file-upload accept="image/png"></pttrn-file-upload>');
        await record(page);

        await fileInput(page).setInputFiles({
            name: 'notes.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('hello'),
        });

        expect(await events(page, 'pttrn-upload')).toEqual([]);
        expect(await events(page, 'pttrn-error')).toEqual([
            {
                files: [
                    expect.objectContaining({
                        fileName: 'notes.txt',
                        status: 'error',
                        errorMessage: 'File type not accepted: notes.txt',
                        file: { name: 'notes.txt', size: 5, type: 'text/plain' },
                    }),
                ],
            },
        ]);

        const item = items(page).first();
        await expect(item.getByRole('alert')).toHaveText('File type not accepted: notes.txt');
        await expect(item.getByRole('progressbar')).toHaveCount(0);
        await expect(item.locator('[data-file-details]')).toContainText('• error');
    },
    'rejects-size': async ({ page }) => {
        await mount(page, '<pttrn-file-upload max-file-size="1"></pttrn-file-upload>');
        await record(page);

        await fileInput(page).setInputFiles(png('big.png', MB + 1));
        expect(await events(page, 'pttrn-upload')).toEqual([]);
        expect(await events(page, 'pttrn-error')).toEqual([
            {
                files: [
                    expect.objectContaining({
                        fileName: 'big.png',
                        status: 'error',
                        errorMessage: 'File too large. Please upload a smaller file: big.png',
                    }),
                ],
            },
        ]);
        await expect(page.getByRole('alert')).toHaveText('File too large. Please upload a smaller file: big.png');

        await fileInput(page).setInputFiles(png('fits.png', MB));
        expect(await events(page, 'pttrn-upload')).toEqual([
            { files: [expect.objectContaining({ fileName: 'fits.png', status: 'idle' })] },
        ]);
        expect(await events(page, 'pttrn-error')).toHaveLength(1);
    },
    'multiple-files': async ({ page }) => {
        await mount(page, '<pttrn-file-upload multiple></pttrn-file-upload>');
        await record(page);

        await expect(zone(page)).toContainText('Upload Files');
        await expect(fileInput(page)).toHaveAttribute('multiple');

        await fileInput(page).setInputFiles([png('b.png'), png('a.png')]);
        const uploads = (await events(page, 'pttrn-upload')) as { files: Entry[] }[];
        expect(uploads).toHaveLength(1);
        expect(uploads[0].files.map((entry) => entry.fileName)).toEqual(['b.png', 'a.png']);
        expect(await itemNames(page)).toEqual(['a.png', 'b.png']);
    },
    'drag-and-drop': async ({ page }) => {
        await mount(page, '<pttrn-file-upload drag-and-drop></pttrn-file-upload>');
        await record(page);

        await expect(zone(page)).toContainText('Drag and Drop');
        await zone(page).dispatchEvent('dragover');
        await expect(zone(page)).toHaveClass('drag-over');
        await zone(page).dispatchEvent('dragleave');
        await expect(zone(page)).not.toHaveClass('drag-over');

        await drop(page, [{ name: 'dropped.png', type: 'image/png' }]);
        await expect(zone(page)).not.toHaveClass('drag-over');
        expect(await events(page, 'pttrn-upload')).toEqual([
            {
                files: [
                    expect.objectContaining({
                        fileName: 'dropped.png',
                        file: { name: 'dropped.png', size: 1, type: 'image/png' },
                    }),
                ],
            },
        ]);
        await expect(items(page)).toHaveCount(1);

        // Without drag-and-drop the zone ignores drags and drops.
        await host(page).evaluate((el) => el.removeAttribute('drag-and-drop'));
        await zone(page).dispatchEvent('dragover');
        await expect(zone(page)).not.toHaveClass('drag-over');
        await drop(page, [{ name: 'ignored.png', type: 'image/png' }]);
        expect(await events(page, 'pttrn-upload')).toHaveLength(1);
        await expect(items(page)).toHaveCount(1);
    },
    'lists-files': async ({ page }) => {
        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');
        await setFiles(page, [FAILED, UPLOADING, COMPLETE]);

        // By name, with failed files after the rest.
        expect(await itemNames(page)).toEqual(['done.pdf', 'photo.png', 'notes.txt']);
        const [done, photo, notes] = [0, 1, 2].map((index) => items(page).nth(index));
        await expect(done.locator('[data-file-details]')).toHaveText('512 KB • complete');
        await expect(done.getByRole('progressbar', { name: '100%' })).toHaveAttribute('aria-valuenow', '100');
        await expect(done.getByRole('progressbar')).toHaveAttribute('aria-busy', 'false');

        await expect(photo.locator('[data-file-details]')).toHaveText('1.5 MB • uploading');
        await expect(photo.getByRole('progressbar', { name: '40%' })).toHaveAttribute('aria-valuenow', '40');
        await expect(photo.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');

        await expect(notes.locator('[data-file-details]')).toHaveText('1 MB • error');
        await expect(notes.getByRole('alert')).toHaveText('Not allowed');
        await expect(notes.getByRole('progressbar')).toHaveCount(0);
    },
    'zone-error': async ({ page }) => {
        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');
        await setFiles(page, [FAILED]);
        await expect(zone(page).getByRole('alert')).toHaveText('Not allowed');
        await expect(page.getByRole('alert')).toHaveCount(2);

        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');
        await setFiles(page, [{ ...FAILED, errorMessage: undefined } as Entry]);
        await expect(zone(page).getByRole('alert')).toHaveText(
            'There was an error uploading the file. Please try again.',
        );

        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');
        await setFiles(page, [FAILED, UPLOADING]);
        await expect(zone(page).getByRole('alert')).toHaveCount(0);
        await expect(page.getByRole('alert')).toHaveCount(1);
    },
    cancel: async ({ page }) => {
        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');
        await record(page);
        // Keep the entry, so the same file can be cancelled again under another label.
        await page.evaluate(() => document.addEventListener('pttrn-cancel', (event) => event.preventDefault()));
        await setFiles(page, [UPLOADING]);

        await page.getByRole('button', { name: 'Cancel photo.png' }).click();
        expect(await events(page, 'pttrn-cancel')).toEqual([{ fileName: 'photo.png', id: 'u1' }]);

        await host(page).evaluate((el) => el.setAttribute('cancel-button-label', 'Remove'));
        await expect(page.getByRole('button', { name: /^Cancel/ })).toHaveCount(0);
        await page.getByRole('button', { name: 'Remove photo.png' }).focus();
        await page.keyboard.press('Enter');
        expect(await events(page, 'pttrn-cancel')).toEqual([
            { fileName: 'photo.png', id: 'u1' },
            { fileName: 'photo.png', id: 'u1' },
        ]);
    },
    'tracks-files-prop': async ({ page }) => {
        await mount(page, '<pttrn-file-upload></pttrn-file-upload>');
        await setFiles(page, [UPLOADING]);
        await expect(page.getByRole('progressbar', { name: '40%' })).toBeVisible();
        const first = await items(page).first().elementHandle();

        await setFiles(page, [{ ...UPLOADING, progress: 80 }]);
        await expect(page.getByRole('progressbar', { name: '80%' })).toHaveAttribute('aria-valuenow', '80');
        await expect(items(page)).toHaveCount(1);
        // The same element, updated rather than remounted.
        expect(await first!.evaluate((el) => el.isConnected)).toBe(true);

        await setFiles(page, [{ ...UPLOADING, status: 'complete', progress: 100 }, COMPLETE]);
        await expect(items(page)).toHaveCount(2);
        expect(await itemNames(page)).toEqual(['done.pdf', 'photo.png']);
        await expect(page.getByRole('progressbar', { name: '100%' })).toHaveCount(2);
        expect(await first!.evaluate((el) => el.isConnected)).toBe(true);
    },
    'axe-clean': async ({ page }) => {
        const cases: [string, Entry[]][] = [
            ...Object.values(PRESETS).map((html): [string, Entry[]] => [html, []]),
            ['<pttrn-file-upload></pttrn-file-upload>', [FAILED, UPLOADING]],
            ['<pttrn-file-upload></pttrn-file-upload>', [FAILED]],
        ];
        for (const [html, files] of cases) {
            await mount(page, html);
            if (files.length) await setFiles(page, files);
            const results = await new AxeBuilder({ page }).include('pttrn-file-upload').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
