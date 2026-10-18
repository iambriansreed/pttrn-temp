import 'src/components/searchModal.scss';
import { Dialog, DialogProps } from '@ptrn/react/Dialog';
import { Input } from '@ptrn/react/Input';
import { Tag } from '@ptrn/react/Tag';
import { Txt } from '@ptrn/react/Txt';
import { useArrowNavigation } from '@ptrn/react/hooks/useArrowNavigation';
import { useTimeout } from '@ptrn/react/hooks/useTimeout';
import { ComponentMeta } from '@ptrn/react/types/meta';
import { handleKeyDown } from '@ptrn/react/utils/handleKeyDown';
import { Fragment, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TypeMeta, UtilityMeta } from 'src/meta';
import { componentsMeta, typesMeta, utilitiesMeta } from 'src/meta/data.json';

type Meta =
    | (ComponentMeta & { kind: 'component' })
    | (TypeMeta & { kind: 'type' })
    | (UtilityMeta & { kind: 'utility' });

export type Result = {
    name: string;
    url: string;
    content: (string | { match: string })[];
    kind: string;
    score: number;
    id: string;
};

const EXCERPT_LENGTH = 150;

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

    return (matchIndex ? '...' : '') + chunk.trim() + (sliceEnd < content.length ? '...' : '');
};

export function SearchModal(props: DialogProps) {
    //
    const [search, setSearch] = useState('');

    // 1. no search term - null
    // 2. search term entered - 'searching'
    // 3. search term entered, debounce timeout complete, results found - Result[]
    const [results, setResults] = useState<Result[] | 'searching' | null>(null);

    const resultsRef = useRef<HTMLDivElement | null>(null);
    const timeout = useTimeout();
    const navigate = useNavigate();

    const updateSearch = (next: string | undefined) => {
        setSearch(next || '');

        timeout.clear();

        if (!search.length) {
            setResults(null);
            return;
        }

        setResults('searching');

        timeout.set(() => {
            const searchString = search.toLowerCase().trim();

            const nextResultIndexes = (
                [
                    //
                    ...componentsMeta.map((m) => ({ ...m, kind: 'component' })),
                    ...typesMeta.map((m) => ({ ...m, kind: 'type' })),
                    ...utilitiesMeta.map((m) => ({ ...m, kind: 'utility' })),
                ] as Meta[]
            )
                .flatMap((meta): Result | [] => {
                    const titleMatch = meta.name.toLowerCase().includes(searchString);

                    let trimmedContent = '';
                    let match: RegExpMatchArray | null = null;
                    if (meta.description) {
                        match = meta.description?.match(new RegExp(searchString, 'i'));
                        if (match) trimmedContent = trimContent(meta.description, match.index || 0);
                    }

                    let content: Result['content'] = [trimmedContent];

                    if (match && match[0]) {
                        content = trimmedContent.split(match[0]);
                        content.splice(1, 0, {
                            match: match[0],
                        });
                    }

                    const url = (match || titleMatch) && getUrlForMeta(meta);

                    return url
                        ? {
                              ...meta,
                              content,
                              score: titleMatch ? 1 : 0.5,
                              kind: meta.kind || 'component',
                              url,
                              id: `result-${meta.name}`,
                          }
                        : [];
                })
                .sort((a, b) => b.score - a.score);

            setResults(nextResultIndexes);

            setActiveElementId(nextResultIndexes[0]?.id || null);

            resultsRef?.current?.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }, 500);
    };
    const { activeElementId, setActiveElementId, arrowKeyCallbacks } = useArrowNavigation({
        ids: (Array.isArray(results) ? results : []).map((i) => i.id),
    });

    return (
        <Dialog data-search-modal {...props} placement="top">
            <Input
                aria-label="Search"
                name="search"
                onChange={updateSearch}
                onKeyDown={handleKeyDown({
                    ...arrowKeyCallbacks,
                    Enter: () => {
                        if (activeElementId) {
                            const activeResult = Array.isArray(results)
                                ? results.find((r) => r.id === activeElementId)
                                : null;
                            if (activeResult) {
                                navigate(activeResult.url);
                                props.onClose();
                            }
                        }
                    },
                })}
                trailing={
                    <Txt style={{ color: 'var(--theme-color-base-medium)' }} variant="labels-x-small">
                        ESC
                    </Txt>
                }
                value={search}
            />
            <div data-search-results ref={resultsRef}>
                {results === 'searching' && <p>Searching...</p>}
                {Array.isArray(results) && results?.length === 0 && <p>No results found.</p>}
                {Array.isArray(results) &&
                    results?.map((result) => {
                        return (
                            <div
                                data-active={activeElementId === result.id || undefined}
                                data-search-result
                                id={result.id}
                                key={result.name}
                                onClickCapture={() => {
                                    navigate(result.url);
                                    props.onClose();
                                }}
                            >
                                <header
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 'var(--usa-spacing-1)',
                                    }}
                                >
                                    <h5>{result.name}</h5>
                                    <Tag color="base" label={result.kind} size="x-small" />
                                </header>

                                <div>
                                    {result.content.map((fragment, index) => (
                                        <Fragment key={index}>
                                            {typeof fragment === 'string' ? (
                                                fragment
                                            ) : (
                                                <span style={{ fontWeight: '600' }}>{fragment.match}</span>
                                            )}
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </Dialog>
    );
}

function getUrlForMeta(meta: Meta): string | null {
    switch (meta.kind) {
        case 'component':
            return `/${meta.slug}`;
        case 'type': {
            let parentSlug;
            const parentComponent = meta.components?.[0];
            if (parentComponent) parentSlug = componentsMeta.find((c) => c.name === parentComponent)?.slug;
            if (parentSlug) return `/${parentSlug}`;
            return null;
        }
        case 'utility':
            return `/hooks`;
        default:
            return '/hooks';
    }
}
