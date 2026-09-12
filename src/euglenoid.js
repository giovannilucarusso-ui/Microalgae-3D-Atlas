// What is on the slide when the organism is a euglenoid — and nothing about how
// it is drawn.
//
// The sibling of coccoid.js, and the differences between the two files are the
// biology rather than the code. A coccoid culture settles onto the glass and can
// be read as a layer; a euglenoid *swims*, so it is spread through the whole
// coverslip gap and most of it is out of focus at any one setting. A coccoid is
// a sphere and its one free parameter is a diameter; a euglenoid is a spindle
// with a front and a back, and its width is not a number but a range it travels
// through while you watch.
//
// That last point is the one that shapes this file. Euglena gracilis is
// described as "35–55 by 6–25 µm", and the width range is not sloppy reporting
// of a variable population: it is one cell, at different moments of metaboly.
// So a cell here carries a *phase*, not a width, and the width falls out of it.
//
// And a cell here carries a *velocity*, which no other specimen in the atlas
// does. Everything about where a Euglena is at a given moment is a function of
// time — it swims forward, it rolls about its own long axis while it goes, and
// the front end traces a small circle round the line of travel — so what this
// file places is where each cell *starts* and how it moves, and the renderer
// works out the rest on the GPU.
import * as THREE from 'three'
import { seededRandom } from './science.js'

// What the objective can resolve, in micrometres. The same Abbe figure as the
// coccoid field, because it is the same objective — see RESOLUTION_UM there.
export const RESOLUTION_UM = 0.22

// The block of culture the renderer tiles, in micrometres across and down.
//
// A swimming population cannot be drawn inside the frame and nowhere else: the
// cells leave it. So the population fills a block wider than the widest view
// the objective zooms out to, and the renderer wraps each cell round that block
// *centred on the stage* — a cell leaving on one side comes back on the other,
// out of sight, and moving the stage moves the block with it. The culture then
// has no edge to find, which a drop under a coverslip does not either.
function tileOf(form) {
  return form.tileUm ?? [form.fieldUm * 6, form.fieldUm * 2.8]
}

// How many cells the drawn block holds, from a stated culture density. Same
// contract as the coccoid field: a count that follows from a quantity with
// units can be checked against a haemocytometer, and a count picked because it
// looked right cannot be wrong.
function populationSize(form) {
  const [across, down] = tileOf(form)
  const volumeUm3 = across * down * (form.depthUm ?? form.fieldUm * 0.4)
  return Math.max(3, Math.round(volumeUm3 * form.cellsPerMl * 1e-12))
}

// Which way a cell points.
//
// Not uniformly over the sphere, which is what the first version did and which
// the reference footage rules out: in a crowded wet mount almost no Euglena is
// seen end-on. Swimmers near a surface turn to swim along it — a wall traps a
// pusher-type swimmer hydrodynamically — and a drop under a coverslip is all
// surface. So the heading is uniform in the plane of the slide and the tilt out
// of it is small, mostly within twenty degrees, with a tail that lets the odd
// cell dive steeply enough to read short.
function orientation(rnd, form) {
  const heading = rnd() * Math.PI * 2
  const spread = form.tiltSpread ?? 0.22
  // A Laplace-shaped tilt: most cells nearly flat, a few steep.
  const s = rnd() * 2 - 1
  const tilt = Math.sign(s) * Math.min(1.2, -Math.log(1 - Math.abs(s) * 0.98) * spread)
  const axis = new THREE.Vector3(Math.cos(heading) * Math.cos(tilt), Math.sin(heading) * Math.cos(tilt), Math.sin(tilt))
  // The long axis is the cell's local +Y. The roll about it is arbitrary, and
  // the swim spins it anyway.
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis)
  const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2)
  return q.multiply(roll)
}

// Somewhere in the drawn block.
//
// Evenly through the depth, which is the opposite of the coccoid field and is
// the biology rather than a simplification: Euglena swims, and is not noticeably
// denser than its medium, so it does not sediment onto the glass the way a
// Chlorella does. A minority is drawn near the coverslip anyway — cells do
// accumulate against a surface — but most of this population is in suspension,
// and that is why so much of the field is a soft green haze at any one setting.
function scatter(rnd, form) {
  const [across, down] = tileOf(form)
  const depth = (form.depthUm ?? form.fieldUm * 0.4) * 0.5
  const settled = form.settling?.settled ?? 0
  const layer = (form.settling?.layerUm ?? 6) * 0.5
  return () => [
    (rnd() - 0.5) * across,
    (rnd() - 0.5) * down,
    rnd() < settled ? depth - layer * rnd() : (rnd() * 2 - 1) * depth,
  ]
}

const lerp = (range, t) => range[0] + (range[1] - range[0]) * t

