import './file-upload-item.scss';
import { SvgDelete } from '@ptrn/icons/Delete';
import { SvgDraft } from '@ptrn/icons/Draft';
import { Button } from '-/components/Button';
import { InlineAlert } from '-/components/InlineAlert';
import { ProgressBar } from '-/components/ProgressBar';
import { Truncated } from '-/components/Truncated';
import { DEFAULT_ERROR_MESSAGE, FileEntry } from '-/utils/fileUploads';

export type FileUploadItemProps = FileEntry & {
    /**
     * The function to call when the Cancel button is clicked.
     *
     * @required
     */
    onCancel: (file: Pick<FileEntry, 'fileName'>) => void;
    /**
     * The label used for tooltip text for the Cancel button.
     *
     * @default Cancel
     */
    cancelButtonLabel?: string;
};

/**
 * A component that represents an uploaded item and its status.
 *
 * Usually used with FileUpload to display individual files being uploaded.
 *
 * @example
 *     import { FileUploadItem } from '@ptrn/react/FileUploadItem';
 *
 *     <FileUploadItem
 *         fileName="dunder-mifflin-paper-co.jpg"
 *         fileSize="1.43 mb"
 *         status="Uploading"
 *         onCancel={() => sendSnackbar('Cancel item clicked!')}
 *     />;
 *
 * @name FileUploadItem
 * @phase Stable
 */
export function FileUploadItem({
    fileName = '',
    status,
    fileSize,
    onCancel,
    cancelButtonLabel: onCancelToolTip = 'Cancel',
    progress = 0,
    errorMessage = DEFAULT_ERROR_MESSAGE,
}: FileUploadItemProps) {
    const subText = [fileSizeFormat(fileSize), status].filter(Boolean).join(' • ');

    return (
        <div data-pttrn="file-upload-item">
            <div data-row>
                <div data-icon>
                    <SvgDraft aria-hidden />
                </div>
                <div data-info>
                    <Truncated data-file-name>{fileName}</Truncated>
                    <span data-file-details>{subText}</span>
                </div>
                <Button
                    icon={<SvgDelete />}
                    iconOnly
                    label={onCancelToolTip || 'Cancel'}
                    onClick={() => onCancel({ fileName })}
                    size="large"
                    variant="tertiary"
                />
            </div>
            <div data-status>
                {status === 'error' ? (
                    <InlineAlert label={errorMessage} variant="error" />
                ) : (
                    <ProgressBar
                        align="left"
                        completion={progress}
                        label={`${
                            Math.max(0, Math.min(100, Math.round(progress))) // Ensure completion is between 0 and 100
                        }%`}
                    />
                )}
            </div>
        </div>
    );
}

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

/**
 * This is a simple utility to format file sizes in a human-readable way
 *
 * Lets not support terrabytes or petabytes for now.
 *
 * - @param fileSize {number | null | undefined} - The size of the file in bytes.
 * - @returns {string | null | undefined} A string representing the file size in a human-readable format or the original
 *   value if it cannot be formatted.
 */
function fileSizeFormat(fileSize?: number): string | undefined {
    if (!fileSize) return 'Unknown size';

    const fileSizeMb = fileSize * MB; // Convert bytes to MB

    const roundUp2 = (num: number) => Math.ceil(num * 100) / 100;

    if (fileSizeMb < MB) return `${roundUp2(fileSizeMb / KB)} KB`;
    if (fileSizeMb < GB) return `${roundUp2(fileSizeMb / MB)} MB`;
    return `${roundUp2(fileSizeMb / GB)} GB`;
}
