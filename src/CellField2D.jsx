// The same culture, drawn as an image instead of as a scene.
//
// This is the coccoid field's second renderer, and the reason it exists is not
// that 3D was too expensive. It is that a mesh is the wrong representation for
// something this small.
//
// A cell here is four micrometres across. Tessellate it and you have chosen,
// once and for all, how round it is: zoom in and the facets arrive, and every
// fix for that — more segments, smoother normals, a finer lathe — is a fix for
// the symptom. Worse, the two loudest artefacts this atlas has hit both came
// from the mesh rather than from the optics: a hard four-crossings-to-two step
// drawn along a curve sampled at ninety-six points came out as a *polygon* in
// the middle of every in-focus cell, and a ring of nearly-degenerate triangles
// at the chloroplast margin interpolated a varying to a negative number and
// turned an absorber into a light source.
//
// So there is no mesh. A cell is a **function**: for any ray, how much pigment,
// how much protein and how much starch lie along it. One screen-facing quad per
// cell, and the fragment shader integrates that function along the ray it owns.
// The silhouette is exact at every magnification because there is no silhouette
// stored anywhere — it is wherever the function stops being non-zero. That is
// what "higher resolution" means for a body this size, and it is not a setting.
//
// Two things follow that the scene renderer could not do at all:
//
// **The depth of field belongs to the specimen, not to the frame.** A
// post-process reads one depth per pixel and blurs the *picture*; it cannot know
// that the near wall of a chloroplast and its far wall are two micrometres apart
// along the same ray, so it blurs them by the same amount and smears the image
// of a thing it has already flattened. Here each cell is cone-traced through its
// own aperture: rays enter at different angles, and what they meet on the way
// differs. That is where the creamy, structured out-of-focus of a real objective
// comes from, and it cannot be filtered onto a flat image afterwards.
//
// **Phase, which is most of what a light microscope actually shows.** Almost
// nothing in a cell absorbs. Cytoplasm, starch, a pyrenoid, a wall — they are
// transparent, and what they do to light is *retard* it: they are thicker in
// optical path than the water they sit in. A pure absorption model can only draw
// the pigment, which is why every unstained structure in the old renderer had to
// be given a fictitious brightness before it could be seen. Marching the ray
// gives the optical path length for free, alongside the absorbance, and the
// transport-of-intensity equation turns it into contrast that **appears as you
// rack off focus and vanishes at it** — which is exactly what an operator sees
// and why they rack at all.
//
// What it does not change: the organism. The population comes from coccoid.js,
// unchanged and shared with the scene renderer, so the two are two pictures of
// one culture rather than two cultures.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { buildPopulation } from './coccoid.js'

// Refractive indices, which are the whole reason anything unstained is visible.
//
// These are the ordinary measured ranges for cell material — they are not tuned,
// and the contrast of every transparent body in this view is the difference
// between one of them and the medium. A starch grain is bright because 1.53
// against 1.335 is a large step, not because a brightness was chosen for it.
const N_MEDIUM = 1.335 // culture medium, near water
const N_CYTOPLASM = 1.36
const N_CHLOROPLAST = 1.415
const N_PYRENOID = 1.40 // a body of packed Rubisco: protein, not pigment
// Starch runs about 1.53 and an oil droplet about 1.47. They are drawn with one
// value, and that is the science rather than a shortcut: down a brightfield
// objective both are the same small bright body, which is what the refractile
// granules card says. Starch takes iodine, oil takes Nile red; this view takes
// neither, so it may not claim to tell them apart.
const N_STORAGE = 1.50
const N_WALL = 1.40
// Chlorella's wall, in micrometres. The genus' industrial reputation is for a
// wall that will not break; measured it runs about a hundred to two hundred
// nanometres in a vegetative cell, and it is well under what this objective can
// resolve — which is the point. It is not drawn as a layer you could measure,
// it is drawn as the thing that makes the contour, and at the silhouette the
// line of sight runs along it for long enough to be seen.
const WALL_UM = 0.13

// How many refractile bodies one cell may carry into the shader. Seven is above
// what `granulesOf` ever produces (two starch plates and up to five grains), so
// nothing is silently dropped.
const BODIES_PER_CELL = 7
const TEXEL_ROW = BODIES_PER_CELL + 1 // + the pyrenoid matrix

