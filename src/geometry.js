import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { seededRandom } from './science.js'

// Builds a solid annular (or pie) sector, extruded along Y and centred on the
// origin — the shape that gives a cutaway model real cut faces.
//
// Angles are world angles about +Y, measured from +X towards +Z, the same frame
// every structure is placed in. Extruding a 2D shape and laying it down mirrors
// the sweep, so the shape angles are the negated world ones.
export function sectorGeometry({
  rIn = 0,
  rOut,
  height,
  angleStart = 0,
  angleLength,
  curveSegments = 160,
}) {
  const shape = new THREE.Shape()
  const thetaStart = -(angleStart + angleLength)
  const end = thetaStart + angleLength
  if (rIn <= 0) {
    shape.moveTo(0, 0)
    shape.lineTo(rOut * Math.cos(thetaStart), rOut * Math.sin(thetaStart))
    shape.absarc(0, 0, rOut, thetaStart, end, false)
    shape.lineTo(0, 0)
  } else {
    shape.moveTo(rIn * Math.cos(thetaStart), rIn * Math.sin(thetaStart))
    shape.lineTo(rOut * Math.cos(thetaStart), rOut * Math.sin(thetaStart))
    shape.absarc(0, 0, rOut, thetaStart, end, false)
    shape.lineTo(rIn * Math.cos(end), rIn * Math.sin(end))
    shape.absarc(0, 0, rIn, end, thetaStart, true)
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments,
    steps: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -height / 2, 0)
  geometry.computeVertexNormals()
  roundCylindricalNormals(geometry)
  return geometry
}

// An extrusion does not share vertices between its swept quads, so
// `computeVertexNormals` can only give each of them the normal of its own facet:
// a cylinder built from 160 segments is 160 flat panels, and once the camera is
// close enough to fit one panel on the screen that is exactly what it looks
// like. Every seam between two of them is a step in the shading of a surface
// that has no step in it.
//
// The fix has to be selective, because the same geometry carries faces that are
// genuinely flat — the two radial cuts and the caps at either end — and those
// have to keep their edges. A normal that is already pointing along its own
// radius belongs to the swept face and is replaced by the exact radial
// direction; anything else is left alone. The positions are untouched, so the
// silhouette is still a polygon — but on a 4 µm radius the deviation is under
// half a nanometre, which is a tenth of the thinnest thing in this model.
function roundCylindricalNormals(geometry) {
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const r = Math.hypot(x, z)
    if (r < 1e-6) continue
    const rx = x / r
    const rz = z / r
    const along = normal.getX(i) * rx + normal.getZ(i) * rz
    if (Math.abs(along) < 0.9) continue
    const sign = Math.sign(along)
    normal.setXYZ(i, sign * rx, 0, sign * rz)
  }
  normal.needsUpdate = true
}

// The cross-wall, as a surface rather than a plate.
//
// In a longitudinal section of a healthy cell (Deschoenmaeker et al. 2016,
// Fig. 2, N+) a septum is a thin line you have to look for: faintly darker than
// the cytoplasm, curved, and running oblique to the filament. The flat,
// high-contrast bulkheads in the same figure are the *starved* cells, where the
// septa swell from 40 nm to 100–200 nm. And it is not a separate object: it is
// an invagination of the wall's own L-II layer flanked by L-I, the envelope
// folding inwards.
//
// So the sheet bows, ripples and leans, and it thickens as it returns to the
// wall it is continuous with. `septumSurface` is exported because the granules
// and the aerotopes rest on this surface, and a floor drawn in one place and
// rested on in another is two floors.
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const SEPTUM_PHASE = [1.9, 4.4, 0.7]

export function septumSurface(x, z, rOut) {
  const r = Math.min(1, Math.hypot(x, z) / rOut)
  const theta = Math.atan2(z, x)
  // A shallow bow, highest off-centre rather than dead in the middle.
  const bow = 92 * (1 - r * r)
  // Low-frequency ripple, which the wall damps out as it is approached.
  // Damped towards the axis, not away from it. It used to be strongest exactly
  // where `theta` is undefined, so the height at the centre depended on which
  // direction you approached the origin from — a ±58 nm discontinuity at the
  // one point the whole view is framed on, and a starburst of normals in the
  // innermost ring of the grid.
  const ripple =
    58 *
    (0.62 * Math.sin(2 * theta + SEPTUM_PHASE[0]) +
      0.28 * Math.sin(3 * theta + SEPTUM_PHASE[1]) +
      0.14 * Math.sin(5 * theta + SEPTUM_PHASE[2])) *
    smoothstep(0, 0.16, r) *
    (1 - 0.35 * r * r)
  // And the whole thing sits oblique to the axis, as they do.
  const oblique = 0.016 * x - 0.021 * z
  return bow + ripple + oblique
}

// Built as a surface on a polar grid rather than as an extruded shape. An
// extrusion triangulates its outline and puts no vertices inside, so there is
// nothing in the middle of it to bend — a flat plate is the only thing it can
// ever be.
//
// Angles here are world angles used directly, with none of the mirroring
// `sectorGeometry` has to do: nothing is extruded and laid down, so nothing
// sweeps the wrong way.
export function septumGeometry({
  rOut,
  thickness,
  angleStart,
  angleLength,
  rings = 40,
  rimThickening = 2.2,
}) {
  const halfAt = (r) => (thickness * (1 + (rimThickening - 1) * Math.pow(r / rOut, 5))) / 2
  const faceY = (x, z, sign) => {
    const r = Math.hypot(x, z)
    return septumSurface(x, z, rOut) + sign * halfAt(r)
  }
  const at = (i, j, sign, segments) => {
    const r = (i / rings) * rOut
    const phi = angleStart + (j / segments) * angleLength
    const x = r * Math.cos(phi)
    const z = r * Math.sin(phi)
    return [x, faceY(x, z, sign), z]
  }
  // The gradient of the surface, by difference. computeVertexNormals() on a
  // non-indexed grid gives one normal per facet, and on the widest surface in
  // the frame that reads as a mosaic: 1562 of 2000 sampled triangles were flat.
  const E = 6
  const faceNormal = (x, z, sign) => {
    const dx = (faceY(x + E, z, sign) - faceY(x - E, z, sign)) / (2 * E)
    const dz = (faceY(x, z + E, sign) - faceY(x, z - E, sign)) / (2 * E)
    const n = [-dx * sign, sign, -dz * sign]
    const l = Math.hypot(n[0], n[1], n[2]) || 1
    return [n[0] / l, n[1] / l, n[2] / l]
  }

  const positions = []
  const normals = []
  const quad = (a, b, c, d, na, nb, nc, nd) => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d)
    normals.push(...na, ...nb, ...nc, ...na, ...nc, ...nd)
  }
  const surfaceQuad = (p0, p1, p2, p3, sign) => {
    const n = (p) => faceNormal(p[0], p[2], sign)
    quad(p0, p1, p2, p3, n(p0), n(p1), n(p2), n(p3))
  }
  const flatQuad = (a, b, c, d, n) => quad(a, b, c, d, n, n, n, n)

  // Segments proportional to radius: a fixed count gave 153 x 19 nm quads at
  // quarter-radius and 153 x 77 at the rim, over-tessellated the wrong way.
  const segmentsAt = (i) =>
    Math.max(12, Math.round((angleLength * (i / rings) * rOut) / 55))

  for (let i = 0; i < rings; i++) {
    const segments = Math.max(segmentsAt(i), segmentsAt(i + 1))
    for (let j = 0; j < segments; j++) {
      surfaceQuad(
        at(i, j, 1, segments),
        at(i, j + 1, 1, segments),
        at(i + 1, j + 1, 1, segments),
        at(i + 1, j, 1, segments),
        1,
      )
      surfaceQuad(
        at(i, j, -1, segments),
        at(i + 1, j, -1, segments),
        at(i + 1, j + 1, -1, segments),
        at(i, j + 1, -1, segments),
        -1,
      )
    }
  }
  // The rim, where the sheet swells back into the envelope it is part of.
  const rimSegments = segmentsAt(rings)
  for (let j = 0; j < rimSegments; j++) {
    const phi = angleStart + ((j + 0.5) / rimSegments) * angleLength
    flatQuad(
      at(rings, j, 1, rimSegments),
      at(rings, j + 1, 1, rimSegments),
      at(rings, j + 1, -1, rimSegments),
      at(rings, j, -1, rimSegments),
      [Math.cos(phi), 0, Math.sin(phi)],
    )
  }
  // The two faces the cutaway leaves behind.
  for (let i = 0; i < rings; i++) {
    const segments = segmentsAt(rings)
    const a0 = angleStart
    const a1 = angleStart + angleLength
    flatQuad(
      at(i, 0, 1, segments),
      at(i, 0, -1, segments),
      at(i + 1, 0, -1, segments),
      at(i + 1, 0, 1, segments),
      [Math.sin(a0), 0, -Math.cos(a0)],
    )
    flatQuad(
      at(i, segments, -1, segments),
      at(i, segments, 1, segments),
      at(i + 1, segments, 1, segments),
      at(i + 1, segments, -1, segments),
      [-Math.sin(a1), 0, Math.cos(a1)],
    )
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geometry
}

