'use client';

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HandScene() {
    const { scene } = useGLTF('/models/Hand-model.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const handRef = useRef<THREE.Group>(null);
    const idleTime = useRef(0);

    // Apply a realistic skin-tone material with texture-like quality
    const texturedScene = useMemo(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color(0xe8beac),
                    roughness: 0.6,
                    metalness: 0.02,
                    clearcoat: 0.3,
                    clearcoatRoughness: 0.4,
                    sheen: 0.5,
                    sheenRoughness: 0.6,
                    sheenColor: new THREE.Color(0xffcdb2),
                    // Removed expensive transmission/ior for performance
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
            <ambientLight intensity={0.6} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1.2}
                castShadow
            />
            <spotLight
                position={[-5, 5, -5]}
                angle={0.3}
                penumbra={0.5}
                intensity={0.4}
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

useGLTF.preload('/models/Hand-model.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
