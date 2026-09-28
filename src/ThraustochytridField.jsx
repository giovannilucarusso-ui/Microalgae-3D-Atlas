// A thraustochytrid culture on a slide, down the brightfield objective.
//
// The same kind of renderer as the haptophyte field — one screen-facing quad
// per cell, the cell integrated as a function along its own ray, the defocus
// averaged in closed form rather than sampled, the image drawn by the phase and
// not by a pigment — and it differs in the three ways the organism does.
//
// **Almost nothing here is coloured.** A thraustochytrid has no plastid. Its
// cells are colourless protoplasm and oil, and what makes them visible is that
// both are denser optically than the sea water they sit in. So the picture is
// made of the transport-of-intensity equation — the change of intensity with
// defocus, which goes as the Laplacian of the optical path — taken with its own
// coefficient, one, as in the haptophyte field: a dark rim inside each cell and
// a bright line outside it where the plane of focus is a little below the
// cells, and the reverse above them.
//
// **The inside is oil.** The cells are "filled with numerous lipid bodies"
// (Wong et al. 2008) and oil, at 1.47, is the most refractile thing in them.
// In the Roscoff collection's own micrograph of this strain they are about a
// micrometre across and packed through the whole cell. They are drawn as
// droplets on a jittered lattice inside each cell, generated in the shader from
// the cell's seed rather than stored — a large cell holds several thousand —
// and each droplet is its own small lens, blurred by its own distance from the
// plane of focus. Those above the plane come out with dark centres and those
// below with bright ones, which is the granular, cobbled interior every cell
// shows at 200×.
//
// **Cells pressed together share a face.** The spheres of two cells in a group
// overlap and are cut along the plane of equal power between them, so each
// ends in a flat face against the other. The cut is a smooth step as wide as
// the blur, and the Laplacian is taken through it by the product rule — which
// draws the crease between two pressed cells as the phase makes it, and not as
// an outline added on top.
//
// And the objective's colour error is taken per channel, as in the haptophyte
// field: each of red, green and blue sees the cell at its own defocus — see
// axialChromaUm on the objective, which is the atlas's one objective and the
// same for every specimen. The reference photograph's cells are markedly
// yellow inside and violet outside; nearly all of that is its own objective's
// colour error, which this one does not share, and what is left once it is
// taken away — a few per cent of blue, taken by the carotenoids in the oil — is
// what is drawn. See the colour card.
//
// **The life cycle is drawn by the same shader, and one more.** A growing cell
// is a cell; a zoosporangium is a wall drawn on its own with the protoplast
// inside it cleaving into masses, each a naked cell cut along its furrows by the
// same flat faces that press the cells of a group; and when the wall bursts, a
// tear opens in it. The zoospores that leave are ellipsoids with two unequal
// flagella, drawn by a second, smaller shader, and the flagella as ribbons, as in
// the haptophyte field. Where they all are comes from cycleAt in
// thraustochytrid.js, a pure function of the phase.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import {
  DROPLET_K,
  DROPLET_P,
  DROPLET_SHARE,
  buildCycle,
  buildThraustochytrids,
  cycleAt,
} from './thraustochytrid.js'
import { usePrefersReducedMotion } from './scene.jsx'
import {
  CHORD_GLSL,
  LayerComposite,
  absorbFrom,
  createLayers,
  disposeLayers,
  drawLayers,
  obliqueBeam,
} from './twoBeam.jsx'

// Refractive indices, which are the whole reason anything here is visible.
//
// The medium is YEP: sea water with 2 % glucose and a little peptone and yeast
// extract. Sea water is 1.339; the solutes add under 0.004, so 1.341.
const N_MEDIUM = 1.341
// Protoplasm, as everywhere in the atlas.
const N_CYTOPLASM = 1.36
// Oil. Measured above 1.46 in the lipid bodies of an oleaginous microalga
// (Jung et al. 2018); a triglyceride rich in DHA sits near 1.47–1.48.
const N_LIPID = 1.47
// The wall: a thin layer of scales made in the Golgi. Neither its thickness nor
// its index has been measured in this species; drawn as 0.1 µm of material a
// little denser than the protoplasm, which it makes no visible difference to
// get a little wrong at this objective's resolution.
const N_WALL = 1.4
// The objective's numerical aperture: the oil-immersion lens whose resolution
// the atlas draws with (see RESOLUTION_UM in coccoid.js). It is how steep an
// optical-path slope the objective still collects, and so how much of a
// margin's light is lost to it.
const NA = 1.25
// A zoospore: protoplasm with its share of oil, the fuel it swims on (r86).
// Not measured; drawn between the two.
const N_ZOOSPORE = 1.385
// A flagellum: membrane round a ring of microtubules, as in the haptophyte field.
const N_FLAGELLUM = 1.4
// The instances the life cycle borrows: one for the cell or its wall, and one
// for each mass the protoplast cleaves into.
const CYCLE_MASSES = 16
const CYCLE_SLOTS = 1 + CYCLE_MASSES
// Points along a drawn flagellum.
const FLAGELLUM_POINTS = 14

const f4 = (v) => v.toFixed(4)
// How many lattice steps up and down the shader will walk from a cell's
// middle, at most. The largest cell measured is 28.4 µm across and the
// smallest step between droplets 1.15 µm, so thirteen each way reaches the
// poles of every cell; each column walks only the part of that its chord needs.
const KMAX = 13

