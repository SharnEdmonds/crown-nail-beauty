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

// Natural manicured look: warm pink-peach base + soft white French tip.
// Keeps the gloss the makeNailMaterial recipe gives (clearcoat 0.9) so the
// nails read as a fresh manicure rather than a flat color block. Both colors
// are overridable from Sanity (handModel.nailColor / handModel.nailTipColor).
export const DEFAULT_NAIL_DESIGN: NailDesignSpec = {
    type: 'naturalManicure',
    baseColor: '#e8c8b8', // warm pink-peach — neutral, complements the marble palette
    tipColor: '#f5ede4',  // soft warm white — tip sits just brighter than the base
    tipStart: 0.62,
};

// Every design spec that should be preloaded during the loading screen.
// Add per-finger overrides here if you introduce them in HandScene.
export const ALL_NAIL_DESIGNS: NailDesignSpec[] = [DEFAULT_NAIL_DESIGN];
