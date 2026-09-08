// Assertions over src/science.js — the numbers the whole model is built from.
// No test runner and no dependencies: science.js imports nothing, so plain node
// can load it. Run with `npm run check`.
//
// The screw-sense check exists because a mirrored helix looks perfectly correct
// in a still frame, and stills are how this project is inspected. It shipped
// mirrored once.
import {
  CELL,
  HELIX_VS_TEMPERATURE,
  SHEATH,
  THYLAKOID,
  TRICHOME,
  WALL_LAYERS,
  WALL_TOTAL_NM,
  ZONES,
  coilCount,
  cyanophycinState,
  helixAtTemperature,
  helixPoint,
  polyglucanState,
  seededRandom,
} from '../src/science.js'

let failures = 0
let checks = 0

function check(name, condition, detail = '') {
  checks++
  if (condition) return
  failures++
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

function close(a, b, tolerance = 1e-6) {
  return Math.abs(a - b) <= tolerance
}

// ── Screw sense ────────────────────────────────────────────────────────────
//
// For three samples advancing along +Y, the Y component of (P1-P0) x (P2-P1)
// carries the screw sense. Its sign is compared against a textbook
// right-handed helix about +Y — (sin t, t, cos t) — rather than hard-coded,
// so the test states the geometry rather than a remembered answer.

function screwSense([p0, p1, p2]) {
  const v1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]
  const v2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]]
  return Math.sign(v1[2] * v2[0] - v1[0] * v2[2])
}

const RIGHT_HANDED = screwSense([0, 0.4, 0.8].map((t) => [Math.sin(t), t, Math.cos(t)]))

function senseOf(handedness) {
  const params = { radiusUm: 18, pitchUm: 113, turns: 3, handedness }
  return screwSense([0, 0.02, 0.04].map((t) => helixPoint(t, params)))
}

console.log('helix')
check(
  'a left-handed trichome is a left-handed screw',
  senseOf('left') === -RIGHT_HANDED,
  'the modelled helix is the mirror image of Mühling et al. 2003',
)
check('a right-handed trichome is a right-handed screw', senseOf('right') === RIGHT_HANDED)
check('the two senses are opposite', senseOf('left') === -senseOf('right'))
check('the control helix is not degenerate', RIGHT_HANDED !== 0)
check("the modelled strain is the documented majority", TRICHOME.handedness === 'left')

// ── Helix vs temperature ───────────────────────────────────────────────────
//
// van Eykelenburg (1979), Lake Nakuru strain. The interpolation must land
// exactly on the two measured points and stay monotonic between them.

const { cold, warm } = HELIX_VS_TEMPERATURE

console.log('temperature')
check('15 °C reproduces the measured pitch', close(helixAtTemperature(15).pitchUm, cold.pitchUm))
check('15 °C reproduces the measured diameter', close(helixAtTemperature(15).diameterUm, cold.diameterUm))
check('30 °C reproduces the measured pitch', close(helixAtTemperature(30).pitchUm, warm.pitchUm))
check('30 °C reproduces the measured diameter', close(helixAtTemperature(30).diameterUm, warm.diameterUm))

let previousPitch = Infinity
let previousDiameter = Infinity
let monotonic = true
for (let t = 15; t <= 30; t += 0.5) {
  const h = helixAtTemperature(t)
  if (h.pitchUm > previousPitch || h.diameterUm > previousDiameter) monotonic = false
  previousPitch = h.pitchUm
  previousDiameter = h.diameterUm
}
check('the helix tightens monotonically with temperature', monotonic)
check('warmer means more coils on a filament of fixed length',
  coilCount(helixAtTemperature(30)) > coilCount(helixAtTemperature(15)))

// ── The 17–20 °C storage switch ────────────────────────────────────────────

console.log('storage switch')
check('cyanophycin is at full abundance at 15 °C', close(cyanophycinState(15).abundance, 1))
check('cyanophycin granules reach 2400 nm below 17 °C', cyanophycinState(16.5).maxDiameterNm === 2400)
check('cyanophycin granules drop to 630 nm at and above 17 °C', cyanophycinState(17).maxDiameterNm === 630)
check('cyanophycin thins out as it warms',
  cyanophycinState(30).abundance < cyanophycinState(20).abundance)
