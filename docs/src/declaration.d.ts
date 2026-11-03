declare module '*.scss';
declare module '*.css';

declare module '*?raw' {
    const content: string;
    export default content;
}

/** Vite's glob import (https://vite.dev/guide/features#glob-import), typed for the eager form the site uses. */
interface ImportMeta {
    glob<T = unknown>(
        pattern: string[] | string,
        options: { eager: true; import?: string; query?: string },
    ): Record<string, T>;
}
