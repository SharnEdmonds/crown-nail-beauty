/*
 * Canvas-based nail design renderer.
 *
 * Each preset is a function that draws onto a 2D canvas. The result is wrapped
 * in a CanvasTexture and mapped onto the nail via runtime-generated planar UVs
 * (see nailUVs.ts). Swap the preset/params and the nails update live.
 *
 * Canvas convention:
 *   U (0 → 1) = cuticle → tip  (x axis on canvas)
 *   V (0 → 1) = side → side    (y axis on canvas)
 *
 * Anything you can draw with Canvas 2D API can land on the nail.
 */

import * as THREE from 'three';

export type NailDesignSpec =
    | { type: 'solid'; color: string }
    | {
          type: 'frenchTip';
          baseColor: string;
          tipColor: string;
          accentColor?: string;
          tipStart?: number; // 0–1, default 0.55
          accent?: boolean;  // draw a thin line at the transition
      }
    | {
          type: 'frenchTipSwirl';
          baseColor: string;
          tipColor: string;
          accentColor: string;
          tipStart?: number;
      }
    | { type: 'marble'; baseColor: string; veinColor: string }
    | { type: 'glitter'; baseColor: string; glitterColor: string }
    /**
     * External PBR texture set. Drop PNGs in `public/nail-designs/<name>/`
     * and reference them here. Only `baseColor` is required — every other
     * map is optional and the material will skip slots that aren't provided.
     *
     * Convention: images should be 1024×1024, cuticle on the LEFT, tip on
     * the RIGHT, side-to-side on the Y axis. Normal/roughness/metalness must
     * be in linear color space (the loader handles this for you).
     *
     * Example: {
     *   type: 'textureSet',
     *   baseColor: '/nail-designs/chocolate-swirl/base.png',
     *   normal:    '/nail-designs/chocolate-swirl/normal.png',
     *   roughness: '/nail-designs/chocolate-swirl/roughness.png',
     *   metalness: '/nail-designs/chocolate-swirl/metalness.png',
     * }
     */
    | {
          type: 'textureSet';
          baseColor: string;
          normal?: string;
          roughness?: string;
          metalness?: string;
          ao?: string;
          emissive?: string;
          /** Optional tint multiplied against the base color map. Default white. */
          tint?: string;
          /** Optional flipY override — set true if your PNGs render upside-down. */
          flipY?: boolean;
      };

/**
 * Rich per-nail texture bundle. Every field is optional except `baseColor` so
 * canvas presets (which only produce a diffuse map) coexist with PBR sets.
 * Caller owns the textures and must dispose each one.
 */
export interface NailTextureSet {
    baseColor: THREE.Texture;
    normal?: THREE.Texture;
    roughness?: THREE.Texture;
    metalness?: THREE.Texture;
    ao?: THREE.Texture;
    emissive?: THREE.Texture;
    tint?: THREE.Color;
}

const CANVAS_SIZE = 512;

function drawSolid(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawFrenchTip(
    ctx: CanvasRenderingContext2D,
    baseColor: string,
    tipColor: string,
    tipStart: number,
    accentColor?: string,
) {
    // Base
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Soft french tip — a curved sweep, not a hard edge, to follow the
    // almond-nail silhouette when the planar UVs wrap around the curve.
    const tipX = tipStart * CANVAS_SIZE;
    const grad = ctx.createLinearGradient(tipX - 12, 0, tipX + 12, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, tipColor);
    ctx.fillStyle = grad;
    ctx.fillRect(tipX - 12, 0, CANVAS_SIZE - (tipX - 12), CANVAS_SIZE);

    // Solid fill for the tip past the gradient.
    ctx.fillStyle = tipColor;
    ctx.fillRect(tipX + 12, 0, CANVAS_SIZE - (tipX + 12), CANVAS_SIZE);

    if (accentColor) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tipX, 0);
        ctx.lineTo(tipX, CANVAS_SIZE);
        ctx.stroke();
    }
}

