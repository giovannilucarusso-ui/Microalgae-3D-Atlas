// The microscope, which is one instrument for every specimen in the atlas.
//
// A species brings its own body and its own dimensions. It does not bring its
// own optics — that is the whole point of an atlas seen down a microscope: a
// Chlorella and a Spirulina are looked at through the same objective, so what
// differs between two plates is the organism and not the rendering. Everything
// describing the instrument is here; everything describing an organism is in
// `src/species/`. If a species ever needs its own optics to look right, the
// honest reading is that the optics are wrong, not that the species is special.
//
// There are two objectives because there are two scales, and they are not seen
// with the same instrument. A trichome in a wet mount is transmitted light —
// that is genuinely how you meet one. An interior is tens of nanometres of
// detail no lens can resolve, so it borrows the register those are read in: a
// dark ground with the structures lit from within, as in a confocal stack or a
// tomogram.
import * as THREE from 'three'

// The filters that can go under the condenser.
//
// Rheinberg illumination is a two-colour filter: a central disc whose light goes
// straight up the optical axis — that is the empty field, and it is the disc's
// colour — and a ring around it whose light enters too steeply for the objective
// to collect, so it reaches the image **only where something on the slide has
// bent it**. The specimen therefore appears in the ring's colour on a ground of
// the disc's, and every refracting edge lights up.
//
// Three things follow, and they are why this is a list rather than a setting:
//
//   · **No filter is the first entry, and it is not a special case.** With the
//     disc and the ring the same colour they are one lamp, the deviated beam has
//     nothing to add that the direct beam did not already deliver, and every
//     equation returns ordinary brightfield. Everything else here is a departure
//     from that, measured against it.
//   · **Darkfield is the same mechanism with the disc blacked out.** Nothing
//     goes straight through, so the ground is dark and the only light in the
//     image is what the specimen scattered. It is not a separate technique in
//     this model — it is the end of the same continuum, which is a pleasant
//     thing for the atlas to be able to say.
//   · **The right filter depends on the organism**, which is why the choice is
//     offered rather than fixed. A blue disc with a warm ring is the classic
//     pair and it is spectacular on colourless things; on a green alga it is
//     the wrong choice, because the disc passes almost no red, the ring-to-disc
//     ratio in that channel is enormous, and the cells come out orange.
//
// What a filter costs is stated on the card: under any of these but the first,
// a specimen's colour is no longer simply its measured transmittance — it is
// that transmittance under two lamps.
export const FILTERS = [
  {
    id: 'none',
    label: 'None · brightfield',
    note: 'One lamp. The colour of a specimen is its own transmittance and nothing else.',
    direct: '#e6e3d9',
    oblique: '#e6e3d9',
  },
  {
    id: 'teal-green',
    label: 'Rheinberg · teal and green',
    note: 'Chosen for green algae. The ring is pulled towards green rather than the usual gold, because the disc passes almost no red and a warm ring therefore turns a green cell amber: measured on a Chlorella field the red-to-green ratio of a median cell reads 0.73 here against 0.76 under no filter at all, so the pigment and not the glass is still deciding the hue.',
    direct: '#35758c',
    oblique: '#cdeeb2',
  },
  {
    id: 'blue-gold',
    label: 'Rheinberg · blue and gold',
    note: 'The classic pair. Spectacular on colourless bodies; on a green cell the disc passes so little red that the specimen turns amber.',
    direct: '#243f86',
    oblique: '#ffd27a',
  },
  {
    id: 'darkfield',
    label: 'Darkfield',
    note: 'The same filter with the disc blacked out: nothing reaches the image except what the specimen scattered.',
    direct: '#07161d',
    oblique: '#f4f7ff',
  },
  // Differential interference contrast, which is not a filter but a pair of
  // prisms — one under the condenser, one over the objective — and is here
  // because it sits in the same place on the instrument and is chosen for the
  // same reason: it suits some specimens and not others.
  //
  // The beam is split in two, the halves are sheared a fraction of a micrometre
  // apart across the slide, and they are recombined. Where the optical path is
  // the same under both nothing happens; where it *changes* across that shear,
  // one half is retarded against the other and the pixel brightens or darkens.
  // So what DIC draws is the slope of the optical path along one direction —
  // `shear`, in the image — and a smooth body comes out as if lit from one side,
  // bright where its thickness rises and shadowed where it falls. `relief` is
  // how much brighter per unit of slope.
  //
  // It is the look of the reference footage for Euglena — Journey to the
  // Microcosmos, at 200× — and the colours are taken from the same frames. They
  // are **not DIC's own colours**: a plain DIC image is grey, and that footage
  // is graded. The ground here is the blue measured off it, and the luminous
  // yellow-green the cells glow with is drawn by the same two-beam arithmetic
  // as a Rheinberg filter — the light the cell deviates arriving warm — because
  // that is the one mechanism in this model that can make a green absorber
  // brighter in the red than the ground it sits on, which the footage is.
  {
    id: 'dic',
    label: 'DIC · blue ground',
    note: 'Nomarski differential interference contrast. What it draws is not the optical path but its slope along one direction, so every cell comes out in relief — bright on the side its thickness rises, shadowed on the side it falls. The blue ground and the warm, luminous green are the grade of the reference footage (Journey to the Microcosmos, 200×) rather than DIC’s own colours, which are grey.',
    direct: '#37708d',
    oblique: '#dcff2a',
    shear: [1, -1],
    relief: 6,
    // Only the euglenoid field computes the slope. Elsewhere this entry would
    // be a Rheinberg pair wearing a DIC label.
    renderers: ['euglenoid-field'],
  },
]

