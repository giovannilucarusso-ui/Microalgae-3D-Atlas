// What is on the slide when the organism is a colony — a volvocine sphere of
// cells — and nothing about how it is drawn.
//
// The sibling of coccoid.js, euglenoid.js and haptophyte.js, and it differs from
// all three in the one way the organism does: **the unit on the slide is not a
// cell.** A Volvox colony is a hollow ball of matrix with its somatic cells set
// in one layer at the surface, and inside it, in the posterior half, the few
// cells that will make the next generation. Every number below is about one of
// those three things — the ball, the layer, the offspring — and the renderer
// draws each colony as a function of them rather than as a mesh.
//
// **The cell layer is a lattice, not a texture.** A colony has a definite number
// of cells, fixed when it was an embryo and never added to afterwards: the colony
// grows by laying down matrix, so the cells spread apart as it ages rather than
// multiplying. That makes the count a property of the colony, and the spacing a
// consequence of the count and the radius. The cells are placed on a spherical
// Fibonacci lattice of exactly that many points — the most even way there is to
// put n points on a sphere, and one whose nearest point to any direction can be
// found in closed form (Keinert et al. 2015), which is what lets the shader find
// the cells near a ray without being handed a list of them. Each point is then
// jittered by a fraction of the spacing, because a real colony's cells sit in a
// packing that is even but not crystalline.
//
// **The offspring are colonies too.** An embryo that has finished cleaving is
// already a sphere of all the cells its colony will ever have, and a juvenile
// after inversion is a small colony growing inside its parent. So an embryo and
// a juvenile are drawn by the same function as the parent, with their own
// radius and their own cells. Only an undivided gonidium is a solid body.
//
// Everything that could be taken from the species description is (Smith 1944,
// r65): the colony's size, its cell count, the number, size and place of its
// gonidia, and the size an embryo reaches before it is released. What a
// description cannot give — which stage the colonies on a slide are at, how
// crowded the drop is — is stated on the record as a choice.
// tools/check-volvox.mjs holds the drawn population to the description.
import * as THREE from 'three'
import { seededRandom } from './science.js'

// What the objective can resolve, in micrometres. The same figure as the other
// fields, because it is the same objective.
export const RESOLUTION_UM = 0.22

// ── The lattice ────────────────────────────────────────────────────────────

export const GOLDEN = (1 + Math.sqrt(5)) / 2
const fract = (x) => x - Math.floor(x)

// Point i of n on the unit sphere. i = 0 is at the +z pole, which in a colony's
// own frame is the anterior: the pole that leads when it swims.
export function latticePoint(i, n) {
  const phi = 2 * Math.PI * fract(i * (GOLDEN - 1))
  const z = 1 - (2 * i + 1) / n
  const s = Math.sqrt(Math.max(0, 1 - z * z))
  return [Math.cos(phi) * s, Math.sin(phi) * s, z]
}

