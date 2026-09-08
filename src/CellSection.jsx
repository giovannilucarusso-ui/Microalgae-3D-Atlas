import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import {
  CARBOXYSOME,
  GAS_VESICLE,
  POLYGLUCAN,
  POLYPHOSPHATE,
  SEPTUM_NM,
  SEPTUM_PORE_NM,
  RIBOSOME,
  SHEATH,
  THYLAKOID,
  WALL_LAYERS,
  ZONES,
  CELL_STORAGE,
  keptAngle,
  seededRandom,
} from './science.js'
import {
  AEROTOPE_VESICLES,
  CARBOXYSOME_BODIES,
  FLOOR,
  KEPT,
  L,
  LIPID_ITEMS,
  LOD_DISTANCE,
  OVERVIEW_THICKNESS,
  POLYPHOSPHATE_BODIES,
  SEPTUM_PORES,
  START,
  cyanophycinDrawn,
  envelopeStep,
  envelopeTread,
  lamellaeFor,
  polyglucanRods,
} from './sites.js'
import { COLORS, SURFACE, SWATCH, WALL_SURFACE, gelLook, look } from './materials.js'
import { labelsForView } from './structures.js'
import { photosynthesisStep } from './science.js'
import {
  gasVesicleGeometry,
  jitter,
  lamellaeGeometry,
  lumpy,
  nucleoidStrands,
  phycobilisomeGeometry,
  sectorGeometry,
  sectorShell,
  septumGeometry,
  sheathGeometry,
} from './geometry.js'
import { antenna, appearing, lamella, perforated, ribbed, sectorClip } from './optics.jsx'
import { Detail, Part, useDisposable, useFocalDistance } from './scene.jsx'

// Transforms are precomputed once — generating them inside the effect would let
// the shared RNG advance on every re-render and the instances would jump.
function InstancedParts({ geometry, items, castShadow = false, children }) {
  const ref = useRef()

  useLayoutEffect(() => {
    if (!ref.current) return
    const dummy = new THREE.Object3D()
    items.forEach((item, i) => {
      dummy.position.set(item.p[0], item.p[1], item.p[2])
      if (item.q) dummy.quaternion.fromArray(item.q)
      else dummy.rotation.set(item.r?.[0] ?? 0, item.r?.[1] ?? 0, item.r?.[2] ?? 0)
      dummy.scale.setScalar(item.s ?? 1)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items, geometry])

  if (items.length === 0) return null
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, items.length]}
      castShadow={castShadow}
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  )
}

// --- Envelope ---

// Drawn back-faces-only, so the near side never occludes the interior while the
// far side still reads as a solid ground for everything inside.
function Cytoplasm({ faded }) {
  const geometry = useDisposable(
    () =>
      sectorShell({
        r: ZONES.membraneInner,
        height: L,
        angleStart: START,
        angleLength: KEPT,
      }),
    [],
  )
  return (
    <mesh geometry={geometry} raycast={() => null}>
      {/* The ground everything else is read against. A cyanobacterial cytosol
          is crowded — ribosomes in the thousands, protein at a few hundred
          milligrams per millilitre — and a smooth shell behind the anatomy
          reads as an empty cavity, which is the opposite of the truth. */}
      <meshStandardMaterial
        color={faded ? '#04100f' : COLORS.cytoplasm}
        roughness={0.98}
        side={THREE.BackSide}
        ref={SURFACE.cytoplasm}
      />
    </mesh>
  )
}

// The gel the cell secretes and sits inside. Outside everything, and the only
// structure here that is not built of the cell's own materials — which is why
// it is its own group in the list rather than a fifth layer of the wall.
//
// It is drawn at the thickness of a cell in ordinary growth, ~50 nm, because
// that is the state the whole cutaway is drawn in. Starve it of nitrogen and
// this is the layer that changes most — that fact is on the card.
function Sheath({ selected, onSelect, hidden }) {
  const geometry = useDisposable(
    () =>
      sheathGeometry({
        rIn: ZONES.wallOuter,
        height: L,
        nominal: SHEATH.nominalNm,
        fibrillarMax: SHEATH.fibrillarMaxNm,
        // Last on the staircase, a step behind L-IV. It has to be: a coat that
        // reached the cut would arch over every tread below it, and 50 nm of
        // pale gel across the steps turns five layers into one wash. Stepping
        // it back also leaves L-IV a bare strip of its own, which is the only
        // place in the model the outermost layer is seen without the coat.
        ...envelopeStep(5),
      }),
    [],
  )

  return (
    <Part id="sheath" role="shell" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <mesh geometry={geometry}>
          {/* Wet, and barely there. The clearcoat is most of what says gel
              rather than glass: a hydrated polysaccharide has a soft, broad
              sheen, and a tight specular on a layer this thin would read as a
              soap bubble round the cell. */}
          <meshPhysicalMaterial
            color={COLORS.sheath}
            roughness={0.34}
            clearcoat={0.55}
            clearcoatRoughness={0.38}
            metalness={0}
            side={THREE.FrontSide}
            ref={SURFACE.sheath}
            {...gelLook(state)}
          />
        </mesh>
      )}
    </Part>
  )
}

