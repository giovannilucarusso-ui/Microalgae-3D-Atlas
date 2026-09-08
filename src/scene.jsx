import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

// Lighting tuned to read like a specimen under a research microscope:
// a cool condenser above, a cyan rim from behind to separate the subject from
// the dark field, and a low warm fill so the cut faces never go fully black.
// Kept deliberately soft and diffuse: hard key light and tight speculars are
// what make a render look moulded in plastic, and no imaging technique that
// reaches this scale produces them.
export function MicroscopeLights({ shadows = false, scale = 1 }) {
  return (
    <>
      {/* Pulled back from 1.08. Ambient light is what fills a slot, and the
          whole content of a section of this cell is slots: between two lamellae
          56 nm apart you are looking three micrometres down a crack, and a
          crack that is filled reads as a painted line. Everything the sky used
          to carry has gone to the key and to the crevice darkening, which put
          it where the form is instead of everywhere at once. */}
      <hemisphereLight args={['#b6e2e6', '#0e2b28', 0.72]} />
      <directionalLight
        position={[1.1 * scale, 1.6 * scale, 0.9 * scale]}
        intensity={1.62}
        color="#f2fbff"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-near={0.1 * scale}
        shadow-camera-far={6 * scale}
        shadow-camera-left={-1.4 * scale}
        shadow-camera-right={1.4 * scale}
        shadow-camera-top={1.4 * scale}
        shadow-camera-bottom={-1.4 * scale}
      />
      <directionalLight
        position={[-1.2 * scale, -0.4 * scale, -1.1 * scale]}
        intensity={0.58}
        color="#63c8ff"
      />
      {/* The fill is there so the cut faces and the cross-wall floor never go
          to black — you are meant to be able to look into this thing. At 0.44
          it was not doing that job. */}
      <directionalLight
        position={[0.2 * scale, -1.1 * scale, 0.7 * scale]}
        intensity={0.68}
        color="#ffd9a8"
      />
    </>
  )
}

const ORIGIN = new THREE.Vector3()

// A camera that swings across the specimen, a filament that never stops
// turning, and a field of jittering grit are all motion nobody asked for. When
// the system says to reduce it they stop — the camera still goes where it was
// told, it just arrives instead of travelling.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

// Flies the camera to a structure's viewpoint — and back out to the overview
// when the selection is cleared.
//
// A straight line from here to there is the one move you cannot follow: it
// crosses the specimen, the framing changes and the scale changes at once, and
// you arrive with no idea where you are. So the look-at point travels straight
// while the camera swings around it in spherical coordinates, on a fixed clock
// with an ease at both ends, and the radius bulges outwards mid-flight: the
// cell backs off, turns, and only then does the camera descend on the target.
// That is the move a hand makes with a model in it, and it is legible.
export function CameraRig({ camera: goal, arc = 0.3, duration = 1.35 }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls)
  const flight = useRef(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!goal || !controls) return
    const target = new THREE.Vector3(...goal.target)
    const to = target
      .clone()
      .addScaledVector(new THREE.Vector3(...goal.dir).normalize(), goal.distance)

    // The detour exists to keep the move legible. Asked to reduce motion, the
    // honest answer is not a faster swing but no swing: land on the viewpoint.
    if (reduced) {
      camera.position.copy(to)
      controls.target.copy(target)
      controls.update()
      flight.current = null
      return
    }

    const from = new THREE.Spherical().setFromVector3(
      camera.position.clone().sub(controls.target),
    )
    const until = new THREE.Spherical().setFromVector3(to.clone().sub(target))
    let sweep = until.theta - from.theta
    while (sweep > Math.PI) sweep -= Math.PI * 2
    while (sweep < -Math.PI) sweep += Math.PI * 2

    flight.current = {
      t: 0,
      from,
      until,
      sweep,
      startTarget: controls.target.clone(),
      endTarget: target,
      // A move that barely changes anything does not need the detour.
      arc: camera.position.distanceTo(to) > goal.distance * 0.35 ? arc : 0,
    }
  }, [goal, controls, camera, arc, reduced])

  // Touch the controls and the flight is off: two things moving the camera at
  // once is the other way to lose the viewer.
  useEffect(() => {
    if (!controls) return
    const cancel = () => {
      flight.current = null
    }
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controls])

  useFrame((_, delta) => {
    const f = flight.current
    if (!f || !controls) return
    f.t = Math.min(1, f.t + delta / duration)
    const e = f.t * f.t * (3 - 2 * f.t)

    const target = f.startTarget.clone().lerp(f.endTarget, e)
    const swing = new THREE.Spherical(
      THREE.MathUtils.lerp(f.from.radius, f.until.radius, e) *
        (1 + f.arc * Math.sin(Math.PI * e)),
      THREE.MathUtils.lerp(f.from.phi, f.until.phi, e),
      f.from.theta + f.sweep * e,
    )
    swing.makeSafe()

    camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(swing))
    controls.target.copy(target)
    controls.update()

    if (f.t >= 1) flight.current = null
  })

  return null
}

