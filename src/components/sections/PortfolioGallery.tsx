'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';

const galleryImages = [
    { src: '/images/Gallery_img1.webp', alt: 'Premium nail artistry detailing' },
    { src: '/images/Gallery_img2.webp', alt: 'Elegant manicure finish' },
    { src: '/images/Gallery_img3.webp', alt: 'Structural builder gel enhancement' },
    { src: '/images/Gallery_img4.webp', alt: 'Bespoke hand-painted design' },
    { src: '/images/Gallery_img5.webp', alt: 'Luxury pedicure texture' },
];

const CARD_WIDTH = 400;
const CARD_GAP = 32;
const STEP = CARD_WIDTH + CARD_GAP;

import { useUIStore } from '@/lib/store';

export default function PortfolioGallery() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Restore deleted logic
    const setHandVisible = useUIStore((state) => state.setHandVisible);

    // Infinite Scroll: Triple the images to create seamless loop buffers
    const infiniteImages = [...galleryImages, ...galleryImages, ...galleryImages];
    const originalLength = galleryImages.length;

    const scrollToMiddle = useCallback(() => {
        if (containerRef.current) {
            // Scroll to the start of the middle set
            const middleSetStart = originalLength * STEP;
            containerRef.current.scrollLeft = middleSetStart;
        }
    }, [originalLength]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Verify initial scroll position
        scrollToMiddle();

        return () => window.removeEventListener('resize', checkMobile);
    }, [scrollToMiddle]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        const singleSetWidth = originalLength * STEP;

        // If scrolled past the second set (to the right), jump back to middle
        if (scrollLeft >= singleSetWidth * 2) {
            containerRef.current.scrollLeft = scrollLeft - singleSetWidth;
        }
        // If scrolled before the middle set (to the left), jump forward to middle
        else if (scrollLeft < singleSetWidth) {
            containerRef.current.scrollLeft = scrollLeft + singleSetWidth;
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (!containerRef.current) return;
        const currentScroll = containerRef.current.scrollLeft;
        const targetScroll = direction === 'right'
            ? currentScroll + STEP
            : currentScroll - STEP;

        containerRef.current.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    };

    return (
        <section id="gallery" aria-label="Portfolio gallery" className="py-32 relative z-10 bg-crown-black text-clean-white overflow-hidden">
            <motion.div
                onViewportEnter={() => setHandVisible(false)}
                className="absolute top-0 left-0 w-full h-20 pointer-events-none"
            />
            <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
                <div>
                    <h2 className="font-serif text-5xl mb-2 text-clean-white">Selected Works</h2>
                    <p className="text-stone-grey">Drag or use arrows to explore our latest creations.</p>
                </div>
                {!isMobile && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => scroll('left')}
                            aria-label="Previous"
                            className="w-12 h-12 border border-clean-white/20 rounded-full flex items-center justify-center hover:bg-clean-white/10 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            aria-label="Next"
                            className="w-12 h-12 border border-clean-white/20 rounded-full flex items-center justify-center hover:bg-clean-white/10 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="container mx-auto px-6 overflow-x-auto md:overflow-x-hidden cursor-grab active:cursor-grabbing scrollbar-hide touch-pan-x"
            >
                <motion.div
                    className="flex w-fit snap-x snap-mandatory"
                    style={{ gap: CARD_GAP }}
                >
                    {infiniteImages.map((image, index) => (
                        <motion.div
                            key={index}
                            className="relative w-[300px] h-[400px] md:w-[400px] md:h-[550px] flex-shrink-0 bg-warm-black overflow-hidden group cursor-pointer snap-center"
                            initial={{ opacity: 0, x: 60 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (index % originalLength) * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 0.98 }}
                            onClick={() => setLightboxIndex(index % originalLength)}
                        >
                            <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                sizes="(max-width: 768px) 300px, 400px"
                                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <span className="text-xs tracking-widest uppercase">View Details</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <ImageLightbox
                images={galleryImages.map(img => ({ src: img.src, alt: img.alt }))}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
            />
        </section>
    );
}