// Front faces only: from inside the cell the far wall would otherwise stand up
// as a bright band across the whole view. The outer surface, the cut faces and
// the rim still draw, which is everything the envelope needs to read.
//
// WALL_LAYERS is listed outermost first, and the staircase is numbered from the
// inside, so L-IV is the fourth tier and stops four steps short of the cut while
// L-I stops one. Each layer therefore leaves a strip of its own outer face in
// the open, and the cut faces between them are the thicknesses.
const wallTier = (i) => WALL_LAYERS.length - i
function Wall({ selected, onSelect, hidden }) {
  const layers = useMemo(() => {
    let rOut = ZONES.wallOuter
    return WALL_LAYERS.map((layer, i) => {
      const geometry = sectorGeometry({
        rIn: rOut - layer.thickness,
        rOut,
        height: L,
        ...envelopeStep(wallTier(i)),
      })
      rOut -= layer.thickness
      return { ...layer, geometry }
    })
  }, [])

  useDisposable(() => layers.map((l) => l.geometry), [layers])

  return (
    <Part id="wall" role="shell" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) =>
        layers.map((layer, i) => (
          // As a hull only the outermost layer draws: four stacked sheets of
          // glass are not a hull, they are a fog.
          <mesh key={layer.id} geometry={layer.geometry} visible={state !== 'ghost' || i === 0}>
            <meshStandardMaterial
              color={layer.color}
              roughness={0.82}
              side={THREE.FrontSide}
              ref={WALL_SURFACE[layer.id]}
              {...look(state)}
            />
          </mesh>
        ))
      }
    </Part>
  )
}

function PlasmaMembrane({ selected, onSelect, hidden, companion }) {
  const geometry = useDisposable(
    () =>
      sectorGeometry({
        rIn: ZONES.membraneInner,
        rOut: ZONES.wallInner,
        height: L,
        // The innermost tier, so it is the one that runs right out to the cut
        // and stands proud of the wall — the first tread of the staircase and
        // the only layer of the envelope that is not cut back at all.
        ...envelopeStep(0),
      }),
    [],
  )

  return (
    <Part id="membrane" selected={selected} onSelect={onSelect} hidden={hidden} companion={companion}>
      {({ state }) => (
        <mesh geometry={geometry}>
          {/* One owner for r = ZONES.membraneInner.
              This sector is closed, so it carries an inner cylindrical face at
              exactly the radius the cytoplasm shell is drawn at, and its normals
              point at the axis — front-facing from the camera, so FrontSide does
              not remove it. Two differently tessellated surfaces then competed
              at the same depth and the far wall came out a lilac curtain barred
              vertically with black, which is the tessellation losing and winning
              in stripes.
              The contest is settled towards the cytoplasm rather than towards
              the membrane, and that is the substantive half of the fix: this
              bilayer is 8 nm on a cell 8000 nm across, and letting its inner
              face be the value of the entire far wall over-weights it by three
              orders of magnitude. What the interior is read against is the
              crowded cytosol, dark. A depth bias is enough because nothing else
              in the model is coplanar with this sector — the cut faces at the
              wedge edges are radial planes and the exposed tread is 8 nm
              further out, so both keep drawing exactly as before. */}
          <meshPhysicalMaterial
            color={COLORS.membrane}
            roughness={0.66}
            clearcoat={0.12}
            clearcoatRoughness={0.7}
            side={THREE.FrontSide}
            polygonOffset
            polygonOffsetFactor={2}
            polygonOffsetUnits={2}
            ref={SURFACE.membrane}
            {...look(state)}
          />
        </mesh>
      )}
    </Part>
  )
}