check('polyglucan peaks across 17–20 °C',
  close(polyglucanState(17).abundance, 1) && close(polyglucanState(20).abundance, 1))
check('polyglucan thins above 20 °C', polyglucanState(30).abundance < polyglucanState(20).abundance)
check('polyglucan thins below 17 °C', polyglucanState(15).abundance < polyglucanState(17).abundance)
check('every abundance stays within [0, 1]',
  [15, 17, 20, 25, 30].every((t) => {
    const c = cyanophycinState(t).abundance
    const p = polyglucanState(t).abundance
    return c >= 0 && c <= 1 && p >= 0 && p <= 1
  }))

// ── Dimensions and zones ───────────────────────────────────────────────────

console.log('dimensions')
check('the wall is four layers', WALL_LAYERS.length === 4)
check('the wall totals ~60 nm — van Eykelenburg 1977', WALL_TOTAL_NM === 60)
check('every layer sits in the measured 10–15 nm band',
  WALL_LAYERS.every((l) => l.thickness >= 10 && l.thickness <= 15))
check('cells are wider than they are long — diagnostic for Limnospira',
  CELL.diameterUm > CELL.lengthUm)
check('the cell diameter is inside the species range of 6–12 µm',
  CELL.diameterUm >= 6 && CELL.diameterUm <= 12)
check('the cell length is inside the measured 2.6–5.6 µm',
  CELL.lengthUm >= 2.6 && CELL.lengthUm <= 5.6)
check('the radial zones nest outwards',
  ZONES.nucleoplasm < ZONES.thylakoidOuter &&
    ZONES.thylakoidOuter < ZONES.membraneInner &&
    ZONES.membraneInner < ZONES.wallInner &&
    ZONES.wallInner < ZONES.wallOuter &&
    ZONES.wallOuter < ZONES.sheathOuter)

// ── The sheath ─────────────────────────────────────────────────────────────
//
// Deschoenmaeker et al. (2016) on Arthrospira sp. PCC 8005. The last check is
// the one that matters: it is the reason the taxonomic literature can describe
// this genus as sheathless while the electron microscopy photographs a sheath,
// and if the modelled thickness ever drifted above it the model would be
// asserting that both cannot be true.
check('the sheath coats the wall from outside', SHEATH.nominalNm > 0 &&
  ZONES.sheathOuter - ZONES.wallOuter === SHEATH.fibrillarMaxNm)
check('the sheath is thinner than the wall it coats', SHEATH.nominalNm < WALL_TOTAL_NM)
check('the starved range starts at the fed thickness',
  SHEATH.starvedNm[0] === SHEATH.nominalNm)
check('the fibrillar layer reaches past the starved sheath',
  SHEATH.fibrillarMaxNm > SHEATH.starvedNm[1])
check('a fed sheath is under the resolution of a light microscope',
  SHEATH.nominalNm < 200,
  'the genus is described as sheathless, and this is why')
check('the thylakoid zone holds at least a few lamellae at true spacing',
  (ZONES.thylakoidOuter - ZONES.nucleoplasm) / THYLAKOID.spacingNm > 30)
check('a thylakoid sac is thinner than the gap between two of them',
  THYLAKOID.sacNm < THYLAKOID.spacingNm)

// ── The RNG the whole cell interior depends on ─────────────────────────────

console.log('determinism')
const first = Array.from({ length: 5 }, seededRandom(42))
const again = Array.from({ length: 5 }, seededRandom(42))
check('the seeded RNG repeats for one seed', first.every((v, i) => v === again[i]))
check('different seeds diverge', seededRandom(42)() !== seededRandom(43)())
check('it stays in [0, 1)', Array.from({ length: 200 }, seededRandom(7)).every((v) => v >= 0 && v < 1))

// ───────────────────────────────────────────────────────────────────────────

console.log()
if (failures) {
  console.error(`${failures} of ${checks} checks failed`)
  process.exit(1)
}
console.log(`${checks} checks passed`)
