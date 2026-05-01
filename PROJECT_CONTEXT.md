# Crown Nail & Beauty — Full Project Context

> Working reference for the codebase. Covers stack, page architecture, Sanity CMS, every section component, the 3D hand pipeline, animations, global state, and known caveats. Last synced from the working tree on `main`.

---

## 1. Stack & Tooling

- **Framework**: Next.js 16 canary (App Router) + React 19 + TypeScript (strict).
- **Styling**: Tailwind v3 with a custom palette mapped to CSS variables in `globals.css`. Serif (Cormorant Garamond, Google Fonts) + sans (Satoshi local woff2) font system.
- **Animation**: Framer Motion (component-level) + GSAP/ScrollTrigger (3D timeline) + Lenis (smooth scroll).
- **3D**: `@react-three/fiber` + `@react-three/drei` + `three.js` (`MeshPhysicalMaterial`, Draco-compressed GLB).
- **CMS**: Sanity v4 with embedded Studio mounted at `/studio` (`src/app/studio/[[...tool]]/page.tsx`, `sanity.config.ts`). Project `yo6o30pq`, dataset `production`, default API version `2026-01-31`.
- **State**: zustand (`useUIStore`) for global UI flags (note: present in lockfile but not declared in `package.json`).
- **Misc**: `tailwind-merge` + `clsx` (`cn` helper), `lucide-react` icons, `@sanity/image-url` (image CDN URLs), `gltf-pipeline` (Draco compression npm scripts).
- **Perf**: `next.config.ts` enables AVIF/WebP, custom device sizes, `optimizePackageImports` for `lucide-react`/`framer-motion`/`gsap`/`three`/`@react-three/*`, and `Cache-Control: public, max-age=31536000, immutable` on glb/gltf/woff2/images/svg.
- **SEO**: `app/robots.ts`, `app/sitemap.ts`, structured-data injection via `JsonLd.tsx` (BeautySalon schema with hours, address, services), strong OG/Twitter metadata in `layout.tsx`.

---

## 2. Project Structure

```
crown-nail-beauty/
├── public/
│   ├── models/Hand-model-draco.glb       # Draco-compressed hand GLB
│   ├── draco/                             # Draco decoder (js + wasm) + nested gltf/ copy
│   ├── hdri/studio_small_03_1k.hdr        # Environment map
│   ├── nail-designs/                      # Optional PBR PNG sets (Base/Metalness/Normal/Roughness)
│   ├── fonts/Satoshi-{Regular,Medium}.woff2
│   └── images/                            # Gallery_img1-5.webp, Logo.webp, Logo-long.webp
├── scripts/
│   ├── seed-sanity.ts                     # One-shot CMS seeder (singletons + collections)
│   ├── seed-hand-model.ts                 # Seeds the handModel doc with default vectors
│   └── cleanup-and-patch.ts               # Deletes legacy seed IDs
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Fonts, metadata, SmoothScroll, LoadingScreen
│   │   ├── page.tsx                       # Async server component, parallel CMS fetch, section composition
│   │   ├── globals.css                    # CSS vars, grain overlay, fluid h1/h2/h3, .glass utility
│   │   ├── robots.ts, sitemap.ts          # Static SEO routes
│   │   └── studio/[[...tool]]/page.tsx    # Embedded Sanity Studio
│   ├── BOOKING/Booking.tsx                # ⚠️ UNUSED 4-step booking wizard
│   ├── components/
│   │   ├── layout/                        # NavBar, Footer, SmoothScroll
│   │   ├── sections/                      # Hero, Services, ServiceMenu, PortfolioGallery, About, Testimonials, BookingCTA
│   │   ├── three/                         # HandScene, HandModel, ThreeBackground(+Wrapper), ErrorBoundary, nailDesigns/UVs/handNailConfig
│   │   └── ui/                            # Button, GlassCard, MotionLink, ImageLightbox, JsonLd, LoadingScreen, HeroBackdrop(stub)
│   ├── hooks/useScrollProgress.ts
│   ├── lib/                               # animations, queries, sanity-image, store, types, utils
│   └── sanity/
│       ├── env.ts, structure.ts
│       ├── lib/{client,image,live}.ts
│       └── schemaTypes/                   # 11 schemas (see §3)
├── sanity.config.ts, sanity.cli.ts
├── next.config.ts, tailwind.config.ts, tsconfig.json
├── Crown_Nail_Beauty_Implementation_Plan.md
├── PROJECT_STATUS.md
└── PROJECT_CONTEXT.md                     # ← this file
```