// You look down into the cell, so the cross-wall on view is the lower one: the
// upper cross-wall, and the cell stacked on top of it, have been cut away.
function Septa({ selected, onSelect, hidden }) {
  const geometry = useDisposable(
    () =>
      septumGeometry({
        rOut: ZONES.septumOuter,
        thickness: SEPTUM_NM,
        // The full sector, and not stepped with L-II even though it is L-II
        // folded inwards. It was stepped once, on that argument, and the
        // argument was wrong: this is the floor of the cutaway, and everything
        // banked against the cross-wall — the cyanophycin, the aerotopes, the
        // lamellae that stand on it — is placed from `START`. Two steps taken
        // off the near edge left those hanging over open space, which is a
        // worse untruth than the one it fixed: 30 nm of rim showing past the
        // membrane at floor level, where the peel has cut the wall back.
        angleStart: START,
        angleLength: KEPT,
      }),
    [],
  )

  // The sheet itself is punched: SURFACE.septum carries the mottle, and the
  // perforation is chained onto it so the two share one material.
  const perforate = useMemo(
    () => {
      const punch = perforated({
        centres: SEPTUM_PORES.map(({ p }) => [p[0], p[2]]),
        radius: SEPTUM_PORE_NM / 2,
      })
      return (material) => {
        SURFACE.septum(material)
        punch(material)
      }
    },
    [],
  )

  // Drilled right through, so the pore is a hole and not a dimple painted on.
  const pore = useDisposable(
    () => new THREE.CylinderGeometry(SEPTUM_PORE_NM / 2, SEPTUM_PORE_NM / 2, SEPTUM_NM * 2.2, 10, 1, true),
    [],
  )

  return (
    <Part id="septum" role="shell" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <group position={[0, FLOOR, 0]}>
          <mesh geometry={geometry} receiveShadow>
            <meshStandardMaterial
              color={COLORS.septum}
              roughness={0.9}
              // The sheet is a closed shell — top, underside, rim and both cut
              // faces — so a back face is only ever seen through a pore, where
              // seeing past it is the point.
              side={THREE.FrontSide}
              ref={perforate}
              {...look(state === 'ghost' ? 'veil' : state)}
            />
          </mesh>
          <InstancedParts geometry={pore} items={SEPTUM_PORES}>
            {/* Open ended and dark inside: what you are looking at is the way
                through, not a stud sitting on the surface. */}
            <meshStandardMaterial
              color="#04100e"
              roughness={1}
              side={THREE.BackSide}
              {...look(state === 'ghost' ? 'veil' : state)}
            />
          </InstancedParts>
        </group>
      )}
    </Part>
  )
}

// The band over which the painted antenna carpet hands over to the real
// phycobilisomes. It brackets the distance those switch on at, so the amount of
// phycocyanin on screen stays roughly constant across the swap instead of
// dipping into chlorophyll green in between.
// --- Photosynthesis, as one clock ------------------------------------------
//
// Every part of the sequence derives its phase from the same elapsed time with
// the same formula, so nothing is shared and nothing can drift out of step.
const PHOTO_SECONDS = 9
const photoPhase = (elapsed) => (elapsed % PHOTO_SECONDS) / PHOTO_SECONDS
const bell = (x, centre, width) => Math.exp(-(((x - centre) / width) ** 2))

const CARPET_NEAR = 8700
const CARPET_FAR = 10600

function ThylakoidMesh({ lamellae, thickness, state, photosynthesis }) {
  const geometry = useDisposable(() => lamellaeGeometry(lamellae, thickness), [lamellae, thickness])
  const focalDistance = useFocalDistance()
  const surface = useMemo(
    () =>
      lamella({
        // Was 0.0016 — a blotch 625 nm across, wider than the gap between two
        // sacs and therefore not readable as texture at all. At 0.0038 the
        // octaves start on 263 nm and step down by halves, which brackets the
        // spacing itself: something is legible at every distance the camera
        // reaches instead of only in the close-up.
        scale: 0.0038,
        amount: 0.34,
        rough: 0.3,
        // And they carry on down to a photosystem, which is the smallest thing
        // a thylakoid membrane is made of and therefore where its detail ends.
        // Seven octaves from 263 nm to 5 — the reason a close zoom on a sac now
        // resolves rather than magnifies.
        finest: 5,
        warp: 0.45,
        // Squashed along the sac's own height. A membrane corrugates across
        // itself, not along, so on a face standing three micrometres tall the
        // relief has to run in bands rather than in blobs - and a blob is what
        // an isotropic sample gives on a surface with an axis.
        fiber: [1, 2.4, 1],
        // The membrane is studded with photosystems, not smooth.
        grain: 0.32,
        grainScale: 0.11,
        // A thylakoid sheet is not a plane. Over a couple of hundred nanometres
        // it wanders by tens of them, and that undulation is what makes a stack
        // in section read as wavy rather than ruled. At 6 nm over 625 it was a
        // one per cent slope — no shading model can show that.
        bump: 40,
        rim: 0.16,
        // The fold at the top of a sac is the one place you see the membrane
        // edge on, and a membrane edge is chlorophyll, not phycocyanin. In
        // cyan this term was doing more than outlining: a grazing top face
        // catches most of a fresnel, the plan view is nothing but grazing top
        // faces, and the whole cutaway came out one flat cyan as a result.
        rimColor: '#57c48f',
        carpetColor: '#3796d2',
        carpetStrength: 0.5,
      }),
    [],
  )

  // Measured the same way `Detail` gates the antennae, so the painted pigment
  // and the real ones stay in lockstep whatever the camera is doing.
  useFrame((state) => {
    surface.uniforms.uCarpet.value = THREE.MathUtils.smoothstep(
      focalDistance(),
      CARPET_NEAR,
      CARPET_FAR,
    )
    if (!surface.material) return
    // The membrane lights when the core hands the excitation down into it,
    // and again, lower, while the electrons run along the chain.
    const p = photoPhase(state.clock.elapsedTime)
    surface.material.emissiveIntensity = photosynthesis
      ? 0.3 + 0.8 * bell(p, 0.54, 0.075) + 0.32 * bell(p, 0.7, 0.09)
      : 0.3
  })

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={COLORS.thylakoid}
        // A membrane is wet. At 0.72 rough with almost no coat the relief in
        // the shading normal had nothing to catch: a broad soft key on a fully
        // diffuse plane returns very nearly a constant, whatever the normal is
        // doing, which is why the faces read as painted board. Enough sheen to
        // show the corrugation, and no more - a tight specular is the other way
        // to make a render look moulded.
        roughness={0.62}
        clearcoat={0.16}
        clearcoatRoughness={0.62}
        emissive="#0a2b22"
        emissiveIntensity={0.3}
        // A sac is a closed prism with caps at both ends, and every face now
          // carries the normal it should — so a back face is never seen, and
          // drawing one was two fragments per pixel on the deepest overdraw in
          // the scene.
          side={THREE.FrontSide}
        ref={surface.ref}
        {...look(state)}
      />
    </mesh>
  )
}

