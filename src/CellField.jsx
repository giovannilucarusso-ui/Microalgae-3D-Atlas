// A field of coccoid cells in a wet mount — the second body the atlas can draw,
// and the first one that is a population rather than an individual.
//
// Spirulina is a specimen: one filament, long enough that a frame holds a
// fraction of it, and you look at *it*. Chlorella is not. What you meet down the
// objective is a field of cells at every depth, and what distinguishes one
// species of Chlorella from another — as far as this instrument goes — is the
// *distribution* of their sizes, not any one cell. Drawing one average cell
// would be drawing the one thing that cannot carry the difference.
//
// So the specimen is the field, and the depth is real: the cells occupy a slab
// as thick as the coverslip gap, most of them outside the plane of focus at any
// one setting. That is not a concession to realism, it is the content. The fine
// focus is how you reach the rest of them, which is what it is for at a bench.
//
// A cell is not a green ball. It was drawn as one to begin with, and that was
// wrong twice over: it is not what an operator sees, and it puts the pigment in
// the wrong place. Chlorella cytoplasm is colourless. The green is one parietal
// chloroplast lining most of the wall and stopping short of closing, and the
// opening it leaves is why a field of these cells reads as C-shapes, rings and
// discs rather than as repeated spheres — one organelle seen from every angle at
// once. The cell body here is nearly clear and carries the outline; the
// chloroplast carries the colour.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { chloroplastCup } from './geometry.js'
import { seededRandom } from './science.js'
import { haloMaterial, specimenMaterial } from './specimen.jsx'

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

// Where a cell sits, which is not "anywhere".
//
// A culture is not a Poisson scatter and the CAUP plates make that plain: dense
// clumps with clear water between them, not an even sprinkle. Two mechanisms
// produce it and both are real — autospores stay together where the mother wall
// let them go, and the cells stick to each other and to the glass. Drawn evenly
// spread, a field of Chlorella reads as a diagram of a culture rather than as a
// drop of one, and it was the largest single difference left against the plates.
//
// Cells are placed into clumps by rejection against what is already in the same
// clump, so they touch rather than interpenetrate; the rest are free-swimming.
function placeCells(rnd, form, count) {
  const spread = form.fieldUm * 0.46
  const depth = (form.depthUm ?? form.fieldUm * 0.5) * 0.5
  const clumped = Math.round(count * (form.clumping?.fraction ?? 0))
  const perClump = form.clumping?.size ?? [3, 9]
  const spots = []
  const anywhere = () => [
    (rnd() * 2 - 1) * spread,
    (rnd() * 2 - 1) * spread,
    (rnd() * 2 - 1) * depth,
  ]

  let placed = 0
  while (placed < clumped) {
    const [cx, cy, cz] = anywhere()
    const want = Math.min(
      clumped - placed,
      Math.round(perClump[0] + (perClump[1] - perClump[0]) * Math.pow(rnd(), 1.3)),
    )
    const members = []
    for (let i = 0; i < want; i++) {
      // Out from the centre until it stops overlapping anything already in this
      // clump. Bounded, because a clump that cannot fit another cell should end
      // rather than search forever.
      let put = null
      for (let tries = 0; tries < 24 && !put; tries++) {
        const reach = form.cell.maxUm * (0.5 + 0.9 * Math.sqrt(members.length + 1)) * (0.7 + rnd() * 0.7)
        const th = rnd() * Math.PI * 2
        const ph = Math.acos(1 - 2 * rnd())
        const p = [
          cx + reach * Math.sin(ph) * Math.cos(th),
          cy + reach * Math.sin(ph) * Math.sin(th),
          cz + reach * Math.cos(ph) * 0.55,
        ]
        const clash = members.some(
          (m) => Math.hypot(p[0] - m[0], p[1] - m[1], p[2] - m[2]) < form.cell.maxUm * 0.62,
        )
        if (!clash) put = p
      }
      if (!put) break
      members.push(put)
    }
    spots.push(...members)
    placed += members.length
  }
  while (spots.length < count) spots.push(anywhere())
  return spots
}

