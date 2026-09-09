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

export const BRIGHTFIELD = {
  id: 'brightfield',
  label: 'Transmitted light',
  field: 'bright',
  fov: 40,
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
  // the specimen, so the travel has to cover the specimen's depth — which scales
  // with it. Only this objective has one: a reconstruction has no stage to rack.
  fineFocus: { range: 1 / 7.5, step: 1 / 900 },
  // A high-aperture objective has a focal plane a couple of micrometres thick.
  // Over a specimen tens of micrometres deep that leaves most of it dissolved,
  // which is what an objective does — and why `fineFocus` exists rather than
  // this number being smaller. See the fine focus in App.
  optics: {
    aperture: 11,
    // The ring a defocused phase object grows — see uPhase in optics.jsx. This
    // is transmitted light, where almost everything on the slide is a phase
    // object, so it belongs to the objective rather than to any one specimen.
    phase: 0.26,
    maxBlur: 0.015,
    aberration: 0.0024,
    glare: 0.085,
    vignette: 0.34,
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
export function stage(objective, { field, dir, unit, label }) {
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
    },
    home: { target: [0, 0, 0], dir: position, distance },
    fineFocus: objective.fineFocus && {
      range: field * objective.fineFocus.range,
      step: field * objective.fineFocus.step,
    },
    fog: objective.fog && [distance * objective.fog[0], distance * objective.fog[1]],
    optics: objective.optics,
  }
}