// The mass that fills the cell, and therefore the thing in the way. It does not
// vanish when you pick something else — a structure floating in an empty void
// tells you nothing about where it sits — it thins to a veil you can read
// straight through, and the near lamella wins the depth test so the veil stays
// a veil however many of them stack up behind it.
function Thylakoids({ selected, onSelect, hidden, maxGranule, photosynthesis }) {
  const lamellae = lamellaeFor(THYLAKOID.spacingNm, maxGranule)

  return (
    <Part id="thylakoids" role="veil" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <>
          {/* One set of lamellae, drawn at two thicknesses.
              The far tier used to be a second, sparser set at 140 nm, and the
              swap was the one moment in the model where zooming in made the
              anatomy *multiply*: the same cell went from fourteen membranes to
              thirty-six in a frame, which is the opposite of what closing in on
              something is supposed to do. Now the count and the positions never
              change and only the drawn thickness does — 22 nm out where a 16 nm
              sac is a pixel and would only shimmer, the true 16 nm once it is
              worth more than that. Six nanometres is not a transition anyone
              can see. */}
          <Detail beyond={LOD_DISTANCE}>
            <ThylakoidMesh
              lamellae={lamellae}
              thickness={OVERVIEW_THICKNESS}
              state={state}
              photosynthesis={photosynthesis}
            />
          </Detail>
          <Detail within={LOD_DISTANCE}>
            <ThylakoidMesh
              lamellae={lamellae}
              thickness={THYLAKOID.sacNm}
              state={state}
              photosynthesis={photosynthesis}
            />
          </Detail>
        </>
      )}
    </Part>
  )
}

// Docked on the cytoplasmic face of the lamellae, following the same whirls.
// The antenna is not a ball: it is a tricylindrical allophycocyanin core with
// six phycocyanin rods fanning off it, and it sits on the membrane with the fan
// opening outwards — so each one is turned onto its own lamella's normal and
// then spun freely about it, the one degree of freedom a docked phycobilisome
// actually has.
function Phycobilisomes({ selected, onSelect, hidden, companion, maxGranule, photosynthesis }) {
  const geometry = useDisposable(() => phycobilisomeGeometry(), [])

  // The antenna carries its own material because the excitation front has to be
  // written into it every frame; every other surface on this cell comes from
  // the cached set in `materials.js`.
  const surface = useMemo(
    () =>
      antenna({
        scale: 0.05,
        amount: 0.16,
        rough: 0.2,
        // A phycobilisome is hexameric discs stacked into rods: 6 nm is one
        // disc, and there is nothing below it that is still a phycobilisome.
        finest: 6,
        warp: 0.25,
        grain: 0.12,
        grainScale: 0.35,
        bump: 1.2,
        rim: 0.22,
        rimColor: '#84d4f2',
        glowColor: '#d6f4ff',
      }),
    [],
  )

  useFrame((state) => {
    const p = photoPhase(state.clock.elapsedTime)
    // The front starts at the rod tips and runs inward to the core; then the
    // antenna goes quiet, because the energy has left it.
    surface.uniforms.uExcite.value = 1 - Math.min(1, p / 0.45)
    surface.uniforms.uGlow.value = photosynthesis
      ? 1 - THREE.MathUtils.smoothstep(p, 0.44, 0.6)
      : 0
  })

  const items = useMemo(() => {
    const rnd = seededRandom(77)
    const long = lamellaeFor(THYLAKOID.spacingNm, maxGranule).filter(
      (l) => l.points.length > 24,
    )
    if (!long.length) return []
    const swing = new THREE.Quaternion()
    const spin = new THREE.Quaternion()
    const UP = new THREE.Vector3(0, 1, 0)
    const FAN = new THREE.Vector3(1, 0, 0)
    // The geometry starts at its own membrane contact plane, so it only has to
    // clear the face of the sac.
    const off = THYLAKOID.sacNm / 2 - 1
    return Array.from({ length: 1500 }, () => {
      const lamella = long[Math.floor(rnd() * long.length)]
      const idx = Math.floor(rnd() * (lamella.points.length - 1))
      const [x, z, nx, nz, top, bottom] = lamella.points[idx]
      swing.setFromAxisAngle(UP, Math.atan2(nz, -nx))
      spin.setFromAxisAngle(FAN, rnd() * Math.PI * 2)
      return {
        p: [x - off * nx, bottom + rnd() * (top - bottom), z - off * nz],
        q: swing.multiply(spin).toArray(),
        // The nominal geometry is about 56 nm across, which is at the small end
        // of a hemidiscoidal phycobilisome - the measured ones in this organism
        // run to 70 nm. At a mean scale of 1.22 they land on that instead of
        // under it, and they read on the membrane rather than as a stipple.
        s: 0.95 + rnd() * 0.55,
      }
    })
  }, [maxGranule])

  return (
    <Detail within={9500} forced={selected === 'phycobilisomes'} ramp={surface.appear.set}>
      <Part id="phycobilisomes" companion={companion} selected={selected} onSelect={onSelect} hidden={hidden}>
        {({ state }) => (
          <InstancedParts geometry={geometry} items={items}>
            {/* The two pigments ride in the vertex colours — allophycocyanin
                core, phycocyanin rods — so the architecture survives inside a
                single instanced draw call. */}
            <meshStandardMaterial
              color="#ffffff"
              vertexColors
              roughness={0.55}
              emissive="#0d4f74"
              emissiveIntensity={0.32}
              ref={surface.ref}
              {...look(state)}
            />
          </InstancedParts>
        )}
      </Part>
    </Detail>
  )
}

