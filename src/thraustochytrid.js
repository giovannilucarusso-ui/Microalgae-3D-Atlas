// What is on the slide when the organism is a thraustochytrid culture — strain
// RCC893 of Aurantiochytrium mangrovei, three days into a flask of YEP — and
// nothing about how it is drawn.
//
// The sibling of coccoid.js, and almost nothing in it is argued from the
// literature alone, because for once the atlas has something better: the
// project owner's own photograph of this culture, at 200× in brightfield. The
// photograph stays private, by the owner's choice, so it is not in the
// repository and never will be; what is here is what was *measured* on it, and
// each number says so where it is used. The literature bounds the numbers —
// the protologue's 5–12 µm in a nutrient medium, 10.6–45.1 µm at high glucose
// in another strain of the species — and the photograph places this culture
// inside those bounds.
//
// Three facts about the culture decide the drawing, and each is a measurement:
//
//   · **the size distribution** — 230 isolated round cells, measured on their
//     edge (the gradient between the dark rim inside and the bright line
//     outside): median 13.2 µm, 9.5–17.8 µm from the 5th to the 95th
//     percentile, 5.7–28.4 µm at the extremes;
//   · **the density** — about 1400 cells to the square millimetre of slide;
//   · **how the cells lie** — most of them touching others, in pairs and
//     small groups, and cells in a group as big as cells alone. Where two are
//     pressed together they meet along a flat face.
//
// The cells are not drawn in the ways the literature allows and the photograph
// does not show. No zoospores: at 72 h there were none (there had been in the
// days before). No amoeboid or limaciform cells, and none floating up against
// the coverslip: neither has been seen in this strain. And not the rod-shaped
// bacteria that the photograph also holds — they are the culture's, not the
// organism's, and the owner chose to leave them out.
import { seededRandom } from './science.js'

// ── Size ────────────────────────────────────────────────────────────────────
//
// The diameters of the 230 isolated round cells, in 2 µm bins from 4–6 µm to
// 28–30 µm. Measured on the reference photograph at 1.32 px/µm — its field stop
// is 1321 px across and the field it frames is 1.0 mm — on each cell's edge
// rather than on the blot with its halo.
//
// Drawn from directly, uniformly within each bin, rather than from a fitted
// curve: the distribution is not symmetric (a long tail of a few large cells)
// and a curve would be one more assumption between the drawing and the count.
export const SIZE_HISTOGRAM = {
  fromUm: 4,
  binUm: 2,
  counts: [1, 4, 16, 69, 45, 54, 31, 3, 3, 2, 0, 1, 1],
}

// The diameter below which a fraction `u` of the measured cells fall — the
// inverse of the histogram's cumulative count, linear within a bin.
export function sizeQuantile(u, hist = SIZE_HISTOGRAM) {
  const total = hist.counts.reduce((a, b) => a + b, 0)
  let target = Math.min(Math.max(u, 0), 1) * total
  for (let i = 0; i < hist.counts.length; i++) {
    const n = hist.counts[i]
    if (target <= n || i === hist.counts.length - 1) {
      const t = n > 0 ? Math.min(target / n, 1) : 0.5
      return hist.fromUm + hist.binUm * (i + t)
    }
    target -= n
  }
  return hist.fromUm + hist.binUm * hist.counts.length
}

// ── Groups ──────────────────────────────────────────────────────────────────
//
// The protologue describes the division that makes them: a mature cell divides
// in two, and again, into a diad, a tetrad, six, seven or eight cells, and
// often twelve (Raghu-Kumar 1988). On pine pollen in sea water the daughters do
// not grow and the cluster stays the size of the cell it came from; in a
// nutrient medium it also records cells whose wall did not break dividing into
// four to thirty-two that "grew in situ, later resulting in large clusters of
// cells". Three days into YEP — eight times the glucose of the protologue's
// nutrient medium — the photograph shows the second kind: cells in groups are
// as large as cells on their own (median 12.7 against 12.6 µm on the interiors
// of 378 cells), so a group here is cells that divided and grew where they
// were, not a mother cut into pieces.
//
// How many cells a group holds, as a relative number of *groups* of each size.
// Counted on the photograph, linking cells whose outlines come within a few
// micrometres of each other: pairs above all, then threes and fours, a few up
// to fifteen or sixteen.
export const GROUP_SIZES = {
  2: 30,
  3: 16,
  4: 7,
  5: 5,
  6: 3,
  7: 2,
  8: 2,
  9: 1.5,
  10: 1,
  12: 1,
  15: 0.5,
  16: 0.5,
}

