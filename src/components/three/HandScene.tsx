'use client';

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HandScene() {
    const { scene } = useGLTF('/models/Hand-model-draco.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const handRef = useRef<THREE.Group>(null);
    const idleTime = useRef(0);
    // ... existing code ...
    return (
        <>
// ... existing code ...
        </>
    );
}

useGLTF.preload('/models/Hand-model-draco.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