---

## 3. Page Composition (`src/app/page.tsx`)

`Home` is an async server component that runs **eleven parallel `client.fetch` calls** and composes:

```
NavBar
ThreeBackgroundWrapper          (fixed, z-0, runs the hand)
main #main-content
   #hand-journey                (the GSAP scroll-trigger range)
       Hero  →  Services  →  PortfolioGallery
   ServiceMenu  →  About  →  Testimonials  →  BookingCTA
Footer
```

`revalidate = 0` — always fresh; no static caching of Sanity data.

The `#hand-journey` wrapper is critical: it's the trigger element for the GSAP ScrollTrigger that animates the 3D hand from the top of Hero through to the start of `#gallery`.

---

## 4. Sanity CMS

### 4.1 Schemas (`src/sanity/schemaTypes/`)

11 document types — mostly singletons that drive each section, plus two collections.

| Schema | Type | Purpose |
|---|---|---|
| `siteSettings` | singleton | Brand (wordmark/submark/logo), hero headline + 2 CTAs + scroll label, contact (phone/email/address), opening hours, social links, **About** section (eyebrow, heading, paragraphs, image, CTA) |
| `navigation` | singleton | Nav links list, Reserve label/href, mobile-only Home link |
| `serviceCategory` | collection | Title, slug, description, `priceFrom`, `order`, array of `services` (`name`, `price`, `note`) |
| `testimonial` | collection | Quote, author, service, order |
| `servicesSection` | singleton | Bento heading, intro, "starting from" label, `cards[]` (title, description, href, `categorySlugs[]` for derived pricing) |
| `serviceMenuSection` | singleton | Eyebrow + split heading (`headingStart`/`headingItalic`), intro, separate "nails" subsection heading, `nailCategorySlugs[]` to split nail vs. other services |
| `portfolioSection` | singleton | Heading, description, "view details" label, `images[]` (image + alt) |
| `testimonialsSection` | singleton | Just the eyebrow (rotation + dots come from the `testimonial` collection) |
| `bookingCtaSection` | singleton | Eyebrow, split heading, description, CTA label/href |
| `footerSection` | singleton | Brand description, three column headings (`hoursHeading`, `exploreHeading`, `visitHeading`), explore links list, copyright suffix |
| `handModel` | singleton | The 3D hand's runtime config — idle motion, scale, hex colors, per-finger nail color overrides, **per-breakpoint** start/end position+rotation vectors (see §6) |

### 4.2 Queries (`src/lib/queries.ts`) + Types (`src/lib/types.ts`)

GROQ queries are plain string constants matching each schema; TypeScript interfaces mirror each schema. The page does:

```ts
Promise.all([
  SITE_SETTINGS_QUERY, NAVIGATION_QUERY, SERVICE_CATEGORIES_QUERY,
  TESTIMONIALS_QUERY, SERVICES_SECTION_QUERY, SERVICE_MENU_SECTION_QUERY,
  PORTFOLIO_SECTION_QUERY, TESTIMONIALS_SECTION_QUERY,
  BOOKING_CTA_SECTION_QUERY, FOOTER_SECTION_QUERY, HAND_MODEL_QUERY,
])
```

### 4.3 Sanity Client

