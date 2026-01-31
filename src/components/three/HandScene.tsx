'use client';

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HandScene() {
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

        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: '#hand-journey',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.5,
            },
        });

        // Visible on load, rotation starts at 0px scroll
        handRef.current.position.set(2, -1, 0);
        handRef.current.rotation.set(0, -0.5, 0);

        // Rotate and drift off-screen during hero scroll (position 0 → 1)
        // By position 1 (start of Services), the hand is fully gone
        timeline.to(handRef.current.rotation, {
            y: Math.PI * 1.5,
            x: 0.3,
            z: 0.2,
            duration: 1,
            ease: 'power1.inOut',
        }, 0);

        timeline.to(handRef.current.position, {
            x: -8,
            y: 3,
            z: -4,
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
