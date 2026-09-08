// Where things sit inside the cell.
//
// Everything here is derived from `science.js` and is deterministic: the same
// seed gives the same cell every time, so a granule never jumps when the
// temperature slider moves. The slider decides how many sites are filled and
// how large each one grows, never where they are.
//
// This is kept apart from the components that draw them because the lamella
// generator needs the granule positions as obstacles — the membranes arch over
// a granule rather than passing through it — so the placement has to exist
// before anything is rendered, and be the same placement both times it is read.
import * as THREE from 'three'
import {
  CARBOXYSOME,
  CELL_NM,
  CELL_STORAGE,
  CUTAWAY,
  FLOOR_NM,
  LIPID_BODY,
  POLYGLUCAN,
  POLYPHOSPHATE,
  GAS_VESICLE,
  SEPTUM_NM,
  THYLAKOID,
  ZONES,
  keptAngle,
  seededRandom,
} from './science.js'
import { septumSurface, thylakoidLamellae } from './geometry.js'

export const L = CELL_NM.length // 4400 nm
export const KEPT = CUTAWAY.kept
export const START = CUTAWAY.keptStart
export const FLOOR = FLOOR_NM

// --- The envelope, stepped open at the cut ----------------------------------
//
// A radial section states the four wall layers as four parallel bands 15 nm
// wide, and that is the whole of what it can state: a band is an edge, and an
// edge cannot show what a layer is made of. But these four are four different
// polymers with four different grains — linear elements running along the
// filament axis in L-IV, right-handed fibrils in L-III, a cross-linked
// peptidoglycan mesh in L-II, fibrillar β-1,2-glucan in L-I — and none of that
// exists in a 15 nm stripe. It exists on a face.
//
// So they do not all stop in the same place. At the leading edge of the cutaway
// each one is cut back a step further than the one inside it: the plasma
// membrane runs right out to the cut and stands proud of everything, L-I stops
// a step short of it, L-II a step short of that, then L-III, L-IV, and last the
// sheath. Because these are nested shells, a layer that outreaches the one over
// it has its own outer face in the open — so the staircase is five treads of
// five materials in the order the envelope is built in, with the layer
// thicknesses standing as the risers between them.
//
// It works at this edge and would not work at an arbitrary one. An outer face
// at angle φ is only visible from within acos(r/R) of it, and the treads have
// to be read from the open wedge, which is where the camera can be; putting the
// steps at the edge of that wedge is what puts the camera in front of them. The
// The lamp agrees, though not by casting: the wall and lamella meshes neither
// cast nor receive shadows, and the key's shadow map spans 22 400 nm over 2048
// texels — about 11 nm to the texel, which could not resolve a 15 nm riser even
// if they did. What separates one tread from the next is the turn of the normal
// against a key coming in from 39°, and the crevice darkening read off the depth
// buffer.
//
// A step is 380 nm of arc — the narrowest that still leaves a face rather than
// another edge once the foreshortening of looking along a cylinder is paid for.
// Five of them take 27° off a 245° sector, so the opening widens at one end and
// is otherwise the cutaway it always was.
const ENVELOPE_STEP_NM = 380

export const ENVELOPE_STEP = {
  // Tier 0 is the plasma membrane and reaches the cut; each layer outwards
  // stops one step earlier, out to the sheath at tier 5.
  step: ENVELOPE_STEP_NM / ZONES.wallOuter,
  tiers: 6,
  get mid() {
    return START + 2.5 * this.step
  },
}

// Where a tier starts, and how much of the sector is left to it. Returned from
// one place so the wall, the membrane, the sheath, the cross-wall and the tread
// labels cannot disagree about where the steps are.
export function envelopeStep(tier) {
  const angleStart = START + tier * ENVELOPE_STEP.step
  return { angleStart, angleLength: KEPT - tier * ENVELOPE_STEP.step }
}

// The middle of the tread that tier exposes — the strip of its own outer face
// left in the open by the layer over it stopping a step short.
export function envelopeTread(tier) {
  return START + (tier + 0.5) * ENVELOPE_STEP.step
}

// --- Storage granules -------------------------------------------------------