const VERTEX = /* glsl */ `
  // The quad, in the plane of the sensor. It is sized per instance to the cell
  // plus whatever its own defocus spreads it by, so a cell far off the plane of
  // focus gets a bigger canvas rather than a cropped blur.
  attribute vec3 aCentre;
  attribute vec4 aQuat;
  attribute vec4 aCell;   // radius, pigment density, cup opening, cup thickness
  attribute vec3 aShape;
  attribute vec2 aRow;    // row in the organelle texture, and how many bodies
  attribute vec2 aKind;   // 0 cell / 1 closed wall / 2 torn wall, and wall gauge

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uFocus;
  uniform float uTanAlpha;
  uniform float uAiry;

  varying vec3 vCentre;
  varying vec4 vQuat;
  varying vec4 vCell;
  varying vec3 vShape;
  varying vec2 vRow;
  varying vec2 vLocal;    // where on the quad, in micrometres from the centre
  varying float vBlur;    // this cell's own defocus radius, in micrometres
  varying float vDefocus; // signed, because the phase ring flips through focus
  varying vec2 vKind;
  varying float vFade;

  void main() {
    vec4 view = modelViewMatrix * vec4(aCentre, 1.0);
    float distance = -view.z;
    float defocus = distance - uFocus;
    // The radius of the circle a point at this depth is spread into.
    //
    // Two terms in quadrature, and the first one is the one that was missing.
    // Geometric defocus alone goes to *zero* at the plane of focus, which says
    // an objective can image a point as a point — no objective can. The image of
    // a point is the Airy disc, its radius is what Abbe's limit actually refers
    // to, and it is a floor the defocus is added to rather than a detail on top.
    //
    // Leaving it out was not only dishonest, it aliased: with the blur free to
    // reach zero, a cell wall's contour came out a single pixel wide and beaded
    // under the aperture sampling. Nothing here can now be sharper than the
    // point-spread function, which is both what the physics says and exactly the
    // band limit the sampling needs. The diffraction limit is not a constraint
    // this renderer works around; it is the thing that makes it well-posed.
    //
    // uTanAlpha and uAiry are the same objective seen twice — the acceptance
    // half-angle and the resolution it implies — so they may not be tuned apart.
    float blur = sqrt(uAiry * uAiry + pow(defocus * uTanAlpha, 2.0));
    // Bounded, and this is a display allowance stated rather than hidden — the
    // same kind of thing as the cell view's depthFloor.
    //
    // A body spread over a disc of radius B keeps about (R/B)^2 of its
    // contrast, because that is the fraction of the aperture's rays that still
    // meet it. Past six radii that is under three per cent: the cell is a haze
    // you would not report seeing, and every pixel of the enormous quad it
    // would otherwise claim is spent drawing it. A real mount has cells forty
    // micrometres off the plane and you do not see them; capping the spread is
    // how that stays true without pretending they are not there.
    blur = min(blur, aCell.x * 4.0 + uAiry);

    // And past that it is simply not drawn.
    //
    // A body spread over a disc of radius B keeps about (R/B)^2 of its contrast,
    // because that is the fraction of the aperture's rays that still meet it. At
    // four radii that is six per cent and falling — a haze you would not report
    // seeing, and the honest thing to do with it is nothing. Drawn anyway it was
    // doing real damage: a quarter of this population is still in suspension
    // through forty micrometres of coverslip gap, and each of those cells was
    // claiming a quad five hundred pixels across to deposit a wash over the whole
    // frame. That wash is what made the field look hazy rather than deep, and
    // because the aperture cannot be sampled finely enough over a disc that size,
    // it is also where the sampling pattern showed.
    //
    // An operator racking the fine focus does not see the cells forty micrometres
    // away go dim. They are not there at all, and then they are.
    vFade = 1.0 - smoothstep(2.2, 4.0, blur / max(aCell.x, 1e-4));

    // Big enough for the cell and its spread, with a little margin so the
    // phase ring is not clipped by its own quad.
    // Wide enough for the roundest and the least round cell alike: the shape
    // wobble reaches 1.22, so a quad sized at 1.35 radii left an out-of-round
    // cell within a few per cent of its own canvas edge.
    float reach = aCell.x * 1.6 + blur * 1.35;
    vec2 corner = position.xy * 2.0 * reach;

    vCentre = aCentre;
    vQuat = aQuat;
    vCell = aCell;
    vShape = aShape;
    vRow = aRow;
    vLocal = corner;
    vBlur = blur;
    vDefocus = defocus;
    vKind = aKind;

    vec3 world = aCentre + uRight * corner.x + uUp * corner.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uTanAlpha;
  uniform float uFocusDepth;   // the focal plane, as a depth-buffer value
  uniform vec3 uPigment;       // absorption coefficients of the chloroplast
  uniform vec3 uBandWeak;      // see the band model below
  uniform float uBand;
  uniform float uCytoplasm;    // how little the colourless body takes out
  uniform float uPhase;        // how loudly a phase object rings off focus
  uniform float uVeil;
  uniform float uTaps;         // aperture samples at full defocus
  uniform float uPxPerUm;      // how big a micrometre is on screen, right now
  uniform float uPerUm;        // absorbance of one micrometre of chloroplast
  uniform float uResolve;      // half of what the objective can resolve
  uniform float uLens;         // how much of a lens's light the objective keeps
  uniform float uLensDepth;    // how far off focus a small lens stops working
  uniform float uEdge;         // light refracted out of the acceptance cone
  uniform float uFringe;       // and where that light lands, just outside
  uniform vec3 uObliqueColor;  // the condenser ring's beam, in absolute units
  uniform float uScatter;      // how much the bulk of a cell deviates
  uniform sampler2D uBodies;
  uniform vec2 uBodiesSize;

  varying vec3 vCentre;
  varying vec4 vQuat;
  varying vec4 vCell;
  varying vec3 vShape;
  varying vec2 vRow;
  varying vec2 vLocal;
  varying float vBlur;
  varying float vDefocus;
  varying vec2 vKind;
  varying float vFade;

  const float GOLDEN = 2.39996323;

  // An ordered dither over a 4x4 block, which is what the aperture sampling
  // wants and a hash is not.
  //
  // Fourteen rays cannot fill a disc forty pixels across, and the residue shows
  // up as a stack of faint ghost discs. Turning each pixel's spiral by a *random*
  // amount breaks the ghosts, but it replaces them with white noise: every pixel
  // then makes an independent error, and independent errors are speckle — which
  // is what the first attempt produced, a field of defocused cells covered in
  // grain.
  //
  // A dispersed ordered pattern makes the errors *complementary* instead. Each
  // pixel in a 4x4 block starts its spiral at a different sixteenth of the way
  // round, so the block between them samples sixteen times as much of the
  // aperture as any one pixel does, and the eye — which cannot resolve a 4x4
  // block at this scale — integrates them back into a smooth disc.
  float dither(vec2 p) {
    // The R2 low-discrepancy sequence: fract of the pixel coordinate against the
    // plastic constant's two reciprocals.
    //
    // Three dithers were tried here and the first two both printed themselves
    // on the image. A hash gives white noise, so every pixel makes an
    // independent error and the out-of-focus cells come out covered in speckle.
    // A 4x4 ordered pattern fixes the variance but has a *period*, and a period
    // four pixels long over a smooth green disc is a cross-hatch — the eye finds
    // a grid faster than it finds noise.
    //
    // R2 has neither: it is as evenly spread as the ordered pattern over any
    // local neighbourhood, and it never repeats, so there is no lattice to see.
    return fract(dot(p, vec2(0.7548776662, 0.5698402909)));
  }

  // Turn a vector into the cell's own frame. The population hands out world-space
  // orientations, so the ray is rotated rather than the cell.
  vec3 unrotate(vec4 q, vec3 v) {
    vec3 u = -q.xyz;
    return v + 2.0 * cross(u, cross(u, v) + q.w * v);
  }

  float hash31(vec3 p) {
    uvec3 u = uvec3(ivec3(floor(p)));
    uint h = u.x * 1597334677u ^ u.y * 3812015801u ^ u.z * 2654435761u;
    h ^= h >> 15; h *= 2246822519u; h ^= h >> 13; h *= 3266489917u; h ^= h >> 16;
    return float(h) * (1.0 / 4294967296.0);
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  // How thick the parietal sheet is in a given direction, as a multiple of the
  // nominal. The chloroplast is a lobed sheet, not a rolled one of constant
  // gauge, and this is what puts structure inside its face — see the same
  // argument in chloroplastCup, which this replaces.
  float sheet(vec3 dir, float mouthCos) {
    // Offset per cell, or every chloroplast in the field is lobed identically
    // and merely turned — which is the fault the six lathed cups had, arriving
    // by a different route. The sheet is sampled in the cell's own frame, so
    // without this the noise is a property of the *species*.
    vec3 seed = vec3(vRow.x * 13.7, vRow.x * 7.13, vRow.x * 3.31);
    // Folded before it is sampled, and in three octaves rather than two. Plain
    // value noise makes round blobs of one size, which is a sponge; a plastid is
    // a stack of lamellae that has been drawn out and folded, and a domain warp
    // is what turns the one into the other. This is the same argument as the
    // scene renderer's grain, and it matters more here: there the pigment's path
    // was also amplified by 1/cos across the shell, which supplied contrast the
    // mottle did not have to. Here the path is the true geometric one, so all of
    // the texture has to come from the sheet actually being thicker in some
    // places than others.
    vec3 w = vec3(
      vnoise(dir * 1.7 + seed),
      vnoise(dir * 1.7 + seed + 31.7),
      vnoise(dir * 1.7 + seed + 57.1)
    ) - 0.5;
    vec3 warped = dir * 2.9 + seed + w * 0.9;
    float lobes = vnoise(warped);
    float mid = vnoise(warped * 2.3 + 5.0);
    float fine = vnoise(warped * 5.1 + 9.0);
    float thick = exp(0.95 * (1.25 * (lobes - 0.5) + 0.70 * (mid - 0.5) + 0.34 * (fine - 0.5)));
    // The sheet lines the wall everywhere EXCEPT the mouth. The cup's closed pole
    // is at local -Y and its opening at +Y, so the shell is the range of polar
    // angle from the rim round to the pole — which is where the axial component
    // is *below* the rim's cosine, not above it.
    //
    // Thinning to nothing at the margin rather than stopping there: a sheet that
    // ends in a step draws its own edge, one that tapers has no edge to draw.
    float toMargin = mouthCos - dot(dir, vec3(0.0, 1.0, 0.0));
    // Over a wide margin. A chloroplast does not end at a line: it thins away
    // over a good fraction of a micrometre, the plates show a soft irregular
    // edge to the C rather than a cut one, and at 0.16 the rim was sharper than
    // the objective — a defined boundary is right, a razor is not.
    return thick * smoothstep(0.0, 0.34, toMargin);
  }

  // Where a ray enters and leaves an ellipsoid of semi-axes R*S.
  //
  // Solved, not marched. Scaling the ray by the semi-axes turns the ellipsoid
  // into a sphere and the intersection into a quadratic; because the direction
  // is a unit vector before scaling, the difference of the two roots is still a
  // length in micrometres. Everything smooth in this cell — the body, and the
  // wall around it — is measured this way, and that is what stopped the cells
  // coming out drawn in concentric rings: a fixed-step march quantises where a
  // boundary falls, the count of steps inside a shell jumps by one as the ray
  // slides outwards, and on a body of revolution the places where it jumps are
  // circles.
  bool span(vec3 o, vec3 d, vec3 S, float R, out float t0, out float t1) {
    vec3 oo = o / S, dd = d / S;
    float a = dot(dd, dd);
    float b = dot(oo, dd);
    float c = dot(oo, oo) - R * R;
    float disc = b * b - a * c;
    if (disc <= 0.0) return false;
    float sq = sqrt(disc);
    t0 = (-b - sq) / a;
    t1 = (-b + sq) / a;
    return true;
  }

  // Everything along one ray, in one pass: how much light it loses, and how far
  // it falls behind a ray that stayed in the medium.
  //
  // Marched rather than solved. Every boundary here is a sphere and could be
  // intersected in closed form, but the chloroplast's own thickness varies with
  // direction and its margin wanders, and an inside-test costs the same for a
  // lobed sheet as for a smooth one. The silhouette stays exact either way: it
  // is where the test stops returning true, not a stored edge.
  // This cell's organelles, read once per fragment and shared by every ray.
  vec4 bodies[${TEXEL_ROW}];

  void trace(vec3 origin, vec3 dir,
             out float pigment, out float body, out float wall, out float phase,
             out float bodyPhase, out float edge, out float fringe) {
    pigment = 0.0; body = 0.0; wall = 0.0; phase = 0.0; bodyPhase = 0.0; edge = 0.0;
    fringe = 0.0;

    float R = vCell.x;
    vec3 o = unrotate(vQuat, origin - vCentre);
    vec3 d = unrotate(vQuat, dir);

    float t0, t1;
    if (!span(o, d, vShape, R, t0, t1)) {
      // The ray missed — but it may have passed close enough to catch what the
      // margin threw out of the beam.
      //
      // The dark contour is a *loss*, and the light lost is not destroyed: it is
      // refracted through a small angle and lands just outside the silhouette.
      // That is the bright line every transparent body shows against a bright
      // field, the other half of the pair the eye actually reads a cell by, and
      // it was missing — the measured profile went from the cell's interior
      // straight back to the value of the empty field with no overshoot at all.
      //
      // Its width is the width of the image of a point, because that is what the
      // deviated light is spread over, and its brightness follows the same index
      // step that darkened the margin. Nothing here is free: what the contour
      // takes, this gives back.
      // How far outside the silhouette the ray passed — measured with the *same*
      // arithmetic span() uses to decide that it missed.
      //
      // This was estimated twice, differently, and that was the bug. span()
      // works in the scaled space where the ellipsoid is a sphere; the fringe
      // was measuring against an effective radius reconstructed from the shape,
      // which is only a first-order estimate. Where the two disagreed — and for
      // an out-of-round cell they disagree by a few per cent, in a direction
      // that varies round the cell — the miss distance came out *negative*, the
      // clamp turned it into zero, and zero is where the fringe is brightest. So
      // a band of the cell's own margin lit up at full strength, in a place that
      // wandered from cell to cell, and it read as the contour being missing
      // along one side.
      //
      // Taken from the same quadratic there is nothing left to disagree with:
      // if span() says the ray missed, this is by how much, and it is positive
      // by construction.
      vec3 oo = o / vShape;
      vec3 dd = d / vShape;
      float qa = dot(dd, dd);
      float qb = dot(oo, dd);
      float perp2 = max(dot(oo, oo) - qb * qb / max(qa, 1e-6), 0.0);
      float over = (sqrt(perp2) - R) / max(vBlur, uResolve);
      fringe = exp(-over * over * 1.4) *
        ((vKind.x > 0.5 ? 0.09 : 1.0) * ${(N_CHLOROPLAST - N_MEDIUM).toFixed(3)});
      return;
    }

    // The wall: a hundred-odd nanometres of glucosamine with medium outside and
    // cytoplasm inside. It is a fifth of a per cent of the cell's volume and it
    // is most of how you find the cell, because at the silhouette the line of
    // sight runs *along* it for a micrometre or more while the interior is only
    // ever crossed once. That is the dark contour with the bright line outside
    // it that the CAUP plates show on every cell, and here it is that structure
    // rather than a term standing in for it.
    //
    // Solved rather than marched for a second reason as well: at 0.12 µm it is
    // thinner than any affordable step, so a march would miss it on most rays
    // and find it on others, which is a dashed outline.
    float w0, w1;
    bool hasInner = span(o, d, vShape, max(R - ${WALL_UM.toFixed(3)} * vKind.y, 0.01), w0, w1);
    float inside = hasInner ? w1 - w0 : 0.0;

    // The dark contour, which is the other half of what finds a cell and the
    // half that does not wait for defocus.
    //
    // At the middle of a cell the two surfaces the ray crosses are square to it
    // and it is barely deviated; towards the silhouette they are steeply
    // inclined, and past some angle the ray is bent clean out of the objective's
    // acceptance cone and never arrives. That is a *loss*, not an absorption:
    // it is achromatic, it belongs to the geometry rather than to the pigment,
    // and it is the thin dark line every cell in the CAUP plates is outlined
    // with.
    //
    // A ray is deviated by the *gradient* of the optical path it crosses, so the
    // loss is that gradient and not a power of the impact parameter. Writing it
    // that way costs nothing here — both surfaces are spheres, and the
    // derivative of a chord is closed-form — and it gets two things right that a
    // geometric rim term cannot:
    //
    //   · **A hollow shell is nearly invisible.** Entering an emptied mother
    //     wall and leaving it bend the ray by equal and opposite amounts, so
    //     they cancel everywhere except the thin annulus where the line of sight
    //     misses the inner surface altogether. Drawn with a living cell's rim
    //     term the same walls came out ringed as heavily as cells and read as
    //     porcelain saucers — the loudest objects in the frame, for the one
    //     thing on the slide with nothing inside it.
    //   · **A cell's contour follows its contents.** The step the ray meets is
    //     medium to wall to cytoplasm, and it is the *net* of those that bends
    //     it. A cell whose inside matched its medium would have no outline, and
    //     a thin empty wall is exactly that case.
    //
    // Floored at the width of the image of a point — which is the resolution
    // near focus and the *defocus* away from it, whichever is larger.
    //
    // This is the fix for the last artefact of the aperture sampling. A contour
    // is the thinnest, highest-contrast thing in the frame, so it is the thing
    // sixteen rays sample worst: the wall rims came out beaded, and no amount of
    // choosing a better dither helps, because the problem is that the feature is
    // narrower than the sampling. Widening it by hand would be a fudge; widening
    // it by the blur is not, because the blur is exactly what a real objective
    // does to it. Computed this way the contour arrives already smooth and the
    // sampling has nothing left to alias — the thinnest line in the image is a
    // solved quantity rather than a sampled one.
    float ho = (t1 - t0) * 0.5;
    float relO = sqrt(clamp(1.0 - (ho * ho) / (R * R), 0.0, 1.0));
    float innerRad = max(R - ${WALL_UM.toFixed(3)} * vKind.y, 0.01);
    float hi = hasInner ? (w1 - w0) * 0.5 : 0.0;
    float relI = hasInner ? sqrt(clamp(1.0 - (hi * hi) / (innerRad * innerRad), 0.0, 1.0)) : 0.0;
    float floorR = max(uResolve, vBlur) / max(R, 1e-4);
    float slopeO = relO / sqrt(max(1.0 - relO * relO, floorR));
    float slopeI = hasInner ? relI / sqrt(max(1.0 - relI * relI, floorR)) : 0.0;
    float dnOuter = ${N_WALL.toFixed(3)} - ${N_MEDIUM.toFixed(3)};
    // What is on the *inside* of the wall, and for a living cell that is the
    // chloroplast and not the cytoplasm.
    //
    // Written with the cytoplasm's index the two terms cancelled almost exactly
    // — 1.36 inside a 1.40 wall in a 1.335 medium is a step of 0.025 in one
    // direction and 0.04 in the other — so the contour survived only in the
    // 130 nanometre annulus where the line of sight misses the inner surface.
    // Three pixels wide, and smoothed away by the aperture: measured across a
    // cell, the profile was a plain monotonic ramp with no dark line in it at
    // all, which is why these cells never quite looked like cells.
    //
    // The error was anatomical rather than optical. A parietal chloroplast
    // *lines the wall*: at the margin, which is the only place this term does
    // anything, the ray inside the wall is passing through chloroplast at 1.415,
    // not through cytoplasm. The cell is a much stronger refractor than it was
    // being given credit for, and the dark contour is the consequence.
    float dnInner = (vKind.x > 0.5 ? ${N_MEDIUM.toFixed(3)} : ${N_CHLOROPLAST.toFixed(3)})
                  - ${N_WALL.toFixed(3)};
    edge = abs(2.0 * (dnOuter * slopeO + dnInner * slopeI));

    if (vKind.x > 0.5) {
      // An emptied mother wall. It is the same shell and nothing else: no
      // cytoplasm, no pigment, no stores — the medium is on both sides of it,
      // which is exactly why one is so nearly invisible and why what finds it is
      // a faint closed line and a suspicion.
      //
      // A torn one has a mouth, and the mouth is handled by testing the two
      // crossings rather than by marching: the ray meets the shell twice, on the
      // near side and the far side, and a crossing that falls inside the tear
      // simply is not there. That is exact, it costs two dot products, and a
      // shell 130 nm thick is far too thin to be marched at any affordable step
      // — a march would find it on some rays and miss it on others, which is a
      // dashed outline.
      float nearT = hasInner ? w0 - t0 : (t1 - t0) * 0.5;
      float farT = hasInner ? t1 - w1 : (t1 - t0) * 0.5;
      if (vKind.x > 1.5) {
        float mouthCos = cos(vCell.z);
        vec3 qn = normalize(o + d * t0);
        vec3 qf = normalize(o + d * t1);
        if (dot(qn, vec3(0.0, 1.0, 0.0)) > mouthCos) nearT = 0.0;
        if (dot(qf, vec3(0.0, 1.0, 0.0)) > mouthCos) farT = 0.0;
      }
      wall = nearT + farT;
      body = 0.0;
      // Only where the shell is actually there: a tear has no edge to refract at.
      edge *= wall > 0.0 ? 1.0 : 0.0;
      phase = wall * (${N_WALL.toFixed(3)} - ${N_MEDIUM.toFixed(3)});
      return;
    }

    body = inside;
    wall = (t1 - t0) - inside;


    // The parietal chloroplast, solved on each side rather than marched.
    //
    // This was the last source of noise in the image, and it was mine rather
    // than the optics'. A fixed-step march quantises the pigment path: with
    // twenty-six steps across a four-micrometre cell one step is a seventh of a
    // micrometre, which is about five per cent of the cell's absorbance, so
    // wherever the sheet's boundary falls inside a step the pixel is wrong by
    // that much. Left unjittered the error is the same for every pixel at the
    // same radius, and it prints concentric rings. Jittered, it becomes white
    // noise — which is what the speckle over the out-of-focus cells was, and it
    // survived every improvement to the *aperture* sampling because it was never
    // the aperture.
    //
    // The sheet has no surface to solve against only if its thickness has to be
    // evaluated *along* the ray. It does not: a parietal sheet is thin compared
    // with the sphere it lines, so the direction barely turns while the ray is
    // inside it, and evaluating the thickness once per crossing is accurate to
    // the width of the sheet itself. The ray meets the chloroplast at most twice
    // — once on the near wall, once on the far one — and each crossing is then
    // two sphere intersections. That is exact, it is silent, and it costs less
    // than the march it replaces.
    //
    // It is also *more* faithful in one respect: the two crossings get their own
    // thicknesses, which is what a lobed sheet actually has. The march shared
    // one.
    float mouthCos = cos(vCell.z);
    float thickness = vCell.w;
    // The sheet runs to the cell's own radius, and the wall is not subtracted
    // from it.
    //
    // Anatomically the chloroplast starts just *inside* the wall, so the honest
    // outer radius is R minus a wall — and drawing it that way leaves a ring,
    // one wall thick, that the line of sight crosses without meeting any
    // pigment. That ring is 0.13 µm wide. It is **below what this objective can
    // resolve**, so an instrument could not show it; but an analytic profile
    // will draw it at any width you ask for, and two antipodal rays are not a
    // convolution, so it came through as a hard pale band just inside the
    // contour — visible only on the side away from the cup's mouth, where there
    // is thick pigment for it to contrast against. It read as a lighting fault
    // on the bottom of every cell.
    //
    // Whether the pigment begins at the wall's inner surface or its outer one
    // is not a distinction this view is allowed to draw. Claiming it produced an
    // artefact; declining to produces nothing visible at all, because the
    // difference is a tenth of a micrometre of cytoplasm.
    float outerR = R;

    float c0, c1;
    if (span(o, d, vShape, outerR, c0, c1)) {
      vec3 qn = normalize(o + d * c0);
      vec3 qf = normalize(o + d * c1);
      float tn = sheet(qn, mouthCos);
      float tf = sheet(qf, mouthCos);
      float e0, e1;

      if (tn > 0.0) {
        float innerN = outerR * (1.0 - thickness * tn);
        pigment += span(o, d, vShape, innerN, e0, e1) ? (e0 - c0) : (c1 - c0) * 0.5;
      }
      if (tf > 0.0) {
        float innerF = outerR * (1.0 - thickness * tf);
        pigment += span(o, d, vShape, innerF, e0, e1) ? (c1 - e1) : (c1 - c0) * 0.5;
      }
    }

    // The refractile bodies and the pyrenoid, which are spheres and so are
    // solved rather than marched — they are small, and marching them at this
    // step size would make a half-micrometre grain flicker as the ray slid past.
    //
    // Their positions come in as uniforms from the caller rather than being
    // fetched here. Where this loop used to sample the texture it was doing so
    // once per body *per aperture ray*: two hundred fetches for a pixel of a
    // defocused cell, which is what made this renderer too slow to iterate on.
    // Nothing about them depends on which ray is being traced.
    float storage = 0.0;
    float protein = 0.0;
    for (int k = 0; k < ${TEXEL_ROW}; k++) {
      vec4 s = bodies[k];
      if (s.w <= 0.0) continue;
      vec3 rel = o - s.xyz;
      float along = dot(rel, d);
      float perp2 = dot(rel, rel) - along * along;
      float rad2 = s.w * s.w;
      if (perp2 >= rad2) continue;
      float chord = 2.0 * sqrt(rad2 - perp2);
      if (k == 0) protein += chord; else storage += chord;

      // And the one thing that makes a refractile body *look* refractile, which
      // the cell's own defocus cannot supply: its own.
      //
      // A starch grain sits half a micrometre in front of or behind the middle
      // of the cell that carries it, and half a micrometre is about the whole
      // depth of field here — so a grain is never at the same focus as its cell,
      // and treating a cell as though it lay in one plane is what left the
      // pyrenoid and the granules invisible. Each body is given the defocus of
      // its own centre.
      float own = vDefocus + dot(s.xyz, d);

      // A grain is not a weak phase object and must not be drawn as one. The
      // transport-of-intensity equation describes something that retards the
      // wavefront *gently*; a half-micrometre sphere of starch at 1.53 against
      // a cytoplasm at 1.36 is a short-focus lens, and the first thing the
      // equation does with it is diverge at the margin and draw a hard bright
      // ring — which is what the first attempt here produced, a cell full of
      // little bubbles.
      //
      // What a lens does is the shape this atlas already argued for: light
      // through the middle is barely deviated and arrives, light through the
      // margin meets a surface steep enough to throw it out of the objective's
      // acceptance cone and does not. Bright through the centre, ringed with
      // dark. The *amount* is not a free parameter — it goes with the index step,
      // so a starch grain is brighter than the pyrenoid's protein matrix by the
      // ratio of their contrasts, and only the instrument's share of it is a
      // single coefficient.
      //
      // And it happens only near focus. Concentrating light is what a lens does
      // *at* its focus; a micrometre away there is nothing left to concentrate,
      // which is why racking the fine focus makes the granules come and go.
      float dn = (k == 0) ? ${(N_PYRENOID - N_CYTOPLASM).toFixed(3)}
                          : ${(N_STORAGE - N_CYTOPLASM).toFixed(3)};
      float across = sqrt(max(rad2 - perp2, 0.0)) / max(s.w, 1e-4);
      // It stops working when the circle it is spread into is wider than it is,
      // which is a statement about this body rather than a distance in
      // micrometres: a grain of a fifth of a micrometre gives up long before a
      // pyrenoid of one does, and a fixed depth had them all give up together —
      // and, at the settled layer's own thickness, give up everywhere.
      float spreadOwn = abs(own) * uTanAlpha;
      float near = 1.0 - smoothstep(0.6, 2.2, spreadOwn / max(s.w, 1e-4));
      bodyPhase += uLens * dn * near *
        (pow(across, 1.6) - 0.85 * pow(1.0 - across, 3.0));
    }

    // Optical path, relative to the medium. This is the quantity a phase object
    // has instead of a colour, and it is why an unstained grain is visible at
    // all.
    phase = body * (${N_CYTOPLASM.toFixed(3)} - ${N_MEDIUM.toFixed(3)})
          + wall * (${N_WALL.toFixed(3)} - ${N_MEDIUM.toFixed(3)})
          + pigment * (${N_CHLOROPLAST.toFixed(3)} - ${N_CYTOPLASM.toFixed(3)})
          + protein * (${N_PYRENOID.toFixed(3)} - ${N_CYTOPLASM.toFixed(3)})
          + storage * (${N_STORAGE.toFixed(3)} - ${N_CYTOPLASM.toFixed(3)});
  }

  void main() {
    float R = vCell.x;
    // Outside the cell and outside anything its defocus could have spread here,
    // nothing was drawn — and saying so with a discard rather than with a
    // transmittance of one keeps the depth write below off the empty field.
    float reach = R * 1.45 + vBlur * 1.25;
    if (dot(vLocal, vLocal) > reach * reach || vFade <= 0.002) discard;

    vec3 base = vCentre + uRight * vLocal.x + uUp * vLocal.y;

    for (int k = 0; k < ${TEXEL_ROW}; k++) {
      bodies[k] = vKind.x > 0.5
        ? vec4(0.0)
        : texture(uBodies, (vec2(float(k), vRow.x) + 0.5) / uBodiesSize);
    }

    // How many rays to send through the aperture. One when the cell is sharp —
    // a point images to a point — rising with the size of the circle it is being
    // spread into. This is the whole cost of the renderer and it is spent only
    // where it buys something.
    // How many rays it actually takes to fill the disc this cell is spread
    // into, which is a question about *pixels* and not about micrometres: a
    // blur of two pixels is covered by three rays and a blur of forty is not
    // covered by sixteen. Undersampling it is what turns a soft out-of-focus
    // cell into a stack of overlapping ghost discs — the one artefact of this
    // renderer that reads worse than the blur it replaced.
    float blurPx = vBlur * uPxPerUm;
    int taps = int(clamp(1.0 + blurPx * 0.9, 1.0, uTaps));

    // Where this pixel starts its spiral — and, crucially, *whether* it starts
    // it anywhere but the same place as its neighbours.
    //
    // Dithering only helps where the aperture is undersampled. Applied at every
    // blur it hurts: near focus the disc is a few pixels across, four rays
    // almost cover it, and giving each pixel of a 4x4 block a different quarter
    // of it makes neighbouring pixels disagree about an object that is *sharp* —
    // so the ordered pattern stops being invisible and prints itself over the
    // whole image as a cross-hatch. So it fades in with the blur, and by the
    // time it is on, the thing being sampled is smooth enough that the block
    // integrates.
    float spin = mix(0.5, dither(gl_FragCoord.xy), smoothstep(4.0, 12.0, blurPx));

    float pigment = 0.0, body = 0.0, wall = 0.0, phase = 0.0, bodyPhase = 0.0, edge = 0.0;
    float fringe = 0.0;
    float centrePhase = 0.0;
    for (int j = 0; j < 16; j++) {
      if (j >= taps) break;
      vec2 ap = vec2(0.0);
      if (taps > 1) {
        // A golden-angle spiral over the aperture disc, **in antipodal pairs**,
        // and the pairing is a correctness fix rather than a refinement.
        //
        // The spiral is well distributed for a few dozen samples and badly
        // *biased* for a handful: the mean of six points on it is nowhere near
        // the middle of the disc. Every ray is then offset by that mean, in the
        // same screen direction for every pixel and every cell, so the whole
        // image of a defocused cell slides sideways — and because its quad is
        // centred where the cell is, it was being cut off on one side. That was
        // the hard dark crescent on the lower right of every out-of-focus cell:
        // not optics, not the contour, but an aperture whose centre of gravity
        // was not its centre.
        //
        // Taking each sample together with its opposite makes the mean exactly
        // zero at any count, which is what an aperture actually is. The pixel's
        // dither offset rotates the pair, so the block still covers what one
        // pixel cannot.
        int pair = j >> 1;
        int side = j & 1;
        float t = (float(pair) + spin) / float(max(taps >> 1, 1));
        float a = float(pair) * GOLDEN + float(side) * 3.14159265;
        ap = vec2(cos(a), sin(a)) * sqrt(t);
      }
      vec3 lateral = uRight * ap.x + uUp * ap.y;
      // The ray that will land here, having come through this part of the lens:
      // displaced where it crosses the cell, and tilted, which is what makes the
      // near and far walls of a chloroplast disagree.
      vec3 origin = base + lateral * (vDefocus * uTanAlpha);
      vec3 dir = normalize(uForward + lateral * uTanAlpha);

      float p, b, w, ph, bp, ed, fr;
      trace(origin, dir, p, b, w, ph, bp, ed, fr);
      pigment += p; body += b; wall += w; phase += ph; bodyPhase += bp; edge += ed;
      fringe += fr;
      if (j == 0) centrePhase = ph;
    }
    float inv = 1.0 / float(taps);
    pigment *= inv; body *= inv; wall *= inv; phase *= inv; bodyPhase *= inv; edge *= inv;
    fringe *= inv;

    // Absorption: Beer-Lambert over a band, not at a wavelength. See the same
    // model in specimen.jsx — chlorophyll's lines are narrow and a camera's
    // channels are not, so at depth the light that survives is the part of each
    // band the pigment never covered.
    // The path is in micrometres now, which the measured colour was not. It is
    // the transmittance of *one unit* of pigment, and in the scene renderer a
    // unit was whatever the shell happened to be crossed at; here it is a real
    // length, so the two have to be related by a stated number. uPerUm is that
    // number: how much of a unit one micrometre of chloroplast is worth.
    vec3 x = uPigment * (pigment * uPerUm * vCell.y);
    vec3 transmittance = mix(exp(-x), exp(-x * uBandWeak), uBand);
    // The colourless parts take a little out of the beam too — not much, which
    // is what "colourless" means, and the wall rather more per micrometre than
    // the cytoplasm because it is denser matter.
    // What the colourless parts take out of the beam, which is very little —
    // that is what colourless means. It was set high enough to be carrying some
    // of the cell's density, and because it is neutral it was carrying it as
    // *grey*: the cells came out a good deal less saturated than the scene
    // renderer's, measured at a blue channel of 67 against its 33. Density in a
    // chloroplast belongs to the chloroplast.
    transmittance *= exp(-vec3(uCytoplasm) * (body + wall * 2.5));
    // **Rheinberg.** What the margin refuses to pass straight on is not lost —
    // it is deviated, and the condenser's outer ring is aimed so that deviated
    // light is exactly what the objective collects.
    //
    // So a pixel is two beams: the disc's, which came straight through and was
    // absorbed on the way, and the ring's, which arrives in proportion to how
    // much this part of the specimen bent it — and was absorbed on the way too,
    // because it crossed the same pigment. The second beam is the whole
    // technique. It is why a specimen appears in the lamp's colour on a ground
    // of the filter's, and why a body with no pigment at all, like an air
    // bubble, still comes out ringed in black and white.
    //
    // Two things deviate light here and both are real. The margin refracts —
    // the term that used to be only a dark contour, and is now a bright one as
    // well. And the body of a cell scatters in bulk, because a chloroplast is a
    // stack of membranes a few tens of nanometres apart and that is what such a
    // stack does; without it the inside of a cell would keep the ground's colour
    // and only its rim would light up, which is not what the reference shows.
    // The wall counts for rather less than its length suggests. It is denser
    // matter than cytoplasm, so per micrometre it scatters more — but an emptied
    // mother wall is *all* wall, and at three times the weight those came out as
    // the brightest objects in the field: bright yellow shells outshining the
    // living cells, for the one thing on the slide with nothing in it.
    float deviated = 1.0 - exp(-(uEdge * edge + uScatter * (pigment + wall * 1.2)));
    deviated = clamp(deviated + uFringe * fringe, 0.0, 1.0);

    // The two beams are composited by two different operations, because they
    // *are* two different operations.
    //
    // The disc's beam is absorbed on its way through, so it multiplies what is
    // behind it — and two cells one behind the other multiply, which is right.
    // The ring's beam is light the specimen put back into the objective, so it
    // adds — and two cells one behind the other *add* what each scatters, which
    // is also right. Written as one multiplicative factor, as it was, the second
    // one compounded: a knot of overlapping cells multiplied its own scattered
    // light together and went to a salmon-white blowout, which is the one part
    // of the frame where the arithmetic was visibly not the physics.
    //
    // So this pass carries the absorbed beam and the OBLIQUE pass beside it
    // carries the scattered one. Equal filters make uObliqueColor zero against
    // the field and the second pass contributes nothing, which is the check that
    // Rheinberg here is an illumination rather than a tint: plain brightfield is
    // the special case of it, not a separate path.
    #ifdef OBLIQUE
      // What the specimen sent into the objective, in absolute units — it
      // crossed the same pigment, so it carries the same transmittance.
      gl_FragDepth = uFocusDepth;
      gl_FragColor = vec4(uObliqueColor * transmittance * deviated, 1.0);
      return;
    #endif
    transmittance *= exp(-uEdge * edge) * (1.0 - deviated);

    // And the phase. The transport-of-intensity equation says the first-order
    // change in intensity with defocus goes as the Laplacian of the phase, and
    // the aperture samples above have already measured it: they probe the object
    // over a disc whose radius is the defocus itself, so the mean over that disc
    // minus the value at its centre *is* that Laplacian, at exactly the scale
    // the defocus makes it. It costs nothing extra, it is zero at focus because
    // the disc has no radius there, and it changes sign with the defocus —
    // which is the bright-centre-to-dark-centre flip you rack through.
    if (taps > 4 && uPhase > 0.0) {
      float spread = vDefocus * uTanAlpha;
      float lap = 4.0 * (phase - centrePhase) / max(spread * spread, 1e-6);
      // How much this estimate is worth. It is a mean over the aperture minus
      // the value at its centre, and with three rays that is not a mean — it is
      // three numbers, and the Laplacian read off them can be anything. The
      // emptied mother walls showed it first: large, thin, near focus, and
      // therefore sampled by two or three rays, they came out as solid grey
      // porcelain lunes, pinned against the clamp by an estimate made of noise.
      // So it is faded in as the aperture actually gets sampled.
      float trust = smoothstep(4.0, 10.0, float(taps));
      // Clamped, because the first-order transport-of-intensity equation is a
      // *first-order* result: at a boundary as sharp as a cell wall it predicts
      // a contrast over a hundred per cent within a micrometre of focus, which
      // is its own breakdown rather than a fact about cells. The real edge is
      // never sharper than the point-spread function and the contrast
      // saturates; this is where that saturation is stated.
      transmittance *= 1.0 - clamp(uPhase * trust * vDefocus * lap, -0.22, 0.22);
    }
    // The organelles, which do not wait for the cell to be off focus because
    // they were never in its plane to begin with. Added rather than multiplied:
    // a refractile body is bright because it gives back light the pigment would
    // otherwise have taken, and something given back lands on top of the taking.
    transmittance *= 1.0 + clamp(bodyPhase, -0.6, 0.9);

    // Spread past the point where it could be seen, a cell is not drawn at all
    // rather than drawn faint — see vFade.
    transmittance = mix(vec3(1.0), transmittance, vFade);

    // The instrument's contrast ceiling, and nothing may pass it.
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    // Bounded, and lower than it was, because this is the one place where the
    // oblique beam's arithmetic is not quite the physics. Multiply blending
    // composites two overlapping cells by multiplying what each returns; for the
    // absorbed beam that is exactly right, and for the *deviated* one it is not,
    // since two scatterers do not double the light the ring sends in. Keeping a
    // single cell's factor near one bounds the error where cells overlap
    // instead of letting it run away into white.
    transmittance = clamp(transmittance, 0.0, 2.2);

    // Tell the depth-of-field pass that this pixel is in focus, because it is:
    // the defocus was integrated above, through the object, which is something
    // a filter on the finished picture cannot do. Without this the cells would
    // be blurred twice — once correctly and once as a flat image.
    gl_FragDepth = uFocusDepth;
    gl_FragColor = vec4(transmittance, 1.0);
  }
`

