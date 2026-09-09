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
  // How much of the culture is stuck together, and in what sizes. Read off the
  // CAUP plates, where roughly half the cells are in clumps of a handful to a
  // couple of dozen and the rest are free.
  clumping: { fraction: 0.55, size: [3, 14] },
  // Chlorella is denser than its medium and has no flagellum: in a mount left to
  // stand it goes to the glass. Most of the culture is on the slide, a minority
  // still in suspension above it.
  settling: { settled: 0.72, layerUm: 4 },
  // The colour is a set of transmittances, not a paint sample: `specimenMaterial`
  // takes -log of each channel as an absorption coefficient, so this is what one
  // unit of pigment lets through.
  //
  // Read off the CAUP Chlorella vulgaris H1917 plates rather than chosen. Field
  // (186, 182, 131), cell interior (126, 147, 12) — so red transmits 0.68, green
  // 0.81 and blue 0.09. **Chlorophyll makes green by extinguishing blue, not by
  // darkening everything**, which is exactly what its absorption spectrum says
  // and the opposite of what a dark green paint does. Drawn as a dark green the
  // cells came out at 0.46 of the field where the plates put them at 0.74: too
  // dark, too grey, and green for the wrong reason.
  colour: '#adcf17',
  groups: [
    { title: 'The cell', ids: ['cellBody', 'chloroplast', 'wall'] },
    { title: 'Reproduction', ids: ['autospores'] },
    { title: 'Telling them apart', ids: ['identification'] },
  ],
}

export const CHLORELLA_CARDS = SHARED_CARDS
