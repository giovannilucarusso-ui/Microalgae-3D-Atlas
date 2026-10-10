// A culture of Phaeodactylum tricornutum on a slide, down the brightfield
// objective.
//
// The same kind of renderer as the haptophyte field — one screen-facing quad per
// cell, the cell integrated as a function along its own ray, the defocus
// averaged in closed form rather than sampled, and the phase taken with the
// transport-of-intensity equation at its own coefficient — and it differs in the
// ways the organism does.
//
// **Most of each cell is nearly invisible.** The arms of a fusiform cell are
// tubes about a micrometre across, full of vacuoles (r98, r99), and on the open
// micrograph they barely darken the field: inside one the light is 0.98–1.00 of
// the ground, at its edges 0.93–0.95, with a pale line outside (r111). What
// draws an arm is its wall. So the body is a shell and a core — the wall's chord
// is the difference of two chords, the cell and its protoplast, exact under the
// blur — and the core's index changes along the cell, from vacuole in the arms
// to cytoplasm in the body. A ray through an arm crosses two walls and a little
// sap; a ray grazing its edge runs along the wall for a third of a micrometre,
// and that is the line the eye reads.
//
// **The pigment is one plastid, off to one side.** It is drawn as a body of
// revolution of its own, a thick plate along the cell, whose section is an
// ellipse displaced from the axis — so, as the cell lies with one face or
// another to the objective, the plastid is seen centred, or along one side of
// the body, which is how the micrograph shows it (r111). Its chord is computed
// as the cell's is, under the same blur; only it absorbs.
//
// **Cells may be bent**, as some are in every culture (r98): the axis sags along
// the slide, and the whole cell — body, plastid, nucleus, droplets — is drawn
// shifted by the sag at each station.
//
// The nucleus and the lipid droplets are spheres at their own depths, each its
// own small lens; the nucleus barely, the droplets strongly. And each colour
// channel sees the cell at its own defocus — the objective's axial colour, the
// same for every specimen in the atlas.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { DROPLET_GLSL, RADIUS_GLSL, RESOLUTION_UM, buildPennates } from './pennate.js'
import {
  CHORD_GLSL,
  LayerComposite,
  absorbFrom,
  createLayers,
  disposeLayers,
  drawLayers,
  obliqueBeam,
} from './twoBeam.jsx'

// Refractive indices. The medium is sea water: f/2 is made on it.
const N_MEDIUM = 1.339
// Protoplasm, as everywhere in the atlas.
const N_CYTOPLASM = 1.36
// The sap of the vacuoles that fill the arms. No index has been measured; the
// micrograph's arms are within a few per cent of the ground inside, so the sap
// is drawn barely denser than sea water.
const N_VACUOLE = 1.343
// The plastid, as in the other fields.
const N_PLASTID = 1.415
// The nucleus barely differs from the cytoplasm round it, which is why no
// micrograph of the living cell shows one.
const N_NUCLEUS = 1.364
// Lipid, above 1.46 in single microalgal cells (r91).
const N_DROPLET = 1.47
// The wall: organic — a sulphated glucuronomannan with protein (r98) — and not
// measured. Drawn at the index of a hydrated polysaccharide, at the thickness
// the species record gives; the product of the two is what the image depends
// on, and this one gives the arms the margins measured on the micrograph
// (r111): a few per cent dark at the wall and a pale line outside it, within a
// micrometre or so of focus.
const N_WALL = 1.395
// The objective's numerical aperture: the oil-immersion lens whose resolution
// the atlas draws with (RESOLUTION_UM). It is how steep a slope of optical
// path the objective still collects, and so how much of a margin's light it
// loses — as in the thraustochytrid field.
const NA = 1.25

const f3 = (v) => v.toFixed(4)

