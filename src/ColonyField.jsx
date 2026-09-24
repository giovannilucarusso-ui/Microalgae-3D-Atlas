// A drop of Volvox colonies, down the same objective as everything else.
//
// The same kind of renderer as the euglenoid and haptophyte fields — one
// screen-facing quad per body, the body integrated as a function along its own
// ray, the blur averaged rather than sampled, and the result laid into the two
// buffers of the condenser's two beams (twoBeam.jsx) — with one new problem,
// which is the organism's: **a colony is a thousand bodies, not one.**
//
// Drawing a thousand cells a colony as a thousand quads would be exact and
// ruinous. Almost all of them are out of focus: a colony half a millimetre
// across puts its front and back faces a quarter of a millimetre either side of
// any plane the objective can hold, and there each cell is blurred over tens of
// micrometres, overlapping hundreds of its neighbours. A cell blurred over many
// spacings is no longer an image of a cell — it is the blurred *density* of the
// layer, and that has a closed form: a layer of cells on a sphere is a shell,
// and the path a ray makes through a shell is the difference of two chords, the
// same arithmetic the other fields use for a body, averaged over the blur. It is
// what makes a colony bright at its rim and dim in its middle, because a ray at
// the rim runs along the layer for tens of micrometres and a ray through the
// middle crosses it twice, briefly. The footage's profile says exactly that.
//
// Near focus the cells are resolved, and there the shader finds them. The cells
// sit on a spherical Fibonacci lattice (volvocine.js), whose nearest point to
// any direction is a closed-form lookup, so for each ray the cells near where it
// meets the layer are found without a list: at the front face, at the back, and
// — near the rim, where one ray grazes the layer along a chord and passes
// several rows of cells — at the tangent point too, with the ones found twice
// counted once. Each is drawn at its own defocus.
//
// Between the two the handover is by blur, and it conserves the light. A cell
// is drawn as itself in proportion w = exp(−(blur / 0.28 spacing)²), and the
// continuous layer carries the rest, (1 − w), at the same depth. Where the blur
// is small against the spacing the cells stand apart and the four nearest
// lattice points are all that reach a pixel; where it is large the lattice
// would need every neighbour and the shell has them all. The handover is kept
// low on purpose. At 0.45 of the spacing, tried first, the cells were still
// being drawn at blurs where their second neighbours reach the pixel too, the
// four found fell short of the mean, and every face coming into focus was
// ringed by a dark annulus. What is given up is the last few per cent of
// texture a lattice keeps at that blur, which the objective is losing there
// anyway.
//
// **And in darkfield it is scattered light that draws them.** The ground is the
// condenser's blacked-out disc; everything bright is light from the ring that
// something on the slide bent into the objective. A somatic cell scatters from
// its whole body and more strongly from one small refractile point inside it —
// the footage's rim is a string of bright points, not of discs — and what it
// scatters has crossed its own chloroplast on the way out, so it is green. A
// mote of bacterium or detritus scatters every colour alike, so it is white, as
// the footage's are. An offspring colony is denser than its parent's layer and
// its light has crossed more plastid, so it is the most saturated green in the
// field, as the footage's are.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { FIBONACCI_GLSL, buildColonies, childPose, colonyPose, motePosition, newPose } from './volvocine.js'
import {
  CHORD_GLSL,
  LayerComposite,
  absorbFrom,
  createLayers,
  disposeLayers,
  drawLayers,
  obliqueBeam,
} from './twoBeam.jsx'

// What each kind of body scatters, as an effective cross-section: the share of
// the ring's light a body bends into the objective. None of these has been
// measured for Volvox; each is set at the strength that returns the footage's
// levels over its own ground — the haze of a colony's out-of-focus faces, its
// rim, its young and its motes — and the cards say so. What is not chosen is
// the geometry they multiply: the count, the spacing, the layer and the defocus
// are the organism's and the objective's.
const SCATTER = {
  // Per µm² of a cell's cross-section, the same for a somatic cell and for a
  // cell of an embryo or a juvenile. A cell scatters for its size, so a
  // juvenile's small cells scatter less each — and there are so many to the
  // square micrometre that a juvenile is still the brightest thing in a
  // colony, as the footage's are.
  perArea: 0.23,
  // A cell's refractile point, which in focus is under a pixel across and is
  // what makes the rim sparkle. For a somatic cell six micrometres across;
  // smaller cells carry smaller ones.
  granule: 2.6,
  // A juvenile's cytoplasm is denser than a somatic cell's.
  offspring: 2.2,
  // Per µm of path through an undivided gonidium, and per unit of its edge.
  solid: 0.02,
  edge: 0.05,
  // A mote: colourless, and scattering for its size far more than a cell does,
  // because it is dense and has an edge all round.
  mote: 2.2,
}

