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
//
// Nor is a cell a green ball with a cup in it, which is what it became next. A
// cell that size down a good objective shows four things and not one, and three
// of them were missing:
//
//   · the chloroplast's *margin*, which wanders. It was a solid of revolution,
//     so every cell in the field had the same rim at a different angle;
//   · the pyrenoid and the two starch plates that cap it, which is the one
//     structure inside the chloroplast this instrument really picks out;
//   · the refractile granules — starch in the chloroplast, oil in the cytoplasm,
//     and no telling which is which without a stain;
//   · and the emptied mother walls, which the wall card had been describing for
//     as long as it had existed without any of them being on the slide.
//
// And a field is not a bag of cells. That was the last thing wrong with it, and
// the one that cost the most: at any one moment a growing culture is a tableau
// of stages, and the plates are mostly *not* single cells. They are pairs inside
// a wall that has not broken yet, quartets that have just been let go and are
// still touching, and a great many emptied walls between them. So the field is
// built out of units and a unit is a stage — see `buildPopulation` — and a
// daughter inside a sporangium is an ordinary cell with its own wall and its own
// chloroplast, because that is what an autospore is.
//
// Two consequences worth stating, because they are what this file is for:
//
//   · **The magnification is a choice with a cost.** A species record says how
//     much slide is in frame, and halving it quarters the number of cells while
//     doubling their size. Neither number is tuned: the count follows from the
//     culture's density, the field and the coverslip gap. What was traded away
//     is sample size for the one comparison this view exists to support — the
//     size distribution of two species — and what was bought is that anything
//     inside a cell is above the resolution limit rather than below it.
//   · **None of this is Chlorella's.** `kind: 'coccoid-field'` is the contract:
//     a species brings sizes, a density, a clumping habit, how much of its field
//     is dividing and how much of it is wreckage, and gets all of the above. The
//     next coccoid in this atlas adds a record, not a renderer.
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { chloroplastCup } from './geometry.js'
// The organism, which this file does not own. See coccoid.js.
import { buildPopulation, CUPS, RESOLVED_FLOOR } from './coccoid.js'
import { haloMaterial, refractileMaterial, specimenMaterial } from './specimen.jsx'


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

// One instanced body, with its own ref so the caller does not have to keep
// fifteen of them. `renderOrder` is not decoration here — see the note on the
// render order down in the component.
function Bodies({ geometry, material, items, scale = 1, renderOrder = 0, pick = false }) {
  const ref = useRef()
  useInstances(items, ref, scale)
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, Math.max(1, items.length)]}
      raycast={pick ? undefined : () => null}
      renderOrder={renderOrder}
      visible={items.length > 0}
      frustumCulled={false}
    />
  )
}

const ORIGIN = new THREE.Vector3()