export const filterById = (id) => FILTERS.find((f) => f.id === id) ?? FILTERS[0]

// The entries a renderer can actually deliver.
export const filtersFor = (kind) => FILTERS.filter((f) => !f.renderers || f.renderers.includes(kind))

export const BRIGHTFIELD = {
  id: 'brightfield',
  label: 'Transmitted light',
  field: 'bright',
  fov: 40,
  // **A microscope does not orbit.** You can move the stage, you can change the
  // objective, you can rack the focus — and that is the whole of it. The
  // specimen is under a coverslip on a flat piece of glass and the optical axis
  // is fixed; there is no gesture on any instrument that shows you a wet mount
  // from the side.
  //
  // So the wet-mount objective does not turn, and left-drag moves the stage
  // instead. This is a property of the *instrument*, which is why it is stated
  // here rather than in either specimen: it applies to the Chlorella field and
  // to the Spirulina filament for exactly the same reason, and a view that let
  // you orbit was quietly saying it was a 3D model of an organism rather than
  // an image of one through a lens. Letting the viewer fly round the specimen
  // was also doing real damage to the illusion the rest of this file exists to
  // build — the moment the field tips, it stops being a microscope.
  orbit: false,
  // The stage, as ratios of the working distance rather than as constants. A
  // specimen an order of magnitude smaller then needs no clipping planes, zoom
  // limits or fine-focus travel re-tuned by hand — it declares how much slide it
  // wants in frame and the rest follows.
  //
  // These are the trichome view's own numbers divided through, so nothing about
  // it moves. The tomogram's are different, and that is why they sit on the
  // objective and not in `stage`: a stage racked over half a millimetre of slide
  // and one racked over twelve microns of cell do not behave alike, and pretending
  // they do would have meant re-tuning one of them to a shared compromise.
  ratios: { near: 1 / 620, far: 9.677, minDistance: 1 / 24.8, maxDistance: 2.581 },
  // A microscope has a second knob because the depth of field is thinner than
  // the specimen. Only this objective has one: a reconstruction has no stage to
  // rack. The travel is a fraction of the specimen's DEPTH, and getting that
  // wrong is what made the control feel broken: keyed to the field's width, a
  // Chlorella mount got 11.7 µm of travel through a slab 45 µm deep — the knob
  // could not reach most of the specimen, and each wheel click moved it four
  // tenths of a micrometre, so nothing visibly happened either.
  fineFocus: { range: 0.8, step: 1 / 190 },
  // A high-aperture objective has a focal plane a couple of micrometres thick.
  // Over a specimen tens of micrometres deep that leaves most of it dissolved,
  // which is what an objective does — and why `fineFocus` exists rather than
  // this number being smaller. See the fine focus in App.
  optics: {
    // The condenser's filter, and the default is no filter at all.
    //
    // See brightFieldTexture in optics.jsx. `direct` is the central disc, whose
    // light goes straight up the axis and is the colour of the empty field;
    // `oblique` is the ring around it, whose light enters too steeply for the
    // objective to collect and so arrives *only* where something on the slide
    // has bent it. Equal, as here, the two are one lamp and every equation in
    // the atlas returns ordinary brightfield — which is why this is the default
    // and Rheinberg is the departure, rather than the other way round.
    //
    // A specimen may ask for a different pair. A filter is a piece of glass you
    // slide into the condenser and take out again, chosen for whatever is on the
    // stage, so it is one of the very few optical settings that belongs to the
    // session rather than to the lens — and it is the reason Chlorella is looked
    // at through one and Spirulina is not. See `illumination` on the Chlorella
    // record, and the merge in stage() below.
    illumination: {
      direct: '#e6e3d9',
      oblique: '#e6e3d9',
    },
    aperture: 11,
    // The ring a defocused phase object grows — see uPhase in optics.jsx. This
    // is transmitted light, where almost everything on the slide is a phase
    // object, so it belongs to the objective rather than to any one specimen.
    phase: 0.26,
    maxBlur: 0.015,
    aberration: 0.0024,
    // Veiling glare and field falloff, both pulled back.
    //
    // They were set when this view was standing in for a microscope with a
    // painted look rather than modelling one, and they are the two terms that
    // cost the most contrast for the least truth. Multi-coated modern optics
    // scatter a few per cent, not eight and a half; and a Köhler-illuminated
    // field on a modern objective is close to even across the frame, because
    // making it so is the entire point of Köhler illumination. What was left was
    // a soft, slightly dim picture with the corners falling away — an old lens's
    // faults borrowed as atmosphere, sitting on top of an optical model that had
    // become accurate enough not to need them.
    glare: 0.05,
    // The instrument's contrast ceiling. See uVeil in optics.jsx: a few per cent
    // of the field, arriving everywhere, which is what keeps two overlapping
    // cells a very dark green instead of a colour with a channel of zero in it.
    // The colour is the field's own, because that is what is being scattered.
    veil: 0.032,
    veilColor: '#e6e3d9',
    vignette: 0.2,
    grain: 0.03,
    saturation: 0.9,
    lift: 0,
    tint: '#fdfffd',
  },
}

