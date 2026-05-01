'use client';

import { useRef, useState } from 'react';
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

/**
 * Simple horizontal-scroll gallery. Each image is a uniform 3:4 portrait card
 * sized for thumb-friendly tap targets on mobile and a clean rail on desktop.
 *
 * Why this shape:
 *   • Scales to any number of images — native browser scroll, snap-x.
 *   • Cards lazy-load via next/image so a 50-image gallery only renders
 *     what's onscreen + the next-in-line.
 *   • Click any card → existing full-screen lightbox.
 *   • Desktop gets prev/next chevrons; mobile uses native swipe.
 */
export default function PortfolioGallery({ section }: PortfolioGalleryProps) {
    const railRef = useRef<HTMLDivElement>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const setHandVisible = useUIStore((state) => state.setHandVisible);

    const galleryImages = (section?.images ?? []).map((item) => ({
        src: urlFor(item.image).width(1600).quality(85).url(),
        cardSrc: urlFor(item.image).width(640).quality(80).url(),
        alt: item.alt,
    }));
    const totalImages = galleryImages.length;

    if (!section || totalImages === 0) return null;

    function scrollBy(dir: 'left' | 'right') {
        if (!railRef.current) return;
        railRef.current.scrollBy({
            left: dir === 'right' ? SCROLL_STEP : -SCROLL_STEP,
            behavior: 'smooth',
        });
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
                            onClick={() => scrollBy('left')}
                            aria-label="Scroll gallery left"
                            className="w-11 h-11 rounded-full border border-clean-white/20 text-clean-white/80 hover:text-clean-white hover:border-brushed-gold flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollBy('right')}
                            aria-label="Scroll gallery right"
                            className="w-11 h-11 rounded-full border border-clean-white/20 text-clean-white/80 hover:text-clean-white hover:border-brushed-gold flex items-center justify-center transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal rail — centered in the container. Symmetric padding
                on both sides so the strip sits in the middle of the page
                rather than bleeding off either edge. */}
            <div
                ref={railRef}
                className="container mx-auto flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-6"
                style={{ scrollPaddingLeft: '1.5rem' }}
            >
                {galleryImages.map((image, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        aria-label={`Open ${image.alt}`}
                        className="relative flex-shrink-0 w-72 md:w-80 aspect-[3/4] bg-warm-black overflow-hidden snap-start group"
                    >
                        <Image
                            src={image.cardSrc}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 768px) 75vw, 320px"
                            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                            loading={index < 3 ? 'eager' : 'lazy'}
                            priority={index === 0}
                        />
                        {/* Subtle hover shade so the gold underline reads. */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-crown-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <span className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase text-clean-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            {section.viewDetailsLabel || 'View'}
                            <span className="block flex-1 h-px bg-brushed-gold origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                        </span>
                    </button>
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