// --- Nucleoplasm: carboxysomes, DNA, polyphosphate ---

function Carboxysomes({ selected, onSelect, hidden, photosynthesis }) {
  // The textbook icosahedron, at detail 0: twenty faces, not eighty.
  //
  // At detail 1 the solid has enough faces to read as a sphere, and a sphere in
  // a warm orange is a storage granule — which is exactly what these were being
  // mistaken for. A carboxysome is a protein shell built from a few subunits
  // tiled on icosahedral symmetry, and in section it shows a sharp polygonal
  // profile: straight edges, hard corners, a granular interior. Twenty faces
  // give a hexagonal silhouette from most angles, which is what the plates
  // show. The jitter is halved with them — a shell assembled from thousands of
  // copies still closes imperfectly, but at 5.5 % on twenty faces the solid
  // stopped being a polyhedron and became a lump.
  const geometry = useDisposable(
    () => jitter(new THREE.IcosahedronGeometry(CARBOXYSOME.diameterNm / 2, 0), 0.028, 9),
    [],
  )
  const items = CARBOXYSOME_BODIES

  // The far end of the sequence: what all of that was spent on.
  const material = useRef()
  const attach = useMemo(
    () => (m) => {
      SURFACE.carboxysome(m)
      material.current = m
    },
    [],
  )
  useFrame((state) => {
    if (!material.current) return
    const p = photoPhase(state.clock.elapsedTime)
    material.current.emissiveIntensity = photosynthesis ? 1.1 * bell(p, 0.88, 0.06) : 0
  })

  return (
    <Part id="carboxysomes" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <InstancedParts geometry={geometry} items={items} castShadow>
          <meshStandardMaterial
            color={COLORS.carboxysome}
            emissive={COLORS.carboxysome}
            emissiveIntensity={0}
            roughness={0.66}
            metalness={0}
            flatShading
            ref={attach}
            {...look(state)}
          />
        </InstancedParts>
      )}
    </Part>
  )
}

function Nucleoid({ selected, onSelect, hidden }) {
  // The generator walks an annular territory and has never been told about the
  // wedge, so a little over a quarter of the fibre it produces used to hang in
  // the removed sector over a floor that is not there. Clipped in the fragment
  // rather than cut out of the spline — see `sectorClip`.
  const clip = useMemo(() => {
    const wedge = sectorClip({ start: START, length: KEPT })
    return (material) => {
      SURFACE.nucleoid(material)
      wedge(material)
    }
  }, [])

  const geometry = useDisposable(
    () =>
      // The territory grew with the core. A tangle of fixed size in the middle
      // of a room that has doubled reads as a ball of string on a floor, where
      // a nucleoid is a mass of loops that occupies its region.
      nucleoidStrands({
        strands: 34,
        // Nearer the 10 nm fibre the chromatin is actually folded into. At 7.5
        // the tube was 15 nm across and each strand read as an object; at 4 it
        // is one thread among twenty and the mass is what you see.
        radiusNm: 4.6,
        region: { x: 0, z: 0, rIn: 240, rOut: 1250, halfHeight: 980 },
        seed: 1212,
      }),
    [],
  )

  return (
    <Part id="nucleoid" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color={COLORS.nucleoid}
            roughness={0.88}
            emissive="#2a2617"
            emissiveIntensity={0.1}
            ref={clip}
            {...look(state)}
          />
        </mesh>
      )}
    </Part>
  )
}