// The scatter of one cell of radius a, and of its refractile point.
const cellTone = (a, dense) => [
  SCATTER.perArea * Math.PI * a * a * dense,
  SCATTER.granule * Math.min(1, (a / 3) ** 2) * dense,
]

// Micrometres of chloroplast the light a body scatters crosses on its way out,
// on average. A somatic cell is six micrometres across and its plastid a cup
// round its base; an offspring's light crosses many small cells packed tight.
const OWN_PATH = { cell: 3.2, offspring: 11 }

// The share of a somatic cell that is chloroplast, for what the direct beam
// loses crossing the layer. It matters only without a filter; in darkfield the
// direct beam is the ground and there is almost nothing of it to lose.
const PLASTID_SHARE = 0.4

const VERTEX = /* glsl */ `
  attribute vec4 aCentre;  // world position; radius of the layer or the body
  attribute vec4 aAxis;    // anterior axis; radius of a cell
  attribute vec4 aSpin;    // first frame vector; number of cells
  attribute vec4 aLook;    // kind, spacing, own path, seed
  attribute vec4 aTone;    // cell scatter, granule scatter, pigment density, solid scatter

  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform float uFocus;
  uniform float uTanAlpha;
  uniform float uAiry;
  uniform float uPxPerUm;

  varying vec4 vShape;
  varying vec4 vLook;
  varying vec4 vTone;
  varying vec3 vAxis;
  varying vec3 vE1;
  varying vec2 vLocal;
  varying float vDefocus;

  void main() {
    vec4 view = modelViewMatrix * vec4(aCentre.xyz, 1.0);
    float defocus = -view.z - uFocus;
    float R = aCentre.w + aAxis.w;
    // The quad holds the body grown by the widest blur any part of it has.
    float spread = (abs(defocus) + R) * uTanAlpha;
    float blur = sqrt(uAiry * uAiry + spread * spread);
    float reach = R + 2.8 * blur + 4.0 / max(uPxPerUm, 1e-3) + 0.5;
    vec2 corner = position.xy * 2.0 * reach;

    vShape = vec4(aCentre.w, aAxis.w, aSpin.w, aLook.x);
    vLook = vec4(aLook.y, aLook.z, aLook.w, aTone.z);
    vTone = aTone;
    vAxis = normalize(aAxis.xyz);
    vE1 = normalize(aSpin.xyz);
    vLocal = corner;
    vDefocus = defocus;

    vec3 world = aCentre.xyz + uRight * corner.x + uUp * corner.y;
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
  uniform float uPlastidShare;
  uniform float uSolidEdge;
  uniform float uMote;
  uniform float uVeil;
  uniform vec3 uObliqueColor;

  varying vec4 vShape;
  varying vec4 vLook;
  varying vec4 vTone;
  varying vec3 vAxis;
  varying vec3 vE1;
  varying vec2 vLocal;
  varying float vDefocus;

  ${CHORD_GLSL}
  ${FIBONACCI_GLSL}

  float blurAt(float defocus, float pixel) {
    float spread = defocus * uTanAlpha;
    return sqrt(uAiry * uAiry + spread * spread + pixel * pixel);
  }

  // A body of variance v, normalised: one of it, spread over the image.
  float spot(float r2, float v) {
    return exp(-0.5 * r2 / v) / (6.2831853 * v);
  }

  // The path through a shell between radii ri and ro, averaged over the blur.
  // One box of the blur's width puts a kink wherever its edge crosses the
  // shell's rim, and a thin shell's rim is a singularity, so the kink is a
  // ring: three boxes of different widths spread it into a smooth shoulder,
  // which is closer to what a defocused lens does anyway.
  float shellPath(float rho, float ri, float ro, float w) {
    float p = 0.0;
    p += 0.25 * (halfChord(rho, ro, 0.45 * w) - halfChord(rho, ri, 0.45 * w));
    p += 0.5 * (halfChord(rho, ro, w) - halfChord(rho, ri, w));
    p += 0.25 * (halfChord(rho, ro, 1.55 * w) - halfChord(rho, ri, 1.55 * w));
    return max(p, 0.0);
  }

  // How much of a cell is drawn as itself rather than as the layer.
  float resolved(float w, float spacing) {
    float x = w / (0.28 * spacing);
    return exp(-x * x);
  }

  vec3 jitter(float n) {
    return fract(sin(vec3(n, n + 1.7, n + 3.1)) * vec3(43758.5453, 22578.1459, 19642.349)) - 0.5;
  }

  // Through um micrometres of chloroplast.
  vec3 plastid(float um) {
    vec3 x = uPigment * max(um, 0.0);
    return mix(exp(-x), exp(-x * uBandWeak), uBand);
  }

  void main() {
    float kind = vShape.w;
    float pixel = 0.6 / max(uPxPerUm, 1e-3);
    float rho = length(vLocal);
    vec3 toward = -uForward;

    // Cells per square micrometre of image, refractile points per square
    // micrometre, micrometres of plastid on the ray, and a solid body's own
    // scattered light.
    float cells = 0.0;
    float points = 0.0;
    float column = 0.0;
    float solid = 0.0;

    if (kind < 0.5) {
      // --- A sphere of cells: a colony, an embryo or a juvenile. ------------
      float Rc = vShape.x;
      float a = max(vShape.y, 0.05);
      float n = vShape.z;
      float spacing = vLook.x;
      // Cells per cubic micrometre of the layer: n of them in a shell one cell
      // thick.
      float perVolume = n / (12.566371 * Rc * Rc * 2.0 * a);

      // Where the ray meets the middle of the layer, front and back.
      float zc = sqrt(max(Rc * Rc - rho * rho, 0.0));

      // The layer as a density. The path through a thin shell is nearly flat
      // across the disc and piles up at the rim, so what its blur has to get
      // right is the rim — which lies at the sphere's own depth, front and back
      // alike. Blurred at each pixel's own depth instead, the ramp up to the
      // rim was steepened wherever the blur grew towards it, and drew a false
      // ring inside every defocused juvenile.
      float wRim = max(0.866 * blurAt(vDefocus, pixel), 0.03);
      float sheet = shellPath(rho, max(Rc - a, 1e-3), Rc + a, wRim);
      // Which of it is drawn as cells instead is decided where each half of
      // the shell actually is.
      for (int h = 0; h < 2; h++) {
        float z = h == 0 ? zc : -zc;
        float w = max(0.866 * blurAt(vDefocus - z, pixel), 0.03);
        cells += perVolume * sheet * (1.0 - resolved(w, spacing));
      }
      points = cells;

      // The layer as cells, where they are resolved.
      vec3 e2 = cross(vAxis, vE1);
      vec3 across = uRight * vLocal.x + uUp * vLocal.y;
      float seen[12];
      int found = 0;
      float drawn = 0.0;
      float sparks = 0.0;
      bool rim = rho > Rc - 3.0 * spacing;
      for (int k = 0; k < 3; k++) {
        if (k == 1 && zc < 1e-3) continue;
        if (k == 2 && !rim) continue;
        float z = k == 0 ? zc : (k == 1 ? -zc : 0.0);
        if (resolved(blurAt(vDefocus - z, pixel), spacing) < 0.004) continue;
        vec3 X = across + toward * z;
        float lx = length(X);
        if (lx < 1e-3) continue;
        vec3 dir = X / lx;
        vec4 near = latticeNear(vec3(dot(dir, vE1), dot(dir, e2), dot(dir, vAxis)), n);
        for (int c = 0; c < 4; c++) {
          float id = near[c];
          bool twice = false;
          for (int j = 0; j < 12; j++) {
            if (j < found && seen[j] == id) twice = true;
          }
          if (twice || found >= 12) continue;
          seen[found] = id;
          found++;
          // The cell: its lattice point, jittered along the surface.
          vec3 q = latticePoint(id, n);
          vec3 j = jitter(id * 1.37 + vLook.z);
          j -= dot(j, q) * q;
          q = normalize(q + j * (0.9 * spacing / Rc));
          vec3 P = Rc * (q.x * vE1 + q.y * e2 + q.z * vAxis);
          float wi = blurAt(vDefocus - dot(P, toward), pixel);
          float mi = resolved(wi, spacing);
          if (mi < 0.004) continue;
          vec2 d = vLocal - vec2(dot(P, uRight), dot(P, uUp));
          // Its body, a sphere of radius a: variance a²/5 in projection, and
          // the blur's — a disc of radius wi, variance wi²/4.
          drawn += mi * spot(dot(d, d), 0.2 * a * a + 0.25 * wi * wi);
          // And its refractile point, a little inside it, towards the
          // colony's middle, where the plastid is.
          vec3 G = P * (1.0 - 0.35 * a / Rc) + jitter(id * 2.11 + vLook.z) * (0.5 * a);
          vec2 g = vLocal - vec2(dot(G, uRight), dot(G, uUp));
          sparks += mi * spot(dot(g, g), 0.03 + 0.25 * wi * wi);
        }
      }
      cells += drawn;
      points += sparks;
      column = cells * (4.18879 * a * a * a) * uPlastidShare * vLook.w;
    } else {
      // --- A solid body: an undivided gonidium, or a mote. ------------------
      float R = max(vShape.x, 0.05);
      float w = max(0.866 * blurAt(vDefocus, pixel), 0.03);
      // Its path, exact under a small blur; under a large one a normalised
      // spot, so a body far out of focus keeps the light it had.
      float sharp = 2.0 * halfChord(rho, R, w);
      float v = 0.2 * R * R + w * w;
      float soft = 4.18879 * R * R * R * spot(rho * rho, v);
      float path = mix(sharp, soft, smoothstep(0.4 * R, 1.6 * R, w));
      // Light refracted at the edge, bounded by the blur, which is what an
      // image of an edge is.
      float edge = abs(2.0 * halfChordSlope(rho, R, w));
      edge = clamp(edge * 0.3, 0.0, 1.0);
      if (kind < 1.5) {
        solid = vTone.w * path + uSolidEdge * edge * edge;
        column = path * vLook.w;
      } else {
        solid = uMote * (path / max(R, 0.05) * 0.25 + edge * edge * 0.5);
      }
    }

    if (cells < 1e-7 && column < 1e-6 && solid < 1e-7) discard;

    #ifdef OBLIQUE
      // Scattered light, filtered by the plastid it crossed on the way out.
      // A mote has none, and comes out the colour of the lamp. A cell's
      // refractile point sits inside its plastid, so its light crosses about
      // half as much.
      vec3 own = plastid(vLook.y);
      vec3 spark = plastid(0.5 * vLook.y);
      vec3 light = own * (vTone.x * cells) + spark * (vTone.y * points);
      light += (kind > 1.5 ? vec3(1.0) : own) * solid;
      gl_FragColor = vec4(uObliqueColor * light, 1.0);
      return;
    #endif

    vec3 transmittance = plastid(column);
    transmittance = mix(transmittance, vec3(1.0), uVeil);
    gl_FragColor = vec4(transmittance, 1.0);
  }
`