const VERTEX = /* glsl */ `
  attribute vec4 aCentre;  // position (µm), radius
  attribute vec4 aLipid;   // seed, fill, lattice step (µm), pigment density
  attribute vec4 aPlaneA;  // contact faces 0 and 1: angle in the slide, offset from the centre
  attribute vec4 aPlaneB;  // faces 2 and 3; an offset past the radius is no face
  attribute vec4 aShell;   // kind (0 cell, 1 wall alone, 2 naked protoplast), tear, tear direction, opacity

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uFocus;
  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;
  uniform vec3 uChroma;

  varying vec4 vCell;     // radius, defocus of the centre
  varying vec4 vLipid;
  varying vec4 vNormA;    // faces 0 and 1, as normals on the screen
  varying vec4 vNormB;
  varying vec4 vOffset;
  varying vec2 vLocal;
  varying vec4 vShell;     // kind, tear half-angle, opacity
  varying vec2 vTear;      // which way the tear faces, on the screen

  vec2 onScreen(float angle) {
    vec3 n = vec3(cos(angle), sin(angle), 0.0);
    vec2 s = vec2(dot(n, uRight), dot(n, uUp));
    float l = length(s);
    return l > 1e-4 ? s / l : vec2(1.0, 0.0);
  }

  void main() {
    vec3 C = aCentre.xyz;
    float R = aCentre.w;
    // An instance the life cycle is not using: nothing to draw.
    if (R <= 0.0) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      return;
    }
    vec4 view = modelViewMatrix * vec4(C, 1.0);
    float defocus = -view.z - uFocus;

    // The quad has to hold the cell, the widest blur any channel gives its
    // margin, and the blur of the droplets furthest above or below the plane.
    float far = max(max(abs(defocus + uChroma.x), abs(defocus + uChroma.y)), abs(defocus + uChroma.z));
    float spread = far * uTanAlpha;
    float blur = sqrt(uAiry * uAiry + spread * spread);
    float reach = R + max(0.9 * blur, aLipid.z) + 4.0 / max(uPxPerUm, 1e-3);
    vec2 corner = position.xy * 2.0 * reach;

    vCell = vec4(R, defocus, 0.0, 0.0);
    vLipid = aLipid;
    vNormA = vec4(onScreen(aPlaneA.x), onScreen(aPlaneA.z));
    vNormB = vec4(onScreen(aPlaneB.x), onScreen(aPlaneB.z));
    vOffset = vec4(aPlaneA.y, aPlaneA.w, aPlaneB.y, aPlaneB.w);
    vLocal = corner;
    vShell = vec4(aShell.x, aShell.y, aShell.w, 0.0);
    vTear = onScreen(aShell.z);

    vec3 world = C + uRight * corner.x + uUp * corner.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;
  uniform vec3 uChroma;
  uniform vec3 uPigment;
  uniform vec3 uBand;
  uniform vec3 uBandWeak;
  uniform float uCytoplasm;
  uniform float uWall;
  uniform float uEdge;
  uniform float uScatter;
  uniform float uVeil;
  uniform float uTie;
  uniform float uTieLimit;
  uniform float uOilLimit;
  uniform vec3 uObliqueColor;

  varying vec4 vCell;
  varying vec4 vLipid;
  varying vec4 vNormA;
  varying vec4 vNormB;
  varying vec4 vOffset;
  varying vec2 vLocal;
  varying vec4 vShell;
  varying vec2 vTear;

  ${CHORD_GLSL}

  float blurAt(float defocus, float pixel) {
    float spread = defocus * uTanAlpha;
    return sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
  }

  // Integer hashing, so the droplet lattice does not decay into a smear a few
  // hundred steps from the origin the way a fract() hash does.
  uint hash(ivec3 p, uint seed) {
    uvec3 u = uvec3(p);
    uint h = u.x * 1597334677u ^ u.y * 3812015801u ^ u.z * 2654435761u ^ seed * 2246822519u;
    h ^= h >> 15; h *= 2246822519u; h ^= h >> 13; h *= 3266489917u; h ^= h >> 16;
    return h;
  }
  uint next(uint h) {
    h ^= h >> 16; h *= 0x7feb352du; h ^= h >> 15; h *= 0x846ca68bu; h ^= h >> 16;
    return h;
  }
  float unit(uint h) {
    return float(h >> 8) * (1.0 / 16777216.0);
  }

  // The contact faces at a point on the screen, as a mask that steps from one
  // inside the cell to nought past the face over the width of the blur, with
  // its gradient and its Laplacian — so that the Laplacian of a cut cell can be
  // taken by the product rule. Where two faces meet, the cross term is left
  // out; it lives in a corner a blur wide.
  void faces(vec2 p, float w, out float M, out vec2 G, out float L) {
    vec2 N[4];
    N[0] = vNormA.xy; N[1] = vNormA.zw; N[2] = vNormB.xy; N[3] = vNormB.zw;
    float O[4];
    O[0] = vOffset.x; O[1] = vOffset.y; O[2] = vOffset.z; O[3] = vOffset.w;
    float S[4];
    float dS[4];
    float ddS[4];
    for (int i = 0; i < 4; i++) {
      float d = O[i] - dot(p, N[i]);
      float u = clamp((d + w) / (2.0 * w), 0.0, 1.0);
      S[i] = u * u * (3.0 - 2.0 * u);
      bool ramp = u > 0.0 && u < 1.0;
      dS[i] = ramp ? 6.0 * u * (1.0 - u) / (2.0 * w) : 0.0;
      ddS[i] = ramp ? (6.0 - 12.0 * u) / (4.0 * w * w) : 0.0;
    }
    M = S[0] * S[1] * S[2] * S[3];
    G = vec2(0.0);
    L = 0.0;
    for (int i = 0; i < 4; i++) {
      float others = 1.0;
      for (int j = 0; j < 4; j++) if (j != i) others *= S[j];
      G -= others * dS[i] * N[i];
      L += others * ddS[i];
    }
  }

  // Whether a droplet of radius r at p lies inside every face of the cell.
  bool inside(vec2 p, float r) {
    return vOffset.x - dot(p, vNormA.xy) > r
        && vOffset.y - dot(p, vNormA.zw) > r
        && vOffset.z - dot(p, vNormB.xy) > r
        && vOffset.w - dot(p, vNormB.zw) > r;
  }

  void main() {
    float R = vCell.x;
    float defocus = vCell.y;
    vec2 p = vLocal;
    float rho = length(p);
    // A whole pixel under every blur, so that nothing finer than the screen can
    // carry is drawn: droplets a micrometre across are three pixels at the
    // opening magnification, and their rims are well under one.
    float pixel = 1.0 / max(uPxPerUm, 1e-3);

    float seedF = vLipid.x;
    float fill = vLipid.y;
    float s = vLipid.z;
    // The share of the cell the oil fills, on average: the droplets' mean,
    // which is part of the cell's own index, and against which each droplet is
    // drawn as a departure. See DROPLET_SHARE.
    float phi = fill * ${f4(DROPLET_SHARE)};

    // --- The cell: protoplasm and oil inside a thin wall, cut where pressed. -
    //
    // Per channel, because each sees the cell at its own defocus. The optical
    // path relative to the medium is the wall's step times the whole chord,
    // plus the step from the wall to the inside -- protoplasm with its mean
    // share of oil -- times the inner chord.
    vec3 tieBody = vec3(0.0);
    float bodyPath = 0.0;
    float slopeBody = 0.0;
    float outermost = 0.0;
    //
    // A wall alone — a zoosporangium's, emptied or not yet — is the same shell
    // with the medium inside it; a naked protoplast, one of the masses a
    // zoosporangium cleaves into, is the inside with no shell.
    float kind = vShell.x;
    float dW = ${f4(N_WALL - N_MEDIUM)};
    float dC = ${f4(N_CYTOPLASM - N_WALL)} + phi * ${f4(N_LIPID - N_CYTOPLASM)};
    if (kind > 0.5 && kind < 1.5) {
      dC = -dW;
    } else if (kind > 1.5) {
      dW = ${f4(N_CYTOPLASM - N_MEDIUM)} + phi * ${f4(N_LIPID - N_CYTOPLASM)};
      dC = 0.0;
    }
    // Where the wall has burst: a wedge of it gone, on the side it tore.
    float tear = 1.0;
    if (vShell.y > 0.0 && rho > 1e-4) {
      float off = acos(clamp(dot(p / rho, vTear), -1.0, 1.0));
      tear = smoothstep(vShell.y - 0.12, vShell.y + 0.12, off);
    }
    for (int c = 0; c < 3; c++) {
      float z = defocus + uChroma[c];
      float w = max(0.866 * blurAt(z, pixel), 0.03);
      outermost = max(outermost, R + w);
      float Ri = max(R - uWall, 0.1);
      float ch = 2.0 * halfChord(rho, R, w);
      float sl = 2.0 * halfChordSlope(rho, R, w);
      float cu = 2.0 * halfChordCurve(rho, R, w);
      float chI = 2.0 * halfChord(rho, Ri, w);
      float slI = 2.0 * halfChordSlope(rho, Ri, w);
      float cuI = 2.0 * halfChordCurve(rho, Ri, w);
      float F = (dW * ch + dC * chI) * tear;
      float Fp = (dW * sl + dC * slI) * tear;
      float Fpp = (dW * cu + dC * cuI) * tear;
      float lapF = Fpp + Fp / max(rho, w);
      vec2 gradF = rho > 1e-4 ? Fp * p / rho : vec2(0.0);
      float M;
      vec2 G;
      float L;
      faces(p, w, M, G, L);
      tieBody[c] = z * (M * lapF + 2.0 * dot(gradF, G) + F * L);
      if (c == 1) {
        bodyPath = ch * M;
        slopeBody = length(M * gradF + F * G);
      }
    }
    if (rho > outermost + 0.05) discard;

    // --- The oil, droplet by droplet. ---------------------------------------
    //
    // Layers of droplets, one lattice step apart through the cell, each layer a
    // jittered square grid turned and shifted by its own hash. Each site holds
    // a droplet or not, of a size that grows towards the margin, placed so that
    // it stays inside its own site and never touches a neighbour.
    //
    // **The layers are turned independently** because a cubic lattice seen
    // down one of its own axes is a grid: every droplet of a column lands on
    // the same spot of the image, and the first version drew a woven cloth in
    // every cell. Turned and shifted layer by layer, the droplets at different
    // depths fall at unrelated places, which is what a cell packed with oil at
    // random looks like.
    //
    // **Each droplet is drawn as its departure from the mean**, because the
    // mean is already in the cell above. That is the droplet blurred by its
    // own defocus, less the same droplet spread over its site -- and the
    // difference goes to nothing by itself as the droplet leaves the plane of
    // focus, because a droplet blurred wider than the lattice is the mean.
    // Dropping the far droplets outright, as the first version also did, took
    // their share of the oil out of the cell with them, and every large cell
    // came out with a clear margin where its equator was out of focus.
    //
    // Only the three by three sites round this pixel are walked in each layer:
    // a droplet stays inside its site, so one further out cannot reach here
    // unless its blur is wider than a site -- and those have become the mean.
    uint seed = uint(seedF * 16777216.0);
    float spread = 0.25 * s * s;
    // The droplets are band-limited to the screen as well as to the lens: at
    // the opening magnification a droplet is three pixels across and its rim a
    // fraction of one, and drawn at the lens's resolution the oil came out as
    // a maze of single pixels. A pixel and a half under their blur turns that
    // into the mottle a screen can carry; zoomed in, the pixel shrinks and the
    // droplets resolve.
    float pixelOil = 1.5 / max(uPxPerUm, 1e-3);
    float lift = fract(seedF * 3.31) * s;
    float chordHalf = sqrt(max(R * R - rho * rho, 0.0)) + 0.5 * s;
    int k0 = int(floor((lift - chordHalf) / s));
    int k1 = int(floor((lift + chordHalf) / s));

    vec3 tieOil = vec3(0.0);
    // An empty wall holds no oil.
    if (kind > 0.5 && kind < 1.5) k1 = k0 - 1;
    for (int i = 0; i <= 2 * ${KMAX} + 1; i++) {
      int k = k0 + i;
      if (k > k1) break;
      // This layer's own turn and offset.
      uint hl = hash(ivec3(k, 7919, 104729), seed);
      float turn = unit(hl) * 6.2831853;
      hl = next(hl);
      float ox = unit(hl) * s;
      hl = next(hl);
      float oy = unit(hl) * s;
      vec2 cs = vec2(cos(turn), sin(turn));
      vec2 q = vec2(cs.x * p.x + cs.y * p.y, -cs.y * p.x + cs.x * p.y) + vec2(ox, oy);
      ivec2 col = ivec2(floor(q / s));
      float layerZ = (float(k) + 0.5) * s - lift;
      // Its own defocus, before anything else is worked out: a layer above
      // the middle of the cell is nearer the objective than the centre is,
      // and droplets blurred past their sites are the mean already.
      float zl = defocus - layerZ;
      float wl = max(0.866 * blurAt(zl, pixelOil), 0.03);
      if (wl >= 0.9 * s) continue;
      for (int dj = -1; dj <= 1; dj++) {
        for (int di = -1; di <= 1; di++) {
          ivec3 site = ivec3(col.x + di, col.y + dj, k);
          uint h = hash(site, seed);
          if (unit(h) > fill) continue;
          vec2 atL = (vec2(site.xy) + 0.5) * s;
          // Back into the cell's frame, to ask whether the site is inside it.
          vec2 atC = atL - vec2(ox, oy);
          atC = vec2(cs.x * atC.x - cs.y * atC.y, cs.y * atC.x + cs.x * atC.y);
          float out_ = length(vec3(atC, layerZ)) / R;
          if (out_ > 1.0) continue;
          h = next(h);
          // About a micrometre across, the size of the droplets in the
          // collection micrograph of this strain, and a little larger towards
          // the margin, where Wong et al. found the largest in a strain of the
          // same species.
          float r = min(s * mix(${f4(DROPLET_K[0])}, ${f4(DROPLET_K[1])}, unit(h)) * mix(${f4(DROPLET_P[0])}, ${f4(DROPLET_P[1])}, out_), 0.47 * s);
          h = next(h);
          float jx = unit(h) - 0.5;
          h = next(h);
          float jy = unit(h) - 0.5;
          h = next(h);
          float jz = unit(h) - 0.5;
          float play = s - 2.0 * r;
          vec2 dL = atL + vec2(jx, jy) * play;
          vec2 dC = dL - vec2(ox, oy);
          dC = vec2(cs.x * dC.x - cs.y * dC.y, cs.y * dC.x + cs.x * dC.y);
          float dz = layerZ + jz * play;
          if (length(vec3(dC, dz)) + r > R - uWall - 0.15) continue;
          if (!inside(dC, r)) continue;
          float zd = defocus - dz;
          float wd = max(0.866 * blurAt(zd, pixelOil), 0.03);
          float fade = 1.0 - smoothstep(0.6 * s, 0.85 * s, wd);
          if (fade <= 0.0) continue;
          float ws = sqrt(wd * wd + spread);
          float rd = length(q - dL);
          if (rd > r + ws) continue;
          float lapA = 2.0 * halfChordCurve(rd, r, wd) + 2.0 * halfChordSlope(rd, r, wd) / max(rd, wd);
          float lapB = 2.0 * halfChordCurve(rd, r, ws) + 2.0 * halfChordSlope(rd, r, ws) / max(rd, ws);
          tieOil += (vec3(zd) + uChroma) * (lapA - lapB) * (${f4(N_LIPID - N_CYTOPLASM)} * fade);
        }
      }
    }

    // --- Absorption: the carotenoids, dissolved in the oil. -----------------
    float lipid = (kind > 0.5 && kind < 1.5) ? 0.0 : phi * bodyPath;
    vec3 x = uPigment * (lipid * vLipid.w);
    vec3 transmittance = mix(exp(-x), exp(-x * uBandWeak), uBand);
    transmittance *= exp(-uCytoplasm * bodyPath);

    // --- Light bent out of the objective's cone. ----------------------------
    //
    // A ray is deviated by the slope of the optical path it crosses, and one
    // deviated by more than the objective accepts does not arrive, whatever
    // the focus. At this aperture that happens only at the cell's own margin,
    // where the line of sight grazes it: the thin dark contour.
    float edge = clamp(slopeBody / ${f4(0.5 * NA)}, 0.0, 1.0);
    edge *= edge;
    float deviated = 1.0 - exp(-(uEdge * edge + uScatter * lipid));

    // A collapsing wall fades as it goes.
    float opacity = vShell.z;

    #ifdef OBLIQUE
      gl_FragColor = vec4(uObliqueColor * transmittance * deviated * opacity, 1.0);
      return;
    #endif

    transmittance *= 1.0 - deviated;
    // --- The phase: what the defocus does with all of it. -------------------
    transmittance *= 1.0 - clamp(uTie * tieBody + uOilLimit * tanh(uTie * tieOil / uOilLimit), -uTieLimit, uTieLimit);
    transmittance = mix(vec3(1.0), transmittance, opacity);
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    gl_FragColor = vec4(clamp(transmittance, 0.0, 2.2), 1.0);
  }
`

