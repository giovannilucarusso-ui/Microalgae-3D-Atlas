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

// The closest two sacs come to each other once the lean has displaced their top
// edges, against the gap they have to work in.
//
// The lean shears each sac: its bottom edge stays put and its top edge moves
// out along its own normal. Neighbours 56 nm apart survive that only while they
// lean by nearly the same amount, so this walks every pair of points from
// different lamellae that overlap in height and are near each other in plan,
// and reports the tightest the stack ever gets at the top. Anything at or below
// zero is two membranes passing through each other, which is the one thing no
// section can show — and it would be invisible in a render, because the sacs
// are opaque and the intersection is inside them.
const clearance = (lamellae) => {
  const pts = []
  const lam = new Map()
  for (const { points, tone } of lamellae) {
    if (!lam.has(tone)) lam.set(tone, lam.size)
    const id = lam.get(tone)
    for (const [x, z, nx, nz, top, bottom, lx = 0, lz = 0] of points) {
      pts.push({ x, z, nx, nz, top, bottom, lx, lz, id })
    }
  }
  const NEAR = 240
  let base = Infinity
  let leaned = Infinity
  let touching = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j]
      if (a.id === b.id) continue
      const dx = b.x - a.x
      const dz = b.z - a.z
      if (Math.abs(dx) > NEAR || Math.abs(dz) > NEAR) continue
      const d = Math.hypot(dx, dz)
      if (d > NEAR) continue
      // Only pairs that could actually meet: sacs that miss each other in
      // height cannot intersect however far they lean.
      if (Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom) <= 0) continue
      const tx = b.x + b.lx - (a.x + a.lx)
      const tz = b.z + b.lz - (a.z + a.lz)
      const dTop = Math.hypot(tx, tz)
      if (d - THYLAKOID.sacNm < base) base = d - THYLAKOID.sacNm
      if (dTop - THYLAKOID.sacNm < leaned) leaned = dTop - THYLAKOID.sacNm
      if (dTop - THYLAKOID.sacNm <= 0) touching++
    }
  }
  return { base, leaned, touching }
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
  const gap = clearance(lamellae)
  console.log(
    `  clearance      ${gap.base.toFixed(1)} nm between sacs at the floor, ` +
      `${gap.leaned.toFixed(1)} nm at the top once they lean` +
      (gap.touching ? `  — ${gap.touching} INTERSECTING PAIRS` : ''),
  )
}
