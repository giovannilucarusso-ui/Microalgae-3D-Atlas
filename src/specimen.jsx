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
    vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
    vNormalView = normalMatrix * objectNormal;
    vViewDir = -mv.xyz;
    vDistance = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAGMENT = /* glsl */ `
  uniform vec3 uAbsorb;
  uniform float uDensity;
  uniform float uEdge;
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

  void main() {
    // The trichome is drawn as a length of itself. Outside that length there
    // is nothing — which is how the filament comes apart without rebuilding
    // any geometry.
    if (vUv.x < uSpan.x || vUv.x > uSpan.y) discard;

    vec3 N = normalize(vNormalView);
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
    #endif
    float modulation = uUseMap > 0.5 ? 2.0 * texture2D(uMap, vUv).r : 1.0;
    float density = uDensity;
    #ifdef PER_INSTANCE
      density *= vDensity;
    #endif
    vec3 transmittance = exp(-uAbsorb * (path * density * modulation) - uEdge * pow(1.0 - ndv, 3.0));

    // The necridium: an intercalary cell that dies on purpose. It loses its
    // contents and fills with mucilage, so it stops absorbing long before the
    // filament actually parts there — the pale cell is the warning.
    float necrosis = uNecrosis *
      (1.0 - smoothstep(0.0, uNecrosisWidth, abs(vUv.x - uNecrosisAt)));
    transmittance = mix(transmittance, vec3(0.93, 0.95, 0.93), necrosis * 0.88);

    // Out of the focal depth the contrast washes out towards the open field.
    float haze = smoothstep(uHazeNear, uHazeFar, vDistance);
    transmittance = mix(transmittance, vec3(1.0), clamp(max(haze, uFade), 0.0, 1.0));

    gl_FragColor = vec4(transmittance, 1.0);
  }
`

// Just outside the outline sits the bright line every refractive body shows
// against a bright field — the one cue that says "this is in water, not on a
// black backdrop". Drawn on a slightly inflated shell, added rather than
// multiplied, because it is light the specimen bent towards you.
const HALO_FRAGMENT = /* glsl */ `
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
    vec3 N = normalize(vNormalView);
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
    vec3 N = normalize(vNormalView);
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

// Absorption coefficients from the colour the thickest part lets through.
function absorbFrom(color) {
  const c = new THREE.Color(color)
  return new THREE.Vector3(
    -Math.log(Math.max(c.r, 0.002)),
    -Math.log(Math.max(c.g, 0.002)),
    -Math.log(Math.max(c.b, 0.002)),
  )
}

export function specimenMaterial({
  core = '#2c5f56',
  density = 1,
  edge = 0.5,
  haze = [1e9, 1e9],
  map = null,
  // Set when the mesh is instanced and each instance carries its own `aDensity`.
  perInstance = false,
  // Set for a body that is a wall rather than a solid — see SHELL above. It
  // switches the path model and draws both sides, because a wall crossed twice
  // has to absorb twice.
  shell = false,
  // Off for bodies drawn inside other bodies. Multiply blending is commutative,
  // so two absorbers in the same beam give the same answer in either order —
  // but the depth test is not, and with it on the nearer surface simply rejects
  // the further one. A chloroplast inside a cell, or a cell behind a cell, has
  // to *multiply*: that is what transmitted light does, and it is why two
  // overlapping cells are darker than one.
  depthWrite = true,
} = {}) {
  return new THREE.ShaderMaterial({
    defines: { ...(perInstance ? { PER_INSTANCE: '' } : {}), ...(shell ? { SHELL: '' } : {}) },
    uniforms: {
      uAbsorb: { value: absorbFrom(core) },
      uDensity: { value: density },
      uEdge: { value: edge },
      uHazeNear: { value: haze[0] },
      uHazeFar: { value: haze[1] },
      uFade: { value: 0 },
      uMap: { value: map },
      uUseMap: { value: map ? 1 : 0 },
      uSpan: { value: new THREE.Vector2(0, 1) },
      uNecrosis: { value: 0 },
      uNecrosisAt: { value: 0.5 },
      uNecrosisWidth: { value: 0.012 },
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
export default function Debris({ field = 451.3, seed = 17 }) {
  const k = field / 451.3
  const spread = 320 * k
  const depth = 260 * k
  const specks = useRef([])
  const reduced = usePrefersReducedMotion()

  const { items, geometries, materials } = useMemo(() => {
    const rnd = seededRandom(seed)
    const geometries = {
      speck: new THREE.SphereGeometry(1, 8, 6),
      flake: new THREE.IcosahedronGeometry(1, 0),
      coccus: new THREE.SphereGeometry(1, 16, 12),
    }
    // Everything on the slide fades towards the open field with depth: contrast
    // is the first thing an out-of-focus object loses, before its shape.
    const haze = [520 * k, 1400 * k]
    const materials = {
      grit: specimenMaterial({ core: '#5a5f55', density: 1, edge: 0.9, haze }),
      flake: specimenMaterial({ core: '#7a6a4a', density: 0.9, edge: 0.7, haze }),
      coccus: specimenMaterial({ core: '#4c7a56', density: 1, edge: 0.8, haze }),
      filament: specimenMaterial({ core: '#5c8579', density: 0.8, edge: 0.5, haze }),
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
        scale: (0.5 + rnd() * 2.2) * k,
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
        scale: [(3 + rnd() * 7) * k, (1 + rnd() * 2) * k, (3 + rnd() * 6) * k],
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
        scale: (2 + rnd() * 3) * k,
      })
    }

    // Neighbouring trichomes, well off the focal plane. In a real sample they
    // are always there, and the plane of focus cuts them into soft bands —
    // which is exactly what makes the subject read as the one thing in focus.
    for (let i = 0; i < 2; i++) {
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