// Peripheral, and banked along the cross-wall: that is where these granules are
// found (distinta 6.2, van Eykelenburg — "granuli periferici allineati lungo i
// setti"), and it is the difference between a granule and a marble, since one
// left in open ground in the middle of the floor has nothing to be against.
//
// But peripheral and on the floor is also, in this cutaway, under two
// micrometres of thylakoid: the stack stands its full height against the wall,
// so a granule resting out at r = 3000 is drawn where nothing can see it. Five
// angles rolled from the RNG all landed between START + 1.8 and START + 3.3,
// which is the far half of the kept sector, and every one of them was buried.
//
// The exception is the section itself. The wedge is removed so that the
// periphery can be read, and a granule sitting against a cut face is both
// peripheral and in plain view, with the open wedge between it and the camera
// — which is where the aerotopes are placed, for the same reason. So the
// angles are chosen rather than rolled, the way theirs are.
//
// The sizes descend because the thinning takes them from the end. Warm the
// culture and the granules are mobilised; what survives at 30 °C should be the
// largest of them, not whichever one the random walk happened to put first.
const CYANOPHYCIN_SITES = [
  { angle: START + 0.12, inset: 0.1, scale: 1.0, lift: 0.15 },
  { angle: START + KEPT - 0.14, inset: 0.45, scale: 0.88, lift: 0.5 },
  { angle: START + 1.5, inset: 0.7, scale: 0.76, lift: 0.25 },
  { angle: START + 3.3, inset: 0.25, scale: 0.66, lift: 0.6 },
  { angle: START + 2.05, inset: 0.8, scale: 0.58, lift: 0.3 },
]

// How many of them the reference state actually has. At 30 °C that is one: the
// culture is banking carbon, not nitrogen. It lives here rather than in the
// component that draws them because the lamella generator has to agree with it
// — it was arching the stack over all five, so four of the holes in the thylakoid
// system had nothing inside them.
export const CYANOPHYCIN_SHOWN = Math.max(
  1,
  Math.round(CELL_STORAGE.cyanophycin.abundance * CYANOPHYCIN_SITES.length),
)

// Every site, drawn or not. Deliberately not exported: `cyanophycinDrawn` is the
// only way out of this module, which is what keeps the mesh, the label and the
// lamella obstacles from disagreeing about which granules exist.
function cyanophycinBodies(maxDiameterNm) {
  return CYANOPHYCIN_SITES.map((site) => {
    const diameter = maxDiameterNm * site.scale
    // Out against the envelope, a little way in at most. The upper limit is the
    // one that matters; the lower keeps a swollen cold granule off the wall.
    const radius = Math.max(
      diameter / 2 + 200,
      ZONES.thylakoidOuter - diameter / 2 - 90 - site.inset * 420,
    )
    const x = radius * Math.cos(site.angle)
    const z = radius * Math.sin(site.angle)
    return {
      x,
      z,
      // Resting on the cross-wall — the real one, which bows and leans, not the
      // plane it used to be. And not all tangent to it: a row of spheres on one
      // level is a row of ball bearings. Lifting them unevenly pushes their
      // tops into the lamellae, which then arch over, and being half under the
      // stack is what makes them look embedded rather than placed.
      y: FLOOR + septumSurface(x, z, ZONES.membraneInner) + diameter / 2 + site.lift * 260,
      d: diameter,
    }
  })
}

// The ones that exist in the state the cell is drawn in. The mesh, the label and
// the lamella obstacles all read this, so the three cannot disagree about which
// granules are there.
export function cyanophycinDrawn(maxDiameterNm) {
  return cyanophycinBodies(maxDiameterNm).slice(0, CYANOPHYCIN_SHOWN)
}

export const LIPID_BODIES = (() => {
  const rnd = seededRandom(93)
  return Array.from({ length: 6 }, () => {
    const angle = keptAngle(rnd, 0.2)
    // Reaching in to the edge of the core as well as out to the wall. Held at
    // 2500 they all sat buried inside the stack, which is a droplet drawn where
    // nothing can see it.
    const radius = 1950 + rnd() * 1550
    const d = LIPID_BODY.diameterNm * (0.75 + rnd() * 0.5)
    return {
      x: radius * Math.cos(angle),
      z: radius * Math.sin(angle),
      y: (rnd() - 0.5) * 2200,
      d,
    }
  })
})()