function Polyphosphate({ selected, onSelect, hidden }) {
  const geometry = useDisposable(
    () => lumpy(new THREE.SphereGeometry(POLYPHOSPHATE.diameterNm / 2, 32, 24), { amount: 0.13, frequency: 3.2, offset: 5 }),
    [],
  )
  const items = POLYPHOSPHATE_BODIES

  return (
    <Part id="polyphosphate" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <InstancedParts geometry={geometry} items={items} castShadow>
          <meshPhysicalMaterial
            color={COLORS.polyphosphate}
            roughness={0.48}
            clearcoat={0.2}
            metalness={0.05}
            ref={SURFACE.polyphosphate}
            {...look(state)}
          />
        </InstancedParts>
      )}
    </Part>
  )
}

// --- Buoyancy and storage ---

// The bundles themselves are placed in `sites.js`, with the rest of the
// anatomy, because the lamella generator needs them as obstacles before
// anything is drawn. Here they are only drawn: every vesicle is one merged
// geometry, so all three aerotopes are a single instanced draw call — it used
// to be three meshes per vesicle, which on its own accounted for most of the
// draw calls in the cell.
function GasVesicles({ selected, onSelect, hidden }) {
  const geometry = useDisposable(() => gasVesicleGeometry(GAS_VESICLE), [])
  const rib = ribbed({ period: GAS_VESICLE.ribPeriodNm, depth: 0.32 })

  return (
    <Part id="gasVesicles" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <InstancedParts geometry={geometry} items={AEROTOPE_VESICLES}>
          <meshPhysicalMaterial
            color={COLORS.gasVesicle}
            roughness={0.52}
            clearcoat={0.1}
            metalness={0}
            ref={rib}
            {...look(state)}
          />
        </InstancedParts>
      )}
    </Part>
  )
}

function Cyanophycin({ selected, onSelect, hidden }) {
  const { maxDiameterNm } = CELL_STORAGE.cyanophycin
  // Unit sphere, scaled per granule — so the lumpiness has to be relative too.
  const geometry = useDisposable(
    () => lumpy(new THREE.SphereGeometry(0.5, 40, 30), { amount: 0.07, frequency: 2.6, offset: 11 }),
    [],
  )
  const items = useMemo(
    () =>
      cyanophycinDrawn(maxDiameterNm).map((b, i) => ({
        p: [b.x, b.y, b.z],
        r: [i, i * 2.1, 0],
        s: b.d,
      })),
    [maxDiameterNm],
  )

  return (
    <Part id="cyanophycin" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <InstancedParts geometry={geometry} items={items} castShadow>
          <meshPhysicalMaterial
            color={COLORS.cyanophycin}
            roughness={0.76}
            clearcoat={0.08}
            emissive="#2c0f12"
            emissiveIntensity={0.22}
            ref={SURFACE.cyanophycin}
            {...look(state)}
          />
        </InstancedParts>
      )}
    </Part>
  )
}

function Polyglucan({ selected, onSelect, hidden, companion, maxGranule }) {
  const geometry = useDisposable(
    () =>
      new THREE.CylinderGeometry(
        POLYGLUCAN.diameterNm / 2,
        POLYGLUCAN.diameterNm / 2,
        POLYGLUCAN.lengthNm,
        12,
      ),
    [],
  )

  // Placed in sites.js with every other body, so the label and the camera can
  // read where the rods actually are instead of being told.
  const items = useMemo(() => polyglucanRods(maxGranule), [maxGranule])

  return (
    <Part id="polyglucan" companion={companion} selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <InstancedParts geometry={geometry} items={items}>
          <meshStandardMaterial
            color={COLORS.polyglucan}
            roughness={0.7}
            emissive="#33290f"
            emissiveIntensity={0.18}
            ref={SURFACE.polyglucan}
            {...look(state)}
          />
        </InstancedParts>
      )}
    </Part>
  )
}

function LipidBodies({ selected, onSelect, hidden }) {
  // A droplet is the one thing in here that really is close to a sphere —
  // surface tension sees to that — so it gets only a hint of a lump.
  const geometry = useDisposable(
    () => lumpy(new THREE.SphereGeometry(0.5, 28, 20), { amount: 0.035, frequency: 2.2, offset: 3 }),
    [],
  )

  return (
    <Part id="lipidBodies" selected={selected} onSelect={onSelect} hidden={hidden}>
      {({ state }) => (
        <InstancedParts geometry={geometry} items={LIPID_ITEMS}>
          <meshStandardMaterial
            color={COLORS.lipid}
            roughness={0.86}
            ref={SURFACE.lipid}
            {...look(state)}
          />
        </InstancedParts>
      )}
    </Part>
  )
}

