/**
 * This script checks for missing CSS variables in the pttrn UI library.
 *
 * $ npx tsx .scripts/check-css-vars.ts
 */

import { getCssVariables, reportMissingVariables } from './utils';

reportMissingVariables(getCssVariables());
