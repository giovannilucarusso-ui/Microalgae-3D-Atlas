// What is actually on the slide, as a population — and nothing about how it is
// drawn.
//
// This is the biology of a coccoid culture: how many cells a stated density puts
// in the drawn slab, how big each one is, which stage of division it is in,
// where it settled, what it has had time to store, and what wreckage it left
// behind. Every number in it is argued from a measurement or from a plate, and
// the arguments are in the comments because they are the point.
//
// It lives apart from any renderer on purpose. There are two of those now — the
// instanced-mesh `CellField` and the analytic `CellField2D` — and a population
// model that lived inside either of them would mean the two specimens disagreed
// about the organism depending on which one drew it. A renderer may be replaced;
// this may not, except by better evidence.
import * as THREE from 'three'
import { seededRandom } from './science.js'

// How many chloroplasts are drawn, as distinct shapes.
//
// One geometry is one shape, and an instanced mesh has exactly one geometry —
// which is why the mouth used to be identical in every cell in the field. Six
// meshes is six draw calls and six rims, and six is enough: the cup is also
// turned at random in every cell, so what the eye has to tell apart is six
// outlines at forty orientations rather than six repeats.
export const CUPS = 6

// One draw of a size from a species' distribution.
//
// Not uniform between the extremes: a culture is mostly young cells, because a
// mother cell that reaches the top of the range immediately becomes two to
// thirty-two that are back at the bottom of it. The exponent skews the draw
// towards the small end, which is what a haemocytometer count looks like.
function drawSize(rnd, { minUm, maxUm, skew = 1.7 }) {
  return minUm + (maxUm - minUm) * Math.pow(rnd(), skew)
}

// How many cells are in the drawn slab.
//
// Not a tuned constant. A count picked to look right is a count that means
// nothing and cannot be wrong; a culture density is a quantity with units that
// can be compared against a haemocytometer. The slab is the field across, by the
// field across, by the coverslip gap, and a millilitre is 1e12 cubic
// micrometres — so the number of cells in frame follows from how dense the
// culture on the slide is said to be, and the card states that instead of
// stating a drawing decision.
function populationSize(form) {
  const volumeUm3 = form.fieldUm * form.fieldUm * (form.depthUm ?? form.fieldUm * 0.5)
  return Math.max(4, Math.round(volumeUm3 * form.cellsPerMl * 1e-12))
}

// Somewhere in the drawn slab, at the depth things of this kind are found at.
//
// Cells settle, and that is why a real mount can be read at all.
//
// Spread evenly through the coverslip gap, as they were, no two cells share a
// plane: the depth of field at this working distance is about +/- 0.8 um, a
// Chlorella cell is two to eight across, and the gap is forty-five deep — so
// at any one setting exactly one cell in the field is sharp and the rest are
// smeared. That is arithmetic, not a rendering fault, and no amount of tuning
// the optics would have fixed it, because the optics are right.
//
// What was wrong is the biology. Chlorella is denser than its medium and does
// not swim; in a mount left to stand it sediments onto the glass, and what an
// operator does is rack down to that layer. Most of the population is
// therefore within a couple of micrometres of one plane, with a minority still
// in suspension above it — which is exactly what the CAUP plates show, whole
// groups of cells sharp together and the odd one floating and soft.
//
// The settled plane is the origin, because that is what the objective is
// pointed at. Racking the fine focus away from zero leaves the layer and finds
// the floaters, which is what racking is for.
// How far off the glass a body of a given radius comes to rest.
//
// This is the correction that matters most to how much of a field can be in
// focus at once, and it is a fact about sedimentation rather than a rendering
// choice: **a cell resting on a flat surface has its centre exactly one radius
// above it.** Not somewhere in a layer — at its own radius, every time.
//
// Scattered uniformly through a layer one cell thick, as this was, the depths of
// two neighbouring cells were independent, so with a depth of field of a couple
// of micrometres almost no two cells in the field could be sharp together and
// the picture read as softly focused everywhere. With the cells resting on the
// glass, every cell *of the same size* is coplanar, and an operator racking down
// onto the slide brings a whole size class in at once — which is exactly what a
// settled mount does, and why one is worth making.
//
// It also says something true that the old model could not: the plane you focus
// on selects a size. Rack a little and the big cells sharpen while the small
// ones go soft, because their equators genuinely are at different heights.
//
// `rest` is the radius that sits at z = 0, so the objective starts pointed at
// the middle of the size distribution rather than at the glass.
//
// The jitter is not slop. A cell is not a perfect sphere, the coverslip is not
// optically flat over a whole field, and cells that have piled against each
// other do not all touch the glass.
function scatterInSlab(rnd, form, rest = 0) {
  const spread = form.fieldUm * 0.46
  const depth = (form.depthUm ?? form.fieldUm * 0.5) * 0.5
  const settled = form.settling?.settled ?? 0
  const rough = (form.settling?.roughnessUm ?? 0.42) * 0.5
  return (radius = rest) => [
    (rnd() * 2 - 1) * spread,
    (rnd() * 2 - 1) * spread,
    rnd() < settled
      ? radius - rest + (rnd() * 2 - 1) * rough
      : (rnd() * 2 - 1) * depth,
  ]
}