// The backdrop the anatomy is read against — and nothing more. A solid sector
// would carry two flat radial cut faces, and those are the whole problem: from
// inside the cutaway they face away and are culled, so they cost nothing, but
// orbit round the back and they turn broadside to the camera and stand up as
// two blank slabs across the cell. A shell has no cut faces to turn.
//
// Cylinder angles are not world angles: three sweeps x = r sin(theta),
// z = r cos(theta), so theta = pi/2 - phi and the sector has to be handed over
// mirrored, the same trap `sectorGeometry` documents above.
export function sectorShell({ r, height, angleStart, angleLength, segments = 160 }) {
  return new THREE.CylinderGeometry(
    r,
    r,
    height,
    segments,
    1,
    true, // open ended: no lids either, the cross-wall is the floor you see
    Math.PI / 2 - angleStart - angleLength,
    angleLength,
  )
}

// --- The sheath -------------------------------------------------------------
//
// The extracellular polysaccharide outside the wall, built as a surface with a
// thickness rather than as a layer with a number.
//
// It is 50 nm on a cell 8 µm across — six thousandths of the diameter, and
// about four pixels at whole-cell zoom. Drawn the way the wall is drawn, as a
// ring of constant thickness, it would be a pencil line round the envelope:
// invisible, and wrong in the one way that matters, because the whole point of
// this layer is that it is not a fifth wall layer. It is a secreted gel. So:
//
//   The thickness is a field over angle and height, not a number. Most of the
//   coat sits near the measured 50 nm and a few places run out to the 300 nm
//   the fibrillar layer reaches, which is what "variable in abundance" means
//   when you have to draw it. The tail is stretched rather than the mean
//   raised — a coat that is everywhere 300 nm is a different object from a
//   50 nm coat with strands in it.
//
//   Only the outer surface, the rims and the cut faces are built. An inner
//   surface would sit on the wall's own outer face, where it can only z-fight,
//   and from inside the cutaway it would face the camera and stand up as a band
//   across the view — the same trap the wall documents. Nothing is watertight
//   here and nothing needs to be: there is only ever one layer of coat on
//   screen, because the far side is culled, which is also why `GEL` can write
//   depth and let the depth-of-field and the crevice darkening treat the coat
//   as something that is actually there.
//
// The rest is the material's job. A thin transparent coat is nearly clear seen
// face on, where the line of sight crosses 50 nm of it, and obvious at the
// silhouette, where it runs along it for micrometres. Rendering it that way —
// a fresnel edge rather than a fill — is both what a gel does and the reason
// the layer does not have to be exaggerated to be seen.
export function sheathGeometry({
  rIn,
  height,
  angleStart,
  angleLength,
  nominal,
  fibrillarMax,
  seed = 5150,
  rings = 30,
  segments = 220,
}) {
  const rnd = seededRandom(seed)
  const TAU = Math.PI * 2
  const p = Array.from({ length: 4 }, () => rnd() * TAU)

  // Patchy at the scale of a cell, not at the scale of a fibril: a 3 nm fibril
  // is four orders of magnitude under a pixel and belongs in the shading.
  const thickness = (theta, y) => {
    const f = Math.min(
      1,
      Math.max(
        0,
        0.5 +
          0.3 * Math.sin(3 * theta + y / 900 + p[0]) +
          0.2 * Math.sin(5 * theta - y / 1400 + p[1]) +
          0.13 * Math.sin(8 * theta + y / 620 + p[2]) +
          0.08 * Math.sin(13 * theta - y / 430 + p[3]),
      ),
    )
    const strand = Math.pow(Math.max(0, f - 0.62) / 0.38, 2)
    return nominal * (0.35 + 0.95 * f) + (fibrillarMax - nominal * 1.3) * strand
  }

  const half = height / 2
  const positions = []
  const normals = []
  const push = (v, n) => {
    positions.push(v[0], v[1], v[2])
    normals.push(n[0], n[1], n[2])
  }
  const quad = (a, b, c, d, na, nb, nc, nd) => {
    push(a, na)
    push(b, nb)
    push(c, nc)
    push(a, na)
    push(c, nc)
    push(d, nd)
  }

  const thetaAt = (j) => angleStart + (j / segments) * angleLength
  const yAt = (i) => -half + (i / rings) * height
  const at = (r, theta, y) => [r * Math.cos(theta), y, r * Math.sin(theta)]
  const inner = (j, i) => at(rIn, thetaAt(j), yAt(i))
  const outer = (j, i) => {
    const theta = thetaAt(j)
    const y = yAt(i)
    return at(rIn + thickness(theta, y), theta, y)
  }

  // The gradient of the surface r(theta, y), by difference. For F = r - R the
  // cylindrical gradient is (1, -R_theta / r, -R_y); scaled by r that is
  // (r, -R_theta, -r R_y) in the (radial, tangential, axial) frame. Recovering
  // it from the triangles instead would give one normal per facet, and on a
  // surface this shallow that reads as a mosaic.
  const outerNormal = (j, i) => {
    const theta = thetaAt(j)
    const y = yAt(i)
    const dT = angleLength / segments
    const dY = height / rings
    const rT = (thickness(theta + dT, y) - thickness(theta - dT, y)) / (2 * dT)
    const rY = (thickness(theta, y + dY) - thickness(theta, y - dY)) / (2 * dY)
    const r = rIn + thickness(theta, y)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    // radial = (c, 0, s), tangential = (-s, 0, c), axial = (0, 1, 0)
    const v = [r * c + rT * s, -r * rY, r * s - rT * c]
    const l = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / l, v[1] / l, v[2] / l]
  }

  const UP = [0, 1, 0]
  const DOWN = [0, -1, 0]

  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < rings; i++) {
      quad(
        outer(j, i),
        outer(j, i + 1),
        outer(j + 1, i + 1),
        outer(j + 1, i),
        outerNormal(j, i),
        outerNormal(j, i + 1),
        outerNormal(j + 1, i + 1),
        outerNormal(j + 1, i),
      )
    }
    // The rims: where the coat is cut through by the top of the cutaway and by
    // the cross-wall below, it has a thickness to show.
    quad(inner(j, rings), inner(j + 1, rings), outer(j + 1, rings), outer(j, rings), UP, UP, UP, UP)
    quad(inner(j, 0), outer(j, 0), outer(j + 1, 0), inner(j + 1, 0), DOWN, DOWN, DOWN, DOWN)
  }

  // And the two radial faces, so the wedge shows the layer in section — which
  // is the one viewpoint that answers "how thick is it".
  const face = (j, sign) => {
    const theta = thetaAt(j)
    const n = [sign * -Math.sin(theta), 0, sign * Math.cos(theta)]
    for (let i = 0; i < rings; i++) {
      if (sign > 0) quad(inner(j, i), outer(j, i), outer(j, i + 1), inner(j, i + 1), n, n, n, n)
      else quad(inner(j, i), inner(j, i + 1), outer(j, i + 1), outer(j, i), n, n, n, n)
    }
  }
  face(0, -1)
  face(segments, 1)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geometry
}

