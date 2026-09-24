import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Trichome from './Trichome.jsx'
import CellField from './CellField.jsx'
import CellField2D from './CellField2D.jsx'
import EuglenaField from './EuglenaField.jsx'
import HaptophyteField from './HaptophyteField.jsx'
import ColonyField from './ColonyField.jsx'
import Debris from './specimen.jsx'
import CellSection from './CellSection.jsx'
import { SWATCH } from './materials.js'
import { Optics, brightFieldTexture, darkFieldTexture } from './optics.jsx'
import { BRIGHTFIELD, TOMOGRAM, filterById, filtersFor, stage } from './microscope.js'
import { DEFAULT_SPECIES, SPECIES, speciesById } from './species/index.js'
import { CLICK_SLOP, CameraRig, KeyboardPan, MicroscopeLights, ScaleBarDriver } from './scene.jsx'
import { confidenceFor, SOURCES } from './structures.js'
import {
  CELL,
  HELIX_SPECIES_RANGE,
  LIFE_CYCLE,
  STRAIN,
  TRICHOME,
  coilCount,
  SPECIES_HELIX,
} from './science.js'
// The version on the panel is the one the release is tagged with. It used to be
// typed in by hand, and it still said v0.6 when the next release was cut.
import { homepage, version } from '../package.json'

const BACKGROUND = '#04100f'

// Which specimen the address names. The landing page's tree opens the
// microscope as microscope.html#/<species-id>, and the address then follows the
// specimen on the stage, so what is on screen can be linked to and cited.
function speciesFromHash() {
  const id = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
  return SPECIES.some((s) => s.id === id) ? id : null
}

// The way back to the atlas: the landing page beside this one. The one-file
// bundle (`npm run share`, built in the `share` mode) travels alone and has no
// page beside it, so it points at the published atlas instead.
const SHARED = import.meta.env.MODE === 'share'
const ATLAS_HOME = SHARED ? homepage : './'

// One probe at load. Without WebGL2 there is nothing to draw, and a black
// rectangle with no explanation is the least useful thing to show for it.
const HAS_WEBGL2 = (() => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
})()

