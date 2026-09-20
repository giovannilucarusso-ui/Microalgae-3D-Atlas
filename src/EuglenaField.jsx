// A field of euglenoids: one screen-facing quad per cell, and the fragment
// shader works out what the objective makes of the organism behind it.
//
// The optics are the microscope's — the band model, the diffraction floor under
// the blur, the two Rheinberg beams, the contour from the optical-path gradient
// — but the way the defocus is computed is not the one CellField2D uses, and the
// reason is what a Euglena field looks like.
//
// **The first version sent rays through the aperture**, as the coccoid field
// does: a handful of taps per pixel, each tracing the body. For a five-micrometre
// Chlorella that is affordable and the taps cover the blur. A Euglena is fifty
// micrometres long in a mount eighty deep, so most of the field is cells tens of
// micrometres from focus, blurred over discs far wider than a dozen taps can
// fill — and an undersampled aperture does not give a soft cell, it gives two or
// three sharp copies of it. That was the doubled outline on every cell of the
// first render, and in a crowded culture it was most of the picture.
//
// **So the blur is integrated rather than sampled.** Across its long axis a
// spindle is a circle, and the chord a ray cuts through a circle is
// 2·√(R² − c²), whose average over any interval has a closed form. A disc of
// blur seen edge-on is, to its second moment, a box a little narrower than
// itself, so the thickness of a defocused cell at a pixel is that average over
// the box — exact across the cell, mass-conserving, and smooth at any blur.
// Along the axis the body changes slowly except at its two ends, and five
// binomial samples carry that. Nothing is ever duplicated, because nothing is
// ever sampled at a few discrete places.
//
// **The inside is drawn as three slices**: the plastids under the near pellicle,
// the cytoplasm in the middle, and the plastids under the far pellicle — each
// blurred by its *own* distance from the plane of focus. A cell ten
// micrometres thick is several depths of field thick, and that is what makes
// racking through one worth doing: the near layer of plates sharpens and then
// dissolves while the far one comes up behind it.
//
// **And under DIC, the relief is the slope of the optical path**, which the
// model above hands over analytically. See `relief` on the DIC entry in
// microscope.js.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { RESOLUTION_UM, buildEuglena } from './euglenoid.js'
import {
  CHORD_GLSL,
  LayerComposite,
  absorbFrom,
  createLayers,
  directBeam,
  disposeLayers,
  drawLayers,
  obliqueBeam,
  shearOf,
  transfer,
} from './twoBeam.jsx'

// Refractive indices, as in the coccoid field: the reason anything unstained is
// visible at all, and measured rather than chosen.
const N_MEDIUM = 1.335
const N_CYTOPLASM = 1.36
const N_PLASTID = 1.415
// Paramylon is solid β-1,3-glucan and is markedly denser than the starch of a
// green alga — which is why a granule is the brightest thing in a Euglena and
// more conspicuous than a starch grain in a Chlorella of the same size.
const N_PARAMYLON = 1.53
// The carotenoid granules of the stigma and the axoneme of the flagellum, both
// dense protein-and-pigment matter.
const N_STIGMA = 1.45
const N_FLAGELLUM = 1.42