- `src/sanity/lib/client.ts` — `useCdn: false`, perspective `published`. Live Content API helper exists in `live.ts` but isn't wired up.
- `src/sanity/lib/image.ts` and `src/lib/sanity-image.ts` — both produce `urlFor()` builders. Section components import from `@/lib/sanity-image`.
- `src/sanity/env.ts` reads `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` / `NEXT_PUBLIC_SANITY_API_VERSION` with sane defaults.

### 4.4 Seeding

- `scripts/seed-sanity.ts` uploads gallery images + logo, then `createIfNotExists` for every singleton with the original hardcoded copy.
- `scripts/seed-hand-model.ts` writes the default `handModel` doc with start/end vectors.
- `scripts/cleanup-and-patch.ts` deletes legacy seed IDs.
- Run via `npx tsx scripts/<name>.ts`. Requires `.env.local` with `SANITY_API_WRITE_TOKEN`.

---

## 5. Layout, Sections & UI Components

### 5.1 Layout & Globals

- **`app/layout.tsx`**: Sets `<html>` font variables (`--font-sans` = Satoshi, `--font-serif` = Cormorant). Wraps children in `<SmoothScroll>` (Lenis), mounts `<LoadingScreen>`, includes a "Skip to main content" anchor for accessibility.
- **`globals.css`**: Defines color CSS vars, applies a fixed grain/noise SVG overlay (`body::after`, opacity 0.03, z-9999, pointer-events:none), `.glass`, `.marble-texture` utility classes, clamp-based fluid h1/h2/h3 sizes.
- **`tailwind.config.ts`**: Extends colors (`marble-stone` `#E8E4E0`, `clean-white` `#FAFAFA`, `crown-black` `#1A1A1A`, `charcoal-grey` `#4A4A4A`, `stone-grey` `#8A8A8A`, `warm-black` `#2C2C2C`, `soft-rose` `#D4B5B0`, `brushed-gold` `#C9A962`) and `safe` padding for iOS notch.

### 5.2 NavBar (`components/layout/NavBar.tsx`)

- Fixed top, transparent → glass on scroll (50px threshold), Framer initial drop-in.
- Wordmark/submark from `siteSettings`, links from `navigation`.
- `MotionLink` underline-slide hover (handles anchor `#` vs. internal Next `Link`).
- Mobile: hamburger ↔ X morph (3 motion.divs rotating), full-screen `marble-stone` overlay menu.
- Reserve CTA renders as a black pill button.

### 5.3 Footer (`components/layout/Footer.tsx`)

- Crown-black background, three-column grid (brand+hours, explore links, contact).
- Hours from `siteSettings.openingHours`, Instagram/Facebook icons from `socialLinks`.
- Copyright = `© {currentYear} {businessName} {copyrightSuffix}`.

### 5.4 SmoothScroll (`components/layout/SmoothScroll.tsx`)

- Lenis instance with `duration: 1.2`, custom easing `t => Math.min(1, 1.001 - 2^(-10t))`, `smoothWheel: true`, `touchMultiplier: 2`.
- Subscribes to `useUIStore.isScrollLocked` and calls `lenis.stop() / start()` (used by lightbox).

### 5.5 Hero (`components/sections/Hero.tsx`)

- Full-viewport, transparent (the 3D hand sits behind in the fixed canvas).
- `parseHeadline` splits `siteSettings.heroHeadline` by spaces, makes the **3rd word italic and indented**, inserts line breaks after words 2 and 4. So "Where Meticulous Craftsmanship Meets Serene Luxury" becomes:
  ```
  Where Meticulous
      Craftsmanship    (italic, indented)
  Meets Serene
  Luxury
  ```
- Per-word stagger reveal (Framer variants, 50ms stagger, custom ease `[0.16, 1, 0.3, 1]`).
- Two motion CTAs with golden hover sweep + arrow slide-in.
- Bottom scroll indicator: 1px line that scaleY pulses 0→1→0 on a 2.5s loop.
- Mobile-only soft radial scrim behind text so the hand stays readable.
- `onViewportEnter` on the section forces `setHandVisible(true)`.