function drawFrenchTipSwirl(
    ctx: CanvasRenderingContext2D,
    baseColor: string,
    tipColor: string,
    accentColor: string,
    tipStart: number,
) {
    // Start from french tip, then overlay hand-drawn swirls in the accent color.
    drawFrenchTip(ctx, baseColor, tipColor, tipStart, accentColor);

    // Gold swirls across the nail — bezier curves that sweep from mid-base into the tip.
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const tipX = tipStart * CANVAS_SIZE;

    ctx.beginPath();
    ctx.moveTo(tipX - 80, CANVAS_SIZE * 0.25);
    ctx.bezierCurveTo(
        tipX - 20, CANVAS_SIZE * 0.15,
        tipX + 40, CANVAS_SIZE * 0.55,
        tipX + 120, CANVAS_SIZE * 0.4,
    );
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tipX - 40, CANVAS_SIZE * 0.7);
    ctx.bezierCurveTo(
        tipX + 20, CANVAS_SIZE * 0.8,
        tipX + 80, CANVAS_SIZE * 0.6,
        tipX + 140, CANVAS_SIZE * 0.75,
    );
    ctx.stroke();

    // A small dot accent near the cuticle for visual balance.
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE * 0.25, CANVAS_SIZE * 0.5, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawMarble(ctx: CanvasRenderingContext2D, baseColor: string, veinColor: string) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = veinColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Seeded pseudo-randomness so each render of the same spec looks the same.
    let seed = 1337;
    const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        let x = rand() * CANVAS_SIZE;
        let y = rand() * CANVAS_SIZE;
        ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) {
            x += (rand() - 0.5) * 120;
            y += (rand() - 0.5) * 120;
            ctx.lineTo(x, y);
        }
        ctx.globalAlpha = 0.3 + rand() * 0.5;
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function drawGlitter(ctx: CanvasRenderingContext2D, baseColor: string, glitterColor: string) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    let seed = 4242;
    const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    ctx.fillStyle = glitterColor;
    for (let i = 0; i < 300; i++) {
        const x = rand() * CANVAS_SIZE;
        const y = rand() * CANVAS_SIZE;
        const r = 1 + rand() * 2.5;
        ctx.globalAlpha = 0.4 + rand() * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

/**
 * Render a canvas-based design spec to a CanvasTexture (sRGB diffuse).
 */
function renderCanvasDesign(spec: Exclude<NailDesignSpec, { type: 'textureSet' }>): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d')!;

    switch (spec.type) {
        case 'solid':
            drawSolid(ctx, spec.color);
            break;
        case 'frenchTip':
            drawFrenchTip(ctx, spec.baseColor, spec.tipColor, spec.tipStart ?? 0.55, spec.accent ? spec.accentColor : undefined);
            break;
        case 'frenchTipSwirl':
            drawFrenchTipSwirl(ctx, spec.baseColor, spec.tipColor, spec.accentColor, spec.tipStart ?? 0.55);
            break;
        case 'marble':
            drawMarble(ctx, spec.baseColor, spec.veinColor);
            break;
        case 'glitter':
            drawGlitter(ctx, spec.baseColor, spec.glitterColor);
            break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
}

// Enable the built-in Three cache so preload + render reuse the same decoded
// image instead of hitting the network twice for the same URL.
THREE.Cache.enabled = true;
const textureLoader = new THREE.TextureLoader();

/**
 * Load a PBR nail texture set from public-served PNG paths.
 *
 * Every slot except `baseColor` is optional; missing maps simply aren't set on
 * the material and its default scalar values are used instead.
 *
 * Color-space handling:
 *   • baseColor / emissive → sRGB (they represent visible color)
 *   • normal / roughness / metalness / ao → Linear (they represent data, not color)
 *
 * Loaded textures start blank and fill in asynchronously; three.js dispatches
 * a re-render when each image decodes, so the material upgrades in place.
 */
function loadTextureSet(spec: Extract<NailDesignSpec, { type: 'textureSet' }>): NailTextureSet {
    const loadColor = (url: string) => {
        const t = textureLoader.load(url);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        if (spec.flipY === false) t.flipY = false;
        return t;
    };
    const loadData = (url: string) => {
        const t = textureLoader.load(url);
        t.colorSpace = THREE.NoColorSpace;
        t.anisotropy = 8;
        if (spec.flipY === false) t.flipY = false;
        return t;
    };

    return {
        baseColor: loadColor(spec.baseColor),
        normal: spec.normal ? loadData(spec.normal) : undefined,
        roughness: spec.roughness ? loadData(spec.roughness) : undefined,
        metalness: spec.metalness ? loadData(spec.metalness) : undefined,
        ao: spec.ao ? loadData(spec.ao) : undefined,
        emissive: spec.emissive ? loadColor(spec.emissive) : undefined,
        tint: spec.tint ? new THREE.Color(spec.tint) : undefined,
    };
}

/**
 * Resolve a nail design spec to a NailTextureSet. Canvas presets produce a
 * single baseColor map; texture-set specs load every provided PNG slot.
 * Caller owns the returned textures and must dispose each one.
 */
export function renderNailDesign(spec: NailDesignSpec): NailTextureSet {
    if (spec.type === 'textureSet') {
        return loadTextureSet(spec);
    }
    return { baseColor: renderCanvasDesign(spec) };
}

/**
 * Preload every image referenced by a nail design spec and resolve when all
 * of them are decoded by the GPU. Canvas presets resolve immediately. For
 * texture-set specs this uses TextureLoader's async callback per URL, so all
 * images are fully decoded before resolving.
 *
 * Thanks to THREE.Cache (enabled above), a later call to renderNailDesign()
 * on the same URL returns the cached image without another network round-trip.
 */
export function preloadNailDesign(spec: NailDesignSpec): Promise<void> {
    if (spec.type !== 'textureSet') return Promise.resolve();

    const urls: string[] = [spec.baseColor];
    if (spec.normal) urls.push(spec.normal);
    if (spec.roughness) urls.push(spec.roughness);
    if (spec.metalness) urls.push(spec.metalness);
    if (spec.ao) urls.push(spec.ao);
    if (spec.emissive) urls.push(spec.emissive);

    return Promise.all(
        urls.map(
            (url) =>
                new Promise<void>((resolve) => {
                    textureLoader.load(
                        url,
                        () => resolve(),
                        undefined,
                        // Don't block loading on a missing asset — warn and carry on.
                        (err) => {
                            console.warn(`[nailDesigns] failed to preload ${url}`, err);
                            resolve();
                        },
                    );
                }),
        ),
    ).then(() => undefined);
}

/**
 * Preload a batch of specs in parallel. Useful when the hand needs multiple
 * designs (per-finger variation) ready before the loading screen fades.
 */
export function preloadNailDesigns(specs: NailDesignSpec[]): Promise<void> {
    return Promise.all(specs.map(preloadNailDesign)).then(() => undefined);
}

/**
 * Dispose every texture in a set. Safe to call with undefined slots.
 */
export function disposeNailTextureSet(set: NailTextureSet): void {
    set.baseColor.dispose();
    set.normal?.dispose();
    set.roughness?.dispose();
    set.metalness?.dispose();
    set.ao?.dispose();
    set.emissive?.dispose();
}
