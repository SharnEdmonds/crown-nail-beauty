'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const ThreeBackground = dynamic(() => import('./ThreeBackground'), {
    ssr: false,
    loading: () => null // Optional: Add a localized loader or null here since it's background
});

export default function ThreeBackgroundWrapper() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (!isReady) return null;

    return <ThreeBackground />;
}