function drawGroupSize(rnd, sizes) {
  const entries = Object.entries(sizes).map(([n, w]) => [Number(n), w])
  const total = entries.reduce((a, [, w]) => a + w, 0)
  let t = rnd() * total
  for (const [n, w] of entries) {
    if (t < w) return n
    t -= w
  }
  return entries[entries.length - 1][0]
}

// One group, built as division builds it: each new cell against one already
// there, pressed into it, and not into any other.
//
// "Pressed" is a centre distance of `squeeze` times the sum of the two radii:
// the spheres overlap, and the overlap is cut away along the plane of equal
// power between them (see `contacts`), which is the flat face two soft cells
// share. At 0.84 of the sum a pair of equal cells shares a face about half a
// cell across, the most the photograph shows; at 0.97 they barely kiss.
function buildGroup(rnd, n, squeeze) {
  const members = [{ x: 0, y: 0, r: sizeQuantile(rnd()) / 2 }]
  while (members.length < n) {
    const r = sizeQuantile(rnd()) / 2
    let placed = null
    for (let tries = 0; tries < 60 && !placed; tries++) {
      // Against a recent cell more often than an old one: a group grows at its
      // margin, where the youngest cells are, and a rule that picked anchors
      // evenly made round balls where the photograph shows short chains and
      // clumps.
      const k = members.length - 1 - Math.floor(members.length * Math.pow(rnd(), 1.6))
      const anchor = members[Math.max(0, k)]
      const a = rnd() * Math.PI * 2
      const d = (anchor.r + r) * (squeeze[0] + (squeeze[1] - squeeze[0]) * rnd())
      const x = anchor.x + d * Math.cos(a)
      const y = anchor.y + d * Math.sin(a)
      if (members.every((m) => Math.hypot(m.x - x, m.y - y) >= (m.r + r) * squeeze[0])) placed = { x, y, r }
    }
    if (!placed) break
    members.push(placed)
  }
  const cx = members.reduce((s, m) => s + m.x, 0) / members.length
  const cy = members.reduce((s, m) => s + m.y, 0) / members.length
  return members.map((m) => ({ ...m, x: m.x - cx, y: m.y - cy }))
}

// Where two pressed cells meet: the radical plane of the two spheres, as a
// direction from this cell's centre and a distance along it. Every point of the
// plane has the same power with respect to both, which is what makes it the
// face they share — and for two cells of different sizes it sits nearer the
// smaller one, as a soft small cell pushed against a big one would.
//
// Drawn in the plane of the slide. Two resting cells of different sizes have
// their centres at different heights, so their true radical plane is a little
// tilted; the face it cuts is under a micrometre off vertical across a cell and
// is not something this objective would show.
export function contacts(cells, maxPlanes = 4) {
  for (const cell of cells) cell.planes = []
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i]
      const b = cells[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy)
      if (d >= a.r + b.r || d < 1e-6) continue
      const along = (d * d + a.r * a.r - b.r * b.r) / (2 * d)
      const angle = Math.atan2(dy, dx)
      a.planes.push({ angle, offset: along })
      b.planes.push({ angle: angle + Math.PI, offset: d - along })
    }
  }
  // The deepest faces first; a cell pressed on more sides than the renderer
  // carries keeps the four that cut it most.
  for (const cell of cells) {
    cell.planes.sort((p, q) => p.offset / cell.r - q.offset / cell.r)
    cell.planes = cell.planes.slice(0, maxPlanes)
  }
}

