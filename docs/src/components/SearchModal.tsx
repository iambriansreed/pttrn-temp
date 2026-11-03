import 'src/components/searchModal.scss';
import { SvgIcon } from '@ptrn/icons/SvgIcon';
import { Dialog, DialogProps } from '@ptrn/react/Dialog';
import { Input } from '@ptrn/react/Input';
import { Tag } from '@ptrn/react/Tag';
import { Txt } from '@ptrn/react/Txt';
import { useArrowNavigation } from '@ptrn/react/hooks/useArrowNavigation';
import { useId } from '@ptrn/react/hooks/useId';
import { useTimeout } from '@ptrn/react/hooks/useTimeout';
import { handleKeyDown } from '@ptrn/react/utils/handleKeyDown';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { escapeRegExp, loadSearchIndex, search, SearchEntry, SearchGroup } from 'src/utils/searchIndex';

const EXCERPT_LENGTH = 150;

/** How long typing has to pause before the search runs. */
const DEBOUNCE_MS = 150;

const trimContent = (content: string, matchIndex: number, excerptLength: number = EXCERPT_LENGTH): string => {
    const sliceStart = Math.max(matchIndex - excerptLength / 2, 0);
    const sliceEnd = Math.min(sliceStart + excerptLength, content.length);

    let chunk = content.slice(sliceStart, sliceEnd);

    // Ensure words under 15 characters are not cut off at the start
    if (sliceStart > 0) {
        const startMatch = chunk.match(/^[^\s]{1,15}\s/);
        if (startMatch) {
            chunk = chunk.slice(startMatch[0].length);
        }
    }

    // Ensure words under 15 characters are not cut off at the end
    if (sliceEnd < content.length) {
        const endMatch = chunk.match(/\s[^\s]{1,15}$/);
        if (endMatch) {
            chunk = chunk.slice(0, -endMatch[0].length);
        }
    }

    return (sliceStart > 0 ? '...' : '') + chunk.trim() + (sliceEnd < content.length ? '...' : '');
};

/**
 * The excerpt shown under a result: the text around the first place the search appears, with that place marked. When
 * only the name matched, the start of the text.
 */
function excerpt(text: string, value: string): (string | { match: string })[] {
    const terms = [value.trim(), ...value.trim().split(/\s+/)].filter(Boolean);
    for (const term of terms) {
        const found = text.match(new RegExp(escapeRegExp(term), 'i'));
        if (found?.index === undefined) continue;
        const chunk = trimContent(text, found.index);
        const at = chunk.toLowerCase().indexOf(found[0].toLowerCase());
        if (at < 0) break;
        return [
            chunk.slice(0, at),
            { match: chunk.slice(at, at + found[0].length) },
            chunk.slice(at + found[0].length),
        ];
    }
    return [trimContent(text, 0)];
}

/**
 * The site search: components, markdown pages by heading, design tokens, icons, types and hooks, in one index built the
 * first time the dialog opens. Results are grouped by kind. The field is a combobox: Up and Down move through the
 * results, Enter opens the highlighted one.
 */