function niceLength(value) {
  const exp = Math.floor(Math.log10(value))
  const base = Math.pow(10, exp)
  const norm = value / base
  const step = norm >= 5 ? 5 : norm >= 2 ? 2 : 1
  return step * base
}

function formatLength(value, unit) {
  if (unit === 'nm') {
    return value >= 1000
      ? `${Number((value / 1000).toFixed(2))} µm`
      : `${Number(value.toFixed(2))} nm`
  }
  return `${Number(value.toFixed(2))} µm`
}

// Writes the scale bar straight to the DOM every frame — no React re-render.
export function ScaleBarDriver({ barRef, labelRef, unit }) {
  const { camera, size } = useThree()
  const controls = useThree((s) => s.controls)

  useFrame(() => {
    if (!barRef.current || !labelRef.current) return
    const target = controls?.target ?? ORIGIN
    const distance = camera.position.distanceTo(target)
    const visibleHeight = 2 * distance * Math.tan((camera.fov * Math.PI) / 360)
    if (!visibleHeight) return
    const pxPerUnit = size.height / visibleHeight
    const length = niceLength(150 / pxPerUnit)
    barRef.current.style.width = `${Math.round(length * pxPerUnit)}px`
    labelRef.current.textContent = formatLength(length, unit)
  })

  return null
}

// Wraps a clickable anatomical part: selection, the pointer cursor, and what
// the part does when the viewer is looking at something else.
//
// Dimming was the wrong instrument. A dimmed thylakoid system is still a
// thylakoid system standing between the camera and the carboxysome you asked
// for, and the only cell you can actually read is one whose other structures
// step out of the way. So picking a structure now empties the cell around it:
//
//   role 'shell'  the envelope — stays, as a translucent hull, because without
//                 it you cannot tell where in the cell you have landed;
//   role 'veil'   the thylakoid mass — steps aside, but stays translucent for
//                 the things that are docked on it and would otherwise float;
//   role 'body'   everything else — gone, until it is the one selected.
//
// `hidden` is the viewer's own doing: the layer switches in the panel.
// --- Keyboard navigation ----------------------------------------------------
//
// W A S D move the camera in the plane of the screen: the one axis the mouse
// was not already covering well. The wheel dollies, and now it dollies towards
// the pointer, so forward and back are handled better than a key ever would;
// what was missing was sideways and up.
//
// OrbitControls will pan from the keyboard on its own, but it applies one step
// per keydown *event*, which means the motion is whatever the operating
// system's key repeat happens to be: a jump, a pause, then a stutter. Holding a
// key should move the camera, not tap it. So the held keys are kept as a set
// and the pan is integrated every frame, which also lets two of them combine
// into a diagonal and lets Shift mean "faster".
const PAN_KEYS = {
  KeyW: [0, 1],
  KeyS: [0, -1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
}

export function KeyboardPan({ fraction = 0.42, boost = 2.6 }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const held = useRef(new Set())
  const fast = useRef(false)

  useEffect(() => {
    const typing = () => {
      const tag = document.activeElement?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }
    const onDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || typing()) return
      fast.current = event.shiftKey
      if (!PAN_KEYS[event.code]) return
      // The camera rig gives way the moment the viewer takes over, and it
      // learns that from the controls' own `start` event. A key press is not a
      // pointer gesture, so nothing would have raised it.
      if (held.current.size === 0) controls?.dispatchEvent({ type: 'start' })
      held.current.add(event.code)
      event.preventDefault()
    }
    const onUp = (event) => {
      fast.current = event.shiftKey
      held.current.delete(event.code)
    }
    // Alt-tabbing away with a key down would otherwise leave the camera drifting
    // for as long as the window stayed unfocused.
    const onBlur = () => held.current.clear()

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [controls])

  const axisX = useMemo(() => new THREE.Vector3(), [])
  const axisY = useMemo(() => new THREE.Vector3(), [])
  const move = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    if (!controls || held.current.size === 0) return
    let x = 0
    let y = 0
    for (const code of held.current) {
      const [dx, dy] = PAN_KEYS[code]
      x += dx
      y += dy
    }
    if (!x && !y) return

    // A fraction of what is on screen per second, rather than a fixed number of
    // nanometres: the keys then move the same amount of *cell* whether the whole
    // thing is in frame or one carboxysome is. A constant would crawl at one
    // zoom and fling at the other.
    const span =
      2 *
      camera.position.distanceTo(controls.target) *
      Math.tan((camera.fov * Math.PI) / 360)
    const step = (span * fraction * delta * (fast.current ? boost : 1)) / Math.hypot(x, y)

    // The screen's own axes, taken from the camera's world matrix, so the keys
    // mean what they look like they mean from wherever the camera has ended up.
    axisX.setFromMatrixColumn(camera.matrix, 0)
    axisY.setFromMatrixColumn(camera.matrix, 1)
    move.copy(axisX).multiplyScalar(x * step).addScaledVector(axisY, y * step)

    // Both ends move together, so the orbit the viewer had set up survives the
    // trip: only the point being looked at changes, not the angle it is seen
    // from.
    camera.position.add(move)
    controls.target.add(move)
    controls.update()
  })

  return null
}