export const LIPID_ITEMS = LIPID_BODIES.map((b) => ({ p: [b.x, b.y, b.z], s: b.d }))

// --- Bodies of the cell core -------------------------------------------------
//
// Carboxysomes and polyphosphate bodies sit in the middle of the cell, and they
// are here rather than in the components that draw them for the usual reason:
// the lamella generator has to know about them. It never used to, because the
// middle of the cell was walled off from the membranes by a clean cylinder —
// and once that wall is allowed to wander and be crossed, a lamella that does
// not know about a carboxysome will run straight through it.
const body = (rnd, { count, inner, spread, spanY, diameterNm, minScale, scaleRange }) =>
  Array.from({ length: count }, () => {
    const angle = keptAngle(rnd, inner)
    const radius = spread[0] + rnd() * spread[1]
    const p = [radius * Math.cos(angle), (rnd() - 0.5) * spanY, radius * Math.sin(angle)]
    const r = [rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI]
    const s = minScale + rnd() * scaleRange
    return { p, r, s, x: p[0], y: p[1], z: p[2], d: diameterNm * s }
  })

// Seven rather than five, and spread across the whole core rather than huddled
// on the axis. The core is now a room instead of a shaft, and five bodies in
// the middle of a room read as a pile dropped there — where the micrographs
// show polyhedral bodies distributed through the nucleoplasmic region, some of
// them right up against the innermost lamellae.
export const CARBOXYSOME_BODIES = body(seededRandom(9), {
  count: 7,
  inner: 0.5,
  spread: [320, 1150],
  spanY: 2600,
  diameterNm: CARBOXYSOME.diameterNm,
  minScale: 0.8,
  scaleRange: 0.4,
})

export const POLYPHOSPHATE_BODIES = body(seededRandom(58), {
  count: 5,
  inner: 0.4,
  spread: [420, 1120],
  spanY: 2800,
  diameterNm: POLYPHOSPHATE.diameterNm,
  minScale: 0.7,
  scaleRange: 0.6,
})

// --- Septal pores ------------------------------------------------------------
//
// The cross-wall divides the cells; it does not isolate them. The septal
// peptidoglycan is drilled through, and in S. platensis the rows of pores are
// seen directly in section — the protein channel that sits in them is proven in
// Anabaena and Nostoc and has never been characterised here, which is why the
// card grades those two claims differently.
//
// At about 20 nm they are the smallest thing in the cell that is worth drawing,
// and the model could easily have gone on showing a solid floor while its own
// dossier said the floor was perforated.
export const SEPTUM_PORES = (() => {
  const rnd = seededRandom(233)
  const out = []
  // Rows, not a scatter: they come in files at a few radii.
  for (const [fraction, count] of [
    [0.42, 14],
    [0.63, 18],
    [0.84, 24],
  ]) {
    for (let i = 0; i < count; i++) {
      const radius = ZONES.septumOuter * (fraction + (rnd() - 0.5) * 0.05)
      const angle = START + ((i + 0.5 + (rnd() - 0.5) * 0.6) / count) * KEPT
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      out.push({
        // Local to the septum, which is what is drawn inside a group already
        // offset to FLOOR. Adding FLOOR here as well put all 56 of them 2.1 µm
        // below the bottom of the cell, in open water.
        p: [x, septumSurface(x, z, ZONES.septumOuter), z],
        s: 0.8 + rnd() * 0.5,
      })
    }
  }
  return out
})()

// --- Aerotopes ---------------------------------------------------------------
//
// Bundles of gas vesicles beside the cross-walls. Plural, and each lying at its
// own angle: the packing inside a bundle really is hexagonal at about 65 nm, so
// that is kept, but one upright hexagonal raft of identical cylinders standing
// in open ground is a machine part rather than a cell component.
//
// This lives here with the rest of the placement because the lamella generator
// needs the bundles as obstacles — membranes give way to an aerotope the way
// they give way to a granule — and that means the positions have to exist
// before anything is drawn.
const AEROTOPE_SITES = [
  { angle: START + KEPT - 0.22, radius: 2750, reach: 3.1, tilt: 0.68, spin: 0.4 },
  { angle: START + 0.62, radius: 2450, reach: 2.4, tilt: 1.12, spin: 2.2 },
  { angle: START + 2.55, radius: 3050, reach: 1.9, tilt: 0.92, spin: 4.4 },
]