// The static half of every instance, and the list saying which colony, child
// or mote it is. Parents first, each followed by its offspring, then the motes.
function instancesOf(colonies, motes) {
  const list = []
  colonies.forEach((colony, ci) => {
    list.push({ type: 'colony', ci })
    colony.offspring.forEach((child, oi) => list.push({ type: 'child', ci, oi }))
  })
  motes.forEach((mote, mi) => list.push({ type: 'mote', mi }))
  return list
}

const P = new THREE.Vector3()
const Q = new THREE.Vector3()

export default function ColonyField({ form, focus, optics = {}, swimming = true }) {
  const { colonies, motes, tile } = useMemo(() => buildColonies(form), [form])
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const size = useThree((s) => s.size)
  const clock = useRef(0)
  const list = useMemo(() => instancesOf(colonies, motes), [colonies, motes])
  const poses = useMemo(() => colonies.map(() => newPose()), [colonies])
  const child = useMemo(() => newPose(), [])

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1)
    const count = Math.max(1, list.length)
    const make = () => new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4)
    const attributes = { aCentre: make(), aAxis: make(), aSpin: make(), aLook: make(), aTone: make() }
    const set = (name, i, values) => attributes[name].array.set(values, i * 4)
    list.forEach((item, i) => {
      if (item.type === 'colony') {
        const { layer, seed } = colonies[item.ci]
        set('aCentre', i, [0, 0, 0, layer.radiusUm])
        set('aAxis', i, [0, 0, 1, layer.cellUm / 2])
        set('aSpin', i, [1, 0, 0, layer.cells])
        set('aLook', i, [0, layer.spacingUm, OWN_PATH.cell, seed])
        set('aTone', i, [...cellTone(layer.cellUm / 2, 1), 1, 0])
      } else if (item.type === 'child') {
        const colony = colonies[item.ci]
        const o = colony.offspring[item.oi]
        const seed = colony.seed * 13 + item.oi * 7
        if (o.layer) {
          set('aCentre', i, [0, 0, 0, o.layer.radiusUm])
          set('aAxis', i, [0, 0, 1, o.layer.cellUm / 2])
          set('aSpin', i, [1, 0, 0, o.layer.cells])
          set('aLook', i, [0, o.layer.spacingUm, OWN_PATH.offspring, seed])
          // Dense: a juvenile's cells hold as much plastid for their size as
          // a gonidium does.
          set('aTone', i, [...cellTone(o.layer.cellUm / 2, SCATTER.offspring), 2.2, 0])
        } else {
          set('aCentre', i, [0, 0, 0, o.radiusUm])
          set('aAxis', i, [0, 0, 1, 0])
          set('aSpin', i, [1, 0, 0, 0])
          // An undivided gonidium: its light crosses about its own radius of
          // cytoplasm, most of it plastid.
          set('aLook', i, [1, 0, o.radiusUm * 0.7, seed])
          set('aTone', i, [0, 0, 0.5, SCATTER.solid])
        }
      } else {
        const m = motes[item.mi]
        set('aCentre', i, [0, 0, 0, m.radiusUm])
        set('aAxis', i, [0, 0, 1, 0])
        set('aSpin', i, [1, 0, 0, 0])
        set('aLook', i, [2, 0, 0, 0])
        set('aTone', i, [0, 0, 0, 0])
      }
    })
    for (const [name, attribute] of Object.entries(attributes)) {
      if (name === 'aCentre' || name === 'aAxis' || name === 'aSpin') attribute.setUsage(THREE.DynamicDrawUsage)
      plane.setAttribute(name, attribute)
    }
    return plane
  }, [list, colonies, motes])
  useEffect(() => () => geometry.dispose(), [geometry])

  const materials = useMemo(() => {
    const band = form.band ?? [0.12, 0.12, 0.12]
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
          uPxPerUm: { value: 1 },
          // One micrometre of chloroplast is one unit of the record's colour.
          uPigment: { value: absorbFrom(form.colour, band, weak) },
          uBand: { value: new THREE.Vector3(...band) },
          uBandWeak: { value: new THREE.Vector3(...weak) },
          uPlastidShare: { value: PLASTID_SHARE },
          uSolidEdge: { value: SCATTER.edge },
          uMote: { value: SCATTER.mote },
          uVeil: { value: 0.02 },
          uObliqueColor: { value: obliqueBeam(optics.illumination) },
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
    return { absorbing: build(false), scattering: build(true) }
  }, [form, optics.tanAlpha, optics.airyUm, optics.illumination])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  const layers = useMemo(() => {
    const count = Math.max(1, list.length)
    return createLayers(
      [new THREE.InstancedMesh(geometry, materials.absorbing, count)],
      [new THREE.InstancedMesh(geometry, materials.scattering, count)],
    )
  }, [geometry, materials, list.length])
  useEffect(() => () => disposeLayers(layers), [layers])

  useFrame((state, delta) => {
    // The drop's own clock, which stops when swimming is switched off.
    if (swimming) clock.current += Math.min(delta, 0.1)
    const t = clock.current
    const stage = controls?.target ?? Q.set(0, 0, 0)
    // Wrapped round the block of culture, centred on the stage: a colony
    // leaving on one side comes back on the other, where nobody is looking.
    const wrap = (v) => {
      v.x = stage.x + (((v.x - stage.x + 0.5 * tile[0]) % tile[0]) + tile[0]) % tile[0] - 0.5 * tile[0]
      v.y = stage.y + (((v.y - stage.y + 0.5 * tile[1]) % tile[1]) + tile[1]) % tile[1] - 0.5 * tile[1]
      return v
    }

    const centre = geometry.getAttribute('aCentre')
    const axis = geometry.getAttribute('aAxis')
    const spin = geometry.getAttribute('aSpin')
    const put = (array, i, v) => {
      array[i * 4] = v.x
      array[i * 4 + 1] = v.y
      array[i * 4 + 2] = v.z
    }
    const write = (i, pose) => {
      put(centre.array, i, pose.centre)
      put(axis.array, i, pose.axis)
      put(spin.array, i, pose.e1)
    }
    list.forEach((item, i) => {
      if (item.type === 'colony') {
        const pose = colonyPose(colonies[item.ci], t, poses[item.ci])
        wrap(pose.centre)
        write(i, pose)
      } else if (item.type === 'child') {
        write(i, childPose(poses[item.ci], colonies[item.ci].offspring[item.oi], child))
      } else {
        put(centre.array, i, wrap(motePosition(motes[item.mi], t, P)))
      }
    })
    for (const a of [centre, axis, spin]) a.needsUpdate = true

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