// Each path becomes an upright flattened sac: a thin prism with an outer face,
// an inner face and visible top and bottom edges. Height is carried per point,
// so a lamella can ride over a granule instead of running through it.
//
// A point is [x, z, normalX, normalZ, top, bottom].
export function lamellaeGeometry(lamellae, thickness) {
  const positions = []
  const normals = []
  // Which lamella each vertex belongs to, as a number in [0, 1). Forty sheets
  // of one colour stacked together are a solid however finely they are lit;
  // giving each sac its own density — how much pigment it carries, how dark it
  // sits — is what lets the eye count them, and a section really does show one
  // membrane darker than the next.
  const tones = []
  const half = thickness / 2

  // The normal is not something to be recovered from the triangles afterwards:
  // every point already carries the direction the membrane faces. Writing it
  // directly smooths the run — computeVertexNormals() on a non-indexed soup can
  // only give one normal per facet, and at 90 nm sampling each facet is two
  // dozen pixels wide in the close-up, which is the banding across every sac —
  // while keeping the fold onto the top and bottom edges hard, which averaging
  // could not have done either way.
  let tone = 0
  const quad = (a, b, c, d, n) => {
    positions.push(...a, ...b, ...c)
    positions.push(...a, ...c, ...d)
    for (let k = 0; k < 6; k++) normals.push(...n)
    for (let k = 0; k < 6; k++) tones.push(tone)
  }
  // Same, but each corner keeps its own normal, so a curving membrane shades as
  // a curve instead of as a run of flats.
  const strip = (a, b, c, d, na, nb, nc, nd) => {
    positions.push(...a, ...b, ...c)
    normals.push(...na, ...nb, ...nc)
    positions.push(...a, ...c, ...d)
    normals.push(...na, ...nc, ...nd)
    for (let k = 0; k < 6; k++) tones.push(tone)
  }

  // How much arc a sac spends closing itself, and how far its rim rounds in from
  // top and bottom while it does. A thylakoid is a flattened sac: its edge is
  // the line where its two membranes meet, so the thickness has to reach zero
  // there. Rounding the corners in with it matters as much — a rim that is a
  // straight vertical line with square ends is the same extrusion cue one step
  // smaller.
  const CLOSE_NM = 240
  const ROUND_NM = 190

  // One cross-section of the sac, with the closure and the lean already in it.
  // The lean displaces the top edge along the sac's own normal and leaves the
  // bottom where it is, so the sac shears instead of translating.
  const frame = (point, close) => {
    const [x, z, nx, nz, top, bottom, lx = 0, lz = 0] = point
    const t = half * close
    const inset = (1 - close) * Math.min(ROUND_NM, (top - bottom) * 0.22)
    const ty = top - inset
    const by = bottom + inset
    // A leaning face is not an upright face with its top moved over: its normal
    // tilts by the same angle. Left at (nx, 0, nz) the geometry leans and the
    // shading says it does not, and the shading is what the eye believes.
    //
    // Only the part of the displacement that crosses the membrane tilts it. The
    // part running along the sac slides the sheet within its own surface, which
    // moves no geometry the normal can see.
    const h = Math.max(ty - by, 1)
    const across = nx * lx + nz * lz
    const m = Math.hypot(h, across)
    return {
      ot: [x + nx * t + lx, ty, z + nz * t + lz],
      ob: [x + nx * t, by, z + nz * t],
      it: [x - nx * t + lx, ty, z - nz * t + lz],
      ib: [x - nx * t, by, z - nz * t],
      out: [(nx * h) / m, -across / m, (nz * h) / m],
      inn: [(-nx * h) / m, across / m, (-nz * h) / m],
    }
  }

  const cap = (f, point, away) => {
    if (away[0] === 0 && away[1] === 0) return
    const [, , nx, nz] = point
    // The two ends of a run face opposite ways, so one of them has to be wound
    // the other way round. Which one is not worth reasoning about in the head:
    // this winding faces along (-nz, nx), so compare and flip when it disagrees.
    const forward = -nz * away[0] + nx * away[1] > 0
    const n = [away[0], 0, away[1]]
    if (forward) quad(f.ib, f.ob, f.ot, f.it, n)
    else quad(f.it, f.ot, f.ob, f.ib, n)
  }

  const runDir = (a, b) => {
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const l = Math.hypot(dx, dz) || 1
    return [dx / l, dz / l]
  }

  for (const { points, tone: t, cutStart = true, cutEnd = true } of lamellae) {
    tone = t ?? 0.5

    // Measured in nanometres along the run rather than in samples. The ring is
    // sampled about every 90 nm but runs come in every length, and a closure
    // counted in points shuts a short arc entirely while barely touching a long
    // one.
    const along = [0]
    for (let i = 1; i < points.length; i++) {
      along.push(
        along[i - 1] +
          Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
      )
    }
    const total = along[along.length - 1] || 1
    const reach = Math.min(CLOSE_NM, total * 0.38)
    const closure = (i) => {
      const fromStart = cutStart ? Infinity : along[i]
      const fromEnd = cutEnd ? Infinity : total - along[i]
      const d = Math.min(fromStart, fromEnd)
      if (d === Infinity) return 1
      const u = Math.min(1, d / reach)
      return u * u * (3 - 2 * u)
    }

    const frames = points.map((p, i) => frame(p, closure(i)))
    const last = points.length - 1

    // Without caps a lamella shows the inside of its own sac wherever the
    // cutaway slices it, which reads as a blank green wall instead of a
    // section. But only where the cutaway slices it: an end the wedge never
    // touched has closed itself above, and capping that one puts an upright
    // wall on a sac that simply stopped.
    if (cutStart) cap(frames[0], points[0], runDir(points[1], points[0]))
    if (cutEnd) cap(frames[last], points[last], runDir(points[last - 1], points[last]))

    const UP = [0, 1, 0]
    const DOWN = [0, -1, 0]
    for (let i = 0; i < last; i++) {
      const a = frames[i]
      const b = frames[i + 1]
      // Wound so the face the normal points at is the front face. It was the
      // other way round, which is why the sacs needed DoubleSide to shade at
      // all — two fragments per pixel on the deepest overdraw in the scene.
      strip(a.ot, b.ot, b.ob, a.ob, a.out, b.out, b.out, a.out)
      strip(b.it, a.it, a.ib, b.ib, b.inn, a.inn, a.inn, b.inn)
      strip(b.it, b.ot, a.ot, a.it, UP, UP, UP, UP)
      strip(b.ob, b.ib, a.ib, a.ob, DOWN, DOWN, DOWN, DOWN)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('aTone', new THREE.Float32BufferAttribute(tones, 1))
  return geometry
}

// The thylakoid system of Limnospira: adjacent lamellae a fixed *interdistance*
// apart — and deliberately not a fixed mean, which is what the generator below
// spends most of its length on — with no uniform orientation — irregular, with whirl-like sections across
// the middle of the cell (Nowicka-Krawczyk 2019; van Eykelenburg 1979 found "no
// structural uniformity whatsoever" in lamella orientation).
//
// Nothing here is concentric. A family of lamellae is an oval that turns slowly
// as it grows outward, carrying three harmonics whose phase drifts with radius:
// neighbouring membranes stay roughly parallel — they must not cross — while
// the family as a whole never repeats a circle. Within a family the membranes
// arrive in fascicles of three to six running close together, with a wider gap
// to the next group, and plenty of them simply stop: a lamella is a flattened
// sac, not a hoop.
//
// One family follows the cell wall; a few off-axis centres grow their own
// inside a limited neighbourhood. Where such a centre claims territory the
// surrounding lamellae break around it, which is what produces the dislocated,
// fingerprint-like pattern seen in transmission electron micrographs. Those
// whirls are ovals stretched along the radius that carries them, with a broken
// core — not targets. A bullseye of shrinking circles is a CAD extrusion, and
// it is the one thing a micrograph of this cell never shows.
//
// `obstacles` are spheres — storage granules — that the lamellae must give way
// to, exactly as they do in a micrograph: the membranes arch over a granule
// rather than passing through it.
export function thylakoidLamellae({
  rOuter,
  rHole,
  spacing,
  height,
  angleStart,
  angleLength,
  obstacles = [],
  seed = 4242,
}) {
  const rnd = seededRandom(seed)
  const TAU = Math.PI * 2

  // Three harmonics per family. The ratio a/d of each one is how much the gap
  // to the next lamella breathes, so the three together set the scatter around
  // the mean spacing — deliberately near the 10–15 % the measurements show.
  // Past that a stack of membranes stops reading as a stack.
  const harmonics = (scale) => [
    { k: 2, a: (120 + rnd() * 70) * scale, d: 1700 + rnd() * 700, p: rnd() * TAU },
    { k: 3, a: (70 + rnd() * 40) * scale, d: 2100 + rnd() * 800, p: rnd() * TAU },
    { k: 5, a: (28 + rnd() * 22) * scale, d: 2600 + rnd() * 800, p: rnd() * TAU },
    // The fine one, added after looking at the micrographs rather than at the
    // prose: in Nowicka-Krawczyk 2019 Fig. 5 a lamella is never straight for
    // long — it ripples on a wavelength of well under a micrometre, and a
    // membrane that only bends three times on its way round the cell reads as
    // a drawn curve. Its drift is slow, so a whole fascicle ripples together,
    // which is also what the plate shows.
    { k: 9, a: (20 + rnd() * 14) * scale, d: 3200 + rnd() * 900, p: rnd() * TAU },
  ]

  const family = (f) => ({ bite: 0, ...f, warp: harmonics(f.scale) })

  // The lamella-free middle of the cell is not a bore hole. Its edge wanders in
  // the micrographs, the fringe of membranes meeting it is ragged rather than
  // cut, and in some cells the whirls run straight through it. A circle of
  // fixed radius that every lamella stops dead on reads as two compartments
  // with a wall between them, and the cell is one thing.
  const corePhase = [rnd() * TAU, rnd() * TAU, rnd() * TAU]
  const coreEdge = (x, z) => {
    const theta = Math.atan2(z, x)
    return (
      rHole *
      (0.97 +
        0.17 * Math.sin(2 * theta + corePhase[0]) +
        0.11 * Math.sin(3 * theta + corePhase[1]) +
        0.06 * Math.sin(5 * theta + corePhase[2]))
    )
  }

  // The outline of one lamella: an ellipse whose long axis turns with radius,
  // plus the warp. Both vary slowly in r — across the width of a single gap
  // they barely change — which is what stops neighbours from crossing.
  const outline = (f, theta, r) => {
    let rr = r * (1 + f.ecc * Math.cos(2 * (theta - f.tilt - r * f.twist)))
    for (const h of f.warp) rr += h.a * Math.sin(h.k * theta + h.p + r / h.d)
    return Math.max(rr, r * 0.4)
  }

  // A whirl sits off-axis, is stretched along the cell radius that carries it,
  // and starts away from its own centre.
  const whirl = (radius, angle, claim) =>
    family({
      x: radius * Math.cos(angle),
      z: radius * Math.sin(angle),
      maxR: claim,
      claim,
      rStart: claim * 0.3,
      ecc: 0.22 + rnd() * 0.14,
      tilt: angle,
      twist: 1 / 4200,
      scale: claim / 2600,
    })

  const centres = [
    family({
      x: 0,
      z: 0,
      maxR: rOuter,
      claim: Infinity,
      // The walk has to start well inside the core, or there is nothing for the
      // wandering edge to let through: a lamella of the wall-following family
      // is a ring at its own radius and cannot reach any deeper than that. The
      // ones that fall entirely inside get culled point by point and cost
      // almost nothing.
      rStart: Math.max(spacing, rHole * 0.5),
      ecc: 0.075,
      tilt: angleStart + 0.7,
      // The oval turns as it grows: about a quarter turn across the width of
      // the cell, so a lamella meets the wall at a slight angle instead of
      // running parallel to it. This is the radial tendency, kept to a lean —
      // full radial orientation is true Arthrospira, not this species.
      twist: 1 / 5500,
      scale: 1,
    }),
    whirl(2500, angleStart + 1.4, 760),
    whirl(2650, angleStart + 3.0, 660),
    whirl(2400, angleStart + 3.9, 580),
    // One of them sits over the edge of the core and is allowed well inside it:
    // Nowicka-Krawczyk 2019 Fig. 5d is a cell whose whirls cross the middle
    // outright, and without one the centre is a walled compartment in every
    // cell the model ever draws.
    { ...whirl(1500, angleStart + 2.2, 780), bite: 820 },
  ]

  // Where the lamellae of a family sit. Not a comb, and not a solid stack: they
  // arrive in fascicles with real cytoplasm between them.
  //
  // The measured 56 nm is the *interdistance between adjacent lamellae*, and
  // the arithmetic used to give back after each fascicle exactly what the
  // tightening took, so the mean across the band came out at 56 nm too. That
  // made the whole annulus one continuous stack, thirty-six membranes deep, and
  // it is not what the sections show. In Deschoenmaeker 2016 Fig. 2 the
  // thylakoids of this organism are discrete concentric whorls, six to a dozen
  // membranes each, separated by cytoplasm carrying the carboxysomes, the
  // cyanophycin and the lipid droplets; the project's own anatomical bill of
  // materials asks for "4-8 irregular peripheral membrane profiles plus central
  // whorls, interdistance ~56 nm", which is the same picture.
  //
  // So the interdistance stays measured and the mean does not: a fascicle runs
  // at 56 nm and is followed by a lane of cytoplasm. The whorls stay tight,
  // because in the plates they are tight; the system that follows the wall is
  // the loose one.
  const radiiFor = (f) => {
    const out = []
    let r = f.rStart
    while (r <= f.maxR) {
      const n = 3 + Math.floor(rnd() * 4)
      const tight = 0.92 + rnd() * 0.16
      for (let i = 0; i < n && r <= f.maxR; i++) {
        out.push(r + (rnd() - 0.5) * spacing * 0.1)
        r += spacing * tight
      }
      r += spacing * (f.claim === Infinity ? 2.4 + rnd() * 3.2 : 0.5 + rnd() * 1.1)
    }
    return out
  }

  // How much of a lamella is missing, as angular windows it never occupies.
  // Towards a whirl core that is most of it: the core is where the stack is
  // dislocated, so what survives there is short arcs.
  //
  // Three quarters of the wall-following family used to come out as complete
  // hoops, which is the one thing a flattened sac cannot be — and forty closed
  // hoops nested inside one another are a solid, whatever their spacing. Most
  // lamellae now carry at least one break.
  const gapsFor = (f, r) => {
    const core = f.claim === Infinity ? 0 : 1 - Math.min(1, r / (f.claim * 0.6))
    const roll = rnd()
    const n = roll < 0.24 + core * 0.42 ? 2 : roll < 0.68 + core * 0.26 ? 1 : 0
    return Array.from({ length: n }, () => ({
      at: rnd() * TAU,
      half: 0.13 + rnd() * 0.4 + core * 0.5,
    }))
  }

  // Cytoplasmic lanes — the dislocation lines of the fingerprint.
  //
  // A break rolled per lamella is a hole; forty of them lined up across the
  // fascicles is a corridor, and the corridor is the only thing that lets the
  // eye reach the middle of the cell from outside it. Section micrographs of
  // this genus are held together by exactly these: narrow lanes where the stack
  // fails to close, running out across the whirls rather than radially.
  //
  // Curved, because the centre line drifts with radius; breathing, because the
  // width is sampled along it. A lane of fixed angle and fixed width is a saw
  // cut through the cell, which is worse than the solid it replaced.
  const lanes = Array.from({ length: 3 }, () => ({
    at: rnd() * TAU,
    half: 0.08 + rnd() * 0.055,
    drift: (rnd() - 0.5) * 1.7,
    wave: 380 + rnd() * 260,
    phase: rnd() * TAU,
  }))

  const inLane = (x, z, r) => {
    const theta = Math.atan2(z, x)
    for (const lane of lanes) {
      const centre = lane.at + (lane.drift * r) / 1000
      let d = (((theta - centre) % TAU) + TAU) % TAU
      if (d > Math.PI) d = TAU - d
      // Pinching and swelling along its length, and closing altogether where
      // the wave dips below zero: a lane that runs open from the core to the
      // wall at a fixed width is a slot sawn through the cell, and a real
      // dislocation line does not reach cleanly from one side to the other.
      const w =
        lane.half * (1.25 * (0.5 + 0.5 * Math.sin(r / lane.wave + lane.phase)) - 0.18)
      if (d < w) return true
    }
    return false
  }

  const angleEnd = angleStart + angleLength
  const half = height / 2
  const lamellae = []
  const MIN_HEIGHT = 220
  // The furthest a top edge leans out. 190 nm over a sac 3.9 um tall is under
  // three degrees: enough that the stack stops reading as milled, small enough
  // that the interlamellar distance measured across the membrane is 55.9 nm
  // rather than the 56 the card claims.
  const LEAN_NM = 190

  const inSector = (x, z) => {
    let a = Math.atan2(z, x)
    if (a < 0) a += Math.PI * 2
    return a >= angleStart && a <= angleEnd
  }

  // Returns [top, bottom] after the granules have pushed the lamella aside,
  // or null where a granule fills the whole height.
  const clearance = (x, z, baseTop, baseBottom) => {
    let top = baseTop
    let bottom = baseBottom
    for (const o of obstacles) {
      const dx = x - o.x
      const dz = z - o.z
      const d2 = dx * dx + dz * dz
      if (d2 >= o.r * o.r) continue
      const h = Math.sqrt(o.r * o.r - d2)
      const oTop = o.y + h
      const oBottom = o.y - h
      if (oTop >= top && oBottom <= bottom) return null
      if (oBottom <= bottom) bottom = Math.max(bottom, oTop)
      else if (oTop >= top) top = Math.min(top, oBottom)
      else if (o.y < (top + bottom) / 2) bottom = oTop
      else top = oBottom
      if (top - bottom < MIN_HEIGHT) return null
    }
    return [top, bottom]
  }

  // A lamella does not end in a flat plateau. The stack undulates, and the
  // undulation is shared with its neighbours — so the field is sampled in world
  // space rather than drawn per ring, which would saw the stack into teeth when
  // the cell is seen from above.
  const swell = (x, z, phase) =>
    0.5 +
    0.25 * Math.sin(x / 1290 + z / 940 + phase) +
    0.15 * Math.cos(z / 1080 - x / 1730 + phase * 1.7) +
    0.1 * Math.sin((x + z) / 620 + phase * 2.3) +
    0.06 * Math.sin(x / 240 - z / 310 + phase * 4.1)

  // How tall the stack stands, as a field. `swell` above is the roughness of a
  // single crest and changes over hundreds of nanometres; this is the shape of
  // the whole massif and changes over microns, so a fascicle rises and falls
  // as one body and two fascicles a micron apart sit at different heights.
  // Sampled in world space for the same reason `swell` is: a height rolled per
  // lamella saws the stack into teeth the moment it is seen from above.
  const massif = (x, z, phase) =>
    0.5 +
    0.3 * Math.sin(x / 2600 + z / 1900 + phase) +
    0.13 * Math.cos(z / 2200 - x / 3100 + phase * 1.6) +
    0.07 * Math.sin((x + z) / 1400 + phase * 2.4)

  // How far the top edge of a sac stands out from its bottom edge, along its
  // own normal. Every lamella here was exactly upright, and a stack of upright
  // sheets is the strongest thing left in this cutaway that says the geometry
  // was extruded rather than grown.
  //
  // Zero-mean, and a field rather than a value per lamella, for the same reason
  // the crop is: neighbours 56 nm apart must lean together or they pass through
  // each other, and two membranes that pass through each other are the one
  // thing no section can show.
  //
  // It is a displacement in the plane of the cross-wall, read off two smooth
  // fields of position and of nothing else. Both of those properties were
  // arrived at the hard way, and `npm run lamellae` counted the casualties each
  // time.
  //
  // Keyed on `tierPhase`, which carries r / 900, the lean changed from one
  // lamella to the next by design — and a lean that differs between neighbours
  // is precisely a lean that closes the gap between them. Ten pairs of
  // membranes ended up passing through each other.
  //
  // Applied along each sac's own normal, it was still wrong, and worse where it
  // is least visible: at a dislocation two families interleave at an angle, so
  // two sacs a few nanometres apart have normals pointing opposite ways and a
  // shared lean magnitude pushes their tops directly into each other. The
  // largest displacement in the model was between the closest pair of sheets in
  // it.
  //
  // As a vector field the failure mode is gone by construction. Two points near
  // each other get nearly the same displacement whatever their sacs are doing,
  // so what separates them at the top is their separation at the floor minus
  // their distance times this field's gradient — about a seventh. The tightest
  // pair is now the safest pair, and that is the property to keep if this is
  // ever touched again. It also says something truer than a normal-aligned lean
  // did: a region of the cell shears one way, rather than every sac leaning
  // away from the axis like a bowl.
  const leaning = (x, z) =>
    0.62 * Math.sin(x / 3300 + z / 2550) +
    0.26 * Math.cos(z / 4500 - x / 3600) +
    0.12 * Math.sin((x + z) / 1650)
  const leaningAcross = (x, z) =>
    0.62 * Math.cos(x / 2850 - z / 3750) +
    0.26 * Math.sin(z / 4050 + x / 4800) +
    0.12 * Math.cos((x - z) / 1875)

  centres.forEach((centre, k) => {
    for (const r of radiiFor(centre)) {
      const reach = r * (1 + centre.ecc) + 350
      const segments = Math.min(420, Math.max(28, Math.round((TAU * reach) / 90)))
      // The stack does not end on a machined plane at either end.
      const topJitter = half - rnd() * 190
      const bottomJitter = -half + rnd() * 240
      const gaps = gapsFor(centre, r)
      // Where this lamella sits in the massif, and how deeply it is cropped.
      // The phase moves by a thousandth of a radian across one 56 nm gap and by
      // a whole radian across a micron, which is what makes a fascicle behave
      // as one body while the fascicle a micron away behaves as another.
      const tierPhase = r / 900 + k * 2.7
      const crop = 0.55 + rnd() * 0.85
      // How far past the wandering edge this one lamella reaches. Most stop
      // near it, a few push well in — which is what widens the boundary into a
      // fringe instead of a line.
      const bite =
        centre.bite + (rnd() < 0.14 ? 260 + rnd() * 520 : rnd() * 200)

      // Positions first, normals from them. Once a lamella is no longer a
      // circle its outward direction is no longer the cosine and sine of its
      // angle, and a sac extruded along the wrong normal shears exactly where
      // the membrane bends — which is where the eye goes.
      const ring = []
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * TAU
        const rr = outline(centre, theta, r)
        ring.push([centre.x + rr * Math.cos(theta), centre.z + rr * Math.sin(theta), theta])
      }

      // One value per lamella, not per surviving arc: a sac broken into three
      // pieces is still one sac, and tinting the pieces differently draws two
      // lines across it that are not there.
      const tone = rnd()

      let run = []
      // Why a run begins and why it ends, which are two different questions
      // with two different answers in the mesh. A lamella that leaves the kept
      // sector was cut by the wedge and shows a section face — that is the
      // whole point of the cutaway. A lamella that stops for any other reason
      // (a lane, a break, the wandering edge of the core, a granule in the way)
      // simply ended, and a sac that ends shows the rim where its two membranes
      // meet. Drawing the second as the first is what put a flat upright wall
      // on every terminating sheet in the stack.
      let openedAtCut = true
      const flush = (endedAtCut) => {
        if (run.length > 3) lamellae.push({ points: run, tone, cutStart: openedAtCut, cutEnd: endedAtCut })
        run = []
      }

      for (let i = 0; i <= segments; i++) {
        const [x, z, theta] = ring[i % segments]
        const before = ring[(i - 1 + segments) % segments]
        const after = ring[(i + 1) % segments]
        const tx = after[0] - before[0]
        const tz = after[1] - before[1]
        const t = Math.hypot(tx, tz) || 1
        const nx = tz / t
        const nz = -tx / t
        const distFromAxis = Math.hypot(x, z)
        const fromCentre = Math.hypot(x - centre.x, z - centre.z)

        // A whirl owns a neighbourhood and nothing beyond it. Without the last
        // clause its outermost lamellae, oval and warped, reach past the radius
        // the surrounding family was told to keep clear of — and two membranes
        // that pass through each other are the one thing no section can show.
        const inside = inSector(x, z)
        let ok =
          distFromAxis <= rOuter &&
          distFromAxis >= Math.max(420, coreEdge(x, z) - bite) &&
          fromCentre <= centre.claim * 0.94 &&
          inside &&
          !inLane(x, z, distFromAxis)
        if (ok) {
          for (const g of gaps) {
            let d = Math.abs(theta - g.at)
            if (d > Math.PI) d = TAU - d
            if (d < g.half) {
              ok = false
              break
            }
          }
        }
        if (ok) {
          // A different centre only takes the point over if the point falls
          // inside that centre's own neighbourhood and is nearer to it.
          for (let m = 0; m < centres.length && ok; m++) {
            if (m === k) continue
            const d = Math.hypot(x - centres[m].x, z - centres[m].z)
            if (d < fromCentre && d <= centres[m].claim) ok = false
          }
        }

        const baseTop = topJitter - 430 * swell(x, z, 0)
        const baseBottom = bottomJitter + 370 * swell(x, z, 2.1)

        // The bowl.
        //
        // A lamella used to run floor to ceiling wherever it existed, and that
        // — not the count, and not the 56 nm — is what made the interior
        // impenetrable: a sheet 3.9 µm tall standing 56 nm from the next one
        // hides sixteen of its neighbours at thirty degrees off vertical, so no
        // amount of thinning the stack could ever have opened it. A thylakoid
        // is a flattened sac and a sac has an edge in every direction, height
        // included.
        //
        // So the stack stands its full height against the wall, where it frames
        // the cell, and steps down as it comes inwards, where the nucleoid and
        // the carboxysomes are. Cropped from the top only: the top is the cut
        // end, the cell above having been removed, so a sac that stops short of
        // it has simply stopped — while raising the floor would hang membranes
        // in the air over the cross-wall, which no section shows.
        // Depth of the bowl. Cut deeper than this and the middle of the cell
        // stops being an open floor and becomes a bare one — the stack retreats
        // to the wall and the cytosol reads as evacuated, which is as wrong as
        // the solid it replaced and much emptier. Around half height at the
        // core edge, nine tenths at the wall.
        const bowl = 1 - smoothstep(rHole * 0.95, rOuter * 0.88, distFromAxis)
        // And a ripple along the arc, so a crest waves rather than running as a
        // drawn curve. Its wavelength is about 520 nm, which is six of the
        // 90 nm samples the ring is built from: at three it was under-sampled,
        // and an under-sampled ripple does not wave, it aliases into teeth - a
        // stack of membranes ending in a bed of nails. It scales with the cut,
        // so the sacs standing full height against the wall stay level and the
        // cropped ones in the middle, the ones the eye is being invited to look
        // over, are the ones that move.
        const ripple = 0.5 + 0.5 * Math.sin(x / 128 + z / 108 + tierPhase * 5.0)
        const cut =
          crop *
          (0.14 + 0.46 * bowl) *
          (0.45 + 0.62 * (1 - massif(x, z, tierPhase))) *
          (0.88 + 0.24 * ripple)
        const top = baseTop - (baseTop - baseBottom) * Math.min(0.92, cut)

        const span =
          ok && top - baseBottom > MIN_HEIGHT ? clearance(x, z, top, baseBottom) : null
        if (span)
          run.push([
            x, z, nx, nz, span[0], span[1],
            LEAN_NM * leaning(x, z),
            LEAN_NM * leaningAcross(x, z),
          ])
        else {
          flush(!inside)
          openedAtCut = !inside
        }
      }
      flush(true)
    }
  })

  return lamellae
}

// --- The phycobilisome ------------------------------------------------------
//
// Not a blob. In S. platensis C1 the antenna is hemidiscoidal: three cylinders
// of allophycocyanin packed into a core that sits on the thylakoid, and six
// rods of C-phycocyanin fanning outwards from it. That architecture is the
// content — it is what carries the energy downhill from the rod tips through
// the core into chlorophyll a — so it is built rather than approximated by a
// sphere, and the two pigments are written into the vertex colours so the core
// and the rods stay distinguishable inside a single instanced draw call.
//
// Local frame: x = 0 is the membrane contact plane, +X points away from it, the
// core cylinders lie along Z and the rods fan in the XY plane. Nominal span is
// about 36 nm out from the membrane by 56 nm across by 17 nm thick.
export function phycobilisomeGeometry({ core = '#3d6f9e', rod = '#46abdd' } = {}) {
  const parts = []
  const CORE_X = 10 // roughly the middle of the tricylindrical core

  const paint = (geometry, hex) => {
    // THREE.Color converts from sRGB on construction, so these are already the
    // linear values the shader wants written straight into the attribute.
    const c = new THREE.Color(hex)
    const count = geometry.attributes.position.count
    const colors = new Float32Array(count * 3)
    // `aPath` is where a vertex sits on the energy's route: 1 out at the rod
    // tips where the light is caught, 0 at the core where it is handed on.
    // Distance from the core is the route, so the attribute is just that,
    // normalised — and the excitation can then be animated as a front moving
    // down it, which is the one thing about phycobilisomes worth animating.
    const path = new Float32Array(count)
    const position = geometry.attributes.position
    for (let i = 0; i < count; i++) {
      colors.set([c.r, c.g, c.b], i * 3)
      const d = Math.hypot(position.getX(i) - CORE_X, position.getY(i))
      path[i] = Math.min(1, Math.max(0, (d - 9) / 28))
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aPath', new THREE.BufferAttribute(path, 1))
    parts.push(geometry)
  }

  // Core: two cylinders lying on the membrane, the third resting in the groove
  // between them — the tricylindrical packing.
  const CORE_R = 5.5
  const CORE_L = 16
  const seats = [
    [CORE_R, 6.1],
    [CORE_R, -6.1],
    [CORE_R + CORE_R * Math.sqrt(3), 0],
  ]
  for (const [x, y] of seats) {
    const g = new THREE.CylinderGeometry(CORE_R, CORE_R, CORE_L, 10, 1)
    g.rotateX(Math.PI / 2) // axis along Z, parallel to the membrane
    g.translate(x, y, 0)
    paint(g, core)
  }

  // Six rods, fanned across 145° and staggered in Z the way they dock at
  // different points along the core cylinders.
  const ROD_R = 5
  const ROD_L = 18
  const HUB = 13
  const REACH = HUB + ROD_L / 2 + 2
  ;[-72, -43, -14, 14, 43, 72].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180
    // Slightly tapered: a rod is a stack of hexamers that thins at the tip.
    const g = new THREE.CylinderGeometry(ROD_R * 0.9, ROD_R, ROD_L, 8, 1)
    g.rotateZ(a - Math.PI / 2) // +Y to +X, then out along the fan
    g.translate(REACH * Math.cos(a), REACH * Math.sin(a), (i % 2 ? 1 : -1) * 3.5)
    paint(g, rod)
  })

  const merged = mergeGeometries(parts)
  parts.forEach((g) => g.dispose())
  return merged
}

