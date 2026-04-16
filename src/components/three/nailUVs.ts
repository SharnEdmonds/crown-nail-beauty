/*
 * Runtime planar UV generation for nail meshes.
 *
 * The GLB nail meshes don't ship with useful UVs, and their vertex positions
 * are in HAND-space, not nail-local space. That means a naive axis-aligned
 * bounding box picks the wrong axes (hand-space X/Y/Z) rather than the nail's
 * actual cuticle→tip / side→side axes.
 *
 * The fix: for each nail, we compute its centroid, center the vertices, then
 * run PCA (principal component analysis) on the covariance matrix to find
 * the three orthogonal axes that actually describe the nail's shape. The
 * largest eigenvector is cuticle→tip, the second is side→side, the third is
 * the thickness normal. We project positions into that PCA frame and
 * normalize to [0,1] as UVs.
 *
 * Result: U runs cuticle→tip and V runs side-to-side regardless of how the
 * nail is rotated in hand-space. Every nail gets the same projection in its
 * own natural frame, so a texture authored with "cuticle on the left, tip on
 * the right" lands correctly on all five fingers.
 */

import * as THREE from 'three';

type Mat3 = [number, number, number, number, number, number, number, number, number];

/**
 * Compute the 3×3 covariance matrix of a set of 3D points (already centered).
 * Returned in row-major order.
 */
function covariance(points: Float32Array, count: number): Mat3 {
    let xx = 0, yy = 0, zz = 0, xy = 0, xz = 0, yz = 0;
    for (let i = 0; i < count; i++) {
        const x = points[i * 3];
        const y = points[i * 3 + 1];
        const z = points[i * 3 + 2];
        xx += x * x;
        yy += y * y;
        zz += z * z;
        xy += x * y;
        xz += x * z;
        yz += y * z;
    }
    const inv = 1 / Math.max(count, 1);
    return [
        xx * inv, xy * inv, xz * inv,
        xy * inv, yy * inv, yz * inv,
        xz * inv, yz * inv, zz * inv,
    ];
}

/**
 * Jacobi eigen-decomposition of a symmetric 3×3 matrix. Returns eigenvalues
 * (sorted descending) and the corresponding eigenvectors as column-major 3×3.
 *
 * The iterative Jacobi method is overkill for 3×3 but it's correct,
 * numerically stable for the small cases we hit here, and avoids pulling in
 * a linear-algebra dep for ~80 lines of math.
 */
function jacobiEigen(m: Mat3): { values: [number, number, number]; vectors: Mat3 } {
    const a: number[][] = [
        [m[0], m[1], m[2]],
        [m[3], m[4], m[5]],
        [m[6], m[7], m[8]],
    ];
    const v: number[][] = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
    ];

    for (let sweep = 0; sweep < 32; sweep++) {
        // Off-diagonal magnitude — if tiny, we're converged.
        const off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]);
        if (off < 1e-10) break;

        for (let p = 0; p < 2; p++) {
            for (let q = p + 1; q < 3; q++) {
                const apq = a[p][q];
                if (Math.abs(apq) < 1e-12) continue;

                const app = a[p][p];
                const aqq = a[q][q];
                const theta = (aqq - app) / (2 * apq);
                let t: number;
                if (Math.abs(theta) > 1e12) {
                    t = 1 / (2 * theta);
                } else {
                    t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
                    if (theta === 0) t = 1;
                }
                const c = 1 / Math.sqrt(t * t + 1);
                const s = t * c;

                a[p][p] = app - t * apq;
                a[q][q] = aqq + t * apq;
                a[p][q] = 0;
                a[q][p] = 0;

                for (let r = 0; r < 3; r++) {
                    if (r !== p && r !== q) {
                        const arp = a[r][p];
                        const arq = a[r][q];
                        a[r][p] = c * arp - s * arq;
                        a[p][r] = a[r][p];
                        a[r][q] = s * arp + c * arq;
                        a[q][r] = a[r][q];
                    }
                    const vrp = v[r][p];
                    const vrq = v[r][q];
                    v[r][p] = c * vrp - s * vrq;
                    v[r][q] = s * vrp + c * vrq;
                }
            }
        }
    }

    const values: [number, number, number] = [a[0][0], a[1][1], a[2][2]];
    // Sort descending by eigenvalue, reordering eigenvectors (columns of v).
    const idx: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2] = [0, 1, 2];
    idx.sort((i, j) => values[j] - values[i]);
    const sortedValues: [number, number, number] = [values[idx[0]], values[idx[1]], values[idx[2]]];
    const sortedVectors: Mat3 = [
        v[0][idx[0]], v[0][idx[1]], v[0][idx[2]],
        v[1][idx[0]], v[1][idx[1]], v[1][idx[2]],
        v[2][idx[0]], v[2][idx[1]], v[2][idx[2]],
    ];
    return { values: sortedValues, vectors: sortedVectors };
}

