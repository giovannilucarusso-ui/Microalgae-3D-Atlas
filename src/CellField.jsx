// A field of coccoid cells in a wet mount — the second body the atlas can draw,
// and the first one that is a population rather than an individual.
//
// Spirulina is a specimen: one filament, long enough that a frame holds a
// fraction of it, and you look at *it*. Chlorella is not. A Chlorella cell is
// two to ten micrometres of green sphere with a smooth wall and no flagellum,
// and there is nothing in one of them a light microscope can say much about.
// What you actually meet down the objective is a field of them at every depth,
// and what distinguishes one species of Chlorella from another — as far as this
// instrument goes — is the *distribution* of their sizes, not any one cell.
// Drawing one average cell would be drawing the one thing that cannot carry the
// difference.
//
// So the specimen here is the field, and the depth is real: the cells occupy a
// slab as thick as the coverslip gap, most of them outside the plane of focus at
// any one setting. That is not a concession to realism, it is the content. The
// fine focus is how you get to the rest of them, which is exactly what it is for
// at a bench.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
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
// can be compared against a haemocytometer. The slab is the field across, by
// the field across, by the coverslip gap, and a millilitre is 1e12 cubic
// micrometres — so the number of cells in frame follows from how dense the
// culture on the slide is said to be, and the card can state that instead of
// stating a drawing decision.
function populationSize(form) {
  const volumeUm3 = form.fieldUm * form.fieldUm * (form.depthUm ?? form.fieldUm * 0.5)
  return Math.max(4, Math.round(volumeUm3 * form.cellsPerMl * 1e-12))
}

function buildPopulation(form) {
  const rnd = seededRandom(form.seed ?? 1201)
  const spread = form.fieldUm * 0.46
  const depth = form.depthUm ?? form.fieldUm * 0.5
  const count = populationSize(form)
  const cells = []
  for (let i = 0; i < count; i++) {
    // A mother cell part-way through autosporulation is the one thing about
    // this genus a light microscope really resolves, and the character its
    // description is built on: the daughters are cut inside the mother wall and
    // released when it ruptures. It is worth showing, and it is worth showing
    // as the minority of cells it actually is at any one moment.
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
    cells.push({
      x: (rnd() * 2 - 1) * spread,
      y: (rnd() * 2 - 1) * spread,
      z: (rnd() * 2 - 1) * depth * 0.5,
      r: size / 2,
      // How much pigment this one carries. A field of identical balls reads as
      // a pattern; a real culture never does.
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

function useInstances(items, ref, densityName = 'aDensity') {
  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const densities = new Float32Array(items.length)
    items.forEach((c, i) => {
      m.makeScale(c.r, c.r, c.r)
      m.setPosition(c.x, c.y, c.z)
      mesh.setMatrixAt(i, m)
      densities[i] = c.density
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute(
      densityName,
      new THREE.InstancedBufferAttribute(densities, 1),
    )
    mesh.count = items.length
  }, [items, ref, densityName])
}

// `form` is the species record's `exterior` block, exactly as for the trichome:
// the organism and nothing about how it is rendered.
export default function CellField({ form, selected, onSelect }) {
  const cellsRef = useRef()
  const haloRef = useRef()
  const broodRef = useRef()

  const cells = useMemo(() => buildPopulation(form), [form])
  const daughters = useMemo(() => cells.flatMap((c) => (c.brood ? brood(c) : [])), [cells])

  // One geometry per instanced mesh, not one shared between the three.
  //
  // `aDensity` is an attribute *on the geometry*, so three meshes sharing one
  // sphere were each overwriting the others': the last write won, and the cell
  // mesh — a hundred and sixty-five instances — ended up reading a buffer as
  // long as the daughters' population, giving most of its cells whatever was
  // past the end of it. That is where the black solid in the middle of the
  // field came from.
  const [geometry, haloGeometry, broodGeometry] = useMemo(
    () => [
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.SphereGeometry(1, 20, 14),
      new THREE.SphereGeometry(1, 14, 10),
    ],
    [],
  )
  useEffect(
    () => () => [geometry, haloGeometry, broodGeometry].forEach((g) => g.dispose()),
    [geometry, haloGeometry, broodGeometry],
  )

  const materials = useMemo(
    () => ({
      // Chlorophyll a and b, and nothing else worth the name: no phycobilins,
      // so this is grass green where Spirulina is blue-green. The difference is
      // visible down any objective and it is the first thing that separates the
      // two organisms in this atlas.
      // Density well under the trichome's 1.35. A Chlorella cell is two to
      // eight micrometres of chloroplast, not eight of packed cytoplasm: down a
      // real objective it is a *green* ball you can see the field through, and
      // at the first setting tried here the larger cells came out black, which
      // is a cell with more pigment in the beam than the lamp can get through.
      body: specimenMaterial({
        core: form.colour ?? '#3c7a44',
        density: 0.62,
        edge: 0.55,
        perInstance: true,
      }),
      rim: haloMaterial({ color: '#e6f2e4', strength: 0.2, sharpness: 8 }),
      // Daughters are read against their mother, so they are drawn denser: what
      // makes a dividing cell obvious is that its inside is lumpy and darker,
      // not that anything about its outline has changed.
      brood: specimenMaterial({
        core: form.colour ?? '#3c7a44',
        density: 0.85,
        edge: 0.3,
        perInstance: true,
      }),
    }),
    [form.colour],
  )
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  useInstances(cells, cellsRef)
  useInstances(cells, haloRef)
  useInstances(daughters, broodRef)

  const dim = selected != null && selected !== 'cellBody' && selected !== 'autospores'
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
        ref={cellsRef}
        args={[geometry, materials.body, cells.length]}
        frustumCulled={false}
      />
      {/* The bright line just outside a transparent body in transmitted light.
          It is drawn as its own shell for the same reason the trichome's is:
          the specimen multiplies the field, and a Becke line adds to it. */}
      <instancedMesh
        ref={haloRef}
        args={[haloGeometry, materials.rim, cells.length]}
        raycast={() => null}
        renderOrder={1}
        frustumCulled={false}
        scale={1.055}
      />
      {daughters.length > 0 && (
        <instancedMesh
          ref={broodRef}
          args={[broodGeometry, materials.brood, daughters.length]}
          raycast={() => null}
          frustumCulled={false}
        />
      )}
    </group>
  )
}
