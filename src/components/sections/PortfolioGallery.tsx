'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { urlFor } from '@/lib/sanity-image';
import { useUIStore } from '@/lib/store';
import type { PortfolioSection } from '@/lib/types';

interface PortfolioGalleryProps {
    section: PortfolioSection | null;
}

const DEFAULT_ROTATION_SECONDS = 6;

/**
 * Cinematic magazine-spread gallery.
 *
 * Featured image (full-width 16:9) crossfades between portfolio images.
 * Below it, a thumbnail strip shows every image; clicking one switches the
 * featured image. A counter and slim gold progress line sit alongside.
 *
 * Performance posture:
 *   • Only one full-resolution image is ever mounted (AnimatePresence mode="wait").
 *   • Thumbnails request a 240px-wide variant from Sanity — small + cheap.
 *   • Auto-rotation is opt-in via Sanity (`autoRotate`) and double-gated on
 *     IntersectionObserver visibility, hover/focus, and prefers-reduced-motion.
 *     When idle, the component does zero JS work.
 *   • No infinite scroll, no JS scroll loop, no per-frame tweens.
 */
export default function PortfolioGallery({ section }: PortfolioGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const setHandVisible = useUIStore((state) => state.setHandVisible);
    const prefersReducedMotion = useReducedMotion();

    const galleryImages = (section?.images ?? []).map((item) => ({
        src: urlFor(item.image).width(2000).quality(85).url(),
        thumbSrc: urlFor(item.image).width(320).quality(70).url(),
        alt: item.alt,
    }));
    const totalImages = galleryImages.length;

    // Single IntersectionObserver — pause auto-rotate when off-screen so the
    // background tab / scrolled-past gallery doesn't keep ticking.
    useEffect(() => {
        if (!sectionRef.current) return;
        const obs = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.25 }
        );
        obs.observe(sectionRef.current);
        return () => obs.disconnect();
    }, []);

    // Auto-rotate: opt-in via Sanity, disabled by reduced-motion, hover, or
    // off-screen. setInterval fires only while every gate is open.
    useEffect(() => {
        if (totalImages < 2) return;
        if (!section?.autoRotate) return;
        if (prefersReducedMotion) return;
        if (isHovering) return;
        if (!isVisible) return;
        if (lightboxIndex !== null) return;

        const seconds = section.rotationSeconds ?? DEFAULT_ROTATION_SECONDS;
        const id = setInterval(() => {
            setActiveIndex((i) => (i + 1) % totalImages);
        }, seconds * 1000);
        return () => clearInterval(id);
    }, [section?.autoRotate, section?.rotationSeconds, prefersReducedMotion, isHovering, isVisible, lightboxIndex, totalImages]);

    if (!section || totalImages === 0) return null;

    const activeImage = galleryImages[activeIndex];
    const progressPct = ((activeIndex + 1) / totalImages) * 100;

    return (
        <section
            id="gallery"
            ref={sectionRef}
            aria-label="Portfolio gallery"
            className="py-24 md:py-32 relative z-10 bg-crown-black text-clean-white overflow-hidden"
        >
            <motion.div
                onViewportEnter={() => setHandVisible(false)}
                className="absolute top-0 left-0 w-full h-20 pointer-events-none"
            />

            <div className="container mx-auto px-6">
                {/* Header — matches the featured frame width so the counter
                    sits at the right edge of the image, not the viewport. */}
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-14">
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
                    <div className="text-stone-grey text-xs tracking-[0.3em] tabular-nums">
                        {String(activeIndex + 1).padStart(2, '0')} / {String(totalImages).padStart(2, '0')}
                    </div>
                </div>

                {/* Featured image — single full-res render at any time.
                    Capped at 4xl + auto margins so the frame fits comfortably
                    on desktop without dominating the viewport. Click opens the
                    full-screen lightbox. */}
                <div
                    className="relative w-full max-w-4xl mx-auto aspect-[16/9] bg-warm-black overflow-hidden cursor-pointer group"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onFocus={() => setIsHovering(true)}
                    onBlur={() => setIsHovering(false)}
                    onClick={() => setLightboxIndex(activeIndex)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setLightboxIndex(activeIndex);
                        }
                    }}
                    aria-label={`Open ${activeImage.alt} in lightbox`}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Image
                                src={activeImage.src}
                                alt={activeImage.alt}
                                fill
                                sizes="(max-width: 768px) 100vw, 90vw"
                                className="object-cover"
                                priority={activeIndex === 0}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Subtle bottom gradient for the "View" eyebrow */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-crown-black/70 to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex items-center gap-3 pointer-events-none">
                        <span className="text-[10px] tracking-[0.35em] uppercase text-clean-white/80">
                            {section.viewDetailsLabel || 'View'}
                        </span>
                        <span className="block w-8 h-px bg-brushed-gold origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                    </div>
                </div>

                {/* Progress line — 1px gold, fills with index. Matches featured frame width. */}
                <div className="relative h-px bg-clean-white/10 mt-6 overflow-hidden max-w-4xl mx-auto">
                    <div
                        className="absolute inset-y-0 left-0 bg-brushed-gold transition-[width] duration-500 ease-out"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                {/* Thumbnail row — aligned with featured frame */}
                <div
                    className="mt-6 max-w-4xl mx-auto flex gap-3 overflow-x-auto scrollbar-hide pb-2 justify-center"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    {galleryImages.map((image, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                aria-label={`Show ${image.alt}`}
                                aria-current={isActive ? 'true' : undefined}
                                className={`relative flex-shrink-0 w-20 h-28 md:w-24 md:h-32 overflow-hidden bg-warm-black transition-[opacity,transform] duration-500 ease-out ${
                                    isActive
                                        ? 'opacity-100 ring-1 ring-brushed-gold ring-offset-2 ring-offset-crown-black'
                                        : 'opacity-50 hover:opacity-90'
                                }`}
                            >
                                <Image
                                    src={image.thumbSrc}
                                    alt=""
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                    loading="lazy"
                                />
                            </button>
                        );
                    })}
                </div>
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