// ── The oil ─────────────────────────────────────────────────────────────────
//
// The droplets are generated in the renderer, from each cell's seed, on a
// jittered cubic lattice (see ThraustochytridField.jsx). Their sizes are set
// here so the biology and the drawing cannot disagree about them.
//
// A droplet's radius is a fraction of its lattice step — between the two
// numbers of DROPLET_K — times a factor that grows from the middle of the cell
// to its wall, DROPLET_P: about a micrometre across at the steps drawn, as in
// the Roscoff collection's micrograph of RCC893, and a little larger towards
// the margin, where Wong et al. found the largest droplets in a strain of the
// same species. It never exceeds 0.47 of the step, so no two droplets touch.
export const DROPLET_K = [0.26, 0.46]
export const DROPLET_P = [0.9, 1.08]

// The share of a cell's volume the droplets fill when every site holds one:
// the mean droplet volume over its site, for sites spread evenly through the
// sphere. Times a cell's `fill` it is the oil's share of that cell — its mean,
// which goes into the cell's own refractive index, and against which each
// droplet is drawn as a departure.
export const DROPLET_SHARE = (() => {
  let sum = 0
  const n = 48
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const k = DROPLET_K[0] + ((DROPLET_K[1] - DROPLET_K[0]) * (i + 0.5)) / n
      const out = Math.cbrt((j + 0.5) / n)
      const r = Math.min(k * (DROPLET_P[0] + (DROPLET_P[1] - DROPLET_P[0]) * out), 0.47)
      sum += (4 / 3) * Math.PI * r ** 3
    }
  }
  return sum / (n * n)
})()

// ── The slide ───────────────────────────────────────────────────────────────

// A grid of buckets over the slab, so that testing a new cell against the ones
// already down does not mean testing it against all of them.
function spatialIndex(cell) {
  const buckets = new Map()
  const key = (i, j) => i * 73856093 + j * 19349663
  return {
    add(c) {
      const k = key(Math.floor(c.x / cell), Math.floor(c.y / cell))
      if (!buckets.has(k)) buckets.set(k, [])
      buckets.get(k).push(c)
    },
    near(x, y, reach) {
      const out = []
      const i0 = Math.floor((x - reach) / cell)
      const i1 = Math.floor((x + reach) / cell)
      const j0 = Math.floor((y - reach) / cell)
      const j1 = Math.floor((y + reach) / cell)
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const list = buckets.get(key(i, j))
          if (list) out.push(...list)
        }
      }
      return out
    },
  }
}

