# Attribution

pttrn (Pattern Design System) is built from the **Bespoke Design System** (BSPK), created by [Brian S. Reed](https://github.com/iambriansreed) while at Anywhere Real Estate and released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This file is the attribution.

Copyright 2025–2026 Anywhere Real Estate. Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the full text is in [LICENSE](LICENSE). This notice appeared at the end of each original README and is kept here once.

The original repositories were hosted at [github.com/Anywhererealestate](https://github.com/Anywhererealestate).

## Contributors

Other contributors at Anywhere Real Estate:

- [jessica-mcintosh](https://github.com/Jessica-McIntosh)
- [emilefleming](https://github.com/emilefleming)

## Why it is here

BSPK is **deprecated**. Following the merger of Anywhere Real Estate and Compass, it is no longer maintained, and its repositories and `@bspk/*` npm packages are not being updated.

This project keeps the work usable on its own terms. It is not affiliated with, endorsed by, or supported by Anywhere Real Estate or Compass.

## What changed

- **Consolidated.** The separate repositories are now one npm workspace.
- **Renamed.** BSPK is now pttrn, and the packages are published as `@ptrn/*`.
- **One theme.** The nine real estate brand themes are removed. The remaining theme, formerly `anywhere`, became `nowhere`, along with its icon set.
- **USWDS tokens.** The `nowhere` theme and its design tokens were then removed too. The styles now use the USWDS design tokens, exported from the USWDS Design Kit in Figma.
- **Country icons removed.** The `country` icon set (flags and currency symbols) was dropped. `InputPhone` shows no flags unless the consumer passes `renderFlag`.
- **Third-party logos removed.** The `brand` icon set (payment networks, social platforms, app stores) was dropped.
- **De-branded.** Organization URLs, internal domains, issue trackers and contact addresses are removed.

## Provenance of the assets

- The `material` icon set is derived from [Material Symbols](https://fonts.google.com/icons), published by Google under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
- The `nowhere` icon set and the component library originate from BSPK. The original design tokens did too; they have been replaced by USWDS tokens.
- The `Flag` component embeds the flag sprite from [world-flags-sprite](https://github.com/lafeber/world-flags-sprite), Copyright (c) 2012 Martijn Lafeber, 2018 Francescu Garoby, released under the MIT License. The MIT License notice is included here as the license requires: permission is granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense, and/or sell the Software, provided this copyright notice and permission notice are included in all copies or substantial portions of it. The Software is provided "as is", without warranty of any kind.
