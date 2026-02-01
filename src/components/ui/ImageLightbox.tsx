'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';

interface LightboxImage {
    src: string;
    alt: string;
}

interface ImageLightboxProps {
    images: LightboxImage[];
    currentIndex: number | null;
    onClose: () => void;
}

export default function ImageLightbox({ images, currentIndex, onClose }: ImageLightboxProps) {
    const isOpen = currentIndex !== null;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    return (
        <AnimatePresence>
            {isOpen && currentIndex !== null && (
                <motion.div
                    role="dialog"
                    aria-label="Image lightbox"
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-crown-black/95 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    {/* Top Right Close */}
                    <button
                        onClick={onClose}
                        className="fixed top-6 right-6 text-clean-white/70 hover:text-clean-white transition-colors z-[70] p-2"
                        aria-label="Close lightbox"
                    >
                        <X size={32} />
                    </button>

                    <motion.div
                        className="relative w-[90vw] h-[80vh] max-w-5xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={images[currentIndex].src}
                            alt={images[currentIndex].alt}
                            fill
                            sizes="90vw"
                            className="object-contain"
                            priority
                        />
                    </motion.div>

                    {/* Bottom Close Button (Mobile Friendly) */}
                    <button
                        onClick={onClose}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-clean-white text-sm tracking-widest uppercase hover:bg-white/20 transition-colors"
                    >
                        Close
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