// Where a unit sits, which is not "anywhere".
//
// A culture is not a Poisson scatter and the CAUP plates make that plain: dense
// knots with clear water between them, not an even sprinkle. Two mechanisms
// produce it and both are real — autospores stay together where the mother wall
// let them go, and the cells stick to each other and to the glass. Drawn evenly
// spread, a field of Chlorella reads as a diagram of a culture rather than as a
// drop of one, and it was the largest single difference left against the plates.
//
// `radii` is how big each unit is, in the order they will be built, and it is
// the argument that makes the packing mean anything. Placed by a rule that knew
// only the largest size in the species, every cell in the field was held seven
// micrometres from its neighbour whether it was eight micrometres across or two
// — so the small ones floated in bubbles of their own and the big ones still
// interpenetrated. Bodies touch when their centres are the sum of their radii
// apart, and that is a per-pair quantity.
//
// Tested against everything already placed rather than against the current knot
// only. Two knots that happened to land on each other used to merge into one
// unreadable pile — which, at this magnification, is the one thing a field of
// touching cells must not do.
function placeUnits(rnd, form, radii) {
  // The radius that rests at the plane of focus: the median of what is actually
  // going to be placed, so the objective opens pointed at the middle of the
  // population rather than at whatever the extremes happen to be.
  const sorted = [...radii].sort((a, b) => a - b)
  const rest = sorted[Math.floor(sorted.length / 2)] ?? 0
  const anywhere = scatterInSlab(rnd, form, rest)
  const clumped = Math.round(radii.length * (form.clumping?.fraction ?? 0))
  const perClump = form.clumping?.size ?? [3, 8]
  const spots = []

  const clear = (p, r) =>
    spots.every(
      (s, i) => Math.hypot(p[0] - s[0], p[1] - s[1], p[2] - s[2]) >= (r + radii[i]) * 0.94,
    )

  // A knot of n bodies of diameter d is about d·∛n across, and this is that. It
  // used to go as √n from a base half again as large, which on the old wide
  // field was merely loose and on this one is not a knot at all: six members
  // reached thirty-two micrometres from the centre, two thirds of the frame.
  const outFrom = (k) => form.cell.maxUm * 0.5 * Math.cbrt(k + 1) * (0.7 + rnd() * 0.75)

  for (let knots = 0; spots.length < clumped && knots < 60; knots++) {
    // The knot rests on the glass like anything else, at the height of the first
    // body in it.
    const [cx, cy, cz] = anywhere(radii[spots.length] ?? rest)
    const want = Math.min(
      clumped - spots.length,
      Math.round(perClump[0] + (perClump[1] - perClump[0]) * Math.pow(rnd(), 1.3)),
    )
    for (let k = 0; k < want; k++) {
      const r = radii[spots.length]
      let put = null
      for (let tries = 0; tries < 30 && !put; tries++) {
        const reach = outFrom(k)
        const th = rnd() * Math.PI * 2
        const ph = Math.acos(1 - 2 * rnd())
        const candidate = [
          cx + reach * Math.sin(ph) * Math.cos(th),
          cy + reach * Math.sin(ph) * Math.sin(th),
          // Flattened hard: a knot resting on the slide spreads across it rather
          // than standing up through the gap.
          cz + reach * Math.cos(ph) * 0.18,
        ]
        if (clear(candidate, r)) put = candidate
      }
      // A knot that cannot fit another body ends rather than searching forever.
      if (!put) break
      spots.push(put)
    }
  }

  // The rest are free-swimming, and they still have to not be inside anything.
  while (spots.length < radii.length) {
    const r = radii[spots.length]
    let put = null
    for (let tries = 0; tries < 40 && !put; tries++) {
      const candidate = anywhere(r)
      if (clear(candidate, r)) put = candidate
    }
    spots.push(put ?? anywhere(r))
  }
  return spots
}