// The two views of one specimen, derived rather than written out.
//
// This used to be a literal holding two camera positions, two sets of clipping
// planes, two sets of zoom limits and two sets of optics — all of them Spirulina's,
// and all of them constants. A second specimen could not have been added without
// hand-tuning a second copy of every one of them, which is the same as saying the
// atlas had room for exactly one organism.
//
// Now the species says how big it is and which way to look at it, the microscope
// says how to look, and the stage falls out of the two. The optics are the
// instrument's and are shared by everything in the atlas on purpose: what should
// differ between two plates is the organism, not the rendering.
function viewsFor(species, condenser) {
  const views = {}
  if (species.exterior) {
    views.filament = {
      ...stage(BRIGHTFIELD, {
        field: species.exterior.fieldUm,
        depth: species.exterior.depthUm,
        dir: species.exterior.view,
        unit: 'µm',
        label: species.exterior.label,
        illumination: condenser,
      }),
      caption: species.exterior.caption,
      groups: species.exterior.groups,
      form: species.exterior,
    }
  }
  if (species.interior) {
    views.cell = {
      ...stage(TOMOGRAM, {
        field: species.interior.fieldNm,
        dir: species.interior.view,
        unit: 'nm',
        label: species.interior.label,
      }),
      caption: species.interior.caption,
      groups: species.interior.groups,
    }
  }
  return views
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

// Which of the two coccoid renderers is on the stage.
//
// A switch and not a replacement, on purpose: the analytic one in CellField2D
// is a different answer to the same question, and the only way to tell whether
// it is a better one is to put the two side by side on the same culture. Both
// read the same population out of coccoid.js, so a difference between them is a
// difference in the *imaging* and nothing else.
//
//   ?render=3d   the instanced-mesh scene
//   ?render=2d   the analytic field  (default for a coccoid)
const RENDER_2D =
  typeof window === 'undefined' ||
  new URLSearchParams(window.location.search).get('render') !== '3d'

export default function App() {
  const [view, setView] = useState('filament')
  const [speciesId, setSpeciesId] = useState(() => speciesFromHash() ?? DEFAULT_SPECIES)
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

  const dark = useMemo(() => darkFieldTexture(), [])

  const helix = SPECIES_HELIX
  const species = useMemo(() => speciesById(speciesId), [speciesId])
  // Which condenser filter is in. A specimen declares the one it opens with and
  // the viewer may change it, so this is state keyed on the specimen rather than
  // a value read off the record — sliding a filter in is a thing you do at a
  // bench, and the atlas should let you do it.
  //
  // Null means "whatever this specimen asked for", so switching organism picks
  // up the new default instead of carrying the last one across; an explicit
  // choice survives until the specimen changes.
  const [chosenFilter, setChosenFilter] = useState(null)
  useEffect(() => setChosenFilter(null), [speciesId])

  const condenser = useMemo(
    () => filterById(chosenFilter ?? species.exterior?.filter ?? 'none'),
    [chosenFilter, species],
  )
  const views = useMemo(() => viewsFor(species, condenser), [species, condenser])
  // Not every specimen has an interior, and most never will. Falling back to the
  // exterior is not a guard against a bug, it is the normal case.
  const config = views[view] ?? views.filament
  const bright = config.field === 'bright'
  // The empty field is the condenser's central disc, so it is rebuilt whenever
  // the filter changes — which is per specimen, not per session.
  const brightTexture = useMemo(
    () => brightFieldTexture(config.optics?.illumination),
    [config.optics?.illumination],
  )
  useEffect(() => () => brightTexture.dispose(), [brightTexture])
  // Pitch, coils, gliding rotation and the fragmentation cycle are properties of
  // a helical trichome, not of a specimen. A coccoid has no pitch to report and
  // nothing to glide, and showing those controls beside a field of Chlorella
  // would be the panel describing an organism that is not on the stage.
  const helical = config.form?.kind === 'helical-trichome'
  const detail = selected ? species.structures[selected] : null
  // Two of the three tier labels name an organism, so they belong to the
  // specimen rather than to the atlas. See CONFIDENCE in structures.js.
  const tiers = useMemo(() => confidenceFor(species), [species])
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
  const order = config.groups.flatMap((group) => group.ids)

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

  // Changing specimen changes the scene, its units and its structure list, so
  // nothing selected, hidden or focused on the old one survives it. The view
  // goes back to the exterior because that is the one every species has.
  function switchSpecies(id) {
    setSelected(null)
    setHidden(new Set())
    setView('filament')
    setSpeciesId(id)
    setFocus(0)
  }

  // The address and the tab's title follow the specimen. The address is
  // replaced rather than pushed: the back button leaves the microscope for the
  // page that opened it, instead of walking back through every specimen tried.
  useEffect(() => {
    const hash = `#/${speciesId}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
    const genus = species.latin.split(/\s+/)[0]
    document.title =
      (species.name === genus ? species.latin : `${species.name} · ${species.latin}`) + ' — Microalgae 3D Atlas'
  }, [speciesId, species])

  // And an address typed or pasted in changes the specimen. One that names no
  // specimen is put back, so the address never claims something the stage
  // is not showing.
  useEffect(() => {
    function onHash() {
      const id = speciesFromHash()
      if (!id) window.history.replaceState(null, '', `#/${speciesId}`)
      else if (id !== speciesId) switchSpecies(id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  })

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
        <primitive attach="background" object={bright ? brightTexture : dark} />
        {config.fog && (
          <fog attach="fog" args={[BACKGROUND, config.fog[0], config.fog[1]]} />
        )}

        {view === 'filament' ? (
          <>
            {/* No lights: in transmitted light nothing is lit from the front —
                the specimen is what is left of the lamp after the crossing. */}
            {config.form.kind === 'euglenoid-field' ? (
              <EuglenaField
                form={config.form}
                focus={focus}
                optics={config.optics}
                swimming={gliding}
              />
            ) : config.form.kind === 'haptophyte-field' ? (
              <HaptophyteField
                form={config.form}
                focus={focus}
                optics={config.optics}
                swimming={gliding}
              />
            ) : config.form.kind === 'colony-field' ? (
              <ColonyField
                form={config.form}
                focus={focus}
                optics={config.optics}
                swimming={gliding}
              />
            ) : config.form.kind === 'coccoid-field' ? (
              RENDER_2D ? (
                <CellField2D
                  form={config.form}
                  focus={focus}
                  optics={config.optics}
                  onSelect={select}
                />
              ) : (
                <CellField
                  form={config.form}
                  focus={focus}
                  aperture={config.optics?.aperture ?? 0}
                  onSelect={select}
                />
              )
            ) : (
              <Trichome
                form={config.form}
                gliding={gliding}
                selected={selected}
                onSelect={select}
                life={life}
              />
            )}
            {/* Only a trichome gets neighbouring trichomes: a Spirulina
                filament is four hundred micrometres of another organism, and
                two of them arcing across a field of Chlorella or Euglena read
                as hairs on the lens. See Debris. */}
            <Debris
              field={config.form.fieldUm}
              neighbours={config.form.kind === 'helical-trichome' ? 2 : 0}
            />
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
            // On an objective that does not turn, the left button is the stage.
            // Leaving it on ROTATE with rotation disabled would make the most
            // obvious gesture in the app do nothing at all, which reads as a
            // broken view rather than as an honest one.
            LEFT: config.controls.enableRotate === false ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
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
          <p className="eyebrow">
            <a
              className="home"
              href={ATLAS_HOME}
              {...(SHARED ? { target: '_blank', rel: 'noopener' } : {})}
            >
              ← Microalgae 3D Atlas
            </a>{' '}
            · prototype v{version}
          </p>
          <h1>{species.name}</h1>
          <p className="species">
            <i>{species.latin}</i>
            {species.authority ? <span className="authority"> {species.authority}</span> : null}
          </p>

          {/* The specimen on the stage. One microscope, several organisms —
              which is the whole claim of an atlas, and it should be the first
              control in the panel rather than something to go and find. */}
          <label className="specimen">
            <span>Specimen</span>
            <select value={speciesId} onChange={(e) => switchSpecies(e.target.value)}>
              {SPECIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.latin}
                </option>
              ))}
            </select>
          </label>

          <div className="tabs" role="tablist">
            {Object.entries(views).map(([id, v]) => (
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
          {config.caption}
        </p>

        {config.fineFocus && (
          <div className="control">
            {/* The fine focus belongs to the objective, not to the organism: any
                specimen on this stage can be racked through, and it was sitting
                inside the trichome's own controls where a coccoid never saw it.
                The hint bar went on advertising shift+scroll for a control the
                panel did not show and gave no feedback for, which is worse than
                not having it. */}
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
                  aria-label="Return the plane of focus to the middle of the specimen"
                  title="Back to the middle of the specimen"
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
                The plane of focus, moved through the slide — shift and the wheel
                do the same over the specimen itself. The depth of field is a
                couple of micrometres and the specimen is tens across, so most of
                it is dissolved at any one setting. That is what an objective
                does, and it is why the focus is a control here rather than a
                setting.
              </p>
            </div>

            {/* The condenser filter, beside the fine focus because it is the
                same kind of thing: a knob on the instrument rather than a fact
                about the organism. Which one suits a specimen depends on the
                specimen — a pair that is spectacular on a colourless ciliate is
                the wrong choice for a green alga — so the atlas offers the
                choice and each species opens with the one it is best read
                under. */}
            {/* Only where a renderer can actually deliver it.
                The analytic coccoid field draws the deviated beam as its own
                additive pass; the trichome's renderer does not have one yet, so
                under a Rheinberg filter a Spirulina would come out as a flat
                dark silhouette on a coloured ground. Offering the control there
                would promise something the renderer cannot do, and a viewer
                would reasonably read the result as a bug rather than as a gap.
                It comes back the moment specimenMaterial grows the second
                pass. */}
            {(config.form?.kind === 'coccoid-field' ||
              config.form?.kind === 'euglenoid-field' ||
              config.form?.kind === 'haptophyte-field' ||
              config.form?.kind === 'colony-field') && (
            <div className="cycle">
              <label htmlFor="condenser">Condenser filter</label>
              <select
                id="condenser"
                value={condenser.id}
                onChange={(event) => setChosenFilter(event.target.value)}
              >
                {filtersFor(config.form?.kind).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <p className="note">
                {condenser.note}
                {condenser.id !== 'none' && (
                  <>
                    {' '}
                    A filter changes what the colour <em>means</em>: under two
                    lamps a specimen's colour is its measured transmittance seen
                    under both, not the transmittance alone.
                  </>
                )}
              </p>
            </div>
            )}
          </div>
        )}



        <div className="control list">
          <p className="list-title">
            <span>Structures</span>
            <span className="stepper">
              <button onClick={() => step(-1)} aria-label="Previous structure">‹</button>
              <button onClick={() => step(1)} aria-label="Next structure">›</button>
            </span>
          </p>

          {config.groups.map((group) => {
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
                    {species.structures[id].name}
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
        {view === 'filament' && helical && (
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
          {/* Three cases, not two. The exterior of a helical trichome has its
              own controls; the interior has different ones; and the exterior of
              anything else has neither. Written as a single ternary on
              `helical`, a coccoid fell through to the interior's controls and
              the Chlorella field arrived with a photosynthesis walkthrough for
              phycobilisomes it does not have. */}
          {view === 'filament' ? (
            helical ? (
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
            ) : config.form?.motion ? (
            <>
              {/* A swimmer's own clock. What the motion is differs by organism
                  — a Euglena crossing the field, a Braarudosphaera holding
                  station — so the words come from the specimen's record. */}
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={gliding}
                  onChange={(e) => setGliding(e.target.checked)}
                />
                {config.form.motion.label}
              </label>
              <p className="note">{config.form.motion.note}</p>
            </>
            ) : null
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
            views.cell ? (
              <button className="cta" onClick={() => switchView('cell')}>
                Enter a single cell →
              </button>
            ) : (
              <p className="note">
                No interior for this specimen yet. What is known about the outside
                is on the cards above, and what this instrument cannot resolve is
                marked as such.
              </p>
            )
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
              .map(([tier, n]) => `${n} ${tiers[tier].label}`)
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

          {/* A card may carry a caveat about its own evidence — not about the
              organism, about what this view is entitled to claim. The
              chloroplast's is the case that made it necessary: its colour is a
              measured transmittance, and under a condenser filter what reaches
              the screen is that transmittance seen under two lamps. An atlas
              whose whole argument is provenance cannot let a display choice
              quietly stand in for a measurement. Styled like the helix's strain
              note, because it is the same kind of statement. */}
          {detail.caveat && <p className="note strain">{detail.caveat}</p>}

          {/* The evidence is per row — a card can hold a thickness measured on
              Spirulina next to a shell composition inferred from a genome — so
              each row carries its own tier and the bar above is only their
              sum. */}
          <dl className="dims">
            {detail.dimensions.map(([k, v, tier = detail.confidence]) => (
              <div key={k} className={`tier-${tier}`}>
                <dt>
                  <span className="tier" title={tiers[tier].label} aria-hidden="true" />
                  {k}
                </dt>
                <dd>
                  {v}
                  <span className="sr-only"> — {tiers[tier].label}</span>
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
                {tiers[tier].label}
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
          {config.controls.enableRotate === false ? (
            <>
              Click a structure · ← → to step · drag or WASD to move the stage ·
              scroll to zoom · shift+scroll for fine focus
            </>
          ) : (
            <>
              Click a structure · ← → to step · drag to orbit · WASD or
              right-drag to move · scroll to zoom at the pointer
            </>
          )}
        </span>
        <button className="reset" onClick={goHome} title="Back to the whole cell (Esc)">
          Reset view
        </button>
      </div>
    </div>
  )
}
