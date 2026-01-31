# Project Status & Handoff Notes: Crown Nail & Beauty

## 1. Project Overview
- **Goal**: Award-winning, high-performance website for Crown Nail & Beauty NZ.
- **Stack**: Next.js 15 (App Router), React 19, Tailwind CSS v3, Framer Motion, Lenis Scroll, React Three Fiber (R3F).
- **Aesthetic**: "Sophisticated Sanctuary" - Monochromatic Charcoal/Black on Marble/Stone Grey.

## 2. Current Implementation State

### File Structure (`/src`)
- **`app/globals.css`**: Configured with CSS variables for the "Champagne & Stone" palette (`--marble-stone`, `--crown-black`, etc.) and Tailwind directives.
- **`app/layout.tsx`**: Wraps app in `SmoothScroll` (Lenis) and applies global font variables.
- **`components/three/HandScene.tsx`**: The R3F component loading `/models/Hand-model.glb`. Includes GSAP ScrollTrigger logic for the 3-section journey.
- **`components/sections/`**: 
  - `Hero.tsx`: Typography entrance animations + Call to Actions.
  - `Services.tsx`: Bento grid layout with hover effects.
  - `PortfolioGallery.tsx`: Horizontal drag-to-scroll gallery.
- **`components/layout/`**:
  - `NavBar.tsx`: Magnetic link effects and scroll-aware styling.
  - `Footer.tsx`: Standard luxury footer structure.

### Assets (`/public`)
- **Models**: `Hand-model.glb` and `Polish-model.glb` are present in `public/models/`.
- **Images**: Portfolio images copied to `public/images/`.

## 3. Critical Action Items & Known Issues

### ⚠️ Dependency Installation (High Priority)
The project faces peer dependency conflicts between **React 19** (Next.js 15 default) and **React Three Fiber / Drei** ecosystem.
- **Current Status**: `npm install --force` was attempted but may have failed or been interrupted.
- **Action**: Run `npm install --force` or `npm install --legacy-peer-deps` manually. Ensure `node_modules` is populated before running dev.

### 🔍 Code Review Areas for Claude Pro
1. **Typescript Errors**:
   - `HandScene.tsx`: Missing type definitions for `jsx-intrinsic-elements` (Three.js types) due to incomplete install.
   - `globals.css`: Verify Tailwind v3 `@tailwind` directives match the installed version (package.json specifies v3 compatibility).

2. **3D Animation Logic**:
   - Review `HandScene.tsx` GSAP ScrollTrigger integration. Ensure the timeline syncs correctly with the HTML sections (`Hero` -> `Services` -> `Gallery`).
   - default camera position in `ThreeBackground.tsx` vs `HandScene` logic.

3. **Booking & About Sections**:
   - `Services` and `Gallery` are implemented, but `About` and `Booking` are currently placeholders or integrated into `Services`. Confirm if dedicated sections are needed now.

## 4. How to Run
1. **Install**: `npm install --force`
2. **Dev**: `npm run dev`
3. **Build**: `npm run build`

## 5. Next Steps for Development
1. Verify 3D model loads correctly without texture/lighting issues.
2. Fine-tune ScrollTrigger scrub values for the hand rotation.
3. Implement the visual "Booking Calendar" mockup if not fully covered in Services.