// A unit vector in the cell's own frame, drawn from a band of latitudes, then
// turned the way the cell is turned.
//
// The band is what makes this useful: the cup's closed pole is at local -Y and
// its mouth at +Y, so "somewhere in the pigment" and "somewhere in the
// colourless middle" are two ranges of the same coordinate. A body placed
// without regard to it ends up in the mouth half the time, which is the one
// place in the cell there is no chloroplast to put it in.
function directionIn(rnd, q, fromY, toY) {
  const y = fromY + (toY - fromY) * rnd()
  const ring = Math.sqrt(Math.max(0, 1 - y * y))
  const th = rnd() * Math.PI * 2
  return new THREE.Vector3(ring * Math.cos(th), y, ring * Math.sin(th)).applyQuaternion(q)
}

// A direction at a given angle off some axis, which is what "around the
// pyrenoid" needs and what the cell's own frame cannot say.
function around(rnd, axis, fromCos, toCos) {
  const up = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
  const u = new THREE.Vector3().crossVectors(axis, up).normalize()
  const v = new THREE.Vector3().crossVectors(axis, u)
  const c = fromCos + (toCos - fromCos) * rnd()
  const s = Math.sqrt(Math.max(0, 1 - c * c))
  const th = rnd() * Math.PI * 2
  return new THREE.Vector3()
    .addScaledVector(axis, c)
    .addScaledVector(u, s * Math.cos(th))
    .addScaledVector(v, s * Math.sin(th))
}

// What this objective can resolve, in micrometres.
//
// Abbe, at the numerical aperture an oil immersion lens of this class carries:
// d = lambda / 2NA is about 0.22 µm at 550 nm and NA 1.25. It is not a display
// choice and it is not tunable — it is the reason there is no interior view of
// this specimen, and the same number ought to govern what the exterior draws.
export const RESOLUTION_UM = 0.22

