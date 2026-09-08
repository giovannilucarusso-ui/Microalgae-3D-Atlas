// What everything looks like.
//
// Colour, surface treatment and the four states a structure can be drawn in,
// gathered in one place. This is the layer you edit when the cell does not read
// right — and keeping it out of the assembly means retuning the look does not
// mean scrolling past thirteen components to find where the numbers live.
//
// The `bump` numbers are relief heights in nanometres and are argued from the
// structure itself, not dialled in: a membrane studded with photosystems is a
// few nm of relief, a cyanophycin granule 2.4 µm across is fifty or sixty.
//
// `finest` is where a structure's ladder of detail stops, in nanometres, and it
// wants reading with more care than the rest. Two of them are sourced sizes: the
// sheath's 3 nm is van Eykelenburg's measured external fibril, and the cytosol's
// 22 is a ribosome. The others are **display cutoffs argued from plausibility,
// not measurements** — nobody has published the smallest structure inside a
// Spirulina lipid droplet or polyphosphate body, and choosing 12 nm to keep a
// droplet smooth is a decision about the picture, not a finding about the
// droplet. Each is marked below. A floor not marked as sourced is a knob with a
// reason behind it, which is not the same thing as a number.
import { organic } from './optics.jsx'

// Pulled back from the saturated primaries a diagram would use, towards muted,
// slightly dirty values. These are annotation, not measurement: the evidence
// behind this cutaway is section contrast in a TEM, which has no colour at all,
// so what a hue says here is "this is that structure" and nothing more. Each one
// still owns its own — the key stays readable — but nothing is a pure display
// colour any more, because a false-colour key that shouts reads as a diagram.
export const COLORS = {
  cytoplasm: '#071a1c',
  wall: '#c6934f',
  // Hydrated polysaccharide, and nothing else: no pigment, no protein worth
  // colouring. It reads as wet rather than as a material — which is why it is
  // nearly the value of the dark field and gets its presence from the fresnel.
  sheath: '#a4cfc9',
  membrane: '#8578a6',
  // The cross-wall is wall, not membrane — L-I / L-II / L-I — so it belongs to
  // the envelope's colour family. It used to wear the thylakoids' green, which
  // was both wrong and the reason the cutaway read as one flat teal.
  septum: '#474433',
  thylakoid: '#39805f',
  phycobilisome: '#4aa8d8',
  // Pulled back from the orange it was: at full saturation it sat in the same
  // register as the polyglucan and the lipid droplets, and the eye sorted it
  // with the reserves. The polyhedron does the distinguishing now, so the
  // colour does not have to shout to do it too.
  carboxysome: '#c08657',
  gasVesicle: '#c9d6dc',
  cyanophycin: '#ab4f52',
  polyglucan: '#cfae62',
  polyphosphate: '#7b86c0',
  lipid: '#8d7a4e',
  nucleoid: '#c0b391',
  ribosome: '#a99e88',
}

// One colour per structure *id* — which is what the list dot, the leader anchor
// on the model and any future legend all key off. `COLORS` above is keyed by the
// thing itself and is singular; the ids in `structures.js` are plural. Reading
// COLORS by id therefore fell through to a generic teal for six of the thirteen
// anchors, so the dot beside the word and the dot on the model were different
// colours — which is the one promise a key has to keep.
//
// The septum is the exception that has to be a tint rather than the material's
// own value: the cross-wall renders in a dark olive that would be invisible as a
// 7 px dot, so the key carries a legible lightening of the same hue instead of a
// different colour altogether.
export const SWATCH = {
  ...COLORS,
  trichome: '#35836f',
  cellUnit: '#5fbfa4',
  gliding: '#8fd8c6',
  calyptra: '#b7d3cb',
  thylakoids: COLORS.thylakoid,
  phycobilisomes: COLORS.phycobilisome,
  carboxysomes: COLORS.carboxysome,
  gasVesicles: COLORS.gasVesicle,
  lipidBodies: COLORS.lipid,
  septum: '#8a8264',
}

