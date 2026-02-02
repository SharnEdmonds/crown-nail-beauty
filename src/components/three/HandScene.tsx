'use client';

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUIStore } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

export default function HandScene() {
    const setHandVisible = useUIStore((state) => state.setHandVisible);
    // using local draco decoder for speed
    const { scene } = useGLTF('/models/Hand-model-draco.glb', '/draco/');
    const handRef = useRef<Group>(null);
    const idleTime = useRef(0);

    // Apply a simple, performant material to ensure visibility
    const texturedScene = useMemo(() => {
        scene.traverse((child) => {
            if ((child as Mesh).isMesh) {
                const mesh = child as Mesh;
                // Switched to MeshStandardMaterial for max performance/visibility
                mesh.material = new MeshStandardMaterial({
                    color: 0xe8beac,
                    roughness: 0.7,
                    metalness: 0.1,
                });
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        return scene;
    }, [scene]);

    useLayoutEffect(() => {
        if (!handRef.current) return;

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
                    onLeave: () => {
                        if (handRef.current) handRef.current.visible = false;
                        setHandVisible(false);
                    },
                    onEnterBack: () => {
                        if (handRef.current) handRef.current.visible = true;
                        setHandVisible(true);
                    },
                },
            });

            // Use fromTo to strictly enforce the path regardless of current state
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

    // Subtle idle animation
    useFrame((_, delta) => {
        if (!handRef.current) return;
        idleTime.current += delta;
        handRef.current.rotation.z += Math.sin(idleTime.current * 0.5) * 0.0005;
    });

    return (
        <>
            <Environment files="/hdri/studio_small_03_1k.hdr" />
            <ambientLight intensity={0.8} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1.2}
                castShadow
            />
            {/* Secondary light - no shadow for performance */}
            <spotLight
                position={[-5, 5, -5]}
                angle={0.3}
                penumbra={0.5}
                intensity={0.5}
                color="#ffcdb2"
            />

            <primitive
                object={texturedScene}
                ref={handRef}
                scale={2.5}
                // Initial props will be overridden by GSAP/LayoutEffect but good defaults helps
                position={[2, -1, 0]}
                rotation={[0, -0.5, 0]}
            />
        </>
    );
}
