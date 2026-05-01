'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { urlFor } from '@/lib/sanity-image';
import { useUIStore } from '@/lib/store';
import type { PortfolioSection } from '@/lib/types';

interface PortfolioGalleryProps {
    section: PortfolioSection | null;
}

const CARD_W_DESKTOP = 320; // matches w-80
const GAP_PX = 16;          // matches gap-4
const SCROLL_STEP = CARD_W_DESKTOP + GAP_PX;

// Treat any pointer movement of >= this many pixels as a drag, not a click.
// The card's onClick handler bails out if the pointer was dragged past this.
const DRAG_THRESHOLD_PX = 6;

/**
 * Simple horizontal-scroll gallery. Each image is a uniform 3:4 portrait card
 * sized for thumb-friendly tap targets on mobile and a clean rail on desktop.
 *
 * Motion design:
 *   • Free scroll — no snap. Snap-mandatory makes every drag-release lurch to
 *     the nearest card, which felt jerky. Free-scroll lets the rail glide to
 *     wherever the user lets go.
 *   • Drag-to-scroll on mouse (touch is left to native momentum). Releases
 *     hand off to a velocity-decayed glide so the rail keeps moving briefly
 *     after pointer-up — the difference between "draggable list" and
 *     "professional carousel."
 *   • Chevron clicks tween the rail with a custom RAF loop using ease-out
 *     cubic (≈ the site's standard cubic-bezier(0.16,1,0.3,1)) instead of
 *     the browser's default 'smooth' which varies by engine.
 *   • Cards fade-up as they enter the rail's viewport (Framer's whileInView
 *     scoped to the rail itself, so the reveal happens as you scroll the
 *     rail horizontally — not just on initial section enter).
 *
 * Performance:
 *   • Native overflow-x scroll, no JS scroll loop except during drag/momentum.
 *   • next/image lazy-loads everything past the first three cards.
 *   • Click any card → existing full-screen lightbox.
 */