function buildPopulation(form) {
  const rnd = seededRandom(form.seed ?? 1201)
  const count = populationSize(form)
  const spots = placeCells(rnd, form, count)
  const cells = []
  for (let i = 0; i < count; i++) {
    // A mother cell part-way through autosporulation is the one thing about this
    // genus a light microscope really resolves, and the character its
    // description is built on: the daughters are cut inside the mother wall and
    // released when it ruptures. It is worth showing as the minority of cells it
    // actually is at any one moment.
    const dividing = rnd() < (form.autospores?.fraction ?? 0)
    const size = dividing
      ? form.cell.maxUm * (0.82 + 0.18 * rnd())
      : drawSize(rnd, form.cell)
    const brood = dividing
      ? Math.round(
          form.autospores.min +
            (form.autospores.max - form.autospores.min) * Math.pow(rnd(), 1.4),
        )
      : 0
    // Which way this cell happens to be lying, which is the whole reason the
    // field is not repetitive: the chloroplast's mouth points wherever the cell
    // settled, so one organelle reads differently in every cell.
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2),
    )
    const [x, y, z] = spots[i]
    cells.push({
      x,
      y,
      z,
      r: size / 2,
      q,
      // Subspherical rather than spherical, which is what the generic diagnosis
      // says and what the plates show: a few per cent out of round is enough to
      // stop a field reading as ball bearings.
      shape: [1, 0.94 + rnd() * 0.11, 0.96 + rnd() * 0.09],
      // How much pigment this one carries. A field of identical cells reads as a
      // pattern; a real culture never does.
      density: 0.72 + rnd() * 0.5,
      brood,
      seed: rnd(),
    })
  }
  return cells
}

// The daughters inside a mother that is part-way through dividing. Packed on a
// small sphere inside her, which is what the plates show — not a neat rosette,
// and not a random cloud either.
function brood(cell) {
  const rnd = seededRandom(1 + Math.floor(cell.seed * 100000))
  const out = []
  const rInner = cell.r * 0.44
  const size = (cell.r * 0.95) / Math.cbrt(cell.brood)
  for (let i = 0; i < cell.brood; i++) {
    const t = (i + 0.5) / cell.brood
    const phi = Math.acos(1 - 2 * t)
    const theta = i * 2.399963
    const jitter = 0.72 + rnd() * 0.5
    out.push({
      x: cell.x + rInner * jitter * Math.sin(phi) * Math.cos(theta),
      y: cell.y + rInner * jitter * Math.sin(phi) * Math.sin(theta),
      z: cell.z + rInner * jitter * Math.cos(phi),
      r: size * (0.8 + rnd() * 0.35),
      density: 1.15 + rnd() * 0.4,
    })
  }
  return out
}

// The pyrenoid: a body of Rubisco in a starch sheath, inside the chloroplast.
// It sits in the thick of the cup rather than in the middle of the cell, so it
// is placed down the cup's own axis and turned with it.
function pyrenoids(cells) {
  return cells.map((c) => {
    const down = new THREE.Vector3(0, -0.52, 0).applyQuaternion(c.q).multiplyScalar(c.r)
    return {
      x: c.x + down.x,
      y: c.y + down.y,
      z: c.z + down.z,
      r: c.r * 0.2,
      q: c.q,
      density: c.density,
    }
  })
}

function useInstances(items, ref, scale = 1) {
  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const spare = new THREE.Quaternion()
    const densities = new Float32Array(Math.max(1, items.length))
    items.forEach((c, i) => {
      p.set(c.x, c.y, c.z)
      const shape = c.shape ?? [1, 1, 1]
      s.set(c.r * scale * shape[0], c.r * scale * shape[1], c.r * scale * shape[2])
      m.compose(p, c.q ?? spare.identity(), s)
      mesh.setMatrixAt(i, m)
      densities[i] = c.density
    })
    mesh.instanceMatrix.needsUpdate = true
    // One geometry per instanced mesh, never shared: `aDensity` lives on the
    // geometry, so two meshes sharing a sphere overwrite each other's and the one
    // with more instances reads off the end of the other's buffer.
    mesh.geometry.setAttribute('aDensity', new THREE.InstancedBufferAttribute(densities, 1))
    mesh.count = items.length
  }, [items, ref, scale])
}