// The four wall layers are not four coats of the same paint. Three have a
// documented substructure with a direction to it, and `fiber` — which squashes
// the noise sample along an axis — is what turns isotropic mottle into
// something that runs a particular way. Squashing Y makes the pattern vary
// slowly along the trichome axis and quickly around it, which reads as elements
// running lengthwise; each grain scale is the measured period of that layer.
//
// `finest` is where each layer's ladder of detail stops. The shared 3 nm on the
// three fibrillar layers is a display cutoff, not a measurement: what is
// measured is the features themselves — 8–10 nm fibrils in L-III, 12–15 nm
// elements in L-IV — and nothing published says what those are built of at 3.
// The sheath's sourced 3 nm fibril is a different structure and is not evidence
// for these.
export const WALL_SURFACE = {
  // linear elements 12–15 nm, parallel to the axis
  'L-IV': organic({ scale: 0.018, amount: 0.24, rough: 0.26, finest: 3, warp: 0.3, grain: 0.34, grainScale: 0.07, fiber: [1, 0.08, 1], bump: 4, rim: 0.1, rimColor: '#7fd6d0' }),
  // fibrils 8–10 nm wound in a right-handed helix — approximated as a fine
  // grain with a lengthwise bias, since a true helix needs the cylinder's own
  // angular frame and is worth less than it would cost
  'L-III': organic({ scale: 0.02, amount: 0.26, rough: 0.3, finest: 3, warp: 0.35, grain: 0.32, grainScale: 0.11, fiber: [1, 0.45, 1], bump: 3, rim: 0.09, rimColor: '#8fe0cc' }),
  // peptidoglycan: the rigid layer, dense and without a grain direction. Barely
  // warped, because a cross-linked mesh is the one layer here that does not
  // flow. It runs a full octave finer than the others — a glycan strand is the
  // right order of magnitude for 2 nm, but no structural model is cited for it,
  // so read the number as illustrative of molecular scale, not as sourced.
  'L-II': organic({ scale: 0.02, amount: 0.22, rough: 0.22, finest: 2, warp: 0.12, grain: 0.26, grainScale: 0.09, bump: 3, rim: 0.1, rimColor: '#e0c08a' }),
  // fibrillar β-1,2-glucan
  'L-I': organic({ scale: 0.022, amount: 0.26, rough: 0.3, finest: 3, warp: 0.35, grain: 0.3, grainScale: 0.1, fiber: [1, 0.35, 1], bump: 3, rim: 0.09, rimColor: '#8fe0cc' }),
}

// One entry per structure. The comment on each says what the setting is meant
// to be reproducing, so the next person to touch a number knows what it was for.
export const SURFACE = {
  // The ground everything is read against. A cyanobacterial cytosol is crowded
  // — ribosomes in the thousands, protein at hundreds of mg/ml — and a smooth
  // shell behind the anatomy reads as an empty cavity, the opposite of true.
  //
  // It stops at a ribosome, and that is a handover rather than a claim: a
  // cytosol is emphatically not built of nothing smaller than 22 nm. Below that
  // the model draws the ribosomes themselves, so this is where the texture hands
  // the job to geometry — move it and LOD_DISTANCE together.
  cytoplasm: organic({ scale: 0.0009, amount: 0.55, rough: 0.1, finest: 22, warp: 0.5, grain: 0.34, grainScale: 0.014, bump: 46 }),

  // A working bilayer, 8 nm thick: almost no relief, a little sheen. It ends at
  // the width of one integral complex — below that a membrane is lipid, and
  // lipid has no relief to show.
  membrane: organic({ scale: 0.03, amount: 0.24, rough: 0.22, finest: 4, warp: 0.4, grain: 0.16, grainScale: 0.12, bump: 2.5, rim: 0.16, rimColor: '#bcaae8' }),

  // The secreted gel. `amount` is doing the work here rather than `bump`: what
  // varies across this layer is how much of it there is, not how rough it is,
  // and the density has to be visible as a patchiness in the coat. `fiber`
  // stretches the sample along Y so the patches draw out along the filament
  // instead of sitting on it as spots. The 7 nm grain stands for the fibrils —
  // van Eykelenburg measured them at 3 nm — in the Nakuru strain at high
  // temperature, and the thesis itself flags the possibility of a preparation
  // artifact, so this is a sourced number for one condition and not a property
  // of every fed sheath. It is under a pixel everywhere
  // but in this structure's own close-up, and it fades out by itself before it
  // could alias. The rim is the whole visibility mechanism: 50 nm of clear gel
  // is nothing seen face on and a bright edge seen along. Its ladder ends on
  // that same measured 3 nm fibril, and it carries the heaviest warp of
  // anything here: a secreted gel is the one structure whose texture is a flow.
  sheath: organic({ scale: 0.004, amount: 0.46, rough: 0.24, finest: 3, warp: 0.7, grain: 0.2, grainScale: 0.14, fiber: [1, 0.65, 1], bump: 8, rim: 0.55, rimColor: '#d9f5ee' }),

  // The widest single surface on screen, so it carries real relief — and being
  // wall rather than membrane, it ends where the wall's fibrils do.
  septum: organic({ scale: 0.0042, amount: 0.38, rough: 0.3, finest: 3, warp: 0.25, grain: 0.28, grainScale: 0.028, bump: 30, rim: 0.09, rimColor: '#6fc4b8' }),

  // The phycobilisome is not here: its surface has to carry the excitation
  // front as well, so it is built by `antenna()` in optics.jsx instead.

  // A faceted protein shell packed with Rubisco: grain at the packing scale, and
  // its ladder ends near the size of the shell hexamer that tiles it — the one
  // unsourced floor with an obvious candidate behind it, if a tile dimension is
  // ever cited. Barely warped: a tiling does not drift.
  carboxysome: organic({ scale: 0.018, amount: 0.3, rough: 0.26, finest: 6, warp: 0.18, grain: 0.34, grainScale: 0.045, bump: 17, rim: 0.32, rimColor: '#ecb188' }),

  // Strands of 4.6 nm radius — nearer the 10 nm fibre the chromatin is folded
  // into; at 7.5 each strand read as an object rather than as one thread among
  // thirty-four. A fibrillar tangle, not a smooth hose. The floor is a display
  // choice for coarse DNA fibre: no chromatin repeat has been characterised in
  // this organism. Down to
  // the duplex and its hydration shell, and warped, because a tangle is what a
  // warp is for.
  nucleoid: organic({ scale: 0.05, amount: 0.34, rough: 0.3, finest: 4, warp: 0.55, grain: 0.32, grainScale: 0.26, bump: 1.4, rim: 0.18, rimColor: '#e2d6ac' }),

  // Electron-dense and amorphous: nearly smooth, and glassy at the edge. It is
  // of course a polymer — a chain of orthophosphate, which is what "poly" is
  // doing in the name — but nothing published gives the size of a structural
  // unit inside one of these granules, so this floor is an unsourced cutoff.
  polyphosphate: organic({ scale: 0.028, amount: 0.2, rough: 0.16, finest: 6, warp: 0.15, grain: 0.12, grainScale: 0.06, bump: 9, rim: 0.36, rimColor: '#b6bffa' }),

  // Up to 2400 nm across, with a coarse radiating substructure — which is what
  // the warp is drawing. The 8 nm floor is an unsourced cutoff, chosen to sit
  // under that substructure.
  cyanophycin: organic({ scale: 0.006, amount: 0.36, rough: 0.28, finest: 8, warp: 0.45, grain: 0.34, grainScale: 0.02, fiber: [1, 0.3, 1], bump: 58, rim: 0.22, rimColor: '#e49194' }),

  // Rods 25 nm across, so the grain runs along them. The 5 nm floor is a guess
  // at how the glucan chains bundle inside a rod, and is not sourced.
  polyglucan: organic({ scale: 0.02, amount: 0.22, rough: 0.24, finest: 5, warp: 0.3, grain: 0.28, grainScale: 0.09, fiber: [1, 0.4, 1], bump: 2.5, rim: 0.16, rimColor: '#ecd398' }),

  // Surface tension keeps a droplet smooth: it stops a full two octaves above
  // everything else, and that early stop is the texture. A droplet that went on
  // resolving would stop reading as a liquid — which is a reason to choose 12 nm,
  // not evidence that nothing inside one is finer. Unsourced.
  lipid: organic({ scale: 0.019, amount: 0.32, rough: 0.2, finest: 12, warp: 0.2, grain: 0.16, grainScale: 0.05, bump: 7, rim: 0.27, rimColor: '#e6d193' }),

  // Too small to carry texture. The rim is what makes a 22 nm sphere read as a
  // body at all rather than as a speck of dirt.
  ribosome: organic({ scale: 0.06, amount: 0.12, rough: 0.15, finest: 6, rim: 0.36, rimColor: '#e2d7bc' }),
}

