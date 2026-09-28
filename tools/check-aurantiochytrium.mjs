// Assertions over the Aurantiochytrium culture as drawn — the numbers its cards
// state, held to the measurements they cite.
//
// Most of what is on this slide was measured on the project owner's photograph
// of the culture (r96), which is private: the numbers are in the anatomical
// bill of materials, §2.10, and here. The rest is the species' literature —
// the protologue (r80), a strain from Hong Kong at high glucose (r85), the
// collection's record of RCC893 and its micrograph (r82). The population is
// built by rules rather than typed in, so a change to a rule can quietly stop
// it matching what was measured. This is where that would be said out loud.
// Run with `npm run check`.
import { readFileSync } from 'node:fs'
import species from '../src/species/aurantiochytrium-mangrovei.js'
import { ENDOSYMBIOSES } from '../src/tree.js'
import {
  CYCLE_T,
  DROPLET_K,
  DROPLET_P,
  DROPLET_SHARE,
  buildCycle,
  buildThraustochytrids,
  cycleAt,
  neighbourCounts,
  sizeQuantile,
} from '../src/thraustochytrid.js'

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
const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]

const x = species.exterior
const population = buildThraustochytrids(x)
const { cells } = population
const diameters = cells.map((c) => 2 * c.r).sort((a, b) => a - b)

console.log('aurantiochytrium-mangrovei — the drawn culture against the measurements')

// ── Size ───────────────────────────────────────────────────────────────────

// r96: 230 isolated round cells, measured on their edge. Median 13.2 µm, mean
// 13.4 ± 3.1, 5th–95th percentile 9.5–17.8, extremes 5.7–28.4. The sampler draws
// from the binned histogram, so within a bin the draws are even; the checks
// allow for that.
check('the size distribution has the measured median, 13.2 µm', Math.abs(sizeQuantile(0.5) - 13.2) < 0.2, f(sizeQuantile(0.5)))
check('and its 5th percentile near the measured 9.5 µm', within(sizeQuantile(0.05), 8.7, 10), f(sizeQuantile(0.05)))
check('and its 95th near the measured 17.8 µm', within(sizeQuantile(0.95), 17.3, 18.3), f(sizeQuantile(0.95)))
{
  const n = 20000
  let sum = 0
  for (let i = 0; i < n; i++) sum += sizeQuantile((i + 0.5) / n)
  check('and its mean the measured 13.4 µm', Math.abs(sum / n - 13.4) < 0.15, f(sum / n))
}
check('the drawn cells have the median of the measured ones', Math.abs(quantile(diameters, 0.5) - 13.2) < 0.6,
  f(quantile(diameters, 0.5)))
// r80, r85: from the encysted zoospore, 3.7–4.4 µm, to 45.1 µm in a strain at
// ten per cent glucose — no drawn cell outside what the species does.
check('every drawn cell is inside the sizes the species reaches, 3.7–45.1 µm',
  diameters[0] >= 3.7 && diameters[diameters.length - 1] <= 45.1, `${f(diameters[0])}–${f(diameters[diameters.length - 1])}`)
// r82: the collection's record gives "length 20 µm" — the one cell of its
// micrograph, 19.9 µm on the bar. A large cell of this culture, not a typical one.
{
  const big = diameters.filter((d) => d >= 19.5).length / diameters.length
  check('the collection’s 20 µm cell is a large one here: a few per cent of cells reach it', within(big, 0.005, 0.06), f(big, 3))
}

// ── Density ────────────────────────────────────────────────────────────────

// r96: about 1400 cells to the square millimetre.
{
  const area = population.across * population.down * 1e-6
  const density = cells.length / area
  check('the slide holds about 1400 cells per mm²', Math.abs(density / 1400 - 1) < 0.05, f(density, 0))
  // r84: RCC893's flask cultures near 2 × 10⁷ cells/mL. The slide's number
  // depends on how deep the mount is; the card's 7 × 10⁷ assumes 20 µm.
  const perMl = ((density * 1e-6) / 20) * 1e12
  check('which at a 20 µm mount is the same order as the strain’s flasks', within(perMl / 2e7, 1, 10), `${f(perMl / 1e7, 1)} × 10⁷ /mL`)
}