// The culture as it lies on the slide.
//
// **The count is the photograph's density, not a choice.** About 1400 cells to
// the square millimetre, over a slab of slide `slab` fields across: at the
// default magnification the frame holds a hundred and fifty-odd, and panning
// finds more of the same drop rather than an edge.
//
// **Every cell rests on the glass**, with its centre one radius above it.
// These cells are denser than the medium and do not swim, and the photograph
// shows a single layer with nothing out of focus above it — no floating cells,
// which the literature allows for lipid-rich cells of the species and which
// have not been seen in this strain. So the plane of focus selects a size, as
// it does in a settled mount of anything: rack it and the big cells come and
// go at a different setting from the small ones.
//
// The units — single cells and groups — are placed at random without touching
// one another. Contacts between them happen anyway at this density, as they do
// on the slide, and the share of cells touching others comes out near the
// photograph's without being asked for twice.
export function buildThraustochytrids(form) {
  const rnd = seededRandom(form.seed ?? 893)
  const across = form.fieldUm * form.slab[0]
  const down = form.fieldUm * form.slab[1]
  const target = Math.round(form.cellsPerMm2 * across * down * 1e-6)
  const grouping = form.grouping

  // The units, decided before anything is placed: how many cells in groups,
  // and in which groups.
  const units = []
  let inGroups = 0
  let total = 0
  while (total < target) {
    const wantGroup = inGroups < grouping.fraction * Math.max(total, 1)
    if (wantGroup) {
      const n = Math.min(drawGroupSize(rnd, grouping.sizes ?? GROUP_SIZES), target - total)
      const members = n >= 2 ? buildGroup(rnd, n, grouping.squeeze) : [{ x: 0, y: 0, r: sizeQuantile(rnd()) / 2 }]
      units.push(members)
      if (members.length > 1) inGroups += members.length
      total += members.length
    } else {
      units.push([{ x: 0, y: 0, r: sizeQuantile(rnd()) / 2 }])
      total += 1
    }
  }
  // Big units first: they are the hard ones to fit, and a slab filled with
  // singles leaves no room for a group of twelve.
  units.sort((a, b) => b.length - a.length)

  const index = spatialIndex(12)
  const cells = []
  const groups = []
  const gap = grouping.gapUm ?? 0.2
  for (const members of units) {
    let at = null
    for (let tries = 0; tries < 200 && !at; tries++) {
      const x = (rnd() - 0.5) * across
      const y = (rnd() - 0.5) * down
      const ok = members.every((m) =>
        index
          .near(x + m.x, y + m.y, m.r + 16)
          .every((c) => Math.hypot(c.x - (x + m.x), c.y - (y + m.y)) >= c.r + m.r + gap),
      )
      if (ok) at = [x, y]
    }
    if (!at) continue
    const group = members.length > 1 ? groups.length : -1
    if (group >= 0) groups.push([])
    for (const m of members) {
      const cell = { x: at[0] + m.x, y: at[1] + m.y, r: m.r, group }
      cells.push(cell)
      index.add(cell)
      if (group >= 0) groups[group].push(cells.length - 1)
    }
  }

  // Resting on the slide: a cell's centre is one radius above the glass, and
  // the glass is `focus.aboveGlassUm` below the plane the objective opens on.
  const glassZ = -form.focus.aboveGlassUm
  for (const cell of cells) cell.z = glassZ + cell.r

  contacts(cells)

  // What each cell holds, which the renderer turns into droplets. See
  // `lipid` on the species record for the numbers and where they come from.
  const lipid = form.lipid
  const [d0, d1] = lipid.sizeRangeUm ?? [9, 19]
  for (const cell of cells) {
    const size = Math.min(1, Math.max(0, (cell.r * 2 - d0) / (d1 - d0)))
    cell.seed = rnd()
    // Bigger cells carry bigger bodies — which is what Wong et al. found
    // between the floating and the settled cells of a strain of this species —
    // and every cell a little differently from its neighbour.
    cell.spacing = lipid.spacingUm[0] + (lipid.spacingUm[1] - lipid.spacingUm[0]) * (0.55 * size + 0.45 * rnd())
    cell.fill = lipid.fill[0] + (lipid.fill[1] - lipid.fill[0]) * rnd()
    cell.density = 0.7 + 0.6 * rnd()
  }

  return { cells, groups, across, down, glassZ }
}

// ── What a card points at ───────────────────────────────────────────────────
//
// Anchors read out of the population rather than typed in, so a change to the
// seed or the rules moves the camera with the cells instead of leaving it
// pointing at empty slide.

// Cells whose outline is within `reach` µm of another's.
export function neighbourCounts(cells, reach = 0) {
  const counts = new Array(cells.length).fill(0)
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const d = Math.hypot(cells[i].x - cells[j].x, cells[i].y - cells[j].y) - cells[i].r - cells[j].r
      if (d <= reach) {
        counts[i]++
        counts[j]++
      }
    }
  }
  return counts
}

// The single cell nearest the middle of the stage whose diameter is close to
// the measured median, with nothing within a few micrometres of it.
export function typicalCell(population, medianUm = 13.2) {
  const { cells } = population
  const alone = neighbourCounts(cells, 4)
  let best = null
  cells.forEach((c, i) => {
    if (alone[i] || Math.abs(c.r * 2 - medianUm) > 1.2) return
    const d = Math.hypot(c.x, c.y)
    if (!best || d < best.d) best = { cell: c, d }
  })
  return best?.cell ?? cells[0]
}

// A group of `min`–`max` cells near the middle of the stage, as its centroid
// and the radius that holds it.
export function typicalGroup(population, min = 4, max = 7) {
  const { cells, groups } = population
  let best = null
  for (const members of groups) {
    if (members.length < min || members.length > max) continue
    const x = members.reduce((s, i) => s + cells[i].x, 0) / members.length
    const y = members.reduce((s, i) => s + cells[i].y, 0) / members.length
    const reach = Math.max(...members.map((i) => Math.hypot(cells[i].x - x, cells[i].y - y) + cells[i].r))
    const d = Math.hypot(x, y)
    if (!best || d < best.d) best = { x, y, z: cells[members[0]].z, reach, d, members }
  }
  return best
}

