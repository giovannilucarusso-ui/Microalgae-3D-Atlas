// The motile stage of a scaly haptophyte, down the brightfield objective.
//
// The same kind of renderer as the euglenoid field — one screen-facing quad per
// cell, the cell integrated as a function along its own ray, the blur averaged
// in closed form rather than sampled — with three differences, and each is the
// organism rather than a preference.
//
// **The section is an ellipse, not a circle.** The cell is compressed front to
// back and revolves about its long axis as it swims, so its width on screen is
// not a constant: the chord through an ellipse of semi-axes a and b, seen along
// a direction d in its plane, is the chord through a circle of the projected
// half-width Rp = √(b²d_x² + a²d_z²), scaled by ab/Rp². Everything the
// euglenoid field does with a circle therefore still holds, per station, with a
// radius that changes as the cell turns.
//
// **The pigment is two plates, not a mottle.** The plastids line the wall, one
// down each side, meeting all but along a narrow seam, so a ray crosses pigment
// wherever it passes through the wall except at the seam — which, when the cell
// lies flat, is a pale streak down its middle, and as it revolves swings round
// with it. The shell's path is the difference of two chords — the cell and its
// core — which is exact under the blur, and which of it is plastid is read from
// where the ray meets the wall.
//
// **And the edges are what the eye reads, not the colour.** A cell four
// micrometres thick in sea water is a strong phase object: slightly out of
// focus, every margin grows a bright line inside and a dark one outside, and
// every organelle with its own refractive index a ring of its own. That is the
// whole look of the reference footage — the golden cell is pale, and what draws
// it is its outline. It is the transport-of-intensity equation, taken with its
// own coefficient and applied to a body, a nitroplast, droplets and a set of
// appendages each at its own depth; plus the first Fresnel fringe, which that
// equation cannot make and the footage shows; plus the objective's axial
// chromatic aberration, which is why the dark rim is red-brown.
//
// The appendages are the new thing. Two flagella, the haptonema and the spine
// scales are thin cylinders a few tenths of a micrometre across — under the
// resolution limit — whose curves are recomputed on the CPU every frame from the
// cell's pose, and drawn as ribbons that integrate the same chord across their
// width. There are one or two cells in this field, so that costs nothing.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OUTLINE_GLSL, appendagesAt, buildHaptophytes, newPose, poseAt } from './haptophyte.js'
import {
  CHORD_GLSL,
  LayerComposite,
  absorbFrom,
  createLayers,
  disposeLayers,
  drawLayers,
  obliqueBeam,
} from './twoBeam.jsx'

// Refractive indices. The medium is sea water, not fresh: this is a marine
// alga, and a marine mount is 0.006 denser optically than the freshwater ones
// elsewhere in the atlas, which takes a little off every edge in the field.
const N_MEDIUM = 1.339
const N_CYTOPLASM = 1.36
const N_PLASTID = 1.415
// The nitroplast is a membrane-packed, protein-dense compartment — a
// cyanobacterium's worth of thylakoid-like membranes — and no index has been
// measured for it. It is drawn a little under a plastid's, at the step that
// gives its rim the contrast the footage shows: a thin dark outline round a
// centre no brighter than the cell around it.
const N_NITROPLAST = 1.39
// The nucleus barely differs from the cytoplasm round it, which is why the
// footage does not show one: drawn, but only just.
const N_NUCLEUS = 1.364
// The refractile droplets of the plastids, taken as lipid.
const N_DROPLET = 1.47
// Appendages. The flagellum and haptonema are membrane round a microtubule
// core; the spines are organic scale material; the posterior projection is
// unknown. None has a measured index, and they are drawn at the steps that
// give them the footage's contrast: a few per cent for the flagella, under a
// tenth for the spines.
const N_FLAGELLUM = 1.4
const N_SPINE = 1.41
const N_PROJECTION = 1.37
const INDEX_STEP = {
  flagellum: N_FLAGELLUM - N_MEDIUM,
  haptonema: N_FLAGELLUM - N_MEDIUM,
  spine: N_SPINE - N_MEDIUM,
  projection: N_PROJECTION - N_MEDIUM,
}