// ── Zoospores ────────────────────────────────────────────────────────────────
//
// An ellipsoid, drawn as a sphere seen through a squash: the footprint is scaled
// to a circle of the geometric mean radius, the chord of that circle is taken
// with the same closed-form blur as everything else, and scaled back by the
// thickness. Exact for a sphere and close enough for a body 4.5 by 3 µm.
const ZOO_VERTEX = /* glsl */ `
  attribute vec4 aPose;    // position (µm), heading in the slide
  attribute vec4 aShape;   // half length, half width, half thickness (µm), shown

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform float uFocus;
  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;
  uniform vec3 uChroma;

  varying vec4 vShape;
  varying vec2 vAxis;
  varying vec2 vLocal;
  varying float vDefocus;

  void main() {
    if (aShape.w <= 0.0) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      return;
    }
    vec3 C = aPose.xyz;
    vec4 view = modelViewMatrix * vec4(C, 1.0);
    float defocus = -view.z - uFocus;
    float far = max(max(abs(defocus + uChroma.x), abs(defocus + uChroma.y)), abs(defocus + uChroma.z));
    float blur = sqrt(uAiry * uAiry + far * far * uTanAlpha * uTanAlpha);
    float reach = aShape.x + 1.1 * blur + 4.0 / max(uPxPerUm, 1e-3);
    vec2 corner = position.xy * 2.0 * reach;
    vec3 axis = vec3(cos(aPose.w), sin(aPose.w), 0.0);
    vec2 a2 = vec2(dot(axis, uRight), dot(axis, uUp));
    float l = length(a2);
    vAxis = l > 1e-4 ? a2 / l : vec2(1.0, 0.0);
    vShape = aShape;
    vLocal = corner;
    vDefocus = defocus;
    vec3 world = C + uRight * corner.x + uUp * corner.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const ZOO_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;
  uniform vec3 uChroma;
  uniform float uCytoplasm;
  uniform float uEdge;
  uniform float uScatter;
  uniform float uVeil;
  uniform float uTie;
  uniform float uTieLimit;
  uniform vec3 uObliqueColor;

  varying vec4 vShape;
  varying vec2 vAxis;
  varying vec2 vLocal;
  varying float vDefocus;

  ${CHORD_GLSL}

  float blurAt(float defocus, float pixel) {
    float spread = defocus * uTanAlpha;
    return sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
  }

  void main() {
    vec2 q = vec2(dot(vLocal, vAxis), dot(vLocal, vec2(-vAxis.y, vAxis.x)));
    float a = vShape.x;
    float b = vShape.y;
    float c = vShape.z;
    float Rn = sqrt(a * b);
    vec2 u = vec2(q.x * Rn / a, q.y * Rn / b);
    float rho = length(u);
    float k = c / Rn;
    float squash = 0.5 * ((Rn / a) * (Rn / a) + (Rn / b) * (Rn / b));
    float pixel = 1.0 / max(uPxPerUm, 1e-3);
    vec3 tie = vec3(0.0);
    float path = 0.0;
    float slope = 0.0;
    float outermost = 0.0;
    for (int ch = 0; ch < 3; ch++) {
      float z = vDefocus + uChroma[ch];
      float w = max(0.866 * blurAt(z, pixel), 0.03);
      outermost = max(outermost, Rn + w);
      float H = 2.0 * k * halfChord(rho, Rn, w);
      float S = 2.0 * k * halfChordSlope(rho, Rn, w);
      float Cv = 2.0 * k * halfChordCurve(rho, Rn, w);
      tie[ch] = z * (Cv + S / max(rho, w)) * squash * ${f4(N_ZOOSPORE - N_MEDIUM)};
      if (ch == 1) {
        path = H;
        slope = abs(S) * sqrt(squash) * ${f4(N_ZOOSPORE - N_MEDIUM)};
      }
    }
    if (rho > outermost + 0.05) discard;
    float edge = clamp(slope / ${f4(0.5 * NA)}, 0.0, 1.0);
    edge *= edge;
    float deviated = 1.0 - exp(-(uEdge * edge + uScatter * path));
    vec3 transmittance = vec3(exp(-uCytoplasm * path));

    #ifdef OBLIQUE
      gl_FragColor = vec4(uObliqueColor * transmittance * deviated, 1.0);
      return;
    #endif

    transmittance *= 1.0 - deviated;
    transmittance *= 1.0 - clamp(uTie * tie, -uTieLimit, uTieLimit);
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    gl_FragColor = vec4(clamp(transmittance, 0.0, 2.2), 1.0);
  }
`