// ── The life cycle ──────────────────────────────────────────────────────────
//
// One cell, followed from zoospore to zoosporangium and back to zoospores, in
// a clearing near the middle of the stage. The culture drawn is three days old
// and had no zoospores left; this is the cycle it went through in its first
// days, shown only when it is asked for.
//
// The sequence is the one the protologue describes, with the release the
// project owner sees in RCC893: a zoospore settles and rounds up into a cyst of
// 3.7–4.4 µm (r80); the cyst grows; its protoplast cleaves inside the wall by
// successive binary divisions, 2, 4, 8, 16 — the protologue's own counts in a
// nutrient medium (r80); the masses take the shape of zoospores; and the wall
// of this zoosporangium bursts and lets them out (the owner's observation of
// the strain in YEP — the protologue, on the type strain, describes instead a
// cell that sheds its wall first and cleaves naked, and the card says so).
//
// Everything here is a pure function of the phase t, from 0 to 1, so a slider
// can scrub it as well as play it. Growth is compressed, a day into a few
// seconds; swimming is not. A zoospore leaves at the speed measured for the
// species — up to 125 µm/s in a straight line (r86) — which is why it is gone
// from a close view within a second or two of the burst.

// When each thing happens, as a share of the loop.
export const CYCLE_T = {
  settle: 0.09, // the incoming zoospore stops
  cyst: 0.13, // it has rounded up
  grown: 0.47, // the cell is mature
  cleaved: 0.68, // sixteen masses inside the wall
  shaped: 0.73, // the masses are zoospores, flagella out
  burst: 0.75, // the wall has given way
  gone: 0.9, // the empty wall has collapsed
}

const ease = (u) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}
const span = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)))
const lerp = (a, b, u) => a + (b - a) * u

// The clearing nearest the middle of the stage with `needUm` of empty slide
// round it.
function clearing(cells, needUm) {
  let best = null
  let freest = null
  for (let gx = -70; gx <= 70; gx += 2) {
    for (let gy = -50; gy <= 50; gy += 2) {
      let free = Infinity
      for (const c of cells) free = Math.min(free, Math.hypot(c.x - gx, c.y - gy) - c.r)
      if (!freest || free > freest.free) freest = { x: gx, y: gy, free }
      if (free < needUm) continue
      const d = Math.hypot(gx, gy)
      if (!best || d < best.d) best = { x: gx, y: gy, free, d }
    }
  }
  return best ?? freest
}

// The masses a protoplast of radius `inner` cleaves into, level by level: each
// mass is cut in two by a furrow across its longest spread, each half in two
// again, and so on. A mass is not a new sphere but its piece of the protoplast:
// the protoplast's sphere, cut by the furrows of every division it came from —
// one plane per division, so sixteen masses need four each, which is what the
// renderer carries. The furrows are drawn upright, square to the slide: seen
// from above, a mass is then a piece of the disc, and a cleaving cell a mosaic,
// which is how one reads through the objective.
//
// Each node of the tree keeps the centroid of its piece — worked out on a cloud
// of points, so that zoospores can be put where their masses were — and the
// furrow that divides it: a direction in the slide, `angle`, and a distance
// from the middle of the cell along it, `at`.
function cleavageTree(rnd, inner, levels) {
  const points = []
  while (points.length < 3000) {
    const p = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]
    if (p[0] * p[0] + p[1] * p[1] + p[2] * p[2] <= 1) points.push(p.map((v) => v * inner))
  }
  const centroid = (ps) => [0, 1, 2].map((k) => ps.reduce((sum, p) => sum + p[k], 0) / Math.max(ps.length, 1))
  const split = (ps, depth) => {
    const node = { centre: centroid(ps), children: [] }
    if (depth === levels) return node
    // Across the piece's longest spread in the slide, turned a little at random.
    const c = node.centre
    let xx = 0
    let yy = 0
    let xy = 0
    for (const p of ps) {
      xx += (p[0] - c[0]) ** 2
      yy += (p[1] - c[1]) ** 2
      xy += (p[0] - c[0]) * (p[1] - c[1])
    }
    const long = 0.5 * Math.atan2(2 * xy, xx - yy)
    const angle = long + (rnd() - 0.5) * 0.5
    const n = [Math.cos(angle), Math.sin(angle)]
    const at = n[0] * c[0] + n[1] * c[1]
    node.furrow = { angle, at }
    const below = ps.filter((p) => n[0] * p[0] + n[1] * p[1] < at)
    const above = ps.filter((p) => n[0] * p[0] + n[1] * p[1] >= at)
    node.children = [split(below, depth + 1), split(above, depth + 1)]
    return node
  }
  return split(points, 0)
}