### 5.6 Services / "Bento" (`components/sections/Services.tsx`)

- Pulls `servicesSection.cards` and computes a derived "starting from" by scanning `categorySlugs` → matching `serviceCategory.services[].price` → extracting `\d+` → taking the min.
- 4-column grid; first card spans `md:col-span-2 md:row-span-2` (the bento large card).
- Hover effects: `-translate-y-1`, soft-rose border, gold underline scaleX, gold price color, marble overlay.

### 5.7 ServiceMenu (`components/sections/ServiceMenu.tsx`)

- Below the hand-journey, light section. Splits categories into "nail" (matching `nailCategorySlugs`) vs. "other".
- Each category card lists its `services[]` as a "name … price" dotted-leader line (classic restaurant menu look).
- Receives `openingHours` and `phone` props but the rendered Opening Hours banner block is currently empty (just a comment).

### 5.8 PortfolioGallery (`components/sections/PortfolioGallery.tsx`)

- Dark section (`bg-crown-black`), `id="gallery"` — also the **end-trigger for the hand journey**.
- **Infinite horizontal scroll**: triplicates the images array; on mount jumps `scrollLeft` to the middle set; on scroll past 2× wraps back, before 1× wraps forward.
- Per-card 300×400 (mobile) / 400×550 (desktop), Sanity image via `urlFor(item.image).width(1200).quality(85).url()`.
- Prev/next buttons (desktop) move by `STEP = CARD_WIDTH(400) + GAP(32) = 432px`.
- Click → `ImageLightbox` with `lightboxIndex % originalLength`.
- `onViewportEnter` sets `handVisible=false` (a redundant safety in addition to the GSAP `onLeave`).

### 5.9 About (`components/sections/About.tsx`)

- 2-col grid, parallax-translated image (`useScroll` + `useTransform([0,1],[80,-80])`) on the left.
- Heading splits last word into italic line break; paragraphs from `siteSettings.aboutParagraphs`.
- CTA pulls `aboutCtaLabel` / `aboutCtaHref`.
- Image hidden on mobile (`hidden md:block`).

### 5.10 Testimonials (`components/sections/Testimonials.tsx`)

- 5-second auto-rotating carousel with `AnimatePresence mode="wait"`, fades+slides each quote.
- Pause on hover (`onMouseEnter/Leave`).
- Dot navigation; active dot stretches to `w-8` and turns gold.
- ⚠️ Has a React rules-of-hooks bug: `if (!testimonials?.length) return null;` is **before** the `useState`/`useEffect` hooks. Works in practice because `testimonials` length is consistent per render, but technically risky.

### 5.11 BookingCTA (`components/sections/BookingCTA.tsx`)

- Final dark band, single hero CTA. Headline split into `headingStart` + italic gold `headingItalic`.
- Two giant blurred radial spotlights for atmosphere.

### 5.12 BOOKING/Booking.tsx (NOT mounted)

- A **complete 4-step booking wizard** (Service → Date & Time → Technician → Details) with confirmation screen, animated step transitions, hardcoded Feb 2026 calendar grid, hardcoded time slots, hardcoded technicians (Sarah/Amy/Jade/No Preference), and 7 premium add-ons with running total.
- Receives `categories` + `phone` and computes a price total from selected service + add-ons.
- Lives at `src/BOOKING/Booking.tsx` and **is not imported anywhere** — it's the spec'd "Booking section" from the plan, currently shelved in favor of the simpler `BookingCTA` band.

### 5.13 UI primitives

- `Button.tsx`: variants `primary`/`outline`, `cn`-merged classes, optional href.
- `GlassCard.tsx`: `bg-clean-white/60 backdrop-blur-xl` shell.
- `MotionLink.tsx`: handles `#` vs. internal links, animated underline on hover.
- `ImageLightbox.tsx`: full-screen modal on Escape/click, **calls `setScrollLocked(true)` to pause Lenis**, freezes body overflow.
- `JsonLd.tsx`: emits BeautySalon JSON-LD into `<script>`.
- `LoadingScreen.tsx`: see §7.
- `HeroBackdrop.tsx`: returns `null` (placeholder, formerly held the hero floating polish bottles per the plan).

