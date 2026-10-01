import { DESIGNS, type Design } from '@digitaplatform/theme';

/**
 * MINIMAL — Geist / shadcn (Vercel) neutral system: pure white and near-black
 * zinc surfaces, hairline borders, tight radii, flat shadows and fast, sober
 * motion. No decorative color anywhere — the tint layer supplies the ONLY
 * chromatic moment. For dense admin/dev tools where the content is the UI.
 *
 * The token values live in @digitaplatform/theme only. minimal is the default
 * design, so theme.css paints its tokens at :root from the theme's copy and
 * drops the token blocks of this package's CSS; a copy here would never reach
 * a page and could only drift. This package owns the variant layer
 * (src/variant.css).
 */
const minimal: Design | undefined = DESIGNS['minimal'];
if (!minimal) throw new Error('@digitaplatform/theme has no "minimal" design to build this package from.');

export default minimal;
