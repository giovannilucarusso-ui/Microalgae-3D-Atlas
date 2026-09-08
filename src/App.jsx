import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Trichome from './Trichome.jsx'
import Debris from './specimen.jsx'
import CellSection from './CellSection.jsx'
import { SWATCH } from './materials.js'
import { Optics, brightFieldTexture, darkFieldTexture } from './optics.jsx'
import { CLICK_SLOP, CameraRig, KeyboardPan, MicroscopeLights, ScaleBarDriver } from './scene.jsx'
import { CONFIDENCE, GROUPS, SOURCES, STRUCTURES, tourOrder } from './structures.js'
import {
  CELL,
  HELIX_SPECIES_RANGE,
  LIFE_CYCLE,
  STRAIN,
  TRICHOME,
  coilCount,
  SPECIES_HELIX,
} from './science.js'

const BACKGROUND = '#04100f'

// One probe at load. Without WebGL2 there is nothing to draw, and a black
// rectangle with no explanation is the least useful thing to show for it.
const HAS_WEBGL2 = (() => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
})()

// Two instruments, because the two scales are not seen with the same one.
// The filament is a wet mount in transmitted light — that is genuinely how you
// meet Spirulina. The interior is 56 nm of detail no lens can resolve, so it is
// shown the way it is actually recorded: a dark ground with the structures lit
// from within, the register of a confocal stack or a tomogram.
const VIEWS = {
  filament: {
    label: 'Filament',
    unit: 'µm',
    field: 'bright',
    // Pulled back from 516: at that distance the top of the filament was cut
    // off by the frame, which nobody had noticed because the interesting part
    // was in the middle. The life cycle happens at the far end, and it has to
    // be somewhere you can see.
    camera: { position: [299, 160, 518], fov: 40, near: 1, far: 6000 },
    controls: { minDistance: 25, maxDistance: 1600 },
    home: { target: [0, 0, 0], dir: [299, 160, 518], distance: 620 },
    // The fine focus, in µm of focal plane travel either way. A microscope has
    // a second knob because the depth of field is thinner than the specimen,
    // and the answer to "half of every coil is dissolved" is the answer a
    // microscopist gives: rack through it. 60 µm covers the helix, whose depth
    // extent from this camera is about 78, and a little past both ends of it.
    fineFocus: { range: 60, step: 0.5 },
    // A high-aperture objective has a focal plane a couple of micrometres
    // thick; over a 36 µm helix that leaves most of every coil dissolved. That
    // is what an objective does, and it is why `fineFocus` above exists rather
    // than this number being smaller.
    optics: {
      aperture: 11,
      maxBlur: 0.015,
      aberration: 0.0024,
      glare: 0.085,
      vignette: 0.34,
      grain: 0.03,
      saturation: 0.9,
      lift: 0,
      tint: '#fdfffd',
    },
  },
  cell: {
    label: 'Cell interior',
    unit: 'nm',
    field: 'dark',
    // Above the middle of the cutaway opening: high enough that the lamella
    // pattern reads in plan, far enough that the whole cell has margin.
    camera: { position: [6660, 13660, 10460], fov: 36, near: 40, far: 90000 },
    controls: { minDistance: 220, maxDistance: 40000 },
    home: { target: [0, 0, 0], dir: [6660, 13660, 10460], distance: 18450 },
    // Depth cueing does most of the work of telling front from back in a
    // cutaway this crowded, so the fog starts earlier than the camera sits.
    fog: [12800, 25500],
    optics: {
      aperture: 1.7,
      // 3500 nm — a little under the cell's own radius. With the aperture at
      // 1.7 and the blur capped at 11.7 px, that holds about ±180 nm within a
      // pixel of focus and ±350 within two, so a whorl of lamellae is inspected
      // as a body rather than as one sharp membrane between two smeared ones.
      // Micrometres away still dissolves: this floors the near field, it does
      // not switch the depth of field off.
      depthFloor: 3500,
      maxBlur: 0.013,
      aberration: 0.0016,
      glare: 0.09,
      vignette: 0.44,
      grain: 0.026,
      saturation: 1.02,
      lift: 0.008,
      // The crevice darkening carries the form now. It is the only term in the
      // pass that knows a lamella has a neighbour 56 nm behind it, and with
      // the sky light down it is what separates one membrane from the next
      // instead of the two blending into a plateau.
      ao: 0.95,
      aoRadius: 0.0052,
      aoFalloff: 0.0042,
      tint: '#ffffff',
    },
  },
}