// The flagella: ribbons that face the camera, one per flagellum, their points
// recomputed on the CPU every frame. The same as the haptophyte field's.
const RIBBON_VERTEX = /* glsl */ `
  attribute vec3 aTangent;
  attribute float aSide;
  attribute float aRadius;

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

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    float defocus = -view.z - uFocus;
    float pixel = 1.0 / max(uPxPerUm, 1e-3);
    float spread = defocus * uTanAlpha;
    float blur = sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
    float w = max(0.866 * blur, 0.03);
    vec2 t2 = vec2(dot(aTangent, uRight), dot(aTangent, uUp));
    float tl = length(t2);
    t2 = tl > 1e-5 ? t2 / tl : vec2(1.0, 0.0);
    vec2 n2 = vec2(-t2.y, t2.x);
    float reach = aRadius > 0.0 ? aRadius + 2.6 * w + 2.0 * pixel : 0.0;
    vec3 world = position + (uRight * n2.x + uUp * n2.y) * (aSide * reach);
    vLateral = aSide * reach;
    vRadius = aRadius;
    vW = w;
    vDefocus = defocus;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const RIBBON_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uEdge;
  uniform float uVeil;
  uniform float uTie;
  uniform float uTieLimit;
  uniform vec3 uObliqueColor;

  varying float vLateral;
  varying float vRadius;
  varying float vW;
  varying float vDefocus;

  ${CHORD_GLSL}

  void main() {
    if (vRadius <= 0.0) discard;
    float c = vLateral;
    float r = max(vRadius, 1e-3);
    float chord = 2.0 * halfChord(c, r, vW);
    float slope = 2.0 * halfChordSlope(c, r, vW);
    float curve = 2.0 * halfChordCurve(c, r, vW);
    if (chord < 1e-5 && abs(curve) < 1e-4) discard;
    float dn = ${f4(N_FLAGELLUM - N_MEDIUM)};
    float edge = clamp(abs(slope) * dn * 4.0, 0.0, 1.0);
    edge *= edge;
    float deviated = 1.0 - exp(-uEdge * edge);

    #ifdef OBLIQUE
      gl_FragColor = vec4(uObliqueColor * deviated, 1.0);
      return;
    #endif

    vec3 transmittance = vec3(1.0 - deviated);
    transmittance *= 1.0 - clamp(uTie * vDefocus * curve * dn, -uTieLimit, uTieLimit);
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    gl_FragColor = vec4(clamp(transmittance, 0.0, 2.2), 1.0);
  }
`