const VERTEX = /* glsl */ `
  attribute vec4 aCentre;   // position, half length (µm)
  attribute vec4 aAxis;     // long axis, wall thickness (µm)
  attribute vec4 aSide;     // P1, the side the plastid is pushed to; bend (µm)
  attribute vec4 aShape;    // body half length, body radius, arm radius at root and tip
  attribute vec4 aPlastid;  // offset along P1, semi-axis along P1, along P2, half length
  attribute vec4 aPlastid2; // centre along the axis (µm), pinch, pigment density, morph
  attribute vec4 aBodies;   // nucleus across (fraction), nucleus radius; a fifth droplet's u, r
  attribute vec4 aDrops0;   // two droplets: u, r, u, r
  attribute vec4 aDrops1;

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
  varying vec4 vCell;     // H, wall, bend, 0
  varying vec4 vShape;
  varying vec4 vPlastid;
  varying vec4 vPlastid2;
  varying vec4 vEll;
  varying vec2 vLocal;
  varying float vDefocus;
  varying vec4 vBodies;
  varying vec4 vDrops0;
  varying vec4 vDrops1;

  void main() {
    vec3 C = aCentre.xyz;
    float H = aCentre.w;
    vec3 A = normalize(aAxis.xyz);
    vec3 P1 = normalize(aSide.xyz - dot(aSide.xyz, A) * A);
    vec3 P2 = cross(A, P1);

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

    // The quad hugs the cell — its length, its width and its bend — and is
    // grown by the widest blur any part of it can have.
    float Rb = aShape.y;
    float reachDepth = H * abs(dot(A, uForward)) + Rb;
    float spread = (abs(defocus) + reachDepth) * uTanAlpha;
    float blur = sqrt(uAiry * uAiry + spread * spread);
    float margin = blur * 1.4 + 4.0 / max(uPxPerUm, 1e-3) + 0.5;
    float lenEff = max(len2, 0.3);
    float along = H * lenEff + Rb * sqrt(max(0.0, 1.0 - len2 * len2)) + margin;
    float across = Rb + abs(aSide.w) + margin;
    vec2 corner = dirA * (position.x * 2.0 * along) + dirP * (position.y * 2.0 * across);

    vA = A;
    vP1 = P1;
    vP2 = P2;
    vCell = vec4(H, aAxis.w, aSide.w, 0.0);
    vShape = aShape;
    vPlastid = aPlastid;
    vPlastid2 = aPlastid2;
    vLocal = corner;
    vDefocus = defocus;
    vBodies = aBodies;
    vDrops0 = aDrops0;
    vDrops1 = aDrops1;

    vec3 world = C + uRight * corner.x + uUp * corner.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
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
  uniform float uPlastidLimit;
  uniform float uDropLimit;
  uniform float uWallBlur;
  uniform float uTieFade;
  uniform float uHalo;
  uniform vec3 uChroma;
  uniform vec3 uObliqueColor;

  varying vec3 vA;
  varying vec3 vP1;
  varying vec3 vP2;
  varying vec4 vCell;
  varying vec4 vShape;
  varying vec4 vPlastid;
  varying vec4 vPlastid2;
  varying vec4 vEll;
  varying vec2 vLocal;
  varying float vDefocus;
  varying vec4 vBodies;
  varying vec4 vDrops0;
  varying vec4 vDrops1;

  ${CHORD_GLSL}
  ${RADIUS_GLSL}
  ${DROPLET_GLSL}

  float blurAt(float defocus, float pixel) {
    float spread = defocus * uTanAlpha;
    return sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
  }

  // The projected half-width of an elliptical section of semi-axes a (along
  // P1) and b (along P2), and the factor that turns a circle's chord at that
  // radius into the ellipse's.
  vec2 section(float a, float b) {
    float rp = sqrt(b * b * vEll.x * vEll.x + a * a * vEll.y * vEll.y);
    return vec2(rp, a * b / max(rp * rp, 1e-6));
  }

  // The plastid's own profile along the cell: the body's own — parabolic in
  // a fusiform cell, elliptical in an oval one, which has no arms — pinched
  // across its middle when the cell is about to divide. As plastidProfile in
  // pennate.js.
  float plastidShape(float q) {
    return vShape.z > 0.0 ? 1.0 - q * q : sqrt(max(0.0, 1.0 - q * q));
  }

  float plastidProfile(float x) {
    float q = (x - vPlastid2.x) / max(vPlastid.w, 1e-4);
    if (abs(q) >= 1.0) return 0.0;
    float k = q / 0.16;
    return plastidShape(q) * (1.0 - vPlastid2.y * exp(-k * k));
  }

  // Without the pinch: what the plate's distance from the axis follows.
  float plastidBase(float x) {
    float q = (x - vPlastid2.x) / max(vPlastid.w, 1e-4);
    return abs(q) >= 1.0 ? 0.0 : plastidShape(q);
  }

  // A small round body — the nucleus, a lipid droplet — as the objective sees
  // it: a Gaussian that holds the body's whole volume, its width the body's
  // own size and its blur added in quadrature, at the body's own depth. Its
  // projected thickness and the Laplacian of that on screen.
  //
  // Not the sphere's chord averaged along one direction, which is what the
  // first version did: that spreads a body over a line rather than a disc, so
  // its peak falls as the blur and not as the blur squared, and every droplet
  // a few micrometres out of focus came back as a hard ring several times its
  // size. Spread over a disc, a droplet half a micrometre across is a bright
  // or dark point near focus and has faded to nothing a few micrometres away,
  // which is what the reference micrograph shows.
  vec2 blob(vec4 b, float H, vec2 dirP, float pixel, out float defocus) {
    defocus = 0.0;
    if (b.w <= 0.0) return vec2(0.0);
    float a = radiusAt(b.y * H, vShape, H);
    vec3 off = vP1 * (b.x * a) + vA * (b.y * H) + vP2 * (b.z * a);
    vec2 at = vec2(dot(off, uRight), dot(off, uUp)) + dirP * (vCell.z * (1.0 - b.y * b.y));
    defocus = vDefocus + dot(off, uForward);
    float bl = blurAt(defocus, pixel);
    float s2 = 0.4 * b.w * b.w + 0.5 * bl * bl;
    vec2 d = vLocal - at;
    float r2 = dot(d, d);
    float g = 4.18879 * b.w * b.w * b.w / (6.28318 * s2) * exp(-0.5 * r2 / s2);
    return vec2(g, g * (r2 / (s2 * s2) - 2.0 / s2));
  }

  void main() {
    float H = vCell.x;
    float wall = vCell.y;
    float bend = vCell.z;
    float oval = vPlastid2.w;
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
    float axial = clamp(along / lenEff, -H * 1.1, H * 1.1);
    float defocusAxis = vDefocus + axial * dot(vA, uForward);
    float blur = blurAt(defocusAxis, pixel);
    float w = max(0.866 * blur, 0.03);
    float Ltot = H * lenEff;
    float q0 = clamp(along / Ltot, -1.0, 1.0);

    // Across the cell, measured from its bent axis.
    float cb = c - bend * (1.0 - q0 * q0);
    // The first Fresnel fringe outside a defocused edge sits about √(λ·Δz)
    // out from it; see the haptophyte field.
    float fringe = sqrt(0.55 * abs(defocusAxis) + w * w);
    float cIn = cb - sign(cb) * fringe;

    // --- The cell, station by station along its axis. ---------------------
    //
    // Five binomial stations, as in the other fields; across the cell the
    // average over the blur is exact. At each, the optical path of the wall,
    // of the core and of the plastid.
    //
    // The curvatures are second differences of that blurred path, on a step
    // never finer than the objective's own spread. They were first taken in
    // closed form, as the difference of the slopes at the two ends of the
    // blur, and for anything as thin as the wall that difference is a spike
    // wherever an end of the blur crosses a margin: every arm came out as a
    // double line, dotted along its length by the pixel grid. Differenced over
    // the spread, the same path gives the smooth dark-and-bright margin the
    // micrograph shows, and nothing finer than the objective can draw.
    const float dWall = ${f3(N_WALL - N_MEDIUM)};
    const float dCyto = ${f3(N_CYTOPLASM - N_MEDIUM)};
    const float dVac = ${f3(N_VACUOLE - N_MEDIUM)};
    const float dPlas = ${f3(N_PLASTID - N_CYTOPLASM)};
    float h = max(w, uWallBlur);
    float opdAt[5];
    float outer = 0.0;
    float innerAll = 0.0;
    float coreCyto = 0.0;
    float plastid = 0.0;
    float plastidMid = 0.0;
    float lapCell = 0.0;
    float lapPlastid = 0.0;
    float lapIn = 0.0;
    float slopeCell = 0.0;
    float B = vShape.x;
    for (int i = 0; i < 5; i++) {
      float wt = i == 2 ? 0.375 : (i == 1 || i == 3 ? 0.25 : 0.0625);
      float xs = (along + float(i - 2) * 0.5 * w) / lenEff;
      opdAt[i] = 0.0;
      if (abs(xs) >= H) continue;
      float r = radiusAt(xs, vShape, H);
      float ri = max(r - wall, 0.0);
      // The core is cytoplasm in the body and vacuole in the arms; an oval
      // cell is body throughout.
      float inBody = oval > 0.5 ? 1.0 : 1.0 - smoothstep(0.72 * B, 1.06 * B, abs(xs));
      float dCore = mix(dVac, dCyto, inBody);
      float f = plastidProfile(xs);
      // The plate's centre here, displaced along P1 by its own profile — it
      // lies against the side of the body — and seen on screen.
      float shiftP = vPlastid.x * plastidBase(xs) * vEll.z;
      vec2 so = section(vPlastid.y * f, vPlastid.z * f);

      // The cell's path at a point across it: the wall, the core, and
      // separately the plastid.
      float o = 2.0 * halfChord(cb, r, w);
      float iC = ri > 0.0 ? 2.0 * halfChord(cb, ri, w) : 0.0;
      float pC = f > 0.0 ? 2.0 * halfChord(cb - shiftP, so.x, w) * so.y : 0.0;
      float cellPath = dWall * (o - iC) + dCore * iC;
      opdAt[i] = cellPath + dPlas * pC;
      outer += wt * o;
      innerAll += wt * iC;
      coreCyto += wt * iC * inBody;
      plastid += wt * pC;
      // The slope of the cell's own path across it — the wall and the core,
      // the plastid apart — which is what bends a ray at its margin.
      float sO = 2.0 * halfChordSlope(cb, r, w);
      float sI = ri > 0.0 ? 2.0 * halfChordSlope(cb, ri, w) : 0.0;
      slopeCell += wt * (dWall * (sO - sI) + dCore * sI);

      if (i == 2) {
        // Across the cell, at this station: the second difference.
        float oP = 2.0 * halfChord(cb + h, r, w);
        float oM = 2.0 * halfChord(cb - h, r, w);
        float iP = ri > 0.0 ? 2.0 * halfChord(cb + h, ri, w) : 0.0;
        float iM = ri > 0.0 ? 2.0 * halfChord(cb - h, ri, w) : 0.0;
        float cellP = dWall * (oP - iP) + dCore * iP;
        float cellM = dWall * (oM - iM) + dCore * iM;
        lapCell = (cellP - 2.0 * cellPath + cellM) / (h * h);
        if (f > 0.0) {
          float pP = 2.0 * halfChord(cb - shiftP + h, so.x, w) * so.y;
          float pM = 2.0 * halfChord(cb - shiftP - h, so.x, w) * so.y;
          lapPlastid = dPlas * (pP - 2.0 * pC + pM) / (h * h);
        }
        plastidMid = pC;
        // And a fringe's width further in, for the halo.
        float o0 = 2.0 * halfChord(cIn, r, w);
        float i0 = ri > 0.0 ? 2.0 * halfChord(cIn, ri, w) : 0.0;
        float oPn = 2.0 * halfChord(cIn + h, r, w);
        float oMn = 2.0 * halfChord(cIn - h, r, w);
        float iPn = ri > 0.0 ? 2.0 * halfChord(cIn + h, ri, w) : 0.0;
        float iMn = ri > 0.0 ? 2.0 * halfChord(cIn - h, ri, w) : 0.0;
        lapIn = (dWall * (oPn - iPn) + dCore * iPn - 2.0 * (dWall * (o0 - i0) + dCore * i0)
          + dWall * (oMn - iMn) + dCore * iMn) / (h * h);
      }
    }
    outer /= lenEff;
    innerAll /= lenEff;
    coreCyto /= lenEff;
    plastid /= lenEff;
    lapCell /= lenEff;
    lapPlastid /= lenEff;
    lapIn /= lenEff;
    slopeCell /= lenEff;
    // The curvature along the axis, which draws the rounded tips and the
    // neck where an arm leaves the body: the outer stations are a blur's
    // width apart.
    float lapAlong = (opdAt[4] - 2.0 * opdAt[2] + opdAt[0]) / (w * w * lenEff);

    // --- The bodies inside. ------------------------------------------------
    //
    // The nucleus at the middle of the cell; each droplet at its place along
    // the cell, and across it by the rule the population uses (dropletAcross).
    float dN;
    float d0;
    float d1;
    float d2;
    float d3;
    float d4;
    vec2 nucleus = blob(vec4(vBodies.x, 0.0, 0.0, vBodies.y), H, dirP, pixel, dN);
    vec4 b0 = vec4(dropletAcross(vDrops0.x * H, vDrops0.y, vShape, H, wall), vDrops0.x, 0.0, vDrops0.y);
    vec4 b1 = vec4(dropletAcross(vDrops0.z * H, vDrops0.w, vShape, H, wall), vDrops0.z, 0.0, vDrops0.w);
    vec4 b2 = vec4(dropletAcross(vDrops1.x * H, vDrops1.y, vShape, H, wall), vDrops1.x, 0.0, vDrops1.y);
    vec4 b3 = vec4(dropletAcross(vDrops1.z * H, vDrops1.w, vShape, H, wall), vDrops1.z, 0.0, vDrops1.w);
    vec4 b4 = vec4(dropletAcross(vBodies.z * H, vBodies.w, vShape, H, wall), vBodies.z, 0.0, vBodies.w);
    vec2 drop0 = blob(b0, H, dirP, pixel, d0);
    vec2 drop1 = blob(b1, H, dirP, pixel, d1);
    vec2 drop2 = blob(b2, H, dirP, pixel, d2);
    vec2 drop3 = blob(b3, H, dirP, pixel, d3);
    vec2 drop4 = blob(b4, H, dirP, pixel, d4);

    // --- Absorption. -------------------------------------------------------
    //
    // Only the plastid is pigmented; the cytoplasm takes a trace.
    float pigment = plastid * vPlastid2.z;
    vec3 x = uPigment * (pigment * uPerUm);
    vec3 transmittance = mix(exp(-x), exp(-x * uBandWeak), uBand);
    transmittance *= exp(-vec3(uCytoplasm) * coreCyto);

    vec3 zc = vec3(defocusAxis) + uChroma;
    vec3 halo = uHalo * max(zc * lapIn, vec3(0.0)) * step(innerAll, 1e-4);

    if (outer < 1e-4 && abs(lapCell) < 1e-4 && halo.g < 1e-4) discard;

    // --- The phase. --------------------------------------------------------
    //
    // ΔI/I = −Δz·∇²(optical path), for the cell at each channel's own focus
    // and for each small body at its own depth. The plastid and the droplets
    // are thick, strong phase objects, past where the first-order equation
    // holds, so each of their terms saturates on its own (as the droplets of
    // the thraustochytrid field do): unbounded, the plastid's margin printed
    // as a black outline and every droplet near focus as a blot.
    //
    // And the further from focus, the less of it is trusted. The equation is
    // the limit of small defocus; a cell ten micrometres out, lit through a
    // condenser cone, does not ring with the contrast it predicts — its
    // fringes spread and fade, and what is left is a soft shadow with a pale
    // margin. Unbounded, every cell far from focus came out striped along its
    // length with the bright and dark bands of its wall, its core and its
    // plastid. So each term saturates at a level that falls with the cell's
    // distance from focus, over uTieFade micrometres.
    float fade = inversesqrt(1.0 + (defocusAxis * defocusAxis) / (uTieFade * uTieFade));
    float limCell = uTieLimit * fade;
    float limPlas = uPlastidLimit * fade;
    vec3 tie = limCell * tanh(uTie * (zc * (lapCell + lapAlong)
      + dN * nucleus.y * ${f3(N_NUCLEUS - N_CYTOPLASM)}) / limCell);
    vec3 plastidTie = limPlas * tanh(uTie * zc * lapPlastid / limPlas);
    float dropTie = d0 * drop0.y + d1 * drop1.y + d2 * drop2.y + d3 * drop3.y + d4 * drop4.y;
    dropTie = uDropLimit * tanh(uTie * dropTie * ${f3(N_DROPLET - N_CYTOPLASM)} / uDropLimit);

    // Light bent out of the objective's cone at a steep margin, which no
    // amount of focusing brings back: a ray is deviated by the slope of the
    // optical path it crosses, and one deviated by more than the objective
    // accepts does not arrive. At this aperture that happens only where the
    // line of sight grazes the wall — the thin contour every cell keeps in
    // focus. As in the thraustochytrid field.
    float edge = clamp(abs(slopeCell) * lenEff / ${f3(0.5 * NA)}, 0.0, 1.0);
    edge *= edge;
    float drops = drop0.x + drop1.x + drop2.x + drop3.x + drop4.x;
    float deviated = 1.0 - exp(-(uEdge * edge + uScatter * (pigment + 0.6 * drops + outer * 0.03)));

    #ifdef OBLIQUE
      gl_FragColor = vec4(uObliqueColor * transmittance * deviated, 1.0);
      return;
    #endif

    transmittance *= 1.0 - deviated;
    transmittance *= 1.0 - tie;
    transmittance *= 1.0 - plastidTie;
    transmittance *= 1.0 - dropTie;
    transmittance *= 1.0 + min(uTie * halo, vec3(limCell));
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    gl_FragColor = vec4(clamp(transmittance, 0.0, 2.2), 1.0);
  }
`

