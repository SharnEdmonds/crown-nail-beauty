'use client';

import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { RefObject } from 'react';

interface UseScrollProgressOptions {
    target: RefObject<HTMLElement | null>;
    offset?: ["start end" | "end start" | "start start" | "end end", "start end" | "end start" | "start start" | "end end"];
}

export function useScrollProgress({ target, offset = ['start end', 'end start'] }: UseScrollProgressOptions): {
    scrollYProgress: MotionValue<number>;
    y: MotionValue<number>;
    opacity: MotionValue<number>;
} {
    const { scrollYProgress } = useScroll({
        target,
        offset,
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return { scrollYProgress, y, opacity };
}