const VERTEX = /* glsl */ `
  attribute vec4 aCentre;  // position, roll about the long axis at t = 0
  attribute vec4 aQuat;
  attribute vec4 aCell;    // half length, half width, density, flagellum length (µm)
  attribute vec4 aMotion;  // metaboly amplitude, phase, rate, texture seed
  attribute vec4 aSwim;    // speed (µm/s), spin (rad/s), wobble (rad), turn (rad/s)
  attribute vec4 aStigma;  // x, u, z as fractions of the body, radius
  attribute vec4 aNucleus;
  attribute vec4 aGrains;  // u and radius of each of the two large paramylon grains

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uFocus;
  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;
  uniform float uTime;
  uniform vec2 uStage;
  uniform vec2 uTile;

  varying vec3 vC;
  varying vec3 vA;
  varying vec3 vP1;
  varying vec3 vP2;
  varying vec4 vCell;
  varying vec4 vMeta;
  varying vec2 vLocal;
  varying vec4 vStigma;
  varying vec4 vNucleus;
  varying vec4 vGrainA;
  varying vec4 vGrainB;
  varying float vDefocus;

  vec3 rotate(vec4 q, vec3 v) {
    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
  }

  vec3 turnZ(vec3 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z);
  }

  void main() {
    float t = uTime;
    vec3 axis = rotate(aQuat, vec3(0.0, 1.0, 0.0));
    vec3 side = rotate(aQuat, vec3(1.0, 0.0, 0.0));
    vec3 over = rotate(aQuat, vec3(0.0, 0.0, 1.0));

    // Where it has swum to. Parallel to the slide — see orientation() in
    // euglenoid.js — along a heading that turns at a steady rate, so the
    // track is an arc; the integral of a turning unit vector is closed-form.
    vec2 heading = axis.xy;
    float hl = length(heading);
    heading = hl > 1e-4 ? heading / hl : vec2(1.0, 0.0);
    float k = aSwim.w;
    vec2 travel;
    if (abs(k) > 1e-3) {
      float sk = sin(k * t);
      float ck = 1.0 - cos(k * t);
      travel = vec2(sk * heading.x - ck * heading.y, ck * heading.x + sk * heading.y) / k;
    } else {
      travel = heading * t;
    }
    vec3 C = aCentre.xyz + vec3(travel * aSwim.x, 0.0);

    // Wrapped round the block of culture, centred on the stage: a cell leaving
    // on one side comes back on the other, where nobody is looking.
    vec2 rel = C.xy - uStage;
    rel = mod(rel + 0.5 * uTile, uTile) - 0.5 * uTile;
    C.xy = uStage + rel;

    // Which way it faces now. Turned with its track, rolled about its own long
    // axis, and with the axis tipped towards the rolling side — so as the cell
    // spins its front end circles the line of travel, which is the wobble a
    // swimming Euglena has.
    float turn = k * t;
    vec3 A = turnZ(axis, turn);
    vec3 S = turnZ(side, turn);
    vec3 O = turnZ(over, turn);
    float roll = aCentre.w + aSwim.y * t;
    vec3 S2 = S * cos(roll) + O * sin(roll);
    vec3 O2 = O * cos(roll) - S * sin(roll);
    float wb = aSwim.z;
    vec3 A3 = A * cos(wb) + S2 * sin(wb);
    vec3 S3 = S2 * cos(wb) - A * sin(wb);

    vec4 view = modelViewMatrix * vec4(C, 1.0);
    float defocus = -view.z - uFocus;

    float L = aCell.x;
    float W = aCell.y * (1.0 + 0.32 * aMotion.x);
    vec2 a2 = vec2(dot(A3, uRight), dot(A3, uUp));
    float len2 = length(a2);
    vec2 dirA = len2 > 1e-3 ? a2 / len2 : vec2(1.0, 0.0);
    vec2 dirP = vec2(-dirA.y, dirA.x);

    // The quad hugs the cell: long along its projected axis, narrow across it,
    // and grown by the largest blur any part of it can have. A square quad
    // round a spindle is mostly empty pixels, and every one of them runs the
    // shader.
    float reachDepth = L * abs(dot(A3, uForward)) + W;
    float worst = abs(defocus) + reachDepth;
    float spread = worst * uTanAlpha;
    float blur = sqrt(uAiry * uAiry + spread * spread);
    float margin = blur * 1.1 + 3.0 / max(uPxPerUm, 1e-3);
    float lenEff = max(len2, 0.3);
    float back = L * lenEff + W * sqrt(max(0.0, 1.0 - len2 * len2)) + margin;
    float front = back + aCell.w * lenEff + 2.0;
    float across = W + margin + 2.0;

    vec2 corner = dirA * mix(-back, front, position.x + 0.5) + dirP * (position.y * 2.0 * across);

    vC = C;
    vA = A3;
    vP1 = S3;
    vP2 = O2;
    vCell = aCell;
    vMeta = vec4(aMotion.x, aMotion.y + t * aMotion.z, aMotion.w, 0.0);
    vLocal = corner;
    vStigma = aStigma;
    vNucleus = aNucleus;
    // The grains flank the nucleus, one ahead and one behind, at some angle
    // round the axis that only needs to differ from cell to cell.
    float around = aMotion.w * 2.39996;
    vGrainA = vec4(cos(around) * 0.45, aGrains.x, sin(around) * 0.45, aGrains.y);
    vGrainB = vec4(-sin(around) * 0.45, aGrains.z, cos(around) * 0.45, aGrains.w);
    vDefocus = defocus;

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
  uniform float uBand;
  uniform vec3 uBandWeak;
  uniform vec3 uStigmaAbsorb;
  uniform float uCytoplasm;
  uniform float uPerUm;
  uniform float uFill;
  uniform float uPlateUm;
  uniform float uGrainUm;
  uniform float uPlateContrast;
  uniform float uGrainContrast;
  uniform float uGranule;
  uniform float uStripUm;
  uniform float uStripMtf;
  uniform float uStripOpd;
  uniform float uStripTwist;
  uniform float uEdge;
  uniform float uScatter;
  uniform float uVeil;
  uniform float uPhase;
  uniform float uRelief;
  uniform vec2 uShear;
  uniform vec3 uDirect;
  uniform vec3 uObliqueColor;

  varying vec3 vC;
  varying vec3 vA;
  varying vec3 vP1;
  varying vec3 vP2;
  varying vec4 vCell;
  varying vec4 vMeta;
  varying vec2 vLocal;
  varying vec4 vStigma;
  varying vec4 vNucleus;
  varying vec4 vGrainA;
  varying vec4 vGrainB;
  varying float vDefocus;

  // The body's radius at a point along its axis, as a multiple of the half
  // width. u runs -1 at the posterior tip to +1 at the anterior.
  //
  // Each piece is a sentence from the description. Widest a little forward of
  // the middle. *Rounded in front*: a blunt cap, steep at the very end, rather
  // than an ellipse drawn out to a point. *Drawn to a point behind*: a long
  // taper that goes concave near the end, so the last few micrometres are a
  // thin colourless spike — the hyaline tail every plate of this species shows.
  // And a travelling wave of swelling on top, for metaboly.
  float profile(float u) {
    const float M = 0.28;
    float r;
    if (u >= M) {
      float x = clamp((u - M) / (1.0 - M), 0.0, 1.0);
      r = sqrt(max(0.0, 1.0 - pow(max(x, 1e-6), 2.6)));
    } else {
      float s = clamp((M - u) / (1.0 + M), 0.0, 1.0);
      r = sqrt(max(0.0, 1.0 - s * s)) * pow(max(1.0 - s, 1e-4), 0.45 * s);
    }
    float wave = 1.0 + vMeta.x * 0.32 * sin(3.4 * u - vMeta.y);
    return r * wave;
  }

  ${CHORD_GLSL}

  // Value noise with its gradient. The lattice index is hashed as an integer
  // would be — small, positive coordinates, well inside float precision.
  float hash3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  vec4 noised(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    vec3 u = f * f * (3.0 - 2.0 * f);
    vec3 du = 6.0 * f * (1.0 - f);
    float a = hash3(i);
    float b = hash3(i + vec3(1.0, 0.0, 0.0));
    float c = hash3(i + vec3(0.0, 1.0, 0.0));
    float d = hash3(i + vec3(1.0, 1.0, 0.0));
    float e = hash3(i + vec3(0.0, 0.0, 1.0));
    float f1 = hash3(i + vec3(1.0, 0.0, 1.0));
    float g = hash3(i + vec3(0.0, 1.0, 1.0));
    float h = hash3(i + vec3(1.0, 1.0, 1.0));
    float k1 = b - a;
    float k2 = c - a;
    float k3 = e - a;
    float k4 = a - b - c + d;
    float k5 = a - c - e + g;
    float k6 = a - b - e + f1;
    float k7 = -a + b + c - d + e - f1 - g + h;
    float v = a + k1 * u.x + k2 * u.y + k3 * u.z + k4 * u.x * u.y + k5 * u.y * u.z
      + k6 * u.z * u.x + k7 * u.x * u.y * u.z;
    vec3 grad = du * vec3(
      k1 + k4 * u.y + k6 * u.z + k7 * u.y * u.z,
      k2 + k5 * u.z + k4 * u.x + k7 * u.z * u.x,
      k3 + k6 * u.x + k5 * u.y + k7 * u.x * u.y);
    return vec4(v, grad);
  }

  // Squared by hand, never with pow(): pow of a negative base is undefined in
  // GLSL, and a defocus is negative on the near side of the plane — which on
  // ANGLE came back as NaN and printed the whole near half of the culture as
  // black speckle.
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  // Beads: at most one granule in each cell of a lattice, jittered, of varied
  // size and sometimes absent, each a smooth round bump — and the gradient of
  // the whole field, for the relief. Value noise was tried first and thresholded
  // into blobs; its lattice showed through as square, wormy grains lined up
  // with the axes, which no cytoplasm has ever looked like.
  //
  // Eight cells are searched, not twenty-seven. A granule's centre is kept
  // at least 0.15 of a cell from its walls and its radius under 0.46, so it
  // reaches at most 0.31 into a neighbour — and a point in the near half of
  // its cell can only be touched from that side. The two cells per axis that
  // can reach it are therefore known before looking, and the other nineteen
  // were hashed for nothing on every pixel of every cell in focus.
  vec4 beads(vec3 x, float radius) {
    vec3 i = floor(x);
    vec3 f = x - i;
    vec3 lo = step(0.5, f) - 1.0;
    float v = 0.0;
    vec3 grad = vec3(0.0);
    for (int a = 0; a < 2; a++) {
      for (int b = 0; b < 2; b++) {
        for (int c = 0; c < 2; c++) {
          vec3 cell = lo + vec3(float(a), float(b), float(c));
          vec3 h = hash33(i + cell);
          if (h.z < 0.12) continue;
          vec3 dv = f - (cell + 0.15 + 0.7 * h);
          float r = min(radius * (0.55 + 0.6 * fract(h.x * 7.13 + h.y * 3.71)), 0.46);
          float d2 = dot(dv, dv);
          if (d2 >= r * r) continue;
          float q = 1.0 - d2 / (r * r);
          v += q * q;
          grad -= 4.0 * q * dv / (r * r);
        }
      }
    }
    return vec4(v, grad);
  }

  float blurAt(float defocus, float pixel) {
    float spread = defocus * uTanAlpha;
    return sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
  }

  // A small body inside the cell — nucleus, paramylon grain, stigma — imaged
  // as a Gaussian whose width is its own size and its own blur added in
  // quadrature, at its own depth. The peak falls as the blur spreads it, so
  // what the body holds is conserved; the gradient comes back for the relief.
  // stretch > 0 elongates it along the cell, for a rod.
  float organelle(vec4 b, vec2 p, float L, float W, vec2 dirA, float len2, float stretch,
                  float pixel, out vec2 grad) {
    grad = vec2(0.0);
    if (b.w <= 0.0) return 0.0;
    float ru = profile(clamp(b.y, -0.95, 0.95)) * W;
    vec3 off = vP1 * (b.x * ru) + vA * (b.y * L) + vP2 * (b.z * ru);
    vec2 at = vec2(dot(off, uRight), dot(off, uUp));
    float depth = dot(off, uForward);
    float bl = blurAt(vDefocus + depth, pixel);
    float r = b.w;
    float along = stretch > 0.0 ? r * max(len2, 0.3) : r;
    float across = stretch > 0.0 ? r * stretch : r;
    float sa = 0.4 * along * along + 0.5 * bl * bl;
    float sc = 0.4 * across * across + 0.5 * bl * bl;
    vec2 d = p - at;
    vec2 dirP = vec2(-dirA.y, dirA.x);
    float da = dot(d, dirA);
    float dc = dot(d, dirP);
    float amp = sqrt((0.4 * along * along) / sa) * sqrt((0.4 * across * across) / sc);
    float g = amp * exp(-0.5 * (da * da / sa + dc * dc / sc));
    grad = -g * (dirA * (da / sa) + dirP * (dc / sc));
    return g;
  }

  void main() {
    float L = vCell.x;
    float W = vCell.y;
    vec2 a2 = vec2(dot(vA, uRight), dot(vA, uUp));
    float len2 = length(a2);
    vec2 dirA = len2 > 1e-3 ? a2 / len2 : vec2(1.0, 0.0);
    vec2 dirP = vec2(-dirA.y, dirA.x);
    float lenEff = max(len2, 0.3);
    float along = dot(vLocal, dirA);
    float c = dot(vLocal, dirP);
    float pixel = 0.6 / max(uPxPerUm, 1e-3);

    // How far this part of the axis is from the plane of focus. A cell lying
    // tilted is sharp at one end and soft at the other, which the reference
    // shows over and over and a single blur per cell could not.
    float axial = clamp(along / lenEff, -L * 1.1, L * 1.1);
    float defocusAxis = vDefocus + axial * dot(vA, uForward);
    float blur = blurAt(defocusAxis, pixel);
    // A disc of radius b, seen edge-on, has the second moment of a box of
    // half-width b·√3/2.
    float w = max(0.866 * blur, 0.04);

    float tipAlong = L * lenEff;
    float flagLength = vCell.w * lenEff;
    float Rmax = W * (1.0 + 0.32 * vMeta.x);
    bool inFlagellum = along > tipAlong - w && along < tipAlong + flagLength + 2.0 * w;
    if (abs(c) > Rmax + 2.2 * w + 2.5 && !inFlagellum) discard;

    // --- The body: thickness along the ray, and its slope. -----------------
    float hc = 0.0;
    float hcA = 0.0;
    float hcC = 0.0;
    float hcCC = 0.0;
    float u0 = along / (L * lenEff);
    float R0 = profile(clamp(u0, -1.0, 1.0)) * W;
    if (w < 0.35) {
      // Near focus the blur along the axis is a pixel or two, and three
      // samples carry it. This is most of the in-focus cells, which are the
      // ones whose pixels also run the texture below.
      for (int i = 0; i < 3; i++) {
        float u = (along + float(i - 1) * w) / (L * lenEff);
        if (abs(u) >= 1.0) continue;
        float v = halfChord(c, profile(u) * W, w);
        hc += (i == 1 ? 0.5 : 0.25) * v;
        hcA += float(i - 1) * v;
      }
      hcA /= 2.0 * w;
    } else {
      float stepA = 0.5 * w;
      for (int i = 0; i < 5; i++) {
        float u = (along + float(i - 2) * stepA) / (L * lenEff);
        if (abs(u) >= 1.0) continue;
        float v = halfChord(c, profile(u) * W, w);
        float wt = i == 2 ? 0.375 : (i == 1 || i == 3 ? 0.25 : 0.0625);
        float dk = i == 0 ? -1.0 : (i == 1 ? -2.0 : (i == 3 ? 2.0 : (i == 4 ? 1.0 : 0.0)));
        hc += wt * v;
        hcA += dk * v;
      }
      hcA /= 4.0 * w;
    }
    // Outside the blurred body there is nothing left to draw but the
    // flagellum, and nothing below is worth running for it.
    if (hc <= 0.0 && hcA == 0.0 && !inFlagellum) discard;
    if (abs(u0) < 1.0) {
      hcC = halfChordSlope(c, R0, w);
      if (uRelief <= 0.0 && uPhase > 0.0) hcCC = halfChordCurve(c, R0, w);
    }
    float chord = 2.0 * hc / lenEff;
    float chordA = 2.0 * hcA / lenEff;
    float chordC = 2.0 * hcC / lenEff;

    // The shear direction, in screen and in the cell's own frame.
    vec2 shear = uShear;
    float shA = dot(shear, dirA);
    float shC = dot(shear, dirP);
    vec3 shWorld = uRight * shear.x + uUp * shear.y;
    vec3 shLocal = vec3(dot(shWorld, vP1), dot(shWorld, vA), dot(shWorld, vP2));
    float dChord = chordA * shA + chordC * shC;

    // --- The plastids and granules, slice by slice. ------------------------
    //
    // Euglena's plastids are many, and the cytoplasm between them is packed
    // with paramylon granules, so a cell in focus is mottled rather than
    // evenly green. Neither is drawn body by
    // body: a dozen plates and a hundred granules would be a dozen and a
    // hundred intersections per pixel. They are a texture in the cell's own
    // frame — so it rolls with the cell — at the measured plate and granule
    // sizes, and each slice's texture is attenuated by that slice's own blur
    // exactly as a disc of that size would be. Out of focus, a slice
    // contributes its average and nothing else, which is the right answer.
    float fillSoft = w / (L * lenEff);
    float fill = uFill
      * smoothstep(-0.9 - fillSoft, -0.6 + fillSoft, u0)
      * (1.0 - 0.45 * smoothstep(0.78 - fillSoft, 1.0 + fillSoft, u0));

    float mottle = 0.0;
    float mottleShear = 0.0;
    float granule = 0.0;
    float granuleShear = 0.0;
    float ribShear = 0.0;
    vec3 rel = uRight * vLocal.x + uUp * vLocal.y;
    vec3 o = vec3(dot(rel, vP1), dot(rel, vA), dot(rel, vP2));
    vec3 d = vec3(dot(uForward, vP1), dot(uForward, vA), dot(uForward, vP2));
    float qa = d.x * d.x + d.z * d.z;
    float qb = o.x * d.x + o.z * d.z;
    float qc = o.x * o.x + o.z * o.z - R0 * R0;
    float disc = qb * qb - qa * qc;
    if (disc > 0.0 && qa > 1e-3 && abs(u0) < 1.0) {
      float sq = sqrt(disc);
      float t0 = (-qb - sq) / qa;
      float t1 = (-qb + sq) / qa;
      float shell = min(0.9, 0.25 * (t1 - t0));
      vec3 seed = vec3(vMeta.z, vMeta.z * 0.37, vMeta.z * 0.71);
      for (int k = 0; k < 3; k++) {
        float tk = k == 0 ? t0 + shell : (k == 1 ? 0.5 * (t0 + t1) : t1 - shell);
        float bk = blurAt(vDefocus + tk, pixel);
        vec3 Q = o + d * tk;
        float weight = k == 1 ? 0.55 : 0.5;
        float plateBlur = 2.2 * bk / uPlateUm;
        float grainBlur = 2.2 * bk / uGrainUm;
        float plateVis = exp(-plateBlur * plateBlur);
        float grainVis = exp(-grainBlur * grainBlur);
        if (plateVis > 0.01) {
          vec4 n = noised(Q / uPlateUm + seed);
          float p = smoothstep(0.3, 0.7, n.x);
          float dp = 6.0 * (n.x - 0.3) * (0.7 - n.x) / 0.064;
          dp = n.x > 0.3 && n.x < 0.7 ? dp : 0.0;
          mottle += weight * plateVis * uPlateContrast * (p - 0.5) * 2.0;
          mottleShear += weight * plateVis * uPlateContrast * 2.0 * dp * dot(n.yzw, shLocal) / uPlateUm;
        }
        if (grainVis > 0.01) {
          // The small paramylon granules: sparse, a micrometre or two across,
          // and far more refractile than anything round them. They hold no
          // plastid, so they lighten the green a little — but what makes them
          // read is their optical path, which under DIC turns each one into a
          // tiny bright-and-shadowed bead. That is the fine grain of every cell
          // in focus in the reference, and a smooth mottle of pigment is not.
          // One lattice cell holds room for a granule and its neighbourhood.
          float spacing = uGrainUm * 1.25;
          vec4 n = beads(Q / spacing + seed.zxy + 11.0, 0.5 / 1.25);
          float g = min(n.x, 1.0);
          float slope = (n.x < 1.0 ? 1.0 : 0.0) * dot(n.yzw, shLocal) / spacing;
          granule += weight * grainVis * g;
          granuleShear += weight * grainVis * slope;
          mottle -= weight * grainVis * uGrainContrast * (g - 0.25);
          mottleShear -= weight * grainVis * uGrainContrast * slope;
        }
        if (k != 1) {
          // The pellicle strips, on the near and far surfaces. They run the
          // length of the cell in a shallow helix, so there is a whole number
          // of them round it and they converge towards the two ends.
          //
          // At 240 nm groove to groove against a limit of 220 nm, the objective
          // passes them at the contrast its transfer function has that close to
          // cut-off — about three per cent — and then the pixel and the defocus
          // take their share as they do of any texture. At the working zoom that
          // leaves nothing, which is right; closed in on a cell in focus, a
          // faint ribbing comes and goes with the fine focus, which is what the
          // card says a real one does.
          float focusBlur = sqrt(max(bk * bk - uAiry * uAiry, 0.0));
          float ribBlur = 2.2 * focusBlur / uStripUm;
          float ribVis = uStripMtf * exp(-ribBlur * ribBlur);
          if (ribVis > 1e-3) {
            float strips = floor(6.2832 * vCell.y / uStripUm + 0.5);
            float r2 = max(Q.x * Q.x + Q.z * Q.z, 1e-4);
            float phase = strips * atan(Q.z, Q.x) + uStripTwist * Q.y;
            float dTheta = (Q.x * shLocal.z - Q.z * shLocal.x) / r2;
            ribShear += 0.5 * ribVis * uStripOpd * cos(phase) * (strips * dTheta + uStripTwist * shLocal.y);
          }
        }
      }
    }

    // --- Nucleus, paramylon, stigma. ---------------------------------------
    vec2 gN, gGa, gGb, gS;
    float nucleus = organelle(vNucleus, vLocal, L, W, dirA, len2, 0.0, pixel, gN);
    float grainA = organelle(vGrainA, vLocal, L, W, dirA, len2, 0.42, pixel, gGa);
    float grainB = organelle(vGrainB, vLocal, L, W, dirA, len2, 0.42, pixel, gGb);
    float stigmaG = organelle(vStigma, vLocal, L, W, dirA, len2, 0.0, pixel, gS);

    // The nucleus and the grains hold no plastid, so a ray through them
    // crosses less pigment.
    float holes = (1.0 - 0.5 * nucleus) * (1.0 - 0.45 * grainA) * (1.0 - 0.45 * grainB);
    float dHoles = dot(shear,
      -0.5 * gN * (1.0 - 0.45 * grainA) * (1.0 - 0.45 * grainB)
      - 0.45 * gGa * (1.0 - 0.5 * nucleus) * (1.0 - 0.45 * grainB)
      - 0.45 * gGb * (1.0 - 0.5 * nucleus) * (1.0 - 0.45 * grainA));

    float mottled = max(0.0, 1.0 + mottle);
    float pigment = chord * fill * mottled * holes;
    float dPigment = fill * (dChord * mottled * holes + chord * mottleShear * holes + chord * mottled * dHoles);

    float glucan = 0.8 * (vGrainA.w * grainA + vGrainB.w * grainB);
    // The granules count towards the optical path and nothing else: their
    // texture is only there near focus, and a cell must not scatter more light
    // for being in focus than out of it.
    float dGlucan = 0.8 * (vGrainA.w * dot(gGa, shear) + vGrainB.w * dot(gGb, shear)) + uGranule * granuleShear;
    float stigma = 1.6 * vStigma.w * stigmaG;
    float dStigma = 1.6 * vStigma.w * dot(gS, shear);

    // --- The flagellum. -----------------------------------------------------
    //
    // Beating at tens of hertz, so what an exposure records is not the curve
    // but where the curve spends its time: a sinusoid of amplitude A sits at x
    // with density 1/(π√(A² − x²)), and averaged over the blur that has a
    // closed form too. The envelope widens from the base towards the tip. At
    // the thickness of an axoneme this is barely there, which is the point.
    float flagellum = 0.0;
    float dFlagellum = 0.0;
    if (inFlagellum && flagLength > 0.0) {
      float s = along - tipAlong;
      float env = 1.0 + 5.0 * clamp(s / flagLength, 0.0, 1.0);
      float lo = clamp((c - w) / env, -1.0, 1.0);
      float hi = clamp((c + w) / env, -1.0, 1.0);
      float density = (asin(hi) - asin(lo)) / (3.14159265 * 2.0 * w);
      float along01 = smoothstep(-w, 0.5, s) * (1.0 - smoothstep(flagLength - 2.0, flagLength + w, s));
      flagellum = 0.13 * density * along01;
      float loS = abs(c - w) < env ? 1.0 / sqrt(env * env - (c - w) * (c - w) + 1e-3) : 0.0;
      float hiS = abs(c + w) < env ? 1.0 / sqrt(env * env - (c + w) * (c + w) + 1e-3) : 0.0;
      dFlagellum = 0.13 * along01 * (hiS - loS) / (3.14159265 * 2.0 * w) * shC;
    }

    if (chord < 1e-3 && stigma < 1e-3 && flagellum < 1e-4) discard;

    // --- Optical path, and what the instrument makes of it. ----------------
    float dOpd = dChord * ${(N_CYTOPLASM - N_MEDIUM).toFixed(3)}
      + dPigment * ${(N_PLASTID - N_CYTOPLASM).toFixed(3)}
      + dGlucan * ${(N_PARAMYLON - N_CYTOPLASM).toFixed(3)}
      + dStigma * ${(N_STIGMA - N_CYTOPLASM).toFixed(3)}
      + dFlagellum * ${(N_FLAGELLUM - N_MEDIUM).toFixed(3)}
      + ribShear;

    // Absorption, over a band — chlorophyll a and b, so the same model and the
    // same argument as the coccoid field.
    vec3 x = uPigment * (pigment * uPerUm * vCell.z);
    vec3 transmittance = mix(exp(-x), exp(-x * uBandWeak), uBand);
    // The stigma is the one pigment in this atlas that is not a chlorophyll: a
    // patch of carotenoid, which absorbs where the plastids transmit. That is
    // why it reads as a hot orange spot rather than as a dark one.
    transmittance *= exp(-uStigmaAbsorb * stigma);
    transmittance *= exp(-vec3(uCytoplasm) * (chord + glucan * 0.4));

    // The margin, from how steeply the thickness changes across it — the same
    // quantity the old renderer read off the surface normal, now bounded by
    // the blur instead of by a guess at it.
    float edge = clamp(abs(chordC) * lenEff * 0.09, 0.0, 1.0);
    edge *= edge;

    // What the cell deviates into the objective. The body scatters in bulk —
    // plates, granules, the carotenoid of the stigma — and the margin refracts.
    //
    // From the pigment *before* the mottle, and that is a correction. Read off
    // the mottled pigment, a plate darkened the direct beam and brightened the
    // deviated one by nearly the same amount, the two cancelled, and a cell in
    // focus came out as smooth as glass. A granule field scatters on average
    // what a smooth one does; where the grains are is carried by the
    // absorption and by the relief.
    float smoothPigment = chord * fill * holes;
    float deviated = 1.0 - exp(-(uEdge * edge
      + uScatter * (smoothPigment + glucan * 1.5 + stigma * 2.0 + chord * 0.09)));

    // Differential interference contrast: the slope of the optical path along
    // the shear, as a brightening on one side of every gradient and a shadow
    // on the other. Zero under every filter but DIC.
    //
    // It modulates *all* the light that reaches the pixel. Applied to the
    // direct beam alone it was invisible on the cells, whose light is mostly
    // the deviated beam — the relief showed on the empty field and nowhere a
    // viewer was looking.
    float relief = clamp(uRelief * dOpd, -0.92, 4.0);

    #ifdef OBLIQUE
      vec3 scattered = uObliqueColor * transmittance * deviated * (1.0 + relief);
      // The bright side of the relief on the direct beam is light added to the
      // field, so it is added here rather than multiplied in the other pass —
      // where two overlapping rims would have compounded into white.
      vec3 raised = uDirect * transmittance * (1.0 - deviated) * max(relief, 0.0);
      gl_FragColor = vec4(scattered + raised, 1.0);
      return;
    #endif

    transmittance *= exp(-uEdge * edge) * (1.0 - deviated);
    transmittance *= 1.0 + min(relief, 0.0);

    // The phase, under brightfield and Rheinberg. The transport-of-intensity
    // equation: the change in intensity with defocus goes as the Laplacian of
    // the phase, here across the cell, where almost all of the curvature is.
    if (uRelief <= 0.0 && uPhase > 0.0) {
      float lap = 2.0 * hcCC / lenEff * ${(N_CYTOPLASM - N_MEDIUM).toFixed(3)};
      transmittance *= 1.0 - clamp(uPhase * defocusAxis * lap, -0.22, 0.22);
    }

    // The instrument's contrast ceiling, and nothing may pass it.
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    transmittance = clamp(transmittance, 0.0, 2.2);

    gl_FragColor = vec4(transmittance, 1.0);
  }
`

