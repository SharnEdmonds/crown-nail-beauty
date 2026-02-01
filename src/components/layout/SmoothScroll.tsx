'use client';

import { ReactNode, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useUIStore } from '@/lib/store';

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const isScrollLocked = useUIStore((state) => state.isScrollLocked);
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!lenisRef.current) return;
        if (isScrollLocked) {
            lenisRef.current.stop();
        } else {
            lenisRef.current.start();
        }
    }, [isScrollLocked]);

    return <>{children}</>;
}