// How much contrast a body of a given size can actually be imaged with.
//
// A refractile body does not fade out gradually as it gets smaller and then
// vanish at some size: its image spreads to the width of the Airy disc and its
// contrast falls away as the body itself goes under that. Drawn without this,
// the starch grains of a daughter cell — a couple of micrometres across, so
// grains of 0.15 to 0.25 µm, at or below the limit — came out as a cluster of
// hard white specks three pixels wide, the only thing in the frame brighter
// than the lamp. A speck that small is exactly what an objective cannot show
// you, and drawing it sharp is claiming a resolution the whole atlas says this
// instrument does not have.
//
// It scales the body's density, so it takes the brightness and the dark margin
// together — which is right, because an unresolved body has neither.
export function resolved(diameterUm) {
  const t = (diameterUm - RESOLUTION_UM * 0.6) / (RESOLUTION_UM * 1.8)
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

// Below this a body is not drawn at all, rather than drawn faint.
//
// The difference matters because these bodies *compound*. Each one screens back
// a share of the headroom left above what is already there, which is what keeps
// any one of them from beating the lamp — but a share of what is left, taken
// forty times over, still converges on the lamp. And forty is not a made-up
// number: a sporangium of eight daughters carries five refractile bodies each,
// and in the smaller of the two species those daughters are under a micrometre,
// so every one of those bodies is at or under the resolution limit.
//
// Faded to a tenth apiece they were still there, still screening, and still
// summing — and the picture had a cluster of pure white pixels sitting in a
// sporangium, the one thing in a transmitted-light image that cannot happen.
// Something an objective cannot resolve contributes nothing it could show you,
// so it is better not drawn than drawn quietly: a quiet body times forty is not
// quiet.
export const RESOLVED_FLOOR = 0.16

// The pyrenoid, and the two starch plates that cap it.
//
// One pyrenoid to a chloroplast: a body of Rubisco with a single double-layered
// thylakoid running through it, sunk in the thick of the cup rather than
// floating in the middle of the cell — so it is placed down the cup's own axis,
// off the pole by a little, and turned with it.
//
// The sheath round it is not a shell. Ikeda & Takeda sectioned the genus and
// found *two thick concavo-convex cup-shaped starch plates* in C. vulgaris,
// capping the matrix from either side, and the same arrangement in
// C. sorokiniana and C. kessleri — the three species with glucosamine walls are
// "virtually identical" in pyrenoid morphology. That is the second character in
// this atlas that refuses to separate the two Chlorella species, and it is on
// the identification card for that reason.
//
// Drawn as two lenses rather than as two cups. The concavity is a hundred
// nanometres of curvature on a body about a micrometre across: it is in the
// electron micrographs and it is not in this instrument, and drawing it would be
// drawing a claim the view cannot support. What the plates are here for is what
// the objective actually delivers — a bright body, brighter than the pigment
// round it, in the thick of the chloroplast.
function pyrenoidOf(rnd, cell) {
  const axis = directionIn(rnd, cell.q, -1, -0.72)
  // About a micrometre across in a six-micrometre cell, which is what the
  // sections measure.
  const r = cell.r * 0.2
  const at = axis.clone().multiplyScalar(cell.r * 0.6)
  // The plates are flattened along the pyrenoid's own axis, so `q` has to take
  // local +Y onto it.
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis)
  // Clear of each other, with the matrix between them, which is what "capping"
  // means and what keeps the pair from being one body drawn twice: two lenses
  // sharing a volume add their brightness twice over the same pixels.
  //
  // And lenses rather than wafers. Drawn at 0.44 of their width they were flat
  // enough that the normal barely turned across the whole face, so a plate seen
  // down its own axis had one brightness everywhere and stopped dead at its
  // margin: a hard-edged disc of uniform pale grey in the middle of a cell,
  // which is what a wafer looks like and what nothing in a cell does. The
  // brightness of a clear body has to fall off across it, and the only thing
  // that makes it fall off here is the surface turning away.
  const plate = (sign) => ({
    x: at.x + axis.x * sign * r * 1.25,
    y: at.y + axis.y * sign * r * 1.25,
    z: at.z + axis.z * sign * r * 1.25,
    r,
    q,
    shape: [1.2, 0.75, 1.2],
    density: (0.95 + rnd() * 0.25) * resolved(2 * r * 0.75),
  })
  return {
    axis,
    matrix: { x: at.x, y: at.y, z: at.z, r, q, density: cell.density },
    plates: [plate(1), plate(-1)],
  }
}

