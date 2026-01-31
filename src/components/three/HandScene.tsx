'use client';

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUIStore } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

export default function HandScene() {
    const setHandVisible = useUIStore((state) => state.setHandVisible);
    // using local draco decoder for speed
    const { scene } = useGLTF('/models/Hand-model-draco.glb', '/draco/');
    const handRef = useRef<THREE.Group>(null);
    const idleTime = useRef(0);

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
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        return scene;
    }, [scene]);

    useLayoutEffect(() => {
        if (!handRef.current) return;

        // Force refresh to ensure DOM elements are found after lazy load
        ScrollTrigger.refresh();

        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: '#hand-journey',
                start: 'top top',
                endTrigger: '#services',
                end: 'top center',
                scrub: 1,
                onLeave: () => {
                    if (handRef.current) handRef.current.visible = false;
                    setHandVisible(false); // Disable frameloop
                },
                onEnterBack: () => {
                    if (handRef.current) handRef.current.visible = true;
                    setHandVisible(true); // Enable frameloop
                },
            },
        });

        // Visible on load, rotation starts at 0px scroll
        handRef.current.position.set(2, -1, 0);
        handRef.current.rotation.set(0, -0.5, 0);

        // Ensure visible initially in case of reload
        handRef.current.visible = true;

        // Rotate and drift off-screen to the RIGHT
        timeline.to(handRef.current.rotation, {
            y: Math.PI, // Full rotation
            x: 0.2, // Slight tilt
            z: -0.2,
            duration: 1,
            ease: 'power1.inOut',
        }, 0);

        timeline.to(handRef.current.position, {
            x: 18,  // Move further RIGHT to ensure it clears screen quickly
            y: -1,  // Keep height constant (no UP movement)
            z: -5,
            duration: 1,
            ease: 'power2.in',
        }, 0);

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    // Subtle idle animation
    useFrame((_, delta) => {
        if (!handRef.current) return;
        idleTime.current += delta;

        // Idle animation
        handRef.current.rotation.z += Math.sin(idleTime.current * 0.5) * 0.0005;
    });

    return (
        <>
            <Environment preset="studio" />
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
                position={[2, -1, 0]}
                rotation={[0, -0.5, 0]}
            />
        </>
    );
}

useGLTF.preload('/models/Hand-model-draco.glb', '/draco/');