// --- The gas vesicle --------------------------------------------------------
//
// A hollow protein cylinder closed by a cone at each end. Body and both cones
// are merged into one geometry so an aerotope of several dozen draws as a
// single instanced mesh rather than three meshes per vesicle. The merge has a
// second effect worth having: the rib shading reads off object-space Y, and
// merging makes that Y continuous across the shoulder, so the 4 nm ribs now run
// unbroken from the shaft into the cone instead of restarting at the join.
export function gasVesicleGeometry({ diameterNm, lengthNm }) {
  const r = diameterNm / 2
  const shaft = lengthNm - diameterNm
  const half = shaft / 2
  const parts = [
    new THREE.CylinderGeometry(r, r, shaft, 16),
    new THREE.ConeGeometry(r, diameterNm, 16).translate(0, half, 0),
    new THREE.ConeGeometry(r, diameterNm, 16).rotateX(Math.PI).translate(0, -half, 0),
  ]
  const merged = mergeGeometries(parts)
  parts.forEach((g) => g.dispose())
  return merged
}

// --- Irregularity -----------------------------------------------------------
//
// Nothing biological is a perfect sphere. A storage granule is a lump, a
// carboxysome is a protein shell that does not quite close into a textbook
// icosahedron, and the giveaway that a cell was modelled rather than
// photographed is a surface with no defect on it. This pushes every vertex
// along its own normal by a smooth noise field, then rebuilds the normals.