// Layer switch: the one control that answers "the thylakoids are in the way".
function Eye({ off }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M1.2 8S3.8 3.9 8 3.9 14.8 8 14.8 8 12.2 12.1 8 12.1 1.2 8 1.2 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="8" cy="8" r="1.85" fill="currentColor" />
      {off && <line x1="2.6" y1="13.4" x2="13.4" y2="2.6" stroke="currentColor" strokeWidth="1.4" />}
    </svg>
  )
}

export default function App() {
  const [view, setView] = useState('filament')
  const [gliding, setGliding] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [selected, setSelected] = useState(null)
  const [hidden, setHidden] = useState(() => new Set())

  const [lostContext, setLostContext] = useState(false)
  const [lifePlaying, setLifePlaying] = useState(false)
  const [photosynthesis, setPhotosynthesis] = useState(false)

  const photoName = useRef(null)
  const photoText = useRef(null)
  const photo = useRef({ name: photoName, text: photoText })

  // Progress changes every frame, so it lives in a ref and the scene writes the
  // slider and the caption straight to the DOM — the same trick the scale bar
  // uses. Only `playing` is React state, because only `playing` changes when a
  // person clicks something.
  const lifeSlider = useRef(null)
  const lifeName = useRef(null)
  const lifeText = useRef(null)
  const life = useRef({
    progress: 0,
    playing: false,
    slider: lifeSlider,
    name: lifeName,
    text: lifeText,
  })
  life.current.playing = lifePlaying

  const barRef = useRef(null)
  const labelRef = useRef(null)

  const fields = useMemo(() => ({ bright: brightFieldTexture(), dark: darkFieldTexture() }), [])

  const helix = SPECIES_HELIX
  const config = VIEWS[view]
  const bright = config.field === 'bright'
  const detail = selected ? STRUCTURES[selected] : null
  // A structure that moves with the model says where it is as a function of the
  // geometry rather than remembering a coordinate that was true once.
  const detailCamera =
    typeof detail?.camera === 'function' ? detail.camera(helix) : detail?.camera
  // Which tiers this card actually uses, in the order the dossier ranks them:
  // measured here, borrowed from a model organism, not established at all.
  // How many rows of this card rest on each kind of evidence. The card used to
  // announce a single headline tier taken from one field, which on eleven of
  // the eighteen cards sat above a table containing an explicit "never
  // measured" — the most prominent claim in the product was its least accurate
  // one. Counting the rows cannot contradict them.
  const TIERS = ['species', 'model', 'unverified']
  const tierCounts = detail
    ? TIERS.map((tier) => [
        tier,
        detail.dimensions.filter(([, , t = detail.confidence]) => t === tier).length,
      ])
    : []
  const rowCount = detail ? detail.dimensions.length : 0
  const order = tourOrder(view)

  // Getting back out.
  //
  // The rig flies wherever `camera` points, and it only flies when that object
  // changes — so with nothing selected the goal was `config.home`, a constant,
  // and asking for it again changed nothing. Which meant that once a viewer had
  // panned and zoomed their way somewhere, there was no way home: Escape
  // cleared a selection that was not there and the camera stayed lost. That is
  // the thing that makes people afraid to move in the first place, and it is
  // why this view could feel as though it were locked to one axis when in fact
  // it was free the whole time. A fresh object per request fixes it.
  // The fine focus: an offset on the plane of focus, in scene units, carried in
  // a ref so that racking it does not re-render the app once per frame. The
  // slider and the readout are driven from here rather than from state, the way
  // the life cycle already is.
  const focus = useRef(0)
  const focusSlider = useRef(null)
  const focusValue = useRef(null)
  function showFocus() {
    const v = focus.current
    if (focusValue.current) {
      focusValue.current.textContent =
        (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1) + ' µm'
    }
  }
  function setFocus(value) {
    const limit = config.fineFocus?.range ?? 0
    focus.current = Math.max(-limit, Math.min(limit, value))
    if (focusSlider.current) focusSlider.current.value = String(focus.current)
    showFocus()
  }

  const [homeAt, setHomeAt] = useState(0)
  const homeGoal = useMemo(() => ({ ...config.home }), [config, homeAt])
  function goHome() {
    setSelected(null)
    setHomeAt((n) => n + 1)
    setFocus(0)
  }

  // Switching view swaps the whole Canvas and with it the scene's units — µm
  // one side, nm the other — so an offset carried across is not a smaller
  // number, it is a nonsensical one.
  useEffect(() => {
    focus.current = 0
    showFocus()
  }, [view])

  // Fine focus on shift+wheel. The wheel on its own is the coarse control: it
  // dollies the camera towards the specimen. This is the other knob, and it
  // belongs under the hand rather than in the panel — racking focus is
  // something you do while looking, not something you go and set.
  //
  // The listener sits on window in the capture phase because OrbitControls owns
  // the wheel on the canvas and does not look at modifiers. A listener on the
  // canvas itself would run against drei's in registration order, which is
  // whichever mounted first; capture on an ancestor is not a race.
  useEffect(() => {
    if (!config.fineFocus) return
    const step = config.fineFocus.step * 4
    const onWheel = (event) => {
      if (!event.shiftKey) return
      if (event.target?.tagName !== 'CANVAS') return
      event.preventDefault()
      event.stopPropagation()
      setFocus(focus.current + (event.deltaY > 0 ? step : -step))
    }
    window.addEventListener('wheel', onWheel, { capture: true, passive: false })
    return () => window.removeEventListener('wheel', onWheel, { capture: true })
  }, [config])

  // Clicking empty field clears the selection, but a *drag* that starts and
  // ends on empty field is an orbit, and clearing the selection out from under
  // someone who is orbiting in order to look at the thing they selected is the
  // same fault as selecting on a drag. The parts get this from R3F's own
  // `delta`; `onPointerMissed` hands over the raw DOM event, so the press has
  // to be remembered here.
  const pressAt = useRef(null)
  useEffect(() => {
    const down = (event) => {
      pressAt.current = [event.clientX, event.clientY]
    }
    window.addEventListener('pointerdown', down)
    return () => window.removeEventListener('pointerdown', down)
  }, [])
  function clearIfClick(event) {
    const from = pressAt.current
    if (from && Math.hypot(event.clientX - from[0], event.clientY - from[1]) > CLICK_SLOP) return
    setSelected(null)
  }

  function switchView(next) {
    setSelected(null)
    setHidden(new Set())
    setView(next)
  }

  // Picking a structure that has been switched off brings it back — otherwise
  // the camera flies to something invisible.
  function select(id) {
    if (id && hidden.has(id)) {
      const next = new Set(hidden)
      next.delete(id)
      setHidden(next)
    }
    setSelected(id)
  }

  function toggleLayer(ids) {
    const next = new Set(hidden)
    const allOff = ids.every((id) => next.has(id))
    ids.forEach((id) => (allOff ? next.delete(id) : next.add(id)))
    if (!allOff && selected && ids.includes(selected)) setSelected(null)
    setHidden(next)
  }

  function step(delta) {
    const at = selected ? order.indexOf(selected) : -1
    // From nothing, stepping forward has to land on the first structure and
    // stepping back on the last. The arithmetic that handled both at once was
    // off by one going forward and quietly skipped the cell wall.
    if (at === -1) {
      setSelected(order[delta > 0 ? 0 : order.length - 1])
      return
    }
    setSelected(order[(at + delta + order.length) % order.length])
  }

  // The scene itself cannot be driven from a keyboard — orbiting is a pointer
  // gesture — but walking the structures and getting back out can be, and that
  // is the path through the content. Arrow keys step; Escape goes home, and it
  // does that whether or not anything is selected, because the viewer who most
  // needs it is the one who has no selection and has lost the cell.
  useEffect(() => {
    function onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key === 'Escape') {
        goHome()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        step(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        step(-1)
      } else {
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={bright ? 'app bright' : 'app'}>
      {!HAS_WEBGL2 ? (
        <div className="unsupported">
          <h2>This atlas needs WebGL 2</h2>
          <p>
            The cell is built and lit in the browser rather than shipped as
            pictures, and this browser cannot give it a WebGL 2 context. A
            current Firefox, Chrome, Edge or Safari will run it. On a remote
            desktop or a virtual machine, hardware acceleration is usually the
            thing that has been switched off.
          </p>
        </div>
      ) : (
      <Canvas
        key={view}
        shadows={view === 'cell'}
        camera={config.camera}
        gl={{ toneMapping: THREE.NeutralToneMapping, antialias: false }}
        onPointerMissed={clearIfClick}
        tabIndex={0}
        aria-label={
          view === 'filament'
            ? 'Three-dimensional view of a Spirulina filament. Use the structure list to explore it.'
            : 'Three-dimensional cutaway of a Spirulina cell. Use the structure list, or the left and right arrow keys, to explore it. W, A, S and D move the camera; Escape returns to the whole cell.'
        }
        onCreated={({ gl }) => {
          // Without preventDefault the browser will not even try to give the
          // context back, and the page stays black for good.
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            // Switching view swaps the whole Canvas, and react-three-fiber tears
            // the old one down half a second later by calling forceContextLoss()
            // on it. That is a funeral, not an accident. Which canvas is the live
            // one cannot be settled by a ref here: building the replacement takes
            // longer than that timer on a slow machine, so the funeral arrives
            // while the ref still names the corpse. The document is the one
            // witness that cannot be racing — a canvas that has already left it
            // is not the canvas the user is looking at.
            if (!event.target.isConnected) return
            setLostContext(true)
          })
          gl.domElement.addEventListener('webglcontextrestored', () => setLostContext(false))
        }}
      >
        <primitive attach="background" object={bright ? fields.bright : fields.dark} />
        {config.fog && (
          <fog attach="fog" args={[BACKGROUND, config.fog[0], config.fog[1]]} />
        )}

        {view === 'filament' ? (
          <>
            {/* No lights: in transmitted light nothing is lit from the front —
                the specimen is what is left of the lamp after the crossing. */}
            <Trichome
              gliding={gliding}
              selected={selected}
              onSelect={select}
              life={life}
            />
            <Debris />
          </>
        ) : (
          <>
            <MicroscopeLights shadows scale={8000} />
            <CellSection
              selected={selected}
              onSelect={select}
              showLabels={showLabels}
              hidden={hidden}
              photosynthesis={photosynthesis}
              photo={photo}
            />
          </>
        )}

        {/* Zooming towards the pointer rather than towards the middle of the
            cell is what turns the wheel from a magnifier into a way of getting
            about: point at the carboxysomes and roll, and you arrive there.
            Without it the only route to anything off-centre was pan, zoom, pan
            again — and panning is on the right button, which nobody finds.

            The middle button used to dolly, which the wheel already does. It
            pans now, so all three of the gestures a viewer might try for
            "move sideways" — right-drag, middle-drag, Shift-drag — do. */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          zoomToCursor
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.PAN,
          }}
          {...config.controls}
        />
        <CameraRig camera={detailCamera ?? homeGoal} />
        <KeyboardPan />
        <ScaleBarDriver barRef={barRef} labelRef={labelRef} unit={config.unit} />
        <Optics settings={config.optics} focus={focus} />
      </Canvas>
      )}

      {lostContext && (
        <div className="unsupported" role="alert">
          <h2>The graphics context was lost</h2>
          <p>
            The browser took the GPU back — usually a driver reset, or another
            application asking for everything. Reload to rebuild the scene.
          </p>
          <button className="cta" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}

      <aside className="panel">
        {/* Identity and the view switcher stay put; everything below them
            scrolls. On a short window the whole panel used to scroll as one
            block and the title was the first thing to leave. */}
        <div className="panel-head">
          <p className="eyebrow">Interactive 3D atlas · prototype v0.6</p>
          <h1>Spirulina</h1>
          <p className="species">
            <i>Limnospira (Arthrospira) platensis</i>
          </p>

          <div className="tabs" role="tablist">
            {Object.entries(VIEWS).map(([id, v]) => (
              <button
                key={id}
                role="tab"
                aria-selected={view === id}
                className={view === id ? 'tab active' : 'tab'}
                onClick={() => switchView(id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
        <p className="caption">
          {view === 'filament'
            ? 'One filament in a wet mount, about 110 cells long, seen in transmitted light. Pick a cell to go inside.'
            : 'One cell, cut open: a wedge and the cell above it have been removed, so you look down onto the lower cross-wall.'}
        </p>


        <div className="control list">
          <p className="list-title">
            <span>Structures</span>
            <span className="stepper">
              <button onClick={() => step(-1)} aria-label="Previous structure">‹</button>
              <button onClick={() => step(1)} aria-label="Next structure">›</button>
            </span>
          </p>

          {GROUPS[view].map((group) => {
            const allOff = group.ids.every((id) => hidden.has(id))
            return (
              <div className="group" key={group.title}>
                <p className="group-title">
                  <span>{group.title}</span>
                  {view === 'cell' && (
                    <button
                      className={allOff ? 'peek off' : 'peek'}
                      onClick={() => toggleLayer(group.ids)}
                      aria-label={`${allOff ? 'Show' : 'Hide'} ${group.title}`}
                      title={`${allOff ? 'Show' : 'Hide'} this layer`}
                    >
                      <Eye off={allOff} />
                    </button>
                  )}
                </p>
                {group.ids.map((id) => (
                  <button
                    key={id}
                    className={[
                      'item',
                      selected === id ? 'active' : '',
                      hidden.has(id) ? 'muted' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => select(id)}
                  >
                    <span className="dot" style={{ background: SWATCH[id] ?? '#7fd4b8' }} />
                    {STRUCTURES[id].name}
                  </button>
                ))}
              </div>
            )
          })}

          {(selected || hidden.size > 0) && (
            <button
              className="clear"
              onClick={() => {
                setSelected(null)
                setHidden(new Set())
              }}
            >
              {selected ? 'clear focus' : 'show every layer'}
            </button>
          )}
        </div>
        {view === 'filament' && (
          <div className="control">
            <div className="readout">
              <span>Pitch <b>{helix.pitchUm.toFixed(0)} µm</b></span>
              <span>Helix Ø <b>{helix.diameterUm.toFixed(0)} µm</b></span>
              <span>Coils <b>{coilCount(helix).toFixed(1)}</b></span>
            </div>
            {/* There used to be a temperature slider here, and the helix moved
                with it. The relationship is real, but it was measured in one
                culture whose pitch sits outside the range the species occupies
                — so the slider quietly made the whole filament a portrait of
                that culture. What is drawn now is the middle of the range. */}
            <p className="note strain">
              The helix is the <b>middle of the species range</b>, not a strain: across
              described populations the pitch runs{' '}
              {HELIX_SPECIES_RANGE.pitchUm[0]}–{HELIX_SPECIES_RANGE.pitchUm[1]} µm and the
              diameter{' '}
              {HELIX_SPECIES_RANGE.diameterUm[0]}–{HELIX_SPECIES_RANGE.diameterUm[1]} µm.
              Only the {STRAIN.name} culture has had its helix measured against growth
              temperature ({STRAIN.reference}), and it coils more openly than the species
              range allows — which is why this filament is not built from it.
            </p>
          </div>
        )}

        <div className="control">
          {view === 'filament' ? (
            <>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={gliding}
                  onChange={(e) => setGliding(e.target.checked)}
                />
                Gliding rotation
              </label>
              <p className="note">
                The filament turns about its own axis and reverses periodically.
                In open water that rotation drives it forward, one helix pitch per
                turn — no flagella involved.
              </p>

              {/* The fine focus. The depth of field here is an objective's, not
                  a render's convenience: a couple of micrometres over a helix
                  38 µm across, so at any one setting the far half of every coil
                  is dissolved. That is not a fault to be tuned out — it is what
                  the instrument does, and it is why a microscope has this
                  second knob. Rack it and the coils come forward in turn. */}
              <div className="cycle">
                <label htmlFor="fine">
                  Fine focus
                  <span className="value" ref={focusValue}>
                    0.0 µm
                  </span>
                </label>
                <div className="cycle-row">
                  <button
                    className="play"
                    onClick={() => setFocus(0)}
                    aria-label="Return the plane of focus to the middle of the helix"
                    title="Back to the middle of the helix"
                  >
                    ⌖
                  </button>
                  <input
                    id="fine"
                    type="range"
                    min={-config.fineFocus.range}
                    max={config.fineFocus.range}
                    step={config.fineFocus.step}
                    defaultValue="0"
                    ref={focusSlider}
                    onInput={(event) => setFocus(Number(event.target.value))}
                  />
                </div>
                <p className="note">
                  The plane of focus, moved through the slide. Shift and the
                  wheel do the same over the specimen itself. The depth of field
                  is a couple of micrometres and the helix is 38 across, so most
                  of it is always dissolved — which is what a coil of this looks
                  like down a real objective, and why the focus is a control
                  rather than a setting.
                </p>
              </div>

              {/* The life cycle. Scrub it, or let it run: a necridium forms, the
                  filament parts at it, and the hormogonium screws away along the
                  helix it is still part of. */}
              <div className="cycle">
                <label htmlFor="life">
                  Life cycle
                  <span className="value" ref={lifeName}>
                    {LIFE_CYCLE.stages[0].name}
                  </span>
                </label>
                <div className="cycle-row">
                  <button
                    className="play"
                    onClick={() => setLifePlaying((on) => !on)}
                    aria-label={lifePlaying ? 'Pause the life cycle' : 'Play the life cycle'}
                  >
                    {lifePlaying ? '❚❚' : '▶'}
                  </button>
                  <input
                    id="life"
                    type="range"
                    min="0"
                    max="1"
                    step="0.002"
                    defaultValue="0"
                    ref={lifeSlider}
                    onInput={(event) => {
                      life.current.progress = Number(event.target.value)
                      if (life.current.playing) setLifePlaying(false)
                    }}
                  />
                </div>
                <p className="note" ref={lifeText}>
                  {LIFE_CYCLE.stages[0].text}
                </p>
              </div>
            </>
          ) : (
            <>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
                Labels
              </label>
              <p className="note">
                Pick a structure and the rest of the cell steps aside, leaving the
                envelope as a glass hull so you can see where you are. Switch a
                whole layer off with the eye to look past it.
              </p>

              {/* The one thing about a phycobilisome worth animating is the
                  direction the energy goes: inward, down the rods, and it
                  cannot come back. */}
              <div className="cycle">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={photosynthesis}
                    onChange={(event) => setPhotosynthesis(event.target.checked)}
                  />
                  Photosynthesis
                </label>
                {photosynthesis ? (
                  <>
                    <p className="step" ref={photoName} />
                    <p className="note" ref={photoText} />
                  </>
                ) : (
                  <p className="note">
                    Follow one packet of light from the rod tips to Rubisco. Close
                    in on the phycobilisomes to watch the excitation travel down
                    the rods — every step inward is downhill in energy, which is
                    why it only goes one way.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        </div>

        {/* The move between the two scales is the primary action here, so it is
            pinned like the tabs rather than left to scroll away. */}
        <div className="panel-foot">
          {view === 'filament' ? (
            <button className="cta" onClick={() => switchView('cell')}>
              Enter a single cell →
            </button>
          ) : (
            <button className="cta ghost" onClick={() => switchView('filament')}>
              ← Back to the filament
            </button>
          )}
        </div>
      </aside>

      {detail && (
        <aside className="detail" aria-live="polite">
          <button className="close" onClick={() => setSelected(null)} aria-label="Close">
            ×
          </button>
          <p className="latin">{detail.latin}</p>
          <h2>{detail.name}</h2>
          {/* The evidence in this card, as it actually falls. */}
          <div className="evidence">
            <div className="evbar" role="img" aria-label={tierCounts
              .filter(([, n]) => n > 0)
              .map(([tier, n]) => `${n} ${CONFIDENCE[tier].label}`)
              .join(', ')}>
              {tierCounts
                .filter(([, n]) => n > 0)
                .map(([tier, n]) => (
                  <span
                    key={tier}
                    className={`tier-${tier}`}
                    style={{ flexGrow: n }}
                  />
                ))}
            </div>
            <span className="evcount">
              {tierCounts.map(([, n]) => n).join(' · ')}
              <span className="evof"> of {rowCount}</span>
            </span>
          </div>

          <p className="body">{detail.what}</p>
          <p className="body">{detail.role}</p>

          {/* The evidence is per row — a card can hold a thickness measured on
              Spirulina next to a shell composition inferred from a genome — so
              each row carries its own tier and the bar above is only their
              sum. */}
          <dl className="dims">
            {detail.dimensions.map(([k, v, tier = detail.confidence]) => (
              <div key={k} className={`tier-${tier}`}>
                <dt>
                  <span className="tier" title={CONFIDENCE[tier].label} aria-hidden="true" />
                  {k}
                </dt>
                <dd>
                  {v}
                  <span className="sr-only"> — {CONFIDENCE[tier].label}</span>
                </dd>
              </div>
            ))}
          </dl>

          {/* Always all three. A tier this card happens not to use is still
              worth showing dimmed: "nothing here is unverified" is a claim, and
              hiding the row is what made three green dots on a single-tier card
              read as decoration with no legend anywhere. */}
          <ul className="tierkey">
            {tierCounts.map(([tier, n]) => (
              <li key={tier} className={`tier-${tier}${n ? '' : ' unused'}`}>
                <span className="tier" aria-hidden="true" />
                {CONFIDENCE[tier].label}
              </li>
            ))}
          </ul>

          <p className="srclabel">Sources</p>
          <ul className="srclist">
            {detail.sources.map((id) => (
              <li key={id}>
                <a href={SOURCES[id].url} target="_blank" rel="noreferrer">
                  {SOURCES[id].text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <div className="scalebar">
        <div className="bar" ref={barRef} />
        <span className="barlabel" ref={labelRef} />
      </div>

      {/* The only place the app says how to move. It used to name orbit and
          zoom and stop there, so panning — which has worked all along, on the
          right button — was a feature nobody could find, and the view read as
          locked to one axis. */}
      <div className="hint">
        <span>
          Click a structure · ← → to step · drag to orbit · WASD or right-drag
          to move · scroll to zoom at the pointer
          {view === 'filament' ? ' · shift+scroll for fine focus' : ''}
        </span>
        <button className="reset" onClick={goHome} title="Back to the whole cell (Esc)">
          Reset view
        </button>
      </div>
    </div>
  )
}