export default function PortfolioGallery({ section }: PortfolioGalleryProps) {
    const railRef = useRef<HTMLDivElement>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const setHandVisible = useUIStore((state) => state.setHandVisible);

    // Drag-to-scroll state — refs only, no re-render thrash on every move.
    const dragStartXRef = useRef<number | null>(null);
    const dragStartScrollRef = useRef(0);
    const dragMovedRef = useRef(false);
    // Last two move samples drive momentum on release. Tracking just the most
    // recent delta avoids the "stops dead at the end of a flick" feel.
    const lastMoveTimeRef = useRef(0);
    const lastMoveXRef = useRef(0);
    const velocityRef = useRef(0);
    const momentumRafRef = useRef(0);
    const programmaticRafRef = useRef(0);
    // Tracks whether the most-recent pointer interaction was a drag, so the
    // card's onClick can suppress itself if the user drag-stopped on a card.
    const justDraggedRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    const galleryImages = (section?.images ?? []).map((item) => ({
        src: urlFor(item.image).width(1600).quality(85).url(),
        cardSrc: urlFor(item.image).width(640).quality(80).url(),
        alt: item.alt,
    }));
    const totalImages = galleryImages.length;

    // Drag listeners are attached at the rail level via pointer events. Using
    // pointer events (not mousedown/move/up) means touch + mouse + stylus all
    // route through the same handler. Native touch swipe still works because
    // the rail is overflow-x-auto — touches that don't engage our drag logic
    // fall through to native scrolling.
    useEffect(() => {
        const rail = railRef.current;
        if (!rail) return;

        const cancelMomentum = () => {
            if (momentumRafRef.current) {
                cancelAnimationFrame(momentumRafRef.current);
                momentumRafRef.current = 0;
            }
        };
        const cancelProgrammatic = () => {
            if (programmaticRafRef.current) {
                cancelAnimationFrame(programmaticRafRef.current);
                programmaticRafRef.current = 0;
            }
        };

        const onPointerDown = (e: PointerEvent) => {
            // Only the primary mouse button. Touch pointers report button = 0
            // too, so the check works for both.
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            // Mouse drag-to-scroll only — let touch use native momentum scroll.
            if (e.pointerType !== 'mouse') return;
            // A pointerdown during a glide cancels it so the user retakes
            // control immediately, no fight with the in-flight tween.
            cancelMomentum();
            cancelProgrammatic();
            dragStartXRef.current = e.clientX;
            dragStartScrollRef.current = rail.scrollLeft;
            dragMovedRef.current = false;
            lastMoveTimeRef.current = e.timeStamp;
            lastMoveXRef.current = e.clientX;
            velocityRef.current = 0;
        };

        const onPointerMove = (e: PointerEvent) => {
            if (dragStartXRef.current === null) return;
            const delta = e.clientX - dragStartXRef.current;
            if (!dragMovedRef.current && Math.abs(delta) >= DRAG_THRESHOLD_PX) {
                dragMovedRef.current = true;
                setIsDragging(true);
                // Once we know it's a drag, capture the pointer so the move
                // events keep coming even if the cursor leaves a card.
                rail.setPointerCapture(e.pointerId);
            }
            if (dragMovedRef.current) {
                rail.scrollLeft = dragStartScrollRef.current - delta;
                e.preventDefault();

                // Sample velocity in px/ms. EMA-smoothed so a fast jiggle at
                // the end doesn't dominate the release glide.
                const dt = e.timeStamp - lastMoveTimeRef.current;
                if (dt > 0) {
                    const sampleVelocity = (e.clientX - lastMoveXRef.current) / dt;
                    velocityRef.current =
                        velocityRef.current * 0.6 + sampleVelocity * 0.4;
                }
                lastMoveTimeRef.current = e.timeStamp;
                lastMoveXRef.current = e.clientX;
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            if (dragStartXRef.current === null) return;
            const wasDrag = dragMovedRef.current;
            if (wasDrag) {
                justDraggedRef.current = true;
                // Clear the suppression flag on the next tick so onClick runs
                // its check synchronously after pointerup, but normal clicks
                // (mousedown without movement) still register.
                setTimeout(() => {
                    justDraggedRef.current = false;
                }, 0);
            }
            dragStartXRef.current = null;
            dragMovedRef.current = false;
            setIsDragging(false);
            if (rail.hasPointerCapture(e.pointerId)) {
                rail.releasePointerCapture(e.pointerId);
            }

            // Momentum glide: continue scrolling in the drag direction with
            // exponential decay. Only kick off if velocity passed the
            // visible-motion threshold so a slow drag-stop doesn't overshoot.
            if (wasDrag && Math.abs(velocityRef.current) > 0.05) {
                // velocity is in clientX-px/ms; scrollLeft moves opposite the
                // drag direction so we negate.
                let v = -velocityRef.current * 16; // scale to per-frame at 60fps
                let lastTs = performance.now();
                const tick = (ts: number) => {
                    const dt = ts - lastTs;
                    lastTs = ts;
                    rail.scrollLeft += v * (dt / 16);
                    // Decay. 0.94 / 16ms ≈ 600ms half-life — feels glidey but
                    // settles within a second.
                    v *= Math.pow(0.94, dt / 16);
                    if (Math.abs(v) > 0.05) {
                        momentumRafRef.current = requestAnimationFrame(tick);
                    } else {
                        momentumRafRef.current = 0;
                    }
                };
                momentumRafRef.current = requestAnimationFrame(tick);
            }
        };

        // Wheel events on the rail also kill any in-flight momentum so a
        // mouse-wheel scroll doesn't fight a glide.
        const onWheel = () => {
            cancelMomentum();
            cancelProgrammatic();
        };

        rail.addEventListener('pointerdown', onPointerDown);
        rail.addEventListener('pointermove', onPointerMove);
        rail.addEventListener('pointerup', onPointerUp);
        rail.addEventListener('pointercancel', onPointerUp);
        rail.addEventListener('wheel', onWheel, { passive: true });

        return () => {
            rail.removeEventListener('pointerdown', onPointerDown);
            rail.removeEventListener('pointermove', onPointerMove);
            rail.removeEventListener('pointerup', onPointerUp);
            rail.removeEventListener('pointercancel', onPointerUp);
            rail.removeEventListener('wheel', onWheel);
            cancelMomentum();
            cancelProgrammatic();
        };
    }, []);

    if (!section || totalImages === 0) return null;

    // Custom RAF-tween for the chevrons so the easing matches the site's
    // standard cubic-bezier(0.16, 1, 0.3, 1) instead of the browser's default
    // 'smooth' which varies and feels mechanical.
    function tweenScrollBy(dir: 'left' | 'right') {
        const rail = railRef.current;
        if (!rail) return;
        if (programmaticRafRef.current) {
            cancelAnimationFrame(programmaticRafRef.current);
            programmaticRafRef.current = 0;
        }
        if (momentumRafRef.current) {
            cancelAnimationFrame(momentumRafRef.current);
            momentumRafRef.current = 0;
        }
        const start = rail.scrollLeft;
        const target = start + (dir === 'right' ? SCROLL_STEP : -SCROLL_STEP);
        const distance = target - start;
        const duration = 700;
        const startTs = performance.now();
        // cubic-bezier(0.16, 1, 0.3, 1) — same curve used across the marketing
        // site for entrance animations.
        const ease = (t: number) => {
            // Approximation: this curve front-loads movement then settles —
            // we use the standard ease-out cubic which matches it closely
            // enough at the duration we're working with.
            return 1 - Math.pow(1 - t, 3);
        };
        const tick = (ts: number) => {
            const elapsed = ts - startTs;
            const t = Math.min(1, elapsed / duration);
            rail.scrollLeft = start + distance * ease(t);
            if (t < 1) {
                programmaticRafRef.current = requestAnimationFrame(tick);
            } else {
                programmaticRafRef.current = 0;
            }
        };
        programmaticRafRef.current = requestAnimationFrame(tick);
    }

    return (
        <section
            id="gallery"
            aria-label="Portfolio gallery"
            className="py-24 md:py-32 relative z-10 bg-crown-black text-clean-white overflow-hidden"
        >
            <motion.div
                onViewportEnter={() => setHandVisible(false)}
                className="absolute top-0 left-0 w-full h-20 pointer-events-none"
            />

            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-14">
                    <div>
                        <span className="text-xs tracking-[0.3em] uppercase text-brushed-gold mb-3 block">
                            Portfolio
                        </span>
                        <h2 className="font-serif text-4xl md:text-5xl text-clean-white leading-tight">
                            {section.heading}
                        </h2>
                        {section.description && (
                            <p className="text-stone-grey mt-3 max-w-md">{section.description}</p>
                        )}
                    </div>

                    {/* Desktop chevrons. Mobile uses native swipe — no chrome needed. */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => tweenScrollBy('left')}
                            aria-label="Scroll gallery left"
                            className="w-11 h-11 rounded-full border border-clean-white/20 text-clean-white/80 hover:text-clean-white hover:border-brushed-gold flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => tweenScrollBy('right')}
                            aria-label="Scroll gallery right"
                            className="w-11 h-11 rounded-full border border-clean-white/20 text-clean-white/80 hover:text-clean-white hover:border-brushed-gold flex items-center justify-center transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal rail — centered in the container. Cursor flips to
                grab/grabbing so users get a visual cue that the rail is
                draggable on desktop. select-none stops accidental text
                selection during a drag. */}
            <div
                ref={railRef}
                className={`container mx-auto flex gap-4 overflow-x-auto scrollbar-hide px-6 select-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab md:cursor-grab'
                }`}
            >
                {galleryImages.map((image, index) => (
                    <motion.button
                        key={index}
                        type="button"
                        onClick={(e) => {
                            // Suppress the click that follows a drag — prevents
                            // the lightbox from opening when the user
                            // drag-stops on a card.
                            if (justDraggedRef.current) {
                                e.preventDefault();
                                return;
                            }
                            setLightboxIndex(index);
                        }}
                        aria-label={`Open ${image.alt}`}
                        className="relative flex-shrink-0 w-72 md:w-80 aspect-[3/4] bg-warm-black overflow-hidden group"
                        // Card scroll-reveal: fade and lift each card in as it
                        // enters the rail's own viewport. amount: 0.4 means the
                        // card has to be ~40% visible before the animation
                        // fires — picks the card just-coming-into-view rather
                        // than every offscreen card all at once.
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ root: railRef, once: true, amount: 0.4 }}
                        transition={{
                            duration: 0.7,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        <Image
                            src={image.cardSrc}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 768px) 75vw, 320px"
                            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] pointer-events-none"
                            loading={index < 3 ? 'eager' : 'lazy'}
                            priority={index === 0}
                            draggable={false}
                        />
                        {/* Subtle hover shade so the gold underline reads. */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-crown-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <span className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase text-clean-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            {section.viewDetailsLabel || 'View'}
                            <span className="block flex-1 h-px bg-brushed-gold origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                        </span>
                    </motion.button>
                ))}
            </div>

            <ImageLightbox
                images={galleryImages.map((i) => ({ src: i.src, alt: i.alt }))}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNext={() => setLightboxIndex((i) => (i === null ? null : (i + 1) % totalImages))}
                onPrev={() => setLightboxIndex((i) => (i === null ? null : (i - 1 + totalImages) % totalImages))}
            />
        </section>
    );
}
