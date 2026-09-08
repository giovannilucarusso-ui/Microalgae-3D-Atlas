// The optics layer.
//
// Everything a real micrograph carries and a raw WebGL render does not: a thin
// plane of focus with everything else dissolving, the lateral colour fringe of
// a real objective, veiling glare, the photon noise of the sensor, and the
// falloff of the illuminated field. Rendering the anatomy correctly is only
// half of looking real; the other half is the instrument you look through.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js'

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// A gather depth-of-field: every pixel reads its own circle of confusion off
// the depth buffer and averages a golden-angle disc of that radius. Sixteen
// taps are enough because the image underneath has no high-frequency detail —
// biological surfaces are smooth.
const FRAGMENT = /* glsl */ `
  #include <common>
  #include <packing>

  varying vec2 vUv;

  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform vec2 uResolution;
  uniform float uAspect;
  uniform float uNear;
  uniform float uFar;
  uniform float uFocus;
  uniform float uAperture;
  uniform float uDepthFloor;
  uniform float uMaxBlur;
  uniform float uAberration;
  uniform float uGlare;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uSaturation;
  uniform float uLift;
  uniform float uAo;
  uniform float uAoRadius;
  uniform float uAoFalloff;
  uniform vec3 uTint;
  uniform float uTime;

  const int TAPS = 16;
  const float GOLDEN = 2.39996323;

  float distanceAt(vec2 uv) {
    return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar);
  }

  void main() {
    float raw = texture2D(tDepth, vUv).x;
    float dist = -perspectiveDepthToViewZ(raw, uNear, uFar);

    // Thin-lens circle of confusion, written as a ratio so that one aperture
    // number works whether the scene is measured in micrometres or nanometres.
    //
    // The ratio is the problem as well as the convenience: the in-focus band is
    // a fraction of the camera distance, so closing in shrinks it without limit.
    // At the cell view's minimum 220 nm it was about ±11 nm before the blur
    // reached a pixel — a lamella's neighbour 56 nm away could not be in focus
    // with it, and the ultrastructure the zoom had just resolved was erased on
    // the way in. That is right for an objective and wrong for this view, which
    // is read as a tomogram, and a tomogram's slice does not thin because the
    // display was magnified.
    //
    // uDepthFloor is a floor under the denominator, in scene units. Beyond it
    // nothing changes at all — at the home distance dist is five times larger —
    // and inside it the band stops collapsing and holds a fixed depth instead.
    // It is a display allowance, chosen, and not a measured section thickness.
    float coc = (dist - uFocus) / max(dist, max(uDepthFloor, 1e-4)) * uAperture;
    float radius = clamp(abs(coc), 0.0, 1.0) * uMaxBlur;
    // Nothing was drawn here. Blurring the empty field only smears the specimen
    // outwards into a halo it does not have.
    radius *= mix(1.0, 0.3, step(0.999999, raw));

    vec2 scale = vec2(1.0 / uAspect, 1.0) * radius;

    vec3 sum = vec3(0.0);
    for (int i = 0; i < TAPS; i++) {
      float t = (float(i) + 0.5) / float(TAPS);
      float angle = float(i) * GOLDEN;
      vec2 offset = vec2(cos(angle), sin(angle)) * sqrt(t) * scale;
      sum += texture2D(tDiffuse, vUv + offset).rgb;
    }
    vec3 color = sum / float(TAPS);

    // Lateral chromatic aberration: nil on axis, growing with field height, and
    // only where the image is sharp — a blurred edge has no fringe to show.
    vec2 radial = vUv - 0.5;
    float fringe = uAberration * dot(radial, radial);
    float sharp = 1.0 - smoothstep(0.0, uMaxBlur * 0.4, radius);
    float red = texture2D(tDiffuse, vUv + radial * fringe).r;
    float blue = texture2D(tDiffuse, vUv - radial * fringe).b;
    color = mix(color, vec3(red, color.g, blue), sharp * step(0.0001, uAberration));

    // Veiling glare — light scattered inside the objective, spreading the field
    // into whatever is dark and taking the hard edge off everything.
    vec2 wide = vec2(1.0 / uAspect, 1.0) * 0.014;
    vec3 halo = texture2D(tDiffuse, vUv + wide).rgb
      + texture2D(tDiffuse, vUv - wide).rgb
      + texture2D(tDiffuse, vUv + vec2(wide.x, -wide.y)).rgb
      + texture2D(tDiffuse, vUv + vec2(-wide.x, wide.y)).rgb;
    // Scattered light is added, not blended towards. Lerping to a blurred
    // average was removing 13 % of every isolated highlight — the pass meant to
    // add atmosphere was the pass flattening the image.
    color += uGlare * halo * 0.25;

    // Crevice darkening, read straight off the depth buffer: a pixel that sits
    // behind everything around it is down a gap, and a gap is dark. Nothing
    // reads as solid matter without it — a lit surface with no occlusion in its
    // folds is the flattest thing a renderer produces.
    if (uAo > 0.0) {
      float occlusion = 0.0;
      vec2 aoStep = vec2(1.0 / uAspect, 1.0) * uAoRadius;
      for (int i = 0; i < 6; i++) {
        float a = float(i) * 1.0471976;
        vec2 offset = vec2(cos(a), sin(a)) * aoStep;
        occlusion += clamp((dist - distanceAt(vUv + offset)) / (dist * uAoFalloff), 0.0, 1.0);
      }
      color *= 1.0 - uAo * (occlusion / 6.0) * sharp;
    }

    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luma), color, uSaturation) * uTint;
    color += uLift;

    // Field falloff: no condenser lights the whole frame evenly.
    float r2 = dot(radial, radial);
    color *= 1.0 - uVignette * pow(clamp(r2 * 2.2, 0.0, 1.0), 1.3);

    // Shot noise, so the grain follows the signal the way a sensor's does.
    float n = fract(sin(dot(vUv * uResolution + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    color += (n - 0.5) * uGrain * sqrt(max(luma, 0.0) + 0.03);

    gl_FragColor = vec4(color, 1.0);
  }
`

