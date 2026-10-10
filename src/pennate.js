// What is on the slide when the organism is Phaeodactylum tricornutum — and
// nothing about how it is drawn.
//
// The sibling of euglenoid.js and haptophyte.js. It differs from both in the
// three ways the organism does.
//
// **A cell is a spindle with two empty arms.** The fusiform cell of the strain
// drawn, Pt1 8.6, is a short central body holding the one plastid, drawn out at
// both ends into arms about a micrometre across that "contain vacuoles that
// occupy the extra volume arising from these morphologies" (r98, r99) and end
// in rounded tips. Measured on an open micrograph (r111) the arms keep nearly
// the same width all the way out, so the outline is not a lens but a body and
// two tubes, blended where they meet. `radiusAt` below is that outline, and the
// renderer runs the same function, generated from the same constants, so the
// volumes checked here are the volumes drawn.
//
// **Almost every cell is the same shape, and a few are not.** Under ordinary
// culture the strain is almost entirely fusiform (r100, r99), with the odd oval
// cell — the one form that builds a silica valve with a raphe, and the benthic
// one, attached to the glass (r99). Both are drawn by the same function: an oval
// is a body with no arms.
//
// **The cells hang in the water.** A healthy culture of this species does not
// sink: its sinking rate with nutrients to spare was measured at −0.06 ± 0.13
// metres a day (r104), and the large vacuoles of the arms are what make the
// fusiform cells lighter than the oval ones (r99). So in a fresh mount the
// fusiform cells are spread through the whole coverslip gap, most of them out of
// focus at any setting of the knob, which is what a photograph of a Pt1 culture
// shows (r112) — the opposite of Chlorella, which settles. The ovals lie on the
// slide.
//
// Every size here that can be tied to a measurement is: the cell's length to
// the strain's measured mean (r103), its volume to the FIB-SEM reconstructions
// of the same strain (r102), the plastid's and the nucleus's shares of that
// volume to the same reconstructions, the lipid droplets to their measured
// count and volume (r103). check-phaeodactylum.mjs holds the drawn population
// to all of them.
import * as THREE from 'three'
import { seededRandom } from './science.js'

// What the objective can resolve, in micrometres: the same figure as the other
// fields, because it is the same objective.
export const RESOLUTION_UM = 0.22

// ── The outline ────────────────────────────────────────────────────────────
//
// The radius of the cell at a distance x (µm) from its middle along its axis,
// for a shape { H, B, Rb, ra, rt }: half the length, half the length of the
// central body, the body's radius, and the arm's radius where it leaves the
// body and at its tip.
//
// The body is a parabolic spindle, widest at the middle and drawn out to a
// point at ±B; an arm is a tube that narrows a little towards its tip and
// closes there in a hemispherical cap of its own radius. The two are blended by
// a p-norm — (body³ + arm³)^⅓ — so the body tapers into the arm instead of
// ending at a step. An ellipse was tried first, and with it every cell was a
// lemon with two straws in it; the cells in the Nomarski plates of the species
// (r98) and the reconstructed cell (r102) narrow steadily from the middle
// outwards. An oval cell is the same function with no arm, and an ellipse.
export const SMOOTH_POWER = 3

export function radiusAt(x, s) {
  const ax = Math.abs(x)
  if (ax >= s.H) return 0
  const q = ax / s.B
  const body = ax < s.B ? s.Rb * (s.ra > 0 ? 1 - q * q : Math.sqrt(Math.max(0, 1 - q * q))) : 0
  let arm = 0
  if (s.ra > 0) {
    const r = s.ra + (s.rt - s.ra) * (ax / s.H)
    const capStart = s.H - s.rt
    const k = ax > capStart ? Math.sqrt(Math.max(0, 1 - ((ax - capStart) / s.rt) ** 2)) : 1
    arm = r * k
  }
  return Math.pow(body ** SMOOTH_POWER + arm ** SMOOTH_POWER, 1 / SMOOTH_POWER)
}