// --- The four states a structure can be in ----------------------------------
//
// What it looks like in each of the states `Part` hands down. Every state sets
// the same keys, so nothing is left over from the previous one.

const PLAIN = { transparent: false, opacity: 1, depthWrite: true }

// The envelope kept as a glass hull: enough to place what you are looking at
// inside a cell, not enough to hide it.
const GHOST = {
  color: '#79c8bc',
  emissive: '#123d3c',
  emissiveIntensity: 0.6,
  roughness: 0.9,
  metalness: 0,
  transparent: true,
  opacity: 0.17,
  depthWrite: false,
}

// The thylakoid mass, for the structures docked on it. Depth is still written:
// hundreds of translucent lamellae stacked front to back add back up to an
// opaque wall, and letting the near one win keeps it a veil.
const VEIL = { transparent: true, opacity: 0.16, depthWrite: true }

export function look(state) {
  if (state === 'ghost') return GHOST
  if (state === 'veil') return VEIL
  return PLAIN
}

// The sheath is the one structure whose *resting* state is already transparent,
// so `look` cannot supply it: PLAIN would turn the gel into a solid shell the
// moment nothing was selected. Depth is written, unlike the other translucent
// looks — there is only ever one layer of it on screen, because the far side is
// culled, and writing depth is what lets the depth-of-field and the crevice
// darkening treat the coat as something that is actually there.
const GEL = { transparent: true, opacity: 0.24, depthWrite: true }

export function gelLook(state) {
  if (state === 'ghost') return GHOST
  // Picked, it firms up — but only far enough to read its thickness against the
  // wall. Drawn opaque it would be a shell, which is the one thing it is not.
  if (state === 'active') return { ...GEL, opacity: 0.44 }
  return GEL
}
