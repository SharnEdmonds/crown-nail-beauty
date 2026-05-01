'use client';

import { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { Group } from 'three';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUIStore } from '@/lib/store';
import type { HandModelConfig, Vec3 } from '@/lib/types';
import HandModel from './HandModel';
import { DEFAULT_NAIL_DESIGN } from './handNailConfig';
import type { NailDesignSpec } from './nailDesigns';

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS = {
    idleRotationSpeed: 0.15,
    idleWobbleAmount: 0.02,
    idleWobbleSpeed: 0.25,
    scale: 2.5,
    // Natural warm skin tone. Skin is never metallic (metalness must be 0)
    // and sits around 0.85 roughness with a faint oil sheen on top.
    color: '#e8b89e',
    roughness: 0.85,
    metalness: 0.0,
    nailColor: '#d4a5a5',
    nailRoughness: 0.08,
    nailMetalness: 0.2,
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
    const setModelReady = useUIStore((state) => state.setModelReady);
    const gltf = useGLTF('/models/Hand-model-draco.glb', '/draco/');

    useEffect(() => {
        if (gltf?.scene) setModelReady(true);
    }, [gltf, setModelReady]);
    const handRef = useRef<Group>(null);
    // Base rotation driven by the GSAP scroll timeline. useFrame composes
    // mouse-parallax offsets on top of this so scroll and parallax don't fight.
    const baseRotation = useRef({ x: 0, y: 0, z: 0 });
    const pointerTarget = useRef({ x: 0, y: 0 });
    const pointerCurrent = useRef({ x: 0, y: 0 });

    // Track pointer position normalized to [-1, 1] across the viewport.
    // Touch devices report (hover: none) / (pointer: coarse) — on those, mouse
    // parallax is meaningless and only causes jitter on tap, so we skip the
    // listener entirely. pointerCurrent stays at (0,0) → parallaxY = 0 in
    // useFrame, so the hand sits in its scroll-only baseline pose on mobile.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!supportsHover) return;

        const onPointerMove = (e: PointerEvent) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            pointerTarget.current.x = nx;
            pointerTarget.current.y = ny;
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        return () => window.removeEventListener('pointermove', onPointerMove);
    }, []);

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
            nailColor: pick(c.nailColor, DEFAULTS.nailColor),
            nailRoughness: pick(c.nailRoughness, DEFAULTS.nailRoughness),
            nailMetalness: pick(c.nailMetalness, DEFAULTS.nailMetalness),
            nailThumbColor: c.nailThumbColor ?? undefined,
            nailIndexColor: c.nailIndexColor ?? undefined,
            nailMiddleColor: c.nailMiddleColor ?? undefined,
            nailRingColor: c.nailRingColor ?? undefined,
            nailPinkyColor: c.nailPinkyColor ?? undefined,
            desktopStartPosition: pickVec(c.desktopStartPosition, DEFAULTS.desktopStartPosition),
            desktopStartRotation: pickVec(c.desktopStartRotation, DEFAULTS.desktopStartRotation),
            desktopEndPosition: pickVec(c.desktopEndPosition, DEFAULTS.desktopEndPosition),
            desktopEndRotation: pickVec(c.desktopEndRotation, DEFAULTS.desktopEndRotation),
            mobileStartPosition: pickVec(c.mobileStartPosition, DEFAULTS.mobileStartPosition),
            mobileStartRotation: pickVec(c.mobileStartRotation, DEFAULTS.mobileStartRotation),
            mobileEndPosition: pickVec(c.mobileEndPosition, DEFAULTS.mobileEndPosition),
            mobileEndRotation: pickVec(c.mobileEndRotation, DEFAULTS.mobileEndRotation),
            nailTipColor: c.nailTipColor,
        };
    }, [config]);

    // Build the nail design spec live from Sanity. If only the base color is
    // overridden, the default tip color still applies — and vice versa — so
    // partial CMS edits never produce a broken-looking nail.
    const nailDesign = useMemo<NailDesignSpec>(() => {
        const fallback = DEFAULT_NAIL_DESIGN as Extract<NailDesignSpec, { type: 'naturalManicure' }>;
        return {
            type: 'naturalManicure',
            baseColor: cfg.nailColor,
            tipColor: cfg.nailTipColor ?? fallback.tipColor,
            tipStart: fallback.tipStart,
        };
    }, [cfg.nailColor, cfg.nailTipColor]);

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

            // Seed base rotation AND group position so the first frame after a
            // breakpoint change doesn't snap. Without seeding position, GSAP's
            // fromTo starts from wherever the group sat last (e.g. mobile pose
            // when the user resized back to desktop), which kept the hand
            // visually stuck in the wrong place.
            baseRotation.current.x = startConfig.rot.x;
            baseRotation.current.y = startConfig.rot.y;
            baseRotation.current.z = startConfig.rot.z;
            handRef.current!.position.set(startConfig.pos.x, startConfig.pos.y, startConfig.pos.z);

            timeline.fromTo(
                baseRotation.current,
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

        // RAF-coalesced refresh on resize: trigger ScrollTrigger to re-read
        // viewport dimensions and re-evaluate fromTo values (invalidateOnRefresh
        // is already true on the timeline). Single-flight via rafId so a drag-
        // resize doesn't fire 60×/sec.
        let rafId = 0;
        const onResize = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = 0;
                ScrollTrigger.refresh();
            });
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            if (rafId) cancelAnimationFrame(rafId);
            mm.revert();
        };
    }, [cfg, setHandVisible]);

    useFrame((state, delta) => {
        if (!handRef.current) return;

        // Damped interpolation of the pointer target so motion feels smooth.
        const ease = Math.min(1, delta * 6);
        pointerCurrent.current.x += (pointerTarget.current.x - pointerCurrent.current.x) * ease;
        pointerCurrent.current.y += (pointerTarget.current.y - pointerCurrent.current.y) * ease;

        // Horizontal-only parallax: mouse X rotates the hand around its Y axis.
        // idleRotationSpeed controls overall mouse-rotation magnitude; a full
        // viewport swing rotates the hand ~0.5 rad (~28°) at the default value.
        const strength = 0.5 * Math.max(0.1, cfg.idleRotationSpeed / 0.15);
        const parallaxY = pointerCurrent.current.x * strength;

        // Compose: GSAP-driven base rotation + horizontal mouse parallax on Y only.
        handRef.current.rotation.x = baseRotation.current.x;
        handRef.current.rotation.y = baseRotation.current.y + parallaxY;
        handRef.current.rotation.z = baseRotation.current.z;

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
            {/*
              * Lighting balance tuned for the nail art to show volume:
              *   • HDRI does most of the reflective work (clearcoat highlights).
              *   • Ambient kept low so normal-mapped details self-shade properly.
              *   • One sharp key spot to carve contour, one warm fill to keep
              *     the skin from looking clinical.
              */}
            <Environment files="/hdri/studio_small_03_1k.hdr" />
            <ambientLight intensity={0.35} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.2}
                penumbra={0.8}
                intensity={1.8}
                castShadow
            />
            <spotLight
                position={[-5, 5, -5]}
                angle={0.4}
                penumbra={0.6}
                intensity={0.6}
                color="#ffcdb2"
            />
            {/* Subtle rim from behind to pop the nail silhouette against the bg. */}
            <directionalLight position={[0, 4, -8]} intensity={0.4} color="#ffe4d1" />

            <HandModel
                ref={handRef}
                color={cfg.color}
                roughness={cfg.roughness}
                metalness={cfg.metalness}
                nailRoughness={cfg.nailRoughness}
                nailMetalness={cfg.nailMetalness}
                nailDesign={nailDesign}
                scale={cfg.scale}
                position={[cfg.desktopStartPosition.x, cfg.desktopStartPosition.y, cfg.desktopStartPosition.z]}
                rotation={[cfg.desktopStartRotation.x, cfg.desktopStartRotation.y, cfg.desktopStartRotation.z]}
            />
        </>
    );
}