// ── How the cells lie ──────────────────────────────────────────────────────

// r96: the share of cells whose outline comes within 0.9, 2.4 and 3.9 µm of
// another cell's — 36, 61 and 74 % on the photograph, counted on the interiors
// and corrected to the edges.
const shareWithin = (reach) => {
  const n = neighbourCounts(cells, reach)
  return n.filter((k) => k > 0).length / cells.length
}
for (const [reach, measured] of [[0.9, 0.36], [2.4, 0.61], [3.9, 0.74]]) {
  const drawn = shareWithin(reach)
  check(`${Math.round(measured * 100)} % of cells within ${reach} µm of another, as measured`,
    Math.abs(drawn - measured) < 0.06, `drawn ${f(drawn * 100, 0)} %`)
}
{
  const sizes = population.groups.map((g) => g.length)
  // r80: diad, tetrad, 6–8, often 12; r96: a few groups of about 15.
  check('groups run from pairs to about fifteen cells', Math.min(...sizes) >= 2 && Math.max(...sizes) <= 16,
    `${Math.min(...sizes)}–${Math.max(...sizes)}`)
  const pairs = sizes.filter((n) => n === 2).length / sizes.length
  check('and pairs are the commonest group', sizes.every((n) => sizes.filter((m) => m === 2).length >= sizes.filter((m) => m === n).length),
    `pairs are ${f(pairs * 100, 0)} % of groups`)
}
// r96: cells in groups are as large as cells alone (12.7 against 12.6 µm).
{
  const inGroups = cells.filter((c) => c.group >= 0).map((c) => 2 * c.r).sort((a, b) => a - b)
  const alone = cells.filter((c) => c.group < 0).map((c) => 2 * c.r).sort((a, b) => a - b)
  check('cells in groups are as large as cells alone', Math.abs(quantile(inGroups, 0.5) - quantile(alone, 0.5)) < 1,
    `${f(quantile(inGroups, 0.5))} against ${f(quantile(alone, 0.5))} µm`)
}
// A face two pressed cells share lies between their centres, inside both.
{
  const bad = cells.filter((c) => c.planes.some((p) => !(p.offset > 0 && p.offset < c.r)))
  check('every flat face lies inside its cell, between the two centres', bad.length === 0, `${bad.length} cells`)
  check('no cell carries more faces than the renderer draws', cells.every((c) => c.planes.length <= 4))
}
// Cells of different groups touch, but do not run into each other.
{
  let worst = Infinity
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i]
      const b = cells[j]
      if (a.group >= 0 && a.group === b.group) continue
      worst = Math.min(worst, Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r)
    }
  }
  check('cells that are not one group’s do not overlap', worst >= 0, `closest ${f(worst)} µm`)
}

// ── On the glass ───────────────────────────────────────────────────────────

// Nothing floats: the literature allows lipid-rich cells of the species to
// float (r85), and none has been seen in this strain.
check('every cell rests on the slide, its middle one radius above the glass',
  cells.every((c) => Math.abs(c.z - population.glassZ - c.r) < 1e-9))
// The card: the plane of focus is just under the middle of a median cell.
{
  const median = quantile(diameters, 0.5) / 2
  const plane = x.focus.aboveGlassUm
  check('the plane of focus is just under the middle of a median cell', plane < median && median - plane < 2,
    `${f(plane, 1)} µm above the glass against a median middle at ${f(median, 1)}`)
}

// ── Oil ────────────────────────────────────────────────────────────────────

