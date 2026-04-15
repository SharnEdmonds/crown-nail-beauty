'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { HandModelConfig } from '@/lib/types';

const ThreeBackground = dynamic(() => import('./ThreeBackground'), {
    ssr: false,
    loading: () => null
});

interface ThreeBackgroundWrapperProps {
    handModel: HandModelConfig | null;
}

export default function ThreeBackgroundWrapper({ handModel }: ThreeBackgroundWrapperProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const delay = isMobile ? 6000 : 1000;

        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div style={{ animation: 'fadeIn 1.5s ease-in-out' }}>
            <ThreeBackground handModel={handModel} />
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