---

## 6. The 3D Hand (the centerpiece)

### 6.1 Wrapper Chain

```
page.tsx
  → <ThreeBackgroundWrapper handModel={...}>
      → dynamic-imports <ThreeBackground> (ssr:false)
        → <ThreeErrorBoundary>
            → <Canvas>
                → <Suspense>
                    → <HandScene>
                        → <HandModel>
```

The wrapper has a 1.5s CSS keyframe fade-in on mount.

### 6.2 ThreeBackground (`components/three/ThreeBackground.tsx`)

- **Fixed full-screen Canvas**, `z-0`, `pointer-events-none`, opacity toggled by `isHandVisible` (700ms duration; also `display:hidden` when off).
- Canvas: `dpr=[1, 1.8]`, camera at `(0,0,5)` `fov=45`, **ACES Filmic tone mapping** (`exposure 1.1`) so clearcoat highlights don't clip.
- Drei `<Loader/>` overlay styled in brushed gold while the GLB streams.

### 6.3 HandScene (`components/three/HandScene.tsx`) — the brain

**Config merging**: Takes `HandModelConfig | null` from Sanity and merges over a `DEFAULTS` block (warm skin `#e8b89e`, roughness 0.85, scale 2.5, idle speed 0.15, etc. — note: code defaults differ slightly from `seed-hand-model.ts` defaults). Per-breakpoint start/end position+rotation vectors flow in from CMS.

**Lighting**:
- HDR environment from `/hdri/studio_small_03_1k.hdr`
- Ambient 0.35
- Main spot at `(10,10,10)` intensity 1.8
- Warm fill spot at `(-5,5,-5)` `#ffcdb2` intensity 0.6
- Back-rim directional `#ffe4d1`

Tuned to read normal-mapped nail volume without going clinical.

**Pointer parallax**: `pointermove` listener writes a normalized `[-1,1]` target; each frame interpolates `pointerCurrent` toward target (`ease = min(1, delta*6)` — frame-rate-independent damping). Strength scales with `idleRotationSpeed/0.15`. Mouse X rotates the hand around Y (~0.5 rad full swing).

**GSAP scroll timeline**: `gsap.matchMedia` branches on `(min-width:1024px)` desktop vs. mobile, picks the appropriate Sanity vector pair. ScrollTrigger:
- trigger: `#hand-journey` (Hero+Services+Gallery wrapper)
- start: `top top`, endTrigger: `#gallery`, end: `top center`
- `scrub: 1.5`, `invalidateOnRefresh: true`
- `onLeave` hides hand + `setHandVisible(false)`; `onEnterBack` reverses

The timeline animates **two things from Sanity start→end** at the same offset (0):
1. `baseRotation.current` (a plain ref object) with `sine.inOut`
2. `handRef.current.position` directly

**Frame composition** (`useFrame`): every frame applies
```ts
rotation.x = baseRotation.x;
rotation.y = baseRotation.y + parallaxY;
rotation.z = baseRotation.z;
```
so scroll and parallax compose without fighting. Then a viewport-half-width clamp keeps the hand on-screen at its current Z.

### 6.4 HandModel (`components/three/HandModel.tsx`)

GLB shape: `Mesh_0_1` = skin, `Mesh_0_2..6` = thumb/index/middle/ring/pinky nails.

Two one-time geometry passes (memoized on geometry refs):
1. `offsetNailGeometry(nail)` — pushes every nail vertex 0.003 along its normal to prevent z-fighting at the nail base. Idempotent via `userData.__nailOffsetApplied` flag.
2. `generateNailUVs(nail)` — see §6.5.

