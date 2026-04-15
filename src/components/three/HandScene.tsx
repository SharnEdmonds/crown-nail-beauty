'use client';

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { Group, Mesh, MeshStandardMaterial, Color } from 'three';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUIStore } from '@/lib/store';
import type { HandModelConfig, Vec3 } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS = {
    idleRotationSpeed: 0.15,
    idleWobbleAmount: 0.02,
    idleWobbleSpeed: 0.25,
    scale: 2.5,
    color: '#e8beac',
    roughness: 0.7,
    metalness: 0.1,
    desktopStartPosition: { x: 2, y: -1, z: 0 },
    desktopStartRotation: { x: 0, y: -0.5, z: 0 },
    desktopEndPosition: { x: 9, y: -1, z: -4 },
    desktopEndRotation: { x: 0.1, y: Math.PI * 0.5, z: -0.1 },
    mobileStartPosition: { x: 0, y: -1.2, z: -1 },
    mobileStartRotation: { x: 0, y: -0.3, z: 0 },
    mobileEndPosition: { x: 0, y: -1.2, z: -2 },
    mobileEndRotation: { x: 0.1, y: Math.PI * 0.4, z: -0.1 },
};

function pick<T>(val: T | undefined | null, fallback: T): T {
    return val === undefined || val === null ? fallback : val;
}

function pickVec(val: Vec3 | undefined | null, fallback: Vec3): Vec3 {
    if (!val) return fallback;
    return {
        x: pick(val.x, fallback.x),
        y: pick(val.y, fallback.y),
        z: pick(val.z, fallback.z),
    };
}

interface HandSceneProps {
    config: HandModelConfig | null;
}

export default function HandScene({ config }: HandSceneProps) {
    const setHandVisible = useUIStore((state) => state.setHandVisible);
    const { scene } = useGLTF('/models/Hand-model-draco.glb', '/draco/');
    const handRef = useRef<Group>(null);
    const idleTime = useRef(0);

    const cfg = useMemo(() => {
        const c = config ?? {};
        return {
            idleRotationSpeed: pick(c.idleRotationSpeed, DEFAULTS.idleRotationSpeed),
            idleWobbleAmount: pick(c.idleWobbleAmount, DEFAULTS.idleWobbleAmount),
            idleWobbleSpeed: pick(c.idleWobbleSpeed, DEFAULTS.idleWobbleSpeed),
            scale: pick(c.scale, DEFAULTS.scale),
            color: pick(c.color, DEFAULTS.color),
            roughness: pick(c.roughness, DEFAULTS.roughness),
            metalness: pick(c.metalness, DEFAULTS.metalness),
            desktopStartPosition: pickVec(c.desktopStartPosition, DEFAULTS.desktopStartPosition),
            desktopStartRotation: pickVec(c.desktopStartRotation, DEFAULTS.desktopStartRotation),
            desktopEndPosition: pickVec(c.desktopEndPosition, DEFAULTS.desktopEndPosition),
            desktopEndRotation: pickVec(c.desktopEndRotation, DEFAULTS.desktopEndRotation),
            mobileStartPosition: pickVec(c.mobileStartPosition, DEFAULTS.mobileStartPosition),
            mobileStartRotation: pickVec(c.mobileStartRotation, DEFAULTS.mobileStartRotation),
            mobileEndPosition: pickVec(c.mobileEndPosition, DEFAULTS.mobileEndPosition),
            mobileEndRotation: pickVec(c.mobileEndRotation, DEFAULTS.mobileEndRotation),
        };
    }, [config]);

    const texturedScene = useMemo(() => {
        scene.traverse((child) => {
            if ((child as Mesh).isMesh) {
                const mesh = child as Mesh;
                mesh.material = new MeshStandardMaterial({
                    color: new Color(cfg.color),
                    roughness: cfg.roughness,
                    metalness: cfg.metalness,
                });
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        return scene;
    }, [scene, cfg.color, cfg.roughness, cfg.metalness]);

    useLayoutEffect(() => {
        if (!handRef.current) return;

        const mm = gsap.matchMedia();

        mm.add({
            isDesktop: '(min-width: 1024px)',
            isMobile: '(max-width: 1023.98px)',
        }, (context) => {
            const { isMobile } = context.conditions as { isMobile: boolean };

            const startConfig = isMobile
                ? { pos: cfg.mobileStartPosition, rot: cfg.mobileStartRotation }
                : { pos: cfg.desktopStartPosition, rot: cfg.desktopStartRotation };

            const endConfig = isMobile
                ? { pos: cfg.mobileEndPosition, rot: cfg.mobileEndRotation }
                : { pos: cfg.desktopEndPosition, rot: cfg.desktopEndRotation };

            if (handRef.current) handRef.current.visible = true;

            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: '#hand-journey',
                    start: 'top top',
                    endTrigger: '#gallery',
                    end: 'top center',
                    scrub: 1.5,
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

            timeline.fromTo(
                handRef.current!.rotation,
                { ...startConfig.rot },
                { ...endConfig.rot, duration: 1, ease: 'sine.inOut' },
                0
            );

            timeline.fromTo(
                handRef.current!.position,
                { ...startConfig.pos },
                { ...endConfig.pos, duration: 1, ease: 'sine.inOut' },
                0
            );
        });

        return () => mm.revert();
    }, [cfg, setHandVisible]);

    useFrame((state, delta) => {
        if (!handRef.current) return;
        idleTime.current += delta;
        handRef.current.rotation.y += delta * cfg.idleRotationSpeed;
        handRef.current.rotation.z = Math.sin(idleTime.current * cfg.idleWobbleSpeed) * cfg.idleWobbleAmount;

        // Safety clamp: keep the hand inside the viewport horizontally.
        // Compute visible half-width at the hand's z-depth and clamp x accordingly.
        const camera = state.camera as THREE.PerspectiveCamera;
        if ('fov' in camera) {
            const dist = camera.position.z - handRef.current.position.z;
            const vFov = (camera.fov * Math.PI) / 180;
            const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
            const visibleWidth = visibleHeight * camera.aspect;
            const halfW = visibleWidth / 2;
            // Account for the model's apparent half-width (rough estimate from scale).
            const modelHalf = cfg.scale * 0.6;
            const maxX = Math.max(0, halfW - modelHalf);
            if (handRef.current.position.x > maxX) handRef.current.position.x = maxX;
            if (handRef.current.position.x < -maxX) handRef.current.position.x = -maxX;
        }
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
                scale={cfg.scale}
                position={[cfg.desktopStartPosition.x, cfg.desktopStartPosition.y, cfg.desktopStartPosition.z]}
                rotation={[cfg.desktopStartRotation.x, cfg.desktopStartRotation.y, cfg.desktopStartRotation.z]}
            />
        </>
    );
}