// One side of a furrow as the renderer takes a face: the direction out of the
// piece, and how far along it from the middle of the cell the face lies, drawn
// back by half the gap.
function facing(furrow, side, gap) {
  return side === 0
    ? { angle: furrow.angle, offset: furrow.at - gap / 2 }
    : { angle: furrow.angle + Math.PI, offset: -furrow.at - gap / 2 }
}

// The plan of one loop: where, how big, which way everything goes.
export function buildCycle(form, population) {
  const spec = form.lifeCycle
  const rnd = seededRandom((form.seed ?? 893) + 1987)
  const R = spec.matureUm / 2
  const wall = form.wallUm ?? 0.1
  const inner = R - wall
  const spot = clearing(population.cells, R + spec.clearUm)
  const glassZ = population.glassZ
  const levels = Math.round(Math.log2(spec.zoospores))
  const tree = cleavageTree(rnd, inner * 0.97, levels)
  const leaves = []
  const walk = (node) => (node.children.length ? node.children.forEach(walk) : leaves.push(node))
  walk(tree)

  // The wall gives way on one side, and the zoospores leave through it, the
  // nearest first.
  const tearDir = rnd() * Math.PI * 2
  const mouth = [Math.cos(tearDir), Math.sin(tearDir)]
  const order = leaves
    .map((leaf, i) => ({ i, d: -(leaf.centre[0] * mouth[0] + leaf.centre[1] * mouth[1]) }))
    .sort((a, b) => a.d - b.d)
    .map((o) => o.i)
  const [v0, v1] = spec.speedUm
  const zoospores = leaves.map((leaf, i) => {
    // Out through the tear, then away on a heading of its own, turning now and
    // then: straight runs with occasional turns, as the zoospores of a Hong
    // Kong strain of the species swim (r86).
    const segments = []
    let heading = tearDir + (rnd() - 0.5) * 2.2
    for (let k = 0; k < 10; k++) {
      segments.push({ heading, length: 25 + rnd() * 60 })
      heading += (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.6)
    }
    return {
      leaf,
      exitRank: order.indexOf(i),
      mouthJitter: (rnd() - 0.5) * 1.6,
      speed: v0 + (v1 - v0) * rnd(),
      segments,
      spin: rnd() * Math.PI * 2,
      height: 1.5 + rnd() * 4,
      wobble: rnd() * Math.PI * 2,
      // The masses are columns of the protoplast; the zoospores they become
      // lie at different depths in it.
      lift: (rnd() - 0.5) * R * 0.8,
    }
  })
  // Where each zoospore takes shape: where its mass was, drawn in until the
  // whole zoospore is inside the wall. A mass at the margin has its centroid
  // too near the wall for a body four and a half micrometres long.
  const room = inner * 0.95 - spec.zoospore.lengthUm / 2
  for (const z of zoospores) {
    const [cx, cy] = z.leaf.centre
    const d = Math.hypot(cx, cy, z.lift)
    const k = d > room ? room / d : 1
    z.home = [cx * k, cy * k, z.lift * k]
  }

  // The one that arrives and settles, from somewhere off to the side.
  return {
    spec,
    R,
    inner,
    spot,
    glassZ,
    levels,
    tree,
    tearDir,
    zoospores,
    incoming: { dir: rnd() * Math.PI * 2, speed: v0 * 0.9, wobble: rnd() * Math.PI * 2 },
    seed: rnd(),
    fill: form.lipid.fill[1],
    spacing: form.lipid.spacingUm[0] + 0.3 * (form.lipid.spacingUm[1] - form.lipid.spacingUm[0]),
  }
}