function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(x, y, z) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  let fx = x - ix
  let fy = y - iy
  let fz = z - iz
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  fz = fz * fz * (3 - 2 * fz)
  const mix = (a, b, t) => a + (b - a) * t
  return mix(
    mix(
      mix(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx),
      mix(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx),
      fy,
    ),
    mix(
      mix(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx),
      mix(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx),
      fy,
    ),
    fz,
  )
}

// `amount` and `frequency` are relative to the geometry's own size, so the same
// numbers work on a 260 nm lipid droplet and on a 2400 nm cyanophycin granule.
export function lumpy(geometry, { amount = 0.09, frequency = 2.4, offset = 0 } = {}) {
  geometry.computeBoundingSphere()
  const scale = geometry.boundingSphere.radius || 1
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i)
    n.fromBufferAttribute(normal, i)
    const f = frequency / scale
    const noise =
      0.7 * valueNoise(v.x * f + offset, v.y * f + offset, v.z * f + offset) +
      0.3 * valueNoise(v.x * f * 2.7 + offset, v.y * f * 2.7 + offset, v.z * f * 2.7 + offset)
    v.addScaledVector(n, (noise - 0.5) * 2 * amount * scale)
    position.setXYZ(i, v.x, v.y, v.z)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

// Jitters the vertices of a low-poly solid without smoothing it, so an
// icosahedral shell keeps its facets but stops looking machined.
export function jitter(geometry, amountFraction = 0.06, seed = 7) {
  const rnd = seededRandom(seed)
  geometry.computeBoundingSphere()
  const scale = geometry.boundingSphere.radius || 1
  const position = geometry.attributes.position
  // A non-indexed solid repeats each corner per face; jitter by rounded
  // position so the shared corners of a face still meet.
  const moved = new Map()
  const v = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i)
    const key = `${v.x.toFixed(2)}|${v.y.toFixed(2)}|${v.z.toFixed(2)}`
    let d = moved.get(key)
    if (!d) {
      d = [
        (rnd() - 0.5) * 2 * amountFraction * scale,
        (rnd() - 0.5) * 2 * amountFraction * scale,
        (rnd() - 0.5) * 2 * amountFraction * scale,
      ]
      moved.set(key, d)
    }
    position.setXYZ(i, v.x + d[0], v.y + d[1], v.z + d[2])
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

