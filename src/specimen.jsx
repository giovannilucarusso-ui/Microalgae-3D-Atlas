// A specimen in transmitted light.
//
// Under a light microscope nothing is *lit*: the lamp is behind the slide and
// what you see is the light that survived the crossing. So the filament is not
// shaded at all — it multiplies the field behind it by its own transmittance,
// Beer-Lambert, per colour channel. The path through a round body is longest
// where you look down its axis and vanishes at the silhouette, which is why a
// cell in a micrograph is dark in the middle and pale at the rim; the thin dark
// outline around it is light refracted out of the objective's acceptance cone.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { seededRandom } from './science.js'
import { usePrefersReducedMotion } from './scene.jsx'

// Every one of the shaders below starts by turning a varying normal into a
// unit vector, and every one of them used to do it with a bare normalize().
//
// normalize(vec3(0.0)) is a division by zero: it returns NaN, NaN survives
// every arithmetic operation downstream, and a NaN written to a colour buffer
// comes out **white** — the one value a transmitted-light image may not
// contain, since the brightest thing in one is the lamp with nothing in front
// of it. A single degenerate face anywhere in the scene therefore prints a
// scatter of blown pixels that reads as an optical effect and is not one.
//
// Worse, it cannot be found by turning the material off: a strength of zero
// multiplies the NaN by nought, and nought times NaN is NaN. Two of these
// shaders were cleared to zero while hunting this and the specks stayed exactly
// where they were, which is what sent the search everywhere except here.
//
// So the guard is written once and shared. A degenerate mesh is still a bug to
// be fixed where the mesh is built — and one was, in chloroplastCup — but it
// should show up as flat shading, not as light the specimen did not transmit.
const SAFE_NORMAL = /* glsl */ `
  vec3 safeNormal(vec3 n) {
    float len = length(n);
    return len > 1e-8 ? n / len : vec3(0.0, 0.0, 1.0);
  }
`

const VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vDistance;
  // A population is not one specimen repeated. Cells of one species differ in
  // how much pigment they carry and in which way their chloroplast happens to
  // face, and a field of identical balls reads as a pattern rather than as a
  // culture. One attribute is enough to break it, and it costs nothing.
  #ifdef PER_INSTANCE
    attribute float aDensity;
    varying float vDensity;
  #endif
  #ifdef GRAIN
    // Where this fragment is on the slide, so the grain has a physical size:
    // the same organelle drawn twice as large gets twice as many granules
    // across it, rather than the same pattern stretched.
    varying vec3 vObject;
  #endif
  #ifdef TAPER
    // How thick the wall is at this vertex, as a multiple of the material's
    // nominal thickness. A shell is drawn by 1/cos through a wall, and until
    // now that wall was the same everywhere — which is what made a chloroplast
    // a flat green shape that stopped dead at its own margin. See
    // chloroplastCup in geometry.js.
    attribute float aThick;
    varying float vThick;
  #endif

  void main() {
    vUv = uv;
    #ifdef PER_INSTANCE
      vDensity = aDensity;
    #endif
    vec3 transformed = position;
    vec3 objectNormal = normal;
    #ifdef USE_INSTANCING
      transformed = (instanceMatrix * vec4(transformed, 1.0)).xyz;
      objectNormal = mat3(instanceMatrix) * objectNormal;
    #endif
    #ifdef GRAIN
      vObject = transformed;
    #endif
    #ifdef TAPER
      vThick = aThick;
    #endif
    vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
    vNormalView = normalMatrix * objectNormal;
    vViewDir = -mv.xyz;
    vDistance = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAGMENT = /* glsl */ `
  ${SAFE_NORMAL}
  uniform vec3 uAbsorb;
  uniform float uDensity;
  uniform float uEdge;
  uniform float uEdgeShape;
  uniform float uBand;
  uniform float uBandWeak;
  uniform float uVeil;
  uniform float uHazeNear;
  uniform float uHazeFar;
  uniform float uFade;
  uniform sampler2D uMap;
  uniform float uUseMap;
  uniform vec2 uSpan;
  uniform float uNecrosis;
  uniform float uNecrosisAt;
  uniform float uNecrosisWidth;

  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vDistance;
  #ifdef PER_INSTANCE
    varying float vDensity;
  #endif
  #ifdef TAPER
    varying float vThick;
  #endif
  #ifdef GRAIN
    uniform float uGrainAmt;
    uniform float uGrainSize;
    uniform float uGrainWarp;
    varying vec3 vObject;

    float hash31(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.11, 0.27, 0.43));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float vnoise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
        mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
        f.z);
    }

    // One octave, signed, faded out before its cells are narrower than a pixel.
    //
    // Every octave has to be band-limited on its own. Summed first and faded
    // afterwards, the finest one is still in the sum at the point where it has
    // stopped being a pattern and become variance, and the surface reads as
    // mush rather than as texture — which is a good part of why a rendered
    // membrane looks rendered. The point is already in this octave's own cells, so
    // fwidth of it is how many cells a pixel crosses, and the octave dies as
    // that approaches Nyquist.
    //
    // The footprint is the widest of the three derivatives and not their
    // length: length overstates it wherever the surface is steeply turned away,
    // and a chloroplast is a shell, so most of what is seen of one is grazing.
    // Measured that way the mottle disappears from exactly the part of the cell
    // that carries it.
    float octave(vec3 p) {
      vec3 d = fwidth(p);
      float perPixel = max(max(d.x, d.y), d.z);
      return (vnoise(p) - 0.5) * (1.0 - smoothstep(0.45, 1.0, perPixel));
    }
  #endif

  void main() {
    // The trichome is drawn as a length of itself. Outside that length there
    // is nothing — which is how the filament comes apart without rebuilding
    // any geometry.
    if (vUv.x < uSpan.x || vUv.x > uSpan.y) discard;

    vec3 N = safeNormal(vNormalView);
    vec3 V = normalize(vViewDir);
    float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);

    // Chord through a convex body, normalised: 1 down the axis, 0 at the rim.
    float path = ndv;
    #ifdef SHELL
      // A shell is not a convex body and the chord is meaningless for one. What
      // the beam crosses is a wall of roughly constant thickness, so the path
      // goes as 1/cos — long where the surface is seen edge-on, short where it
      // is seen face-on.
      //
      // The rest is done by the blending. This material is drawn double-sided
      // and multiplies, so *every* crossing of the wall multiplies the field
      // again: a ray through the closed side of a cup crosses twice and comes
      // out twice as absorbed, a ray through the mouth crosses once or not at
      // all. That is the whole reason a chloroplast reads as a C from one angle
      // and a ring from another, and it falls out of the physics rather than
      // being drawn.
      //
      // Floored, or the wall runs to infinite thickness exactly at its own
      // silhouette and the organelle ends in a hard black rim. 0.31 is about
      // seventy-two degrees off the normal; past that the ray is leaving through
      // the rim rather than through the wall, and 1/cos has stopped describing
      // anything. At the 0.16 tried first it reached six and a quarter wall
      // thicknesses, doubled to twelve by the second crossing, and the middle of
      // every chloroplast went black.
      path = min(1.0 / max(ndv, 0.31), 3.2);
      #ifdef TAPER
        // And the wall is not the same thickness everywhere. A parietal
        // chloroplast is a lobed sheet that thins to nothing at its own margin,
        // and drawn at one thickness it had two failures that between them are
        // most of what made a cell look moulded rather than photographed:
        //
        //   · its face was one value. 1/cos is flat wherever the surface faces
        //     you, so the whole middle of a chloroplast came out a single green
        //     with no structure in it at all;
        //   · and it stopped dead at the mouth, where the beam went from
        //     crossing four walls to crossing two in one step. That step is a
        //     hard edge drawn round a curve sampled at a few dozen points, so
        //     it came out as a *polygon* — the straight-sided lime patch in the
        //     middle of every cell, and the single loudest tell in the frame.
        //
        // See chloroplastCup in geometry.js for where the number comes from.
        //
        // Floored at nought, and that is not defensive dressing — it is the
        // whole of a real bug. The sheet thins almost to nothing at its margin,
        // so the ring of triangles there is very nearly degenerate, and a
        // perspective-correct varying interpolated across a triangle of almost
        // no area is divided by an almost-zero w. A few fragments per frame come
        // back with a *negative* thickness. A negative thickness is a negative
        // optical path, exp(-a·x) with x below zero is bigger than one, and a
        // transmittance bigger than one means the chloroplast hands back more
        // light than fell on it: multiply blending duly brightened the pixel,
        // and the frame came out with a scatter of pure white specks inside one
        // cell — brighter than the lamp, in an image whose ceiling is the lamp.
        //
        // It survived every obvious test. It is not NaN, so a NaN probe finds
        // nothing; it is in one of six chloroplast meshes, in one of two
        // species; and turning any material's strength to zero does not move it
        // because the material at fault is the pigment itself.
        path *= max(vThick, 0.0);
      #endif
    #endif
    float modulation = uUseMap > 0.5 ? 2.0 * texture2D(uMap, vUv).r : 1.0;
    float density = uDensity;
    #ifdef PER_INSTANCE
      density *= vDensity;
    #endif
    #ifdef GRAIN
      // A chloroplast is not a smooth shell of dye. In the plates it is lobed
      // and granular, with paler patches where the lamellae part and denser
      // ones where they stack, and that texture is a good part of why a real
      // cell looks alive and a drawn one looks moulded.
      //
      // Three octaves through a domain warp. The warp is what separates this
      // from the two plain octaves it replaces: unwarped value noise makes
      // round blobs of one size, which reads as a sponge, and stacked lamellae
      // are drawn out and folded. Folding the coordinate before sampling costs
      // three more lookups and turns the blobs into bands and swirls.
      vec3 p = vObject / uGrainSize;
      vec3 warp = vec3(
        vnoise(p * 0.55 + 11.3),
        vnoise(p * 0.55 + 31.7),
        vnoise(p * 0.55 + 57.1)
      ) - 0.5;
      p += warp * uGrainWarp;
      float mottle =
        1.25 * octave(p) +
        0.70 * octave(p * 2.4 + 5.0) +
        0.34 * octave(p * 5.6 + 9.0);
      // Multiplied, not added — and the difference is not a matter of taste.
      //
      // As 1.0 + amount * mottle the modulation is a *subtraction* from the
      // optical density, and three octaves summing to -1.15 at their extreme
      // means any amount past about 0.87 can drive that density below zero. A
      // negative density is a transmittance above one: the chloroplast stops
      // absorbing light and starts emitting it, multiply blending duly makes
      // the pixel brighter than the lamp, and the frame comes out with a
      // scatter of pure white specks in the middle of a cell. That is exactly
      // what happened on the first render at 1.35, and it read as a rendering
      // artefact because it was one.
      //
      // Thickness varies by a factor, never by a subtraction, so the honest
      // form is log-normal: the sheet is two and a half times thicker in the
      // ridges than in the hollows, and no value of the noise can make it thin
      // enough to give light back.
      density *= exp(uGrainAmt * mottle);
    #endif

    // Beer-Lambert over a *band*, which is not the same as Beer-Lambert at a
    // wavelength — and the difference is most of why these cells were the wrong
    // colour.
    //
    // A camera's red channel is a hundred nanometres wide and chlorophyll's red
    // line is not: the pigment takes 660 nm out almost completely and barely
    // touches 590. So the light that survives a long path through a chloroplast
    // is not the measured channel transmittance raised to the path — it is
    // whatever part of the band the pigment never covered, and that part decays
    // slowly. A single exponential per channel cannot say this. It sends every
    // channel to zero at the same relative rate, so a cell twice the usual
    // thickness came out at a *clipped* blue of 0 to 2 out of 255 over more
    // than half its area, which is the one thing no sensor ever records and
    // exactly what reads as a computed image.
    //
    // So each channel is two sub-bands: the part the pigment absorbs, and the
    // fraction uBand of the band that it nearly misses. uAbsorb is solved
    // rather than taken from a logarithm — see absorbFrom — so at one unit of
    // path the model still returns the measured colour and only the behaviour
    // *away* from the measurement changes. A thick cell now walks towards a
    // dark olive-emerald, which is what a dense one looks like, instead of
    // towards a saturated lime, which is what a dye looks like.
    float x = path * density * modulation;
    vec3 transmittance = mix(exp(-uAbsorb * x), exp(-uAbsorb * (uBandWeak * x)), uBand);

    // Light refracted out of the objective's acceptance cone at the margin.
    // Outside the band model on purpose: this is light lost from the image
    // rather than light absorbed, so it is achromatic and has no spectrum to
    // have a window in. uEdgeShape is how tightly it hugs the silhouette — a
    // wall imaged by a good objective is a *line*, and at the cube it was a
    // soft third of the cell's radius, which reads as an airbrushed ball.
    transmittance *= exp(-uEdge * pow(1.0 - ndv, uEdgeShape));

    // And the contrast ceiling of the instrument. No brightfield objective
    // images anything at zero: light scattered inside the lens, light through
    // the planes above and below, and light that went round the body at the
    // condenser's other angles all land on its image. It is a few per cent of
    // the field, it is why a carbon speck photographs dark grey rather than
    // black, and without it a dense specimen has nothing between it and the
    // floor of the encoding.
    transmittance = mix(transmittance, vec3(1.0), uVeil);

    // The necridium: an intercalary cell that dies on purpose. It loses its
    // contents and fills with mucilage, so it stops absorbing long before the
    // filament actually parts there — the pale cell is the warning.
    float necrosis = uNecrosis *
      (1.0 - smoothstep(0.0, uNecrosisWidth, abs(vUv.x - uNecrosisAt)));
    transmittance = mix(transmittance, vec3(0.93, 0.95, 0.93), necrosis * 0.88);

    // Out of the focal depth the contrast washes out towards the open field.
    //
    // Compiled out where no haze was asked for, and that is a correctness fix
    // rather than a saving. GLSL leaves smoothstep **undefined** when
    // edge0 >= edge1, and the way "no haze" used to be spelled was a pair of
    // equal edges at 1e9 — so every material that did not ask for haze, which
    // is every material in the coccoid field, was running a divide by zero on
    // every fragment and trusting the driver to return something usable. Most
    // of the time it does. Where it does not, the result is NaN, mix() carries
    // the NaN into the transmittance, and a NaN written to the colour buffer
    // comes out white: a scatter of blown pixels in the middle of one cell, on
    // one of the six chloroplasts, in one of the two species.
    //
    // It cost a long hunt, because it looks like an optical effect and it is
    // immune to every obvious test — turning a material's strength down to zero
    // does not remove it, since nought times NaN is NaN.
    float washout = uFade;
    #ifdef HAZE
      washout = max(uFade, smoothstep(uHazeNear, uHazeFar, vDistance));
    #endif
    transmittance = mix(transmittance, vec3(1.0), clamp(washout, 0.0, 1.0));

    // A transmittance is a fraction of the light that got through, so it lies
    // between nought and one by definition. Enforced rather than assumed: every
    // term above is built to respect it, and one of them did not — see the
    // floor on vThick. The ceiling of a transmitted-light image is the lamp
    // with nothing in front of it, and this is the line that makes that true of
    // the specimen no matter what arithmetic reaches it.
    transmittance = clamp(transmittance, 0.0, 1.0);

    gl_FragColor = vec4(transmittance, 1.0);
  }
`

// Just outside the outline sits the bright line every refractive body shows
// against a bright field — the one cue that says "this is in water, not on a
// black backdrop". Drawn on a slightly inflated shell, added rather than
// multiplied, because it is light the specimen bent towards you.
const HALO_FRAGMENT = /* glsl */ `
  ${SAFE_NORMAL}
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uSharpness;
  uniform float uFade;
  uniform vec2 uSpan;

  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vDistance;

  void main() {
    if (vUv.x < uSpan.x || vUv.x > uSpan.y) discard;
    vec3 N = safeNormal(vNormalView);
    vec3 V = normalize(vViewDir);
    float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
    float rim = pow(1.0 - ndv, uSharpness);
    gl_FragColor = vec4(uColor * rim * uStrength * (1.0 - uFade), 1.0);
  }
`

// A calyptra is not a pigment. It is a lens.
//
// Everything else in this view is drawn by what it takes out of the beam, and
// the calyptra takes almost nothing — it is wall, and wall carries no
// phycocyanin. Drawn that way, as one more absorbing layer over the apical
// cell, it can only ever make the tip *darker* than the cell beneath it: the
// cell alone transmits 0.07 of the red, the two multiplied together transmit
// 0.06. It was subtracting six per cent from the one place the card calls the
// brightest on the filament.
//
// What makes a calyptra visible is the other half of the physics. A thick,
// clear, strongly curved body refracts light into the objective's acceptance
// cone, and that light arrives *added* to whatever came through. So the cap is
// drawn the way the halo round the silhouette is drawn, with the shape a
// thickened apical wall actually has rather than a plain fresnel:
//
//   · the thickening is over the dome and thins to nothing at the rim of the
//     cap, because that is what a calyptra is — a cap, not a second wall over
//     the whole cell;
//   · the path through it goes as 1/cos, so it brightens where the line of
//     sight runs along the wall rather than across it;
//   · and it saturates, because a clear body can only bend the light it is
//     given, and because the empty field is the ceiling: the lamp with nothing
//     in front of it is the brightest thing a transmitted-light image has.
//
// Clear where you look straight through it, bright where the line of sight
// runs along the wall, brightest in the lip: the refractile spot a light
// microscope shows on a mature apical cell, and one of the characters that
// separates this genus from Spirulina proper.
const CALYPTRA_FRAGMENT = /* glsl */ `
  ${SAFE_NORMAL}
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uThickness;
  uniform float uRim;
  uniform float uFade;

  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vDistance;

  void main() {
    vec3 N = safeNormal(vNormalView);
    vec3 V = normalize(vViewDir);
    // Floored, or the path runs away to infinity exactly at the silhouette and
    // the cap ends in a hard white ring.
    float ndv = clamp(abs(dot(N, V)), 0.16, 1.0);

    // On a sphere cap three's uv.y is 1 at the pole and 0 at the rim, so this
    // is the way out from the pole.
    float outward = 1.0 - vUv.y;
    // The thickening is a taper: greatest over the dome, back to ordinary wall
    // at the rim of the cap. Held flat across half the cap, as it was, it gave
    // the whole middle a single value before anything else could vary it.
    float wall = uThickness * (1.0 - smoothstep(0.30, 1.0, outward));

    // The path through it goes as 1/cos, so it brightens where the line of
    // sight runs along the wall rather than across it.
    float bright = wall / ndv;
    // The lip of the cap, where the wall is seen end-on. It is what gives the
    // calyptra an outline of its own against the cell it caps.
    float lip = uRim * pow(1.0 - ndv, 4.0) * (1.0 - smoothstep(0.72, 1.0, outward));

    // The saturation belongs on the whole term, not on the path alone. As
    // 1.0 - exp(-wall / ndv) at a thickness that reached 1 by sixty degrees
    // off face-on, the path term was pinned at its own ceiling across most of
    // the cap and nothing downstream could put a gradient back: the cap came
    // out an opaque white disc with a hard edge, peaking at 235 where the empty
    // field reaches 144. Nothing in transmitted light may be brighter than the
    // field — the field is the lamp with nothing in front of it, and a body
    // that beats it stops reading as transparent and starts reading as lit.
    // Compressed on the sum instead, the cap keeps the gradient it is drawn by:
    // nearly clear where you look straight through it, bright where the line of
    // sight runs along the wall, brightest in the lip.
    float glow = (bright + lip) * uStrength;
    glow = glow / (1.0 + glow);

    gl_FragColor = vec4(uColor * glow * (1.0 - uFade), 1.0);
  }
`

// Absorption coefficients from the colour one unit of the material lets
// through — solved rather than taken as a logarithm.
//
// With a single exponential per channel the two are the same thing: a is
// -log(T) and there is nothing to solve. With the band model in the shader they
// are not. There the transmittance of one unit is
//
//     (1 - band)·exp(-a) + band·exp(-weak·a)
//
// and `a` is whatever makes that equal the *measured* colour. Doing it this way
// is what keeps the band model from being a recolouring: at one unit of path
// the material still returns exactly what was read off the plate, and all the
// model changes is how the colour travels as the path gets longer.
//
// Bisection, not Newton: the function is strictly decreasing from 1 to 0, so a
// bracket cannot miss, and this runs once per material.
function absorbFrom(color, band = 0, weak = 0.13) {
  const c = new THREE.Color(color)
  const solve = (value) => {
    const target = Math.min(0.999, Math.max(0.0015, value))
    if (band <= 0) return -Math.log(target)
    const at = (a) => (1 - band) * Math.exp(-a) + band * Math.exp(-weak * a)
    let lo = 0
    let hi = 1
    while (at(hi) > target && hi < 4096) hi *= 2
    for (let i = 0; i < 64; i++) {
      const mid = 0.5 * (lo + hi)
      if (at(mid) > target) lo = mid
      else hi = mid
    }
    return 0.5 * (lo + hi)
  }
  return new THREE.Vector3(solve(c.r), solve(c.g), solve(c.b))
}

export function specimenMaterial({
  core = '#2c5f56',
  density = 1,
  edge = 0.5,
  // How tightly the margin's dark line hugs the silhouette. Three is a broad
  // soft shoulder over a third of the radius, which is right for a body with no
  // wall to speak of and wrong for one with a wall: a cell wall imaged by a good
  // objective is a line you could measure, not a gradient.
  edgeShape = 3,
  // What fraction of each camera band this material's pigment nearly misses,
  // and how much of that fraction it still takes. See the band model in
  // FRAGMENT: together they decide how the colour travels as the path gets
  // longer, and at one unit of path they change nothing. Zero is the old single
  // exponential, exactly.
  band = 0,
  bandWeak = 0.13,
  // The fraction of the field that reaches this body's image without having
  // crossed it — the condenser's outer angles passing it rather than going
  // through it. See FRAGMENT, and see uVeil in optics.jsx for the other and
  // larger half of the same story.
  veil = 0,
  // Where the contrast starts and finishes washing out towards the open field,
  // as distances. Left unset there is no haze term at all — see HAZE in
  // FRAGMENT for why "off" may not be spelled as two equal edges.
  haze = [Infinity, Infinity],
  map = null,
  // Set when the mesh is instanced and each instance carries its own `aDensity`.
  perInstance = false,
  // Set for a body that is a wall rather than a solid — see SHELL above. It
  // switches the path model and draws both sides, because a wall crossed twice
  // has to absorb twice.
  shell = false,
  // Mottles the pigment. `grainSize` is in scene units — the size of a lobe —
  // so the texture is a property of the organelle rather than of the mesh.
  grain = 0,
  grainSize = 1,
  // How far the mottle's own coordinate is folded before it is sampled, in
  // lobes. Nought is round blobs; about half a lobe is bands and swirls.
  grainWarp = 0,
  // Set for a shell whose geometry carries an `aThick` attribute — how thick
  // the wall is at each vertex, as a multiple of the nominal. See
  // `chloroplastCup`.
  taper = false,
  // Off for bodies drawn inside other bodies. Multiply blending is commutative,
  // so two absorbers in the same beam give the same answer in either order —
  // but the depth test is not, and with it on the nearer surface simply rejects
  // the further one. A chloroplast inside a cell, or a cell behind a cell, has
  // to *multiply*: that is what transmitted light does, and it is why two
  // overlapping cells are darker than one.
  depthWrite = true,
} = {}) {
  return new THREE.ShaderMaterial({
    defines: {
      ...(perInstance ? { PER_INSTANCE: '' } : {}),
      ...(shell ? { SHELL: '' } : {}),
      ...(grain > 0 ? { GRAIN: '' } : {}),
      ...(taper ? { TAPER: '' } : {}),
      // Only when a real pair of edges was given. See the washout in FRAGMENT.
      ...(Number.isFinite(haze[0]) && haze[1] > haze[0] ? { HAZE: '' } : {}),
    },
    uniforms: {
      uAbsorb: { value: absorbFrom(core, band, bandWeak) },
      uDensity: { value: density },
      uEdge: { value: edge },
      uEdgeShape: { value: edgeShape },
      uBand: { value: band },
      uBandWeak: { value: bandWeak },
      uVeil: { value: veil },
      uHazeNear: { value: haze[0] },
      uHazeFar: { value: haze[1] },
      uFade: { value: 0 },
      uMap: { value: map },
      uUseMap: { value: map ? 1 : 0 },
      uSpan: { value: new THREE.Vector2(0, 1) },
      uNecrosis: { value: 0 },
      uNecrosisAt: { value: 0.5 },
      uNecrosisWidth: { value: 0.012 },
      uGrainAmt: { value: grain },
      uGrainSize: { value: grainSize },
      uGrainWarp: { value: grainWarp },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    blending: THREE.MultiplyBlending,
    premultipliedAlpha: true, // what MultiplyBlending needs to be dst * src
    transparent: true,
    side: shell ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite,
  })
}

export function calyptraMaterial({
  // The colour of the light the cap bends in, which is the lamp's, so it is
  // pulled towards the field's own cast rather than left white. White light
  // added to a green-grey field is paint on the tip.
  color = '#e4f1eb',
  strength = 1,
  thickness = 0.40,
  rim = 0.70,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: strength },
      uThickness: { value: thickness },
      uRim: { value: rim },
      uFade: { value: 0 },
    },
    vertexShader: VERTEX,
    fragmentShader: CALYPTRA_FRAGMENT,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}

// A starch grain is not a pigment either, and neither is an oil drop.
//
// Everything drawn by `specimenMaterial` is drawn by what it *removes* from the
// beam, and multiply blending can only ever darken — which is fine for a
// chloroplast and useless for the bodies inside one. A starch plate round a
// pyrenoid is brighter than the chloroplast it sits in; drawn as one more
// absorber it can only come out darker, and drawn near-clear it comes out
// invisible. Multiplying by something close to one is not a bright body, it is
// no body.
//
// What actually makes these bright is not that they emit anything. It is that
// where a grain sits there is no chlorophyll: the beam through that spot crosses
// less pigment than the beam either side of it, so the grain gives back some of
// what the chloroplast took. That is why it is drawn *over* the pigment rather
// than under it — a body that failed to absorb has to be added after the
// absorbing, not before — and why the same grain is conspicuous in the thick of
// a chloroplast and nearly invisible in the colourless cytoplasm, where there
// was nothing to fail to absorb.
//
// The shape of it is the opposite of the calyptra's, and the difference is worth
// stating because both are clear bodies drawn additively. A calyptra is a
// *wall*: the line of sight can run along it, so it brightens towards its own
// silhouette and goes as 1/cos. A grain is a small *solid* — a lens. Light
// through the middle of one is barely deviated and arrives; light through its
// margin meets a surface steep enough to throw it out of the objective's cone
// and does not. So a refractile body in brightfield is bright through its centre
// and ringed with dark, which is exactly how the eye finds one on a plate — and
// which is why this pass brightens the middle while the multiply pass beside it
// darkens the margin, instead of the two fighting over the same rim.
//
// What it gives back is bounded, and getting that bound right took three goes.
// The empty field is the ceiling of a transmitted-light image — the lamp with
// nothing in front of it — and a grain may not beat it.
//
// Adding, and capping each body's own contribution, does not achieve that,
// because the bodies in a cell are not spread evenly: the starch gathers round
// the pyrenoid, which is where the diagnosis puts it, and a cell lying with its
// pyrenoid towards you stacks the two starch plates and three or four grains on
// the same pixels. Seven contributions of a tenth each is seven tenths, and the
// pigment underneath simply vanished — a hard-edged disc of pale grey in the
// middle of a green cell, the brightest thing in the frame. Capping the single
// body lower only made every isolated grain invisible while leaving the pile
// bright.
//
// So this does not add, it *screens*: dst + src·(1 − dst). Each body gives back
// a fraction of the headroom that is left rather than a fixed quantity of light,
// so the tenth body in a pile contributes nearly nothing and the sum cannot run
// away. That is also the truer statement of the physics — a grain gives back
// some of what the pigment took, and it cannot give back more than was taken.
//
// And it happens only near the plane of focus. Concentrating light into the
// objective is what a lens does *at* its focus; through focus the bright centre
// and the dark rim trade places, and away from it there is no concentration
// left to speak of. Drawn without that, a cell ten micrometres off the plane
// still had its pigment screened away at the pyrenoid, and the blur then spread
// the result into a grey smear the size of the cell — the one object in the
// frame that got brighter the further out of focus it went. So the fade is the
// objective's own circle of confusion, the same quantity the pass blurs by,
// which is why it takes uAperture rather than a distance in micrometres: the
// depth of field belongs to the instrument and there is one instrument.
const REFRACTILE_FRAGMENT = /* glsl */ `
  ${SAFE_NORMAL}
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uShape;
  uniform float uFade;
  uniform float uFocus;
  uniform float uAperture;

  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vDistance;
  #ifdef PER_INSTANCE
    varying float vDensity;
  #endif

  void main() {
    vec3 N = safeNormal(vNormalView);
    vec3 V = normalize(vViewDir);
    float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
    float ceiling = uStrength;
    #ifdef PER_INSTANCE
      ceiling *= vDensity;
    #endif
    // The same circle of confusion the depth-of-field pass computes. Zero
    // aperture means nobody is driving the focus, so the term is off.
    float coc = uAperture > 0.0
      ? abs(vDistance - uFocus) / max(vDistance, 1e-4) * uAperture
      : 0.0;
    ceiling *= 1.0 - smoothstep(0.2, 0.9, coc);
    gl_FragColor = vec4(uColor * ceiling * pow(ndv, uShape) * (1.0 - uFade), 1.0);
  }
`

// A small clear body that bends light into the objective — a starch plate, a
// starch grain, an oil drop. See REFRACTILE_FRAGMENT.
export function refractileMaterial({
  // The lamp's colour, not white: white added to a khaki field is paint.
  color = '#f6f2df',
  // How much of the headroom above what is already there this body gives back,
  // at its brightest. Bodies compound rather than sum — see above — so this is
  // read as "one grain lifts the pigment a tenth of the way to the lamp", and a
  // pile of seven lifts it about half way and no further.
  strength = 0.1,
  // How fast the brightness falls off from the middle of the body towards its
  // margin. Higher is a tighter, more lens-like highlight.
  shape = 1.6,
  perInstance = false,
} = {}) {
  return new THREE.ShaderMaterial({
    defines: perInstance ? { PER_INSTANCE: '' } : {},
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: strength },
      uShape: { value: shape },
      uFade: { value: 0 },
      // Driven per frame by whoever owns the stage; see CellField.
      uFocus: { value: 1 },
      uAperture: { value: 0 },
      uSpan: { value: new THREE.Vector2(0, 1) },
    },
    vertexShader: VERTEX,
    fragmentShader: REFRACTILE_FRAGMENT,
    // Screen: dst + src * (1 - dst). See above.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneMinusDstColorFactor,
    blendDst: THREE.OneFactor,
    transparent: true,
    depthWrite: false,
  })
}

