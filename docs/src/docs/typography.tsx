import { CodeExample } from 'components/CodeExample';
import { Markup } from 'components/Markup';
import { Page } from 'components/Page';
import { Syntax } from 'components/Syntax';

type Section = {
    title: string;
    /** When to reach for the element, and what styles it. */
    guidance: string;
    /** The example, always with text around it, so spacing, measure and markers show as they will in a page. */
    html: string;
};

const SECTIONS: Section[] = [
    {
        title: 'Headings',
        guidance:
            'One h1 per page, then h2 to h6 in order without skipping a level. Sizes follow the USWDS prose scale (`--component-prose-h1-font-size` to `--component-prose-h6-font-size`), headings use `--usa-font-family-heading`, and a heading gets 1.5em above it and 1em below.',
        html: `
<h1>Apply for a permit</h1>
<p>Most projects need a permit before work starts.</p>
<h2>Before you apply</h2>
<p>Gather your property records and a site plan.</p>
<h3>Property records</h3>
<p>The county assessor keeps the deed and the parcel number.</p>
<h4>Parcel number</h4>
<p>It is printed on your tax bill.</p>
<h5>Older parcels</h5>
<p>Parcels split before 1990 may carry two numbers.</p>
<h6>Note</h6>
<p>Ask the assessor's office if you cannot find yours.</p>`,
    },
    {
        title: 'Paragraphs',
        guidance:
            'Body text in `--usa-font-family-body` at `--theme-body-font-size` with a 1.5 line height. Paragraphs stop at a 68ex measure, the USWDS reading width, however wide the page is.',
        html: `
<p>
  A permit protects you and your neighbors. The inspector checks that the work meets the building code, and the
  permit record shows a future buyer that the work was done properly.
</p>
<p>
  Most residential permits are reviewed within ten business days. Larger projects, or projects in a historic district,
  can take longer because another office reviews them too.
</p>`,
    },
    {
        title: 'Unordered lists',
        guidance:
            'For items in no particular order. Bullets sit in a 3ch gutter inside the text column, a wrapped line lines up with the text above it rather than with the bullet, and a nested list uses circles.',
        html: `
<p>Bring these to your appointment:</p>
<ul>
  <li>A photo ID</li>
  <li>
    Two copies of the site plan, drawn to scale, showing every structure on the lot and its distance from each
    property line, so the reviewer can check the setbacks without asking for another drawing
  </li>
  <li>
    Proof of ownership, one of:
    <ul>
      <li>the deed</li>
      <li>a recent tax bill</li>
    </ul>
  </li>
</ul>
<p>Copies can be paper or digital.</p>`,
    },
    {
        title: 'Ordered lists',
        guidance:
            'For steps or a ranking, where order matters. Numbers hang in the same 3ch gutter as bullets, and a nested list counts with letters.',
        html: `
<p>To apply online:</p>
<ol>
  <li>Create an account.</li>
  <li>
    Fill in the application. You can save it and come back; drafts are kept for thirty days, after which you start
    again from a blank form.
  </li>
  <li>
    Upload your documents:
    <ol>
      <li>the site plan</li>
      <li>proof of ownership</li>
    </ol>
  </li>
  <li>Pay the fee.</li>
</ol>`,
    },
    {
        title: 'Definition lists',
        guidance: 'For terms and their meanings. The term is bold; the definition is indented by the list gutter.',
        html: `
<p>Terms used on this page:</p>
<dl>
  <dt>Setback</dt>
  <dd>The minimum distance between a structure and a property line.</dd>
  <dt>Parcel</dt>
  <dd>A piece of land with its own number in the county's records.</dd>
</dl>`,
    },
    {
        title: 'Links',
        guidance:
            'Links inside text are underlined and use the `--component-link-*` colors: `--component-link-color`, darker on hover and press, violet once visited. For a link that stands on its own, use the Link component.',
        html: `
<p>
  Read the <a href="#links">zoning code</a> before you draw the site plan, and check the
  <a href="#links">fee schedule</a> for the current amounts.
</p>`,
    },
    {
        title: 'Code, keyboard and sample output',
        guidance:
            'code for names and values from code, kbd for keys a person presses, samp for what a program prints. All three use `--usa-font-family-mono`; kbd also gets a key outline.',
        html: `
<p>
  Set <code>data-uswds-theme</code> on the html element. To search the docs, press <kbd>Cmd</kbd> + <kbd>K</kbd>.
  A missing token prints <samp>Unknown variable</samp> during the build.
</p>`,
    },
    {
        title: 'Inline emphasis',
        guidance:
            'strong for importance and em for stress; b, i, u and s only where the meaning is purely visual. small is `--component-prose-small-font-size`, mark uses the warning tint.',
        html: `
<p>
  <strong>Applications close on June 30.</strong> Late applications are <em>not</em> reviewed. The term
  <i>setback</i> is defined above. <small>Fees are non-refundable.</small> Search results <mark>highlight</mark> the
  words you typed. The <abbr title="Certificate of Occupancy">CO</abbr> is issued after the final inspection.
  Water is H<sub>2</sub>O, and 10<sup>3</sup> is a thousand. The fee is <del>$120</del> <ins>$95</ins>; the old form
  is <s>still accepted</s>.
</p>`,
    },
    {
        title: 'Blockquotes',
        guidance:
            'For a quotation from another source, with its source in cite. A `--theme-color-base-lighter` rule marks the quote.',
        html: `
<p>The county's guidance puts it plainly:</p>
<blockquote>
  <p>Start the review early. Most delays come from a missing document, not from the review itself.</p>
  <cite>Building Department, Permit Guide</cite>
</blockquote>
<p>Upload everything with the application.</p>`,
    },
    {
        title: 'Tables',
        guidance:
            'A plain table inside prose is the USWDS table: every cell bordered, a gray header row, colors from the `--component-table-*` tokens. For sorting, paging or large data use the Table component, which uses the same tokens.',
        html: `
<p>Current fees:</p>
<table>
  <caption>Residential permit fees</caption>
  <thead>
    <tr><th scope="col">Permit</th><th scope="col">Fee</th><th scope="col">Review time</th></tr>
  </thead>
  <tbody>
    <tr><td>Fence</td><td>$45</td><td>3 business days</td></tr>
    <tr><td>Deck</td><td>$95</td><td>10 business days</td></tr>
    <tr><td>Addition</td><td>$350</td><td>20 business days</td></tr>
  </tbody>
</table>
<p>Fees are due when you apply.</p>`,
    },
    {
        title: 'Horizontal rules',
        guidance: 'A thematic break between sections that share a heading. 2em of space above and below.',
        html: `
<p>That covers residential permits.</p>
<hr />
<p>Commercial permits follow a separate process.</p>`,
    },
];