class MicroscopePass extends Pass {
  constructor(camera, settings) {
    super()
    this.camera = camera
    this.uniforms = {
      tDiffuse: { value: null },
      tDepth: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uAspect: { value: 1 },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uFocus: { value: 1 },
      uAperture: { value: 0.8 },
      // Off unless a view asks for it: the filament really is a light
      // microscope and its focus should collapse the way one does.
      uDepthFloor: { value: 0 },
      uMaxBlur: { value: 0.01 },
      uAberration: { value: 0.002 },
      uGlare: { value: 0.12 },
      uVignette: { value: 0.45 },
      uGrain: { value: 0.03 },
      uSaturation: { value: 0.9 },
      uLift: { value: 0 },
      uAo: { value: 0 },
      uAoRadius: { value: 0.004 },
      uAoFalloff: { value: 0.006 },
      uTint: { value: new THREE.Color('#ffffff') },
      uTime: { value: 0 },
    }
    this.apply(settings)
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
    })
    this.fsQuad = new FullScreenQuad(this.material)
  }

  apply(settings = {}) {
    for (const [key, value] of Object.entries(settings)) {
      const uniform = this.uniforms[`u${key[0].toUpperCase()}${key.slice(1)}`]
      if (!uniform) continue
      if (uniform.value?.isColor) uniform.value.set(value)
      else uniform.value = value
    }
  }

  render(renderer, writeBuffer, readBuffer, deltaTime) {
    this.uniforms.tDiffuse.value = readBuffer.texture
    this.uniforms.tDepth.value = readBuffer.depthTexture
    this.uniforms.uNear.value = this.camera.near
    this.uniforms.uFar.value = this.camera.far
    this.uniforms.uTime.value = (this.uniforms.uTime.value + (deltaTime ?? 0.016) * 37) % 1000

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
    }
    this.fsQuad.render(renderer)
  }

  setSize(width, height) {
    this.uniforms.uResolution.value.set(width, height)
    this.uniforms.uAspect.value = width / height
  }

  dispose() {
    this.material.dispose()
    this.fsQuad.dispose()
  }
}

// Takes rendering over from React Three Fiber — any useFrame with a priority
// above zero does — and drives the composer instead.
export function Optics({ settings, focus }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const controls = useThree((s) => s.controls)
  const origin = useRef(new THREE.Vector3())

  const { composer, pass } = useMemo(() => {
    // The scene never reaches the canvas directly any more, so the canvas's own
    // antialiasing is not in play: the multisampling has to happen here, on the
    // composer's buffer. The depth texture rides along — the pass needs it, and
    // three resolves it with the colour.
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
      depthTexture: new THREE.DepthTexture(1, 1),
    })
    const composer = new EffectComposer(gl, target)
    composer.addPass(new RenderPass(scene, camera))
    const pass = new MicroscopePass(camera, settings)
    composer.addPass(pass)
    composer.addPass(new OutputPass())
    return { composer, pass }
  }, [gl, scene, camera])

  useEffect(() => () => composer.dispose(), [composer])
  useEffect(() => pass.apply(settings), [pass, settings])

  useEffect(() => {
    composer.setPixelRatio(dpr)
    composer.setSize(size.width, size.height)
  }, [composer, size.width, size.height, dpr])

  // The plane of focus follows whatever the viewer has centred, so zooming in
  // on a structure brings it into focus the way turning the coarse focus does.
  //
  // `focus` is the fine focus: a ref, in scene units, added on top. It is a ref
  // and not a prop because it is dragged, and a value that re-renders the app on
  // every frame of a drag is a value nobody can rack smoothly. Nothing else in
  // the pass needs to know it moved — the uniform is read here every frame
  // anyway.
  useFrame((_, delta) => {
    const centred = camera.position.distanceTo(controls?.target ?? origin.current)
    pass.uniforms.uFocus.value = centred + (focus?.current ?? 0)
    composer.render(delta)
  }, 1)

  return null
}

// --- The illuminated field --------------------------------------------------
//
// The background is not a wall behind the subject, it is the lamp: it does not
// move when the stage does, so it is painted straight onto the frame.

function fieldCanvas(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return [canvas, canvas.getContext('2d')]
}