export function haloMaterial({ color = '#eaf4f2', strength = 0.5, sharpness = 5 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: strength },
      uSharpness: { value: sharpness },
      uFade: { value: 0 },
      uSpan: { value: new THREE.Vector2(0, 1) },
    },
    vertexShader: VERTEX,
    fragmentShader: HALO_FRAGMENT,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}

// --- What else is on the slide ---------------------------------------------
//
// A wet mount is never one clean organism against nothing. There is detritus,
// there are other filaments crossing at other depths, and everything small
// enough is visibly jittering. Out of the focal plane they turn into soft
// shapes, which is what tells the eye the focal plane exists at all.

class DriftCurve extends THREE.Curve {
  constructor(points) {
    super()
    this.curve = new THREE.CatmullRomCurve3(points)
  }
  getPoint(t, target = new THREE.Vector3()) {
    return this.curve.getPoint(t, target)
  }
}

// The slide's own furniture: grit in Brownian motion, detritus, neighbouring
// organisms well out of the plane of focus.
//
// `field` is how much slide is in frame, and everything here is a multiple of
// it. Written against the trichome view's numbers as constants — a slab 320
// across and a haze that began at 520 — it arrived at Chlorella's field of 88
// five times oversized and sitting in the camera's lap, where a detritus flake
// stopped being an out-of-focus lump and became a visibly twenty-faced black
// solid parked among the cells.
//
// Scaling the objects along with the slab means the slide looks the same at
// every magnification, which is not true of a real one: a 2 µm speck of grit is
// 2 µm whichever objective is over it. This is set dressing rather than a
// measured structure and it is drawn as such — nothing on a card refers to it —
// but the simplification is here rather than hidden.
//
// So the *sizes* are clamped to the ones the things actually come in, even
// though their positions still scale. Left purely proportional, the coccoid
// field's grit came out between 50 and 290 nanometres: under the resolution
// limit, invisible, and the slide read as distilled water with algae in it. A
// culture slide is not clean — there are bacteria on it, and they are the same
// bacteria whichever objective is over them. The clamp is what puts them back
// without putting a twenty-faced boulder among the cells, which is what the
// unscaled version did.
const GRIT_UM = [0.34, 1.5]
const FLAKE_UM = [1.6, 7.0]
const COCCUS_UM = [1.1, 3.4]

