'use client';

import { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUIStore } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

export default function HandScene() {
    const setHandVisible = useUIStore((state) => state.setHandVisible);
    const { invalidate } = useThree();
    // using local draco decoder for speed
    const { scene } = useGLTF('/models/Hand-model-draco.glb', '/draco/');
    const handRef = useRef<THREE.Group>(null);
    const entranceRef = useRef<THREE.Group>(null);

    // Apply a simple, performant material to ensure visibility
    const texturedScene = useMemo(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // Switched to MeshStandardMaterial for max performance/visibility
                mesh.material = new THREE.MeshStandardMaterial({
                    color: 0xe8beac,
                    roughness: 0.7,
                    metalness: 0.1,
                });
            }
        });
        return scene;
    }, [scene]);

    useLayoutEffect(() => {
        if (!handRef.current || !entranceRef.current) return;

        // Force initial render
        invalidate();

        // Entrance Animation: Float up from bottom
        // gsap.from(entranceRef.current.position, {
        //     y: -5,
        //     duration: 1.8,
        //     ease: "power3.out",
        //     onUpdate: invalidate,
        // });

        const mm = gsap.matchMedia();

        mm.add({
            isDesktop: "(min-width: 768px)",
            isMobile: "(max-width: 767.98px)",
        }, (context) => {
            const { isMobile } = context.conditions as { isMobile: boolean };

            // Define precise Start and End states for both contexts
            const startConfig = isMobile
                ? { pos: { x: 0, y: -2, z: -2 }, rot: { x: 0, y: -0.5, z: 0 } }
                : { pos: { x: 2, y: -1, z: 0 }, rot: { x: 0, y: -0.5, z: 0 } };

            const endConfig = isMobile
                ? { pos: { x: 8, y: -2, z: -5 }, rot: { x: 0.2, y: Math.PI, z: -0.2 } }
                : { pos: { x: 18, y: -1, z: -5 }, rot: { x: 0.2, y: Math.PI, z: -0.2 } };

            // Ensure visibility is reset
            if (handRef.current) handRef.current.visible = true;

            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: '#hand-journey',
                    start: 'top top',
                    endTrigger: '#services',
                    end: 'top center',
                    scrub: 0.5,
                    invalidateOnRefresh: true,
                },
                onUpdate: invalidate,
            });

            timeline.fromTo(handRef.current!.rotation,
                { ...startConfig.rot },
                { ...endConfig.rot, duration: 1, ease: 'power1.inOut' },
                0
            );

            timeline.fromTo(handRef.current!.position,
                { ...startConfig.pos },
                { ...endConfig.pos, duration: 1, ease: 'power2.in' },
                0
            );
        });

        return () => mm.revert();
    }, []);

    useEffect(() => {
        // Safety kick: Force multiple frames on mount to ensure the model renders 
        // even if the animation timeline has a hiccup or demand loop sleeps too early.
        let count = 0;
        const interval = setInterval(() => {
            invalidate();
            count++;
            if (count > 20) clearInterval(interval);
        }, 50); // Fast ticks
        return () => clearInterval(interval);
    }, [invalidate]);

    return (
        <>
            <ambientLight intensity={0.8} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1.2}
            />
            {/* Secondary light - no shadow for performance */}
            <spotLight
                position={[-5, 5, -5]}
                angle={0.3}
                penumbra={0.5}
                intensity={0.5}
                color="#ffcdb2"
            />

            <group ref={entranceRef}>
                <primitive
                    object={texturedScene}
                    ref={handRef}
                    scale={2.5}
                    // Initial props will be overridden by GSAP/LayoutEffect but good defaults helps
                    position={[2, -1, 0]}
                    rotation={[0, -0.5, 0]}
                />
            </group>
        </>
    );
}
