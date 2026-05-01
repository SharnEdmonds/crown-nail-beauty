/*
 * Shared nail-design config consumed by both HandScene (rendering) and
 * LoadingScreen (preloading). Keep this file free of React/three imports so
 * it's cheap to import from anywhere.
 *
 * To change the default nail design, edit DEFAULT_NAIL_DESIGN. To add per-
 * finger overrides, push them into ALL_NAIL_DESIGNS so they also get preloaded
 * before the loading screen fades.
 */

import type { NailDesignSpec } from './nailDesigns';

// Solid white nails. The clearcoat in makeNailMaterial (0.9) keeps the
// glossy manicured finish so it reads as polished white, not flat.
// Overridable from Sanity via handModel.nailColor.
export const DEFAULT_NAIL_DESIGN: NailDesignSpec = {
    type: 'solid',
    color: '#ffffff',
};

// Every design spec that should be preloaded during the loading screen.
// Add per-finger overrides here if you introduce them in HandScene.
export const ALL_NAIL_DESIGNS: NailDesignSpec[] = [DEFAULT_NAIL_DESIGN];