// How far a zoospore has swum `tau` seconds after it cleared the wall: its
// flagella take a moment to get going, then it holds its speed.
function swum(tau, speed, rampS = 0.7) {
  if (tau <= 0) return 0
  if (tau < rampS) return (speed * tau * tau) / (2 * rampS)
  return speed * (rampS / 2 + (tau - rampS))
}

// Where along a chain of straight runs a zoospore is after `distance`.
function alongPath(start, segments, distance) {
  let [x, y] = start
  let left = distance
  let heading = segments[0].heading
  for (const s of segments) {
    heading = s.heading
    const step = Math.min(left, s.length)
    x += Math.cos(heading) * step
    y += Math.sin(heading) * step
    left -= step
    if (left <= 0) break
  }
  return { x, y, heading }
}

// The shape a zoospore is drawn with, 4.1–4.8 × 2.6–3.3 µm (r80), or part of
// the way to a sphere of radius `r0`.
function zoosporeShape(spec, round = 0, r0 = 2) {
  const a = spec.zoospore.lengthUm / 2
  const b = spec.zoospore.widthUm / 2
  return { a: lerp(a, r0, round), b: lerp(b, r0, round), c: lerp(b, r0, round) }
}

// Everything the cycle puts on the stage at phase t: the cell (a whole cell,
// or a wall), the masses the protoplast has cleaved into, and the zoospores.
export function cycleAt(plan, t) {
  const { spec, R, inner, spot, glassZ } = plan
  const T = CYCLE_T
  const seconds = spec.seconds
  const now = t * seconds
  const out = { mother: null, masses: [], zoospores: [] }

  // ── A zoospore arrives and settles ──
  if (t < T.cyst) {
    const arrive = T.settle * seconds
    const brake = 0.9
    const v = plan.incoming.speed
    const total = v * (arrive - brake) + (v * brake) / 2
    const dist =
      now < arrive - brake ? v * now : total - (v * (arrive - Math.min(now, arrive)) ** 2) / (2 * brake)
    const dir = [Math.cos(plan.incoming.dir), Math.sin(plan.incoming.dir)]
    const left = total - Math.min(dist, total)
    const side = Math.sin(now * 5 + plan.incoming.wobble) * 0.6 * Math.min(1, left / 20)
    const round = ease(span(t, T.settle + 0.01, T.cyst))
    const shape = zoosporeShape(spec, round, spec.cystUm / 2)
    out.zoospores.push({
      x: spot.x - dir[0] * left - dir[1] * side,
      y: spot.y - dir[1] * left + dir[0] * side,
      z: glassZ + lerp(3.5, shape.c, ease(span(t, T.settle - 0.02, T.cyst))),
      heading: plan.incoming.dir + Math.sin(now * 3 + plan.incoming.wobble) * 0.15 * Math.min(1, left / 10),
      ...shape,
      flagella: 1 - ease(span(t, T.settle, T.settle + 0.02)),
      beat: now,
    })
    return out
  }

  // ── The cyst grows into a mature cell and fills with oil ──
  if (t < T.grown) {
    const u = span(t, T.cyst, T.grown)
    const r0 = spec.cystUm / 2
    const r = Math.cbrt(lerp(r0 ** 3, R ** 3, u))
    out.mother = { x: spot.x, y: spot.y, z: glassZ + r, r, kind: 0, fill: lerp(0.35, plan.fill, u), tear: 0, opacity: 1 }
    return out
  }

  // ── The wall stays; the protoplast inside it cleaves ──
  const wallAt = (scale = 1, opacity = 1, tear = 0) => ({
    x: spot.x,
    y: spot.y,
    z: glassZ + R,
    r: R * scale,
    kind: 1,
    fill: 0,
    tear,
    opacity,
  })
  if (t < T.shaped) {
    out.mother = wallAt()
    if (t < T.cleaved) {
      const u = span(t, T.grown, T.cleaved) * plan.levels
      const level = Math.min(plan.levels - 1, Math.floor(u))
      const f = ease(span(u - level, 0.05, 0.85))
      // Every mass is the protoplast's sphere cut by its furrows, and a furrow
      // opens as it forms: the two halves draw back from it until a gap of
      // `gap` separates them.
      const gap = 0.35
      const pieces = []
      const walk = (node, depth, faces) => {
        if (depth < level) {
          node.children.forEach((child, side) => walk(child, depth + 1, [...faces, facing(node.furrow, side, gap)]))
          return
        }
        node.children.forEach((child, side) => pieces.push([...faces, facing(node.furrow, side, gap * f)]))
      }
      walk(plan.tree, 0, [])
      for (const faces of pieces) {
        out.masses.push({ x: spot.x, y: spot.y, z: glassZ + R, r: inner * 0.97, planes: faces })
      }
      return out
    }
    // The masses take the shape of zoospores inside the wall, and stir. The
    // mosaic of the last division fades as they round up out of it.
    const fadeOut = 1 - ease(span(t, T.cleaved, T.cleaved + 0.015))
    if (fadeOut > 0) {
      const pieces = []
      const walk = (node, faces) => {
        if (!node.children.length) {
          pieces.push(faces)
          return
        }
        node.children.forEach((child, side) => walk(child, [...faces, facing(node.furrow, side, 0.35)]))
      }
      walk(plan.tree, [])
      for (const faces of pieces) {
        out.masses.push({ x: spot.x, y: spot.y, z: glassZ + R, r: inner * 0.97, planes: faces, opacity: fadeOut })
      }
    }
    const u = ease(span(t, T.cleaved, T.shaped))
    const last = inner * 0.97 * Math.pow(2, -plan.levels / 3)
    for (const z of plan.zoospores) {
      const [cx, cy, cz] = z.home
      const shape = zoosporeShape(spec, 1 - u, last * 0.92)
      const jig = u * 0.25
      out.zoospores.push({
        x: spot.x + cx + Math.sin(now * 9 + z.spin) * jig,
        y: spot.y + cy + Math.cos(now * 8 + z.spin) * jig,
        z: glassZ + R + cz,
        heading: z.spin + Math.sin(now * 4 + z.wobble) * 0.3 * u,
        ...shape,
        // Inside the wall there is no room for a flagellum at full length.
        flagella: 0.3 * u,
        beat: now,
      })
    }
    return out
  }

  // ── The zoosporangium bursts and the zoospores leave ──
  const opening = ease(span(t, T.shaped, T.burst))
  const recoil = 1 + 0.05 * Math.sin(Math.PI * opening)
  const collapse = span(t, T.burst, T.gone)
  const fade = 1 - span(t, T.gone, 1)
  out.mother = wallAt(recoil * lerp(1, 0.88, ease(collapse)), lerp(1, 0.55, collapse) * fade, 1.15 * opening)
  const release = (T.shaped + (T.burst - T.shaped) * 0.6) * seconds
  for (const z of plan.zoospores) {
    const [cx, cy, cz] = z.home
    const tau = now - (release + z.exitRank * 0.1)
    const exitAng = plan.tearDir + z.mouthJitter * 0.35
    const exitPt = [spot.x + Math.cos(exitAng) * (R + 1.5), spot.y + Math.sin(exitAng) * (R + 1.5)]
    let x
    let y
    let zz
    let heading
    if (tau < 0.35) {
      // Still inside, or squeezing out through the tear.
      const u = ease(span(tau, 0, 0.35))
      x = lerp(spot.x + cx, exitPt[0], u) + Math.sin(now * 13 + z.spin) * 0.2 * (1 - u)
      y = lerp(spot.y + cy, exitPt[1], u)
      zz = lerp(glassZ + R + cz, glassZ + z.height, u)
      heading = u > 0 ? Math.atan2(exitPt[1] - (spot.y + cy), exitPt[0] - (spot.x + cx)) : z.spin
    } else {
      const p = alongPath(exitPt, z.segments, swum(tau - 0.35, z.speed))
      x = p.x
      y = p.y
      zz = glassZ + z.height + Math.sin(now * 1.3 + z.wobble) * 0.8
      heading = p.heading
    }
    if (Math.hypot(x - spot.x, y - spot.y) > 600) continue
    out.zoospores.push({
      x,
      y,
      z: zz,
      heading: heading + Math.sin(now * 7 + z.wobble) * 0.12,
      ...zoosporeShape(spec),
      // Unfolding as it clears the wall.
      flagella: lerp(0.3, 1, ease(span(tau, 0.1, 0.7))),
      beat: now,
    })
  }
  return out
}
