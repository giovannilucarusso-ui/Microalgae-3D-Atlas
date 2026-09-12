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
    role: 'What you meet is never one cell. A culture is a field of them, and the field is the specimen here — a single drawn cell would be an average, and an average is exactly the thing that cannot carry the difference between two species of this genus. Most of them have settled onto the glass, which is why so many can be sharp at once: the depth of field at this magnification is under a micrometre, so a population spread through the whole coverslip gap would never show you more than one cell at a time. Rack the fine focus off the layer and you find the few still in suspension. The frame is about forty-eight micrometres across, which is a cell being looked at rather than a slide being scanned: at twice that the same culture puts seventy cells in frame, each of them a green dot, and nothing inside one of them is above what the instrument can resolve.',
    dimensions: [
      ['Shape', 'spherical, subspherical or ellipsoid', 'species'],
      ['Wall', 'smooth, no flagella, no gliding', 'species'],
      ['Culture drawn here', '4.3 x 10^8 cells/mL — counted off the CAUP plates', 'model'],
      ['Field of view', 'about 48 µm — high power, not a scan', 'unverified'],
      ['On the glass', 'about seven in ten; Chlorella is denser than its medium and has no flagellum', 'model'],
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
    what: 'One parietal chloroplast, cup-shaped, lining most of the inside of the wall and stopping short of closing. Chlorophyll a and b and no phycobilins, which is why this alga is grass green where a cyanobacterium is blue-green. All the colour in this field is this organelle: the cytoplasm around it is colourless.',
    // What the pigment lets through was measured, and what you are looking at
    // may not be it. See `colour` and `filter` in chlorella.js.
    caveat:
      'The pigment’s transmittance is measured — red 0.50, green 0.72, blue 0.33 of the light that reaches it — but what you see is that transmittance under whatever is in the condenser. Only with the filter set to None is the colour on screen the pigment’s own. Under a Rheinberg filter the specimen is lit by two lamps at once: a coloured disc whose light goes straight through, and a ring whose light reaches the image only where the cell bends it. That makes the cell far easier to read and its colour no longer a measurement. Set the filter to None to see the measured colour.',
    role: 'The opening it leaves is why a field of Chlorella does not read as repeated spheres. A cell lying with its mouth towards you shows a ring with a pale middle; lying side-on it shows a C; lying with its closed side towards you it shows a full disc — one organelle seen from every angle at once, and most of what an operator is actually looking at. That variation is not drawn on: the cup is built, and the beam crosses its wall twice through the closed side and once or not at all through the mouth. The smallest cells in the field show none of it, which is also true down a real objective.',
    // The margin is drawn as a margin rather than as a circle, and that is a
    // correction rather than a flourish: built as a solid of revolution — one
    // turned shape at forty orientations — every cell in the field carried the
    // same outline, and a field of one outline reads as a pattern however well
    // the pigment inside it is drawn. How far the cup closes is not a fixed
    // character either. The diagnosis says parietal and cup-shaped and stops
    // there, so the drawn population runs from a cup nearly closed over to a
    // shallow bowl.
    dimensions: [
      ['Number', 'one per cell', 'model'],
      ['Form', 'parietal, cup-shaped, pyrenoid present', 'model'],
      ['Margin', 'lobed and wandering, not a circle', 'model'],
      ['Thickness', 'from a thin parietal sheet to half the cell\'s radius', 'model'],
      ['Resolved here', 'the cup and its margin; the pyrenoid in the larger cells', 'unverified'],
      ['Share of cell volume', 'about one half', 'model'],
      ['Pigments', 'chlorophyll a and b; no phycobiliproteins', 'model'],
      ['Transmittance, one unit of pigment', 'R 0.50 · G 0.72 · B 0.33', 'species'],
      ['Colour on screen is the measurement', 'only with the condenser filter set to None', 'unverified'],
    ],
    sources: ['r44'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 34 },
  },

  pyrenoid: {
    view3d: 'filament',
    name: 'Pyrenoid',
    latin: 'pyrenoides',
    confidence: 'model',
    what: 'One pyrenoid to a chloroplast, sunk in the thick of the cup rather than floating in the middle of the cell: a body of Rubisco with a single double-layered thylakoid running through it, capped either side by two thick concavo-convex plates of starch. Not a sheath in one piece — two pieces. It is the one structure inside the chloroplast a good objective picks out of a living cell, because starch bends light where the pigment around it absorbs it.',
    role: 'It is also the second character in this atlas that refuses to separate the two Chlorella species. Ikeda & Takeda sectioned the genus and sorted it by pyrenoid: the species with glucosamine walls — C. vulgaris, C. sorokiniana and C. kessleri — came out virtually identical, down to the doubled thylakoid through the matrix. A difference a light microscope could never have seen turns out not to be there at the scale that could see it. The two plates are drawn here as two lenses rather than as two cups: the concavity is a fraction of a micrometre on a body about one micrometre across, it is in the electron micrographs and it is not in this view, and drawing it would be drawing a claim the instrument cannot carry.',
    dimensions: [
      ['Number', 'one per chloroplast', 'model'],
      ['Starch sheath', 'two concavo-convex plates, not a continuous shell', 'species'],
      ['Traversed by', 'a single double-layered thylakoid', 'species'],
      ['Different between the two species here', 'no — virtually identical', 'species'],
      ['Resolved here', 'as a bright body; its two plates only in the larger cells', 'unverified'],
    ],
    sources: ['r44', 'r48'],
    // Not closer. Under about forty the flight lands with one or two cells
    // filling the frame, and at that working distance the depth of field is a
    // micrometre — so whichever cell happens to be in the middle is dissolved,
    // and the card about the one organelle you can pick out of a living cell
    // arrives showing a smear. Backed off, the frame holds a dozen cells and
    // some of them are in the layer.
    camera: { target: [0, 0, 0], dir: VIEW, distance: 48 },
  },

  granules: {
    view3d: 'filament',
    name: 'Refractile granules',
    latin: 'granula refringentia',
    confidence: 'unverified',
    what: 'The small bright bodies scattered through a cell. Some are starch, laid down in the chloroplast — the generic diagnosis has the pyrenoid "surrounded by starch grains" — and some are oil, in the colourless cytoplasm, where this species carries five to forty per cent of its dry weight and considerably more once it is starved. Down this objective they are the same thing: a body that bends light where everything around it absorbs it.',
    role: 'Which is which, you cannot say. Starch takes iodine and oil takes Nile red; brightfield takes neither, and the two are drawn here as one class for that reason rather than being given two colours to look informative. What does separate them in this view is not what they are but where they sit — a grain in the thick of the chloroplast is seen through the pigment and comes out green-bright, one in the clear middle of the cell comes out white-bright — and that is a statement about the light path, not about the chemistry. How many a cell carries goes with how large it is: storage accumulates across the cell cycle, and the smallest cells in a field have just come out of a mother wall and have had no time to lay any down.',
    dimensions: [
      ['Starch', 'in the chloroplast, around the pyrenoid and through the stroma', 'species'],
      ['Oil', '5–40% of dry weight in C. vulgaris, more under starvation', 'species'],
      ['Told apart here', 'no — it takes a stain', 'species'],
      ['Number drawn', 'up to half a dozen in a full-grown cell, none in the smallest', 'unverified'],
    ],
    sources: ['r44', 'r45'],
    // Same argument as the pyrenoid's above.
    camera: { target: [0, 0, 0], dir: VIEW, distance: 48 },
  },

  wall: {
    view3d: 'filament',
    name: 'Cell wall',
    latin: 'paries cellulae',
    confidence: 'model',
    what: 'A smooth wall, rigid enough that the genus is known industrially for being hard to break open. Its composition varies across the genus and across the growth cycle, and it is not resolved at this magnification: what the objective gives is the outline and the bright line just outside it.',
    role: 'The mother wall is what makes the reproduction of this genus visible at all. The daughters are cut inside it and stay there until it ruptures, and because it is a wall and they have their own, what you see is a contour of its own with cells inside it and a gap between — not a lumpy interior behind one outline, which is how this was drawn until the daughters were given walls of their own. What the rupture leaves is not debris: this wall is stiff enough that the standing industrial complaint about the organism is how hard it is to break, so the emptied mother walls persist in the medium as thin colourless bowls, and a culture a day into its growth has them scattered between the living cells. They are the faintest things in this field — an outline with nothing inside it — which is what an empty wall is.',
    dimensions: [
      ['Resolved here', 'no — outline and Becke line only', 'unverified'],
      ['Flagella', 'none, at any stage', 'species'],
      ['Drawn here', 'as its own contour round a sporangium, and as a bowl once torn', 'unverified'],
    ],
    sources: ['r44'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 34 },
  },

  autospores: {
    view3d: 'filament',
    name: 'Autospores',
    latin: 'autosporae',
    confidence: 'species',
    what: 'Reproduction is asexual and there are no zoospores: the mother cell divides internally, each daughter builds its own wall, and the mother wall then ruptures and lets them go. The count is a power of two — two, four, eight, sixteen — because the protoplast gets there by successive bipartition and cannot arrive at three or five. It is the character the genus description is built on, and the one thing at this scale the instrument really resolves.',
    role: 'So a field is not a field of single cells, and drawing it as one was the flattest thing about this view. Three of the things on this slide are stages of this process: a sporangium, where the wall has not broken yet and holds its daughters with a visible gap between them and it; a group just released, still sitting where the wall let them go; and the emptied wall itself. Together they are about a third of what is in frame, which is what the plates show — a growing culture is mostly busy dividing. A daughter is not a special kind of body here: it is a cell, built exactly as any other, because an autospore has its own wall and its own chloroplast before it is ever released.',
    dimensions: [
      ['Autospores per mother', 'a power of two — 2 or 4 usually, 8 less often', 'species'],
      ['Zoospores', 'none', 'species'],
      ['Release', 'rupture of the mother cell wall', 'species'],
      ['What the release leaves', 'the emptied mother wall, which stays in the medium', 'species'],
      ['Stages drawn here', 'sporangia one unit in five, released groups one in ten', 'unverified'],
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
    role: 'This is why the atlas draws the two species with the same body and the same instrument, and says so on both cards, rather than inventing a difference to make them look distinct. Nor is it only this instrument that fails: the two are also identical at a scale a light microscope cannot reach. Ikeda & Takeda sectioned the genus and sorted it by pyrenoid, and C. vulgaris and C. sorokiniana came out virtually the same organelle — so the electron microscope, brought in to settle it, agrees with the objective. The one thing this view does separate is size, and only in aggregate: C. sorokiniana runs smaller, so two fields differ where two cells may not. Both are framed at the same field of view on purpose — frame them differently and the difference is rescaled away.',
    dimensions: [
      ['Separable by light microscopy', 'no', 'species'],
      ['Separable by pyrenoid ultrastructure', 'no — virtually identical', 'species'],
      ['Separated by', 'ITS-2 barcode; 18S rRNA', 'species'],
      ['Distinguishable here', 'only as a size distribution, over a whole field', 'model'],
    ],
    sources: ['r44', 'r47', 'r48'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 60 },
  },
}