export default function EuglenaField({ form, focus, optics = {}, swimming = true }) {
  const { cells, tile } = useMemo(() => buildEuglena(form), [form])
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const size = useThree((s) => s.size)
  const clock = useRef(0)

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1)
    const n = Math.max(1, cells.length)
    const attribute = (width, fill) => {
      const data = new Float32Array(n * width)
      cells.forEach((c, i) => data.set(fill(c), i * width))
      return new THREE.InstancedBufferAttribute(data, width)
    }
    plane.setAttribute('aCentre', attribute(4, (c) => [c.x, c.y, c.z, c.swim.roll]))
    plane.setAttribute('aQuat', attribute(4, (c) => [c.q.x, c.q.y, c.q.z, c.q.w]))
    plane.setAttribute(
      'aCell',
      attribute(4, (c) => [c.halfLength, c.halfWidth, c.density, c.flagellum * c.halfLength * 2]),
    )
    plane.setAttribute('aMotion', attribute(4, (c) => [c.metaboly, c.phase, c.rate, c.seed]))
    plane.setAttribute('aSwim', attribute(4, (c) => [c.swim.speed, c.swim.spin, c.swim.wobble, c.swim.turn]))
    const body = (b) => [b.x, b.u, b.z, b.r]
    plane.setAttribute('aStigma', attribute(4, (c) => body(c.stigma)))
    plane.setAttribute('aNucleus', attribute(4, (c) => body(c.nucleus)))
    plane.setAttribute(
      'aGrains',
      attribute(4, (c) => [c.grains[0].u, c.grains[0].r, c.grains[1].u, c.grains[1].r]),
    )
    return plane
  }, [cells])
  useEffect(() => () => geometry.dispose(), [geometry])

  const [material, oblique] = useMemo(() => {
    const stripUm = form.pellicle?.stripUm ?? 0.24
    const band = 0.14
    const weak = 0.13
    const illumination = optics.illumination
    const build = (scattered) =>
      new THREE.ShaderMaterial({
        defines: scattered ? { OBLIQUE: '' } : {},
        uniforms: {
          uRight: { value: new THREE.Vector3(1, 0, 0) },
          uUp: { value: new THREE.Vector3(0, 1, 0) },
          uForward: { value: new THREE.Vector3(0, 0, -1) },
          uFocus: { value: 1 },
          uTime: { value: 0 },
          uStage: { value: new THREE.Vector2() },
          uTile: { value: new THREE.Vector2(tile[0], tile[1]) },
          uTanAlpha: { value: optics.tanAlpha ?? 0.2 },
          uAiry: { value: optics.airyUm ?? 0.09 },
          uPxPerUm: { value: 8 },
          uPigment: { value: absorbFrom(form.colour ?? '#86bb59', band, weak) },
          uBand: { value: band },
          uBandWeak: { value: new THREE.Vector3(weak, weak, weak) },
          // The eyespot. Carotenoid absorbs the blue and green and passes the
          // red, which is the opposite of what the plastids do — so the numbers
          // here are large where the pigment's are small.
          uStigmaAbsorb: { value: new THREE.Vector3(0.1, 1.6, 3.0) },
          uCytoplasm: { value: 0.013 },
          // One micrometre of plastid is worth this much of a unit of the
          // measured colour.
          uPerUm: { value: 1 / 2.0 },
          // How much of a ray's path through the body is plastid, in the part
          // of the cell that has plastids. A green Euglena is packed with them.
          uFill: { value: form.plastidFraction ?? 0.5 },
          uPlateUm: { value: form.chloroplasts?.plateUm ?? 4.5 },
          uGrainUm: { value: form.paramylon?.granuleUm ?? 1.6 },
          uPlateContrast: { value: 0.75 },
          uGrainContrast: { value: 0.35 },
          // Micrometres of paramylon a ray crosses in one granule, near enough.
          uGranule: { value: 1.6 },
          uStripUm: { value: stripUm },
          uStripMtf: { value: transfer(RESOLUTION_UM / stripUm) },
          // The ridge standing a few tens of nanometres proud, in protein
          // against cytoplasm: about ten nanometres of optical path.
          uStripOpd: { value: 0.01 },
          // A shallow helix: a strip turns through about a radian over the
          // length of a cell.
          uStripTwist: { value: 0.02 },
          uEdge: { value: 0.7 },
          uScatter: { value: 0.11 },
          uVeil: { value: 0.02 },
          uPhase: { value: optics.phase ?? 0.26 },
          uRelief: { value: illumination?.relief ?? 0 },
          uShear: { value: shearOf(illumination) },
          uDirect: { value: directBeam(illumination) },
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
    return [build(false), build(true)]
  }, [form, tile, optics.tanAlpha, optics.airyUm, optics.phase, optics.illumination])
  useEffect(
    () => () => {
      material.dispose()
      oblique.dispose()
    },
    [material, oblique],
  )

  // The two buffers and the private scenes that fill them. See createLayers in
  // twoBeam.jsx.
  const layers = useMemo(() => {
    const meshA = new THREE.InstancedMesh(geometry, material, Math.max(1, cells.length))
    const meshB = new THREE.InstancedMesh(geometry, oblique, Math.max(1, cells.length))
    return createLayers([meshA], [meshB])
  }, [geometry, material, oblique, cells.length])
  useEffect(() => () => disposeLayers(layers), [layers])

  useFrame((state, delta) => {
    // The culture's own clock, which stops when swimming is switched off —
    // so a still is a still, and metaboly holds with it.
    if (swimming) clock.current += Math.min(delta, 0.1)
    const centred = camera.position.distanceTo(controls?.target ?? camera.position.clone().setZ(0))
    const plane = centred + (focus?.current ?? 0)
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * plane
    // The buffers are drawn at about one and a half pixels per CSS pixel
    // rather than at the full device resolution. On a high-density screen
    // the full resolution is four times the fragments for an image whose
    // softest part is a microscope's blur and whose sharpest is an edge the
    // shader already antialiases; measured on an integrated GPU, 0.75 of a
    // 2× buffer took the field from 18 frames a second to 24, which is the
    // Chlorella field's rate, and the difference in the picture is not one a
    // viewer can find.
    const scale = Math.min(1, Math.max(0.5, 1.5 / state.viewport.dpr))
    const perUm = (size.height * state.viewport.dpr * scale) / Math.max(2 * halfHeight, 1e-6)
    for (const m of [material, oblique]) {
      const u = m.uniforms
      camera.matrixWorld.extractBasis(u.uRight.value, u.uUp.value, u.uForward.value)
      u.uForward.value.negate()
      u.uPxPerUm.value = perUm
      u.uFocus.value = plane
      u.uTime.value = clock.current
      u.uStage.value.set(camera.position.x, camera.position.y)
    }

    // Fill the two buffers, at the size of the frame they will be laid over.
    drawLayers(gl, layers, camera, plane, scale)
  })

  return <LayerComposite layers={layers} />
}