const f3 = (v) => v.toFixed(4)

const BODY_VERTEX = /* glsl */ `
  attribute vec4 aCentre;  // position, half length
  attribute vec4 aAxis;    // long axis towards the anterior, half width at the widest
  attribute vec4 aSide;    // across the flattened face after the roll, flattening
  attribute vec4 aNitro;   // x, u, z in the cell's frame, radius (µm)
  attribute vec4 aNucleus;
  attribute vec4 aDropA;
  attribute vec4 aDropB;
  attribute vec4 aPlastid; // thickness (µm), u where they begin, half-span (rad), density

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uFocus;
  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;

  varying vec3 vA;
  varying vec3 vP1;
  varying vec3 vP2;
  varying vec4 vCell;
  varying vec4 vEll;
  varying vec2 vLocal;
  varying float vDefocus;
  varying vec4 vNitro;
  varying vec4 vNucleus;
  varying vec4 vDropA;
  varying vec4 vDropB;
  varying vec4 vPlastid;

  void main() {
    vec3 C = aCentre.xyz;
    vec3 A = normalize(aAxis.xyz);
    vec3 P1 = normalize(aSide.xyz);
    vec3 P2 = cross(A, P1);
    float L = aCentre.w;
    float W = aAxis.w;

    vec4 view = modelViewMatrix * vec4(C, 1.0);
    float defocus = -view.z - uFocus;

    vec2 a2 = vec2(dot(A, uRight), dot(A, uUp));
    float len2 = length(a2);
    vec2 dirA = len2 > 1e-3 ? a2 / len2 : vec2(1.0, 0.0);
    vec2 dirP = vec2(-dirA.y, dirA.x);

    // The line of sight inside the cross-section, and the direction across
    // the cell on screen, both in the section's own frame (P1, P2).
    vec3 Fp = uForward - dot(uForward, A) * A;
    float fl = length(Fp);
    vec3 d = fl > 1e-4 ? Fp / fl : P2;
    vec3 e = uRight * dirP.x + uUp * dirP.y;
    vEll = vec4(dot(d, P1), dot(d, P2), dot(e, P1), dot(e, P2));

    // The quad hugs the cell and is grown by the widest blur any part of it
    // can have.
    float reachDepth = L * abs(dot(A, uForward)) + W;
    float spread = (abs(defocus) + reachDepth) * uTanAlpha;
    float blur = sqrt(uAiry * uAiry + spread * spread);
    float margin = blur * 1.4 + 4.0 / max(uPxPerUm, 1e-3) + 0.4;
    float lenEff = max(len2, 0.3);
    float along = L * lenEff + W * sqrt(max(0.0, 1.0 - len2 * len2)) + margin;
    float across = W + margin;
    vec2 corner = dirA * (position.x * 2.0 * along) + dirP * (position.y * 2.0 * across);

    vA = A;
    vP1 = P1;
    vP2 = P2;
    vCell = vec4(L, W, aSide.w, 0.0);
    vLocal = corner;
    vDefocus = defocus;
    vNitro = aNitro;
    vNucleus = aNucleus;
    vDropA = aDropA;
    vDropB = aDropB;
    vPlastid = aPlastid;

    vec3 world = C + uRight * corner.x + uUp * corner.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const BODY_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;
  uniform vec3 uPigment;
  uniform vec3 uBand;
  uniform vec3 uBandWeak;
  uniform float uPerUm;
  uniform float uCytoplasm;
  uniform float uEdge;
  uniform float uScatter;
  uniform float uVeil;
  uniform float uTie;
  uniform float uTieLimit;
  uniform float uHalo;
  uniform vec3 uChroma;
  uniform vec3 uObliqueColor;

  varying vec3 vA;
  varying vec3 vP1;
  varying vec3 vP2;
  varying vec4 vCell;
  varying vec4 vEll;
  varying vec2 vLocal;
  varying float vDefocus;
  varying vec4 vNitro;
  varying vec4 vNucleus;
  varying vec4 vDropA;
  varying vec4 vDropB;
  varying vec4 vPlastid;

  ${CHORD_GLSL}
  ${OUTLINE_GLSL}

  float blurAt(float defocus, float pixel) {
    float spread = defocus * uTanAlpha;
    return sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
  }

  // The projected half-width of an elliptical section of semi-axes a (across
  // the flattened face) and b (through it), and the factor that turns a
  // circle's chord at that radius into the ellipse's.
  vec2 section(float a, float b) {
    float rp = sqrt(b * b * vEll.x * vEll.x + a * a * vEll.y * vEll.y);
    return vec2(rp, a * b / max(rp * rp, 1e-6));
  }

  // A round body inside the cell, seen as a sphere of its own at its own
  // depth: its chord, and the Laplacian of that chord on screen — the 2D
  // one, curvature plus slope over radius, because a sphere is round in the
  // image and not only across one direction.
  vec2 sphere(vec4 b, float L, float W, float k, float pixel, out float defocus) {
    defocus = 0.0;
    if (b.w <= 0.0) return vec2(0.0);
    float a = outline(clamp(b.y, -0.98, 0.98)) * W;
    vec3 off = vP1 * (b.x * a) + vA * (b.y * L) + vP2 * (b.z * a * k);
    vec2 at = vec2(dot(off, uRight), dot(off, uUp));
    defocus = vDefocus + dot(off, uForward);
    float wb = max(0.866 * blurAt(defocus, pixel), 0.03);
    float rho = length(vLocal - at);
    float chord = 2.0 * halfChord(rho, b.w, wb);
    float lap = 2.0 * halfChordCurve(rho, b.w, wb) + 2.0 * halfChordSlope(rho, b.w, wb) / max(rho, wb);
    return vec2(chord, lap);
  }

  void main() {
    float L = vCell.x;
    float W = vCell.y;
    float k = vCell.z;
    vec2 a2 = vec2(dot(vA, uRight), dot(vA, uUp));
    float len2 = length(a2);
    vec2 dirA = len2 > 1e-3 ? a2 / len2 : vec2(1.0, 0.0);
    vec2 dirP = vec2(-dirA.y, dirA.x);
    float lenEff = max(len2, 0.3);
    float along = dot(vLocal, dirA);
    float c = dot(vLocal, dirP);
    float pixel = 0.6 / max(uPxPerUm, 1e-3);

    // How far this station of the axis is from the plane of focus: a cell
    // tipped out of the slide's plane is sharper at one end than the other.
    float axial = clamp(along / lenEff, -L * 1.1, L * 1.1);
    float defocusAxis = vDefocus + axial * dot(vA, uForward);
    float blur = blurAt(defocusAxis, pixel);
    float w = max(0.866 * blur, 0.03);
    float Ltot = L * lenEff;
    float u0 = along / Ltot;

    // --- The body and its core, averaged over the blur. --------------------
    //
    // Five binomial stations along the axis, as in the euglenoid field; across
    // it the average is exact.
    float t = vPlastid.x;
    // The first Fresnel fringe outside a defocused edge sits about √(λ·Δz)
    // out from it: where the curvature is also taken, so the fringe can be
    // drawn there. See the phase below.
    float fringe = sqrt(0.55 * abs(defocusAxis) + w * w);
    float cIn = c - sign(c) * fringe;
    float outer = 0.0;
    float inner = 0.0;
    float curveO = 0.0;
    float curveI = 0.0;
    float slopeO = 0.0;
    float curveOIn = 0.0;
    float curveIIn = 0.0;
    float axialAt[5];
    for (int i = 0; i < 5; i++) {
      float wt = i == 2 ? 0.375 : (i == 1 || i == 3 ? 0.25 : 0.0625);
      float uS = (along + float(i - 2) * 0.5 * w) / Ltot;
      axialAt[i] = 0.0;
      if (abs(uS) >= 1.0) continue;
      float a = outline(uS) * W;
      float b = a * k;
      vec2 so = section(a, b);
      float here = 2.0 * halfChord(c, so.x, w) * so.y;
      axialAt[i] = here;
      outer += wt * here;
      curveO += wt * 2.0 * halfChordCurve(c, so.x, w) * so.y;
      slopeO += wt * 2.0 * halfChordSlope(c, so.x, w) * so.y;
      curveOIn += wt * 2.0 * halfChordCurve(cIn, so.x, w) * so.y;
      float ai = max(a - t, 0.0);
      float bi = max(b - t, 0.0);
      if (ai > 0.0 && bi > 0.0) {
        vec2 si = section(ai, bi);
        inner += wt * 2.0 * halfChord(c, si.x, w) * si.y;
        curveI += wt * 2.0 * halfChordCurve(c, si.x, w) * si.y;
        curveIIn += wt * 2.0 * halfChordCurve(cIn, si.x, w) * si.y;
      }
    }
    outer /= lenEff;
    inner /= lenEff;
    curveO /= lenEff;
    curveI /= lenEff;
    slopeO /= lenEff;
    curveOIn /= lenEff;
    curveIIn /= lenEff;
    // The curvature along the axis, which is what draws the two ends: the
    // truncated front and the point behind are margins too, and without
    // this the front of the cell read as cut off with a knife.
    float curveA = (axialAt[4] - 2.0 * axialAt[2] + axialAt[0]) / (w * w * lenEff);

    // --- Which of the shell is plastid. ------------------------------------
    //
    // Where the ray meets the wall, going in and coming out, as a position
    // round the section: each plastid holds its side of the cell out to its
    // half-span, which leaves a narrow seam down the middle of each broad face.
    // Evaluated on the unblurred ray — the share changes slowly across the
    // cell, and the path it multiplies is already averaged.
    float share = 0.0;
    if (abs(u0) < 1.0) {
      float a = max(outline(u0) * W, 1e-3);
      float b = a * k;
      float dx = vEll.x;
      float dz = vEll.y;
      float ex = vEll.z;
      float ez = vEll.w;
      float qa = dx * dx / (a * a) + dz * dz / (b * b);
      float qb = c * (ex * dx / (a * a) + ez * dz / (b * b));
      float qc = c * c * (ex * ex / (a * a) + ez * ez / (b * b)) - 1.0;
      float disc = qb * qb - qa * qc;
      float lo = cos(vPlastid.z) - 0.07;
      float hi = cos(vPlastid.z) + 0.07;
      if (disc > 0.0) {
        float sq = sqrt(disc);
        float x0 = (c * ex + ((-qb - sq) / qa) * dx) / a;
        float x1 = (c * ex + ((-qb + sq) / qa) * dx) / a;
        share = 0.5 * (smoothstep(lo, hi, abs(x0)) + smoothstep(lo, hi, abs(x1)));
      } else {
        float tm = -qb / qa;
        float xm = (c * ex + tm * dx) / a;
        float zm = (c * ez + tm * dz) / b;
        share = smoothstep(lo, hi, abs(xm) / max(length(vec2(xm, zm)), 1e-4));
      }
    }
    float soft = 0.06 + w / Ltot;
    float plastidAlong = smoothstep(vPlastid.y + soft, vPlastid.y - soft, u0);
    float plastid = share * plastidAlong * vPlastid.w;
    float shell = max(outer - inner, 0.0);
    float pigment = shell * plastid;

    // --- The bodies inside. ------------------------------------------------
    float dN;
    float dK;
    float dA;
    float dB;
    vec2 nitro = sphere(vNitro, L, W, k, pixel, dN);
    vec2 nucleus = sphere(vNucleus, L, W, k, pixel, dK);
    vec2 dropA = sphere(vDropA, L, W, k, pixel, dA);
    vec2 dropB = sphere(vDropB, L, W, k, pixel, dB);

    // --- Absorption. -------------------------------------------------------
    //
    // Only the plastids are pigmented. The bodies in the core hold none, and a
    // ray through them crosses that much less cytoplasm, which is nearly
    // colourless anyway.
    vec3 x = uPigment * (pigment * uPerUm);
    vec3 transmittance = mix(exp(-x), exp(-x * uBandWeak), uBand);
    transmittance *= exp(-vec3(uCytoplasm) * outer);

    // --- The phase: what an out-of-focus margin does to the light. ---------
    //
    // The transport-of-intensity term, for each body at its own defocus: the
    // change in intensity goes as the Laplacian of the optical path times the
    // distance from focus. Across the cell that is the curvature of its
    // chord; for the nitroplast, the nucleus and the droplets it is each
    // sphere's own, in two dimensions.
    float lapBody = (curveO + curveA) * ${f3(N_CYTOPLASM - N_MEDIUM)}
      + (curveO - curveI) * plastid * ${f3(N_PLASTID - N_CYTOPLASM)};
    // The same, a fringe's width further in: the dark band there is the one
    // whose first Fresnel fringe lands on this pixel. The transport-of-
    // intensity term is the small-defocus limit of propagation and has no
    // fringes of its own; the footage has one, a pale halo round the dark
    // rim, and it is drawn as that fringe — at √(λ·Δz) outside the band that
    // throws it, with a share of that band's own strength.
    float lapIn = curveOIn * ${f3(N_CYTOPLASM - N_MEDIUM)}
      + (curveOIn - curveIIn) * plastid * ${f3(N_PLASTID - N_CYTOPLASM)};
    vec3 zc = vec3(defocusAxis) + uChroma;
    vec3 halo = uHalo * max(zc * lapIn, vec3(0.0)) * step(inner, 1e-4);

    // Nothing here, nothing blurred into here and no fringe: leave the field
    // alone.
    if (outer < 1e-4 && abs(curveO) < 1e-4 && nitro.x < 1e-4 && halo.g < 1e-4) discard;
    // The body's own term takes each channel at its own focus — see
    // axialChromaUm on the objective.
    vec3 tie = zc * lapBody
      + dN * nitro.y * ${f3(N_NITROPLAST - N_CYTOPLASM)}
      + dK * nucleus.y * ${f3(N_NUCLEUS - N_CYTOPLASM)}
      + dA * dropA.y * ${f3(N_DROPLET - N_CYTOPLASM)}
      + dB * dropB.y * ${f3(N_DROPLET - N_CYTOPLASM)};

    // Light bent out of the objective's cone at a steep margin, which no
    // amount of focusing brings back.
    float edge = clamp(abs(slopeO) * lenEff * ${f3((N_CYTOPLASM - N_MEDIUM) * 4)}, 0.0, 1.0);
    edge *= edge;
    float deviated = 1.0 - exp(-(uEdge * edge + uScatter * (pigment + nitro.x * 0.3 + outer * 0.05)));

    #ifdef OBLIQUE
      gl_FragColor = vec4(uObliqueColor * transmittance * deviated, 1.0);
      return;
    #endif

    transmittance *= 1.0 - deviated;
    transmittance *= 1.0 - clamp(uTie * tie, -uTieLimit, uTieLimit);
    transmittance *= 1.0 + min(uTie * halo, vec3(uTieLimit));
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    gl_FragColor = vec4(clamp(transmittance, 0.0, 2.2), 1.0);
  }
`

