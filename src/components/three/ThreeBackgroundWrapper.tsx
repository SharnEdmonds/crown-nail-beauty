'use client';

import dynamic from 'next/dynamic';

const ThreeBackground = dynamic(() => import('./ThreeBackground'), {
    ssr: false,
    loading: () => null // Optional: Add a localized loader or null here since it's background
});

export default function ThreeBackgroundWrapper() {
    return <ThreeBackground />;
}