// The index of the lattice point nearest a unit direction, in closed form —
// the inverse spherical Fibonacci mapping of Keinert et al. The shader carries
// the same function (FIBONACCI_GLSL); this copy is here so the check can hold
// it against a brute-force search.
export function nearestLatticePoint(p, n) {
  const phi = Math.min(Math.atan2(p[1], p[0]), Math.PI)
  const cosTheta = p[2]
  const k = Math.max(
    2,
    Math.floor(Math.log(n * Math.PI * Math.sqrt(5) * (1 - cosTheta * cosTheta)) / Math.log(GOLDEN * GOLDEN)),
  )
  const Fk = Math.pow(GOLDEN, k) / Math.sqrt(5)
  const F = [Math.round(Fk), Math.round(Fk * GOLDEN)]
  const ka = [(2 * F[0]) / n, (2 * F[1]) / n]
  const kb = F.map((f) => 2 * Math.PI * (fract((f + 1) * GOLDEN) - (GOLDEN - 1)))
  const det = ka[1] * kb[0] - ka[0] * kb[1]
  const v = [phi, cosTheta - (1 - 1 / n)]
  const c = [Math.floor((ka[1] * v[0] + kb[1] * v[1]) / det), Math.floor((-ka[0] * v[0] - kb[0] * v[1]) / det)]
  let best = 0
  let bestD = Infinity
  for (let s = 0; s < 4; s++) {
    const i = Math.min(Math.max(F[0] * ((s % 2) + c[0]) + F[1] * (Math.floor(s / 2) + c[1]), 0), n - 1)
    const q = latticePoint(i, n)
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

export const FIBONACCI_GLSL = /* glsl */ `
  const float GOLDEN = ${GOLDEN.toFixed(9)};
  const float TAU = 6.283185307;

  vec3 latticePoint(float i, float n) {
    float phi = TAU * fract(i * (GOLDEN - 1.0));
    float z = 1.0 - (2.0 * i + 1.0) / n;
    float s = sqrt(max(0.0, 1.0 - z * z));
    return vec3(cos(phi) * s, sin(phi) * s, z);
  }

  // The four lattice points at the corners of the cell of the lattice that
  // holds p: the nearest is always among them.
  vec4 latticeNear(vec3 p, float n) {
    float phi = min(atan(p.y, p.x), 3.14159265);
    float cosTheta = p.z;
    float k = max(2.0, floor(log(n * 3.14159265 * 2.236068 * max(1.0 - cosTheta * cosTheta, 1e-9)) / log(GOLDEN * GOLDEN)));
    float Fk = pow(GOLDEN, k) / 2.236068;
    vec2 F = vec2(floor(Fk + 0.5), floor(Fk * GOLDEN + 0.5));
    vec2 ka = 2.0 * F / n;
    vec2 kb = TAU * (fract((F + 1.0) * GOLDEN) - (GOLDEN - 1.0));
    mat2 iB = mat2(ka.y, -ka.x, kb.y, -kb.x) / (ka.y * kb.x - ka.x * kb.y);
    vec2 c = floor(iB * vec2(phi, cosTheta - (1.0 - 1.0 / n)));
    vec4 ids;
    ids.x = dot(F, c);
    ids.y = dot(F, c + vec2(1.0, 0.0));
    ids.z = dot(F, c + vec2(0.0, 1.0));
    ids.w = dot(F, c + vec2(1.0, 1.0));
    return clamp(ids, 0.0, n - 1.0);
  }
`

// The distance between neighbouring cells when n of them share a sphere of
// radius r in a hexagonal packing: each holds (√3/2)·d² of the surface.
export function spacingUm(radiusUm, cells) {
  const perCell = (4 * Math.PI * radiusUm * radiusUm) / cells
  return Math.sqrt((2 * perCell) / Math.sqrt(3))
}

// ── The slide ──────────────────────────────────────────────────────────────

const lerp = (range, t) => range[0] + (range[1] - range[0]) * t

// The block of culture the density is counted over: wider than any view the
// objective zooms out to, and wrapped round the stage like the euglenoid field's.
export function tileOf(form) {
  return form.tileUm ?? [form.fieldUm * 5.4, form.fieldUm * 2.8]
}

// Which stage a colony is at, from the mix the record states. See `offspring`
// on the record.
function stageOf(rnd, mix) {
  const x = rnd()
  if (x < mix.juveniles) return 'juveniles'
  if (x < mix.juveniles + mix.embryos) return 'embryos'
  return 'young'
}

// A frame for a direction: two unit vectors perpendicular to it and to each
// other. Which pair does not matter; that it is the same pair every time does.
function basisFor(axis) {
  const ref = Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]
  const e1 = new THREE.Vector3(...ref).cross(new THREE.Vector3(...axis)).normalize()
  const e2 = new THREE.Vector3(...axis).cross(e1).normalize()
  return [e1.toArray(), e2.toArray()]
}

// A unit direction within `spread` radians of `about`, uniformly in solid angle.
function directionNear(rnd, about, spread) {
  const cosMax = Math.cos(spread)
  const z = 1 - rnd() * (1 - cosMax)
  const a = rnd() * Math.PI * 2
  const s = Math.sqrt(Math.max(0, 1 - z * z))
  const [e1, e2] = basisFor(about)
  return [0, 1, 2].map((k) => e1[k] * s * Math.cos(a) + e2[k] * s * Math.sin(a) + about[k] * z)
}

const norm = (v) => Math.hypot(v[0], v[1], v[2])

// One sphere of cells: its radius to the middle of the cell layer, the radius
// of a cell, and how many there are. A cell is at most a little over half the
// spacing across, so neighbours never overlap — which is also what an embryo
// looks like when cleavage has just finished and the cells are packed.
function layer(radiusUm, cells, cellUm) {
  const spacing = spacingUm(radiusUm, cells)
  const a = Math.min(cellUm / 2, 0.55 * spacing)
  return { radiusUm, cells, cellUm: 2 * a, spacingUm: spacing }
}

// The offspring of one colony: all at one stage, because the gonidia of a
// colony develop together, and all in the posterior half (r65). Placed one at a
// time where they fit — inside the parent's cell layer and clear of each other.
function offspringOf(rnd, form, colony) {
  const o = form.offspring
  const n = Math.round(lerp(o.count, rnd()))
  const inner = colony.layer.radiusUm - colony.layer.cellUm / 2 - 2
  // The whole brood's age, as a size: gonidia are 18–22 µm and do not grow
  // while they cleave, so an embryo is a gonidium's size; a juvenile expands
  // after inversion until it is released at 150–175 µm (r65).
  const release = lerp(o.releaseUm, rnd())
  let age = colony.stage === 'juveniles' ? lerp([o.juvenileFrom, 1], Math.pow(rnd(), o.ageSkew ?? 1)) : 0
  // A brood that does not fit in the back half of its parent is a brood that
  // is not that far along yet: twelve juveniles at release size do not fit in
  // a colony of four hundred micrometres, and in life they would not have
  // been allowed to grow that far. So the brood is placed whole, and if it
  // does not fit it is drawn a little younger and placed again.
  for (let attempt = 0; attempt < 12; attempt++) {
    const out = []
    for (let i = 0; i < n; i++) {
      let child = null
      for (let tries = 0; tries < 80 && !child; tries++) {
        let diameter
        let kind
        if (colony.stage === 'juveniles') {
          diameter = Math.min(release, release * age * lerp([0.9, 1.08], rnd()))
          kind = 'juvenile'
        } else {
          diameter = lerp(o.gonidiumUm, rnd())
          kind = colony.stage === 'embryos' ? 'embryo' : 'gonidium'
        }
        const r = diameter / 2
        // A gonidium and an embryo sit in the cell layer, bulging inwards; a
        // juvenile has drawn away from it into the matrix as it grew.
        const reach = kind === 'juvenile' ? inner - r - lerp([2, 24], rnd()) : inner - r * 0.95
        if (reach < r * 0.2) continue
        // Posterior half: the body frame's −z, up to the equator.
        const dir = directionNear(rnd, [0, 0, -1], Math.PI / 2)
        const at = dir.map((v) => v * reach)
        if (out.some((c) => norm([c.at[0] - at[0], c.at[1] - at[1], c.at[2] - at[2]]) < c.radiusUm + r + 1.5)) continue
        const cells = Math.round(colony.layer.cells * lerp([0.85, 1.15], rnd()))
        child = {
          kind,
          at,
          radiusUm: r,
          // Its own frame, fixed in the parent's: which way its anterior points.
          axis: directionNear(rnd, [0, 0, 1], Math.PI),
          spin: rnd() * Math.PI * 2,
          layer:
            kind === 'gonidium'
              ? null
              : layer(
                  r - (kind === 'embryo' ? 1 : 1.5),
                  cells,
                  // Just cleaved, a cell is what a gonidium divided by the
                  // count leaves it; a juvenile's cells grow back towards full
                  // size as it expands. See `offspring.cellUm`.
                  kind === 'embryo'
                    ? o.cellUm[0]
                    : lerp(o.cellUm, Math.min(1, Math.max(0, (age - o.juvenileFrom) / (1 - o.juvenileFrom)))),
                ),
        }
      }
      if (!child) break
      out.push(child)
    }
    if (out.length === n) return out
    age = Math.max(o.juvenileFrom * 0.6, age * 0.92)
  }
  return []
}

function makeColony(rnd, form, home, stage) {
  const c = form.colony
  const diameter = stage === 'young' ? lerp(c.youngDiameterUm, rnd()) : lerp(c.diameterUm, rnd())
  const radius = diameter / 2
  // The count is drawn once per colony and never changes: a colony is born
  // with every cell it will have.
  const cells = Math.round(Math.exp(lerp([Math.log(c.cells[0]), Math.log(c.cells[1])], rnd())))
  const colony = {
    home,
    stage,
    radiusUm: radius,
    layer: layer(radius - c.cellUm / 2, cells, c.cellUm),
    // Swimming upwards, as a colony does in still water (r72): its anterior
    // pole tipped towards the objective, which is up, by a spread of angles.
    axis: directionNear(rnd, [0, 0, 1], form.axis.tiltRad),
    spin: rnd() * Math.PI * 2,
    // Turning about its axis, at the rate the record gives, and all in one
    // sense — the flagella of every colony beat at the same slant.
    spinRate: form.spin.sense * lerp(form.spin.radPerS, rnd()),
    // Wandering in a crowded drop rather than crossing it.
    wander: [lerp(form.drift.wanderUm, rnd()), lerp(form.drift.wanderUm, rnd()), lerp(form.drift.wanderUm, rnd()) * 0.3],
    rates: [0, 1, 2].map(() => lerp(form.drift.rate, rnd())),
    phases: [0, 1, 2, 3].map(() => rnd() * Math.PI * 2),
    wobble: lerp([0.03, 0.08], rnd()),
    seed: Math.floor(rnd() * 997),
  }
  colony.offspring = offspringOf(rnd, form, colony)
  return colony
}

// Periodic distance in the plane of the tile, so a colony near one edge is
// kept clear of the ones that wrap round from the other.
function apart(a, b, tile) {
  let dx = Math.abs(a[0] - b[0])
  let dy = Math.abs(a[1] - b[1])
  dx = Math.min(dx, tile[0] - dx)
  dy = Math.min(dy, tile[1] - dy)
  return Math.hypot(dx, dy, a[2] - b[2])
}

// Push overlapping colonies apart until none overlap, in the periodic block and
// between the slide and the coverslip. The first `fixed` stay where they are.
// If the block is too full for that, the smallest colony still in a clash is
// taken out and the rest relaxed again, until it is not.
function pack(colonies, tile, depth, margin, fixed) {
  const room = (c) => Math.max(0, depth / 2 - c.radiusUm - 2 * c.wander[2])
  const wrap = (v, span) => v - span * Math.round(v / span)
  for (let round = 0; round < colonies.length; round++) {
    const clashing = new Set()
    for (let pass = 0; pass < 300; pass++) {
      let worst = 0
      clashing.clear()
      for (let i = 0; i < colonies.length; i++) {
        for (let j = i + 1; j < colonies.length; j++) {
          const a = colonies[i]
          const b = colonies[j]
          const d = [wrap(b.home[0] - a.home[0], tile[0]), wrap(b.home[1] - a.home[1], tile[1]), b.home[2] - a.home[2]]
          const need = a.radiusUm + b.radiusUm + margin
          const dist = Math.hypot(d[0], d[1], d[2])
          if (dist >= need) continue
          const gap = need - dist
          worst = Math.max(worst, gap)
          if (gap > 0.5) {
            clashing.add(i)
            clashing.add(j)
          }
          const u = dist > 1e-6 ? d.map((v) => v / dist) : [1, 0, 0]
          // Each moves by its share, and a fixed one not at all.
          const wa = i < fixed ? 0 : 0.5
          const wb = 1 - wa
          for (let k = 0; k < 3; k++) {
            a.home[k] -= u[k] * gap * wa * 0.6
            b.home[k] += u[k] * gap * wb * 0.6
          }
        }
      }
      for (let i = fixed; i < colonies.length; i++) {
        const c = colonies[i]
        c.home[0] = wrap(c.home[0], tile[0])
        c.home[1] = wrap(c.home[1], tile[1])
        const r = room(c)
        c.home[2] = Math.min(r, Math.max(-r, c.home[2]))
      }
      if (worst < 0.5) return
    }
    // Still jammed: the smallest colony in a clash goes.
    let smallest = -1
    for (const i of clashing) {
      if (i < fixed) continue
      if (smallest < 0 || colonies[i].radiusUm < colonies[smallest].radiusUm) smallest = i
    }
    if (smallest < 0) return
    colonies.splice(smallest, 1)
  }
}

export function buildColonies(form) {
  const rnd = seededRandom(form.seed ?? 6131)
  const tile = tileOf(form)
  const depth = form.depthUm
  // How many colonies the block holds, from the stated density. The same
  // arithmetic as every other field: a count per millilitre, a volume, and
  // nothing chosen per frame.
  const target = Math.round(tile[0] * tile[1] * depth * form.coloniesPerMl * 1e-12)
  // Each colony strays up to twice its wander from home (see colonyPose), so
  // two neighbours can close by four times the largest.
  const margin = 4 * form.drift.wanderUm[1] + 4
  const colonies = []
  // The colony the operator has centred and focused on — through its middle,
  // where its rim is sharp. A reproductive one, carrying young, like most of
  // the drop. It counts towards the density like any other; only its place is
  // chosen.
  if (form.centred) {
    const centred = makeColony(rnd, form, [0, 0, 0], 'juveniles')
    centred.wander = centred.wander.map((w) => w * 0.3)
    colonies.push(centred)
  }
  // Every colony is made first — its stage, its size, its cells — and then
  // the drop is packed. Dropped in one at a time where they fit, spheres jam
  // with nearly half the plane still empty, and a crowded drop is far closer
  // than that: its colonies nearly touching, the small ones in the gaps
  // between the large, the way colonies settle against each other. So they
  // are scattered
  // anywhere and then pushed apart until no two share any water — the
  // relaxation that packs a box of unequal spheres — and whatever cannot be
  // made to fit is left out, smallest first.
  for (let i = colonies.length; i < target; i++) {
    const colony = makeColony(rnd, form, [0, 0, 0], stageOf(rnd, form.offspring.stages))
    const room = Math.max(0, depth / 2 - colony.radiusUm - 2 * colony.wander[2])
    colony.home = [(rnd() - 0.5) * tile[0], (rnd() - 0.5) * tile[1], (rnd() * 2 - 1) * room]
    colonies.push(colony)
  }
  pack(colonies, tile, depth, margin, form.centred ? 1 : 0)

  // The motes: bacteria and fine detritus. In darkfield they are the
  // brightest things in an empty field, because a colourless particle
  // scatters every colour alike — which is how they can be told from pieces
  // of colony: they are white.
  const motes = []
  const m = form.motes
  const count = Math.round(tile[0] * tile[1] * depth * m.perMl * 1e-12)
  for (let i = 0; i < count; i++) {
    motes.push({
      home: [(rnd() - 0.5) * tile[0], (rnd() - 0.5) * tile[1], (rnd() * 2 - 1) * depth * 0.5],
      radiusUm: lerp(m.diameterUm, Math.pow(rnd(), 2)) / 2,
      rates: [0, 1, 2].map(() => lerp([0.6, 1.9], rnd())),
      phases: [0, 1, 2].map(() => rnd() * Math.PI * 2),
    })
  }
  return { colonies, motes, tile, depth, target }
}

// ── Where a colony is, and which way it faces, at time t ───────────────────
//
// Computed on the CPU, per colony per frame, and handed to every sphere the
// colony carries: a juvenile sits fixed in its parent's matrix and is carried
// round with it.

export function newPose() {
  return { centre: new THREE.Vector3(), axis: new THREE.Vector3(), e1: new THREE.Vector3(), e2: new THREE.Vector3() }
}

// Scratch vectors, so a frame of a thousand poses allocates nothing.
const SCRATCH = new THREE.Vector3()
const U = new THREE.Vector3()
const V = new THREE.Vector3()
const E1 = new THREE.Vector3()
const E2 = new THREE.Vector3()

// A frame for a direction that does not change is worked out once.
const frames = new WeakMap()
function frameOf(direction) {
  let f = frames.get(direction)
  if (!f) {
    f = basisFor(direction)
    frames.set(direction, f)
  }
  return f
}

export function colonyPose(colony, t, out) {
  const [wx, wy, wz] = colony.wander
  const [ra, rb, rc] = colony.rates
  const [pa, pb, pc, pd] = colony.phases
  const swing = (amp, rate, phase) => amp * (Math.sin(rate * t + phase) - Math.sin(phase))
  out.centre.set(colony.home[0] + swing(wx, ra, pa), colony.home[1] + swing(wy, rb, pb), colony.home[2] + swing(wz, rc, pc))
  // The axis nods a little as the colony goes round — the anterior is
  // steering — and the colony turns about it.
  const nod = colony.wobble * Math.sin(Math.abs(colony.spinRate) * t + pd)
  const [b1] = frameOf(colony.axis)
  out.axis.set(...colony.axis).addScaledVector(SCRATCH.set(...b1), nod).normalize()
  const ref = Math.abs(out.axis.z) < 0.9 ? SCRATCH.set(0, 0, 1) : SCRATCH.set(1, 0, 0)
  U.crossVectors(ref, out.axis).normalize()
  V.crossVectors(out.axis, U)
  const angle = colony.spin + colony.spinRate * t
  out.e1.copy(U).multiplyScalar(Math.cos(angle)).addScaledVector(V, Math.sin(angle))
  out.e2.crossVectors(out.axis, out.e1)
  return out
}

// A direction in a parent's frame, in the world's.
function toWorld(parent, v, out) {
  return out.set(0, 0, 0).addScaledVector(parent.e1, v[0]).addScaledVector(parent.e2, v[1]).addScaledVector(parent.axis, v[2])
}

// A child's pose from its parent's: its centre carried in the parent's frame,
// and its own frame the child's local one expressed in the parent's.
export function childPose(parent, child, out) {
  const [x, y, z] = child.at
  out.centre.copy(parent.centre).addScaledVector(parent.e1, x).addScaledVector(parent.e2, y).addScaledVector(parent.axis, z)
  toWorld(parent, child.axis, out.axis).normalize()
  const [b1, b2] = frameOf(child.axis)
  toWorld(parent, b1, E1)
  toWorld(parent, b2, E2)
  out.e1.copy(E1).multiplyScalar(Math.cos(child.spin)).addScaledVector(E2, Math.sin(child.spin))
  out.e2.crossVectors(out.axis, out.e1)
  return out
}

export function motePosition(mote, t, out) {
  const [ra, rb, rc] = mote.rates
  const [pa, pb, pc] = mote.phases
  // Brownian jitter, drawn as three incommensurate wobbles of about a
  // micrometre: what a bacterium-sized particle does in water.
  return out.set(
    mote.home[0] + 0.8 * Math.sin(ra * 3.1 * t + pa) + 0.4 * Math.sin(rb * 7.3 * t + pb),
    mote.home[1] + 0.8 * Math.sin(rb * 2.7 * t + pc) + 0.4 * Math.sin(rc * 6.1 * t + pa),
    mote.home[2] + 0.6 * Math.sin(rc * 2.3 * t + pb),
  )
}