// Absorption coefficients solved against the band model, so the measured colour
// is still returned at one unit of path. Same solve as specimen.jsx.
function absorbFrom(color, band, weak) {
  const c = new THREE.Color(color)
  const solve = (value) => {
    const target = Math.min(0.999, Math.max(0.0015, value))
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

// The condenser ring's beam, in the same absolute units the field is in.
//
// The oblique pass *adds*, so this is a radiance and not a ratio: three.Color
// holds it linear, which is the space the render target works in, so it can go
// straight in. Subtracting the disc is what makes plain brightfield fall out as
// the special case — with the two filters equal there is no light the ring can
// deliver that the disc did not already, so the second pass adds nothing.
function obliqueBeam(illumination) {
  const direct = new THREE.Color(illumination?.direct ?? '#ffffff')
  const oblique = new THREE.Color(illumination?.oblique ?? '#ffffff')
  return new THREE.Vector3(
    Math.max(0, oblique.r - direct.r),
    Math.max(0, oblique.g - direct.g),
    Math.max(0, oblique.b - direct.b),
  )
}

const ORIGIN = new THREE.Vector3()

export default function CellField2D({ form, focus, optics = {}, onSelect }) {
  const { cells, walls } = useMemo(() => buildPopulation(form), [form])
  // One mesh draws both. A mother wall is not a different kind of object from a
  // cell here — it is the same shell with nothing inside it, which is exactly
  // what it is on the slide — so it is the same shader with a flag, and the two
  // cannot drift apart in how they are lit or focused.
  const drawn = useMemo(
    () => [
      ...cells.map((c) => ({ ...c, kind: 0 })),
      ...walls.map((w) => ({ ...w, kind: w.torn ? 2 : 1 })),
    ],
    [cells, walls],
  )
  const meshRef = useRef()
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const size = useThree((s) => s.size)

  // The organelles, as a texture rather than as attributes: a cell carries a
  // variable number of them and an instanced attribute cannot.
  const bodies = useMemo(() => {
    const width = TEXEL_ROW
    // A row per drawn object, not per cell: the walls share the instance
    // numbering and would otherwise read off the end of the texture.
    const height = Math.max(1, drawn.length)
    const data = new Float32Array(width * height * 4)
    const inverse = new THREE.Quaternion()
    const local = new THREE.Vector3()
    drawn.forEach((cell, row) => {
      // Into the cell's own frame, which is the frame the shader marches in.
      inverse.copy(cell.q).invert()
      const put = (slot, b) => {
        if (!b || slot >= width) return
        local.set(b.x - cell.x, b.y - cell.y, b.z - cell.z).applyQuaternion(inverse)
        const at = (row * width + slot) * 4
        data[at] = local.x
        data[at + 1] = local.y
        data[at + 2] = local.z
        data[at + 3] = b.r
      }
      put(0, cell.pyrenoid)
      const refractile = [...(cell.plates ?? []), ...(cell.granules ?? [])]
      refractile.slice(0, BODIES_PER_CELL).forEach((b, i) => put(1 + i, b))
    })
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType)
    texture.needsUpdate = true
    return { texture, width, height }
  }, [drawn])
  useEffect(() => () => bodies.texture.dispose(), [bodies])

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1)
    const n = Math.max(1, drawn.length)
    const centre = new Float32Array(n * 3)
    const quat = new Float32Array(n * 4)
    const cell = new Float32Array(n * 4)
    const shape = new Float32Array(n * 3)
    const row = new Float32Array(n * 2)
    const kind = new Float32Array(n * 2)
    drawn.forEach((c, i) => {
      centre.set([c.x, c.y, c.z], i * 3)
      quat.set([c.q.x, c.q.y, c.q.z, c.q.w], i * 4)
      // The cup's opening and wall, which used to pick one of six meshes and is
      // now simply two numbers per cell — so no two chloroplasts in the field
      // are the same shape rather than six being repeated forty times.
      // For a cell this is the chloroplast's opening and the gauge of its sheet;
      // for a torn mother wall the opening is the tear, which is why both can be
      // carried by the same two numbers.
      const open = c.kind === 2 ? 0.8 + (c.variant ?? 0) * 0.5 : 0.62 + (c.variant / 5) * 0.73
      const thickness = 0.24 + ((c.variant * 37) % 5) * 0.055
      cell.set([c.r, c.density, open, thickness], i * 4)
      shape.set(c.shape ?? [1, 1, 1], i * 3)
      row.set([i, Math.min(BODIES_PER_CELL, (c.plates?.length ?? 0) + (c.granules?.length ?? 0))], i * 2)
      // A mother's wall is the same material as a daughter's and about the same
      // thickness, so the gauge multiplier is one; it is here because the shell
      // is the only structure a wall has and it is worth being able to say so.
      kind.set([c.kind, 1], i * 2)
    })
    plane.setAttribute('aCentre', new THREE.InstancedBufferAttribute(centre, 3))
    plane.setAttribute('aQuat', new THREE.InstancedBufferAttribute(quat, 4))
    plane.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 4))
    plane.setAttribute('aShape', new THREE.InstancedBufferAttribute(shape, 3))
    plane.setAttribute('aRow', new THREE.InstancedBufferAttribute(row, 2))
    plane.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 2))
    return plane
  }, [drawn])
  useEffect(() => () => geometry.dispose(), [geometry])

  const [material, oblique] = useMemo(() => {
    const band = 0.14
    const weak = 0.13
    const build = (scattered) => new THREE.ShaderMaterial({
      // One shader, two composites. See the OBLIQUE block in FRAGMENT: the
      // absorbed beam multiplies what is behind it and the scattered beam adds
      // to it, and those are two blend modes, so they are two draws.
      defines: scattered ? { OBLIQUE: '' } : {},
      uniforms: {
        uRight: { value: new THREE.Vector3(1, 0, 0) },
        uUp: { value: new THREE.Vector3(0, 1, 0) },
        uForward: { value: new THREE.Vector3(0, 0, -1) },
        uFocus: { value: 1 },
        uFocusDepth: { value: 0.5 },
        // The objective's acceptance half-angle. This is the number that decides
        // how shallow the focus is, and it is the objective's rather than the
        // specimen's — see the note where it is set.
        // Shallow, but not shallower than the specimen can survive. At 0.22 a
        // cell one micrometre off the plane is spread by a quarter of a
        // micrometre — six pixels at this magnification — and since the settled
        // layer is one cell thick, that put *every* cell in the field slightly
        // soft and none of them sharp. The point of an analytic renderer is the
        // cells that are in focus; there has to be some.
        // How fast the defocus grows — **a display allowance, chosen**, and the
        // one number here that is not the objective's.
        //
        // The objective is NA 1.25 in oil, which is what the rest of the atlas
        // claims and what RESOLUTION_UM in coccoid.js is computed from. Its true
        // acceptance half-angle gives tan(alpha) = 1.46, and that was tried: it
        // is correct, and it produces an unusable picture. A 1.25 lens has a
        // depth of field of about a fifth of a micrometre, the settled cells
        // span three micrometres by size alone, and the honest render is a green
        // haze with one size class faintly sharp in it. That is what such a lens
        // does; it is not what this view is for.
        //
        // So the depth of field is eased, and said to be. It is the same
        // allowance the cell view makes with depthFloor, for the same reason and
        // with the same standing: a decision about the picture, not a finding
        // about the specimen. The *resolution* below is not eased — nothing here
        // is drawn finer than the objective could deliver, which is the claim
        // that actually matters for an atlas.
        uTanAlpha: { value: optics.tanAlpha ?? 0.2 },
        // The Airy radius, and this one is the lens's own: lambda / 2NA at
        // 550 nm and NA 1.25 is 0.22 µm across, so 0.11 as a radius, rounded up
        // a little for the tails the Airy pattern has and a top-hat does not.
        uAiry: { value: optics.airyUm ?? 0.09 },
        uPigment: { value: absorbFrom(form.colour ?? '#80b854', band, weak) },
        uBand: { value: band },
        uBandWeak: { value: new THREE.Vector3(weak, weak, weak) },
        uCytoplasm: { value: 0.013 },
        uPhase: { value: optics.phase2d ?? 0.02 },
        uVeil: { value: 0.02 },
        uTaps: { value: optics.taps ?? 16 },
        uPxPerUm: { value: 20 },
        // A cell's sheet is crossed at something like a micrometre and a half
        // down its own axis, so that is what the measured colour is taken to be
        // the transmittance of.
        // Measured against the scene renderer, which is the one calibrated
        // against the CAUP plates, and re-measured whenever the geometry of the
        // sheet changed underneath it: the median cell there passes 120 of 195
        // in green, and this is what puts this renderer on the same figure. The
        // scene renderer's shell path is amplified by 1/cos while this one is
        // the true chord, so the two were never going to agree by construction —
        // only by measurement.
        uPerUm: { value: 1 / 0.78 },
        // Abbe again: nothing is imaged with an edge sharper than this, and the
        // closed-form Laplacian of a sphere needs to be told so or it runs away
        // at the silhouette.
        uResolve: { value: 0.11 },
        // One coefficient for every refractile body in the view, because what it
        // describes is the objective and not the grain: how much of what a small
        // lens redirects still lands inside the acceptance cone. What differs
        // between a starch grain and a pyrenoid is their index step, which is
        // measured, not this.
        uLens: { value: 2.6 },
        // Beyond about a micrometre off focus a body this small has nothing left
        // to concentrate.
        uLensDepth: { value: 1.1 },
        // How much of what the margin deviates leaves the acceptance cone. One
        // number for the instrument; what differs between a cell and an emptied
        // wall is their own index steps, which are measured.
        uEdge: { value: 3.4 },
        // And where that light goes. **This uniform was declared in the shader
        // and never supplied**, so WebGL held it at zero and every version of
        // the bright line outside a body was being multiplied away — which is
        // why it could not be found by looking at the picture, however many
        // times the term itself was rewritten. A uniform that is missing from
        // the JS side is not an error anywhere: it is simply nought.
        uFringe: { value: 2.4 },
        uObliqueColor: { value: obliqueBeam(optics.illumination) },
        // Per micrometre of chloroplast: how much the bulk of a cell deviates,
        // as opposed to its margin.
        //
        // Small, and it has to be. A Chlorella is a smooth, homogeneous little
        // sphere; what scatters strongly in the reference image are Euglena
        // stuffed with discrete chloroplast discs and paramylon grains, and
        // borrowing their figure made every cell here light up over its whole
        // area and stack into a white blowout wherever two overlapped. Under
        // Rheinberg most of what a smooth body does is at its edges — that is
        // the technique's whole character — and the bulk term is a minority of
        // it.
        uScatter: { value: 0.1 },
        uBodies: { value: bodies.texture },
        uBodiesSize: { value: new THREE.Vector2(bodies.width, bodies.height) },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      blending: scattered ? THREE.AdditiveBlending : THREE.MultiplyBlending,
      premultipliedAlpha: !scattered,
      transparent: true,
      // The scattered pass has nothing to say about distance that the absorbed
      // one has not already said.
      depthWrite: !scattered,
      depthTest: true,
      side: THREE.DoubleSide,
    })
    return [build(false), build(true)]
  }, [form.colour, bodies, optics.tanAlpha, optics.phase2d, optics.taps, optics.illumination])
  useEffect(
    () => () => {
      material.dispose()
      oblique.dispose()
    },
    [material, oblique],
  )

  // The camera's own basis, which is what turns a quad into a sensor plane, and
  // the plane of focus, which the fine focus moves. Both change every frame a
  // viewer is moving, so they are read here rather than rebuilt into the mesh.
  useFrame(() => {
    const centred = camera.position.distanceTo(controls?.target ?? ORIGIN)
    const plane = centred + (focus?.current ?? 0)
    // How many pixels a micrometre at the plane of focus covers, which is what
    // decides how finely the aperture has to be sampled.
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * plane
    const perUm = size.height / Math.max(2 * halfHeight, 1e-6)
    const { near, far } = camera
    const ndc = (far + near) / (far - near) - (2.0 * far * near) / ((far - near) * plane)
    // Both passes trace the same rays through the same specimen; only what they
    // do with the answer differs, so they must not be allowed to disagree about
    // where the camera is.
    for (const m of [material, oblique]) {
      const u = m.uniforms
      camera.matrixWorld.extractBasis(u.uRight.value, u.uUp.value, u.uForward.value)
      u.uForward.value.negate()
      u.uPxPerUm.value = perUm
      u.uFocus.value = plane
      u.uFocusDepth.value = ndc * 0.5 + 0.5
    }
  })

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, Math.max(1, drawn.length)]}
        frustumCulled={false}
        renderOrder={0}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.('cellBody')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      />
      {/* The condenser ring's beam, added after the disc's has been absorbed —
          light the specimen put back into the objective cannot be composited by
          multiplying the light that went through it. Not pickable: it is the
          same bodies seen a second way. */}
      <instancedMesh
        args={[geometry, oblique, Math.max(1, drawn.length)]}
        frustumCulled={false}
        renderOrder={1}
        raycast={() => null}
      />
    </>
  )
}