// The refractile granules, which are two populations drawn as one class.
//
// Starch goes down in the chloroplast — the generic diagnosis has the pyrenoid
// "surrounded by starch grains" — and oil goes down in the colourless cytoplasm,
// where C. vulgaris will put five to forty per cent of its dry weight and more
// when it is starved. Down a brightfield objective both are the same thing: a
// small body that bends light where everything round it absorbs it. Starch takes
// iodine and oil takes Nile red; this view takes neither, and the card says so
// rather than the model inventing a difference.
//
// How many a cell carries goes with how big it is, and that is not a display
// trick: storage accumulates across the cell cycle, and a cell at the bottom of
// the size range has just been released from a mother wall and has had no time
// to lay any down.
function granulesOf(rnd, cell, spec, maturity, axis) {
  const out = []
  const span = (range) => Math.round(range[0] + (range[1] - range[0]) * maturity * (0.5 + rnd()))
  const count = span(spec.starch ?? [0, 0])
  for (let i = 0; i < count; i++) {
    // "Pyrenoid present, surrounded by starch grains" — so about half of them
    // are round the pyrenoid rather than scattered evenly through the stroma,
    // which is also what the plates show: a ring of bright bodies in one part of
    // the cell and the odd one elsewhere.
    //
    // *Around* it, at fifty to eighty degrees off its axis, and not on top of
    // it. Scattered into a cone about the axis instead, as they were, four
    // grains landed on the two starch plates and on each other, and six bright
    // bodies in one place gave back so much of what the pigment had taken that
    // the pyrenoid came out as a hole in the chloroplast. Keeping them off each
    // other does more for that than any amount of turning the brightness down.
    const near = i < count * 0.55
    const dir = near ? around(rnd, axis, 0.15, 0.62) : directionIn(rnd, cell.q, -1, 0.3)
    const reach = cell.r * (near ? 0.62 + rnd() * 0.2 : 0.6 + rnd() * 0.22)
    // Drawn once. Asking the generator for the size twice — once for the body
    // and once for the resolution check — gives a grain whose visibility was
    // worked out for some other grain.
    const grainR = cell.r * (0.075 + rnd() * 0.05)
    out.push({
      x: cell.x + dir.x * reach,
      y: cell.y + dir.y * reach,
      z: cell.z + dir.z * reach,
      // Half a micrometre in a five-micrometre cell — a grain, not a speck and
      // not a lobe. Drawn at half this it was under what the objective could
      // have resolved, which turned the one structure the plates put in the
      // foreground of every cell into a faint mottle; drawn at twice it, the
      // grains merged with the pyrenoid's own plates into one pale area
      // covering a third of the cell.
      r: grainR,
      density: (0.85 + rnd() * 0.3) * resolved(grainR * 2),
    })
  }
  const oil = spec.cytoplasmic
  if (oil && rnd() < oil.fraction) {
    for (let i = 0; i < span(oil.count); i++) {
      // In the clear middle, on the mouth side of the cup.
      const dir = directionIn(rnd, cell.q, 0.05, 1)
      const reach = cell.r * (0.16 + rnd() * 0.3)
      const dropR = cell.r * (0.1 + rnd() * 0.07)
      out.push({
        x: cell.x + dir.x * reach,
        y: cell.y + dir.y * reach,
        z: cell.z + dir.z * reach,
        // Bigger and rounder than a starch grain, and more refractile: an oil
        // drop is the brightest thing in a Chlorella cell.
        r: dropR,
        density: (1.15 + rnd() * 0.3) * resolved(dropR * 2),
      })
    }
  }
  return out
}

// How many autospores a mother made.
//
// Powers of two, because that is how they are made. The protoplast divides by
// successive bipartition, so a sporangium holds two, four, eight or sixteen and
// never three, five or seven — the old draw, a rounded power law over the range
// 2 to 8, was producing all of those. Two and four are the common cases and
// eight the less common one, which is what the literature gives for this species
// and what the CAUP plates show: pairs everywhere, quartets often, and the odd
// mother packed with more than you can count.
function broodSize(rnd) {
  const roll = rnd()
  if (roll < 0.44) return 2
  if (roll < 0.85) return 4
  if (roll < 0.97) return 8
  return 16
}

// Where n daughters sit inside the wall that made them.
//
// Not a scatter, because a bipartition is not a scatter. Two daughters lie
// either side of one division plane; four are the tetrad two more bipartitions
// make; past that the arrangement stops being legible down a light microscope
// and a packed cluster is the honest drawing of it.
//
// `reach` is how far the centres sit from the middle and `r` how big each
// daughter is, both worked back from the wall: one protoplast has been divided
// into n, they still have to fit inside what divided them, and by the time the
// wall breaks they have shrunk away from it far enough that the gap is visible
// on a plate.
function packInside(rnd, n, wallR, fill = 0.88) {
  const r = (wallR * fill) / (1 + 0.9 * Math.cbrt(n - 1))
  const reach = wallR * fill - r
  const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize()
  const spin = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis)
  const at = (v) => v.multiplyScalar(reach).applyQuaternion(spin)

  if (n === 2) {
    return {
      r,
      offsets: [at(new THREE.Vector3(0, 1, 0)), at(new THREE.Vector3(0, -1, 0))],
    }
  }
  if (n === 4) {
    const k = 1 / Math.sqrt(3)
    return {
      r,
      offsets: [
        [k, k, k],
        [k, -k, -k],
        [-k, k, -k],
        [-k, -k, k],
      ].map((v) => at(new THREE.Vector3(...v))),
    }
  }
  const offsets = []
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const phi = Math.acos(1 - 2 * t)
    const theta = i * 2.399963
    offsets.push(
      at(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        ),
      ),
    )
  }
  return { r, offsets }
}

