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

// The design applied to every nail unless a per-finger override is set.
// Currently parked on a clean glossy red — the textureSet pipeline is still
// wired up, just not used. To revive it, swap this back to a textureSet spec
// and drop the PNGs in public/nail-designs/.
export const DEFAULT_NAIL_DESIGN: NailDesignSpec = {
    type: 'solid',
    color: '#9a2430', // muted rose-red, reads as glossy polish without feeling loud
};

// Every design spec that should be preloaded during the loading screen.
// Add per-finger overrides here if you introduce them in HandScene.
export const ALL_NAIL_DESIGNS: NailDesignSpec[] = [DEFAULT_NAIL_DESIGN];