// The same function in GLSL. `shape` is (B, Rb, ra, rt) and H is passed apart.
export const RADIUS_GLSL = /* glsl */ `
  float radiusAt(float x, vec4 shape, float H) {
    float ax = abs(x);
    if (ax >= H) return 0.0;
    float B = shape.x;
    float Rb = shape.y;
    float ra = shape.z;
    float rt = shape.w;
    float q = ax / max(B, 1e-4);
    float body = ax < B ? Rb * (ra > 0.0 ? 1.0 - q * q : sqrt(max(0.0, 1.0 - q * q))) : 0.0;
    float arm = 0.0;
    if (ra > 0.0) {
      float r = ra + (rt - ra) * (ax / H);
      float capStart = H - rt;
      float e = (ax - capStart) / max(rt, 1e-4);
      arm = ax > capStart ? r * sqrt(max(0.0, 1.0 - e * e)) : r;
    }
    return pow(body * body * body + arm * arm * arm + 1e-12, 1.0 / 3.0);
  }
`

// ── Volumes ────────────────────────────────────────────────────────────────

const STATIONS = 600

// The volume of a body of revolution of the given outline, in µm³.
export function cellVolume(s) {
  let sum = 0
  const dx = (2 * s.H) / STATIONS
  for (let i = 0; i < STATIONS; i++) {
    const x = -s.H + (i + 0.5) * dx
    sum += radiusAt(x, s) ** 2
  }
  return Math.PI * sum * dx
}

// The plastid's own profile along the cell, as a fraction of its largest
// section: the body's own — parabolic in a fusiform cell, so that it tapers
// with the body towards the arms instead of standing proud of it, and
// elliptical in an oval one, so that it fills the cell to its rounded ends as
// the micrograph shows (r111) instead of narrowing to two points inside it.
// Pinched across the middle when the cell is about to divide.
const plastidShape = (q, p) => (p.round ? Math.sqrt(1 - q * q) : 1 - q * q)

export function plastidProfile(x, p) {
  const q = (x - p.u) / p.L
  if (Math.abs(q) >= 1) return 0
  const pinch = 1 - p.pinch * Math.exp(-((q / 0.16) ** 2))
  return plastidShape(q, p) * pinch
}

// The same without the pinch: what the plate's distance from the axis follows,
// so that a dividing plastid narrows at its waist without its two halves
// swinging in towards the axis there.
export function plastidBase(x, p) {
  const q = (x - p.u) / p.L
  return Math.abs(q) >= 1 ? 0 : plastidShape(q, p)
}

export function plastidVolume(p, H) {
  let sum = 0
  const dx = (2 * H) / STATIONS
  for (let i = 0; i < STATIONS; i++) {
    const x = -H + (i + 0.5) * dx
    sum += plastidProfile(x, p) ** 2
  }
  return Math.PI * p.a * p.b * sum * dx
}

// Whether the plastid stays inside the protoplast everywhere along the cell,
// with `margin` µm to spare. Its section at x is an ellipse of semi-axes a·f
// (along P1, the side it is pushed to) and b·f (along P2), its centre o·f out
// along P1, where f is its profile there: the plate lies against one side of
// the body and follows it in towards the axis at its two ends, as the plastid
// of the reconstructed cell does (r102), instead of standing off the wall at a
// fixed distance and cutting through it where the body narrows.
function plastidFits(p, s, wall, margin) {
  for (let i = 0; i <= 200; i++) {
    const x = -s.H + (i / 200) * 2 * s.H
    const f = plastidProfile(x, p)
    if (f <= 0) continue
    const room = radiusAt(x, s) - wall - margin
    // The farthest point of the offset ellipse from the axis, bounded by the
    // two extremes of its axes.
    const reach = Math.max(p.o * plastidBase(x, p) + p.a * f, p.b * f)
    if (reach > room) return false
  }
  return true
}

// ── One cell ───────────────────────────────────────────────────────────────

const lerp = (range, t) => range[0] + (range[1] - range[0]) * t

// A normal deviate, from two uniforms.
function gauss(rnd) {
  const u = Math.max(rnd(), 1e-9)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
}

