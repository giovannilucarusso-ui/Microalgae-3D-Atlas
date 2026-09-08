// What the thylakoid generator actually produced.
//
// Written after a pass in which the interior was opened up, because the thing
// that had to be measured was not the number of lamellae — it was their height.
// A sheet 3.9 µm tall standing 56 nm from the next one hides sixteen of its
// neighbours at thirty degrees off vertical, and that arithmetic does not
// depend on the spacing at all, so no amount of thinning the stack could ever
// have opened the cell. The numbers below are the ones to watch when the
// generator is touched: mean height against the full 2 × subSeptal, and the
// membrane area, which is what "some of the thylakoids have been removed"
// actually means.
//
// The lamella count is the other one to watch. There is a single set now, drawn
// at two thicknesses, so this figure is what the cell shows at every distance —
// there is no longer a sparser tier hiding the real number at whole-cell zoom.
//
//   node tools/lamellae.mjs
//
import { thylakoidLamellae } from '../src/geometry.js'
import { ZONES, THYLAKOID, CUTAWAY } from '../src/science.js'

// One face of one sac: arc length along the run times the height it spans.
const area = (lamellae) => {
  let a = 0
  for (const { points } of lamellae) {
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, z0, , , t0, b0] = points[i]
      const [x1, z1, , , t1, b1] = points[i + 1]
      a += Math.hypot(x1 - x0, z1 - z0) * ((t0 - b0 + (t1 - b1)) / 2)
    }
  }
  return a
}

const full = ZONES.subSeptal * 2

for (const spacing of [THYLAKOID.spacingNm]) {
  const lamellae = thylakoidLamellae({
    rOuter: ZONES.thylakoidOuter,
    rHole: ZONES.nucleoplasm,
    spacing,
    height: full,
    angleStart: CUTAWAY.keptStart,
    angleLength: CUTAWAY.kept,
    obstacles: [],
    seed: 4242,
  })

  const heights = lamellae.flatMap((l) => l.points.map((p) => p[4] - p[5]))
  const mean = heights.reduce((a, b) => a + b, 0) / heights.length
  const points = lamellae.reduce((a, l) => a + l.points.length, 0)

  console.log(`spacing ${String(spacing).padStart(3)} nm`)
  console.log(`  arcs           ${lamellae.length} (${points} points)`)
  console.log(`  lamellae       ${new Set(lamellae.map((l) => l.tone)).size}`)
  console.log(
    `  height         mean ${mean.toFixed(0)} nm, ` +
      `${((100 * mean) / full).toFixed(0)} % of the ${full} nm the cell allows ` +
      `(${Math.min(...heights).toFixed(0)}–${Math.max(...heights).toFixed(0)})`,
  )
  console.log(`  membrane area  ${(area(lamellae) / 1e6).toFixed(1)} µm² per face`)
  console.log(
    `  hosts          ${lamellae.filter((l) => l.points.length > 24).length} arcs long ` +
      `enough for phycobilisomes, ${lamellae.filter((l) => l.points.length > 20).length} for polyglucan`,
  )
}
