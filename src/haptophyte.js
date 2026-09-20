// What is on the slide when the organism is a scaly haptophyte flagellate — the
// motile stage of Braarudosphaera — and nothing about how it is drawn.
//
// The sibling of euglenoid.js and coccoid.js, and it differs from both in the
// two ways the organism does.
//
// **A cell is not a solid of revolution.** The motile stage is described as
// dorsoventrally compressed, so its cross-section is an ellipse, and as the cell
// revolves about its long axis — which it does, slowly, as it swims — its
// outline widens and narrows and the seam between its two plastids swings
// round with it. The body is still a closed-form thing to integrate: the chord
// of an ellipse is the chord of a circle, rescaled. See `section` in
// HaptophyteField.jsx.
//
// **There are very few of them.** A Braarudosphaera culture in exponential
// growth runs at about 10⁵ cells per millilitre (r56), two to three orders of
// magnitude under the other specimens in this atlas, and at this magnification
// that is a cell in one field of view out of several dozen. So this is not a
// culture drawn from a density and left to be found. It is what an operator
// actually does with a slide like that: search it, find one, and centre it —
// the reference footage (Zehr Lab, UC Santa Cruz) is exactly that, a single
// cell holding station in an otherwise empty field. That one cell is placed by
// hand at the middle of the stage and says so; anything else in the drop still
// comes out of the density, and at this density it is usually nothing.
//
// Every size here that could be derived from a measurement is. The cell's
// proportions are measured off the reference footage; its absolute size is set
// so its volume is the one the FIB-SEM reconstructions give (r56); the
// nitroplast's radius is not a number anyone typed but the sphere holding the
// measured 10.2 % of that volume, and the plastids' thickness is whatever makes
// the two of them the measured 35 %. check-atlas.mjs holds all of that to the
// literature, so a change to the shape that silently changed the anatomy fails
// there with a sentence.
import * as THREE from 'three'
import { seededRandom } from './science.js'

// What the objective can resolve, in micrometres. The same figure as the other
// fields, because it is the same objective.
export const RESOLUTION_UM = 0.22

// ── The outline ────────────────────────────────────────────────────────────
//
// Measured off the reference footage as the width of the cell's silhouette at
// thirty-odd stations along its axis, on two frames, and fitted. `s` runs from
// the anterior tip, where the flagella arise, at 0 to the posterior tip at 1;
// the value is the half-width as a fraction of the largest.
//
// What the measurement said, and each constant is one sentence of it. The
// anterior end is *truncated*: the silhouette is already about half its full
// width a few per cent in from the tip, where a spindle would be a point — that
// is where the flagellar apparatus sits. From there it widens almost linearly
// to its widest at 62 % of the length, which is where the nitroplast lies, and
// then closes to a point over the last third. Pyriform, reversed: blunt in
// front, drawn to a point behind.
export const OUTLINE = {
  widest: 0.62,
  front: 0.52, // how much narrower the truncated front is than the widest point
  frontPower: 1.05,
  rimLength: 0.045, // over how much of the length the front rounds off
  back: 1.6, // exponent of the posterior taper
}

export function outlineAt(s) {
  const o = OUTLINE
  let r
  if (s <= o.widest) {
    const x = (o.widest - s) / o.widest
    r = 1 - o.front * Math.pow(Math.max(x, 0), o.frontPower)
    const k = Math.min(Math.max(s / o.rimLength, 0), 1)
    r *= Math.sqrt(Math.max(0, 1 - (1 - k) * (1 - k)))
  } else {
    const x = Math.min((s - o.widest) / (1 - o.widest), 1)
    r = Math.sqrt(Math.max(0, 1 - Math.pow(x, o.back)))
  }
  return r
}

