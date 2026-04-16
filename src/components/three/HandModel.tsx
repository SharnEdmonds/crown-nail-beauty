/*
Generated with gltfjsx (npx gltfjsx@6.5.3 public/models/Hand-model-draco.glb)
Nails use runtime-generated planar UVs + canvas design textures so any 2D
design (french tip, swirl, marble, glitter, custom PNG) can be applied live.
Mesh map: Mesh_0_1 = skin, Mesh_0_2..6 = nails (Thumb, Index, Middle, Ring, Pinky).
*/

import { forwardRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import { generateNailUVs } from './nailUVs';
import { renderNailDesign, disposeNailTextureSet, type NailDesignSpec, type NailTextureSet } from './nailDesigns';

type GLTFResult = GLTF & {
    nodes: {
        Mesh_0_1: THREE.Mesh;
        Mesh_0_2: THREE.Mesh;
        Mesh_0_3: THREE.Mesh;
        Mesh_0_4: THREE.Mesh;
        Mesh_0_5: THREE.Mesh;
        Mesh_0_6: THREE.Mesh;
    };
};

type HandModelProps = ThreeElements['group'] & {
    color: string;
    roughness: number;
    metalness: number;
    nailRoughness: number;
    nailMetalness: number;
    nailDesign: NailDesignSpec;
    nailThumbDesign?: NailDesignSpec;
    nailIndexDesign?: NailDesignSpec;
    nailMiddleDesign?: NailDesignSpec;
    nailRingDesign?: NailDesignSpec;
    nailPinkyDesign?: NailDesignSpec;
};

/**
 * Push every vertex of a nail geometry outward along its normal by a tiny
 * amount. This prevents z-fighting against the finger mesh at the nail base
 * and also visually lifts the nail slightly so the silhouette boundary reads
 * as a raised edge instead of a coplanar seam.
 *
 * Safe to call multiple times — we track application via a flag in userData
 * so the second call becomes a no-op.
 */
function offsetNailGeometry(geometry: THREE.BufferGeometry, distance = 0.003): void {
    if (geometry.userData.__nailOffsetApplied) return;
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const normal = geometry.getAttribute('normal') as THREE.BufferAttribute | undefined;
    if (!normal) {
        geometry.computeVertexNormals();
    }
    const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
    const count = position.count;
    for (let i = 0; i < count; i++) {
        position.setXYZ(
            i,
            position.getX(i) + normals.getX(i) * distance,
            position.getY(i) + normals.getY(i) * distance,
            position.getZ(i) + normals.getZ(i) * distance,
        );
    }
    position.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.userData.__nailOffsetApplied = true;
}

/**
 * Tune the filtering of every texture in a set so nail art stays crisp at
 * grazing angles (where the nail curves away from the camera) and aliases
 * less at distance. Call once per set before it's passed to a material.
 */
function tuneNailTextures(set: NailTextureSet): void {
    const apply = (t: THREE.Texture | undefined) => {
        if (!t) return;
        t.anisotropy = 16;
        t.minFilter = THREE.LinearMipMapLinearFilter; // trilinear
        t.magFilter = THREE.LinearFilter;
        t.generateMipmaps = true;
        t.needsUpdate = true;
    };
    apply(set.baseColor);
    apply(set.normal);
    apply(set.roughness);
    apply(set.metalness);
    apply(set.ao);
    apply(set.emissive);
}

/**
 * Builds a glossy manicured nail material from a NailTextureSet. Optional PBR
 * map slots (normal/roughness/metalness/ao/emissive) are wired in when the set
 * provides them; otherwise the material's scalar defaults apply.
 *
 * Volume-enhancing choices worth knowing about:
 *   • Normal scale is tuned so raised details read as sculpted, not spiky.
 *   • The normal map is reused as the clearcoatNormalMap so the gel top coat
 *     ripples with the art — this is the biggest contributor to "real volume".
 *   • envMapIntensity is pushed past 1 to let the HDRI show up in highlights.
 *   • Clearcoat roughness is very low (0.02) so reflections are mirror-sharp.
 */
function makeNailMaterial(
    set: NailTextureSet,
    roughness: number,
    metalness: number,
): THREE.MeshPhysicalMaterial {
    tuneNailTextures(set);

    const material = new THREE.MeshPhysicalMaterial({
        map: set.baseColor,
        color: set.tint ? set.tint.clone() : new THREE.Color('#ffffff'),
        roughness,
        metalness,
        // Gel top coat: soft highlights, not mirror-sharp. Reads as polish,
        // not wet glass — the subtler look we're aiming for.
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        reflectivity: 0.55,
        ior: 1.5,
        // Sheen and iridescence both pulled back — they were carrying the
        // textured design, but on a solid color they add noise.
        sheen: 0.15,
        sheenRoughness: 0.35,
        sheenColor: new THREE.Color('#fff1e6'),
        iridescence: 0,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [100, 400],
        envMapIntensity: 1.1,
    });

    if (set.normal) {
        material.normalMap = set.normal;
        // 0.85 reads as sculpted art; anything above 1.2 starts looking spiky.
        material.normalScale = new THREE.Vector2(0.85, 0.85);

        // Reuse the same normal map for the clearcoat so reflections ripple
        // over the raised details — this is what sells "glass over paint"
        // instead of "smooth sticker on top of matte art".
        material.clearcoatNormalMap = set.normal;
        material.clearcoatNormalScale = new THREE.Vector2(0.35, 0.35);
    }
    if (set.roughness) material.roughnessMap = set.roughness;
    if (set.metalness) material.metalnessMap = set.metalness;
    if (set.ao) {
        material.aoMap = set.ao;
        material.aoMapIntensity = 1;
    }
    if (set.emissive) {
        material.emissiveMap = set.emissive;
        material.emissive = new THREE.Color('#ffffff');
    }

    return material;
}

const HandModel = forwardRef<THREE.Group, HandModelProps>(function HandModel(
    {
        color,
        roughness,
        metalness,
        nailRoughness,
        nailMetalness,
        nailDesign,
        nailThumbDesign,
        nailIndexDesign,
        nailMiddleDesign,
        nailRingDesign,
        nailPinkyDesign,
        ...groupProps
    },
    ref,
) {
    const { nodes } = useGLTF('/models/Hand-model-draco.glb', '/draco/') as unknown as GLTFResult;

    // One-time: inject planar UVs onto every nail geometry so textures map
    // correctly, and push vertices outward to prevent z-fighting with the
    // finger. useMemo with geometry deps runs this only when the GLB (re)loads.
    useMemo(() => {
        offsetNailGeometry(nodes.Mesh_0_2.geometry);
        offsetNailGeometry(nodes.Mesh_0_3.geometry);
        offsetNailGeometry(nodes.Mesh_0_4.geometry);
        offsetNailGeometry(nodes.Mesh_0_5.geometry);
        offsetNailGeometry(nodes.Mesh_0_6.geometry);
        generateNailUVs(nodes.Mesh_0_2.geometry);
        generateNailUVs(nodes.Mesh_0_3.geometry);
        generateNailUVs(nodes.Mesh_0_4.geometry);
        generateNailUVs(nodes.Mesh_0_5.geometry);
        generateNailUVs(nodes.Mesh_0_6.geometry);
    }, [
        nodes.Mesh_0_2.geometry,
        nodes.Mesh_0_3.geometry,
        nodes.Mesh_0_4.geometry,
        nodes.Mesh_0_5.geometry,
        nodes.Mesh_0_6.geometry,
    ]);

    const skinMaterial = useMemo(() => {
        const mat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color),
            roughness,
            metalness,
            // Warm sheen approximates the soft backlit glow real skin has
            // at grazing angles — a cheap stand-in for subsurface scattering.
            sheen: 0.35,
            sheenRoughness: 0.7,
            sheenColor: new THREE.Color('#ffcbb0'),
            // Very faint clearcoat gives skin its natural oil highlight
            // without making it look plastic or waxy.
            clearcoat: 0.15,
            clearcoatRoughness: 0.55,
            envMapIntensity: 0.9,
        });
        return mat;
    }, [color, roughness, metalness]);

    // Build texture sets from design specs. Each finger falls back to the shared nailDesign.
    const thumbSet = useMemo(() => renderNailDesign(nailThumbDesign ?? nailDesign), [nailThumbDesign, nailDesign]);
    const indexSet = useMemo(() => renderNailDesign(nailIndexDesign ?? nailDesign), [nailIndexDesign, nailDesign]);
    const middleSet = useMemo(() => renderNailDesign(nailMiddleDesign ?? nailDesign), [nailMiddleDesign, nailDesign]);
    const ringSet = useMemo(() => renderNailDesign(nailRingDesign ?? nailDesign), [nailRingDesign, nailDesign]);
    const pinkySet = useMemo(() => renderNailDesign(nailPinkyDesign ?? nailDesign), [nailPinkyDesign, nailDesign]);

    const thumbMaterial = useMemo(() => makeNailMaterial(thumbSet, nailRoughness, nailMetalness), [thumbSet, nailRoughness, nailMetalness]);
    const indexMaterial = useMemo(() => makeNailMaterial(indexSet, nailRoughness, nailMetalness), [indexSet, nailRoughness, nailMetalness]);
    const middleMaterial = useMemo(() => makeNailMaterial(middleSet, nailRoughness, nailMetalness), [middleSet, nailRoughness, nailMetalness]);
    const ringMaterial = useMemo(() => makeNailMaterial(ringSet, nailRoughness, nailMetalness), [ringSet, nailRoughness, nailMetalness]);
    const pinkyMaterial = useMemo(() => makeNailMaterial(pinkySet, nailRoughness, nailMetalness), [pinkySet, nailRoughness, nailMetalness]);

    useEffect(() => {
        return () => {
            skinMaterial.dispose();
            disposeNailTextureSet(thumbSet);
            disposeNailTextureSet(indexSet);
            disposeNailTextureSet(middleSet);
            disposeNailTextureSet(ringSet);
            disposeNailTextureSet(pinkySet);
            thumbMaterial.dispose();
            indexMaterial.dispose();
            middleMaterial.dispose();
            ringMaterial.dispose();
            pinkyMaterial.dispose();
        };
    }, [
        skinMaterial,
        thumbSet,
        indexSet,
        middleSet,
        ringSet,
        pinkySet,
        thumbMaterial,
        indexMaterial,
        middleMaterial,
        ringMaterial,
        pinkyMaterial,
    ]);

    return (
        <group ref={ref} {...groupProps} dispose={null}>
            <mesh geometry={nodes.Mesh_0_1.geometry} material={skinMaterial} castShadow receiveShadow />
            <mesh geometry={nodes.Mesh_0_2.geometry} material={thumbMaterial} castShadow receiveShadow />
            <mesh geometry={nodes.Mesh_0_3.geometry} material={indexMaterial} castShadow receiveShadow />
            <mesh geometry={nodes.Mesh_0_4.geometry} material={middleMaterial} castShadow receiveShadow />
            <mesh geometry={nodes.Mesh_0_5.geometry} material={ringMaterial} castShadow receiveShadow />
            <mesh geometry={nodes.Mesh_0_6.geometry} material={pinkyMaterial} castShadow receiveShadow />
        </group>
    );
});

export default HandModel;

useGLTF.preload('/models/Hand-model-draco.glb', '/draco/');