// One cell, at a place and a size.
//
// Everything a cell has follows from those two — which way it lies, how much
// pigment it carries, which of the drawn cups it got, where its pyrenoid sits,
// how much it has had time to store. So a daughter inside a mother wall is
// built by exactly this and is a cell like any other, which is not a shortcut
// but the biology: an autospore builds its own wall and its own chloroplast
// before the mother wall breaks, and the only thing that makes it a daughter is
// that it is still standing where the mother put it.
//
// Drawn instead as featureless green balls packed in a sac, which is what they
// were, the one stage this genus is *described by* was the one stage in the
// field with no anatomy in it.
function makeCell(rnd, form, [x, y, z], sizeUm) {
  // Where the cell is in its cycle, as far as its size can say.
  const maturity = Math.min(
    1,
    Math.max(0, (sizeUm - form.cell.minUm) / (form.cell.maxUm - form.cell.minUm)),
  )
  // "Irregularly ellipsoidal just after release", and subspherical once grown —
  // so how far out of round a cell is goes with how young it is. A field where
  // every cell is the same few per cent out of round reads as ball bearings
  // whatever the pigment does, and the smallest cells are exactly the ones a
  // plate shows as lozenges.
  const out = 0.05 + 0.17 * (1 - maturity)
  const wobble = () => 1 + out * (rnd() * 2 - 1)
  const cell = {
    x,
    y,
    z,
    r: sizeUm / 2,
    // Which way this cell happens to be lying, which is the whole reason the
    // field is not repetitive: the chloroplast's mouth points wherever the cell
    // settled, so one organelle reads differently in every cell.
    q: new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2),
    ),
    shape: [1, wobble(), wobble()],
    // How much pigment this one carries. A field of identical cells reads as a
    // pattern; a real culture never does — the plates run from cells that are
    // barely yellow-green to cells so dark you cannot see into them, and a
    // range of 0.72 to 1.22 covered neither end.
    density: 0.6 + rnd() * 0.85,
    // Which of the drawn cups this cell got. Skewed towards the closed end: a
    // chloroplast that lines *most* of the wall is the generic character, and
    // the wide bowls are the minority.
    variant: Math.min(CUPS - 1, Math.floor(CUPS * Math.pow(rnd(), 1.5))),
  }
  const { axis, matrix, plates } = pyrenoidOf(rnd, cell)
  cell.pyrenoid = matrix
  cell.plates = plates
  cell.granules = granulesOf(rnd, cell, form.granules ?? {}, maturity, axis)
  return cell
}

// A wall with nothing of its own inside it: the sac a mother is dividing in, or
// the emptied bowl she leaves when it breaks.
//
// "Autospores released through disruption of mother cell wall" is the clause the
// genus description ends on, and this genus' standing reputation in industry is
// for having a wall that will not break — so what disruption leaves is not
// debris, it is a bowl, and the bowls collect in the medium. They are on every
// plate of a culture a day into its growth: colourless, thin, sharply outlined,
// and empty. The atlas described them on the cell-wall card for as long as that
// card existed without drawing one.
function makeWall(rnd, [x, y, z], r, torn) {
  return {
    x,
    y,
    z,
    r,
    // A closed wall is still turgid and lies whichever way it settled. An
    // emptied one has slumped onto the glass — so it is turned about the
    // optical axis only, and squashed along it. Given three free Euler angles
    // and a squash in its own frame, as both were, the flattening pointed
    // wherever the wall happened to be turned and did nothing at all half the
    // time; a bowl on a slide is flat *in the slide*, which is one axis and not
    // a random one.
    q: torn
      ? new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rnd() * Math.PI * 2))
      : new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2),
        ),
    shape: torn
      ? [1.02 + rnd() * 0.14, 0.92 + rnd() * 0.12, 0.5 + rnd() * 0.22]
      : [1, 0.95 + rnd() * 0.1, 0.97 + rnd() * 0.08],
    density: 0.75 + rnd() * 0.5,
    torn,
    // Which of the two ruptures, for a torn one.
    variant: Math.floor(rnd() * 2),
  }
}

