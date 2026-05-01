'use client';

import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface LightboxImage {
    src: string;
    alt: string;
}

interface ImageLightboxProps {
    images: LightboxImage[];
    currentIndex: number | null;
    onClose: () => void;
    /** Optional. If provided, prev/next arrows + ArrowLeft/Right keys + swipe become active. */
    onNext?: () => void;
    onPrev?: () => void;
}

import { useUIStore } from '@/lib/store';

const SWIPE_THRESHOLD = 60;

export default function ImageLightbox({ images, currentIndex, onClose, onNext, onPrev }: ImageLightboxProps) {
    const isOpen = currentIndex !== null;
    const setScrollLocked = useUIStore((state) => state.setScrollLocked);
    // Portal target — only resolves on the client. Without this, ancestor
    // sections like #gallery (relative + z-10 + overflow-hidden) create their
    // own stacking contexts and trap the fixed lightbox below the navbar
    // (z-50). Mounting to document.body escapes every ancestor context.
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        else if (e.key === 'ArrowRight' && onNext) onNext();
        else if (e.key === 'ArrowLeft' && onPrev) onPrev();
    }, [onClose, onNext, onPrev]);

    useEffect(() => {
        if (isOpen) {
            setScrollLocked(true);
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            setScrollLocked(false);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown, setScrollLocked]);

    const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -SWIPE_THRESHOLD && onNext) onNext();
        else if (info.offset.x > SWIPE_THRESHOLD && onPrev) onPrev();
    };

    if (!portalTarget) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && currentIndex !== null && (
                <motion.div
                    role="dialog"
                    aria-label="Image lightbox"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-crown-black/95 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    {/* Top Right Close */}
                    <button
                        onClick={onClose}
                        className="fixed top-6 right-6 text-clean-white/70 hover:text-clean-white transition-colors z-[110] p-2"
                        aria-label="Close lightbox"
                    >
                        <X size={32} />
                    </button>

                    {/* Prev arrow */}
                    {onPrev && images.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrev();
                            }}
                            aria-label="Previous image"
                            className="fixed left-6 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 rounded-full border border-brushed-gold/40 text-clean-white/80 hover:text-clean-white hover:border-brushed-gold flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft size={22} />
                        </button>
                    )}

                    {/* Next arrow */}
                    {onNext && images.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNext();
                            }}
                            aria-label="Next image"
                            className="fixed right-6 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 rounded-full border border-brushed-gold/40 text-clean-white/80 hover:text-clean-white hover:border-brushed-gold flex items-center justify-center transition-colors"
                        >
                            <ChevronRight size={22} />
                        </button>
                    )}

                    <motion.div
                        key={currentIndex}
                        // Fill the viewport with safe padding for the close/prev/next/counter chrome.
                        // No max-width cap so wide displays use the whole screen.
                        className="relative w-screen h-screen px-4 py-20 md:px-20 md:py-16"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                        drag={onNext || onPrev ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                    >
                        <Image
                            src={images[currentIndex].src}
                            alt={images[currentIndex].alt}
                            fill
                            sizes="100vw"
                            className="object-contain pointer-events-none select-none"
                            priority
                            draggable={false}
                        />
                    </motion.div>

                    {/* Counter, bottom-left */}
                    {images.length > 1 && (
                        <div className="fixed bottom-8 left-8 z-[110] text-clean-white/70 text-xs tracking-[0.3em] tabular-nums">
                            {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                        </div>
                    )}

                    {/* Bottom Close Button (Mobile Friendly) */}
                    <button
                        onClick={onClose}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-clean-white text-sm tracking-widest uppercase hover:bg-white/20 transition-colors"
                    >
                        Close
                    </button>
                </motion.div>
            )}
        </AnimatePresence>,
        portalTarget,
    );
}