// Somewhere in a range, but no smaller than the smallest real one and no bigger
// than the biggest.
const sized = (value, [lo, hi]) => Math.min(hi, Math.max(lo, value))

export default function Debris({ field = 451.3, seed = 17, neighbours = 2 }) {
  const k = field / 451.3
  const spread = 320 * k
  const depth = 260 * k
  const specks = useRef([])
  const reduced = usePrefersReducedMotion()

  const { items, geometries, materials } = useMemo(() => {
    const rnd = seededRandom(seed)
    const geometries = {
      speck: new THREE.SphereGeometry(1, 12, 9),
      // Subdivided twice. At detail 0 an icosahedron has twenty faces, which is
      // invisible at a tenth of a micrometre and a *hexagon* once the sizes
      // were clamped to the ones detritus actually comes in — a hard-edged
      // brown polygon sitting among the cells, and the loudest drawn object in
      // the frame. Detritus is irregular, not faceted.
      flake: new THREE.IcosahedronGeometry(1, 2),
      coccus: new THREE.SphereGeometry(1, 20, 14),
    }
    // Everything on the slide fades towards the open field with depth: contrast
    // is the first thing an out-of-focus object loses, before its shape.
    const haze = [520 * k, 1400 * k]
    // The same instrument that draws the specimen draws its slide-mates, so
    // they get the same contrast ceiling and the same tight margins. Drawn
    // without them — and at densities set when the field was dim and everything
    // had to be dark to register — the furniture came out as flat painted dots:
    // a saturated teal button for a passing coccoid, a mid-grey disc for a
    // speck of grit, each with a soft shoulder a third of its own radius. The
    // point of this population is to say that the slide is not clean, and a
    // sticker on the glass does not say that.
    const veil = 0.02
    const materials = {
      grit: specimenMaterial({ core: '#6e7168', density: 0.75, edge: 1.1, edgeShape: 6, veil, haze }),
      flake: specimenMaterial({ core: '#95886d', density: 0.7, edge: 0.8, edgeShape: 5, veil, haze }),
      coccus: specimenMaterial({ core: '#7b9b7f', density: 0.8, edge: 0.9, edgeShape: 6, veil, haze }),
      filament: specimenMaterial({ core: '#5c8579', density: 0.8, edge: 0.5, veil, haze }),
    }

    const items = []

    // grit and bacteria-sized specks, the ones that jitter
    for (let i = 0; i < 30; i++) {
      items.push({
        kind: 'speck',
        geometry: geometries.speck,
        material: materials.grit,
        home: [
          (rnd() - 0.5) * spread * 2,
          (rnd() - 0.5) * spread * 2.2,
          (rnd() - 0.5) * depth * 2,
        ],
        scale: sized((0.5 + rnd() * 2.2) * k, GRIT_UM),
      })
    }

    // detritus flakes: bigger, flatter, mostly well out of focus
    for (let i = 0; i < 7; i++) {
      items.push({
        kind: 'flake',
        geometry: geometries.flake,
        material: materials.flake,
        home: [
          (rnd() - 0.5) * spread * 2,
          (rnd() - 0.5) * spread * 2,
          (rnd() - 0.5) * depth * 2.4,
        ],
        scale: [
          sized((3 + rnd() * 7) * k, FLAKE_UM),
          sized((1 + rnd() * 2) * k, [FLAKE_UM[0] * 0.3, FLAKE_UM[1] * 0.3]),
          sized((3 + rnd() * 6) * k, FLAKE_UM),
        ],
        rotation: [rnd() * 3, rnd() * 3, rnd() * 3],
      })
    }

    // a few single cells of something else
    for (let i = 0; i < 4; i++) {
      items.push({
        kind: 'coccus',
        geometry: geometries.coccus,
        material: materials.coccus,
        home: [
          (rnd() - 0.5) * spread * 1.8,
          (rnd() - 0.5) * spread * 1.8,
          (rnd() - 0.5) * depth * 2,
        ],
        scale: sized((2 + rnd() * 3) * k, COCCUS_UM),
      })
    }

    // Neighbouring trichomes, well off the focal plane. In a real sample they
    // are always there, and the plane of focus cuts them into soft bands —
    // which is exactly what makes the subject read as the one thing in focus.
    //
    // In *that* sample. A trichome is a Spirulina, and two of them were being
    // drawn across every Chlorella field as well — long smooth arcs the width
    // of the frame, crossing each other, at a scale where nothing else on the
    // slide is more than a few micrometres. They read as hairs on the lens or
    // as scratches on the coverslip, which is precisely what they look like,
    // and they were the largest single thing in the picture that could not be
    // there. A wet mount's furniture is not one list: what shares a slide with
    // a filament of Spirulina is not what shares one with a Chlorella culture.
    for (let i = 0; i < neighbours; i++) {
      const side = i === 0 ? 1 : -1
      const z = side * (depth * 0.8 + rnd() * depth * 0.7)
      const y = side * (spread * 0.5 + rnd() * spread * 0.6)
      const tilt = (rnd() - 0.5) * 0.9
      const points = Array.from({ length: 7 }, (_, k) => {
        const t = k / 6
        return new THREE.Vector3(
          (t - 0.5) * spread * 3.6,
          y + Math.sin(t * 7 + i * 2) * 42 + tilt * (t - 0.5) * spread * 2,
          z + Math.cos(t * 4.6 + i) * 60,
        )
      })
      items.push({
        kind: 'filament',
        geometry: new THREE.TubeGeometry(new DriftCurve(points), 120, (0.9 + rnd() * 1.1) * k, 10, false),
        material: materials.filament,
        home: [0, 0, 0],
        scale: 1,
      })
    }

    return { items, geometries, materials }
  }, [spread, depth, seed])

  useEffect(
    () => () => {
      Object.values(geometries).forEach((g) => g.dispose())
      Object.values(materials).forEach((m) => m.dispose())
      items.forEach((item) => item.kind === 'filament' && item.geometry.dispose())
    },
    [items, geometries, materials],
  )

  // Brownian motion. Everything under a few micrometres is visibly restless in
  // a real mount, and a still field reads as a rendering however good it looks.
  useFrame((state, delta) => {
    if (reduced) return
    const t = state.clock.elapsedTime
    specks.current.forEach((mesh, i) => {
      if (!mesh || items[i].kind === 'filament') return
      const [x, y, z] = items[i].home
      const s = 0.55 + (i % 5) * 0.13
      const amp = items[i].kind === 'speck' ? 3.4 : 1.1
      mesh.position.set(
        x + Math.sin(t * s + i) * amp + Math.sin(t * s * 2.7 + i * 3.1) * amp * 0.4,
        y + Math.cos(t * s * 1.3 + i * 1.7) * amp + Math.sin(t * s * 3.1 + i) * amp * 0.3,
        z + Math.sin(t * s * 0.9 + i * 2.3) * amp * 0.6,
      )
      if (items[i].kind === 'flake') mesh.rotation.y += delta * 0.04
    })
  })

  return (
    <group raycast={() => null}>
      {items.map((item, i) => (
        <mesh
          key={i}
          ref={(node) => (specks.current[i] = node)}
          geometry={item.geometry}
          material={item.material}
          position={item.home}
          rotation={item.rotation}
          scale={item.scale}
          raycast={() => null}
        />
      ))}
    </group>
  )
}