export function SearchModal(props: DialogProps) {
    const [value, setValue] = useState('');
    // null: nothing typed. 'searching': waiting for the index or the debounce. Otherwise the result groups.
    const [groups, setGroups] = useState<SearchGroup[] | 'searching' | null>(null);
    // The value the shown results were found with; excerpts mark it, not what has been typed since.
    const [searched, setSearched] = useState('');
    const latestValue = useRef('');

    const resultsRef = useRef<HTMLDivElement | null>(null);
    const timeout = useTimeout();
    const navigate = useNavigate();
    const listboxId = useId();

    // Start building the index as soon as the dialog opens, so it is ready by the first keystroke.
    useEffect(() => {
        if (props.open) loadSearchIndex();
    }, [props.open]);

    const results = useMemo(() => (Array.isArray(groups) ? groups.flatMap((group) => group.results) : []), [groups]);

    const { activeElementId, setActiveElementId, arrowKeyCallbacks } = useArrowNavigation({
        ids: results.map((result) => result.id),
        // Left and Right move the caret in the field; only Up and Down move through the results.
        callback: ({ key }) => key === 'ArrowUp' || key === 'ArrowDown',
    });

    const updateSearch = (next: string | undefined) => {
        const nextValue = next || '';
        setValue(nextValue);
        latestValue.current = nextValue;

        timeout.clear();

        if (!nextValue.trim().length) {
            setGroups(null);
            return;
        }

        setGroups('searching');

        timeout.set(() => {
            loadSearchIndex().then((index) => {
                // A later keystroke has started its own search.
                if (latestValue.current !== nextValue) return;

                const nextGroups = search(index, nextValue);
                setSearched(nextValue);
                setGroups(nextGroups);
                setActiveElementId(nextGroups[0]?.results[0]?.id || null);
                resultsRef.current?.scrollTo({ top: 0 });
            });
        }, DEBOUNCE_MS);
    };

    const open = (result: SearchEntry) => {
        navigate(result.url);
        props.onClose();
    };

    const count = results.length;

    return (
        <Dialog data-search-modal {...props} placement="top">
            <Input
                aria-label="Search"
                inputProps={{
                    role: 'combobox',
                    'aria-autocomplete': 'list',
                    'aria-controls': listboxId,
                    'aria-expanded': count > 0,
                    'aria-activedescendant': (count > 0 && activeElementId) || undefined,
                }}
                name="search"
                onChange={updateSearch}
                onKeyDown={handleKeyDown({
                    ...arrowKeyCallbacks,
                    Enter: () => {
                        const activeResult = results.find((result) => result.id === activeElementId);
                        if (activeResult) open(activeResult);
                    },
                })}
                placeholder="Components, pages, tokens, icons"
                trailing={
                    <Txt style={{ color: 'var(--theme-color-base-medium)' }} variant="labels-x-small">
                        ESC
                    </Txt>
                }
                value={value}
            />
            <p aria-live="polite" data-search-status>
                {groups === 'searching' && 'Searching...'}
                {Array.isArray(groups) && (count ? `${count} result${count === 1 ? '' : 's'}` : 'No results found.')}
            </p>
            <div aria-label="Search results" data-search-results id={listboxId} ref={resultsRef} role="listbox">
                {Array.isArray(groups) &&
                    groups.map((group) => (
                        <div
                            aria-labelledby={`${listboxId}-${group.kind}`}
                            data-search-group={group.kind}
                            key={group.kind}
                            role="group"
                        >
                            <div data-search-group-title id={`${listboxId}-${group.kind}`}>
                                {group.title}
                                {group.total > group.results.length && (
                                    <span data-search-group-count>
                                        {' '}
                                        {group.results.length} of {group.total}
                                    </span>
                                )}
                            </div>
                            {group.results.map((result) => (
                                <div
                                    aria-selected={activeElementId === result.id}
                                    data-active={activeElementId === result.id || undefined}
                                    data-search-result
                                    id={result.id}
                                    key={result.id}
                                    onClick={() => open(result)}
                                    onKeyDown={handleKeyDown({ Enter: () => open(result) })}
                                    role="option"
                                    tabIndex={-1}
                                >
                                    <span data-search-result-header>
                                        {result.icon && (
                                            <span aria-hidden data-search-result-icon>
                                                <SvgIcon name={result.icon} />
                                            </span>
                                        )}
                                        {result.swatch && (
                                            <span
                                                aria-hidden
                                                data-search-result-swatch
                                                style={{ backgroundColor: result.swatch }}
                                            />
                                        )}
                                        <span data-search-result-name>{result.name}</span>
                                        {result.detail && <Tag color="base" label={result.detail} size="x-small" />}
                                    </span>
                                    {result.text && (
                                        <span data-search-result-excerpt>
                                            {excerpt(result.text, searched).map((fragment, index) =>
                                                typeof fragment === 'string' ? (
                                                    fragment
                                                ) : (
                                                    <mark key={index}>{fragment.match}</mark>
                                                ),
                                            )}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
            </div>
        </Dialog>
    );
}