// The same function in GLSL, from the same constants, so the renderer and the
// volumes below cannot drift apart. u is the renderer's axial coordinate, +1 at
// the anterior tip and −1 at the posterior; s = (1 − u) / 2.
export const OUTLINE_GLSL = /* glsl */ `
  float outline(float u) {
    float s = 0.5 * (1.0 - u);
    float r;
    if (s <= ${OUTLINE.widest.toFixed(4)}) {
      float x = (${OUTLINE.widest.toFixed(4)} - s) / ${OUTLINE.widest.toFixed(4)};
      r = 1.0 - ${OUTLINE.front.toFixed(4)} * pow(max(x, 1e-6), ${OUTLINE.frontPower.toFixed(4)});
      float k = clamp(s / ${OUTLINE.rimLength.toFixed(4)}, 0.0, 1.0);
      r *= sqrt(max(0.0, 1.0 - (1.0 - k) * (1.0 - k)));
    } else {
      float x = clamp((s - ${OUTLINE.widest.toFixed(4)}) / ${(1 - OUTLINE.widest).toFixed(4)}, 0.0, 1.0);
      r = sqrt(max(0.0, 1.0 - pow(max(x, 1e-6), ${OUTLINE.back.toFixed(4)})));
    }
    return r;
  }
`

// ── Volumes ────────────────────────────────────────────────────────────────
//
// Everything below is the cell as drawn: a body whose cross-section at each
// station is an ellipse of semi-axes a (across the flattened face) and b = k·a
// (through it), with a = outline(s)·width/2.

const STATIONS = 400

// ∫ outline(s)² ds, the shape factor of the body's volume.
function shapeIntegral() {
  let sum = 0
  for (let i = 0; i < STATIONS; i++) {
    const s = (i + 0.5) / STATIONS
    sum += outlineAt(s) ** 2
  }
  return sum / STATIONS
}
const SHAPE = shapeIntegral()

export function cellVolume(lengthUm, widthUm, flattening) {
  const a = widthUm / 2
  return Math.PI * a * (a * flattening) * lengthUm * SHAPE
}

// The length at which a cell of the drawn proportions has a given volume.
export function lengthForVolume(volumeUm3, widthRatio, flattening) {
  return Math.cbrt(volumeUm3 / (Math.PI * (widthRatio / 2) ** 2 * flattening * SHAPE))
}

// The plastids: two, lining the lateral walls — the narrow sides of a
// compressed cell — from `fromS` to the posterior tip. Each is the part of the
// elliptical annulus of thickness t lying within ±span of its side. Where the
// cell is thinner than the plastid, the plastid is the whole of that sector.
export function plastidVolume(lengthUm, widthUm, flattening, t, fromS, span) {
  const share = (2 * span) / Math.PI // both sectors, as a fraction of the turn
  let sum = 0
  for (let i = 0; i < STATIONS; i++) {
    const s = (i + 0.5) / STATIONS
    if (s < fromS) continue
    const a = (outlineAt(s) * widthUm) / 2
    const b = a * flattening
    const inner = Math.max(a - t, 0) * Math.max(b - t, 0)
    sum += share * Math.PI * (a * b - inner)
  }
  return (sum * lengthUm) / STATIONS
}

