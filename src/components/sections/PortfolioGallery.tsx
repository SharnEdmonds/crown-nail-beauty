'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';

const galleryImages = [
    { src: '/images/572791113_18488579968075791_4675245809445354990_n.jpg', alt: 'Intricate floral nail art design with pastel tones' },
    { src: '/images/575677176_18489162850075791_657924404083559544_n.jpg', alt: 'Elegant gel extension set with chrome finish' },
    { src: '/images/600870254_18496869700075791_5913245550080983424_n.jpg', alt: 'Detailed hand-painted nail design with gold accents' },
    { src: '/images/599840595_18496425970075791_2748077999527591059_n.jpg', alt: 'Classic French manicure with a modern twist' },
    { src: '/images/572891681_18488579977075791_5777883336068587512_n.jpg', alt: 'Luxury nail art featuring marble texture' },
    { src: '/images/573661992_18489015919075791_2345851513932796461_n.jpg', alt: 'Bold statement nail design with geometric patterns' },
];

const CARD_WIDTH = 400;
const CARD_GAP = 32;
const STEP = CARD_WIDTH + CARD_GAP;

import { useUIStore } from '@/lib/store';

export default function PortfolioGallery() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [offset, setOffset] = useState(0);
    const controls = useAnimationControls();
    const setHandVisible = useUIStore((state) => state.setHandVisible);

    const maxOffset = -(galleryImages.length * STEP - (containerRef.current?.clientWidth ?? STEP));

    const scroll = useCallback((direction: 'left' | 'right') => {
        setOffset((prev) => {
            const next = direction === 'right'
                ? Math.max(prev - STEP, maxOffset)
                : Math.min(prev + STEP, 0);
            controls.start({ x: next, transition: { type: 'spring', stiffness: 300, damping: 30 } });
            return next;
        });
    }, [controls, maxOffset]);

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
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => scroll('left')}
                        disabled={offset >= 0}
                        aria-label="Previous"
                        className="w-12 h-12 border border-clean-white/20 rounded-full flex items-center justify-center hover:bg-clean-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={offset <= maxOffset}
                        aria-label="Next"
                        className="w-12 h-12 border border-clean-white/20 rounded-full flex items-center justify-center hover:bg-clean-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="container mx-auto px-6 overflow-x-hidden cursor-grab active:cursor-grabbing">
                <motion.div
                    className="flex w-fit"
                    style={{ gap: CARD_GAP }}
                    drag="x"
                    dragConstraints={containerRef}
                    animate={controls}
                    whileTap={{ cursor: "grabbing" }}
                    onDragEnd={(_, info) => {
                        const newOffset = Math.max(Math.min(offset + info.offset.x, 0), maxOffset);
                        const snapped = Math.round(newOffset / STEP) * STEP;
                        setOffset(snapped);
                        controls.start({ x: snapped, transition: { type: 'spring', stiffness: 300, damping: 30 } });
                    }}
                >
                    {galleryImages.map((image, index) => (
                        <motion.div
                            key={index}
                            className="relative w-[300px] h-[400px] md:w-[400px] md:h-[550px] flex-shrink-0 bg-warm-black overflow-hidden group cursor-pointer"
                            initial={{ opacity: 0, x: 60 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 0.98 }}
                            onClick={() => setLightboxIndex(index)}
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