**Skin material**: `MeshPhysicalMaterial` with sheen 0.35 / sheenColor `#ffcbb0` (warm subsurface stand-in), faint clearcoat 0.15 / roughness 0.55 (skin oil), envMapIntensity 0.9.

**Per-nail materials**: each finger has its own `NailDesignSpec` (with optional per-finger overrides falling back to a shared `nailDesign` prop). `renderNailDesign` returns a `NailTextureSet`; `makeNailMaterial` builds:
- `MeshPhysicalMaterial` with the canvas/PBR base color map.
- Clearcoat 0.9, clearcoatRoughness 0.08 (gel-polish shine), reflectivity 0.55, IOR 1.5.
- Sheen 0.15 / `#fff1e6`, iridescence 0 (dialed back from earlier iterations).
- envMapIntensity 1.1.
- If a normal map exists: normalScale `(0.85, 0.85)`, AND it's reused as `clearcoatNormalMap` at `(0.35, 0.35)` — **that re-mapping is what sells the "glass over paint" volume**.
- All textures get `anisotropy=16`, mipmaps, trilinear filtering.

Cleanup: `useEffect` returns dispose for every material + texture set on unmount.

`useGLTF.preload('/models/Hand-model-draco.glb', '/draco/')` is called at module bottom.

### 6.5 nailUVs.ts (the clever bit)

GLB nails ship with no useful UVs **and** their vertex coordinates are in hand-space, so a naive AABB picks the wrong axes. So:

1. Compute centroid → center vertices.
2. Build the 3×3 covariance matrix.
3. **Jacobi eigen-decomposition** (32 sweeps max) → 3 orthogonal principal axes sorted by eigenvalue descending.
4. The largest eigenvector becomes U (cuticle→tip).
5. V = `N × U` where N = average vertex normal (more stable than the 2nd eigenvector for thin shells); fallback to 2nd eigenvector if degenerate.
6. Project each vertex onto (U,V), normalize to [0,1], optionally flip, write to `geometry.uv`.

Result: a single texture with "cuticle on the left, tip on the right" maps correctly across all five fingers regardless of how each is oriented in hand-space.

Debug hook: `window.__NAIL_UV_DEBUG = true` logs eigenvalues and aspect ratio per nail.

### 6.6 nailDesigns.ts

A canvas-based design system. `NailDesignSpec` discriminated union: `solid | frenchTip | frenchTipSwirl | marble | glitter | textureSet`.

- Canvas presets render to a 512×512 `CanvasTexture` (sRGB) and supply only `baseColor`.
- `textureSet` loads PNGs from `/nail-designs/<name>/` with proper colorspace handling (sRGB for color/emissive, NoColorSpace for normal/roughness/metalness/ao).
- `THREE.Cache.enabled = true` so preload + render share decoded images.
- `preloadNailDesign` / `preloadNailDesigns` resolve once every PNG is decoded so the loading screen knows when the hand is *visually* ready, not just when bytes are in.

`handNailConfig.ts`: currently `DEFAULT_NAIL_DESIGN = { type: 'solid', color: '#9a2430' }` (muted glossy red). `ALL_NAIL_DESIGNS` is the preload list. `public/nail-designs/` has Base/Metalness/Normal/Roughness PNGs ready but the `solid` design is what's wired up.

---

## 7. LoadingScreen (`components/ui/LoadingScreen.tsx`)

