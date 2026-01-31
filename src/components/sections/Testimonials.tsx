'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Testimonial } from '@/lib/types';

interface TestimonialsProps {
    testimonials: Testimonial[];
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const next = useCallback(() => {
        setCurrent((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [isPaused, next]);

    return (
        <section className="py-32 relative z-10 bg-clean-white" aria-label="Client testimonials">
            <div
                className="container mx-auto px-6 max-w-4xl text-center"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <span className="text-xs tracking-[0.3em] uppercase text-brushed-gold mb-8 block">
                    Testimonials
                </span>

                <div className="relative min-h-[280px] flex items-center justify-center" aria-live="polite">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex flex-col items-center justify-center"
                        >
                            <blockquote className="font-serif text-2xl md:text-3xl italic leading-relaxed text-crown-black mb-8 max-w-3xl">
                                &ldquo;{testimonials[current].quote}&rdquo;
                            </blockquote>

                            <div className="space-y-1">
                                <p className="font-sans text-sm tracking-widest uppercase text-warm-black">
                                    {testimonials[current].author}
                                </p>
                                <p className="font-sans text-xs tracking-wider text-stone-grey">
                                    {testimonials[current].service}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dot navigation */}
                <div className="flex justify-center gap-3 mt-12">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrent(index)}
                            aria-label={`Show testimonial ${index + 1} of ${testimonials.length}`}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === current
                                ? 'bg-brushed-gold w-8'
                                : 'bg-stone-grey/30 hover:bg-stone-grey/50'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