function Ribosomes({ selected, onSelect, hidden }) {
  const geometry = useDisposable(() => new THREE.SphereGeometry(RIBOSOME.diameterNm / 2, 8, 6), [])
  const items = useMemo(() => {
    const rnd = seededRandom(606)
    // Four hundred of them in a shaft a micron wide was what the old core could
    // hold. Opening the core turned that into an empty floor with a tangle of
    // DNA on it — and an empty floor is the one thing a cyanobacterial cytosol
    // is not: protein runs to hundreds of milligrams per millilitre and the
    // ribosomes are in the thousands. This is still a token of that, but it is
    // a token dense enough to read as crowding rather than as litter.
    return Array.from({ length: 1600 }, () => {
      const angle = keptAngle(rnd, 0.3)
      // Denser towards the middle: the square root maps a flat random into an
      // even areal density, and biasing it back the other way keeps the DNA
      // territory the busiest part of the room.
      const radius = 150 + Math.pow(rnd(), 0.72) * 1600
      return {
        p: [radius * Math.cos(angle), (rnd() - 0.5) * 3400, radius * Math.sin(angle)],
        s: 0.8 + rnd() * 0.5,
      }
    })
  }, [])

  // The population dissolves in across the gate's own dead zone instead of
  // arriving in one frame. See `appearing`.
  const appear = useMemo(() => appearing(SURFACE.ribosome), [])

  return (
    // Switched on well before the true-spacing lamellae arrive, not well after:
    // the two used to hand over at 5200 and 8200, and in the band between them
    // the cell was drawn at its finest with an empty middle. Opening the core
    // made that middle the subject, so the crowding has to arrive first.
    <Detail within={11000} forced={selected === 'ribosomes'} ramp={appear.set}>
      <Part id="ribosomes" selected={selected} onSelect={onSelect} hidden={hidden}>
        {({ state }) => (
          <InstancedParts geometry={geometry} items={items}>
            {/* Too small to carry texture. The rim is what makes a 22 nm
                sphere read as a body at all rather than as a speck. */}
            <meshStandardMaterial
              color={COLORS.ribosome}
              roughness={0.8}
              ref={appear.ref}
              {...look(state)}
            />
          </InstancedParts>
        )}
      </Part>
    </Detail>
  )
}

// --- Labels ---
//
// Anchored on the structure itself and pushed out along a leader line, the way
// a figure in a textbook is annotated. Seven of them survey the cell while
// nothing is selected; the moment something is, only that one is drawn — the
// label is then the answer to "where did the camera just take me".
// Names for the treads, and only while the wall is the thing being looked at.
//
// Five faces of five different materials, each the one under the last, is a
// picture of the envelope; the same five without names is a picture of some
// steps. The card beside it lists L-I to L-IV in order and says what each is
// made of, and these are what join that list to the treads it describes.
//
// The anchors come from the same `envelopeTread` the geometry is cut with, so a
// step and its name cannot drift apart: each sits halfway along its own tread,
// on the outer face of its own layer. The pills are stacked clear above the
// staircase, because five names laid on five treads would cover the one thing
// the treads exist to show.
//
// Tier is numbered from the inside, as the steps are: 0 is the plasma membrane
// standing proud at the cut, 4 is L-IV four steps back from it.
const ENVELOPE_TREADS = [
  { text: 'L-IV · linear elements', tier: 4, dx: -26, dy: -300 },
  { text: 'L-III · surface fibrils', tier: 3, dx: -26, dy: -262 },
  { text: 'L-II · peptidoglycan', tier: 2, dx: -26, dy: -224 },
  { text: 'L-I · β-1,2-glucan', tier: 1, dx: -26, dy: -186 },
  { text: 'plasma membrane', tier: 0, dx: -26, dy: -148 },
]

// How high up the staircase the leaders are anchored. The treads run the full
// height of the cell, so this is free — a little above the middle, where the
// wall is clear of both cross-walls.
const TREAD_ANCHOR_Y = 620

function EnvelopeTreadLabels() {
  const marks = useMemo(() => {
    // The outer face of each layer, walking out from the membrane.
    const radii = [ZONES.wallInner]
    for (let i = WALL_LAYERS.length - 1; i >= 0; i--) {
      radii.push(radii[radii.length - 1] + WALL_LAYERS[i].thickness)
    }

    return ENVELOPE_TREADS.map(({ text, tier, dx, dy }) => {
      const angle = envelopeTread(tier)
      return {
        text,
        dx,
        dy,
        dot: tier === 0 ? SWATCH.membrane : WALL_LAYERS[WALL_LAYERS.length - tier].color,
        position: [radii[tier] * Math.cos(angle), TREAD_ANCHOR_Y, radii[tier] * Math.sin(angle)],
      }
    })
  }, [])

  return marks.map((mark) => {
    const length = Math.hypot(mark.dx, mark.dy)
    const rotation = (Math.atan2(mark.dy, mark.dx) * 180) / Math.PI
    return (
      <Html key={mark.text} position={mark.position} zIndexRange={[20, 0]} className="labelwrap">
        <span className="lanchor" style={{ background: mark.dot }} />
        <span
          className="lline"
          style={{ width: `${length}px`, transform: `rotate(${rotation}deg)` }}
        />
        <span className="label" style={{ transform: `translate(${mark.dx}px, ${mark.dy}px)` }}>
          {mark.text}
        </span>
      </Html>
    )
  })
}

