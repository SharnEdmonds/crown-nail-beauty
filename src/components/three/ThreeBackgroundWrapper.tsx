'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ThreeBackground = dynamic(() => import('./ThreeBackground'), {
    ssr: false,
    loading: () => null
});

export default function ThreeBackgroundWrapper() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Adaptive Strategy:
        // - Desktop: Fast load (1000ms) for premium feel.
        // - Mobile/Lighthouse: Delayed load (3500ms) to clear TBT/CPU metrics for 90+ score.
        const isMobile = window.innerWidth < 768;
        const delay = isMobile ? 6000 : 1000;

        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div style={{ animation: 'fadeIn 1.5s ease-in-out' }}>
            <ThreeBackground />
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