// --- The nucleoid -----------------------------------------------------------
//
// Not one thick hose. A bacterial nucleoid is a single circular chromosome
// folded into a mass of loops with no membrane around it, and in a micrograph
// it reads as a fibrillar tangle occupying a region — so it is built as several
// thin strands sharing a territory rather than one tube.
export function nucleoidStrands({ strands = 5, radiusNm = 6.5, region, seed = 1212 }) {
  const rnd = seededRandom(seed)
  const { x: cx = 0, z: cz = 0, rIn, rOut, halfHeight } = region
  const geometries = []
  const target = (rIn + rOut) / 2

  for (let s = 0; s < strands; s++) {
    // A confined persistent walk, not a parametric loop.
    //
    // A loop drawn as sin and cos with a random radius per sample is a chord
    // across the territory once the spline has smoothed it, and twenty of them
    // is a birdcage - long straight wires with the cell visible through the
    // bars. A chromatin fibre has persistence and nothing else: it carries on
    // roughly the way it was going, turns a little at every step, and is only
    // ever pulled back when it reaches the edge of the region it occupies. That
    // gives short meandering fibres that stay local, which is what a nucleoid
    // is in a micrograph - a fibrillar mass with a boundary, and no fibre
    // running along that boundary.
    const a0 = rnd() * Math.PI * 2
    const r0 = rIn + Math.sqrt(rnd()) * (rOut - rIn)
    const p = new THREE.Vector3(
      cx + r0 * Math.cos(a0),
      (rnd() - 0.5) * halfHeight * 1.3,
      cz + r0 * Math.sin(a0),
    )
    const dir = new THREE.Vector3(rnd() - 0.5, (rnd() - 0.5) * 0.7, rnd() - 0.5).normalize()
    const points = [p.clone()]
    // Short walks, and many of them. A long walk wanders out of its own
    // territory before the pull can bring it back, and what comes out is a few
    // threads strung across the middle of the cell rather than a mass with a
    // shape - which is the difference between a nucleoid and dropped spaghetti.
    const steps = 16 + Math.floor(rnd() * 10)
    const step = 76 + rnd() * 62

    for (let i = 0; i < steps; i++) {
      dir.x += (rnd() - 0.5) * 1.2
      dir.y += (rnd() - 0.5) * 1.25
      dir.z += (rnd() - 0.5) * 1.2
      const dx = p.x - cx
      const dz = p.z - cz
      const rr = Math.hypot(dx, dz) || 1
      const pull = Math.max(-1.4, Math.min(1.4, (rr - target) / (rOut - target)))
      dir.x -= (dx / rr) * pull * 0.95
      dir.z -= (dz / rr) * pull * 0.95
      // Weaker than the radial pull on purpose. At parity every walk sank onto
      // y = 0 and the mass came out as a mat lying on the floor of the cell.
      dir.y -= Math.max(-1.4, Math.min(1.4, p.y / halfHeight)) * 0.42
      dir.normalize()
      p.addScaledVector(dir, step)
      points.push(p.clone())
    }

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    geometries.push(
      new THREE.TubeGeometry(curve, points.length * 5, radiusNm * (0.7 + rnd() * 0.7), 5, false),
    )
  }
  // One geometry, not thirty-four. The fibres share a material and never move
  // relative to each other, so a mesh apiece is thirty-four draw calls buying
  // nothing - and the count went up by a factor of five when the tangle was
  // rebuilt, which is exactly the moment to merge them.
  const merged = mergeGeometries(geometries)
  geometries.forEach((g) => g.dispose())
  return merged
}