/**
 * Generates and writes planar UV coordinates onto a nail geometry in place.
 * Safe to call multiple times — subsequent calls overwrite the existing `uv`.
 *
 * @param geometry  the nail BufferGeometry (mutated)
 * @param flipU     set true if this finger's cuticle/tip end up reversed
 * @param flipV     set true if this finger's left/right end up reversed
 */
export function generateNailUVs(geometry: THREE.BufferGeometry, flipU = false, flipV = false): void {
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = position.count;
    if (count === 0) return;

    // 1. Compute centroid.
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < count; i++) {
        cx += position.getX(i);
        cy += position.getY(i);
        cz += position.getZ(i);
    }
    cx /= count;
    cy /= count;
    cz /= count;

    // 2. Build centered position buffer.
    const centered = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        centered[i * 3] = position.getX(i) - cx;
        centered[i * 3 + 1] = position.getY(i) - cy;
        centered[i * 3 + 2] = position.getZ(i) - cz;
    }

    // 3. PCA: covariance + eigen-decomposition → principal axes.
    //    Eigenvalues come back sorted descending, so column 0 is the nail's
    //    longest direction (cuticle→tip), column 1 is the next longest (which
    //    for an almond nail is width, but for a thin curved nail can be
    //    thickness if the curvature variance is larger than the width).
    const cov = covariance(centered, count);
    const { values, vectors } = jacobiEigen(cov);
    const uAxisX = vectors[0], uAxisY = vectors[3], uAxisZ = vectors[6];
    // To pick V reliably, we take the cross product of the U axis with the
    // world-up approximation derived from the average surface normal. That's
    // more robust than trusting the 2nd eigenvector for flat-ish shells.
    // Fallback: if normals aren't available, use the 2nd principal axis.
    const normalAttr = geometry.getAttribute('normal') as THREE.BufferAttribute | undefined;
    let nX = 0, nY = 0, nZ = 0;
    if (normalAttr) {
        for (let i = 0; i < count; i++) {
            nX += normalAttr.getX(i);
            nY += normalAttr.getY(i);
            nZ += normalAttr.getZ(i);
        }
        const len = Math.hypot(nX, nY, nZ);
        if (len > 1e-6) {
            nX /= len; nY /= len; nZ /= len;
        } else {
            nX = vectors[2]; nY = vectors[5]; nZ = vectors[8];
        }
    } else {
        nX = vectors[2]; nY = vectors[5]; nZ = vectors[8];
    }
    // V = N × U (right-handed, gives the in-plane width direction).
    let vAxisX = nY * uAxisZ - nZ * uAxisY;
    let vAxisY = nZ * uAxisX - nX * uAxisZ;
    let vAxisZ = nX * uAxisY - nY * uAxisX;
    const vLen = Math.hypot(vAxisX, vAxisY, vAxisZ);
    if (vLen > 1e-6) {
        vAxisX /= vLen; vAxisY /= vLen; vAxisZ /= vLen;
    } else {
        // Degenerate case (U parallel to N) — fall back to 2nd PCA eigenvector.
        vAxisX = vectors[1]; vAxisY = vectors[4]; vAxisZ = vectors[7];
    }

    // 4. Project every vertex onto the (u, v) plane, tracking the range so
    //    we can normalize to [0, 1] afterwards.
    const projected = new Float32Array(count * 2);
    let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
    for (let i = 0; i < count; i++) {
        const x = centered[i * 3];
        const y = centered[i * 3 + 1];
        const z = centered[i * 3 + 2];
        const u = x * uAxisX + y * uAxisY + z * uAxisZ;
        const v = x * vAxisX + y * vAxisY + z * vAxisZ;
        projected[i * 2] = u;
        projected[i * 2 + 1] = v;
        if (u < uMin) uMin = u;
        if (u > uMax) uMax = u;
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
    }

    const uSize = Math.max(uMax - uMin, 1e-6);
    const vSize = Math.max(vMax - vMin, 1e-6);

    if (typeof window !== 'undefined' && (window as { __NAIL_UV_DEBUG?: boolean }).__NAIL_UV_DEBUG) {
        console.log('[nailUVs]', {
            vertices: count,
            eigenvalues: values,
            uRange: uSize,
            vRange: vSize,
            aspect: uSize / vSize,
        });
    }

    // 5. Normalize and write final UVs.
    const uvArray = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
        let u = (projected[i * 2] - uMin) / uSize;
        let v = (projected[i * 2 + 1] - vMin) / vSize;
        if (flipU) u = 1 - u;
        if (flipV) v = 1 - v;
        uvArray[i * 2] = u;
        uvArray[i * 2 + 1] = v;
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
}
