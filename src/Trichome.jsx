import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  CELL,
  LIFE_CYCLE,
  TRICHOME,
  SPECIES_HELIX,
  helixPoint,
  trichomeHelix,
  helixSign,
  lifeCycleStage,
  seededRandom,
} from './science.js'
import { calyptraMaterial, haloMaterial, specimenMaterial } from './specimen.jsx'
import { usePrefersReducedMotion } from './scene.jsx'

class HelixCurve extends THREE.Curve {
  constructor(params) {
    super()
    this.params = params
    this.height = params.pitchUm * params.turns
  }

  getPoint(t, target = new THREE.Vector3()) {
    const [x, y, z] = helixPoint(t, this.params)
    return target.set(x, y, z)
  }
}

// Not a picture of the filament but a map of how much of it the light has to
// cross: mid grey is the nominal thickness, brighter absorbs more, darker less.
//
// Drawn against the light micrographs in Nowicka-Krawczyk 2019 Fig. 4 (see
// docs/fonti). Three things carry a live trichome there, and a smooth green
// ribbon has none of them: the cross-walls, which are the one feature a light
// microscope really resolves in this genus and which fall at visibly uneven
// intervals; the granulation banked against those walls; and the mottle of gas
// vacuoles and reserve granules, which is why the cytoplasm looks grainy rather
// than flat. Seeded, so the same filament comes back on every reload.
function makeDensityMap(numCells, seed = 8081) {
  const rnd = seededRandom(seed)
  const w = 4096
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#7f7f7f'
  ctx.fillRect(0, 0, w, h)

  // thicker along the middle of each cell, thinning towards the poles
  const shading = ctx.createLinearGradient(0, 0, 0, h)
  shading.addColorStop(0, 'rgba(120, 120, 120, 0.55)')
  shading.addColorStop(0.5, 'rgba(190, 190, 190, 0.35)')
  shading.addColorStop(1, 'rgba(120, 120, 120, 0.55)')
  ctx.fillStyle = shading
  ctx.fillRect(0, 0, w, h)

  // Cells are not a ruler. Measured lengths run 2.6–5.6 µm about a mean of
  // 4.4, so a comb of identical discs is the first thing that reads as a
  // diagram rather than a specimen.
  const nominal = w / numCells
  const edges = [0]
  for (let i = 1; i <= numCells; i++) {
    edges.push(edges[i - 1] + nominal * (0.78 + rnd() * 0.44))
  }
  const scale = w / edges[numCells]
  for (let i = 0; i <= numCells; i++) edges[i] *= scale

  // `dense` is the whole vocabulary of this map: white is more material in the
  // beam, black is less. A granule is more.
  const speck = (x, y, r, dense, alpha) => {
    ctx.fillStyle = `rgba(${dense ? '255,255,255' : '0,0,0'}, ${alpha})`
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * (0.7 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // How far into the filament a cell is, 0 at either apex. Two cells, because
  // that is about as far as the apical character reaches: the tip cell and a
  // little of the one behind it.
  const fromApex = (i) => Math.min(i, numCells - 1 - i) / 2

  for (let i = 0; i < numCells; i++) {
    const x0 = edges[i]
    const x1 = edges[i + 1]
    const len = x1 - x0

    // No two cells in a trichome carry the same load. Down a real lens some are
    // packed dark with gas vacuoles and reserve granules and their neighbours
    // are visibly clearer, and it is that unevenness cell to cell — not the
    // granules themselves, which are at the edge of what the lens resolves —
    // that stops a filament reading as extruded. Every cell was drawn to the
    // same recipe here, which is why the whole 480 µm came out one material.
    const apex = 1 - Math.min(1, fromApex(i))
    // The apical cell is the clearest one on the filament: it is rounding off,
    // so there is less pigmented depth in the beam, and what is over it is
    // wall. This is also the contrast the calyptra is read against.
    const load = 0.66 + rnd() * 0.62 - 0.5 * apex

    // One cell is a short barrel: fullest across its middle, drawing in towards
    // the wall at each end. This is what stacks the trichome into discs.
    const barrel = ctx.createLinearGradient(x0, 0, x1, 0)
    barrel.addColorStop(0, 'rgba(0, 0, 0, 0.20)')
    barrel.addColorStop(0.5, `rgba(255, 255, 255, ${0.05 + 0.09 * rnd()})`)
    barrel.addColorStop(1, 'rgba(0, 0, 0, 0.20)')
    ctx.fillStyle = barrel
    ctx.fillRect(x0, 0, len, h)

    // The cell's own load, laid over the barrel as one wash. A large area at
    // low contrast survives the exponential far better than a scatter of
    // two-pixel granules does: the beam is crossing a whole cell of it.
    if (load !== 1) {
      const heavy = load > 1
      ctx.fillStyle = `rgba(${heavy ? '255,255,255' : '0,0,0'}, ${Math.min(0.3, Math.abs(load - 1) * 0.42)})`
      ctx.fillRect(x0, 0, len, h)
    }

    // The cross-wall itself, with the pinch of the constriction either side.
    // Wide enough to survive. At whole-filament zoom the entire 480 µm is a few
    // hundred pixels across, so a septum drawn at its true share of a cell
    // lands under one pixel and averages away — and the cross-walls are the
    // one thing this view exists to show.
    const wall = Math.max(3.5, len * 0.17)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillRect(x1 - wall / 2, 0, wall, h)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)'
    ctx.fillRect(x1 + wall * 0.6, 0, wall * 0.8, h)
    ctx.fillRect(x1 - wall * 1.4, 0, wall * 0.8, h)

    // Granulation banked against the wall — the beading that makes the septa
    // read as joins between cells rather than as ruled lines. A cell carrying
    // little carries little of this too.
    const beads = Math.round((5 + rnd() * 6) * load)
    for (let b = 0; b < beads; b++) {
      const side = rnd() < 0.5 ? -1 : 1
      const x = x1 + side * (wall + rnd() * len * 0.22)
      speck(x, h * (0.12 + rnd() * 0.76), 2 + rnd() * 3, true, 0.14 + rnd() * 0.2)
    }

    // Gas vacuoles and reserve granules, rolled inside the cell that holds
    // them rather than scattered over the whole map. Drawn across the filament
    // they were a uniform noise floor, and a noise floor is exactly what a
    // surface looks like when it has no parts.
    const coarse = Math.round((3 + rnd() * 5) * load)
    for (let g = 0; g < coarse; g++) {
      speck(x0 + rnd() * len, rnd() * h, 4 + rnd() * 7, rnd() < 0.6, 0.06 + rnd() * 0.1)
    }
    const fine = Math.round((34 + rnd() * 28) * load)
    for (let g = 0; g < fine; g++) {
      speck(x0 + rnd() * len, rnd() * h, 1 + rnd() * 2.6, rnd() < 0.5, 0.07 + rnd() * 0.16)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 8
  return texture
}

// How the four phases are spread across one run of the animation. Each is a
// crossfade rather than a cut, because none of these events has a moment.
const smooth = (edge0, edge1, x) => {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

const CYCLE_SECONDS = 14
// A necridium is one cell. At 110 cells to the filament that is a little under
// 1 % of its length, and the gap should not pretend to be more.
const MAX_GAP = 0.013
// Kept short on purpose. The screw along the helix is the honest part of the
// motion, but it runs towards the top of the frame, and a hormogonium that
// leaves by exiting the field of view has not been shown leaving.
const MAX_SLIDE = 0.1
// And then it has to leave. Sliding along the parent helix is the true gliding
// motion, but a helix is unchanged by exactly that movement — so on its own it
// reads as a filament that grew, not as a fragment that left.
//
// The direction it leaves in is not free. A wet mount is a thin film between
// slide and coverslip: the specimen moves *within* that film, not towards the
// objective. So the departure runs in the plane of the slide — which is also
// the plane of focus, and the first attempt, which sent the hormogonium
// towards the camera instead, put it so far out of focus that it vanished.
// "Rounded or subcapitate" is the character on the card, and subcapitate means
// slightly swollen — a head. Drawn at the trichome's own radius the apical cell
// is not rounded-to-subcapitate, it is simply where the tube stops. Five per
// cent is the whole difference between an end and an apex.
const APEX = 1.05

const DEPART = new THREE.Vector3(0.866, 0, -0.5)
const MAX_DEPART = 130 // µm

export default function Trichome({ gliding, selected, onSelect, life }) {
  const groupRef = useRef()
  const driftRef = useRef()
  const breakCapRef = useRef()
  const fragCapRef = useRef()
  const travel = useRef({ elapsed: 0, dir: 1, spin: 0 })
  const reduced = usePrefersReducedMotion()

  const helix = SPECIES_HELIX
  const params = useMemo(
    () => trichomeHelix(helix),
    [helix.diameterUm, helix.pitchUm],
  )
  const { pitchUm: pitch, turns } = params

  const curve = useMemo(() => new HelixCurve(params), [params])

  const cellRadius = CELL.diameterUm / 2

  const [geometry, halo] = useMemo(
    () => [
      new THREE.TubeGeometry(curve, 600, cellRadius, 28, false),
      new THREE.TubeGeometry(curve, 400, cellRadius * 1.06, 20, false),
    ],
    [curve, cellRadius],
  )
  useEffect(() => () => [geometry, halo].forEach((g) => g.dispose()), [geometry, halo])

  const numCells = Math.round(TRICHOME.lengthUm / CELL.lengthUm)
  const texture = useMemo(() => makeDensityMap(numCells), [numCells])
  useEffect(() => () => texture.dispose(), [texture])

  // Four materials, not two: the filament is drawn as two lengths of itself so
  // it can come apart, and each length needs its own span. The geometry is
  // still built once — separation is a matter of which fragments are kept.
  //
  // The trichome absorbs red hardest and green least — phycocyanin plus
  // chlorophyll a — so what comes through is the blue-green of the live cell.
  const materials = useMemo(() => {
    const body = () =>
      specimenMaterial({ core: '#24544a', density: 1.35, edge: 0.85, map: texture })
    const rim = () => haloMaterial({ color: '#dfeeea', strength: 0.17, sharpness: 9 })
    // The caps get their own pair. `uSpan` clips on uv.x, which on a tube is
    // the length of the filament but on a sphere is the way round it — the
    // shared material would have sliced wedges out of every rounded end.
    return {
      body: body(),
      rim: rim(),
      fragBody: body(),
      fragRim: rim(),
      capBody: body(),
      capRim: rim(),
      // The two original apices get their own body, and it is unmapped on
      // purpose. A sphere's uv.x runs *around* it, not along the filament, so
      // the density map — which is a strip of the filament's own length —
      // lands on a dome as an arbitrary patch of some other cell. The apical
      // cell was therefore the one cell that could not be given apical
      // character however the map was drawn. It is also genuinely clearer than
      // an intercalary cell: the dome is rounding off, so there is less
      // pigmented depth in the beam, and what is over it is wall. That is the
      // contrast the calyptra is read against, and 0.9 against the body's 1.35
      // is it.
      apexBody: specimenMaterial({ core: '#24544a', density: 0.9, edge: 0.85 }),
      // The calyptra is wall, not cytoplasm, and it is drawn by refraction
      // rather than by absorption — see `calyptraMaterial`. As an absorbing
      // layer it was making the tip six per cent darker than the cell under
      // it, which is the exact opposite of the bright refractile cap a light
      // microscope shows on an apical cell (Nowicka-Krawczyk 2019, Fig. 4).
      calyptra: calyptraMaterial({ strength: 1, thickness: 0.4, rim: 0.7 }),
    }
  }, [texture])
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  )

  const [capStart, capEnd] = useMemo(() => [curve.getPoint(0), curve.getPoint(1)], [curve])

  // The calyptra caps the dome of the apical cell, so it has to be turned to
  // face out along the filament rather than sitting on top of it. Only the two
  // original ends carry one: the ends a break leaves behind are hours old, and
  // a thickened apical wall is not something a cell puts on that fast.
  //
  // It stands proud of the apical cell rather than skinning it. At 1.04 it was
  // inside the halo shell round the same cap and had no outline of its own; a
  // cap is a thing sitting on top of another thing, and the step is how you
  // read that.
  //
  // 0.78 rad of sweep, not the 0.92 it was. In Nowicka-Krawczyk 2019 Fig. 4d—e
  // and m—n the clear cap takes the terminal third of the apical cell and the
  // green comes up to meet it; at 0.92 rad this one reached the shoulders, so
  // its added light washed the whole dome at once and the apex read as a pale
  // ball stuck on the end of the tube rather than as a cap on a green cell.
  // What makes a calyptra legible in the plate is the contrast across its edge,
  // and there is no edge left once it covers everything it could be read
  // against. Nor is there one at 0.62, which was tried: the cap stops short of
  // the dome's own outline from every angle but straight down its axis, and a
  // cap whose rim never reaches the silhouette is not a cap, it is a spot
  // floating on the cell.
  const calyptra = useMemo(
    () => new THREE.SphereGeometry(cellRadius * APEX * 1.055, 30, 16, 0, Math.PI * 2, 0, 0.78),
    [cellRadius],
  )
  useEffect(() => () => calyptra.dispose(), [calyptra])

  const [facingStart, facingEnd] = useMemo(() => {
    const facing = (t, sign) =>
      new THREE.Quaternion()
        .setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          curve.getTangent(t).multiplyScalar(sign).normalize(),
        )
        .toArray()
    return [facing(0, -1), facing(1, 1)]
  }, [curve])

  // A helix is unchanged by rotating it and lifting it together in the right
  // proportion — that is what makes it a screw. So the hormogonium leaving
  // along its own helical path is exactly that pairing, which is also the
  // motion the intact filament uses to glide. One geometry fact, two uses.
  const applyLife = (progress) => {
    const necrosis = smooth(0.05, 0.4, progress)
    const gap = smooth(0.38, 0.62, progress) * MAX_GAP
    const slide = smooth(0.6, 1, progress) * MAX_SLIDE
    const breakAt = LIFE_CYCLE.breakAt

    const near = Math.max(0, breakAt - gap / 2)
    const far = Math.min(1, breakAt + gap / 2)

    materials.body.uniforms.uSpan.value.set(0, near)
    materials.rim.uniforms.uSpan.value.set(0, near)
    materials.fragBody.uniforms.uSpan.value.set(far, 1)
    materials.fragRim.uniforms.uSpan.value.set(far, 1)

    for (const key of ['body', 'fragBody']) {
      materials[key].uniforms.uNecrosis.value = necrosis
      materials[key].uniforms.uNecrosisAt.value = breakAt
    }

    if (driftRef.current) {
      driftRef.current.rotation.y = helixSign() * turns * Math.PI * 2 * slide
      const away = MAX_DEPART * smooth(0.62, 1, progress)
      driftRef.current.position.set(
        DEPART.x * away,
        pitch * turns * slide,
        DEPART.z * away,
      )
    }
    for (const [ref, at] of [
      [breakCapRef, near],
      [fragCapRef, far],
    ]) {
      if (!ref.current) continue
      ref.current.visible = gap > MAX_GAP * 0.25
      curve.getPoint(at, ref.current.position)
    }
  }

  useFrame((_, delta) => {
    const state = life?.current
    if (state) {
      if (state.playing && !reduced) {
        state.progress = (state.progress + delta / CYCLE_SECONDS) % 1
        if (state.slider?.current) state.slider.current.value = String(state.progress)
      }
      applyLife(state.progress)

      const stage = lifeCycleStage(state.progress)
      if (state.name?.current && state.name.current.textContent !== stage.name) {
        state.name.current.textContent = stage.name
        if (state.text?.current) state.text.current.textContent = stage.text
      }
    }

    if (!gliding || reduced || !groupRef.current) return
    const t = travel.current
    const omega = 0.5 // rad/s
    t.spin += omega * delta * t.dir
    t.elapsed += delta
    // gliding Oscillatoriales reverse direction periodically
    if (t.elapsed > 14) {
      t.elapsed = 0
      t.dir *= -1
    }
    groupRef.current.rotation.y = t.spin
  })

  // Fading the rest is how a structure gets pointed at — but the calyptra is
  // read *against* the pigment of the cell under it, so washing that cell out
  // removes the very contrast the cap is visible by. It is a part of the
  // trichome, and it is shown with the trichome.
  const dim =
    selected != null &&
    selected !== 'trichome' &&
    selected !== 'cellUnit' &&
    selected !== 'gliding' &&
    selected !== 'calyptra'
  for (const m of Object.values(materials)) m.uniforms.uFade.value = dim ? 0.72 : 0

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.('trichome')
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      <mesh geometry={geometry} material={materials.body} />
      <mesh geometry={halo} material={materials.rim} raycast={() => null} renderOrder={1} />
      <mesh position={capStart} material={materials.apexBody}>
        <sphereGeometry args={[cellRadius * APEX, 28, 20]} />
      </mesh>
      <mesh position={capStart} material={materials.capRim} raycast={() => null} renderOrder={1}>
        <sphereGeometry args={[cellRadius * APEX * 1.06, 20, 14]} />
      </mesh>
      <mesh
        position={capStart}
        quaternion={facingStart}
        geometry={calyptra}
        material={materials.calyptra}
        renderOrder={2}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.('calyptra')
        }}
      />

      {/* The end left behind by the break. Both new ends are rounded: a
          necridium is not a wound, it is a cell that was spent to make one. */}
      <mesh ref={breakCapRef} material={materials.capBody} visible={false}>
        <sphereGeometry args={[cellRadius, 24, 16]} />
      </mesh>

      {/* The hormogonium: the same tube, the far length of it, screwed away
          along the helix it is still part of. */}
      <group ref={driftRef}>
        <mesh geometry={geometry} material={materials.fragBody} />
        <mesh geometry={halo} material={materials.fragRim} raycast={() => null} renderOrder={1} />
        <mesh position={capEnd} material={materials.apexBody}>
          <sphereGeometry args={[cellRadius * APEX, 28, 20]} />
        </mesh>
        <mesh position={capEnd} material={materials.capRim} raycast={() => null} renderOrder={1}>
          <sphereGeometry args={[cellRadius * APEX * 1.06, 20, 14]} />
        </mesh>
        <mesh
          position={capEnd}
          quaternion={facingEnd}
          geometry={calyptra}
          material={materials.calyptra}
          renderOrder={2}
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.('calyptra')
          }}
        />
        <mesh ref={fragCapRef} material={materials.capBody} visible={false}>
          <sphereGeometry args={[cellRadius, 24, 16]} />
        </mesh>
      </group>
    </group>
  )
}
