'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
    headline?: string;
}

const defaultHeadlineWords = [
    { text: 'Where', italic: false },
    { text: 'Meticulous', italic: false },
    { text: '\n', italic: false },
    { text: 'Craftsmanship', italic: true },
    { text: '\n', italic: false },
    { text: 'Meets', italic: false },
    { text: 'Serene', italic: false },
    { text: 'Luxury.', italic: false },
];

function parseHeadline(headline: string) {
    // Parse headline into styled words: "Craftsmanship" gets italic, line breaks after "Meticulous" and "Craftsmanship"
    const words = headline.split(/\s+/);
    const result: { text: string; italic: boolean }[] = [];
    for (const word of words) {
        // Add line breaks for visual structure (after 2nd and 3rd words for the original layout)
        if (result.length === 2 || result.length === 4) {
            result.push({ text: '\n', italic: false });
        }
        // Make "Craftsmanship" italic (or the 3rd real word)
        const realWords = result.filter(w => w.text !== '\n');
        const isItalic = realWords.length === 2; // 3rd word (0-indexed = 2)
        result.push({ text: word, italic: isItalic });
    }
    return result;
}

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const wordVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
};

import { useUIStore } from '@/lib/store';

export default function Hero({ headline }: HeroProps) {
    const setHandVisible = useUIStore((state) => state.setHandVisible);

    const headlineWords = useMemo(() => {
        return headline ? parseHeadline(headline) : defaultHeadlineWords;
    }, [headline]);

    return (
        <section
            id="hero"
            className="relative h-screen w-full flex items-center z-10"
        >
            <motion.div
                onViewportEnter={() => setHandVisible(true)}
                className="absolute inset-0 pointer-events-none"
            />
            <div className="container mx-auto px-6">
                <div className="max-w-4xl">
                    <motion.h1
                        className="font-serif leading-[0.9] text-crown-black mb-6 md:mb-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {headlineWords.map((word, i) => {
                            if (word.text === '\n') {
                                return <br key={i} />;
                            }
                            return (
                                <motion.span
                                    key={i}
                                    variants={wordVariants}
                                    className={`inline-block mr-[0.3em] ${word.italic ? 'italic pl-4 md:pl-24' : ''}`}
                                >
                                    {word.text}
                                </motion.span>
                            );
                        })}
                    </motion.h1>

                    <motion.div
                        className="flex flex-col md:flex-row gap-4 md:gap-6 mt-8 md:mt-12 pl-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                    >
                        <a
                            href="/"
                            className="px-8 py-4 bg-warm-black text-clean-white tracking-widest text-sm hover:bg-crown-black transition-colors duration-300 rounded-sm inline-block text-center"
                        >
                            RESERVE EXPERIENCE
                        </a>
                        <a
                            href="#gallery"
                            className="px-8 py-4 border border-warm-black text-warm-black tracking-widest text-sm hover:bg-warm-black hover:text-clean-white transition-all duration-300 rounded-sm inline-block text-center"
                        >
                            VIEW PORTFOLIO
                        </a>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-4 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <span className="text-[10px] tracking-[0.2em] text-stone-grey uppercase">Scroll</span>
                <div className="w-[1px] h-12 bg-gray-300 relative overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 w-full h-1/2 bg-warm-black"
                        animate={{ y: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            </motion.div>
        </section>
    );
}
