// Assertions over the Phaeodactylum culture as drawn — the numbers its cards
// state, held to the measurements they cite.
//
// Most of what is on this slide is drawn from a distribution rather than typed
// in: every cell's length, its proportions, its plastid's share of it, its
// droplets, where it hangs in the drop. So the claims the cards make are claims
// about a population, and a population can drift away from them without
// anything looking wrong — a change to the outline that thins the arms, a
// plastid that no longer fits and is shrunk until it does, a seed that puts the
// ovals somewhere else. This is where that would be said out loud. Run with
// `npm run check`.
import * as THREE from 'three'
import form from '../src/species/phaeodactylum-tricornutum.js'
import {
  DROPLET_SLOTS,
  buildPennates,
  cellVolume,
  dropletAcross,
  plastidBase,
  plastidProfile,
  radiusAt,
  typicalCell,
  typicalOval,
} from '../src/pennate.js'
import { ENDOSYMBIOSES } from '../src/tree.js'

let failures = 0
let checks = 0

function check(name, condition, detail = '') {
  checks++
  if (condition) return
  failures++
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

const within = (v, lo, hi) => v >= lo && v <= hi
const f = (v, d = 2) => v.toFixed(d)
const mid = ([lo, hi]) => (lo + hi) / 2
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const quantile = (a, p) => {
  const s = [...a].sort((u, v) => u - v)
  return s[Math.round(p * (s.length - 1))]
}

const x = form.exterior
const C = x.cell
const population = buildPennates(x)
const { cells, glassZ } = population
const fusiform = cells.filter((c) => c.morph === 'fusiform')
const ovals = cells.filter((c) => c.morph === 'oval')
const axisOf = (c) => new THREE.Vector3(0, 1, 0).applyQuaternion(c.q)

console.log('phaeodactylum-tricornutum — the drawn culture against the measurements')

// ── The fusiform cell ──────────────────────────────────────────────────────

const lengths = fusiform.map((c) => 2 * c.shape.H)
// r103: Pt1 in brightfield, 2500–8000 cells a sample, a mean of 22.6–23.5 µm
// over eleven days.
check('the drawn cells’ mean length is Pt1’s measured 22.6–23.5 µm',
  within(mean(lengths), 22.6, 23.5), f(mean(lengths)))
// r106: 10–15 µm in the shortest of seventeen accessions, 25–30 in the longest.
check('every drawn length is inside the species’ 10–30 µm',
  lengths.every((L) => within(L, 10, 30)), `${f(Math.min(...lengths), 1)}–${f(Math.max(...lengths), 1)}`)

// r102: whole Pt1 cells reconstructed by FIB-SEM, 13–15 µm long, 32.6 ± 2.4
// µm³. A cell of those lengths at the record's middle proportions has to hold
// it: the volume is what the body's width was chosen against.
{
  const at = (L) => {
    const H = L / 2
    const s = { H, B: mid(C.bodyOfLength) * H, Rb: mid(C.bodyWidthUm) / 2, ra: mid(C.armUm) / 2, rt: 0 }
    s.rt = s.ra * mid(C.tipOfArm)
    return cellVolume(s)
  }
  const v = mean([13, 14, 15].map(at))
  check('a cell of 13–15 µm holds the FIB-SEM volume, 32.6 ± 2.4 µm³', within(v, 32.6 - 2.4, 32.6 + 2.4), f(v, 1))
}

// r111 / r103: the body is 2.4–3.0 µm across on the micrograph and 3.5–4 µm in
// counts that include the edge the blur adds; drawn between the two.
check('every body is between the micrograph’s 2.4 µm and the counts’ 4 µm across',
  fusiform.every((c) => within(2 * c.shape.Rb, 2.4, 4)))

// r111: the arms are 0.9–1.0 µm across at mid-arm on the micrograph, measured
// as far as the cell departs from the field — which counts the blur and the
// pale line outside each wall. The drawn tube is narrower than that by about
// the blur, and drawn, the median arm reads 1.0 µm between its two wall lines
// at the cell card's zoom.
{
  const arms = fusiform.map((c) => 2 * radiusAt((c.shape.B + c.shape.H) / 2, c.shape))
  check('the median arm is 0.8–0.95 µm across at mid-arm, under the micrograph’s 0.9–1.0',
    within(quantile(arms, 0.5), 0.8, 0.95), f(quantile(arms, 0.5), 3))
  check('and no arm is wider than the micrograph’s widest', Math.max(...arms) <= 1.0, f(Math.max(...arms), 3))
  check('every arm is under half the body’s width — a spindle with arms, not a lemon',
    fusiform.every((c) => 2 * c.shape.ra < c.shape.Rb))
}

// ── The plastid and the nucleus ────────────────────────────────────────────

// r102: the plastid is 33.7 ± 1.8 % of the cell in Pt1 at low light. A plastid
// that does not fit inside its cell is shrunk until it does, and the share it
// ends with is the one recorded — so the shrinking is what this watches.
{
  const shares = fusiform.map((c) => c.plastid.share)
  check('the median plastid is 33.7 ± 3.6 % of its cell', within(quantile(shares, 0.5), 0.301, 0.373),
    f(quantile(shares, 0.5), 3))
  check('and nine cells in ten keep at least a quarter of their volume in it', quantile(shares, 0.1) >= 0.25,
    f(quantile(shares, 0.1), 3))
}

// Every plastid inside its protoplast, at every station along the cell: its
// section is an ellipse of semi-axes a·f and b·f, centred o·base out along P1.
{
  const outside = cells.filter((c) => {
    const p = c.plastid
    for (let i = 0; i <= 400; i++) {
      const xs = -c.shape.H + (i / 400) * 2 * c.shape.H
      const fx = plastidProfile(xs, p)
      if (fx <= 0) continue
      const reach = Math.max(p.o * plastidBase(xs, p) + p.a * fx, p.b * fx)
      if (reach > radiusAt(xs, c.shape) - c.wall + 1e-6) return true
    }
    return false
  })
  check('every plastid lies inside its protoplast', outside.length === 0, `${outside.length} cells`)
}

// r102: the nucleus is 6.2 ± 0.7 % of the cell.
{
  const shares = cells.map((c) => ((4 / 3) * Math.PI * c.nucleus.r ** 3) / c.volume)
  check('every nucleus is 6.2 ± 0.7 % of its cell', shares.every((s) => within(s, 0.055, 0.069)),
    `${f(Math.min(...shares), 3)}–${f(Math.max(...shares), 3)}`)
  check('and fits inside the body', cells.every((c) => Math.abs(c.nucleus.x) * c.shape.Rb + c.nucleus.r <= c.shape.Rb - c.wall + 1e-6))
}

// ── Lipid droplets ─────────────────────────────────────────────────────────

// r103: with nitrogen to spare, 3.6 ± 2.1 droplets a cell, 0.09 ± 0.04 µm³
// each. The renderer has DROPLET_SLOTS of them, and the count is drawn so that
// its mean once capped is still the measured one.
{
  const counts = fusiform.map((c) => c.droplets.length)
  check('the drawn cells carry 3.6 droplets on average', within(mean(counts), 3.3, 3.9), f(mean(counts)))
  check('and none more than the renderer has room for', Math.max(...counts) <= DROPLET_SLOTS, `${Math.max(...counts)}`)
  const volumes = fusiform.flatMap((c) => c.droplets.map((d) => (4 / 3) * Math.PI * d.r ** 3))
  check('a droplet is 0.09 µm³ at the median', within(quantile(volumes, 0.5), 0.07, 0.11), f(quantile(volumes, 0.5), 3))
  const loose = fusiform.filter((c) =>
    c.droplets.some((d) => {
      const at = d.u * c.shape.H
      const local = radiusAt(at, c.shape) - c.wall
      const across = Math.abs(dropletAcross(at, d.r, c.shape, c.wall)) * local
      return across + d.r > local + 0.03
    }))
  check('every droplet fits inside its cell where it is drawn', loose.length === 0, `${loose.length} cells`)
}

// ── The culture ────────────────────────────────────────────────────────────

// r100: Pt1 and the other accessions of its genotype are 95–100 % fusiform in
// standard conditions; ovals turn up now and then (r99, r112), and no
// triradiate cell is documented in the strain.
check('Pt1 is 95–100 % fusiform', fusiform.length / cells.length >= 0.95, f(fusiform.length / cells.length, 3))
check('with an oval cell now and then', ovals.length > 0)
check('and nothing else', cells.every((c) => c.morph === 'fusiform' || c.morph === 'oval'))

// r99: the ovals are the benthic form and stick to the glass; the fusiform
// cells do not.
check('every oval lies on the slide', ovals.every((c) => Math.abs(c.z - c.shape.Rb - glassZ) < 1e-6))
check('flat on it', ovals.every((c) => Math.abs(axisOf(c).z) < 1e-6))
// r99 / r98: it sticks by its raphe, usually in the hypotheca, and its plastid
// is on the epivalve side — so the plastid faces the objective.
check('with its plastid on the side away from the glass',
  ovals.every((c) => new THREE.Vector3(1, 0, 0).applyQuaternion(c.q).z > 0.999))
// r111, and about 8 × 3 µm in the first description.
check('every oval is the micrograph’s size, 5.4–8 × 2.8–3.2 µm',
  ovals.every((c) => within(2 * c.shape.H, 5.4, 8) && within(2 * c.shape.Rb, 2.8, 3.2)))
check('and its plastid fills much of it, about a third of its volume or more',
  ovals.every((c) => c.plastid.share >= 0.3), f(Math.min(...ovals.map((c) => c.plastid.share)), 3))
// The oval card's plane of focus is fitted below the cell's middle, and it has
// to stay inside the cell for that to mean anything.
check('the oval card focuses inside the cell, below its middle',
  ovals.every((c) => x.oval.focusBelowUm > 0 && x.oval.focusBelowUm < c.shape.Rb))

// r104: a culture with nutrients to spare does not sink, so the fusiform cells
// are spread through the whole gap rather than settled on the slide.
{
  const inGap = fusiform.every((c) => within(c.z, glassZ, glassZ + x.depthUm))
  const lower = fusiform.filter((c) => c.z < glassZ + x.depthUm / 2).length / fusiform.length
  check('every fusiform cell hangs inside the drop', inGap)
  check('and they are not settled: each half of the gap holds 40–60 % of them', within(lower, 0.4, 0.6), f(lower, 3))
}

// r112: 130–180 cells in about 0.032 mm² of the photograph of a Pt1 culture.
{
  const density = cells.length / (population.across * population.down * 1e-6)
  check('the drawn density is the photograph’s', Math.abs(density / x.cellsPerMm2 - 1) < 0.01, f(density, 0))
  check('which is the 130–180 cells it counted in 0.032 mm²', within(x.cellsPerMm2 * 0.032, 130, 180),
    f(x.cellsPerMm2 * 0.032, 0))
}

// ── The cards' cameras ─────────────────────────────────────────────────────

// Each card flies to a cell picked out of the population, and the pickers fall
// back to whatever is first when nothing qualifies — which would put the
// division card on a cell that is not dividing without anything failing.
{
  const cell = typicalCell(population)
  const dividing = typicalCell(population, { dividing: true })
  const oval = typicalOval(population)
  check('the cell cards look at an undivided fusiform cell', cell.morph === 'fusiform' && cell.plastid.pinch === 0 && !cell.pair)
  check('lying near flat', Math.abs(axisOf(cell).z) <= 0.12, f(axisOf(cell).z, 3))
  check('the division card at one whose plastid is dividing', dividing.morph === 'fusiform' && dividing.plastid.pinch > 0)
  check('the oval card at an oval', oval.morph === 'oval')
}

// ── The tree ───────────────────────────────────────────────────────────────

// The species' plastid is red-algal, and the landing page's tree says so.
check('the tree draws the red-algal plastid into the diatoms',
  ENDOSYMBIOSES.some((e) => e.from === 'Rhodophyta' && e.to === 'Bacillariophyta' && e.kind === 'red'))

console.log()
if (failures) {
  console.error(`${failures} of ${checks} checks failed`)
  process.exit(1)
}
console.log(`${checks} checks passed`)