function Labels({ onSelect, selected, without }) {
  const labels = labelsForView('cell')
  const shown = (
    selected
      ? labels.filter((label) => label.id === selected)
      : labels.filter((label) => label.survey)
  ).filter((label) => label.id !== without)

  return shown.map((label) => {
    const [dx, dy] = label.offset
    const length = Math.hypot(dx, dy)
    const rotation = (Math.atan2(dy, dx) * 180) / Math.PI
    const position = [
      label.radius * Math.cos(label.angle),
      label.y,
      label.radius * Math.sin(label.angle),
    ]
    return (
      <Html key={label.id} position={position} zIndexRange={[20, 0]} className="labelwrap">
        <span className="lanchor" style={{ background: SWATCH[label.id] ?? '#7fd4b8' }} />
        <span
          className="lline"
          style={{ width: `${length}px`, transform: `rotate(${rotation}deg)` }}
        />
        <button
          className={selected === label.id ? 'label active' : 'label'}
          style={{ transform: `translate(${dx}px, ${dy}px)` }}
          onClick={() => onSelect(label.id)}
        >
          {label.text}
        </button>
      </Html>
    )
  })
}

// Names the step the light is currently on. Written straight to the DOM, like
// the scale bar and the life cycle: the phase changes every frame and React has
// no business hearing about it.
function PhotosynthesisNarration({ running, photo }) {
  useFrame((state) => {
    const refs = photo?.current
    const name = refs?.name?.current
    if (!name) return
    if (!running) {
      if (name.dataset.step) {
        delete name.dataset.step
        name.textContent = ''
        if (refs.text?.current) refs.text.current.textContent = ''
      }
      return
    }
    const step = photosynthesisStep(photoPhase(state.clock.elapsedTime))
    if (name.dataset.step === step.name) return
    name.dataset.step = step.name
    name.textContent = step.name
    if (refs.text?.current) refs.text.current.textContent = step.text
  })
  return null
}

// --- Assembly ---

export default function CellSection({
  selected,
  onSelect,
  showLabels,
  hidden,
  photosynthesis,
  photo,
}) {
  const maxGranule = CELL_STORAGE.cyanophycin.maxDiameterNm
  const off = (id) => hidden?.has(id) ?? false
  const treads = selected === 'wall' && !off('wall')
  const shared = { selected, onSelect }
  // Look at the thylakoid system and you should see what is bolted to it: the
  // antennae on its face and the starch packed between the lamellae are part of
  // the picture, not competing structures.
  const withThylakoids = selected === 'thylakoids'

  return (
    <group>
      <Cytoplasm faded={selected != null} />
      <Sheath {...shared} hidden={off('sheath')} />
      <Wall {...shared} hidden={off('wall')} />
      {/* Selecting the wall used to switch the membrane off, which turned the
          floor of the break into a hole looking through at the lamellae — with
          a label on it reading "plasma membrane". It is what the four layers
          step down onto, so it stays for as long as they are the subject. */}
      <PlasmaMembrane {...shared} hidden={off('membrane')} companion={selected === 'wall'} />
      <Septa {...shared} hidden={off('septum')} />
      <Thylakoids
        {...shared}
        hidden={off('thylakoids')}
        maxGranule={maxGranule}
        photosynthesis={photosynthesis}
      />
      <Phycobilisomes
        {...shared}
        hidden={off('phycobilisomes')}
        companion={withThylakoids}
        maxGranule={maxGranule}
        photosynthesis={photosynthesis}
      />
      <Polyglucan
        {...shared}
        hidden={off('polyglucan')}
        companion={withThylakoids}
        maxGranule={maxGranule}
      />
      <LipidBodies {...shared} hidden={off('lipidBodies')} />
      <Carboxysomes {...shared} hidden={off('carboxysomes')} photosynthesis={photosynthesis} />
      <Nucleoid {...shared} hidden={off('nucleoid')} />
      <Polyphosphate {...shared} hidden={off('polyphosphate')} />
      <Ribosomes {...shared} hidden={off('ribosomes')} />
      <GasVesicles {...shared} hidden={off('gasVesicles')} />
      <Cyanophycin {...shared} hidden={off('cyanophycin')} />
      <PhotosynthesisNarration running={photosynthesis} photo={photo} />
      {/* The wall's own pill is dropped while the treads are named: 'Cell wall ·
          4 layers' beside five labels that each name one of those layers is the
          same sentence twice, and its leader crosses theirs to say it. */}
      {showLabels && <Labels onSelect={onSelect} selected={selected} without={treads ? 'wall' : null} />}
      {showLabels && treads && <EnvelopeTreadLabels />}
    </group>
  )
}
