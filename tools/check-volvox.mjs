// Assertions over the Volvox drop as drawn — the numbers its cards state, held
// to the description of the species and to what the footage measured.
//
// The drop is built, not typed: every colony's size, cell count and brood are
// drawn from the record, and the drop is packed until no two colonies share any
// water. So the cards' claims are consequences of the code, and a consequence
// can stop being true when a range or the packing is touched. This is where it
// would stop being true out loud. Run with `npm run check`.
import record from '../src/species/volvox-aureus.js'
import {
  buildColonies,
  colonyPose,
  latticePoint,
  nearestLatticePoint,
  newPose,
  spacingUm,
  tileOf,
} from '../src/volvocine.js'
import { seededRandom } from '../src/science.js'

let failures = 0
let checks = 0

function check(name, condition, detail = '') {
  checks++
  if (condition) return
  failures++
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

const within = (v, lo, hi) => v >= lo && v <= hi
const f = (v, d = 1) => v.toFixed(d)
const x = record.exterior
const { colonies, tile } = buildColonies(x)
const mature = colonies.filter((c) => c.stage !== 'young')
const all = (list, ok) => list.every(ok)

console.log('volvox-aureus — the drawn drop against the species and the footage')

// ── The lattice ────────────────────────────────────────────────────────────
//
// The shader finds the cells near a ray with the closed-form inverse of the
// spherical Fibonacci lattice. If that lookup ever misses the nearest point, the
// cells it misses are drawn as holes in the layer.
{
  const rnd = seededRandom(91)
  let missed = 0
  let tried = 0
  for (const n of [500, 1000, 1700, 2400, 3200]) {
    const points = Array.from({ length: n }, (_, i) => latticePoint(i, n))
    for (let t = 0; t < 400; t++) {
      const z = rnd() * 2 - 1
      const a = rnd() * Math.PI * 2
      const s = Math.sqrt(1 - z * z)
      const p = [Math.cos(a) * s, Math.sin(a) * s, z]
      let best = 0
      let bestD = Infinity
      points.forEach((q, i) => {
        const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      tried++
      if (nearestLatticePoint(p, n) !== best) missed++
    }
  }
  check('the closed-form lattice lookup finds the nearest cell every time', missed === 0, `${missed} of ${tried}`)
}

// ── Colonies ───────────────────────────────────────────────────────────────

// r65: mature colonies 400–600 µm; young ones released at 150–175 µm.
check('every mature colony is 400–600 µm across', all(mature, (c) => within(2 * c.radiusUm, 400, 600)))
check('no colony is smaller than a released juvenile, 150 µm',
  all(colonies, (c) => 2 * c.radiusUm >= 150), f(Math.min(...colonies.map((c) => 2 * c.radiusUm))))
// r65: 500–3200 cells in one layer.
check('every colony has 500–3200 cells', all(colonies, (c) => within(c.layer.cells, 500, 3200)))
// Cells in one layer, not piled: a cell is never wider than the spacing the
// count leaves it.
check('no two somatic cells overlap', all(colonies, (c) => c.layer.cellUm <= c.layer.spacingUm))
{
  const spacings = mature.map((c) => c.layer.spacingUm)
  const lo = Math.min(...spacings)
  const hi = Math.max(...spacings)
  // The somatic cells card states the range.
  check('a mature colony’s cells are 15–36 µm apart, as the card says', within(lo, 15, 36) && within(hi, 15, 36),
    `${f(lo)}–${f(hi)} µm`)
  check('and that follows from the count and the radius, hexagonally packed',
    all(colonies, (c) => Math.abs(spacingUm(c.layer.radiusUm, c.layer.cells) - c.layer.spacingUm) < 1e-9))
}
// The matrix card: the somatic cells are under one per cent of a mature
// colony's volume, the rest matrix — which is V. carteri's 99 % (r69).
{
  const share = (c) => (c.layer.cells * (c.layer.cellUm / 2) ** 3) / c.radiusUm ** 3
  const worst = Math.max(...mature.map(share))
  check('somatic cells are under 1 % of a mature colony’s volume', worst < 0.01, `${f(worst * 100, 2)} %`)
}

// ── Offspring ──────────────────────────────────────────────────────────────

// r65: four to twelve gonidia, in the posterior half.
check('every colony carries 4–12 offspring', all(colonies, (c) => within(c.offspring.length, 4, 12)),
  colonies.filter((c) => !within(c.offspring.length, 4, 12)).map((c) => c.offspring.length).join(', '))
check('all of them in the posterior half', all(colonies, (c) => all(c.offspring, (o) => o.at[2] <= 1e-6)))
check('a colony’s brood is all at one stage',
  all(colonies, (c) => new Set(c.offspring.map((o) => o.kind)).size <= 1))
// r65: gonidia 18–22 µm; an embryo is a gonidium's size, since it cleaves
// without growing; a juvenile is released at 150–175 µm and not before.
const kids = colonies.flatMap((c) => c.offspring.map((o) => ({ ...o, parent: c })))
check('every gonidium and every embryo is 18–22 µm',
  all(kids.filter((o) => o.kind !== 'juvenile'), (o) => within(2 * o.radiusUm, 18, 22)))
check('no juvenile is larger than the 175 µm of release', all(kids.filter((o) => o.kind === 'juvenile'), (o) => 2 * o.radiusUm <= 175))
check('every offspring lies inside its parent’s layer',
  all(kids, (o) => Math.hypot(...o.at) + o.radiusUm <= o.parent.layer.radiusUm - o.parent.layer.cellUm / 2 + 1e-6))
check('no two offspring of one colony overlap',
  all(colonies, (c) => c.offspring.every((a, i) => c.offspring.every((b, j) =>
    i >= j || Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1], a.at[2] - b.at[2]) >= a.radiusUm + b.radiusUm))))
check('an offspring’s cells do not overlap either',
  all(kids.filter((o) => o.layer), (o) => o.layer.cellUm <= o.layer.spacingUm * 1.1 + 1e-9))

// ── Against the footage ────────────────────────────────────────────────────

// The footage: in twelve colonies with young showing, ten carry juveniles a
// sixth to a fifth of the parent's diameter and one a third; one colony
// carries small bright bodies; one shows none.
{
  const ratios = colonies
    .filter((c) => c.stage === 'juveniles')
    .flatMap((c) => c.offspring.map((o) => o.radiusUm / c.radiusUm))
    .sort((a, b) => a - b)
  const median = ratios[Math.floor(ratios.length / 2)]
  check('a juvenile’s diameter is, in the middle of the drop, a sixth to a quarter of its parent’s',
    within(median, 1 / 6, 1 / 4), f(median, 3))
  check('and none is much more than a third', ratios[ratios.length - 1] <= 0.4, f(ratios[ratios.length - 1], 3))
  const share = (s) => colonies.filter((c) => c.stage === s).length / colonies.length
  check('four colonies in five carry juveniles, as in the footage', within(share('juveniles'), 0.7, 0.9), f(share('juveniles'), 2))
}
// The framing: a mature colony spans about 0.43 of the frame's height.
{
  const mean = mature.reduce((s, c) => s + 2 * c.radiusUm, 0) / mature.length
  check('a colony spans about four tenths of the frame, as in the footage',
    within(mean / x.fieldUm, 0.38, 0.48), f(mean / x.fieldUm, 2))
}
// The crowding: 28 % of the footage's frame is empty ground. Counted here over
// frames of the drawn size and the widest desktop aspect, across the block.
{
  const H = x.fieldUm
  const W = H * 1.75
  let empty = 0
  let n = 0
  for (let fx = -2; fx <= 2; fx++) {
    for (let fy = -1; fy <= 1; fy++) {
      for (let i = 0; i < 40; i++) {
        for (let j = 0; j < 24; j++) {
          const px = fx * W * 0.9 + (i / 39 - 0.5) * W
          const py = fy * H * 0.8 + (j / 23 - 0.5) * H
          n++
          const hit = colonies.some((c) => {
            let dx = Math.abs(c.home[0] - px)
            let dy = Math.abs(c.home[1] - py)
            dx = Math.min(dx, tile[0] - dx)
            dy = Math.min(dy, tile[1] - dy)
            return Math.hypot(dx, dy) < c.radiusUm
          })
          if (!hit) empty++
        }
      }
    }
  }
  check('about the footage’s 28 % of the frame is empty ground', within(empty / n, 0.2, 0.36), f(empty / n, 2))
}
// Packed, not piled: no two colonies share any water, and every one fits
// between the slide and the coverslip.
{
  let clash = 0
  for (let i = 0; i < colonies.length; i++) {
    for (let j = i + 1; j < colonies.length; j++) {
      const a = colonies[i].home
      const b = colonies[j].home
      let dx = Math.abs(a[0] - b[0])
      let dy = Math.abs(a[1] - b[1])
      dx = Math.min(dx, tile[0] - dx)
      dy = Math.min(dy, tile[1] - dy)
      if (Math.hypot(dx, dy, a[2] - b[2]) < colonies[i].radiusUm + colonies[j].radiusUm - 1) clash++
    }
  }
  check('no two colonies share any water', clash === 0, `${clash} pairs`)
  check('every colony fits between the slide and the coverslip',
    all(colonies, (c) => Math.abs(c.home[2]) + c.radiusUm + 2 * c.wander[2] <= x.depthUm / 2 + 1e-6))
  const [across, down] = tileOf(x)
  check('the drop holds the density the record states, within what packing loses',
    colonies.length >= 0.9 * Math.round(across * down * x.depthUm * x.coloniesPerMl * 1e-12), `${colonies.length} colonies`)
}

// ── Movement ───────────────────────────────────────────────────────────────

// The footage: a turn every ten to twenty seconds, anticlockwise on screen.
check('every colony turns once every 10–20 s', all(colonies, (c) => within((2 * Math.PI) / Math.abs(c.spinRate), 10, 20.5)))
check('all in the same sense', new Set(colonies.map((c) => Math.sign(c.spinRate))).size === 1)
// r72: colonies swim upwards — the anterior pole tipped towards the objective.
check('every colony’s anterior points up, towards the objective',
  all(colonies, (c) => colonyPose(c, 0, newPose()).axis.z > Math.cos(x.axis.tiltRad + 0.1)))
{
  // Anticlockwise on screen, with the anterior towards the lens: a point on the
  // colony moves from +x towards +y. Checked on a colony turned to face the
  // lens exactly.
  const c = { ...colonies[0], axis: [0, 0, 1], wobble: 0, spin: 0, spinRate: Math.abs(colonies[0].spinRate) * Math.sign(x.spin.sense) }
  const a = colonyPose(c, 0, newPose()).e1.clone()
  const b = colonyPose(c, 0.5, newPose()).e1
  check('and anticlockwise on screen, as in the footage', a.x * b.y - a.y * b.x > 0)
}

console.log()
if (failures) {
  console.error(`${failures} of ${checks} checks failed`)
  process.exit(1)
}
console.log(`${checks} checks passed`)