// How far the pointer may travel between press and release and still count as
// a click rather than a drag. Small enough that a deliberate click on a 4 px
// target survives the hand's own tremor, large enough that nobody orbits by
// accident. Exported so the canvas can hold empty space to the same rule.
export const CLICK_SLOP = 4

export function Part({ id, role = 'body', companion, selected, hidden, onSelect, children, ...props }) {
  const chosen = selected === id
  const elsewhere = selected != null && !chosen

  let state = 'plain'
  if (hidden) state = 'off'
  else if (chosen) state = 'active'
  else if (elsewhere && companion) state = 'plain'
  else if (elsewhere) state = role === 'shell' ? 'ghost' : role === 'veil' ? 'veil' : 'off'

  useEffect(() => () => { document.body.style.cursor = 'auto' }, [])

  return (
    <group
      {...props}
      visible={state !== 'off'}
      onClick={(e) => {
        e.stopPropagation()
        // A drag is not a click.
        //
        // React Three Fiber raises this on pointer-up whenever the press and
        // the release landed on the same object, and it does not look at what
        // happened in between. So orbiting the cell with the left button — the
        // first thing anyone does — ended by selecting whatever the cursor
        // happened to be over when the button came up, and the camera flew off
        // to that structure's viewpoint. The model appeared to grab the wheel.
        // `delta` is the distance in pixels the pointer travelled between the
        // two events, which is exactly the question being asked.
        if (e.delta > CLICK_SLOP) return
        onSelect(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {typeof children === 'function' ? children({ state }) : children}
    </group>
  )
}

// How far the camera is from what it is actually looking at, which is what
// decides whether a structure is large enough on screen to be worth drawing.
// Measuring from the world origin instead worked only because the cell happens
// to sit there — it would give the wrong answer the moment the viewer panned,
// and the wrong answer everywhere the moment a second cell appeared.
export function useFocalDistance() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  return useCallback(
    () => camera.position.distanceTo(controls?.target ?? ORIGIN),
    [camera, controls],
  )
}

// Sub-100 nm structures are honest noise at whole-cell zoom: thousands of dots
// that read as dirt. They appear once the camera is close enough for them to
// mean something, or when the viewer asks for them by name.
//
// The threshold is two thresholds, not one. A single boundary flips the set on
// every frame while the camera drifts across it — and with damping on the
// controls, coming to rest near a boundary is exactly what a viewer does when
// something has caught their eye. The two lamella densities do not look alike,
// so that flip is visible. `band` is the width of the dead zone as a fraction
// of the threshold; a pair of complementary Details written against the same
// distance stays complementary, they just hand over at different points
// depending on which way the camera is travelling.
// `ramp` turns the gate into a handover: instead of flipping visibility it
// reports 0..1 across the same dead zone, so a population can dissolve in over
// the width the hysteresis used to sit in. Nothing needs the hysteresis once it
// ramps — there is no flip left to suppress — so a ramped Detail spends the band
// on the crossfade instead.
export function Detail({ within, beyond, forced, band = 0.06, ramp, children }) {
  const ref = useRef()
  const shown = useRef(false)
  const focalDistance = useFocalDistance()

  useFrame(() => {
    if (!ref.current) return
    const d = focalDistance()
    if (ramp && !forced) {
      const edge = within ?? beyond
      const lo = edge * (1 - band)
      const hi = edge * (1 + band)
      const t = Math.min(1, Math.max(0, (d - lo) / (hi - lo)))
      const eased = t * t * (3 - 2 * t)
      const v = within ? 1 - eased : eased
      ramp(v)
      ref.current.visible = v > 0.003
      return
    }
    if (ramp) ramp(1)
    if (forced) {
      shown.current = true
    } else if (within) {
      const slack = within * band
      shown.current = d < (shown.current ? within + slack : within - slack)
    } else {
      const slack = beyond * band
      shown.current = d >= (shown.current ? beyond - slack : beyond + slack)
    }
    ref.current.visible = shown.current
  })

  return (
    <group ref={ref} visible={false}>
      {children}
    </group>
  )
}

export function useDisposable(factory, deps) {
  const value = useMemo(factory, deps)
  useEffect(() => {
    return () => {
      if (Array.isArray(value)) value.forEach((v) => v?.dispose?.())
      else value?.dispose?.()
    }
  }, [value])
  return value
}