// The cup-shaped chloroplast of a Chlorella cell, as a solid of revolution.
//
// This is the thing an operator actually sees, and it is why a Chlorella cell
// does not read as a plain green ball down a real objective. One parietal
// chloroplast lines most of the inside of the wall and stops short, leaving an
// opening: look through the closed side and the beam crosses two thicknesses of
// pigment, look through the opening and it crosses almost none. Turned one way
// the cell shows a C; turned another, a ring with a pale middle; turned a third,
// nearly a full disc. That variation across a field is not noise, it is one
// organelle seen from every angle at once, and it is most of what distinguishes
// a field of Chlorella from a field of green spheres.
//
// Built rather than approximated by shading, for the same reason the
// phycobilisome is: the shape is the content. A directional tint on a sphere
// would give the asymmetry and never the edge, and the edge is what the eye
// reads as an organelle rather than as a shadow.
//
// `open` is the half-angle of the mouth, measured from the axis. The profile
// runs down the outer surface, across the rim, and back up the inner one, so
// the lathe closes into a solid shell of real thickness — which is what makes
// the doubled path through the closed side come out right.
export function chloroplastCup({
  outer = 1,
  thickness = 0.34,
  open = 0.95,
  segments = 22,
} = {}) {
  const inner = outer * (1 - thickness)
  const start = open
  const end = Math.PI
  const points = []
  for (let i = 0; i <= segments; i++) {
    const a = start + ((end - start) * i) / segments
    points.push(new THREE.Vector2(Math.sin(a) * outer, Math.cos(a) * outer))
  }
  for (let i = segments; i >= 0; i--) {
    const a = start + ((end - start) * i) / segments
    points.push(new THREE.Vector2(Math.sin(a) * inner, Math.cos(a) * inner))
  }
  // Closed back onto the first point, or the lathe leaves the rim open and the
  // shell shows its own inside wherever the mouth faces the camera.
  points.push(points[0].clone())
  const geometry = new THREE.LatheGeometry(points, 30)
  geometry.computeVertexNormals()
  return geometry
}