export const AEROTOPES = (() => {
  const rnd = seededRandom(517)
  const spacing = GAS_VESICLE.diameterNm + 10
  return AEROTOPE_SITES.map((site) => {
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(site.tilt, site.spin, 0, 'YXZ'),
    )
    const cx = site.radius * Math.cos(site.angle)
    const cz = site.radius * Math.sin(site.angle)
    const centre = new THREE.Vector3(
      cx,
      FLOOR + septumSurface(cx, cz, ZONES.membraneInner) + 300,
      cz,
    )
    const vesicles = []
    let spread = 0
    for (let row = -4; row <= 4; row++) {
      for (let col = -4; col <= 4; col++) {
        const x = col * spacing + (row % 2 ? spacing / 2 : 0)
        const z = row * spacing * 0.87
        // Round the raft off, then eat unevenly into its edge: a huddle, not a
        // paving pattern.
        const out = Math.hypot(x, z)
        if (out > spacing * site.reach * (0.78 + rnd() * 0.42)) continue
        spread = Math.max(spread, out)
        // Ends that do not come out flush. Staggering along the axis is what
        // makes a bundle read as vesicles rather than as a comb.
        const along = (rnd() - 0.5) * GAS_VESICLE.lengthNm * 0.5
        const p = new THREE.Vector3(x, along, z).applyQuaternion(q).add(centre)
        vesicles.push({ p: p.toArray(), q: q.toArray() })
      }
    }
    // Resting on the cross-wall, not through it.
    //
    // The centre was put 300 nm above the septum surface and the vesicles hung
    // off it, which is not enough: a vesicle is 900 nm long, the raft is tilted
    // by up to 64 degrees, and the ends are deliberately staggered along the
    // axis by another 450. All three bundles had their lowest vesicles between
    // 143 and 349 nm *below* the floor, sticking out of the underside of the
    // cell. The clearance is measured off the vesicles that exist rather than
    // guessed at, and the whole raft is lifted rigidly so the hexagonal packing
    // survives the correction.
    const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(q)
    const drop =
      (GAS_VESICLE.lengthNm / 2) * Math.abs(axis.y) + GAS_VESICLE.diameterNm / 2
    let lift = 0
    for (const v of vesicles) {
      const face =
        FLOOR + septumSurface(v.p[0], v.p[2], ZONES.septumOuter) + SEPTUM_NM / 2
      lift = Math.max(lift, face + 30 - (v.p[1] - drop))
    }
    if (lift > 0) {
      for (const v of vesicles) v.p[1] += lift
      centre.y += lift
    }

    return {
      x: centre.x,
      y: centre.y,
      z: centre.z,
      // The sphere the lamellae have to arch over. A bundle is a squat cylinder
      // and this is the ball around it, which is close enough for a membrane to
      // be pushed aside by.
      d: 2 * Math.hypot(spread, GAS_VESICLE.lengthNm / 2) * 0.8,
      vesicles,
    }
  })
})()

export const AEROTOPE_VESICLES = AEROTOPES.flatMap((a) => a.vesicles)

// --- The thylakoid system ---------------------------------------------------

const LAMELLA_ZONE = {
  rOuter: ZONES.thylakoidOuter,
  rHole: ZONES.nucleoplasm,
  height: ZONES.subSeptal * 2,
  angleStart: START,
  angleLength: KEPT,
}

// The far tier used to be 265 nm apart and 48 nm thick, which is a fifth of the
// real lamella count at four times the real thickness: fourteen fat concentric
// walls that read as terracing. But dense fine striation is the visual
// signature of this cell in section — it is what makes a micrograph of it
// recognisable — and the old tier traded exactly that away for a density the
// screen could resolve. Half the spacing and half the thickness keeps the tier
// affordable while giving the character back.
// Only the drawn thickness changes with distance now, not the spacing: a 16 nm
// sac is about a pixel at whole-cell zoom and can only shimmer there, so it is
// drawn at 22 until it is worth more than that. The second, sparser lamella set
// that used to live out here is gone - it made zooming in multiply the anatomy.
export const OVERVIEW_THICKNESS = 22
export const LOD_DISTANCE = 8200