// Which way a cell points: along the slide, with a small tilt out of it. A
// spindle twenty micrometres long in a gap thirty deep can stand at any angle in
// principle, but in a photograph of the culture almost every cell is seen at
// its full length (r112), so the tilt is small and Laplace-shaped, as for
// Euglena. The roll about the long axis is free, and it is what decides which
// side of the body the plastid is seen on.
//
// A cell lying flat can instead be given its roll: `plastidUp` turns it so that
// the side its plastid is pushed to faces the objective.
function orientation(rnd, spread, flat = false, plastidUp = false) {
  const heading = rnd() * Math.PI * 2
  const s = rnd() * 2 - 1
  const tilt = flat ? 0 : Math.sign(s) * Math.min(1.2, -Math.log(1 - Math.abs(s) * 0.98) * spread)
  const axis = new THREE.Vector3(Math.cos(heading) * Math.cos(tilt), Math.sin(heading) * Math.cos(tilt), Math.sin(tilt))
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis)
  // The roll about the long axis; for a flat cell, a quarter turn back takes
  // its P1 (local x) to +z.
  const free = rnd() * Math.PI * 2
  const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), plastidUp && flat ? -Math.PI / 2 : free)
  return { q: q.multiply(roll), heading }
}

// The plastid of a cell of shape `s`: pushed to one side of the body, a thick
// plate across the other axis, its length a share of the body's, and its third
// axis solved so that it holds `share` of the cell's volume. If that does not
// fit inside the protoplast it is shrunk until it does, and the share it ends
// with is the one recorded.
function makePlastid(rnd, s, form, volume, wall, pinch) {
  const P = form.plastid
  const share = lerp(P.volumeShare, rnd())
  const p = {
    u: (rnd() * 2 - 1) * 0.06 * s.B,
    L: lerp(P.lengthOfBody, rnd()) * s.B,
    a: P.thicknessOfBody * s.Rb,
    b: 0,
    o: P.offsetOfBody * s.Rb,
    pinch,
    // An oval cell is a body with no arms, and its plastid takes the body's
    // shape; see plastidProfile.
    round: !(s.ra > 0),
  }
  // Solve b for the share, by the profile's own integral.
  const unit = plastidVolume({ ...p, a: 1, b: 1 }, s.H)
  p.b = (share * volume) / (unit * p.a)
  const margin = 0.05
  for (let k = 0; k < 60 && !plastidFits(p, s, wall, margin); k++) {
    p.b *= 0.98
    p.a *= 0.99
    p.o *= 0.98
  }
  p.share = plastidVolume(p, s.H) / volume
  return p
}

// How many lipid droplets a cell can carry in the renderer, one attribute each.
export const DROPLET_SLOTS = 5

