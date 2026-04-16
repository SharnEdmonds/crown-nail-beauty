'use client';

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