// `form` is the species record's `exterior` block, exactly as for the trichome:
// the organism and nothing about how it is rendered.
export default function CellField({ form, selected, onSelect }) {
  const bodyRef = useRef()
  const haloRef = useRef()
  const cupRef = useRef()
  const pyrenoidRef = useRef()
  const broodRef = useRef()

  const cells = useMemo(() => buildPopulation(form), [form])
  const daughters = useMemo(() => cells.flatMap((c) => (c.brood ? brood(c) : [])), [cells])
  // A dividing cell's chloroplast is being cut up along with it, so it does not
  // get one drawn: what that cell shows is the brood, which is why it is there.
  const intact = useMemo(() => cells.filter((c) => !c.brood), [cells])
  const grains = useMemo(() => pyrenoids(intact), [intact])

  const geometries = useMemo(
    () => ({
      body: new THREE.SphereGeometry(1, 24, 16),
      halo: new THREE.SphereGeometry(1, 20, 14),
      cup: chloroplastCup({ outer: 1, thickness: 0.34, open: 0.95 }),
      pyrenoid: new THREE.SphereGeometry(1, 12, 8),
      brood: new THREE.SphereGeometry(1, 14, 10),
    }),
    [],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  const materials = useMemo(() => {
    const green = form.colour ?? '#2f6b34'
    return {
      // Cytoplasm, which is colourless. It is here for its outline and for the
      // little it does take out of the beam, not for colour — putting the green
      // in the cell body rather than in the chloroplast is what made these read
      // as uniformly pigmented balls.
      body: specimenMaterial({
        core: '#e3e0d4',
        density: 0.3,
        // The dark contour at the wall: light refracted out of the objective's
        // cone. Real, and it stays — but modest. It was pushed to 1.7 to force
        // an outline the optics were not yet producing, and once the phase term
        // arrived that outline was being drawn three times over: here, in the
        // halo shell below, and in the pass. Three renderings of one Becke line
        // is what made the cells look cut out and pasted on.
        edge: 0.95,
        perInstance: true,
        depthWrite: false,
      }),
      // A whisper. The bright line outside a transparent body is mostly a
      // defocus effect and the pass now produces it from the physics, where it
      // correctly appears as a cell leaves the plane of focus and vanishes as it
      // enters. What is left here is the little of it that survives at focus.
      rim: haloMaterial({ color: '#f2efe0', strength: 0.13, sharpness: 7 }),
      // The chloroplast, and with it all the pigment.
      cup: specimenMaterial({
        core: green,
        density: 0.5,
        edge: 0.2,
        perInstance: true,
        depthWrite: false,
        shell: true,
        // Lobes about 0.8 µm across, which is roughly what the plates show
        // inside a seven-micrometre cell: three or four to a face, not a fine
        // speckle.
        grain: 0.55,
        grainSize: 0.8,
      }),
      // Refractile rather than dark: a pyrenoid is a protein body in a starch
      // sheath, and what marks it out in transmitted light is that it bends the
      // beam, not that it absorbs it.
      pyrenoid: specimenMaterial({
        core: '#8fae86',
        density: 0.55,
        edge: 1.5,
        perInstance: true,
        depthWrite: false,
      }),
      brood: specimenMaterial({
        core: green,
        density: 0.85,
        edge: 0.45,
        perInstance: true,
        depthWrite: false,
      }),
    }
  }, [form.colour])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  useInstances(cells, bodyRef)
  useInstances(cells, haloRef, 1.055)
  useInstances(intact, cupRef, 0.9)
  useInstances(grains, pyrenoidRef)
  useInstances(daughters, broodRef)

  const dim =
    selected != null &&
    selected !== 'cellBody' &&
    selected !== 'autospores' &&
    selected !== 'chloroplast' &&
    selected !== 'wall'
  for (const m of Object.values(materials)) m.uniforms.uFade.value = dim ? 0.72 : 0

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.('cellBody')
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      <instancedMesh
        ref={bodyRef}
        args={[geometries.body, materials.body, cells.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={cupRef}
        args={[geometries.cup, materials.cup, Math.max(1, intact.length)]}
        raycast={() => null}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pyrenoidRef}
        args={[geometries.pyrenoid, materials.pyrenoid, Math.max(1, grains.length)]}
        raycast={() => null}
        frustumCulled={false}
      />
      {daughters.length > 0 && (
        <instancedMesh
          ref={broodRef}
          args={[geometries.brood, materials.brood, daughters.length]}
          raycast={() => null}
          frustumCulled={false}
        />
      )}
      {/* The bright line just outside a transparent body in transmitted light,
          drawn as its own shell for the same reason the trichome's is: the
          specimen multiplies the field, and a Becke line adds to it. Last, so it
          sits over everything it belongs to. */}
      <instancedMesh
        ref={haloRef}
        args={[geometries.halo, materials.rim, cells.length]}
        raycast={() => null}
        renderOrder={1}
        frustumCulled={false}
      />
    </group>
  )
}
