// What the two Chlorella species in this atlas share, which is nearly
// everything — and that is the point rather than a convenience.
//
// Chlorella vulgaris and C. sorokiniana cannot be told apart down a light
// microscope. This is not a limitation of the model: the Chlorella clade is
// characterised by high cryptic diversity, and the taxonomic revision that
// sorted it out says plainly that what defeated a century of morphological
// work was "the limited number of morphological characters and small dimensions
// of vegetative cells" (Bock, Krienitz & Pröschold 2011). A strain deposited as
// C. vulgaris — NIES-2173 — has since been reclassified as C. sorokiniana. The
// separation is made on ITS-2 and 18S, not with an objective.
//
// An illustrated atlas has to draw them different, because it has no way of
// saying "these two look the same". This one can draw them the same and say so,
// and that statement is true, checkable and useful. It is the project's whole
// thesis meeting a real case at the second specimen.
//
// The one thing the instrument does separate is size, and only in aggregate:
// C. sorokiniana runs smaller. Two cells picked at random may be identical;
// two *fields* are not. Hence a population, at one shared field of view — if the
// two were framed differently the difference would be rescaled away, which
// would be a picture of the framing rather than of the organisms.
import { SHARED_CARDS } from './chlorella-cards.js'

export const CHLORELLA_GENUS = {
  group: 'Chlorophyta · Trebouxiophyceae',
  // Bock, Krienitz & Pröschold (2011), emended diagnosis of the genus, quoted:
  // "cells spherical, subspherical or ellipsoid, single or forming colonies
  // with up to 64 cells, mucilage present or absent. Chloroplast single,
  // parietal, pyrenoid present, surrounded by starch grains. Reproduction by
  // autospores, zoospores lacking. Autospores released through disruption of
  // mother cell wall."
  kind: 'coccoid-field',
  label: 'Wet mount',
  // Both species at the same field of view, deliberately. See above.
  fieldUm: 88,
  // Nearly down the optical axis, as a wet mount is looked at. The small tilt
  // is there so a still frame is not a flat poster; the depth is meant to be
  // explored with the fine focus, not with the orbit.
  view: [0.1, 0.075, 1],
  // The coverslip gap, near enough. It is what puts most of the field outside
  // the plane of focus at any one setting.
  depthUm: 45,
  // A dense but ordinary harvest culture. The number of cells drawn follows
  // from this, the field and the coverslip gap — see `populationSize` — instead
  // of being a count chosen because it looked about right.
  cellsPerMl: 2.0e8,
  // Chlorophyll a and b and no phycobilins: grass green, where Spirulina is
  // blue-green. It is the first thing that separates the two organisms here,
  // and it is visible down any objective.
  colour: '#3f7a3c',
  groups: [
    { title: 'The cell', ids: ['cellBody', 'chloroplast', 'wall'] },
    { title: 'Reproduction', ids: ['autospores'] },
    { title: 'Telling them apart', ids: ['identification'] },
  ],
}

export const CHLORELLA_CARDS = SHARED_CARDS
