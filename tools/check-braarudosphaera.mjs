// Assertions over the Braarudosphaera cell as drawn — the numbers its cards
// state, held to the measurements they cite.
//
// Almost nothing about this cell's anatomy is typed in: its length follows from
// the FIB-SEM volume, the nitroplast's radius from its measured share of that
// volume, the plastids' thickness from theirs. That makes the cards' claims
// consequences of the code rather than descriptions of it — and a consequence can
// silently stop being true when the outline, the proportions or a share is
// touched. This is where it would stop being true out loud. Run with
// `npm run check`.
import form from '../src/species/braarudosphaera-bigelowii.js'
import {
  anatomyOf,
  buildHaptophytes,
  cellVolume,
  lengthForVolume,
  outlineAt,
  plastidVolume,
} from '../src/haptophyte.js'

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

const x = form.exterior
const c = x.cell
const mean = lengthForVolume(c.volumeUm3, c.widthRatio, c.flattening)
const a = anatomyOf(x, mean)

console.log('braarudosphaera-bigelowii — the drawn cell against the measurements')

// ── Size ───────────────────────────────────────────────────────────────────

// r56: three FIB-SEM reconstructions of cultured motile cells, 130.5 ± 8.2 µm³.
check('the mean drawn cell has the measured volume',
  Math.abs(cellVolume(a.lengthUm, a.widthUm, c.flattening) - 130.5) < 0.5, f(a.volume, 1))
// r60 / r53: motile cells of this species, 9–19.2 × 3.9–8.7 µm — for every
// cell the drawn spread can produce, not only the mean one.
for (const k of c.lengthSpread) {
  const cell = anatomyOf(x, mean * k)
  check(`a cell at ${k} of the mean length is inside the species range 9–19.2 µm`,
    within(cell.lengthUm, 9, 19.2), f(cell.lengthUm))
  check(`and its width inside 3.9–8.7 µm`, within(cell.widthUm, 3.9, 8.7), f(cell.widthUm))
}
// The proportions measured off the footage: 2.9 : 1 on two frames.
check('length to width is the footage’s, about 2.9', within(1 / c.widthRatio, 2.7, 3.1), f(1 / c.widthRatio))

// ── Nitroplast ─────────────────────────────────────────────────────────────

const dN = 2 * a.nitroplastUm
// r56: cryo-ET, "spherical or ellipsoidal (2–4 μm diameter)".
check('the nitroplast of 10.2 % of the cell is 2–4 µm across, as cryo-ET measures', within(dN, 2, 4), f(dN))
// The footage: the nitroplast is six tenths of the cell's width. The card calls
// this two independent measurements agreeing; if it stops agreeing, it says so.
check('the nitroplast is six tenths of the cell’s width, as in the footage',
  Math.abs(dN / a.widthUm - 0.6) < 0.05, f(dN / a.widthUm))
// r55: effective host radius over nitroplast radius, 2.33 ± 0.20, across lineages.
const hostR = Math.cbrt((3 * a.volume) / (4 * Math.PI))
check('host to nitroplast radius is within two deviations of 2.33 ± 0.20',
  within(hostR / a.nitroplastUm, 2.33 - 0.4, 2.33 + 0.4), f(hostR / a.nitroplastUm))
// It has to fit through the cell's thickness where it is drawn, with room for
// the envelope and the plastid round it.
{
  const s = 0.5 * (1 - x.nitroplast.u)
  const b = (outlineAt(s) * a.widthUm * c.flattening) / 2
  check('the nitroplast fits through the cell’s thickness at its station', a.nitroplastUm < b - 0.2,
    `radius ${f(a.nitroplastUm)} against a half-thickness of ${f(b)} µm`)
  check('it is at the back of the cell, between the plastids (r51)', x.nitroplast.u < -0.1)
}
// r56: plastid to nitroplast volume about 3.2, in both life stages.
{
  const plastids = plastidVolume(a.lengthUm, a.widthUm, c.flattening, a.plastidUm, x.plastids.fromS, x.plastids.span)
  const nitroplast = (4 / 3) * Math.PI * a.nitroplastUm ** 3
  check('the plastids are 35 % of the cell', Math.abs(plastids / a.volume - 0.35) < 0.005, f(plastids / a.volume, 3))
  check('plastid to nitroplast volume is near the measured 3.2', within(plastids / nitroplast, 2.9, 3.7),
    f(plastids / nitroplast))
  check('each plastid plate is thinner than the cell is thick',
    a.plastidUm < (a.widthUm * c.flattening) / 4, `${f(a.plastidUm)} µm`)
}

// ── Appendages ─────────────────────────────────────────────────────────────

// r51: 3–6 spine-like scales at the anterior and posterior ends.
{
  const lo = x.spines.anterior[0] + x.spines.posterior[0]
  const hi = x.spines.anterior[1] + x.spines.posterior[1]
  check('the spine count stays within the 3–6 described', lo >= 3 && hi <= 6, `${lo}–${hi}`)
  check('and there are spines at both ends', x.spines.anterior[0] > 0 && x.spines.posterior[0] > 0)
}
// r60: spines 6.4–22.5 µm in total length.
check('drawn spines are inside 6.4–22.5 µm', within(x.spines.lengthUm[0], 6.4, 22.5) && within(x.spines.lengthUm[1], 6.4, 22.5))
// r52 (sister species): haptonema 2.5–4.5 µm, flagella 8–20 µm.
check('the haptonema is drawn at 2.5–4.5 µm', x.haptonema.lengthUm[0] >= 2.5 && x.haptonema.lengthUm[1] <= 4.5)
check('the flagella are drawn inside 8–20 µm', x.flagella.lengthUm[0] >= 8 && x.flagella.lengthUm[1] <= 20)
check('the flagella are longer than the haptonema', x.flagella.lengthUm[0] > x.haptonema.lengthUm[1])

// ── The slide ──────────────────────────────────────────────────────────────

// The card says a field this size holds a cell about once in several dozen
// looks, and the renderer places one by hand because of it. Counted over the
// frame at the widest aspect a desktop window gives.
{
  const frame = x.fieldUm * (x.fieldUm * 1.8) * x.depthUm * 1e-12 * x.cellsPerMl
  check('a field at this density usually holds no cell at all', frame < 0.1, `${f(frame, 3)} cells expected`)
  const { others } = buildHaptophytes(x)
  check('so the drop holds the centred cell and, at this density, nothing else', others === 0, `${others} others`)
}

console.log()
if (failures) {
  console.error(`${failures} of ${checks} checks failed`)
  process.exit(1)
}
console.log(`${checks} checks passed`)