// The Poisson rate whose mean, once capped at `cap`, is `mean`.
export function cappedPoissonRate(mean, cap) {
  const cappedMean = (rate) => {
    let p = Math.exp(-rate)
    let sum = 0
    let below = 0
    for (let k = 0; k < cap; k++) {
      sum += k * p
      below += p
      p *= rate / (k + 1)
    }
    return sum + cap * (1 - below)
  }
  let lo = mean
  let hi = mean * 4 + 4
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (cappedMean(mid) < mean) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// A sphere inside the cell, as fractions: x and z of the local radius, u of the
// half-length. r in µm.
const body = (x, u, z, r) => ({ x, u, z, r })

// Where a droplet sits across the cell, as a fraction of the local radius along
// P1: in the body, as far to the side away from the plastid as it fits, between
// the plastid and the wall; in an arm, on the axis, where an arm is barely wider
// than a droplet. The renderer evaluates the same rule (DROPLET_GLSL), so a
// droplet is stored as a position along the cell and a radius, and nothing else.
export function dropletAcross(x, r, s, wall) {
  if (Math.abs(x) >= s.B) return 0
  const local = radiusAt(x, s) - wall
  return -Math.max(0, local - r - 0.05) / Math.max(local, 1e-6)
}

export const DROPLET_GLSL = /* glsl */ `
  float dropletAcross(float x, float r, vec4 shape, float H, float wall) {
    if (abs(x) >= shape.x) return 0.0;
    float local = radiusAt(x, shape, H) - wall;
    return -max(0.0, local - r - 0.05) / max(local, 1e-6);
  }
`

// A fusiform cell. `sister`, if given, is the outline of the daughter it lies
// beside: the two halves of one mother are near enough the same size, so it is
// drawn on hers, its body a little longer or shorter — before anything inside
// it is fitted, so that its plastid, nucleus and droplets are sized to the
// outline it ends with.
function makeFusiform(rnd, form, spot, pose, extras = {}, sister = null) {
  const C = form.cell
  const length = Math.min(C.lengthRangeUm[1], Math.max(C.lengthRangeUm[0], C.lengthUm + gauss(rnd) * C.lengthSdUm))
  const H = length / 2
  let s = {
    H,
    B: lerp(C.bodyOfLength, rnd()) * H,
    Rb: lerp(C.bodyWidthUm, rnd()) / 2,
    ra: lerp(C.armUm, rnd()) / 2,
    rt: 0,
  }
  s.rt = s.ra * lerp(C.tipOfArm, rnd())
  if (sister) s = { ...sister, B: sister.B * (0.96 + rnd() * 0.08) }
  const volume = cellVolume(s)
  const wall = form.wall.fusiformUm
  const dividing = extras.dividing ?? rnd() < form.division.plastidDividedShare
  const plastid = makePlastid(rnd, s, form, volume, wall, dividing ? form.division.pinch : 0)

  // The nucleus: its measured share of the volume, as a sphere, central and on
  // the side away from the plastid (r101, r102), as far out as it fits.
  const rn = Math.cbrt((3 * form.nucleus.volumeShare * volume) / (4 * Math.PI))
  const roomN = s.Rb - wall - rn - 0.05
  const nucleus = body(roomN > 0 ? -roomN / Math.max(s.Rb, 1e-6) : 0, 0, 0, rn)

  // Lipid droplets: their measured number and size in a culture with
  // nitrogen to spare (r103), some beside the plastid and some out in the arms
  // (r101). On the axis in an arm, where an arm is barely wider than a droplet.
  const droplets = []
  const L = form.droplets
  let n = 0
  {
    // Poisson, by inversion, at the rate whose mean once capped at the
    // renderer's DROPLET_SLOTS is the measured mean.
    const rate = cappedPoissonRate(L.meanCount, DROPLET_SLOTS)
    const target = rnd()
    let p = Math.exp(-rate)
    let cum = p
    while (cum < target && n < 12) {
      n++
      p *= rate / n
      cum += p
    }
  }
  n = Math.min(n, DROPLET_SLOTS)
  for (let i = 0; i < n; i++) {
    const v = L.volumeUm3 * Math.exp(gauss(rnd) * L.volumeSpread)
    let r = Math.cbrt((3 * v) / (4 * Math.PI))
    const inArm = rnd() < L.inArms
    const side = rnd() < 0.5 ? -1 : 1
    // In an arm, somewhere between the body and the tip; in the body, towards
    // one end of the plastid. Where across the cell is a rule — see
    // dropletAcross — that the renderer applies too.
    const x = inArm
      ? side * lerp([s.B * 1.05, s.H * 0.8], rnd())
      : plastid.u + side * plastid.L * lerp([0.55, 0.95], rnd())
    const room = radiusAt(x, s) - wall - 0.03
    r = Math.min(r, Math.max(room, 0.1))
    droplets.push({ u: x / s.H, r, x: dropletAcross(x, r, s, wall), z: 0 })
  }

  return {
    morph: 'fusiform',
    x: spot[0],
    y: spot[1],
    z: spot[2],
    q: pose.q,
    heading: pose.heading,
    shape: s,
    volume,
    // Straight or "bent" — both stable in culture (r98). The bend is the sag
    // of the axis at the middle, in µm, along the slide.
    bend: rnd() < C.bentShare ? (rnd() < 0.5 ? -1 : 1) * lerp(C.bendUm, rnd()) : (rnd() * 2 - 1) * 0.25,
    wall,
    plastid,
    nucleus,
    droplets,
    density: 0.9 + rnd() * 0.2,
    seed: rnd() * 97,
    ...extras,
  }
}

function makeOval(rnd, form, spot, pose) {
  const O = form.oval
  const length = lerp(O.lengthUm, rnd())
  const s = { H: length / 2, B: length / 2, Rb: lerp(O.widthUm, rnd()) / 2, ra: 0, rt: 0 }
  const volume = cellVolume(s)
  const wall = form.wall.ovalUm
  const plastid = makePlastid(rnd, s, { plastid: O.plastid }, volume, wall, 0)
  const rn = Math.cbrt((3 * form.nucleus.volumeShare * volume) / (4 * Math.PI))
  const roomN = s.Rb - wall - rn - 0.05
  return {
    morph: 'oval',
    x: spot[0],
    y: spot[1],
    z: spot[2],
    q: pose.q,
    heading: pose.heading,
    shape: s,
    volume,
    bend: 0,
    wall,
    plastid,
    nucleus: body(roomN > 0 ? -roomN / s.Rb : 0, 0, 0, rn),
    droplets: [],
    density: 0.9 + rnd() * 0.2,
    seed: rnd() * 97,
  }
}

// ── The slide ──────────────────────────────────────────────────────────────

// How much of the drop is populated, in µm across and down: a block of several
// fields round the stage, so that moving the stage finds more culture.
export function slabOf(form) {
  const [fx, fy] = form.slab ?? [3, 2.2]
  return [form.fieldUm * fx, form.fieldUm * fy]
}

// The slide's surface, below the plane the objective opens on by half the gap:
// the camera looks down from +z, so the slide is at −depth/2 and the coverslip
// at +depth/2.
export function glassOf(form) {
  return -form.depthUm / 2
}

export function buildPennates(form) {
  const rnd = seededRandom(form.seed ?? 2561)
  const [across, down] = slabOf(form)
  const glassZ = glassOf(form)
  const target = Math.max(3, Math.round(form.cellsPerMm2 * (across * down) * 1e-6))
  const cells = []
  const spread = form.tiltSpread ?? 0.15

  // Somewhere in the gap. A fusiform cell's centre keeps half its body's width
  // and a little more from either glass; the tilt can take an end closer, and
  // the coverslip is not drawn, so that does not matter.
  const suspended = (margin) => [
    (rnd() - 0.5) * across,
    (rnd() - 0.5) * down,
    glassZ + margin + rnd() * (form.depthUm - 2 * margin),
  ]

  while (cells.length < target) {
    const roll = rnd()
    if (roll < form.morphs.oval) {
      // On the slide, lying flat — attached to the glass, as the ovals of this
      // species are (r99) — with its long axis anywhere in the plane. It sticks
      // by what it secretes through its raphe (r99), which it usually carries
      // only in its hypotheca, while its plastid lies on the epivalve side
      // (r98): so the plastid is on the side away from the glass, and the cell
      // shows it face on, filling much of the outline, as the ovals of the
      // micrograph do (r111).
      const pose = orientation(rnd, 0, true, true)
      const spot = [(rnd() - 0.5) * across, (rnd() - 0.5) * down, glassZ]
      const cell = makeOval(rnd, form, spot, pose)
      cell.z = glassZ + cell.shape.Rb
      cells.push(cell)
      continue
    }
    const pose = orientation(rnd, spread)
    const spot = suspended(2)
    if (rnd() < form.division.pairShare && cells.length < target - 1) {
      // Two daughters just separated, lying side by side along their length,
      // touching, one a little ahead of the other. Each is an ordinary cell
      // with its own plastid, which is what a daughter is (r105).
      const a = makeFusiform(rnd, form, spot, pose, { dividing: false, pair: true })
      const side = new THREE.Vector3(-Math.sin(pose.heading), Math.cos(pose.heading), 0)
      const gap = a.shape.Rb * 2 + 0.15
      const shift = (rnd() * 2 - 1) * 1.2
      const along = new THREE.Vector3(Math.cos(pose.heading), Math.sin(pose.heading), 0)
      const spot2 = [
        spot[0] + side.x * gap + along.x * shift,
        spot[1] + side.y * gap + along.y * shift,
        spot[2] + (rnd() - 0.5) * 0.6,
      ]
      const pose2 = { q: pose.q.clone(), heading: pose.heading }
      const b = makeFusiform(rnd, form, spot2, pose2, { dividing: false, pair: true }, a.shape)
      cells.push(a, b)
      continue
    }
    cells.push(makeFusiform(rnd, form, spot, pose))
  }
  return { cells, across, down, glassZ }
}

// ── For the cards ──────────────────────────────────────────────────────────

// The ends of a cell's axis on the slide, in µm.
function segmentOf(c) {
  const a = new THREE.Vector3(0, 1, 0).applyQuaternion(c.q)
  return [c.x - a.x * c.shape.H, c.y - a.y * c.shape.H, c.x + a.x * c.shape.H, c.y + a.y * c.shape.H]
}

// The least distance between two segments in the plane.
function segmentDistance([ax, ay, bx, by], [cx, cy, dx, dy]) {
  const point = (px, py, x0, y0, x1, y1) => {
    const vx = x1 - x0
    const vy = y1 - y0
    const t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / (vx * vx + vy * vy || 1)))
    return Math.hypot(px - x0 - t * vx, py - y0 - t * vy)
  }
  const cross = (x0, y0, x1, y1, x2, y2) => (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)
  const d1 = cross(ax, ay, bx, by, cx, cy)
  const d2 = cross(ax, ay, bx, by, dx, dy)
  const d3 = cross(cx, cy, dx, dy, ax, ay)
  const d4 = cross(cx, cy, dx, dy, bx, by)
  if (d1 * d2 < 0 && d3 * d4 < 0) return 0
  return Math.min(point(ax, ay, cx, cy, dx, dy), point(bx, by, cx, cy, dx, dy),
    point(cx, cy, ax, ay, bx, by), point(dx, dy, ax, ay, bx, by))
}