export const TOMOGRAM = {
  id: 'tomogram',
  label: 'Reconstruction',
  field: 'dark',
  fov: 36,
  // And this one does turn, for the same reason the other does not. A
  // reconstruction is not an image taken through a lens along one axis — it is a
  // volume, assembled, and turning it over is how such a thing is read. The
  // distinction is the whole argument of this file: two scales, two instruments,
  // and the interaction belongs to the instrument as much as the optics do.
  orbit: true,
  ratios: { near: 1 / 461, far: 4.878, minDistance: 1 / 84, maxDistance: 2.168 },
  // Depth cueing does most of the work of telling front from back in a cutaway
  // this crowded, so the fog starts nearer than the camera sits.
  fog: [0.694, 1.382],
  optics: {
    aperture: 1.7,
    // A little under a cell's own radius. With the aperture at 1.7 and the blur
    // capped at 11.7 px, that holds about ±180 nm within a pixel of focus, so a
    // whorl of lamellae is inspected as a body rather than as one sharp membrane
    // between two smeared ones. Micrometres away still dissolves: this floors
    // the near field, it does not switch the depth of field off.
    depthFloor: 3500,
    maxBlur: 0.013,
    aberration: 0.0016,
    glare: 0.09,
    vignette: 0.44,
    grain: 0.026,
    saturation: 1.02,
    lift: 0.008,
    // The crevice darkening carries the form. It is the only term in the pass
    // that knows a lamella has a neighbour 56 nm behind it.
    ao: 0.95,
    aoRadius: 0.0052,
    aoFalloff: 0.0042,
    tint: '#ffffff',
  },
}

// Where the camera has to sit for a field of view of a given width to fill the
// frame — which is the number a microscope actually gives you. An objective is
// described by how much of the slide you can see through it, not by how far the
// lens is from the coverslip, and deriving the one from the other is what lets a
// 5 µm coccoid and a 500 µm trichome be looked at through the same instrument
// without either of them carrying a hand-tuned camera position.
//
// This replaced a hand-set distance of 620 for the trichome. At the same field
// it lands within a third of a per cent of it — the numbers were consistent, they
// just were not derived.
export function workingDistance(fieldAcross, fov) {
  return fieldAcross / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2))
}

// The stage: everything about looking at one specimen of a given size through
// one objective. `field` is how much of the slide is in frame, in the scene's
// own units, and `dir` is the direction the camera sits in.
//
// Every other distance here is a multiple of that field rather than a constant,
// so a specimen an order of magnitude smaller does not need its clipping planes,
// its zoom limits or its fine-focus travel re-tuned by hand. Those multiples are
// the ratios the Spirulina view was already using once its own numbers were
// divided through.
export function stage(objective, { field, depth, dir, unit, label, illumination }) {
  const distance = workingDistance(field, objective.fov)
  const r = objective.ratios
  const position = new THREE.Vector3(...dir).normalize().multiplyScalar(distance).toArray()
  return {
    label,
    unit,
    field: objective.field,
    camera: {
      position,
      fov: objective.fov,
      near: distance * r.near,
      far: distance * r.far,
    },
    controls: {
      minDistance: distance * r.minDistance,
      maxDistance: distance * r.maxDistance,
      // Spread straight onto OrbitControls; see `orbit` on each objective.
      enableRotate: objective.orbit !== false,
    },
    home: { target: [0, 0, 0], dir: position, distance },
    fineFocus: objective.fineFocus && {
      range: (depth ?? field * 0.5) * objective.fineFocus.range,
      step: (depth ?? field * 0.5) * objective.fineFocus.step,
    },
    fog: objective.fog && [distance * objective.fog[0], distance * objective.fog[1]],
    // The specimen may have brought its own condenser filter. Everything else
    // here is the lens's and is not negotiable; this one is a piece of glass
    // somebody slid in, and the veil — which is field light scattered inside the
    // objective — has to take the field's colour with it.
    optics: illumination
      ? { ...objective.optics, illumination, veilColor: illumination.direct }
      : objective.optics,
  }
}