// The wall thickness that makes the two plastids a given share of the cell.
export function plastidThicknessFor(share, lengthUm, widthUm, flattening, fromS, span) {
  const target = share * cellVolume(lengthUm, widthUm, flattening)
  let lo = 0
  let hi = widthUm / 2
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    if (plastidVolume(lengthUm, widthUm, flattening, mid, fromS, span) < target) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

// The radius of a sphere holding a given share of the cell.
export function sphereForShare(share, volumeUm3) {
  return Math.cbrt((share * volumeUm3 * 3) / (4 * Math.PI))
}

// Everything about one cell that follows from its length and the record.
export function anatomyOf(form, lengthUm) {
  const c = form.cell
  const widthUm = lengthUm * c.widthRatio
  const volume = cellVolume(lengthUm, widthUm, c.flattening)
  const p = form.plastids
  return {
    lengthUm,
    widthUm,
    volume,
    plastidUm: plastidThicknessFor(p.volumeShare, lengthUm, widthUm, c.flattening, p.fromS, p.span),
    nitroplastUm: sphereForShare(form.nitroplast.volumeShare, volume),
    nucleusUm: sphereForShare(form.nucleus.volumeShare, volume),
  }
}

// ── The slide ──────────────────────────────────────────────────────────────

const lerp = (range, t) => range[0] + (range[1] - range[0]) * t

// The drop the density is counted over: wider than any view the objective
// zooms out to, as in the euglenoid field.
function tileOf(form) {
  return form.tileUm ?? [form.fieldUm * 6, form.fieldUm * 3]
}

// How many *other* cells the drop holds, from the stated density — rounded, so
// at a density this low it is usually none.
function othersIn(form) {
  const [across, down] = tileOf(form)
  const volumeUm3 = across * down * form.depthUm
  return Math.round(volumeUm3 * form.cellsPerMl * 1e-12)
}

function makeCell(rnd, form, spot, tracked) {
  const c = form.cell
  // The drawn lengths are a range around the length whose volume is the
  // measured mean, not the literature's full range — see `cell` on the record.
  const mean = lengthForVolume(form.cell.volumeUm3, c.widthRatio, c.flattening)
  const lengthUm = mean * lerp(c.lengthSpread, rnd())
  const anatomy = anatomyOf(form, lengthUm)
  const swim = form.swimming
  const pick = (range) => lerp(range, rnd())

  // The appendages, in the cell's own frame: x across the flattened face, y
  // along the axis towards the anterior, z through the cell. All of them
  // arise at the front except the posterior spines and the projection.
  const flagella = [1, -1].map((side) => ({
    side,
    lengthUm: pick(form.flagella.lengthUm),
    // Which way out of the flattened plane this one's beat plane is tipped:
    // the two do not beat in one plane, which is why in the footage one
    // reads crisply while the other comes and goes.
    tip: side * pick([0.08, 0.3]) + (rnd() - 0.5) * 0.2,
    phase: rnd() * Math.PI * 2,
    bend: pick(form.flagella.bendRad),
  }))
  const nFront = Math.round(pick(form.spines.anterior))
  const nBack = Math.round(pick(form.spines.posterior))
  const spines = []
  for (let i = 0; i < nFront + nBack; i++) {
    const front = i < nFront
    const az = rnd() * Math.PI * 2
    const splay = front ? pick([0.02, 0.09]) : pick([0.12, 0.34])
    spines.push({
      front,
      lengthUm: pick(form.spines.lengthUm),
      dir: [Math.sin(splay) * Math.cos(az), front ? Math.cos(splay) : -Math.cos(splay), Math.sin(splay) * Math.sin(az)],
      // Where on the end of the cell its base sits, as a fraction of the
      // local half-width.
      at: [(rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5],
    })
  }

  // The centred cell starts in the pose the footage opens on — lying along the
  // frame, front to the left, broad face up — and moves on from there by
  // itself. Anything else in the drop starts anywhere.
  const start = tracked ? form.startPose : null
  const heading = rnd() * Math.PI * 2
  const roll = rnd() * Math.PI * 2
  return {
    tracked,
    home: spot,
    heading: start?.headingRad ?? heading,
    tilt: start ? 0 : (rnd() - 0.5) * 0.3,
    roll: start?.rollRad ?? roll,
    // Revolving about its own axis, slowly — the one thing the original
    // description says about how it moves — and in either sense.
    spin: (rnd() < 0.5 ? -1 : 1) * pick(swim.spinHz) * Math.PI * 2,
    // Holding station: the footage's cell drifts about a micrometre a second
    // against the debris and turns now and then, so its centre wanders on
    // two slow incommensurate sines and its heading on two more. Up and down
    // it hardly wanders at all, and that is read off the footage too: every
    // fringe on the cell keeps its sign for the whole clip, and a cell rising
    // or sinking through a micrometre would have flipped them all — which the
    // first version here did, every few seconds.
    wander: [pick(swim.wanderUm), pick(swim.wanderUm), pick([0.15, 0.35])],
    rates: [pick([0.07, 0.13]), pick([0.05, 0.11]), pick([0.12, 0.24]), pick([0.3, 0.55])],
    phases: [0, 1, 2, 3].map(() => rnd() * Math.PI * 2),
    turn: [pick(swim.turnRad), pick([0.1, 0.25])],
    beatHz: pick(form.flagella.beatHz),
    anatomy,
    flagella,
    haptonema: { lengthUm: pick(form.haptonema.lengthUm), phase: rnd() * Math.PI * 2 },
    spines,
    projection: form.projection,
    // Bodies inside, as positions in the cell's frame (x and z as fractions of
    // the local semi-axes, u along the axis, +1 anterior) and radii in µm.
    nitroplast: { x: 0, u: form.nitroplast.u, z: (rnd() - 0.5) * 0.1, r: anatomy.nitroplastUm },
    nucleus: { x: (rnd() - 0.5) * 0.15, u: form.nucleus.u, z: (rnd() - 0.5) * 0.15, r: anatomy.nucleusUm },
    droplets: form.droplets.at.map((u) => ({
      x: (rnd() < 0.5 ? -1 : 1) * pick([0.35, 0.6]),
      u: u + (rnd() - 0.5) * 0.06,
      z: (rnd() - 0.5) * 0.5,
      r: pick(form.droplets.radiusUm),
    })),
    density: 0.92 + rnd() * 0.16,
  }
}

export function buildHaptophytes(form) {
  const rnd = seededRandom(form.seed ?? 5021)
  const [across, down] = tileOf(form)
  const depth = form.depthUm * 0.5
  // The cell the operator has centred — a little beyond the plane they have
  // focused on, as in the reference footage. A transparent cell exactly in
  // focus all but vanishes; a micrometre off, every margin grows the bright
  // line inside and the dark one outside that the footage shows on the body,
  // the spines and the nitroplast alike, and all with the same sign. That is
  // how microscopists look at unstained cells, and the fine focus racks it.
  const cells = [makeCell(rnd, form, [0, 0, -(form.focusOffsetUm ?? 0)], true)]
  // And whatever else the drop holds.
  const others = othersIn(form)
  for (let i = 0; i < others; i++) {
    cells.push(
      makeCell(rnd, form, [(rnd() - 0.5) * across, (rnd() - 0.5) * down, (rnd() * 2 - 1) * depth], false),
    )
  }
  return { cells, tile: tileOf(form), depth, others }
}

// ── Where a cell is, and which way it faces, at time t ─────────────────────
//
// Computed on the CPU, per cell per frame: there are one or two cells, and the
// appendages need the same pose the body is drawn with.
const Z = new THREE.Vector3(0, 0, 1)

export function poseAt(cell, t, out) {
  const [ra, rb, rc, rd] = cell.rates
  const [pa, pb, pc, pd] = cell.phases
  const [wx, wy, wz] = cell.wander
  // Every excursion is measured from where it stands at t = 0, so a cell
  // starts exactly at its home and heading — which for the centred one is
  // the footage's opening pose — and wanders off from there.
  const swing = (amp, rate, phase) => amp * (Math.sin(rate * t + phase) - Math.sin(phase))
  out.centre.set(
    cell.home[0] + swing(wx, ra, pa),
    cell.home[1] + swing(wy, rb, pb),
    cell.home[2] + swing(wz, rc, pc),
  )
  const heading = cell.heading + swing(cell.turn[0], rc, pd) + swing(cell.turn[1], rd, pa)
  const tilt = cell.tilt + swing(0.08, rd, pc)
  // The long axis, nearly in the plane of the slide.
  out.axis.set(Math.cos(heading) * Math.cos(tilt), Math.sin(heading) * Math.cos(tilt), Math.sin(tilt))
  // A reference across it, then the roll.
  const ref = new THREE.Vector3().crossVectors(Z, out.axis)
  if (ref.lengthSq() < 1e-6) ref.set(1, 0, 0)
  ref.normalize()
  const up = new THREE.Vector3().crossVectors(out.axis, ref)
  const roll = cell.roll + cell.spin * t
  out.side.copy(ref).multiplyScalar(Math.cos(roll)).addScaledVector(up, Math.sin(roll))
  out.over.crossVectors(out.axis, out.side)
  return out
}

export function newPose() {
  return {
    centre: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    side: new THREE.Vector3(),
    over: new THREE.Vector3(),
  }
}

// ── The appendages at time t, as polylines in the cell's frame ─────────────
//
// Each is a list of [x, y, z, radius] in micrometres, x across the flattened
// face, y along the axis (anterior +), z through the cell.

function halfWidthAt(cell, u) {
  return (outlineAt(0.5 * (1 - u)) * cell.anatomy.widthUm) / 2
}

// A curve grown from a base along a direction angle that bends as it goes:
// θ(s) is measured from +y towards `lateral`, and the path integrates
// (cos θ, sin θ) in that plane.
function grow(base, lateral, segments, length, angle, radius) {
  const pts = []
  let x = base[0]
  let y = base[1]
  let z = base[2]
  const ds = length / segments
  for (let i = 0; i <= segments; i++) {
    const s = i / segments
    pts.push([x, y, z, radius(s)])
    const th = angle(s)
    const c = Math.cos(th)
    const sn = Math.sin(th)
    x += (lateral[0] * sn) * ds
    y += c * ds
    z += (lateral[2] * sn) * ds
  }
  return pts
}

export function appendagesAt(cell, t, form) {
  const L = cell.anatomy.lengthUm / 2
  const front = L
  const apex = halfWidthAt(cell, 0.97)
  const out = []

  // The flagella. Two of equal length from the front of the cell, beating
  // homodynamically: a bend that carries the flagellum out and back along
  // the body, with a wave travelling from base to tip on top of it.
  for (const f of cell.flagella) {
    const lateral = [f.side * Math.cos(f.tip), 0, Math.sin(f.tip)]
    const base = [f.side * apex * 0.35, front - 0.15, 0]
    const wave = form.flagella.waveUm
    const amp = form.flagella.amplitudeRad
    const beat = cell.beatHz * Math.PI * 2
    const pts = grow(
      base,
      lateral,
      36,
      f.lengthUm,
      // Out sideways from the front, then round and back along the body —
      // the footage's two curves, one arcing above the cell and one looping
      // under it — with the wave riding on the bend.
      (s) =>
        1.05 +
        f.bend * Math.pow(s, 0.85) +
        amp * Math.sqrt(s) * Math.sin((2 * Math.PI * s * f.lengthUm) / wave - beat * t + f.phase),
      (s) => form.flagella.radiusUm * (s > 0.9 ? Math.max(0.35, 1 - (s - 0.9) * 6.5) : 1),
    )
    out.push({ kind: 'flagellum', points: pts })
  }

  // The haptonema: short, straight ahead between the flagella, swollen at the
  // base, flexing a little but — in this genus — never seen to coil.
  {
    const h = cell.haptonema
    const lean = 0.12 * Math.sin(t * 0.9 + h.phase)
    const pts = grow(
      [0, front - 0.1, 0.05],
      [1, 0, 0],
      10,
      h.lengthUm,
      (s) => lean * s,
      (s) => {
        const swell = form.haptonema.swellingUm
        const r = form.haptonema.radiusUm
        return r + (swell - r) * Math.exp(-(((s - 0.12) / 0.1) ** 2))
      },
    )
    out.push({ kind: 'haptonema', points: pts })
  }

  // The spine-scales: rigid, straight, a spoon-shaped base on the cell's
  // surface and a shaft running out from the end of the cell.
  for (const sp of cell.spines) {
    const u = sp.front ? 0.97 : -0.97
    const hw = halfWidthAt(cell, u)
    const base = [sp.at[0] * hw, sp.front ? front - 0.2 : -L + 0.2, sp.at[1] * hw * form.cell.flattening]
    const n = 6
    const pts = []
    for (let i = 0; i <= n; i++) {
      const s = i / n
      const d = sp.lengthUm * s
      const spoon = form.spines.baseUm
      const r = form.spines.radiusUm
      pts.push([
        base[0] + sp.dir[0] * d,
        base[1] + sp.dir[1] * d,
        base[2] + sp.dir[2] * d,
        s < 0.06 ? spoon : s > 0.94 ? r * 0.6 : r,
      ])
    }
    out.push({ kind: 'spine', points: pts })
  }

  // The projection at the posterior end: a small colourless knob on a neck.
  if (cell.projection) {
    const p = cell.projection
    const pts = []
    const n = 10
    for (let i = 0; i <= n; i++) {
      const s = i / n
      const r = s < 0.3 ? p.neckUm : p.neckUm + (p.knobUm - p.neckUm) * Math.sin(Math.PI * ((s - 0.3) / 0.7))
      pts.push([0, -L + 0.1 - p.lengthUm * s, 0, Math.max(r, 0.05)])
    }
    out.push({ kind: 'projection', points: pts })
  }

  return out
}