// The appendages: ribbons that face the camera, one per curve, recomputed on
// the CPU from the cell's pose every frame.
const RIBBON_VERTEX = /* glsl */ `
  attribute vec3 aTangent;
  attribute float aSide;
  attribute float aRadius;
  attribute float aStep;   // refractive index step against the medium

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform float uFocus;
  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;

  varying float vLateral;
  varying float vRadius;
  varying float vW;
  varying float vDefocus;
  varying float vStep;

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    float defocus = -view.z - uFocus;
    float pixel = 0.6 / max(uPxPerUm, 1e-3);
    float spread = defocus * uTanAlpha;
    float blur = sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
    float w = max(0.866 * blur, 0.03);

    vec2 t2 = vec2(dot(aTangent, uRight), dot(aTangent, uUp));
    float tl = length(t2);
    t2 = tl > 1e-5 ? t2 / tl : vec2(1.0, 0.0);
    vec2 n2 = vec2(-t2.y, t2.x);
    float reach = aRadius + 2.6 * w + 2.0 * pixel;
    vec3 world = position + (uRight * n2.x + uUp * n2.y) * (aSide * reach);

    vLateral = aSide * reach;
    vRadius = aRadius;
    vW = w;
    vDefocus = defocus;
    vStep = aStep;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const RIBBON_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uCytoplasm;
  uniform float uEdge;
  uniform float uScatter;
  uniform float uVeil;
  uniform float uTie;
  uniform float uTieLimit;
  uniform vec3 uObliqueColor;

  varying float vLateral;
  varying float vRadius;
  varying float vW;
  varying float vDefocus;
  varying float vStep;

  ${CHORD_GLSL}

  void main() {
    float c = vLateral;
    float r = max(vRadius, 1e-3);
    float chord = 2.0 * halfChord(c, r, vW);
    float slope = 2.0 * halfChordSlope(c, r, vW);
    float curve = 2.0 * halfChordCurve(c, r, vW);
    if (chord < 1e-5 && abs(curve) < 1e-4) discard;

    float edge = clamp(abs(slope) * vStep * 4.0, 0.0, 1.0);
    edge *= edge;
    float deviated = 1.0 - exp(-(uEdge * edge + uScatter * chord * vStep * 8.0));

    #ifdef OBLIQUE
      gl_FragColor = vec4(uObliqueColor * deviated, 1.0);
      return;
    #endif

    vec3 transmittance = vec3(exp(-uCytoplasm * chord));
    transmittance *= 1.0 - deviated;
    transmittance *= 1.0 - clamp(uTie * vDefocus * curve * vStep, -uTieLimit, uTieLimit);
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    gl_FragColor = vec4(clamp(transmittance, 0.0, 2.2), 1.0);
  }
`

