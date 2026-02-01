'use client';

import { useUIStore } from '@/lib/store';

import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import HandScene from '@/components/three/HandScene';
import ThreeErrorBoundary from '@/components/three/ThreeErrorBoundary';
import { Suspense } from 'react';

export default function ThreeBackground() {
    const isHandVisible = useUIStore((state) => state.isHandVisible);

    return (
        <ThreeErrorBoundary>
            <div
                className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-700 ease-in-out ${isHandVisible ? 'opacity-100' : 'opacity-0 hidden'}`}
            >
                <Canvas
                    dpr={[1, 1]}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{ alpha: true, antialias: true }}
                >
                    <Suspense fallback={null}>
                        <HandScene />
                    </Suspense>
                </Canvas>
                <Loader
                    containerStyles={{ backgroundColor: 'transparent' }}
                    innerStyles={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', width: '200px' }}
                    barStyles={{ backgroundColor: '#C9A962' }} // Brushed gold
                    dataStyles={{ color: '#2C2C2C', fontSize: '12px' }}
                />
            </div>
        </ThreeErrorBoundary>
    );
}
