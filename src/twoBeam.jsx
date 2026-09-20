// The part of an analytic field renderer that is not about any one organism.
//
// A renderer that integrates a cell as a function along its own ray — the
// euglenoid field, the haptophyte field — ends with a transmittance per pixel
// for the condenser's direct beam and a scattered light per pixel for its ring.
// What happens to those two numbers from there on is the microscope's, and it
// was written once, for Euglena, and is shared from here rather than copied into
// every renderer that needs it:
//
//   · turning a measured colour into absorption coefficients over a band;
//   · the two beams of a condenser filter, in the field's own units;
//   · the transfer function of the objective, for anything near its limit;
//   · and drawing the whole field into two plain offscreen buffers, laid over
//     the frame with one full-screen pass each.
//
// Moved here from EuglenaField.jsx unchanged, so what it does is argued there
// and in the comments below as it was.
import * as THREE from 'three'

// A measured transmittance, as absorption coefficients over a band.
//
// An sRGB channel is about a hundred nanometres wide and a pigment's absorption
// bands are not, so part of every channel is light the pigment nearly misses:
// T = (1 − w)·exp(−a·x) + w·exp(−k·a·x). `a` is solved so the model still gives
// the measured colour at unit path; only the behaviour away from it changes —
// dense regions walk to a dark desaturated colour instead of clipping a channel
// to zero. `band` is w and `weak` is k, each the same for every channel or one
// per channel.
export function absorbFrom(color, band, weak) {
  const c = new THREE.Color(color)
  const bands = Array.isArray(band) ? band : [band, band, band]
  const weaks = Array.isArray(weak) ? weak : [weak, weak, weak]
  const solve = (value, w, k) => {
    const target = Math.min(0.999, Math.max(0.0015, value))
    const at = (a) => (1 - w) * Math.exp(-a) + w * Math.exp(-k * a)
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
  return new THREE.Vector3(solve(c.r, bands[0], weaks[0]), solve(c.g, bands[1], weaks[1]), solve(c.b, bands[2], weaks[2]))
}

// The condenser ring's beam, in the same absolute units the field is in. Equal
// filters give zero and the whole Rheinberg term disappears.
export function obliqueBeam(illumination) {
  const direct = new THREE.Color(illumination?.direct ?? '#ffffff')
  const oblique = new THREE.Color(illumination?.oblique ?? '#ffffff')
  return new THREE.Vector3(
    Math.max(0, oblique.r - direct.r),
    Math.max(0, oblique.g - direct.g),
    Math.max(0, oblique.b - direct.b),
  )
}

export function directBeam(illumination) {
  const direct = new THREE.Color(illumination?.direct ?? '#ffffff')
  return new THREE.Vector3(direct.r, direct.g, direct.b)
}

// The incoherent optical transfer function of a circular pupil, at a spatial
// frequency given as a fraction of the cut-off: how much of a pattern's contrast
// the objective passes. Zero at and beyond the cut-off.
export function transfer(nu) {
  if (nu >= 1) return 0
  return (2 / Math.PI) * (Math.acos(nu) - nu * Math.sqrt(1 - nu * nu))
}

// The shear of the DIC prism, as a unit vector in the image.
export function shearOf(illumination) {
  const [x, y] = illumination?.shear ?? [1, -1]
  const n = Math.hypot(x, y) || 1
  return new THREE.Vector2(x / n, y / n)
}

// The chord a ray cuts through a circle, integrated over the blur rather than
// sampled — the reason a defocused cell in these fields comes out soft instead of
// doubled. See the note at the top of EuglenaField.jsx. A body whose section is
// an ellipse uses the same functions: the chord of an ellipse is the chord of a
// circle of its projected half-width, rescaled.
export const CHORD_GLSL = /* glsl */ `
  // The integral of the half chord √(R² − x²) from 0 to x — the area under a
  // quarter circle — clamped so it stays flat outside the body.
  float capArea(float x, float R) {
    float r = max(R, 1e-4);
    float xc = clamp(x, -r, r);
    return 0.5 * (xc * sqrt(max(r * r - xc * xc, 0.0)) + r * r * asin(clamp(xc / r, -1.0, 1.0)));
  }

  // The half chord at c, averaged over [c - w, c + w]. At w -> 0 it is the
  // half chord itself; at any w it conserves what the body holds.
  float halfChord(float c, float R, float w) {
    return (capArea(c + w, R) - capArea(c - w, R)) / (2.0 * w);
  }

  // Its slope across the cell. Bounded by the blur, which is what an image of
  // an edge is: the steepness of a margin is never more than the point-spread
  // function lets it be.
  float halfChordSlope(float c, float R, float w) {
    float a = sqrt(max(R * R - (c + w) * (c + w), 0.0));
    float b = sqrt(max(R * R - (c - w) * (c - w), 0.0));
    return (a - b) / (2.0 * w);
  }

  // Its curvature, for the phase term. The same average taken once more, with
  // the slope's singularity at the margin held to the blur.
  float halfChordCurve(float c, float R, float w) {
    float floorR = w * R;
    float xa = c + w;
    float xb = c - w;
    float sa = abs(xa) < R ? -xa / sqrt(max(R * R - xa * xa, floorR)) : 0.0;
    float sb = abs(xb) < R ? -xb / sqrt(max(R * R - xb * xb, floorR)) : 0.0;
    return (sa - sb) / (2.0 * w);
  }
`

// The two beams, laid over the frame.
//
// The cells are not drawn into the scene directly. They were, and on the
// machine this was tuned on it cost a third of the frame rate for nothing: the
// scene renders into a four-times-multisampled buffer, so every fragment of
// every cell was written four times — and a crowded culture seen through a deep
// drop is cells over cells, most of them blurred wide. None of that
// multisampling was doing anything. Every edge in these fields is antialiased in
// the shader, from the pixel footprint, so four samples of it are four copies
// of the same number.
//
// So the field is drawn once into two plain buffers — what it multiplies the
// light by, and what it adds to it — and each is laid over the frame with a
// single full-screen pass, which is one write per pixel however many cells are
// stacked there. The arithmetic is exactly the arithmetic of drawing them
// directly: multiplying the buffer's product in is multiplying each cell in.
const COMPOSITE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`

const COMPOSITE_FRAGMENT = /* glsl */ `
  uniform sampler2D uLayer;
  uniform float uFocusDepth;
  varying vec2 vUv;
  void main() {
    vec4 layer = texture2D(uLayer, vUv);
    #ifdef MULTIPLY
      // Where there is no cell the pixel keeps the depth it had, so the
      // debris far behind still dissolves in the depth-of-field pass. Where
      // there is one, the defocus has already been integrated through it, and
      // the pass is told it is in focus so it is not blurred a second time.
      if (all(lessThan(abs(layer.rgb - 1.0), vec3(0.002)))) discard;
      gl_FragDepth = uFocusDepth;
    #endif
    gl_FragColor = vec4(layer.rgb, 1.0);
  }
`

// The two buffers and the private scenes that fill them. Half-float, so a
// highlight above one survives to be added; no depth, because every cell is
// composited at the plane of focus and none hides another.
//
// `absorbing` are the meshes drawn under multiply blending into the first
// buffer, `scattering` the ones drawn additively into the second.
export function createLayers(absorbing, scattering) {
  const make = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false })
  const absorbed = make()
  const deviated = make()
  const sceneA = new THREE.Scene()
  const sceneB = new THREE.Scene()
  for (const mesh of [...absorbing, ...scattering]) mesh.frustumCulled = false
  sceneA.add(...absorbing)
  sceneB.add(...scattering)
  const composite = (multiply, target) =>
    new THREE.ShaderMaterial({
      defines: multiply ? { MULTIPLY: '' } : {},
      uniforms: {
        uLayer: { value: target.texture },
        uFocusDepth: { value: 0.5 },
      },
      vertexShader: COMPOSITE_VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      blending: multiply ? THREE.MultiplyBlending : THREE.AdditiveBlending,
      premultipliedAlpha: multiply,
      transparent: true,
      depthTest: multiply,
      depthFunc: THREE.AlwaysDepth,
      depthWrite: multiply,
    })
  return {
    absorbed,
    deviated,
    sceneA,
    sceneB,
    meshes: [...absorbing, ...scattering],
    overAbsorbed: composite(true, absorbed),
    overDeviated: composite(false, deviated),
    quad: new THREE.PlaneGeometry(1, 1),
  }
}

// Only what createLayers made. The meshes' geometries and materials belong to
// the renderer that built them, which disposes them itself.
export function disposeLayers(layers) {
  layers.absorbed.dispose()
  layers.deviated.dispose()
  for (const mesh of layers.meshes) mesh.dispose?.()
  layers.overAbsorbed.dispose()
  layers.overDeviated.dispose()
  layers.quad.dispose()
}

const WHITE = new THREE.Color(1, 1, 1)
const BLACK = new THREE.Color(0, 0, 0)
const SAVED = new THREE.Color()
const BUFFER = new THREE.Vector2()

// Fill the two buffers, at `scale` of the drawing buffer's size, and tell the
// multiply composite at what depth the plane of focus lies (`plane`, in scene
// units from the camera).
export function drawLayers(gl, layers, camera, plane, scale) {
  const { near, far } = camera
  const ndc = (far + near) / (far - near) - (2.0 * far * near) / ((far - near) * plane)
  layers.overAbsorbed.uniforms.uFocusDepth.value = ndc * 0.5 + 0.5

  gl.getDrawingBufferSize(BUFFER).multiplyScalar(scale).round()
  if (layers.absorbed.width !== BUFFER.x || layers.absorbed.height !== BUFFER.y) {
    layers.absorbed.setSize(BUFFER.x, BUFFER.y)
    layers.deviated.setSize(BUFFER.x, BUFFER.y)
  }
  const target = gl.getRenderTarget()
  const autoClear = gl.autoClear
  const alpha = gl.getClearAlpha()
  gl.getClearColor(SAVED)
  gl.autoClear = false
  gl.setRenderTarget(layers.absorbed)
  gl.setClearColor(WHITE, 1)
  gl.clear(true, false, false)
  gl.render(layers.sceneA, camera)
  gl.setRenderTarget(layers.deviated)
  gl.setClearColor(BLACK, 0)
  gl.clear(true, false, false)
  gl.render(layers.sceneB, camera)
  gl.setRenderTarget(target)
  gl.setClearColor(SAVED, alpha)
  gl.autoClear = autoClear
}

// The two full-screen passes that lay the buffers over the frame.
export function LayerComposite({ layers }) {
  return (
    <>
      <mesh geometry={layers.quad} material={layers.overAbsorbed} frustumCulled={false} renderOrder={0} />
      <mesh geometry={layers.quad} material={layers.overDeviated} frustumCulled={false} renderOrder={1} />
    </>
  )
}