A bespoke, branded preloader (not the drei `<Loader/>` — that's only for the canvas itself).

- Streams the GLB via `fetch().body.getReader()` with byte-level progress, capped at 82%.
- Runs `preloadNailDesigns(ALL_NAIL_DESIGNS)` in parallel.
- Combines GLB ready + `setModelReady` (called from `HandScene` once the GLTF scene is in) before the bar can climb past 92% to 100%.
- Smooth tick interval (40ms) does easing toward the current ceiling so the bar never jerks.
- 12s failsafe timeout — never traps the user.
- On 100%, waits 450ms then `setLoading(false)`; the `<AnimatePresence>` exit fades the screen in 0.9s.
- Sets `body.style.overflow = 'hidden'` while loading.
- Visual: marble-stone bg, "Crown Nail & Beauty" eyebrow + gold divider, 3-line stagger headline "Crafted in *Quiet* / *Luxury.*", gold thin progress bar with monospace "000…100" counter.

---

## 8. Global State (`src/lib/store.ts`)

```ts
useUIStore = {
  isHandVisible, setHandVisible    // toggled by Hero onViewportEnter, Gallery onViewportEnter,
                                   // GSAP onLeave/onEnterBack, ThreeBackground opacity
  isScrollLocked, setScrollLocked  // toggled by ImageLightbox; consumed by SmoothScroll
  isLoading, setLoading            // controlled by LoadingScreen
  isModelReady, setModelReady      // set true by HandScene once useGLTF resolves
}
```

Single source of truth for inter-component coordination — no prop-drilling for these flags.

---

## 9. Animation Catalog

| Effect | Where | Tech |
|---|---|---|
| Smooth wheel/touch scroll | global | Lenis |
| Hand scroll-driven position+rotation | HandScene | GSAP ScrollTrigger + `useFrame` composition |
| Hand mouse parallax (Y-axis) | HandScene | pointermove + frame-rate-independent damping |
| Hand idle (defined but not in useFrame) | — | `idleWobbleAmount`/`idleWobbleSpeed` config exists but is currently inert |
| Hero word-by-word reveal | Hero | Framer stagger variants |
| Hero CTA hover (gold sweep + arrow) | Hero | Tailwind transition classes |
| Bento card hover (lift, gold underline, marble wash) | Services | Framer + Tailwind |
| Gallery infinite horizontal scroll | PortfolioGallery | scroll-position wrap on `onScroll` |
| Gallery card hover (scale, overlay) | PortfolioGallery | Framer + CSS |
| Lightbox open/close | ImageLightbox | Framer AnimatePresence + scroll lock |
| About image parallax | About | `useScroll` + `useTransform` |
| Testimonial crossfade | Testimonials | AnimatePresence `mode="wait"` |
| Testimonial dot stretch | Testimonials | Tailwind transition |
| Loading screen exit | LoadingScreen | AnimatePresence exit `duration:0.9` |
| Mobile menu open | NavBar | AnimatePresence + hamburger morph |
| Underline link hover | MotionLink | Framer scaleX |
| Page-load fade for Three canvas | ThreeBackgroundWrapper | CSS keyframe `fadeIn 1.5s` |

Animation-tuning constants live in `src/lib/animations.ts` (`easings.smooth/reveal/bounce`, `durations`, `stagger`).

---

## 10. Functional Behavior Summary

1. **Site loads** → custom `LoadingScreen` covers everything; in parallel, fetches the Draco GLB byte-streamed and preloads any PNG nail-design textures.
2. Once `isModelReady` and bytes are 100%, loader fades out (0.9s).
3. Lenis takes over scrolling; NavBar's transparent → glass on threshold.
4. Hero shows headline word-by-word; the 3D hand is already rendered (always behind, fixed) and idles with mouse parallax.
5. Scrolling within `#hand-journey` (Hero → Services → Gallery start) scrubs the GSAP timeline, moving and rotating the hand from start vector to end vector while the user reads cards. The lighting shows off the gel-polish nails (clearcoat + clearcoat-normal trick).
6. At Gallery, the GSAP `onLeave` and Gallery's `onViewportEnter` both hide the hand (canvas opacity → 0). The dark gallery now takes focus; user drags or clicks arrows for infinite horizontal scroll; clicking opens lightbox (locks Lenis).
7. Below: ServiceMenu (the full price list, derived from `serviceCategory` docs), About (parallax image + bio), Testimonials (auto-rotating quotes), BookingCTA (final pull to action), Footer.
8. Scrolling back up, `onEnterBack` reveals the hand again.
9. All copy, prices, images, links, **and the hand's exact start/end pose+color per breakpoint** are CMS-editable via `/studio`.

---

## 11. Color Palette

| Role | Color | Hex | Tailwind |
|---|---|---|---|
| Primary background | Marble Stone | `#E8E4E0` | `bg-marble-stone` |
| Secondary background | Clean White | `#FAFAFA` | `bg-clean-white` |
| Primary text | Crown Black | `#1A1A1A` | `text-crown-black` |
| Secondary text | Charcoal Grey | `#4A4A4A` | `text-charcoal-grey` |
| Subtle text | Stone Grey | `#8A8A8A` | `text-stone-grey` |
| CTA / accent | Warm Black | `#2C2C2C` | `bg-warm-black` |
| Soft accent | Soft Rose | `#D4B5B0` | `text-soft-rose` |
| Luxury hint | Brushed Gold | `#C9A962` | `text-brushed-gold` |

---

## 12. Scripts (package.json)

```bash
npm run dev                # next dev
npm run build              # next build
npm run start              # next start
npm run lint               # eslint
npm run optimize:hand      # gltf-pipeline -i Hand-model.glb -o Hand-model-draco.glb -d
npm run optimize:polish    # gltf-pipeline -i Polish-model.glb -o Polish-model-draco.glb -d (no source file currently)
```

Sanity seeding (manual):
```bash
npx tsx scripts/seed-sanity.ts
npx tsx scripts/seed-hand-model.ts
npx tsx scripts/cleanup-and-patch.ts
```

---

## 13. Notable Caveats & Known Issues

- `BOOKING/Booking.tsx` exists but is unused; `BookingCTA` is the actual section on the page.
- `ServiceMenu` accepts `openingHours` / `phone` but the bottom banner that would consume them is currently a placeholder comment.
- `HeroBackdrop` returns null (the planned floating polish bottles aren't implemented).
- `Polish-model.glb` is mentioned in the implementation plan and `package.json` has an `optimize:polish` script, but no polish model is in `public/models/` and no polish R3F component exists.
- `idleRotationSpeed` / `idleWobbleAmount` / `idleWobbleSpeed` are still in the schema and types, but the simplified `useFrame` only uses `idleRotationSpeed` to scale parallax magnitude — the wobble values are inert.
- `Testimonials.tsx` has the early-return-before-hooks pattern (works but flags React rules-of-hooks).
- `SanityLive` defined in `lib/live.ts` but not mounted in layout — Live Content API is dormant; current data is fetched once per request (`revalidate = 0`).
- `zustand` is imported but not declared in `package.json` (it is in `package-lock.json`, presumably pulled in transitively or installed without `--save`).
- `next.config.ts` targets Next 16 canary; React 19 + R3F caused install conflicts noted in `PROJECT_STATUS.md` (use `--force` or `--legacy-peer-deps`).
- Two `urlFor` builders exist (`src/sanity/lib/image.ts` and `src/lib/sanity-image.ts`) — sections use the second one.

---

## 14. Quick Reference: Where to Edit

| To change... | Edit |
|---|---|
| Hero headline / CTAs | `siteSettings` in Sanity Studio |
| Service prices | `serviceCategory` docs |
| Testimonial quotes | `testimonial` docs |
| Gallery images | `portfolioSection.images[]` |
| Hand pose / colors / nails | `handModel` doc |
| Default nail design (code) | `src/components/three/handNailConfig.ts` |
| Hand lighting / camera | `src/components/three/HandScene.tsx`, `ThreeBackground.tsx` |
| Material recipes (skin, nail clearcoat) | `src/components/three/HandModel.tsx` |
| Color palette | `tailwind.config.ts` + `globals.css` CSS vars |
| Scroll-trigger range | `#hand-journey` wrapper in `page.tsx` + `endTrigger: '#gallery'` in `HandScene.tsx` |
| Loading screen copy | `LoadingScreen.tsx` (hardcoded) |
