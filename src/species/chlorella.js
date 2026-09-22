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

// The two confidence-tier labels that have to name an organism.
//
// "Measured in Chlorella" and not in one of the two species, because that is
// what the evidence is: nearly everything a light microscope can say here is a
// genus character, and the two species are drawn alike for exactly that reason.
// The second tier is the genus and its close relatives — there is no model
// organism standing behind this one the way Synechocystis stands behind
// Spirulina.
export const CHLORELLA_TIERS = {
  species: 'Measured in Chlorella',
  model: 'From the genus or a close relative',
}

// Where the genus sits on the landing page's tree (src/tree.js).
export const CHLORELLA_LINEAGE = { domain: 'Eukaryota', supergroup: 'Archaeplastida', phylum: 'Chlorophyta' }

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
  //
  // And that field is now half what it was, which is the difference between
  // scanning a slide and looking at a cell. At 88 µm the slab holds seventy
  // cells at the stated density, each a few dozen pixels across, and a
  // Chlorella a few dozen pixels across is a green dot — which is a true
  // picture of a low-power sweep and a useless one for saying what is inside
  // one. At 48 the same culture puts about twenty cells in frame at twice the
  // size, and the pyrenoid, the starch round it and the wall of a sporangium
  // are all above what the instrument can resolve rather than below it.
  //
  // Nothing about the culture changed to do this: the density below is what it
  // was, the coverslip gap is what it was, and the number of cells drawn still
  // falls out of those two and this. What changed is the objective — which is
  // the honest lever, because it is the one a person at a bench actually
  // reaches for.
  fieldUm: 48,
  // **Down the optical axis. Exactly.**
  //
  // It used to be tilted by seven degrees, so that a still frame was not a flat
  // poster. That was a decision about a picture taken before the view was an
  // instrument, and once the objective stopped turning — see `orbit` in
  // microscope.js — it was doing real damage rather than none.
  //
  // A tilted axis means a cell's *depth* depends on where it sits in the field.
  // Across forty-eight micrometres a seven-degree tilt is nearly six
  // micrometres of depth from one side of the frame to the other, which is more
  // than twice the whole settled layer: cells on one edge were systematically
  // out of focus while cells on the other were systematically in, and no amount
  // of racking could fix it because the slide was not parallel to the plane of
  // focus. It defeated the entire point of modelling cells as resting on the
  // glass — they were coplanar in the specimen and not in the image.
  //
  // A real coverslip is square to the optical axis, and when it is not, that is
  // a fault an operator corrects rather than a look.
  view: [0, 0, 1],
  // The condenser carries a Rheinberg filter for this specimen: a petrol-blue
  // central disc and a yellow-green ring.
  //
  // It is a real technique and about a century old, and it is chosen here for
  // the reason anyone chooses it — a coccoid green alga is a smooth, weakly
  // absorbing little sphere, and in plain brightfield a field of them is a field
  // of pale green dots. Rheinberg puts the ring's light in only where the
  // specimen bends it, so every wall, every margin and every refractile grain
  // lights up against a ground the specimen cannot reach. What it costs is that
  // the colour is no longer simply the pigment's transmittance: it is that
  // transmittance under two lamps, and the card should say so.
  //
  // A filter is a piece of glass you slide in and out, so it lives on the
  // specimen rather than on the lens — Spirulina is looked at without one. See
  // `illumination` in microscope.js.
  // Which condenser filter this specimen opens with — an id from FILTERS in
  // microscope.js, and only a default: the viewer can change it, because at a
  // bench that is exactly what you would do.
  filter: 'teal-green',
  // The coverslip gap, near enough. It is what puts most of the field outside
  // the plane of focus at any one setting.
  depthUm: 45,
  // A dense harvest culture, counted off the plates rather than asserted.
  //
  // The CAUP H1917 plates hold roughly forty-five objects in a field about
  // sixty-six micrometres across — read off the frame against the cells' own
  // diameters — and an object averages close to two cells, because a good third
  // of what is on that slide is a pair inside an unbroken wall or a quartet just
  // released. That is about eighty-five cells in 66 x 66 x 45 micrometres, and a
  // millilitre is 1e12 of those, so the culture is a little over four hundred
  // million cells to the millilitre.
  //
  // Written as 2e8 — a number that was merely plausible — the same field came
  // out at half the population the plates show, and the emptiness read as the
  // model being sparse rather than as the culture being thin. The number of
  // cells drawn still follows from this, the field and the coverslip gap; what
  // changed is that this one can be checked.
  cellsPerMl: 4.3e8,
  // How much of the culture is stuck together, and in what sizes. Read off the
  // CAUP plates, where roughly half the cells are in clumps of a handful to a
  // couple of dozen and the rest are free.
  //
  // Counted in *units* rather than in cells, and a unit may be a sporangium of
  // eight — so a clump of five here is a dozen or more cells, which is the range
  // the plates show.
  clumping: { fraction: 0.62, size: [3, 7] },
  // What a cell has stored, as bodies that bend light rather than absorb it.
  //
  // Two populations, and the honest point about them is that this instrument
  // cannot separate them: starch goes down in the chloroplast — the generic
  // diagnosis has the pyrenoid "surrounded by starch grains" — and oil goes down
  // in the colourless cytoplasm, where C. vulgaris will carry five to forty per
  // cent of its dry weight and considerably more when it is starved. Down a
  // brightfield objective both are the same small bright body. Starch takes
  // iodine, oil takes Nile red; this view takes neither.
  //
  // The counts are the range a cell that has had time to fill can show. How many
  // a given cell actually gets scales with its size, because storage accumulates
  // across the cell cycle and the smallest cells in a field have just come out of
  // a mother wall.
  //
  // One oil drop in the cells that carry any, and not two. Two of them plus the
  // starch put five or six bright bodies in one cell, and bright bodies do not
  // politely take turns: enough of them in one place give back all the light the
  // chloroplast took and the pigment simply disappears there.
  granules: {
    starch: [1, 3],
    cytoplasmic: { fraction: 0.38, count: [1, 1] },
  },
  // The emptied mother walls that have drifted away from whatever came out of
  // them — the ones still lying beside their own daughters come with the
  // released groups above. A proportion of the units in frame, plausible for a
  // culture a day into its growth rather than a count off a plate, and the card
  // says so.
  ghosts: { perUnit: 0.05 },
  // Chlorella is denser than its medium and has no flagellum: in a mount left to
  // stand it goes to the glass. Most of the culture is on the slide, a minority
  // still in suspension above it.
  // And the layer is about one cell thick, because that is what a layer of
  // sedimented cells is. Drawn four micrometres deep it was nearly two cells
  // thick, and with a depth of field of a couple of micrometres that put most
  // of even the *settled* population off the plane: two cells in a field of
  // twenty came out sharp, and a picture where the subject is never quite in
  // focus reads as a soft picture rather than as a deep one. Nothing about the
  // objective needed changing for this — the optics were right and the slide
  // was wrong.
  settling: { settled: 0.72, layerUm: 2.6 },
  // The colour is a set of transmittances, not a paint sample: `specimenMaterial`
  // solves each channel for an absorption coefficient, so this is what one unit
  // of pigment lets through.
  //
  // Two readings went into it, and the second one is a correction to how the
  // first was used rather than to the first.
  //
  // **Luminance, off the CAUP Chlorella vulgaris H1917 plates.** Field
  // (186, 182, 131), cell interior (126, 147, 12): a cell passes about three
  // quarters of the light, not the half it was first drawn at. Chlorophyll
  // makes green by *failing to absorb* green rather than by darkening
  // everything, which is what its spectrum says and the opposite of what a dark
  // green paint does.
  //
  // **Hue, off the pigment's absorption spectrum and not off that plate's blue
  // channel.** Taken literally the same two pixels say blue transmits 0.09
  // where red transmits 0.68 — blue extinguished seven times harder. No
  // chlorophyll does that. In vivo the Soret band near 435 nm and the red band
  // near 675 nm are comparable, with the carotenoids adding to the blue side,
  // so red and blue should both be well down and blue only somewhat further.
  // What that ratio actually measured is the plate's own white balance: its
  // field is already frankly khaki, blue at 0.70 of red before the light meets
  // a cell, so inside one the blue channel is sitting at 12 out of 255 — on the
  // sensor's floor, where a ratio has stopped meaning anything.
  //
  // Used as a transmittance it was catastrophic, because transmittances are
  // raised to the path: at twice the drawn thickness 0.09 becomes 0.008, and
  // more than half the pigmented area of the frame came out with a blue channel
  // of 0, 1 or 2. That is not a dark green, it is a *clipped* one — a colour no
  // camera returns — and it is the single largest reason the field read as
  // drawn rather than photographed.
  //
  // So: red 0.50, green 0.72, blue 0.33. The luminance is the plate's; the
  // shape is chlorophyll's. A thick cell now walks towards a dark olive-emerald
  // instead of towards a lime that gets more saturated the darker it gets.
  colour: '#80b854',
  groups: [
    { title: 'The cell', ids: ['cellBody', 'chloroplast', 'pyrenoid', 'granules', 'wall'] },
    { title: 'Reproduction', ids: ['autospores'] },
    { title: 'Telling them apart', ids: ['identification'] },
  ],
}

export const CHLORELLA_CARDS = SHARED_CARDS