// The field, as the several things that are actually in one.
//
// This used to be a bag of cells with a tenth of them marked "dividing", and it
// was the flattest thing about the view: at any one moment a growing culture is
// a tableau of stages, and the CAUP plates are mostly *not* single cells. They
// are pairs inside a wall that has not broken yet, quartets that have just been
// let go and are still touching, and a great many emptied walls between them.
// Drawing one stage and calling the rest a minority was drawing a diagram of a
// cell rather than a plate of a culture.
//
// So the field is built out of units, and a unit is a stage:
//
//   · a vegetative cell, on its own, at whatever size it has grown to;
//   · a sporangium — a wall still closed round two, four or eight daughters,
//     with the gap between them and it that a plate shows;
//   · a group just released — the same daughters, no longer held, with the torn
//     wall lying beside them.
//
// The count is still the culture's. `populationSize` says how many *cells* the
// drawn slab holds at the stated density, and units are built until that many
// cells exist — so a field with more division in it has fewer objects in it, not
// more cells, which is what dividing means.
export function buildPopulation(form) {
  const rnd = seededRandom(form.seed ?? 1201)
  const target = populationSize(form)
  const spec = form.autospores ?? {}

  // What each unit is and how big it is, both decided before anything is placed:
  // the packing needs the sizes, and a mother's wall is the size of the mother
  // rather than of the daughters inside it.
  const kinds = []
  for (let held = 0; held < target; ) {
    const roll = rnd()
    // A mother grew large before she divided — that is what "mother" means
    // here — and her wall keeps that size afterwards.
    //
    // Large, and not the largest the species reaches. At 0.85 to 1.0 of the top
    // of the range every wall on the slide was drawn at the extreme a culture
    // shows a handful of, so each of them came out twice the diameter of a
    // typical cell; with one on every third unit, the field read as a tray of
    // thin grey circles with the odd alga among them. The extreme of a
    // distribution is not its mother class.
    const wallR = (form.cell.maxUm * (0.7 + 0.2 * rnd())) / 2
    if (roll < (spec.sporangia ?? 0)) {
      const n = broodSize(rnd)
      kinds.push({ kind: 'sporangium', n, wallR, radius: wallR })
      held += n
    } else if (roll < (spec.sporangia ?? 0) + (spec.released ?? 0)) {
      const n = broodSize(rnd)
      // A released group has slid apart, so it takes up rather more room than
      // the wall that held it, and the wall lies beside it.
      kinds.push({ kind: 'released', n, wallR, radius: wallR * 1.5 })
      held += n
    } else {
      const size = drawSize(rnd, form.cell)
      kinds.push({ kind: 'cell', n: 1, size, radius: size / 2 })
      held += 1
    }
  }

  const spots = placeUnits(rnd, form, kinds.map((u) => u.radius))
  const cells = []
  const walls = []

  kinds.forEach((unit, i) => {
    const spot = spots[i]
    if (unit.kind === 'cell') {
      cells.push(makeCell(rnd, form, spot, unit.size))
      return
    }
    const wallR = unit.wallR
    // Released, the daughters are no longer held in: they have slid apart to
    // where they merely touch.
    const { r, offsets } = packInside(rnd, unit.n, wallR, unit.kind === 'released' ? 1.02 : 0.88)
    for (const o of offsets) {
      cells.push(
        makeCell(rnd, form, [spot[0] + o.x, spot[1] + o.y, spot[2] + o.z], r * 2),
      )
    }
    if (unit.kind === 'sporangium') {
      walls.push(makeWall(rnd, spot, wallR, false))
    } else {
      // The wall she came out of, lying beside her daughters rather than round
      // them. Flattened in depth for the same reason a clump is: it is resting
      // on the slide.
      const away = wallR * (1.5 + rnd() * 1.1)
      const th = rnd() * Math.PI * 2
      walls.push(
        makeWall(
          rnd,
          [
            spot[0] + away * Math.cos(th),
            spot[1] + away * Math.sin(th),
            spot[2] + (rnd() - 0.5) * wallR * 0.5,
          ],
          wallR,
          true,
        ),
      )
    }
  })

  // And the walls that have been in the medium long enough to have drifted away
  // from whatever came out of them. A proportion of the units rather than a
  // count off a plate, and the card says so.
  const anywhere = scatterInSlab(rnd, form)
  const drifted = Math.round(kinds.length * (form.ghosts?.perUnit ?? 0))
  for (let i = 0; i < drifted; i++) {
    walls.push(makeWall(rnd, anywhere(), (form.cell.maxUm * (0.74 + rnd() * 0.26)) / 2, true))
  }

  return { cells, walls }
}