function blot(ctx, x, y, r, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function finish(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Transmitted light through a wet mount: cool grey-blue, warmer and greener
// where the water film thickens, the condenser's hot spot off centre, and a few
// blurred smudges of debris far outside the focal plane.
export function brightFieldTexture() {
  const [canvas, ctx] = fieldCanvas(512)
  const base = ctx.createLinearGradient(0, 0, 90, 512)
  base.addColorStop(0, '#8ba3ac')
  base.addColorStop(0.45, '#96acae')
  base.addColorStop(1, '#a3b0a1')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)

  blot(ctx, 296, 186, 240, 'rgba(206, 220, 220, 0.36)')
  blot(ctx, 130, 430, 260, 'rgba(140, 165, 152, 0.40)')
  blot(ctx, 430, 470, 190, 'rgba(112, 140, 145, 0.36)')
  blot(ctx, 60, 90, 150, 'rgba(108, 134, 145, 0.34)')
  blot(ctx, 380, 60, 120, 'rgba(150, 168, 162, 0.32)')
  return finish(canvas)
}

// The interior view is not transmitted light — nothing 56 nm apart is resolved
// by any lens. It is read the way a confocal stack or a tomogram is read: a dark
// ground, the specimen lit from within.
export function darkFieldTexture() {
  const [canvas, ctx] = fieldCanvas(256)
  ctx.fillStyle = '#04100f'
  ctx.fillRect(0, 0, 256, 256)
  blot(ctx, 140, 104, 190, 'rgba(28, 74, 78, 0.85)')
  blot(ctx, 120, 190, 130, 'rgba(16, 48, 52, 0.70)')
  blot(ctx, 210, 60, 90, 'rgba(30, 62, 60, 0.50)')
  return finish(canvas)
}

// --- Surface texture --------------------------------------------------------
//
// The loudest tell of a computed image is a surface that is identical
// everywhere. Real membranes are mottled at every scale, so a little
// world-space noise is folded into the colour and the roughness of the
// standard materials.

const NOISE = /* glsl */ `
  // The lattice index is an integer, so it is hashed as one. The float hash
  // this replaces spent its mantissa on the integer part of the coordinate and
  // had almost nothing left for the fraction it actually needed — and a wall
  // sampled at eleven nanometres across a cell four micrometres wide is already
  // several hundred lattice cells from the origin, where that shortfall stops
  // being noise and becomes a smear that repeats. three builds nothing but
  // WebGL2 now, so the integer path is simply available.
  float organicHash(vec3 cell) {
    uvec3 u = uvec3(ivec3(cell));
    uint h = u.x * 1597334677u ^ u.y * 3812015801u ^ u.z * 2654435761u;
    h ^= h >> 15;
    h *= 2246822519u;
    h ^= h >> 13;
    h *= 3266489917u;
    h ^= h >> 16;
    return float(h) * (1.0 / 4294967296.0);
  }
  // Quintic rather than cubic interpolation. What the bump map builds its slope
  // out of is the screen-space derivative of this field, so what it needs is not
  // a continuous height but a continuous *slope*: under the cubic fade the
  // second derivative steps at every lattice boundary, and the shading creases
  // along the grid. At whole-cell zoom a cell is a pixel and nobody sees it; a
  // close zoom is exactly the act of putting it under the nose.
  float organicNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(mix(organicHash(i + vec3(0.0, 0.0, 0.0)), organicHash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(organicHash(i + vec3(0.0, 1.0, 0.0)), organicHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(organicHash(i + vec3(0.0, 0.0, 1.0)), organicHash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(organicHash(i + vec3(0.0, 1.0, 1.0)), organicHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }

  // Octaves sampled on the same axes stack their lattices on top of one
  // another, and the sum keeps a grid the eye finds as soon as it is close
  // enough to look for it — offsetting them, which is what this used to do,
  // moves the grid without turning it. A rotation between octaves costs three
  // dot products and leaves nothing aligned with anything.
  const mat3 ORGANIC_TURN = mat3(
     0.00,  0.80,  0.60,
    -0.80,  0.36, -0.48,
    -0.60, -0.48,  0.64);

  // Domain warp: the sample position is pushed about by a slow noise before the
  // ladder is walked at all. Isotropic noise gives lumps of one size in every
  // direction, which is what a mineral looks like; what makes a biological
  // surface read as grown is that its features are drawn out and folded —
  // membrane domains, fibril bundles, the flow lines of a gel. One
  // low-frequency displacement buys all of that, and being low-frequency it
  // survives every zoom that the features it is warping survive.
  vec3 organicWarp(vec3 p, float amount) {
    if (amount <= 0.0) return p;
    vec3 w = vec3(
      organicNoise(p * 0.45 + 11.3),
      organicNoise(p * 0.45 + 47.9),
      organicNoise(p * 0.45 + 83.1));
    return p + (w - 0.5) * amount;
  }

  // The ladder no longer has a fixed length. It has two ends, and both of them
  // are arguments rather than settings.
  //
  // The far end is the screen. 'step' is the world size of a pixel, and every
  // octave fades on its own approach to it rather than on the coarsest one's.
  // That is the trap: fade the sum on the base octave alone and the finest sits
  // a full octave under Nyquist, where it cannot be drawn, only aliased — so
  // adding detail makes the surface *smoother*, a grey mush of sub-pixel noise
  // in place of relief. The loop simply stops at the first octave the screen
  // cannot carry, so zooming out now costs less rather than more.
  //
  // The near end is the specimen. 'finest' is the highest octave the structure
  // has any business showing, in multiples of its own base frequency, and it
  // comes from the size of the smallest thing that structure is built out of.
  // It is what keeps a zoom from inventing substructure the organism does not
  // have: peptidoglycan keeps going down to the glycan strand and stops there,
  // a lipid droplet has nothing finer than the monolayer holding it round. Four
  // fixed octaves were a floor and a ceiling at once — the reason a close zoom
  // magnified the same blur instead of resolving anything new.
  //
  // Two ladders are walked at once, because colour and relief do not want the
  // same one. Contrast wants the fine octaves to keep real weight: a persistence
  // over a half is what makes a surface read as detailed rather than as a blur.
  // Slope does not. With lacunarity l and persistence p each octave is p·l times
  // steeper than the one above it, so at 0.63 and 2.13 a seventh octave carries
  // six times the slope of the first and the relief collapses into sandpaper
  // the moment a zoom reaches it. The height ladder therefore runs at 1/l, where
  // every octave contributes the same slope and a surface stays the same *kind*
  // of rough however close you get.
  //
  // Both sums are renormalised by the weight that survived, so a surface keeps
  // its contrast as its octaves drop away instead of fading towards flat. Once
  // nothing survives they return the neutral 0.5 and every term built on them
  // goes to zero by itself.
  vec2 organicFbm(vec3 p, float step, float finest) {
    vec3 q = p;
    float freq = 1.0;
    float ampC = 1.0;
    float ampH = 1.0;
    float wBase = 0.0;
    vec2 sum = vec2(0.0);
    vec2 norm = vec2(0.0);
    for (int i = 0; i < 7; i++) {
      float w = (1.0 - smoothstep(0.30, 1.05, step * freq))
              * (1.0 - smoothstep(1.00, 1.60, freq / finest));
      if (i == 0) wBase = w;
      if (w <= 0.002) break;
      float n = organicNoise(q);
      sum += vec2(ampC, ampH) * w * n;
      norm += vec2(ampC, ampH) * w;
      ampC *= 0.63;
      ampH *= 0.47;
      freq *= 2.13;
      q = ORGANIC_TURN * q * 2.13 + 19.7;
    }
    if (norm.x < 1e-4) return vec2(0.5);
    // Renormalising by the surviving weight is what holds the contrast as the
    // fine octaves drop away — and at the other end of the ladder it is a hole.
    // With one octave left the division cancels that octave's own fade exactly,
    // w·n/w = n, so the last band kept full contrast right up to the 0.002
    // cutoff and then snapped to flat in a frame. The band has to be given a
    // terminal fade that its own normalisation cannot undo, which is what this
    // is. It is not the fade-the-whole-sum-on-the-base-octave that was tried
    // and rejected: the fine octaves still each leave on their own approach to
    // the pixel, and only the last one out fades the field with it.
    return mix(vec2(0.5), sum / norm, wBase);
  }
`

// A gas vesicle is not a smooth tube: its wall is a single protein wound into
// ribs about 4 nm apart, which is what a cryo-micrograph shows and what makes
// the difference between a biological object and a plastic capsule. Far too
// fine to build as geometry over a 900 nm vesicle, so the ribs live in the
// shading normal instead. Object-space Y is the vesicle's own axis.
const ribbedHandlers = new Map()

export function ribbed({ period = 4, depth = 0.55 } = {}) {
  const key = `${period}|${depth}`
  if (!ribbedHandlers.has(key)) ribbedHandlers.set(key, makeRibbed(period, depth))
  return ribbedHandlers.get(key)
}

function makeRibbed(period, depth) {
  return (material) => {
    if (!material || material.userData.ribbed) return
    material.userData.ribbed = true
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uRibPeriod = { value: period }
      shader.uniforms.uRibDepth = { value: depth }
      shader.vertexShader = `varying float vRibAxis;\nvarying vec3 vRibDir;\n${shader.vertexShader}`.replace(
        '#include <project_vertex>',
        `vRibAxis = position.y;
         vRibDir = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
         #include <project_vertex>`,
      )
      shader.fragmentShader = `
        varying float vRibAxis;
        varying vec3 vRibDir;
        uniform float uRibPeriod;
        uniform float uRibDepth;
        ${shader.fragmentShader}`.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         // Once a rib is finer than a pixel it cannot be drawn, only aliased.
         // Fade it out as it approaches that limit, the way a mipmap would —
         // measured as the true diagonal of the pixel's step along the axis
         // rather than as fwidth, which adds the two screen directions instead
         // of combining them and so retires the ribs half an octave early.
         float ribStep = length(vec2(dFdx(vRibAxis), dFdy(vRibAxis)));
         float ribFade = 1.0 - smoothstep(uRibPeriod * 0.12, uRibPeriod * 0.32, ribStep);
         normal = normalize(normal + vRibDir * uRibDepth * ribFade * cos(vRibAxis * 6.2831853 / uRibPeriod));`,
      )
    }
    material.customProgramCacheKey = () => 'ribbed'
    material.needsUpdate = true
  }
}

// A hole, not a dark tube behind an intact sheet.
//
// The pores are 20 nm across in a sheet 4 µm wide. Cutting them out of the
// polar grid would need quads two orders of magnitude smaller than the ones the
// ripple needs — the whole sheet re-tessellated to resolve 0.04 % of its area.
// So the hole is cut in the fragment shader instead: every pore centre goes in
// as a uniform and any fragment that lands inside one is discarded. That is a
// real perforation at pixel precision, at any zoom, for the cost of 56 distance
// tests on the one surface that needs them — and the dark cylinder threaded
// through each hole stops being a bead behind glass and becomes the lining of
// the channel, which is what it is.
function makePerforated(centres, radius) {
  const packed = new Float32Array(Math.max(1, centres.length) * 2)
  centres.forEach((c, i) => {
    packed[i * 2] = c[0]
    packed[i * 2 + 1] = c[1]
  })
  return (material) => {
    if (!material || material.userData.perforated) return
    material.userData.perforated = true
    // This surface already carries the world-space mottle, and a material has
    // exactly one onBeforeCompile: assigning ours would silently delete theirs.
    const inherited = material.onBeforeCompile
    const inheritedKey = material.customProgramCacheKey
    material.onBeforeCompile = (shader, renderer) => {
      if (inherited) inherited(shader, renderer)
      shader.uniforms.uPores = { value: packed }
      shader.uniforms.uPoreRadius = { value: radius }
      shader.vertexShader = `varying vec3 vPoreWorld;\n${shader.vertexShader}`.replace(
        '#include <project_vertex>',
        `vPoreWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
         #include <project_vertex>`,
      )
      shader.fragmentShader = `
        varying vec3 vPoreWorld;
        uniform vec2 uPores[${Math.max(1, centres.length)}];
        uniform float uPoreRadius;
        ${shader.fragmentShader}`.replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         for (int i = 0; i < ${Math.max(1, centres.length)}; i++) {
           if (distance(vPoreWorld.xz, uPores[i]) < uPoreRadius) discard;
         }`,
      )
    }
    material.customProgramCacheKey = () =>
      `${inheritedKey ? inheritedKey.call(material) : ''}|perforated${centres.length}`
    material.needsUpdate = true
  }
}

const perforatedCache = new Map()

export function perforated({ centres, radius }) {
  const key = `${centres.length}:${radius}`
  if (!perforatedCache.has(key)) perforatedCache.set(key, makePerforated(centres, radius))
  return perforatedCache.get(key)
}

// The cutaway, applied to something that was not built as a sector.
//
// Most of this cell is assembled out of `sectorGeometry`, which knows about the
// wedge because the wedge is in its outline. The nucleoid is not: it is
// thirty-four confined persistent walks through an annular territory, and the
// generator was never told the wedge existed — so 28 % of its vertices sat in
// the 115° that has been removed, gold fibres hanging over a floor that is not
// there. The scene said a wedge was taken out while a structure in the middle
// of it carried straight on through.
//
// Clipped in the fragment rather than cut out of the geometry, for the reason
// the septum's pores are: cutting a spline tube at an arbitrary plane means
// re-tessellating it and capping the ends, and these threads are 9 nm across —
// an open end on one is a fifth of a pixel at the zoom where it could be seen
// at all. This is a real cut at pixel precision for one `atan` and a compare.
function makeSectorClip(start, length) {
  return (material) => {
    if (!material || material.userData.sectorClip) return
    material.userData.sectorClip = true
    // Chained, never assigned: the nucleoid already carries the world-space
    // mottle, and a material has exactly one onBeforeCompile.
    const inherited = material.onBeforeCompile
    const inheritedKey = material.customProgramCacheKey
    material.onBeforeCompile = (shader, renderer) => {
      if (inherited) inherited(shader, renderer)
      shader.uniforms.uClipStart = { value: start }
      shader.uniforms.uClipLength = { value: length }
      shader.vertexShader = `varying vec3 vClipWorld;
${shader.vertexShader}`.replace(
        '#include <project_vertex>',
        `vClipWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
         #include <project_vertex>`,
      )
      shader.fragmentShader = `
        varying vec3 vClipWorld;
        uniform float uClipStart;
        uniform float uClipLength;
        ${shader.fragmentShader}`.replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         {
           float clipA = atan(vClipWorld.z, vClipWorld.x);
           float clipD = mod(clipA - uClipStart, 6.2831853071795864);
           if (clipD > uClipLength) discard;
         }`,
      )
    }
    material.customProgramCacheKey = () =>
      `${inheritedKey ? inheritedKey.call(material) : ''}|sectorClip`
    material.needsUpdate = true
  }
}

// Drives `uAppear` on a material that already carries the organic surface.
// The uniform only exists once the program has been compiled, so it is captured
// on the way through and whatever was set before that is applied when it lands.
export function appearing(handler) {
  const state = { uniform: null, pending: 1 }
  const ref = (material) => {
    if (!material) return
    handler(material)
    if (material.userData.appearing) return
    material.userData.appearing = true
    const inherited = material.onBeforeCompile
    material.onBeforeCompile = (shader, renderer) => {
      if (inherited) inherited(shader, renderer)
      state.uniform = shader.uniforms.uAppear ?? null
      if (state.uniform) state.uniform.value = state.pending
    }
    material.needsUpdate = true
  }
  return {
    ref,
    set(v) {
      state.pending = v
      if (state.uniform) state.uniform.value = v
    },
  }
}

const sectorClipCache = new Map()

export function sectorClip({ start, length }) {
  const key = `${start}:${length}`
  if (!sectorClipCache.has(key)) sectorClipCache.set(key, makeSectorClip(start, length))
  return sectorClipCache.get(key)
}

// Returns a ref handler: <meshStandardMaterial ref={organic(...)} />. Cached per
// setting, so the identity stays stable across renders and React does not
// detach and reattach the ref on every frame of the temperature slider.
//
// Every option below is carried as a uniform rather than as a branch in the
// source, so all of these materials still compile to one program and the shared
// 'organic' cache key stays honest. The cost is a few ALU ops on materials that
// have an option switched off, which is nothing next to a second shader.
//
//   scale/amount/rough  the base world-space mottle
//   finest              the size in nanometres of the smallest thing this
//                       structure is built out of, and therefore where its
//                       ladder of detail stops. This is the number that decides
//                       what a close zoom finds: too coarse and the surface
//                       magnifies into a blur, too fine and it invents an
//                       ultrastructure the organism has not got.
//   warp                how much a slow noise drags the sample position about
//                       before the ladder is walked — features drawn out and
//                       folded rather than lumps of one size in all directions
//   grain               a much finer octave: the crowding a dense cytosol or a
//                       studded membrane has and a smooth surface does not
//   fiber               anisotropy of the sample position, for structures whose
//                       substructure runs one way — fibrils, rods, layers
//   rim                 a fresnel edge in the structure's own hue. On a dark
//                       ground nothing separates one dark shape from another
//                       behind it; this is what gives each body an outline.
const organicHandlers = new Map()

const ORGANIC_DEFAULTS = {
  scale: 0.0022,
  amount: 0.3,
  rough: 0.25,
  // A protein. Nothing in this cell is built of anything much smaller, so it is
  // the right default for a structure that has not argued for its own.
  finest: 5,
  warp: 0,
  grain: 0,
  grainScale: 0.06,
  fiber: [1, 1, 1],
  bump: 0,
  rim: 0,
  rimColor: '#9fe6da',
}

export function organic(options = {}) {
  const settings = { ...ORGANIC_DEFAULTS, ...options }
  const key = JSON.stringify(settings)
  if (!organicHandlers.has(key)) organicHandlers.set(key, makeOrganic(settings))
  return organicHandlers.get(key)
}

// The shared source. `organicSurface` is spliced into the fragment shader by
// both `organic` and `lamella`, so the two stay in step.
const ORGANIC_UNIFORMS = /* glsl */ `
  varying vec3 vOrganicPos;
  varying vec3 vOrganicNormal;
  uniform float uMottleScale;
  uniform float uMottleAmount;
  uniform float uMottleRough;
  uniform float uMottleFinest;
  uniform float uWarp;
  uniform float uGrain;
  uniform float uGrainScale;
  uniform vec3 uFiber;
  uniform float uBump;
  uniform float uRim;
  uniform vec3 uRimColor;
  uniform float uAppear;
`

// World position and geometric normal, instancing included. The normal is
// needed in `color_fragment`, which runs before three has built its own — so it
// is carried from the vertex stage rather than read from `normal`.
const ORGANIC_VERTEX = /* glsl */ `
  #ifdef USE_INSTANCING
    vOrganicPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
    vOrganicNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
  #else
    vOrganicPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
    vOrganicNormal = normalize(mat3(modelMatrix) * objectNormal);
  #endif
  #include <project_vertex>
`

// The grain is deliberately near the limit of what the screen can hold, which
// is also where it turns into noise. Once a cell of it is finer than a pixel it
// cannot be drawn, only aliased — so it is faded out as it approaches that
// limit, the way a mipmap would, using the same screen-space derivative trick
// the gas-vesicle ribs use. That is what lets these frequencies be honest to
// the ultrastructure instead of merely safe.
// Coming into existence, rather than being switched on.
//
// The small bodies are gated by distance because a 22 nm sphere at whole-cell
// zoom is honest noise — but the gate was a boolean, so a thousand ribosomes and
// every phycobilisome arrived in one frame. The comment beside the lamella
// carpet even promised a crossfade; only the carpet was fading.
//
// Dithered rather than blended: these are opaque, instanced, and stacked
// hundreds deep, so fading them by opacity means sorting failures and a haze
// that accumulates where they overlap. An ordered discard costs one compare,
// leaves the depth buffer honest, and at the distance the handover happens the
// pattern is under a pixel.
const ORGANIC_APPEAR = /* glsl */ `
  if (uAppear < 0.999) {
    const float bayer[16] = float[16](
       0.0,  8.0,  2.0, 10.0,
      12.0,  4.0, 14.0,  6.0,
       3.0, 11.0,  1.0,  9.0,
      15.0,  7.0, 13.0,  5.0);
    ivec2 dxy = ivec2(mod(gl_FragCoord.xy, 4.0));
    if (uAppear < (bayer[dxy.x + dxy.y * 4] + 0.5) / 16.0) discard;
  }
`

const ORGANIC_COLOR = /* glsl */ `
  #include <color_fragment>
${ORGANIC_APPEAR}
  vec3 organicP = vOrganicPos * uFiber;
  // The pixel's actual footprint on the surface, rather than the sum of its two
  // derivatives. 'length(fwidth(p))' overstates it by about half an octave on a
  // face square to the camera, and by as much as the surface is turned away on
  // a face that is not — which is most of a lamella stack seen in section, and
  // there it was discarding detail that is perfectly resolved across the
  // sliver even though it is not resolved along it. Capping the anisotropy at
  // four to one is the compromise a mip pyramid makes for the same reason.
  vec3 organicDx = dFdx(organicP);
  vec3 organicDy = dFdy(organicP);
  float organicLenX = length(organicDx);
  float organicLenY = length(organicDy);
  float organicNear = min(organicLenX, organicLenY);
  float organicFar = max(organicLenX, organicLenY);
  float organicStep = max(organicNear, organicFar * 0.25);
  // Which way the footprint is long, at a quarter of its length: the offset the
  // grain is sampled either side of. Multisampling is what makes the four-to-one
  // cap honest, and only the grain needs it — the fbm's fine octaves are a few
  // per cent of the contrast each, whereas the grain is a single frequency at
  // full strength and is the one band that would crawl.
  vec3 organicLong = (organicLenX > organicLenY ? organicDx : organicDy) * 0.25;
  // Band limiting lives inside the fbm, octave by octave, so the mottle holds
  // full contrast down to the last octave the screen can carry and then leaves
  // cleanly. The grain is a single octave and still fades as one.
  vec3 organicBase = organicP * uMottleScale;
  vec3 organicQ = organicWarp(organicBase, uWarp);
  vec2 organicMH = organicFbm(organicQ, organicStep * uMottleScale, uMottleFinest);
  float organicM = organicMH.x;
  float organicFade = 1.0 - smoothstep(0.30, 1.05, organicStep * uGrainScale);
  // The grain is dragged along by the same displacement, read back into world
  // units. It costs nothing — the warp has already been sampled — and it is the
  // difference between one material and two: an unwarped stipple over a warped
  // mottle is a rigid lattice laid on a surface that flows underneath it, which
  // reads as dust on the specimen rather than as the specimen.
  vec3 organicDrift = (organicQ - organicBase) / uMottleScale;
  float organicGrain = uGrain * organicFade;
  // Both taps are multiplied by this, and it is zero on every surface that
  // never asked for a grain and on every surface the camera has backed away
  // from. The branch is coherent across a whole face — the fade is a function
  // of the pixel footprint — so it costs nothing where it does not skip.
  float organicG = 0.5;
  if (organicGrain > 0.001) {
    vec3 organicGp = (organicP + organicDrift) * uGrainScale;
    vec3 organicGo = organicLong * uGrainScale;
    organicG = 0.5 * (organicNoise(organicGp - organicGo)
                    + organicNoise(organicGp + organicGo));
  }
  float organicMottle = uMottleAmount;
  diffuseColor.rgb *= 1.0
    + organicMottle * (organicM - 0.5) * 2.6
    + organicGrain * (organicG - 0.5) * 2.0;
`

const ORGANIC_ROUGHNESS = /* glsl */ `
  #include <roughnessmap_fragment>
  roughnessFactor = clamp(
    roughnessFactor + uMottleRough * (organicM - 0.5) * 2.6 + organicGrain * (organicG - 0.5) * 0.7,
    0.05, 1.0);
`

// Tinting a surface is not texturing it. A mottle in the albedo reads as paint;
// what makes a surface read as *matter* is that its relief catches the light
// unevenly, and for that the shading normal has to move. The height field is
// the mottle and the grain that were already computed for the colour, so this
// costs two derivatives rather than another set of noise samples.
//
// The perturbation is the standard treatment for a surface with no tangent
// frame: build the gradient of the height from its screen-space derivatives and
// the derivatives of the view-space position, then bend the normal against it.
// `uBump` is the peak-to-peak relief of that height field in scene units — so
// in the cell view it is a number of nanometres, and can be argued for from the
// structure rather than dialled in until it looks right. Both the height and
// the position derivatives are then in the same units and the slope that comes
// out is a real one.
//
// The height is the fbm's second ladder, not its first. Weighted for contrast
// the way the colour is, every octave down is a third steeper than the one
// above it, and a deep zoom — which is precisely where the extra octaves now
// arrive — turns relief into sandpaper.
const ORGANIC_BUMP = /* glsl */ `
  #include <normal_fragment_maps>
  {
    float bumpH = (organicMH.y + organicGrain * (organicG - 0.5) * 1.4) * uBump;
    vec3 bumpP = -vViewPosition;
    vec3 bumpDx = dFdx(bumpP);
    vec3 bumpDy = dFdy(bumpP);
    vec3 bumpR1 = cross(bumpDy, normal);
    vec3 bumpR2 = cross(normal, bumpDx);
    float bumpDet = dot(bumpDx, bumpR1);
    vec3 bumpGrad = sign(bumpDet) * (dFdx(bumpH) * bumpR1 + dFdy(bumpH) * bumpR2);
    normal = normalize(abs(bumpDet) * normal - bumpGrad);
  }
`

const ORGANIC_RIM = /* glsl */ `
  float organicRim = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
  outgoingLight += uRimColor * organicRim * uRim;
  #include <opaque_fragment>
`

// `finest` is a size in nanometres and the shader counts in octaves, so the
// conversion happens here rather than in the fragment: how many times the base
// frequency has to double before its period reaches that size. Floored at two,
// because a ladder whose ceiling is below its own first rung has no rungs at all
// and the surface would come out flat rather than coarse.
//
// `fiber` has to be in it. Stretching the sample along an axis makes the
// features on that axis finer than the nominal period by exactly that factor,
// and the floor is a statement about the smallest thing in the world, not about
// the coordinate the noise happens to be read in. Taking the largest component
// is the conservative reading and the one that keeps the promise.
function organicUniforms(s) {
  const stretch = Math.max(...s.fiber)
  // The floor is a statement about the smallest thing in the world, so it binds
  // every band, not just the fbm's. The grain was exempt and two materials had
  // walked under it: the antenna's grain ran at a 2.9 nm period against a 6 nm
  // floor — finer than the hexameric disc the floor is named for — and the
  // thylakoid's, stretched 2.4 along the sac's own height, came out at 3.8
  // against 5. Capped rather than faded out, because the grain is a real
  // spectral feature at a measured period and the honest correction is to stop
  // it at the floor, not to delete it.
  const grainScale = Math.min(s.grainScale, 1 / (s.finest * stretch))
  return {
    uMottleScale: { value: s.scale },
    uMottleAmount: { value: s.amount },
    uMottleRough: { value: s.rough },
    uMottleFinest: { value: Math.max(2, 1 / (s.scale * s.finest * stretch)) },
    uWarp: { value: s.warp },
    uGrain: { value: s.grain },
    uGrainScale: { value: grainScale },
    uFiber: { value: new THREE.Vector3(...s.fiber) },
    uBump: { value: s.bump },
    uRim: { value: s.rim },
    uRimColor: { value: new THREE.Color(s.rimColor) },
    uAppear: { value: 1 },
  }
}

function makeOrganic(settings) {
  return (material) => {
    if (!material || material.userData.organic) return
    material.userData.organic = true
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, organicUniforms(settings))
      shader.vertexShader = `varying vec3 vOrganicPos;\nvarying vec3 vOrganicNormal;\n${shader.vertexShader}`
        .replace('#include <project_vertex>', ORGANIC_VERTEX)
      shader.fragmentShader = `${ORGANIC_UNIFORMS}\n${NOISE}\n${shader.fragmentShader}`
        .replace('#include <color_fragment>', ORGANIC_COLOR)
        .replace('#include <roughnessmap_fragment>', ORGANIC_ROUGHNESS)
        .replace('#include <normal_fragment_maps>', ORGANIC_BUMP)
        .replace('#include <opaque_fragment>', ORGANIC_RIM)
    }
    material.customProgramCacheKey = () => 'organic'
    material.needsUpdate = true
  }
}

// --- The antenna, and the energy running down it -----------------------------
//
// A phycobilisome is a funnel: phycocyanin out at the rod tips catches the
// light chlorophyll is worst at using, and every step inward is downhill in
// energy, so the excitation can only travel one way — towards the core, and
// from the core into the chlorophyll in the membrane the core is sitting on.
//
// That one-way trip is the thing worth animating, and `aPath` — 1 at the tips,
// 0 at the core — is the road it runs along. Moving a bright front down that
// coordinate shows the direction, which a uniform pulse would not.
export function antenna(options = {}) {
  const settings = { ...ORGANIC_DEFAULTS, ...options }
  const { glowColor = '#bff0ff' } = options

  const uniforms = {
    ...organicUniforms(settings),
    uExcite: { value: -1 },
    uGlow: { value: 0 },
    uGlowColor: { value: new THREE.Color(glowColor) },
  }

  const handle = {
    uniforms,
    material: null,
    appear: { set: (v) => { uniforms.uAppear.value = v } },
  }
  const ref = (material) => {
    if (!material || material.userData.antenna) return
    handle.material = material
    material.userData.antenna = true
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = `
        attribute float aPath;
        varying float vPath;
        varying vec3 vOrganicPos;
        varying vec3 vOrganicNormal;
        ${shader.vertexShader}`
        .replace('#include <project_vertex>', `vPath = aPath;
${ORGANIC_VERTEX}`)
      shader.fragmentShader = `
        ${ORGANIC_UNIFORMS}
        varying float vPath;
        uniform float uExcite;
        uniform float uGlow;
        uniform vec3 uGlowColor;
        ${NOISE}
        ${shader.fragmentShader}`
        .replace('#include <color_fragment>', ORGANIC_COLOR)
        .replace('#include <roughnessmap_fragment>', ORGANIC_ROUGHNESS)
        .replace('#include <normal_fragment_maps>', ORGANIC_BUMP)
        .replace(
          '#include <opaque_fragment>',
          `float excited = 1.0 - smoothstep(0.0, 0.22, abs(vPath - uExcite));
           outgoingLight += uGlowColor * excited * uGlow;
           ${ORGANIC_RIM}`,
        )
    }
    material.customProgramCacheKey = () => 'antenna'
    material.needsUpdate = true
  }

  handle.ref = ref
  return handle
}

// --- The lamella surface, and the pigment the geometry cannot afford ---------
//
// Below the zoom at which the antennae are resolved, a thylakoid face does not
// look like chlorophyll. It is carpeted in phycobilisomes — phycocyanin is
// 15–20 % of this organism's dry weight — so what the eye receives is
// blue-green. Rendering the membrane green until the antennae switch on shows
// the viewer the one colour the anatomy documentation explicitly warns against.
//
// So the pigment is carried in the surface while the geometry cannot afford it,
// and crossfades out as the real antennae fade in: the same information at two
// resolutions, which is the rule the lamellae and the ribosomes already follow.
//
// Unlike `organic`, this one is built per material rather than cached, because
// it owns a uniform that changes every frame. Hold it in a useMemo.
export function lamella(options = {}) {
  const settings = { ...ORGANIC_DEFAULTS, ...options }
  const {
    carpetColor = '#4ba6d4',
    carpetStrength = 0.62,
    carpetScale = 0.055,
  } = options

  const uniforms = {
    ...organicUniforms(settings),
    uCarpet: { value: 1 },
    uCarpetColor: { value: new THREE.Color(carpetColor) },
    uCarpetStrength: { value: carpetStrength },
    uCarpetScale: { value: carpetScale },
  }

  const handle = { uniforms, material: null }
  const ref = (material) => {
    if (!material || material.userData.lamella) return
    handle.material = material
    material.userData.lamella = true
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = `
        attribute float aTone;
        varying float vTone;
        varying vec3 vOrganicPos;
        varying vec3 vOrganicNormal;
        ${shader.vertexShader}`.replace(
          '#include <project_vertex>',
          `vTone = aTone;
           ${ORGANIC_VERTEX}`,
        )
      shader.fragmentShader = `
        ${ORGANIC_UNIFORMS}
        varying float vTone;
        uniform float uCarpet;
        uniform vec3 uCarpetColor;
        uniform float uCarpetStrength;
        uniform float uCarpetScale;
        ${NOISE}
        ${shader.fragmentShader}`
        .replace(
          '#include <color_fragment>',
          `${ORGANIC_COLOR}
           // Only the broad cytoplasmic faces carry antennae; the top and
           // bottom edges are where the sac closes on itself.
           float lamFace = 1.0 - abs(vOrganicNormal.y);
           // Two bands, because the antennae are not evenly spread and the
           // unevenness survives the zoom that the antennae themselves do not.
           // The fine band is the individual phycobilisomes and dissolves once
           // they fall below a pixel — what happens to them down a real
           // objective. The coarse band is how their density varies across a
           // membrane, which is still there at whole-cell zoom, and collapsing
           // to a constant instead is what made this read as flat paint.
           // uCarpet is zero once the antennae themselves are drawn, and this
           // whole band — an fbm and a noise sample — was still being computed
           // and then multiplied away.
           float lamStipple = 0.5;
           if (uCarpet > 0.001) {
           float lamFade = 1.0 - smoothstep(0.30, 1.05, organicStep * uCarpetScale);
           // The coarse band runs from about three hundred nanometres down to
           // the spacing of the antennae themselves — six octaves — and stops
           // there, because below it the fine band is drawing the same thing
           // properly and two ladders on one quantity is just contrast twice.
           float lamCoarse = organicFbm(
             organicP * uCarpetScale * 0.06,
             organicStep * uCarpetScale * 0.06,
             6.0).x;
           lamStipple = mix(lamCoarse, organicNoise(organicP * uCarpetScale), lamFade);
           }
           // Per sac, carried from the geometry: how much pigment this one
           // holds and how dark it sits. Without it forty membranes of one
           // colour stack into a solid however finely each is lit, and the eye
           // cannot count them — which is the whole content of a section.
           float lamCarpet = uCarpet * lamFace * (0.24 + 0.76 * lamStipple) * (0.5 + 1.0 * vTone);
           diffuseColor.rgb = mix(diffuseColor.rgb, uCarpetColor, lamCarpet * uCarpetStrength);
           diffuseColor.rgb *= 0.74 + 0.52 * vTone;
           // The top and bottom of a sac are not a third face: they are where
           // the membrane folds back on itself, two bilayers thick and denser
           // for it. Lit like the faces they read as the bright top edge of a
           // slab, which is what made the stack look built rather than grown.
           diffuseColor.rgb *= mix(0.8, 1.0, lamFace);`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `${ORGANIC_ROUGHNESS}
           // A sac that carries more pigment scatters more and shines less, so
           // the tone has to reach the specular as well. Albedo alone is paint.
           roughnessFactor = clamp(roughnessFactor + 0.16 * (vTone - 0.5), 0.05, 1.0);`,
        )
        .replace('#include <normal_fragment_maps>', ORGANIC_BUMP)
        .replace('#include <opaque_fragment>', ORGANIC_RIM)
    }
    material.customProgramCacheKey = () => 'lamella'
    material.needsUpdate = true
  }

  handle.ref = ref
  return handle
}