{
  // The card: droplets 0.8–2.1 µm. r82 shows about 1 µm in a culture kept for
  // weeks, r85 1.5–4 µm after two days at 1 % glucose, and the drawn culture's
  // texture has a grain of 1.5–3 µm (r96).
  const [s0, s1] = x.lipid.spacingUm
  const smallest = 2 * s0 * DROPLET_K[0] * DROPLET_P[0]
  const largest = 2 * Math.min(s1 * DROPLET_K[1] * DROPLET_P[1], 0.47 * s1)
  check('droplets are drawn 0.8–2.1 µm across, as the card says', within(smallest, 0.7, 0.85) && within(largest, 1.95, 2.15),
    `${f(smallest)}–${f(largest)} µm`)
  check('no droplet touches its neighbour: none wider than 0.94 of a site', DROPLET_K[1] * DROPLET_P[1] <= 0.5)
  // The card: about a fifth of the cell. r86: lipid is 38–53 % of the dry mass
  // of the species, and a hydrated cell's volume share must be under that.
  const [q0, q1] = x.lipid.fill
  const share = [q0 * DROPLET_SHARE, q1 * DROPLET_SHARE]
  check('the oil is about a fifth of the cell’s volume', within(share[0], 0.15, 0.25) && within(share[1], 0.15, 0.25),
    `${f(share[0], 3)}–${f(share[1], 3)}`)
  check('and under the lipid share of the dry mass, 38 %', share[1] < 0.381)

  // Colour: a median cell keeps a few per cent less blue than green through
  // its middle — the ~5 % of the collection's micrograph (r82), the few per
  // cent the photograph leaves once its objective's colour error is taken
  // away (r96). Display ratios, through the oil the middle of the cell holds.
  const [, g, b] = x.lipid.perUm
  const path = ((q0 + q1) / 2) * DROPLET_SHARE * 13.2
  const blue = Math.pow(b / g, path)
  check('a median cell keeps 94–97 % as much blue as green through its middle', within(blue, 0.94, 0.97), f(blue, 3))
  check('red is not absorbed', x.lipid.perUm[0] === 1)
}

// ── The life cycle ─────────────────────────────────────────────────────────

