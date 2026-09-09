// The cards for both Chlorella species. Shared, because the two organisms are
// shared as far as this instrument can tell — see the note in chlorella.js.
//
// Confidence tiers work the same way as everywhere else in the atlas:
// `species` is measured in the organism named, `model` is borrowed from a
// relative or from the genus, `unverified` is drawn to a plausible proportion
// and flagged. What is unusual here is how much sits at the second tier, and
// that is the honest picture: nearly everything a light microscope can say
// about a Chlorella cell is a genus character, not a species one.
const VIEW = [0.1, 0.075, 1]

export const SHARED_CARDS = {
  cellBody: {
    view3d: 'filament',
    name: 'The cell',
    latin: 'cellula',
    confidence: 'species',
    what: 'A single green sphere, two to ten micrometres across, with a smooth wall and no flagellum. There is very little else a light microscope can say about one: at this size the cell is close to the resolution limit of the instrument looking at it, and most of what is written about Chlorella anatomy comes from electron microscopy rather than from this view.',
    role: 'What you meet is never one cell. A culture is a field of them at every depth, and the field is the specimen here — a single drawn cell would be an average, and an average is exactly the thing that cannot carry the difference between two species of this genus.',
    dimensions: [
      ['Shape', 'spherical, subspherical or ellipsoid', 'species'],
      ['Wall', 'smooth, no flagella, no gliding', 'species'],
      ['Culture drawn here', '2 x 10^8 cells/mL — a dense harvest culture', 'unverified'],
      ['Cells in frame', 'follows from that density, the field and the coverslip gap', 'unverified'],
    ],
    sources: ['r44', 'r46'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 60 },
  },

  chloroplast: {
    view3d: 'filament',
    name: 'Chloroplast',
    latin: 'chloroplastus',
    confidence: 'model',
    what: 'One parietal chloroplast, cup-shaped, occupying roughly half the cell volume, with a pyrenoid surrounded by starch grains. Chlorophyll a and b and no phycobilins, which is why this alga is grass green where a cyanobacterium is blue-green.',
    role: 'It is drawn as tone rather than as a body, and the card is marked accordingly. At two to five micrometres the cup and the pyrenoid are at or under what this objective resolves — what you actually see is that some cells are darker on one side than the other. Drawing a crisp cup here would be drawing an electron micrograph and calling it a wet mount.',
    dimensions: [
      ['Number', 'one per cell', 'model'],
      ['Form', 'parietal, cup-shaped, pyrenoid present', 'model'],
      ['Share of cell volume', 'about one half', 'model'],
      ['Pigments', 'chlorophyll a and b; no phycobiliproteins', 'model'],
    ],
    sources: ['r44'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 34 },
  },

  wall: {
    view3d: 'filament',
    name: 'Cell wall',
    latin: 'paries cellulae',
    confidence: 'model',
    what: 'A smooth wall, rigid enough that the genus is known industrially for being hard to break open. Its composition varies across the genus and across the growth cycle, and it is not resolved at this magnification: what the objective gives is the outline and the bright line just outside it.',
    role: 'The mother wall is what makes the reproduction of this genus visible at all. The daughters are cut inside it and stay there until it ruptures, so a dividing cell reads as a lumpy interior behind an intact outline — and the emptied wall remnants are left in the medium afterwards.',
    dimensions: [
      ['Resolved here', 'no — outline and Becke line only', 'unverified'],
      ['Flagella', 'none, at any stage', 'species'],
    ],
    sources: ['r44'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 34 },
  },

  autospores: {
    view3d: 'filament',
    name: 'Autospores',
    latin: 'autosporae',
    confidence: 'species',
    what: 'Reproduction is asexual and there are no zoospores: the mother cell divides internally into two to thirty-two daughters, each of which builds its own wall before the mother wall ruptures and releases them. It is the character the genus description is built on, and the one thing at this scale the instrument really resolves.',
    role: 'The dividing cells here are the minority they are at any one moment in a culture — a field where every cell was dividing would be a diagram of the process rather than a plate of the organism. Which cells divide, and into how many, is drawn from a seeded rule and is a composition, not a count.',
    dimensions: [
      ['Autospores per mother', '2–32; commonly 2–8', 'species'],
      ['Zoospores', 'none', 'species'],
      ['Release', 'rupture of the mother cell wall', 'species'],
      ['Dividing cells drawn here', 'about one in ten — a display choice', 'unverified'],
    ],
    sources: ['r44', 'r45'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 26 },
  },

  identification: {
    view3d: 'filament',
    name: 'Which species is this?',
    latin: 'incertae sedis sine sequentia',
    confidence: 'unverified',
    what: 'Down this instrument, you cannot tell. Chlorella vulgaris and C. sorokiniana are not separable on morphology: the clade is characterised by high cryptic diversity, and no single phenotypic character determines a taxonomic position within it. A strain deposited as C. vulgaris — NIES-2173 — was later reclassified as C. sorokiniana. The separation is made on ITS-2 and 18S sequence, not with an objective.',
    role: 'This is why the atlas draws the two species with the same body and the same instrument, and says so on both cards, rather than inventing a difference to make them look distinct. The one thing this view does separate is size, and only in aggregate: C. sorokiniana runs smaller, so two fields differ where two cells may not. Both are framed at the same field of view on purpose — frame them differently and the difference is rescaled away.',
    dimensions: [
      ['Separable by light microscopy', 'no', 'species'],
      ['Separated by', 'ITS-2 barcode; 18S rRNA', 'species'],
      ['Distinguishable here', 'only as a size distribution, over a whole field', 'model'],
    ],
    sources: ['r44', 'r47'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 60 },
  },
}
