'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/lib/store';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function LoadingScreen() {
    const isLoading = useUIStore((s) => s.isLoading);
    const setLoading = useUIStore((s) => s.setLoading);
    const [progress, setProgress] = useState(0);
    const readyRef = useRef(false);

    useEffect(() => {
        let active = true;
        let current = 0;

        const tick = setInterval(() => {
            if (!active) return;
            const ready = readyRef.current;
            const ceiling = ready ? 100 : 92;
            if (current < ceiling) {
                current += ready ? 4 : Math.max(0.6, (ceiling - current) * 0.04);
                setProgress(Math.min(current, ceiling));
            }
        }, 40);

        const preload = async () => {
            try {
                const res = await fetch('/models/Hand-model-draco.glb');
                const reader = res.body?.getReader();
                const total = Number(res.headers.get('content-length')) || 0;
                let loaded = 0;
                if (reader && total > 0) {
                    while (active) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        loaded += value?.length || 0;
                        current = Math.max(current, (loaded / total) * 92);
                    }
                } else if (res.body) {
                    await res.arrayBuffer();
                }
            } catch {
                /* fall through — dismiss on timeout below */
            }
            if (active) readyRef.current = true;
        };

        preload();

        // Hard ceiling so the loader never traps the user
        const failSafe = setTimeout(() => {
            if (active) readyRef.current = true;
        }, 7000);

        return () => {
            active = false;
            clearInterval(tick);
            clearTimeout(failSafe);
        };
    }, []);

    useEffect(() => {
        if (progress >= 100) {
            const t = setTimeout(() => setLoading(false), 450);
            return () => clearTimeout(t);
        }
    }, [progress, setLoading]);

    useEffect(() => {
        if (!isLoading) return;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = overflow;
        };
    }, [isLoading]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    key="loader"
                    className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-marble-stone text-crown-black"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.9, ease: EASE } }}
                    aria-live="polite"
                    aria-busy="true"
                >
                    {/* Subtle vignette */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse at center, rgba(250,250,250,0.5) 0%, rgba(232,228,224,0) 60%)',
                        }}
                    />

                    {/* Top mark */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                        className="relative pt-10 md:pt-14 text-center"
                    >
                        <div className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-stone-grey">
                            Crown Nail &amp; Beauty
                        </div>
                        <div className="mt-3 mx-auto h-px w-10 bg-brushed-gold/70" />
                    </motion.div>

                    {/* Center lockup */}
                    <div className="relative flex flex-col items-center px-6">
                        <motion.h1
                            className="font-serif text-crown-black text-center leading-[0.95] text-[clamp(3rem,10vw,7rem)]"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
                            }}
                        >
                            {['Crafted', 'in', 'Quiet'].map((w, i) => (
                                <motion.span
                                    key={w}
                                    variants={{
                                        hidden: { opacity: 0, y: 32 },
                                        visible: {
                                            opacity: 1,
                                            y: 0,
                                            transition: { duration: 0.9, ease: EASE },
                                        },
                                    }}
                                    className={`inline-block mr-[0.28em] ${i === 1 ? 'italic font-light' : ''}`}
                                >
                                    {w}
                                </motion.span>
                            ))}
                            <br />
                            <motion.span
                                variants={{
                                    hidden: { opacity: 0, y: 32 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: { duration: 0.9, ease: EASE },
                                    },
                                }}
                                className="inline-block italic font-light"
                            >
                                Luxury.
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.8, ease: EASE }}
                            className="mt-8 text-[11px] md:text-xs tracking-[0.28em] uppercase text-charcoal-grey/80"
                        >
                            Preparing your experience
                        </motion.p>
                    </div>

                    {/* Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
                        className="relative w-full max-w-[min(440px,72vw)] px-6 pb-10 md:pb-14"
                    >
                        <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-stone-grey mb-3">
                            <span>Loading</span>
                            <span className="tabular-nums text-charcoal-grey">
                                {String(Math.floor(progress)).padStart(3, '0')}
                            </span>
                        </div>
                        <div className="relative h-[1px] w-full bg-crown-black/10 overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-brushed-gold"
                                style={{ width: `${progress}%` }}
                                transition={{ ease: 'linear' }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