// Whether another cell comes within `gap` µm of this one's outline on the
// slide, counting only cells near enough in depth to be seen with it.
function crowded(cells, i, gap, depth = 6) {
  const c = cells[i]
  const s = segmentOf(c)
  return cells.some((o, j) => {
    if (j === i || Math.abs(o.z - c.z) > depth) return false
    if (Math.hypot(o.x - c.x, o.y - c.y) > c.shape.H + o.shape.H + gap) return false
    return segmentDistance(s, segmentOf(o)) < c.shape.Rb + o.shape.Rb + gap
  })
}

// A fusiform cell of about the median length, alone, near the middle of the
// stage and near the middle of the gap, undivided and lying flat.
export function typicalCell(population, { dividing = false, minBend = 0 } = {}) {
  const { cells } = population
  let best = null
  cells.forEach((c, i) => {
    if (c.morph !== 'fusiform' || c.pair) return
    if (dividing !== c.plastid.pinch > 0) return
    if (Math.abs(c.bend) < minBend) return
    const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(c.q)
    if (Math.abs(axis.z) > 0.12) return
    if (crowded(cells, i, 3)) return
    const score = Math.hypot(c.x, c.y) + 4 * Math.abs(c.z) + 3 * Math.abs(2 * c.shape.H - 23)
    if (!best || score < best.score) best = { cell: c, score }
  })
  return best?.cell ?? cells.find((c) => c.morph === 'fusiform') ?? cells[0]
}

// An oval cell on the glass near the middle of the stage, with no cell hanging
// low enough over it to cast a shadow across it.
export function typicalOval(population) {
  const { cells } = population
  let best = null
  cells.forEach((c, i) => {
    if (c.morph !== 'oval') return
    if (crowded(cells, i, 4, 12)) return
    const d = Math.hypot(c.x, c.y)
    if (!best || d < best.d) best = { cell: c, d }
  })
  return best?.cell ?? cells.find((c) => c.morph === 'oval') ?? cells[0]
}

// Two daughters lying side by side, near the middle of the stage.
export function typicalPair(population) {
  const { cells } = population
  let best = null
  for (let i = 0; i < cells.length - 1; i++) {
    const a = cells[i]
    const b = cells[i + 1]
    if (!a.pair || !b.pair) continue
    const x = (a.x + b.x) / 2
    const y = (a.y + b.y) / 2
    const d = Math.hypot(x, y)
    if (!best || d < best.d) best = { x, y, z: (a.z + b.z) / 2, reach: a.shape.H + 2, d }
  }
  return best
}