// The carotenoids' colour as absorption coefficients per micrometre of oil.
// `perUm` is what one micrometre of oil lets through in each channel, as a
// ratio of the display's values, the way every colour in the atlas is
// measured; it is converted to linear light here, where the arithmetic is.
function pigmentOf(lipid, band, weak) {
  const [r, g, b] = lipid.perUm
  const color = new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace)
  return absorbFrom(color, band, weak)
}

const ORIGIN = new THREE.Vector3()
const HIDDEN_SHELL = [0, 0, 0, 1]

// The two flagella of one zoospore, as points: inserted at its side a quarter
// of the way back from the front, the long one reaching forward and the short
// one trailing, each with a wave running out along it. The protologue says only
// which is longer and where they are attached (r80); the lengths are drawn about
// twice and once the body, and the beat as a slow travelling wave.
function flagellumPoints(z, which, spec, out) {
  const length = spec.zoospore.flagellaUm[which] * z.flagella
  const h = z.heading
  const fx = Math.cos(h)
  const fy = Math.sin(h)
  const bx = z.x + fx * 0.25 * z.a - fy * 0.85 * z.b
  const by = z.y + fy * 0.25 * z.a + fx * 0.85 * z.b
  const dir = which === 0 ? h + 0.35 : h + Math.PI - 0.3
  const dx = Math.cos(dir)
  const dy = Math.sin(dir)
  const amp = which === 0 ? 0.9 : 0.5
  const wave = which === 0 ? 5 : 4
  const hz = which === 0 ? 6 : 5
  for (let i = 0; i < FLAGELLUM_POINTS; i++) {
    const s = (i / (FLAGELLUM_POINTS - 1)) * length
    const lateral = amp * Math.sin(2 * Math.PI * (s / wave - hz * z.beat)) * (length > 0 ? s / length : 0)
    out[i * 3] = bx + dx * s - dy * lateral
    out[i * 3 + 1] = by + dy * s + dx * lateral
    out[i * 3 + 2] = z.z
  }
}