// One cell.
//
// Its organelles are placed as fractions of the body — along the axis as u, from
// -1 at the tip of the tail to +1 at the front, and across it as a fraction of
// the local radius — so they stay inside the cell whatever posture metaboly has
// it in at the moment.
export function makeEuglena(rnd, form, spot) {
  const range = form.cell
  const length = range.lengthUm[0] + (range.lengthUm[1] - range.lengthUm[0]) * Math.pow(rnd(), range.skew ?? 1)
  // The *resting* width. What is actually drawn travels around it — see the
  // metaboly phase below and the radius profile in the renderer.
  const width = lerp(range.widthUm, rnd())
  const swim = form.swimming ?? {}

  // Two kinds of cell, and a plate shows both. Most are swimming: straight
  // spindles going somewhere, with only a ripple of metaboly. A minority have
  // stopped and are working — barely moving, and bulging and narrowing as the
  // pellicle strips slide. A field in which every cell did both at once would
  // be a field of something other than Euglena.
  const working = rnd() < (swim.workingFraction ?? 0.18)
  const speed = working ? lerp(swim.workingUmPerS ?? [0, 6], rnd()) : lerp(swim.umPerS ?? [45, 95], rnd())

  // The stigma sits at the anterior, beside the reservoir — so at +u, off the
  // axis. It is the one part of this organism that is not green.
  const side = rnd() * Math.PI * 2
  return {
    x: spot[0],
    y: spot[1],
    z: spot[2],
    halfLength: length * 0.5,
    halfWidth: width * 0.5,
    q: orientation(rnd, form),
    // Where this cell is in its own metaboly cycle, and how fast it runs. Each
    // cell has its own: a field of euglenoids pulsing in unison would be the
    // one thing that says at a glance this is a simulation.
    phase: rnd() * Math.PI * 2,
    rate: 0.55 + rnd() * 0.75,
    metaboly: working ? 0.65 + rnd() * 0.35 : rnd() * 0.18,
    density: 0.8 + rnd() * 0.4,
    swim: {
      speed,
      // Rolling about the long axis while swimming: once or twice a second in
      // this species, which is what sweeps the photoreceptor through the light.
      spin: (rnd() < 0.5 ? -1 : 1) * lerp(swim.spinHz ?? [1, 2], rnd()) * Math.PI * 2 * (working ? 0.1 : 1),
      // The front end circles the line of travel, so the cell wobbles.
      wobble: working ? 0.02 : lerp(swim.wobbleRad ?? [0.06, 0.16], rnd()),
      // And the line of travel itself bends, slowly, so a track is an arc
      // rather than a ruled line.
      turn: (rnd() * 2 - 1) * (swim.turnRadPerS ?? 0.22),
      roll: rnd() * Math.PI * 2,
    },
    stigma: {
      x: Math.cos(side) * 0.55,
      u: 0.76 + rnd() * 0.08,
      z: Math.sin(side) * 0.55,
      r: (form.stigmaUm ?? 2.6) * 0.5 * (0.85 + rnd() * 0.3),
    },
    // Central to slightly posterior, and large: several micrometres across.
    nucleus: {
      x: (rnd() * 2 - 1) * 0.15,
      u: -0.08 - rnd() * 0.18,
      z: (rnd() * 2 - 1) * 0.15,
      r: (form.nucleusUm ?? 7) * 0.5 * (0.85 + rnd() * 0.3),
    },
    // Paramylon: commonly two large grains flanking the nucleus, one ahead of
    // it and one behind. Rod-like, and lying roughly along the cell; which side
    // of the axis each sits on is left to the renderer, from the seed.
    grains: [0, 1].map((i) => ({
      u: (i === 0 ? 1 : -1) * (0.22 + rnd() * 0.18),
      r: i < Math.round(lerp(form.paramylon?.major ?? [1, 2], rnd())) ? lerp(form.paramylon?.majorUm ?? [4, 8], rnd()) * 0.5 : 0,
    })),
    flagellum: lerp(form.flagellum?.lengthFrac ?? [0.45, 0.9], rnd()),
    // Where in the texture space this cell's plastids and granules sit, so no
    // two cells share a pattern.
    seed: rnd() * 97,
  }
}

export function buildEuglena(form) {
  const rnd = seededRandom(form.seed ?? 4471)
  const target = populationSize(form)
  const anywhere = scatter(rnd, form)
  const cells = []

  const clumped = Math.round(target * (form.clumping?.fraction ?? 0))
  const perClump = form.clumping?.size ?? [2, 4]
  for (let knots = 0; cells.length < clumped && knots < 4000; knots++) {
    const [cx, cy, cz] = anywhere()
    const want = Math.min(clumped - cells.length, Math.round(lerp(perClump, rnd())))
    for (let k = 0; k < want; k++) {
      // Loosely. Euglena does not stick to itself — what gathers it is
      // phototaxis and the edge of the coverslip — so a group is a crowd rather
      // than a clump, and the members may overlap in projection because two
      // swimmers at different depths do.
      const reach = form.cell.lengthUm[1] * (0.35 + rnd() * 0.7)
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(1 - 2 * rnd())
      cells.push(
        makeEuglena(rnd, form, [
          cx + reach * Math.sin(ph) * Math.cos(th),
          cy + reach * Math.sin(ph) * Math.sin(th),
          cz + reach * Math.cos(ph) * 0.3,
        ]),
      )
    }
  }
  while (cells.length < target) cells.push(makeEuglena(rnd, form, anywhere()))

  const depth = (form.depthUm ?? form.fieldUm * 0.4) * 0.5
  for (const cell of cells) cell.z = Math.max(-depth, Math.min(depth, cell.z))

  return { cells, tile: tileOf(form), depth }
}