// Cached per granule state, of which there are only two — the sets are plain
// arrays of points, so nothing here holds GPU memory. There is one set: the
// phycobilisomes and the polyglucan rods sample the same lamellae the mesh is
// built from, at every distance, which is one fewer thing that can disagree.
const lamellaCache = new Map()

export function lamellaeFor(spacing, maxDiameterNm) {
  const key = `${spacing}:${maxDiameterNm}`
  if (!lamellaCache.has(key)) {
    const obstacles = [
      ...cyanophycinDrawn(maxDiameterNm),
      ...LIPID_BODIES,
      ...AEROTOPES,
      ...CARBOXYSOME_BODIES,
      ...POLYPHOSPHATE_BODIES,
    ].map((b) => ({
      x: b.x,
      z: b.z,
      y: b.y,
      r: b.d / 2 + 45,
    }))
    lamellaCache.set(
      key,
      thylakoidLamellae({
        ...LAMELLA_ZONE,
        spacing,
        obstacles,
        seed: 4242,
      }),
    )
  }
  return lamellaCache.get(key)
}


// --- Polyglucan rods ---------------------------------------------------------
//
// These were placed inside the component that draws them, which made them the
// last body in the model whose position nothing outside the render could read —
// so their label and their camera had to be typed by hand, and both had drifted:
// the leader was pointing at 747 nm of empty cytoplasm and the camera was aimed
// somewhere else again. Placement belongs here with every other body, and for
// the same reason: what is drawn has to be readable by whatever has to point at
// it.
//
// A rod is set against the flank of a lamella, half an interlamellar space off
// its face, standing somewhere along that lamella's own height. The pool is
// rolled once and the store then takes the first n of it, so warming the
// culture thins the rods out without moving the ones that stay.
const polyglucanCache = new Map()

export function polyglucanRods(maxGranule) {
  const key = String(maxGranule)
  if (polyglucanCache.has(key)) return polyglucanCache.get(key)

  const rnd = seededRandom(404)
  const long = lamellaeFor(THYLAKOID.spacingNm, maxGranule).filter((l) => l.points.length > 20)
  const pool = long.length
    ? Array.from({ length: 320 }, () => {
        const lamella = long[Math.floor(rnd() * long.length)]
        const idx = Math.floor(rnd() * (lamella.points.length - 1))
        const [x, z, nx, nz, top, bottom] = lamella.points[idx]
        const push = THYLAKOID.spacingNm * 0.5
        const p = [
          x - push * nx,
          bottom + POLYGLUCAN.lengthNm / 2 + rnd() * Math.max(0, top - bottom - POLYGLUCAN.lengthNm),
          z - push * nz,
        ]
        return {
          p,
          r: [(rnd() - 0.5) * 0.2, Math.atan2(nz, nx), (rnd() - 0.5) * 0.2],
          x: p[0],
          y: p[1],
          z: p[2],
          // The anchor rides the rod's flank, not its end: it is 25 nm across
          // and 450 long, and which end is which depends on a rotation.
          d: POLYGLUCAN.diameterNm,
        }
      })
    : []

  const drawn = pool.slice(0, Math.round(20 + 300 * CELL_STORAGE.polyglucan.abundance))
  polyglucanCache.set(key, drawn)
  return drawn
}

// The rod to point at. They are all the same size, so "the biggest" — the rule
// every other body's anchor uses — decides nothing here. What decides it is the
// same argument the cyanophycin sites are placed by: a body against a cut face
// is both where the biology puts it and in plain view, with the open wedge
// between it and the camera. So: the rod nearest either edge of the wedge.
export function polyglucanShown(maxGranule) {
  const rods = polyglucanRods(maxGranule)
  if (!rods.length) return null
  const toEdge = (b) => {
    const a = (Math.atan2(b.z, b.x) + Math.PI * 2) % (Math.PI * 2)
    return Math.min(Math.abs(a - START), Math.abs(a - (START + KEPT)))
  }
  return rods.reduce((best, b) => (toEdge(b) < toEdge(best) ? b : best))
}