// `form` is the species record's `exterior` block, exactly as for the trichome:
// the organism and nothing about how it is rendered. `focus` and `aperture` are
// the objective's, and they are here for one term only — see below.
export default function CellField({ form, focus, aperture = 0, onSelect }) {
  const { cells, walls } = useMemo(() => buildPopulation(form), [form])
  // Every cell is a cell, daughters included — see makeCell. There is no longer
  // a second class of body for the ones inside a sporangium, and with it went
  // the separate rim that used to be needed to keep them apart: a daughter has
  // its own Becke line now because it has its own wall, which is what actually
  // separates two of them on a plate.
  const byCup = useMemo(
    () => Array.from({ length: CUPS }, (_, v) => cells.filter((c) => c.variant === v)),
    [cells],
  )
  const closedWalls = useMemo(() => walls.filter((w) => !w.torn), [walls])
  const tornWalls = useMemo(
    () => [0, 1].map((v) => walls.filter((w) => w.torn && w.variant === v)),
    [walls],
  )
  const matrices = useMemo(() => cells.map((c) => c.pyrenoid), [cells])
  // The starch plates and the loose granules are one optical class and one
  // instanced mesh: both are small clear bodies in a pigmented cell, and the
  // only thing that separates them on this view is where they sit.
  const refractile = useMemo(
    () =>
      cells
        .flatMap((c) => [...c.plates, ...c.granules])
        // See RESOLVED_FLOOR: what the objective cannot resolve is not drawn,
        // because these bodies compound and forty faint ones are not faint.
        .filter((b) => b.density >= RESOLVED_FLOOR),
    [cells],
  )

  const geometries = useMemo(
    () => ({
      // Tessellation is not a free parameter once the cells are twice the size
      // on screen. `1/cos` is a steep function of an interpolated normal, and
      // at 24 x 16 on a body 150 pixels across it banded: the shading stepped
      // between vertex rings and a large cell came out drawn in contour lines.
      // On the cup it was worse and more obviously wrong, because a lathe's
      // profile bands run from the mouth to the pole — so seen down the axis
      // they are concentric circles, and the cell looked like a tree ring.
      body: new THREE.SphereGeometry(1, 48, 32),
      halo: new THREE.SphereGeometry(1, 32, 22),
      // The six chloroplasts, and they differ in two things rather than one.
      //
      // The mouth's half-angle runs from a cup that has nearly closed over to a
      // shallow bowl — the generic diagnosis says parietal and cup-shaped and
      // says nothing about how far it closes, and the plates show the whole
      // range in one field.
      //
      // The wall's *thickness* was the variable that was missing, and it is the
      // one that decides what kind of cell you are looking at. A thin parietal
      // sheet reads as a green ring with a clear middle; half the cell's radius
      // of pigment reads as a solid green mass with a notch in it; and the
      // plates are full of both. Held at 0.34 for every cell, as it was, six
      // openings at forty orientations still came out as six versions of one
      // cell, which is what "they all look the same" meant.
      cups: [
        [0.62, 0.46],
        [0.8, 0.3],
        [0.95, 0.4],
        [1.05, 0.24],
        [1.2, 0.34],
        [1.35, 0.26],
      ].map(([open, thickness], i) =>
        chloroplastCup({
          outer: 1,
          thickness,
          open,
          incision: 0.3,
          lobes: 0.075,
          // The sheet is lobed in *thickness* as well as in outline, and that is
          // what puts any structure at all inside a chloroplast's face. A shell
          // is drawn by 1/cos through its wall, and 1/cos is flat wherever the
          // wall faces you — so with one thickness everywhere the whole middle
          // of every cell came out a single flat green, whatever the pigment or
          // the grain did on top of it.
          ridges: 0.34,
          // And it thins away at the mouth instead of stopping. This is the fix
          // for the straight-sided lime patch that sat in the middle of every
          // in-focus cell: inside the rim the beam crosses four walls and
          // outside it two, and at a constant thickness that halving happens in
          // one step along a curve sampled at a few dozen points. However finely
          // the surface is tessellated, a hard edge on a sampled curve is a
          // polygon.
          margin: 0.18,
          // Round enough that the margin itself is not the sampling either.
          radial: 96,
          segments: 48,
          seed: 8101 + i * 37,
        }),
      ),
      // Two ruptures: one barely split, one torn back to a saucer. `incision` is
      // high because a burst wall does not tear along a circle — but not so high
      // that the tear reads as a cut polygon.
      //
      // And crumpled, which is the thing that was missing and the reason these
      // were the loudest objects in the frame. An emptied wall is a few tens of
      // nanometres of glucosamine with medium on both sides and nothing left
      // inside to hold it out: it does not stay a sphere, it collapses and
      // folds. Drawn as rigid globes at a lobing of 0.045 they came out as
      // near-perfect thin circles, and a perfect circle is the shape the eye
      // picks out of a field before anything else — so a slide whose subject is
      // a population of algae read as a tray of bubbles with some algae among
      // them. Nothing about how many there are changed here. What changed is
      // that they stopped being drawn as though they were still turgid.
      shells: [0.8, 1.35].map((open, i) =>
        chloroplastCup({
          outer: 1,
          thickness: 0.075,
          open,
          // Gently. At 0.55 and 0.17 the crumpling stopped reading as a limp
          // wall and started reading as a *shard* — hard angular facets with a
          // dark line along each of them, broken glass rather than broken
          // cellulose. A wall a few tens of nanometres thick has no stiffness
          // to fold sharply with; what it does is sag.
          incision: 0.36,
          lobes: 0.095,
          radial: 72,
          segments: 38,
          seed: 6301 + i * 53,
        }),
      ),
      // See `clear` below: a sphere whose only job is to be a distance.
      proxy: new THREE.SphereGeometry(1, 16, 12),
      // The wall of a mother that has not broken yet: one surface, drawn as a
      // shell, so the beam crosses it twice and it needs no thickness of its own
      // — the SHELL path model in specimenMaterial is what supplies that.
      wall: new THREE.SphereGeometry(1, 48, 34),
      pyrenoid: new THREE.SphereGeometry(1, 20, 14),
      grain: new THREE.SphereGeometry(1, 20, 14),
      glow: new THREE.SphereGeometry(1, 20, 14),
    }),
    [],
  )
  useEffect(
    () => () =>
      Object.values(geometries)
        .flat()
        .forEach((g) => g.dispose()),
    [geometries],
  )

  const materials = useMemo(() => {
    const green = form.colour ?? '#2f6b34'
    // Light that misses this body altogether: the condenser illuminates over a
    // cone, and at the outer angles of it part of the beam passes a cell two
    // micrometres across rather than through it. A property of the instrument
    // and not of any one organelle, so every material here takes the same
    // number and none of them is allowed its own.
    //
    // Small, because most of what keeps a micrograph off the floor of the
    // encoding is not this. It is the glare inside the objective, and that is
    // in the optics pass rather than here — see uVeil in optics.jsx for why a
    // floor carried by each body separately gives the wrong answer as soon as
    // two of them overlap.
    const VEIL = 0.02
    return {
      // Cytoplasm, which is colourless. It is here for its outline and for the
      // little it does take out of the beam, not for colour — putting the green
      // in the cell body rather than in the chloroplast is what made these read
      // as uniformly pigmented balls.
      // The one body in a cell that writes depth, and it has to.
      //
      // Everything here was depthWrite:false so that nested absorbers would
      // multiply instead of occluding each other — right for the colour, and
      // quietly fatal for the focus. The depth-of-field pass reads the depth
      // buffer to learn how far away each pixel is; where nothing writes it, it
      // finds the background. Every cell was therefore being told it sat at the
      // far plane and blurred by the maximum, whatever the fine focus was set
      // to, while the slide debris — which does write depth — came in and out of
      // focus perfectly. That is exactly the complaint: the focus works on
      // everything except the specimen.
      //
      // So the cell's outer surface writes depth, and it is drawn after its own
      // organelles so that it does not reject them. The cost is that two
      // overlapping cells no longer darken each other, which is a small error in
      // the absorption; the alternative was a specimen that could not be brought
      // into focus at all.
      body: specimenMaterial({
        core: '#e3e0d4',
        density: 0.3,
        // The dark contour at the wall: light refracted out of the objective's
        // cone. Real, and it stays — but modest. It was pushed to 1.7 to force
        // an outline the optics were not yet producing, and once the phase term
        // arrived that outline was being drawn three times over: here, in the
        // halo shell below, and in the pass. Three renderings of one Becke line
        // is what made the cells look cut out and pasted on.
        edge: 1.25,
        // And it is a *line*. At the cube the term ran a third of the way in
        // from the silhouette, which is a soft shoulder the width of an
        // organelle: every cell came out airbrushed, with no wall you could
        // point at. A cell wall imaged by a good objective is something you
        // could measure with the eyepiece graticule, so the shoulder is pulled
        // in to a few per cent of the radius and the coefficient raised to keep
        // the same darkness at the edge itself.
        edgeShape: 6,
        veil: VEIL,
        perInstance: true,
      }),
      // A whisper. The bright line outside a transparent body is mostly a
      // defocus effect and the pass now produces it from the physics, where it
      // correctly appears as a cell leaves the plane of focus and vanishes as it
      // enters. What is left here is the little of it that survives at focus.
      // Quieter than it was, and for the same reason the margins were
      // tightened: the field behind it is bright now rather than dim, and an
      // additive line of the old strength over a background near 190 reaches
      // white. A white ring round every cell, in focus or not, is the look of a
      // sticker and not of a body in water.
      rim: haloMaterial({ color: '#f2efe0', strength: 0.075, sharpness: 9 }),
      // The chloroplast, and with it all the pigment.
      cup: specimenMaterial({
        core: green,
        // Down from 0.5, and the reason is arithmetic rather than taste. The
        // colour above is what *one* unit of pigment transmits, and nothing had
        // ever pinned the drawn path to one unit: a shell crossed twice at a
        // mean 1/cos of about two, times the per-instance spread, was putting
        // something over two units in the beam. So the field was drawn at twice
        // the optical density it was calibrated at — the median cell came out
        // passing 0.37 of the field in red where the plate it was measured from
        // says 0.68. Measured, not guessed: see the note on the colour.
        //
        // 0.36 and not the 0.28 that arithmetic alone gave, because the taper
        // takes its own bite: a sheet that thins to nothing at its margin
        // crosses less pigment than a sheet of one gauge, so the two
        // corrections compounded and the first render of them had the cells as
        // pale green clouds. This lands the median cell near two thirds of the
        // field in luminance — a shade under what the plate shows, which is
        // what a culture looks like when it has not been exposed for its
        // background.
        density: 0.36,
        edge: 0.2,
        // Chlorophyll's bands are narrow and a camera's are not, so a long path
        // through a chloroplast is survived by the parts of each band the
        // pigment never covered. Without this every channel falls at the same
        // relative rate and a dense cell clips to a blue of zero.
        band: 0.14,
        veil: VEIL,
        // The lobed sheet from chloroplastCup: thick over the ridges, thinning
        // to nothing at the margin.
        taper: true,
        perInstance: true,
        depthWrite: false,
        shell: true,
        // Lobes about 0.6 µm across, which is roughly what the plates show
        // inside a seven-micrometre cell: half a dozen to a face, not a fine
        // speckle and not three great blobs. Both numbers went up when the field
        // halved and the cells doubled on screen — at 0.8 µm and 0.55 the
        // mottling that carries most of a chloroplast's texture was being drawn
        // at a scale the old magnification could just about show and this one
        // renders as three flat patches.
        //
        // Louder than the 0.7 it was, because it was inaudible: the mottle
        // multiplies the optical density, and with the blue channel already
        // clipped to zero and the green channel barely absorbed there was
        // nothing left for it to modulate. It only became visible once the
        // density came down and the band model put the dark end back on scale.
        // Read as a log: the pigment in the ridges is exp(0.95 * mottle) times
        // the pigment in the hollows, so a typical cell runs about a quarter
        // thicker and thinner than its mean and the rare extreme reaches three
        // times. See the GRAIN block in specimen.jsx for why it is a factor
        // rather than a difference.
        grain: 0.95,
        grainSize: 0.6,
        // Folded before it is sampled, so the lobes draw out into bands and
        // swirls the way stacked lamellae do. Unwarped noise makes round blobs
        // of one size, which is a sponge and not a plastid.
        grainWarp: 0.55,
      }),
      // The pyrenoid matrix: protein, and protein is not pigment. It takes a
      // little more out of the beam than the stroma round it, which is why the
      // middle of the bright body is not the brightest part of it.
      pyrenoid: specimenMaterial({
        core: '#9dbb8d',
        density: 0.42,
        edge: 0.9,
        edgeShape: 4,
        band: 0.14,
        veil: VEIL,
        perInstance: true,
        depthWrite: false,
      }),
      // What a starch plate or an oil drop takes out of the beam, which is
      // almost nothing — and the dark ring it leaves at its own margin, which is
      // most of how you find one. The brightness is the other material below.
      grain: specimenMaterial({
        core: '#eceadc',
        density: 0.5,
        // At 1.9 a plate seen edge-on ran the whole 1/cos of its own margin and
        // came out a black lens in the middle of the chloroplast — the pyrenoid
        // marked as the darkest thing in the cell, which is the opposite of
        // what it is. What is left is the outline, which a refractile body does
        // have and which is half of how the eye finds one: on the plates the
        // bright region inside a cell is not a wash, it is two or three bodies
        // each with a margin of its own.
        //
        // Light, though, now that it is drawn over the brightness rather than
        // under it. The edge term goes as (1 - cos)^3, which on a sphere is a
        // fat ring and not a line: at 1.35, with five bodies' rings crossing
        // each other, the pyrenoid went from a pale wash straight to a dark
        // smudge — the same mistake in the other direction.
        //
        // Carried by the shape rather than by the amount, now. A refractile
        // body half a micrometre across has a margin a good deal thinner than
        // half a micrometre, so the ring belongs in the last few per cent of
        // the radius; spread over a third of it, five of them crossing made a
        // smudge whatever the coefficient was. Tightened, the same darkness
        // buys an outline you can count the bodies by, which is how the eye
        // finds them on a plate.
        edge: 1.15,
        edgeShape: 6,
        veil: VEIL,
        perInstance: true,
        depthWrite: false,
      }),
      // And the light it bends into the objective.
      // Loud enough to be the thing you look at. In the CAUP plates the bright
      // bodies are the most conspicuous feature of a cell at this magnification
      // — two to four of them, unmistakable — and the first pass had them as a
      // faint sheen you had to be told was there.
      // A grain lifts the pigment a tenth of the way towards the lamp, and a
      // pile of them compounds instead of summing — see refractileMaterial.
      // What the figure should be is checkable rather than a matter of taste: a
      // grain displaces its own diameter of pigment out of a path several times
      // longer, so what it gives back is the difference between the cell's
      // transmittance and that transmittance with a third of the pigment gone.
      // On a cell measured off the frame at (73, 96, 19) against a field of
      // (184, 182, 164) that is about 24 of 255, and this lands there.
      //
      // The colour is the lamp's, not white: what a grain gives back is the
      // light the chlorophyll would otherwise have taken, and that light is the
      // field's.
      //
      // The figure is recomputed rather than nudged, because the quantity it is
      // a fraction *of* has moved. This screens a share of the headroom left
      // above whatever is already there — so when the pigment lightened and the
      // field went from 184 to about 195, the old 0.06 stopped being the step
      // it had been calibrated as and the bodies that are supposed to be the
      // most conspicuous thing in a cell at this magnification went back to
      // being invisible.
      //
      // The calibration is the one stated when this material was written: a
      // grain displaces its own diameter of pigment out of a path several times
      // longer, so what it gives back is the difference between the cell's
      // transmittance and that transmittance with about a third of the pigment
      // gone. At the drawn path of some 1.3 units the green channel runs 0.65
      // with the pigment and 0.75 without that third — a difference of 0.10
      // against a headroom of 0.35, which is 0.28 of what is left. That is the
      // peak, at the middle of the body; the falloff towards its margin takes
      // the average well below it.
      glow: refractileMaterial({ color: '#efe9cf', strength: 0.2, perInstance: true }),
      // A mother wall, whole or broken: no pigment at all, so nothing but the
      // outline and the doubled crossing where it is seen edge-on.
      // Faint, and it has to be. There is nothing in it: no pigment, no
      // cytoplasm, nothing but a wall a few tens of nanometres thick with the
      // medium on both sides of it. Drawn at the density a cell body is drawn
      // at, the emptied walls came out as brown dishes and read as the largest
      // objects on the slide — which is the opposite of the truth about them.
      // What finds one down a real objective is its outline and nothing else.
      shell: specimenMaterial({
        core: '#f6f5f1',
        // Fainter than anything else on the slide, because there is less in it
        // than in anything else on the slide. At 0.13 the emptied walls still
        // had enough substance for the pass's phase term to work on, and a
        // defocused phase object grows a bright middle — so the largest, palest,
        // most solid-looking objects in the frame were the ones with nothing
        // inside them at all. What finds one of these down a real objective is
        // a faint closed line and a suspicion.
        density: 0.07,
        // Pale in the middle, definite at the margin: the plates show these as
        // sharply outlined and empty, not as grey smudges. But a wall is the
        // one body here with nothing inside it, and there are a lot of them — a
        // mother's wall is the size of a mother while most cells in a field are
        // a third that, so drawn as heavily as a cell they became the largest
        // and darkest objects on the slide and the culture read as mostly
        // wreckage. Lighter than the living cells, which is what they are.
        //
        // And an *outline*, which is the whole of what finds one. Spread over a
        // third of the radius as it was, an emptied wall came out as a grey
        // annulus a micrometre wide — a soap bubble, and with a couple of dozen
        // of them in frame the field read as a tray of marbles with the odd
        // cell among them. Tightened to a line and lightened to match, the same
        // walls are there and stop being the subject.
        edge: 0.42,
        edgeShape: 7,
        veil: VEIL,
        perInstance: true,
        shell: true,
        // A double-sided shell that writes depth fights *itself*: the near face
        // of the bowl rejects the far one, triangle by triangle in whatever
        // order they were submitted, and the wall comes out as a visible net of
        // its own mesh. So it does not write depth — and `clear` below does it
        // instead.
        depthWrite: false,
      }),
      // A pane of nothing.
      //
      // Its transmittance is exactly one, so it multiplies the field by one and
      // cannot be seen; what it is for is the depth buffer. The depth-of-field
      // pass learns how far away a pixel is by reading depth, and an emptied
      // wall that writes none is told it sits at the far plane and blurred to
      // the maximum whatever the fine focus says — the same fault the cells had
      // before their outer surface started writing it. A living cell has a body
      // to carry that distance. A wall with nothing in it does not, so it is
      // given one.
      clear: specimenMaterial({ core: '#ffffff', density: 0, edge: 0 }),
    }
  }, [form.colour])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  // Where the plane of focus is, worked out the way the optics pass works it
  // out: the distance to whatever the viewer has centred, plus the fine focus.
  // Only the refractile bodies need it — everything else is an absorber, and an
  // absorber out of focus is simply blurred. A body that bends light is not: it
  // only bends it while it is near focus, and without this it went on screening
  // the pigment away from ten micrometres out. A ref rather than state, because
  // the fine focus is dragged.
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  useFrame(() => {
    const centred = camera.position.distanceTo(controls?.target ?? ORIGIN)
    materials.glow.uniforms.uFocus.value = centred + (focus?.current ?? 0)
    materials.glow.uniforms.uAperture.value = aperture
  })

  // Nothing fades here, and that is deliberate. The fade is a highlight: it
  // exists in the cutaway so that selecting one organelle out of a dozen can
  // push the other eleven back. Every card in this specimen — the cell, its
  // wall, its chloroplast, its pyrenoid, its granules, its autospores, and the
  // question of which species it is — is about something this one body draws, so
  // there is nothing to fade *to*. Fading the whole field to answer "which
  // species is this?" was the panel dimming the specimen to talk about it.

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
      {geometries.cups.map((geometry, v) => (
        <Bodies key={v} geometry={geometry} material={materials.cup} items={byCup[v]} scale={0.9} />
      ))}
      <Bodies geometry={geometries.pyrenoid} material={materials.pyrenoid} items={matrices} />

      {/* The mother walls. A whole one is a sporangium — the daughters inside it
          are ordinary cells and were drawn above — and a broken one is what she
          leaves behind. Same wall, same material, two geometries. */}
      <Bodies geometry={geometries.wall} material={materials.shell} items={closedWalls} />
      {tornWalls.map((items, v) => (
        <Bodies key={v} geometry={geometries.shells[v]} material={materials.shell} items={items} />
      ))}

      {/* The pass that brightens rather than absorbs, and it goes here for one
          reason: after the pigment. A
          refractile grain is bright because there is no chlorophyll where it
          sits, so what it does is give back some of what the chloroplast took,
          and something given back has to land on top of the taking. Drawn
          underneath, as this was first, the cup multiplied the grain's own
          brightness away again and the pyrenoid went back to being invisible. */}
      <Bodies
        geometry={geometries.glow}
        material={materials.glow}
        items={refractile}
        renderOrder={1}
      />

      {/* And then their own margins, over the brightness rather than under it.
          A refractile body is bright through the middle and ringed with dark,
          and the ring is the half of it the eye actually finds. Drawn first, as
          this was, the screening pass painted straight over it and the pyrenoid
          and its grains merged into one soft pale wash with no bodies in it —
          which is not what the plates show, where the bright region inside a
          cell resolves into two or three separate things. */}
      <Bodies
        geometry={geometries.grain}
        material={materials.grain}
        items={refractile}
        renderOrder={2}
      />

      {/* After the organelles, so writing depth does not reject them, and it is
          this surface's distance the depth-of-field pass reads. */}
      <Bodies
        geometry={geometries.body}
        material={materials.body}
        items={cells}
        renderOrder={3}
        pick
      />
      {/* And the same job done for the mother walls, which have no body of
          their own to do it with. Invisible; see `clear`. */}
      <Bodies
        geometry={geometries.proxy}
        material={materials.clear}
        items={walls}
        renderOrder={3}
      />

      {/* The bright line just outside a transparent body in transmitted light,
          drawn as its own shell for the same reason the trichome's is: the
          specimen multiplies the field, and a Becke line adds to it. Last, so it
          sits over everything it belongs to. */}
      <Bodies
        geometry={geometries.halo}
        material={materials.rim}
        items={cells}
        scale={1.055}
        renderOrder={4}
      />
    </group>
  )
}