export default function ThraustochytridField({ form, focus, optics = {}, life = null }) {
  const population = useMemo(() => buildThraustochytrids(form), [form])
  const { cells } = population
  const plan = useMemo(() => (form.lifeCycle ? buildCycle(form, population) : null), [form, population])
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const size = useThree((s) => s.size)
  const reduced = usePrefersReducedMotion()
  const showing = useRef(false)

  // The culture, and after it the instances the life cycle borrows — hidden,
  // with no radius, until it is asked for.
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1)
    const n = Math.max(1, cells.length + CYCLE_SLOTS)
    const attribute = (fill, empty) => {
      const data = new Float32Array(n * 4)
      cells.forEach((c, i) => data.set(fill(c), i * 4))
      for (let i = cells.length; i < n; i++) data.set(empty, i * 4)
      const a = new THREE.InstancedBufferAttribute(data, 4)
      a.setUsage(THREE.DynamicDrawUsage)
      return a
    }
    // No face is an offset far past the cell, so the step is one everywhere.
    const face = (c, i) => {
      const p = c.planes[i]
      return p ? [p.angle, p.offset] : [0, 1e4]
    }
    plane.setAttribute('aCentre', attribute((c) => [c.x, c.y, c.z, c.r], [0, 0, 0, 0]))
    plane.setAttribute('aLipid', attribute((c) => [c.seed, c.fill, c.spacing, c.density], [0.5, 0, 1.6, 1]))
    plane.setAttribute('aPlaneA', attribute((c) => [...face(c, 0), ...face(c, 1)], [0, 1e4, 0, 1e4]))
    plane.setAttribute('aPlaneB', attribute((c) => [...face(c, 2), ...face(c, 3)], [0, 1e4, 0, 1e4]))
    plane.setAttribute('aShell', attribute(() => HIDDEN_SHELL, HIDDEN_SHELL))
    return plane
  }, [cells])
  useEffect(() => () => geometry.dispose(), [geometry])

  // The zoospores and their flagella: one instance per zoospore the cycle can
  // show at once, and two ribbons each.
  const zooCount = CYCLE_MASSES + 1
  const zooGeometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1)
    const pose = new THREE.InstancedBufferAttribute(new Float32Array(zooCount * 4), 4)
    const shape = new THREE.InstancedBufferAttribute(new Float32Array(zooCount * 4), 4)
    pose.setUsage(THREE.DynamicDrawUsage)
    shape.setUsage(THREE.DynamicDrawUsage)
    plane.setAttribute('aPose', pose)
    plane.setAttribute('aShape', shape)
    return plane
  }, [zooCount])
  useEffect(() => () => zooGeometry.dispose(), [zooGeometry])

  const ribbons = useMemo(() => {
    const curves = zooCount * 2
    const vertices = curves * FLAGELLUM_POINTS * 2
    const g = new THREE.BufferGeometry()
    const attr = (width) => {
      const a = new THREE.BufferAttribute(new Float32Array(vertices * width), width)
      a.setUsage(THREE.DynamicDrawUsage)
      return a
    }
    g.setAttribute('position', attr(3))
    g.setAttribute('aTangent', attr(3))
    g.setAttribute('aRadius', attr(1))
    const side = new THREE.BufferAttribute(new Float32Array(vertices), 1)
    for (let v = 0; v < vertices; v += 2) {
      side.array[v] = -1
      side.array[v + 1] = 1
    }
    g.setAttribute('aSide', side)
    const index = []
    for (let c = 0; c < curves; c++) {
      const base = c * FLAGELLUM_POINTS * 2
      for (let p = 0; p < FLAGELLUM_POINTS - 1; p++) {
        const a = base + p * 2
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    g.setIndex(index)
    return g
  }, [zooCount])
  useEffect(() => () => ribbons.dispose(), [ribbons])

  const materials = useMemo(() => {
    const band = form.lipid.band ?? [0.1, 0.1, 0.1]
    const weak = form.lipid.bandWeak ?? [0.13, 0.13, 0.13]
    const shared = () => ({
      uRight: { value: new THREE.Vector3(1, 0, 0) },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uForward: { value: new THREE.Vector3(0, 0, -1) },
      uFocus: { value: 1 },
      uTanAlpha: { value: optics.tanAlpha ?? 0.2 },
      uAiry: { value: optics.airyUm ?? 0.09 },
      uPxPerUm: { value: 3 },
      uChroma: { value: new THREE.Vector3(...(optics.axialChromaUm ?? [0, 0, 0])) },
      // The protoplasm takes almost nothing out of the beam: it is colourless,
      // which is the point of the organism.
      uCytoplasm: { value: 0.0005 },
      uEdge: { value: form.edge ?? 0.35 },
      uScatter: { value: 0.02 },
      uVeil: { value: 0.02 },
      // The transport-of-intensity equation with its own coefficient — see the
      // haptophyte field, where this was measured against footage.
      uTie: { value: 1 },
      uTieLimit: { value: 0.6 },
      uObliqueColor: { value: obliqueBeam(optics.illumination) },
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
    const cell = () => ({
      uPigment: { value: pigmentOf(form.lipid, band, weak) },
      uBand: { value: new THREE.Vector3(...band) },
      uBandWeak: { value: new THREE.Vector3(...weak) },
      uWall: { value: form.wallUm ?? 0.1 },
      uOilLimit: { value: form.lipid.phaseLimit ?? 0.3 },
    })
    return {
      absorbed: build(VERTEX, FRAGMENT, cell(), false),
      scattered: build(VERTEX, FRAGMENT, cell(), true),
      zoo: build(ZOO_VERTEX, ZOO_FRAGMENT, {}, false),
      zooScattered: build(ZOO_VERTEX, ZOO_FRAGMENT, {}, true),
      ribbon: build(RIBBON_VERTEX, RIBBON_FRAGMENT, {}, false),
      ribbonScattered: build(RIBBON_VERTEX, RIBBON_FRAGMENT, {}, true),
    }
  }, [form, optics.tanAlpha, optics.airyUm, optics.axialChromaUm, optics.illumination])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  const layers = useMemo(() => {
    const count = Math.max(1, cells.length + CYCLE_SLOTS)
    return createLayers(
      [
        new THREE.InstancedMesh(geometry, materials.absorbed, count),
        new THREE.InstancedMesh(zooGeometry, materials.zoo, zooCount),
        new THREE.Mesh(ribbons, materials.ribbon),
      ],
      [
        new THREE.InstancedMesh(geometry, materials.scattered, count),
        new THREE.InstancedMesh(zooGeometry, materials.zooScattered, zooCount),
        new THREE.Mesh(ribbons, materials.ribbonScattered),
      ],
    )
  }, [geometry, zooGeometry, ribbons, materials, cells.length, zooCount])
  useEffect(() => () => disposeLayers(layers), [layers])

  // Write one moment of the life cycle into the borrowed instances, or clear
  // them when there is none to show.
  const points = useMemo(() => new Float32Array(FLAGELLUM_POINTS * 3), [])
  function writeCycle(moment) {
    const base = cells.length
    const centre = geometry.getAttribute('aCentre')
    const lipid = geometry.getAttribute('aLipid')
    const planeA = geometry.getAttribute('aPlaneA')
    const planeB = geometry.getAttribute('aPlaneB')
    const shell = geometry.getAttribute('aShell')
    const bodies = []
    if (moment?.mother) bodies.push({ ...moment.mother, planes: [] })
    // The masses are pieces of one protoplast, cut by their own furrows.
    bodies.push(...(moment?.masses ?? []).slice(0, CYCLE_MASSES).map((m) => ({ ...m, kind: 2 })))
    for (let i = 0; i < CYCLE_SLOTS; i++) {
      const b = bodies[i]
      const at = (base + i) * 4
      if (!b) {
        centre.array.set([0, 0, 0, 0], at)
        continue
      }
      const face = (k) => (b.planes?.[k] ? [b.planes[k].angle, b.planes[k].offset] : [0, 1e4])
      centre.array.set([b.x, b.y, b.z, b.r], at)
      // One seed for the cell and every mass it cleaves into, so the oil of
      // each piece is the oil that was there before the furrow.
      lipid.array.set([plan.seed, b.kind === 1 ? 0 : b.kind === 2 ? plan.fill : b.fill, plan.spacing, 1], at)
      planeA.array.set([...face(0), ...face(1)], at)
      planeB.array.set([...face(2), ...face(3)], at)
      shell.array.set([b.kind, b.tear ?? 0, plan.tearDir, b.opacity ?? 1], at)
    }
    for (const a of [centre, lipid, planeA, planeB, shell]) a.needsUpdate = true

    const pose = zooGeometry.getAttribute('aPose')
    const shape = zooGeometry.getAttribute('aShape')
    const pos = ribbons.getAttribute('position')
    const tan = ribbons.getAttribute('aTangent')
    const rad = ribbons.getAttribute('aRadius')
    const zoospores = moment?.zoospores ?? []
    for (let i = 0; i < zooCount; i++) {
      const z = zoospores[i]
      pose.array.set(z ? [z.x, z.y, z.z, z.heading] : [0, 0, 0, 0], i * 4)
      shape.array.set(z ? [z.a, z.b, z.c, 1] : [0, 0, 0, 0], i * 4)
      for (let which = 0; which < 2; which++) {
        const v0 = (i * 2 + which) * FLAGELLUM_POINTS * 2
        const shown = z && z.flagella > 0.02
        if (shown) flagellumPoints(z, which, plan.spec, points)
        for (let p = 0; p < FLAGELLUM_POINTS; p++) {
          const q = Math.min(p + 1, FLAGELLUM_POINTS - 1)
          const o = Math.max(p - 1, 0)
          for (const side of [0, 1]) {
            const v = v0 + p * 2 + side
            if (shown) {
              pos.array.set([points[p * 3], points[p * 3 + 1], points[p * 3 + 2]], v * 3)
              tan.array.set(
                [points[q * 3] - points[o * 3], points[q * 3 + 1] - points[o * 3 + 1], 0],
                v * 3,
              )
              rad.array[v] = 0.12
            } else {
              rad.array[v] = 0
            }
          }
        }
      }
    }
    for (const a of [pose, shape, pos, tan, rad]) a.needsUpdate = true
  }

  useFrame((state, delta) => {
    // The life cycle, when it is on: advance it if it is playing, name the
    // stage it is at, and put that moment on the stage.
    const cycle = life?.current
    if (cycle && plan) {
      if (cycle.playing && !reduced) {
        cycle.progress = (cycle.progress + delta / plan.spec.seconds) % 1
        if (cycle.slider?.current) cycle.slider.current.value = String(cycle.progress)
      }
      const stages = plan.spec.stages
      let stage = stages[0]
      for (const s of stages) if (cycle.progress >= s.at) stage = s
      if (cycle.name?.current && cycle.name.current.textContent !== stage.name) {
        cycle.name.current.textContent = stage.name
        if (cycle.text?.current) cycle.text.current.textContent = stage.text
      }
      writeCycle(cycleAt(plan, cycle.progress))
      showing.current = true
    } else if (showing.current) {
      writeCycle(null)
      showing.current = false
    }

    const centred = camera.position.distanceTo(controls?.target ?? ORIGIN)
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