const Q = new THREE.Vector3()
const P1 = new THREE.Vector3()
const AXIS = new THREE.Vector3()

export default function PennateField({ form, focus, optics = {} }) {
  const { cells } = useMemo(() => buildPennates(form), [form])
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const size = useThree((s) => s.size)

  // One instanced quad per cell, its anatomy written once: nothing on this
  // slide moves.
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1)
    const n = Math.max(1, cells.length)
    const attribute = (fill) => {
      const data = new Float32Array(n * 4)
      cells.forEach((c, i) => data.set(fill(c), i * 4))
      return new THREE.InstancedBufferAttribute(data, 4)
    }
    const drop = (d) => (d ? [d.u, d.r] : [0, 0])
    plane.setAttribute('aCentre', attribute((c) => [c.x, c.y, c.z, c.shape.H]))
    plane.setAttribute('aAxis', attribute((c) => {
      AXIS.set(0, 1, 0).applyQuaternion(c.q)
      return [AXIS.x, AXIS.y, AXIS.z, c.wall]
    }))
    plane.setAttribute('aSide', attribute((c) => {
      P1.set(1, 0, 0).applyQuaternion(c.q)
      return [P1.x, P1.y, P1.z, c.bend]
    }))
    plane.setAttribute('aShape', attribute((c) => [c.shape.B, c.shape.Rb, c.shape.ra, c.shape.rt]))
    plane.setAttribute('aPlastid', attribute((c) => [c.plastid.o, c.plastid.a, c.plastid.b, c.plastid.L]))
    plane.setAttribute('aPlastid2', attribute((c) => [c.plastid.u, c.plastid.pinch, c.density, c.morph === 'oval' ? 1 : 0]))
    // Nine attributes of our own is the budget: three.js declares position,
    // normal, uv and the four columns of instanceMatrix in every instanced
    // shader, and SwiftShader counts declared attributes against its sixteen.
    plane.setAttribute('aBodies', attribute((c) => [c.nucleus.x, c.nucleus.r, ...drop(c.droplets[4])]))
    plane.setAttribute('aDrops0', attribute((c) => [...drop(c.droplets[0]), ...drop(c.droplets[1])]))
    plane.setAttribute('aDrops1', attribute((c) => [...drop(c.droplets[2]), ...drop(c.droplets[3])]))
    return plane
  }, [cells])
  useEffect(() => () => geometry.dispose(), [geometry])

  const materials = useMemo(() => {
    const illumination = optics.illumination
    const band = form.band ?? [0.14, 0.14, 0.14]
    const weak = form.bandWeak ?? [0.13, 0.13, 0.13]
    const build = (scattered) =>
      new THREE.ShaderMaterial({
        defines: scattered ? { OBLIQUE: '' } : {},
        uniforms: {
          uRight: { value: new THREE.Vector3(1, 0, 0) },
          uUp: { value: new THREE.Vector3(0, 1, 0) },
          uForward: { value: new THREE.Vector3(0, 0, -1) },
          uFocus: { value: 1 },
          uTanAlpha: { value: optics.tanAlpha ?? 0.2 },
          uAiry: { value: optics.airyUm ?? 0.09 },
          uPxPerUm: { value: 8 },
          uPigment: { value: absorbFrom(form.colour, band, weak) },
          uBand: { value: new THREE.Vector3(...band) },
          uBandWeak: { value: new THREE.Vector3(...weak) },
          // One micrometre of plastid is one unit of the measured colour.
          uPerUm: { value: 1 },
          uCytoplasm: { value: 0.01 },
          // Light bent out of the objective's cone at the steepest part of a
          // margin, as in the haptophyte field.
          uEdge: { value: 0.4 },
          uScatter: { value: 0.05 },
          uVeil: { value: 0.02 },
          // The transport-of-intensity equation with its own coefficient,
          // which is one — see the haptophyte field — and where it stops being
          // trusted.
          uTie: { value: 1 },
          uTieLimit: { value: 0.6 },
          // A lipid droplet half a micrometre across is a strong lens, past
          // first order; its share saturates here.
          uDropLimit: { value: form.droplets?.phaseLimit ?? 0.3 },
          // The plastid's own term saturates here: a plate two micrometres
          // thick is a strong phase object.
          uPlastidLimit: { value: 0.25 },
          // The finest step the curvatures are taken on: the objective's
          // resolution (RESOLUTION_UM in pennate.js). The pupil passes nothing
          // finer, and on this step the arms' margins come out as measured on
          // the micrograph (r111): about 0.9 of the field at the wall and 1.1
          // just outside it, within a micrometre of focus.
          uWallBlur: { value: RESOLUTION_UM },
          // Over how many micrometres from focus the phase terms lose half
          // their ceiling, near enough; see the note in the shader.
          uTieFade: { value: 3 },
          // How much of a dark band comes back as its first fringe.
          uHalo: { value: 0.45 },
          uChroma: { value: new THREE.Vector3(...(optics.axialChromaUm ?? [0, 0, 0])) },
          uObliqueColor: { value: obliqueBeam(illumination) },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        blending: scattered ? THREE.AdditiveBlending : THREE.MultiplyBlending,
        premultipliedAlpha: !scattered,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      })
    return { body: build(false), bodyOblique: build(true) }
  }, [form, optics.tanAlpha, optics.airyUm, optics.axialChromaUm, optics.illumination])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  const layers = useMemo(() => {
    const count = Math.max(1, cells.length)
    return createLayers(
      [new THREE.InstancedMesh(geometry, materials.body, count)],
      [new THREE.InstancedMesh(geometry, materials.bodyOblique, count)],
    )
  }, [geometry, materials, cells.length])
  useEffect(() => () => disposeLayers(layers), [layers])

  useFrame((state) => {
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