export function Typography() {
    return (
        <Page>
            <div data-prose>
                <h1>Typography</h1>
                <p>
                    pttrn styles long-form content the way USWDS does with <code>usa-prose</code>. Load{' '}
                    <code>@ptrn/styles/prose.css</code> after the tokens and a theme, then put <code>data-prose</code>{' '}
                    on the element that holds your content. The headings, paragraphs, lists, quotes, rules and tables
                    directly inside it get the USWDS type scale, spacing and reading measure. Only direct children are
                    styled, so a component placed in the content keeps its own styles.
                </p>
                <p>
                    Every size, font and color comes from the USWDS Design Kit tokens. The kit has no tokens for line
                    height or measure, so those use the USWDS values: 1.5 for text, 1.2 for headings, a 68ex measure.
                    This site renders every markdown page and every component description this way.
                </p>
            </div>
            <Syntax
                code={`import '@ptrn/styles/tokens.css';
import '@ptrn/styles/themes/default.css';
import '@ptrn/styles/prose.css';

<article data-prose>
  <h1>Apply for a permit</h1>
  <p>Most projects need a permit before work starts.</p>
</article>`}
                language="typescript"
            />
            {SECTIONS.map(({ title, guidance, html }) => (
                <section data-typography-section id={title.toLowerCase().replace(/[^a-z]+/g, '-')} key={title}>
                    <h2>{title}</h2>
                    <Markup>{guidance}</Markup>
                    <CodeExample code={{ str: html.trim(), language: 'html' }}>
                        <div dangerouslySetInnerHTML={{ __html: html }} data-prose data-typography-example />
                    </CodeExample>
                </section>
            ))}
        </Page>
    );
}