// The ribbon geometry for every appendage of every cell: two vertices per
// point on each curve, and the triangles between consecutive pairs. The
// structure is fixed once the cells are built; only positions, tangents and
// radii change.
function ribbonLayout(cells, form) {
  const curves = []
  for (let i = 0; i < cells.length; i++) {
    for (const a of appendagesAt(cells[i], 0, form)) {
      curves.push({ cell: i, kind: a.kind, points: a.points.length })
    }
  }
  const vertices = curves.reduce((n, c) => n + c.points * 2, 0)
  const index = []
  let base = 0
  for (const c of curves) {
    for (let p = 0; p < c.points - 1; p++) {
      const a = base + p * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    base += c.points * 2
  }
  const geometry = new THREE.BufferGeometry()
  const attribute = (width) => new THREE.BufferAttribute(new Float32Array(vertices * width), width)
  geometry.setAttribute('position', attribute(3))
  geometry.setAttribute('aTangent', attribute(3))
  geometry.setAttribute('aRadius', attribute(1))
  const side = attribute(1)
  const step = attribute(1)
  let v = 0
  for (const c of curves) {
    for (let p = 0; p < c.points; p++) {
      side.array[v] = -1
      side.array[v + 1] = 1
      step.array[v] = step.array[v + 1] = INDEX_STEP[c.kind] ?? 0.05
      v += 2
    }
  }
  geometry.setAttribute('aSide', side)
  geometry.setAttribute('aStep', step)
  geometry.setIndex(index)
  for (const name of ['position', 'aTangent', 'aRadius']) geometry.getAttribute(name).setUsage(THREE.DynamicDrawUsage)
  return { geometry, curves }
}

const P = new THREE.Vector3()
const Q = new THREE.Vector3()

export default function HaptophyteField({ form, focus, optics = {}, swimming = true }) {
  const { cells } = useMemo(() => buildHaptophytes(form), [form])
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const size = useThree((s) => s.size)
  const clock = useRef(0)
  const poses = useMemo(() => cells.map(() => newPose()), [cells])

  // The bodies: one instanced quad each. The pose attributes are rewritten
  // every frame; the anatomy is written once.
  const bodyGeometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1)
    const n = Math.max(1, cells.length)
    const attribute = (width, fill) => {
      const data = new Float32Array(n * width)
      cells.forEach((c, i) => data.set(fill(c), i * width))
      const a = new THREE.InstancedBufferAttribute(data, width)
      return a
    }
    const body = (b) => [b.x, b.u, b.z, b.r]
    const fromU = 1 - 2 * form.plastids.fromS
    plane.setAttribute('aCentre', attribute(4, (c) => [0, 0, 0, c.anatomy.lengthUm / 2]))
    plane.setAttribute('aAxis', attribute(4, (c) => [0, 1, 0, c.anatomy.widthUm / 2]))
    plane.setAttribute('aSide', attribute(4, () => [1, 0, 0, form.cell.flattening]))
    plane.setAttribute('aNitro', attribute(4, (c) => body(c.nitroplast)))
    plane.setAttribute('aNucleus', attribute(4, (c) => body(c.nucleus)))
    plane.setAttribute('aDropA', attribute(4, (c) => (c.droplets[0] ? body(c.droplets[0]) : [0, 0, 0, 0])))
    plane.setAttribute('aDropB', attribute(4, (c) => (c.droplets[1] ? body(c.droplets[1]) : [0, 0, 0, 0])))
    plane.setAttribute(
      'aPlastid',
      attribute(4, (c) => [c.anatomy.plastidUm, fromU, form.plastids.span, c.density]),
    )
    for (const name of ['aCentre', 'aAxis', 'aSide']) plane.getAttribute(name).setUsage(THREE.DynamicDrawUsage)
    return plane
  }, [cells, form])
  useEffect(() => () => bodyGeometry.dispose(), [bodyGeometry])

  const ribbons = useMemo(() => ribbonLayout(cells, form), [cells, form])
  useEffect(() => () => ribbons.geometry.dispose(), [ribbons])

  const materials = useMemo(() => {
    const illumination = optics.illumination
    const band = form.band ?? [0.14, 0.14, 0.14]
    const weak = form.bandWeak ?? [0.13, 0.13, 0.13]
    const shared = () => ({
      uRight: { value: new THREE.Vector3(1, 0, 0) },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uForward: { value: new THREE.Vector3(0, 0, -1) },
      uFocus: { value: 1 },
      uTanAlpha: { value: optics.tanAlpha ?? 0.2 },
      uAiry: { value: optics.airyUm ?? 0.09 },
      uPxPerUm: { value: 8 },
      uCytoplasm: { value: 0.01 },
      // Light bent out of the objective's cone at the steepest part of a
      // margin: what makes the rim dark right at the silhouette, before any
      // defocus. About a third of it at the steepest point.
      uEdge: { value: 0.4 },
      uScatter: { value: 0.05 },
      uVeil: { value: 0.02 },
      // The transport-of-intensity equation with its own coefficient, which is
      // one: ΔI/I = −Δz·∇²(optical path), every length in micrometres. The
      // objective's `phase` is a different thing — an image-space stand-in for
      // this term in the depth-of-field pass, for renderers that have no
      // optical path to take the Laplacian of — and at 0.26 it gave edges a
      // tenth as strong as the footage's. With the physical coefficient and
      // the footage's focus they come out at the footage's strength.
      uTie: { value: 1 },
      // It is first order, and a thick refractile margin is past first order;
      // this is where it stops being trusted.
      uTieLimit: { value: 0.6 },
      // How much of a dark band comes back as its first fringe.
      uHalo: { value: 0.45 },
      uChroma: { value: new THREE.Vector3(...(optics.axialChromaUm ?? [0, 0, 0])) },
      uObliqueColor: { value: obliqueBeam(illumination) },
    })
    const build = (vertexShader, fragmentShader, extra, scattered) =>
      new THREE.ShaderMaterial({
        defines: scattered ? { OBLIQUE: '' } : {},
        uniforms: { ...shared(), ...extra },
        vertexShader,
        fragmentShader,
        blending: scattered ? THREE.AdditiveBlending : THREE.MultiplyBlending,
        premultipliedAlpha: !scattered,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      })
    const pigment = () => ({
      uPigment: { value: absorbFrom(form.colour, band, weak) },
      uBand: { value: new THREE.Vector3(...band) },
      uBandWeak: { value: new THREE.Vector3(...weak) },
      // One micrometre of plastid is one unit of the measured colour.
      uPerUm: { value: 1 },
    })
    return {
      body: build(BODY_VERTEX, BODY_FRAGMENT, pigment(), false),
      bodyOblique: build(BODY_VERTEX, BODY_FRAGMENT, pigment(), true),
      ribbon: build(RIBBON_VERTEX, RIBBON_FRAGMENT, {}, false),
      ribbonOblique: build(RIBBON_VERTEX, RIBBON_FRAGMENT, {}, true),
    }
  }, [form, optics.tanAlpha, optics.airyUm, optics.axialChromaUm, optics.illumination])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  const layers = useMemo(() => {
    const count = Math.max(1, cells.length)
    return createLayers(
      [
        new THREE.InstancedMesh(bodyGeometry, materials.body, count),
        new THREE.Mesh(ribbons.geometry, materials.ribbon),
      ],
      [
        new THREE.InstancedMesh(bodyGeometry, materials.bodyOblique, count),
        new THREE.Mesh(ribbons.geometry, materials.ribbonOblique),
      ],
    )
  }, [bodyGeometry, ribbons, materials, cells.length])
  useEffect(() => () => disposeLayers(layers), [layers])

  useFrame((state, delta) => {
    // The culture's own clock, which stops when swimming is switched off.
    if (swimming) clock.current += Math.min(delta, 0.1)
    const t = clock.current

    // Pose every cell, and write its body and its appendages from that pose.
    const centre = bodyGeometry.getAttribute('aCentre')
    const axis = bodyGeometry.getAttribute('aAxis')
    const side = bodyGeometry.getAttribute('aSide')
    const pos = ribbons.geometry.getAttribute('position')
    const tan = ribbons.geometry.getAttribute('aTangent')
    const rad = ribbons.geometry.getAttribute('aRadius')
    let v = 0
    cells.forEach((cell, i) => {
      const pose = poseAt(cell, t, poses[i])
      centre.array.set([pose.centre.x, pose.centre.y, pose.centre.z], i * 4)
      axis.array.set([pose.axis.x, pose.axis.y, pose.axis.z], i * 4)
      side.array.set([pose.side.x, pose.side.y, pose.side.z], i * 4)
      for (const curve of appendagesAt(cell, t, form)) {
        const pts = curve.points
        const world = pts.map(([x, y, z]) =>
          new THREE.Vector3()
            .copy(pose.centre)
            .addScaledVector(pose.side, x)
            .addScaledVector(pose.axis, y)
            .addScaledVector(pose.over, z),
        )
        for (let p = 0; p < pts.length; p++) {
          P.copy(world[Math.min(p + 1, pts.length - 1)]).sub(world[Math.max(p - 1, 0)])
          for (const s of [0, 1]) {
            pos.array.set([world[p].x, world[p].y, world[p].z], (v + s) * 3)
            tan.array.set([P.x, P.y, P.z], (v + s) * 3)
            rad.array[v + s] = pts[p][3]
          }
          v += 2
        }
      }
    })
    for (const a of [centre, axis, side, pos, tan, rad]) a.needsUpdate = true

    const centred = camera.position.distanceTo(controls?.target ?? Q.copy(camera.position).setZ(0))
    const plane = centred + (focus?.current ?? 0)
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * plane
    // At about one and a half buffer pixels per CSS pixel — see EuglenaField.
    const scale = Math.min(1, Math.max(0.5, 1.5 / state.viewport.dpr))
    const perUm = (size.height * state.viewport.dpr * scale) / Math.max(2 * halfHeight, 1e-6)
    for (const m of Object.values(materials)) {
      const u = m.uniforms
      camera.matrixWorld.extractBasis(u.uRight.value, u.uUp.value, u.uForward.value)
      u.uForward.value.negate()
      u.uPxPerUm.value = perUm
      u.uFocus.value = plane
    }
    drawLayers(gl, layers, camera, plane, scale)
  })

  return <LayerComposite layers={layers} />
}
