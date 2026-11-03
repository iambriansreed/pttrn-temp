import { html, nothing } from 'lit';

/**
 * The drawn box of a checkbox, after its transparent native input: the check when checked, the bar when indeterminate.
 * The SVGs are those of @ptrn/react's Checkbox. Style it with `@use '../../styles/checkbox';`.
 */
export function checkboxBox(checked: boolean, indeterminate: boolean) {
    return html`<span aria-hidden="true">
        ${
            checked && !indeterminate
                ? html`<svg data-checked fill="none" viewBox="0 0 14 11" xmlns="http://www.w3.org/2000/svg">
                      <path
                          d="M5.485 10.182a1 1 0 0 1-1.414 0l-3.03-3.03a1 1 0 0 1 0-1.415l.14-.141a1 1 0 0 1 1.415 0l2.182 2.182 6.626-6.627a1 1 0 0 1 1.414 0l.142.142a1 1 0 0 1 0 1.414l-7.475 7.475Z"
                          fill="currentColor"
                      />
                  </svg>`
                : nothing
        }
        ${
            indeterminate
                ? html`<svg data-indeterminate fill="none" viewBox="0 0 12 4" xmlns="http://www.w3.org/2000/svg">
                      <path
                          d="M1.44444 3.11089C0.892158 3.11089 0.444443 2.66318 0.444443 2.11089V1.88867C0.444443 1.33639 0.892158 0.888672 1.44444 0.888672H10.5556C11.1078 0.888672 11.5556 1.33639 11.5556 1.88867V2.11089C11.5556 2.66318 11.1078 3.11089 10.5556 3.11089H1.44444Z"
                          fill="currentColor"
                      />
                  </svg>`
                : nothing
        }
    </span>`;
}