{
  const spec = x.lifeCycle
  const plan = buildCycle(x, population)
  // r80: the encysted zoospore is 3.7–4.4 µm; the zoospores 4.1–4.8 × 2.6–3.3.
  check('the cyst is the protologue’s 3.7–4.4 µm', within(spec.cystUm, 3.7, 4.4), `${spec.cystUm} µm`)
  check('the zoospores are 4.1–4.8 µm long', within(spec.zoospore.lengthUm, 4.1, 4.8), `${spec.zoospore.lengthUm} µm`)
  check('and 2.6–3.3 µm wide', within(spec.zoospore.widthUm, 2.6, 3.3), `${spec.zoospore.widthUm} µm`)
  // r80: the long flagellum is the anterior one.
  check('the anterior flagellum is the longer', spec.zoospore.flagellaUm[0] > spec.zoospore.flagellaUm[1])
  // r80: a protoplast cleaves exactly into 2, 4, 8, 16 or rarely 32.
  check('the protoplast cleaves into a power of two, at most 32',
    [2, 4, 8, 16, 32].includes(spec.zoospores) && plan.zoospores.length === spec.zoospores, `${plan.zoospores.length}`)
  // r96: the cell that becomes a zoosporangium is the culture's median cell.
  check('the zoosporangium is a cell of the measured median size', Math.abs(spec.matureUm - 13.2) < 1e-9)
  // r86: straight-line speeds up to 125 µm/s; 151 µm/s along the path.
  check('the zoospores swim no faster than measured, 125 µm/s in a straight line',
    spec.speedUm[1] <= 125 && plan.zoospores.every((z) => z.speed <= 125), `${spec.speedUm.join('–')} µm/s`)
  // The cycle plays in empty slide: nothing of the culture under it.
  {
    const free = Math.min(...cells.map((c) => Math.hypot(c.x - plan.spot.x, c.y - plan.spot.y) - c.r))
    check('the cycle plays in a clearing, clear of every cell by a mature radius and more', free >= plan.R + spec.clearUm - 1e-9,
      `${f(free, 1)} µm free`)
  }
  // The stages come in order and are named in order.
  const order = ['settle', 'cyst', 'grown', 'cleaved', 'shaped', 'burst', 'gone'].map((k) => CYCLE_T[k])
  check('the stages of the cycle come in order', order.every((v, i) => i === 0 || v > order[i - 1]) && order[order.length - 1] < 1)
  check('and the panel names them in the same order', spec.stages.every((st, i) => i === 0 || st.at > spec.stages[i - 1].at))
  // The zoosporangium holds its masses inside its wall until it bursts.
  {
    for (const at of [0.2, 0.5, 0.8, 0.999]) {
      const m = cycleAt(plan, CYCLE_T.grown + (CYCLE_T.cleaved - CYCLE_T.grown) * at)
      const inside = m.masses.every(
        (b) => Math.hypot(b.x - plan.spot.x, b.y - plan.spot.y, b.z - (plan.glassZ + plan.R)) + b.r <= plan.R + 1e-9,
      )
      check(`${f(at * 100, 0)} % through cleavage, every mass is a piece of the protoplast inside the wall`,
        m.masses.length > 0 && inside, `${m.masses.length} masses`)
      const n = m.masses.length
      check(`  and there are a power of two of them, each cut by one furrow per division`,
        (n & (n - 1)) === 0 && m.masses.every((b) => b.planes.length === Math.log2(n)), `${n}`)
    }
  }
  // The zoospores take shape inside the wall, and stay inside it until it bursts.
  for (const at of [CYCLE_T.cleaved + 0.001, (CYCLE_T.cleaved + CYCLE_T.shaped) / 2, CYCLE_T.shaped - 0.001]) {
    const m = cycleAt(plan, at)
    const worst = Math.max(
      ...m.zoospores.map((z) => Math.hypot(z.x - plan.spot.x, z.y - plan.spot.y, z.z - (plan.glassZ + plan.R)) + z.a),
    )
    check(`the zoospores forming at ${f(at, 3)} are all inside the wall`, m.zoospores.length === spec.zoospores && worst <= plan.R,
      `${f(worst)} against a wall of ${f(plan.R)} µm`)
  }
  // After the burst the zoospores leave, and by the time the wall has
  // collapsed they are out of a close view — which is the speed, not a choice.
  {
    const gone = cycleAt(plan, CYCLE_T.gone)
    const nearest = Math.min(...gone.zoospores.map((z) => Math.hypot(z.x - plan.spot.x, z.y - plan.spot.y)), Infinity)
    check('by the time the wall has collapsed, every zoospore has left a 60 µm view', nearest > 30, `${f(nearest, 0)} µm`)
    const early = cycleAt(plan, 0)
    check('the cycle opens with a single zoospore arriving and no cell', early.zoospores.length === 1 && !early.mother)
  }
}

// ── The organism ───────────────────────────────────────────────────────────

check('it is drawn under Labyrinthulomycota, in SAR', species.lineage.supergroup === 'SAR' && species.lineage.phylum === 'Labyrinthulomycota')
// The absence is the point: no plastid, and no endosymbiosis into its branch.
check('no endosymbiosis arrow runs into its lineage or its genus',
  ENDOSYMBIOSES.every((e) => e.to !== 'Labyrinthulomycota' && e.to !== 'Aurantiochytrium' && e.from !== 'Aurantiochytrium'))
check('its cards cite the protologue, the collection’s record and the photograph',
  ['r80', 'r82', 'r96'].every((id) => Object.values(species.structures).some((c) => c.sources.includes(id))))
// The owner's photograph stays out of the repository.
check('the owner’s photograph is ignored by git',
  readFileSync(new URL('../.gitignore', import.meta.url), 'utf8').split(/\r?\n/).includes('docs/fonti/utente-*.jpg'))

console.log()
if (failures) {
  console.error(`${failures} of ${checks} checks failed`)
  process.exit(1)
}
console.log(`${checks} checks passed`)
