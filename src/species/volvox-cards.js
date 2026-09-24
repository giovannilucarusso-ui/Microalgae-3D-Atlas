// The cards for Volvox aureus.
//
// Two literatures, and the tiers keep them apart. What is measured on V. aureus
// is mostly the old light-microscope description — colony size, cell count, the
// number and size and place of its gonidia, the size its young reach before
// release — and one ultrastructural paper on the strands that join its cells.
// Almost everything else anyone knows about how a Volvox works was measured on
// V. carteri, the laboratory species: its cell counts and matrix, the rule that
// decides which cell becomes a gonidium, how it swims and steers, its genome.
// Those rows sit at the second tier here, as the sister species' did on
// Braarudosphaera — not because anybody doubts them, but because they were
// measured on a different organism than the one on the stage.
//
// And a third source, the footage, which is of a Volvox nobody identified. What
// it shows without a scale bar entering — proportions, counts, stages, the fall
// of light from rim to middle, the rate of turning — is used and flagged at the
// third tier, and where it disagrees with the species the card says so.
const VIEW = [0, 0, 1]

// `rimUm` is the radius of the colony centred on the stage, so the card that is
// about the cells can be aimed at the place they are sharp: its rim.
export function volvoxCards({ rimUm }) {
  const rim = [rimUm * Math.SQRT1_2, rimUm * Math.SQRT1_2, 0]
  return {
    colony: {
      view3d: 'filament',
      name: 'The colony',
      latin: 'coenobium',
      confidence: 'species',
      what: 'A hollow ball of clear matrix, 400–600 µm across when mature, with its cells in a single layer at the surface — 500 to 3200 of them in this species. It is not a heap of cells that happen to stick together: its cells are joined by fine strands of cytoplasm, it has a front and a back, and all but a few of its cells will never divide again.',
      role: 'A colony is born with every cell it will ever have. It grows by laying down matrix, so as it ages its cells spread apart rather than multiplying — which makes the count a property of each colony, drawn once here, and the spacing between cells what that count leaves on a sphere of that size. In darkfield a colony is drawn by that layer. A ray through its rim runs along the layer for tens of micrometres, and one through its middle crosses it twice, briefly, so the rim is bright and the middle dim: about two and a half times brighter over the ground in the footage, and the same here, because the ratio depends on how thick the layer is against how wide the ball and not on how big either is. The faces above and below the plane of focus are too far from it to resolve, and are the green haze across each colony.',
      dimensions: [
        ['Diameter, mature', '400–600 µm', 'species'],
        ['Cells', '500–3200, in one layer at the surface of a hollow sphere or ellipsoid', 'species'],
        ['Released young', '150–175 µm across', 'species'],
        ['Cell number', 'fixed in the embryo; the colony grows by its matrix, not by adding cells', 'model'],
        ['Matrix', 'about 99 % of the volume', 'model'],
        ['Drawn', '400–600 µm, and 175–320 µm for young colonies', 'species'],
        ['Drawn cells', '1000–2400 a colony. The footage’s hold roughly 600 to 2800, by three readings of in-focus faces — counts no scale bar enters, which agree no more closely than that', 'unverified'],
        ['In the footage', '70–150 µm across on its own 100 µm bar — a quarter of the species’ size', 'unverified'],
      ],
      sources: ['r65', 'r66', 'r72', 'r69'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 820 },
    },

    somaticCells: {
      view3d: 'filament',
      name: 'Somatic cells',
      latin: 'cellulae somaticae',
      confidence: 'species',
      what: 'The cells of the layer: each a small green cell with two flagella beating out into the water, a cup of chloroplast and a red eyespot — a Chlamydomonas, near enough, in a matrix. In this species neighbours are joined by fine strands of cytoplasm, left behind by division in the embryo that never quite finished.',
      role: 'They swim and do nothing else: they do not divide, and once the colony has released its young they die with it. In darkfield each shows as a point of light — something small and refractile in the cell scatters far more than the rest of it — and a colony’s rim in the footage is a string of those points. Near the plane of focus the cells are drawn one by one where they sit, on an even lattice with a little disorder in it; further off they merge into the haze of the layer, and the handover is the blur itself: a cell is drawn as a cell for as long as its blur is small against the spacing between cells. Their light is green because it has crossed the cell’s own chloroplast on its way out.',
      caveat:
        'The colour is not measured. No brightfield image was used for this specimen, so the chloroplast carries the chlorophyll a and b shape the atlas gives every green alga, at the depth that returns the footage’s darkfield greens. And the bright point in each cell is drawn as one refractile body; which body it is — eyespot, pyrenoid, a starch grain — the footage cannot tell.',
      dimensions: [
        ['Flagella', 'two per cell, of equal length', 'species'],
        ['Cytoplasmic strands', 'fine, from incomplete division in the embryo', 'species'],
        ['Fate', 'no further division; they die with the colony', 'model'],
        ['What makes a cell somatic', 'under about 8 µm when cleavage ends', 'model'],
        ['Eyespots', 'largest at the anterior, about 2.5 µm, down to about 0.8 µm behind', 'model'],
        ['Diameter', 'compilations give 5–8 µm; drawn at 6 µm', 'unverified'],
        ['Spacing', 'what the count leaves on the sphere — 15–36 µm apart in a mature colony', 'unverified'],
        ['In darkfield', 'one refractile point per cell, inside its plastid', 'unverified'],
      ],
      sources: ['r65', 'r66', 'r67', 'r71', 'r74', 'r69'],
      camera: { target: rim, dir: VIEW, distance: 260 },
    },

    matrix: {
      view3d: 'filament',
      name: 'Matrix',
      latin: 'matrix extracellularis',
      confidence: 'model',
      what: 'The clear gel a colony mostly is: a glycoprotein matrix the cells secrete, about 99 % of the volume in V. carteri. It is not formless — each somatic cell sits in a compartment of its own within it.',
      role: 'It is the part that grows. In V. carteri the colony’s radius increases with age while the number and the size of its cells do not, and the compartments round the cells loosen as it does, from a tight polygonal packing to a looser one. In darkfield it is nearly invisible, because its refractive index is close to water’s: which is why a colony in the footage, and here, is drawn by its cells and not by an outline.',
      dimensions: [
        ['Share of the volume', 'about 99 %', 'model'],
        ['Compartments', 'one per somatic cell; areas gamma-distributed', 'model'],
        ['As it grows', 'packing loosens from polygonal to acircular', 'model'],
        ['Radius with age', 'grows; cell number and cell size do not', 'model'],
        ['Drawn', 'somatic cells under 1 % of a mature colony’s volume; the rest is matrix', 'model'],
        ['Its outline', 'not drawn — it does not scatter enough to show in the footage', 'unverified'],
      ],
      sources: ['r69', 'r79', 'r72'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 900 },
    },

    gonidia: {
      view3d: 'filament',
      name: 'Gonidia',
      latin: 'gonidia',
      confidence: 'species',
      what: 'The few large cells, four to twelve of them, scattered through the back half of the colony, each of which will make a whole new colony. They are 18–22 µm across in this species, three times a somatic cell.',
      role: 'Germ and soma are separated here in the plainest form there is: the gonidia reproduce and do not swim, the somatic cells swim and do not reproduce. In V. carteri which a cell becomes is decided by its size when cleavage ends — above about 8 µm, a gonidium — and it has sixteen of them and about two thousand somatic cells. An undivided gonidium is a solid green body, drawn with its edge bright, as a dense body’s is in darkfield. The drawn drop has few of them undivided, because the footage has few: nearly every colony in it is already carrying young.',
      dimensions: [
        ['Number', '4–12', 'species'],
        ['Diameter', '18–22 µm', 'species'],
        ['Position', 'irregularly, in the posterior half', 'species'],
        ['What makes a gonidium', 'over about 8 µm when cleavage ends', 'model'],
        ['In V. carteri', '16 gonidia and about 2000 somatic cells', 'model'],
        ['Drawn undivided', 'in about one colony in twelve — the footage’s one colony with no young showing', 'unverified'],
      ],
      sources: ['r65', 'r71', 'r70'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 700 },
    },

    embryos: {
      view3d: 'filament',
      name: 'Embryos and juveniles',
      latin: 'embryones',
      confidence: 'species',
      what: 'A gonidium divides without growing, into a hollow ball of all the cells its colony will ever have — with their flagella on the inside. It then turns itself inside out through an opening, and expands inside its parent as a juvenile colony until it is released at 150–175 µm.',
      role: 'The inversion is what a Volvox embryo is famous for: the whole sheet of cells folds through itself, as a sock is turned. This species does it in the second of the two known ways, type B: the posterior hemisphere contracts first and the opening widens while the anterior half moves over it. Most colonies in the footage carry juveniles well into their expansion — balls a sixth to a third of their parent’s diameter, their own cells showing as fine points where they are in focus — and that is the stage most of the drawn drop is at. A juvenile is drawn by the same function as its parent, because it already is one: every cell it will have, in a layer on a sphere. Its light is the most saturated green in the field, having crossed so much plastid.',
      dimensions: [
        ['Released at', '150–175 µm', 'species'],
        ['Inversion', 'type B — the posterior hemisphere first', 'species'],
        ['Cells', 'all the colony will have, fixed when cleavage ends', 'model'],
        ['In the footage', '4–10 showing in each colony, a sixth to a third of its diameter', 'unverified'],
        ['Drawn', 'juveniles from 40 % of the release size to full, most near the start; embryos at a gonidium’s size', 'unverified'],
        ['Their cells', 'drawn from 1.2 µm just after cleavage to 5 µm at release — not measured', 'unverified'],
      ],
      sources: ['r65', 'r68', 'r69', 'r70'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 620 },
    },

    swimming: {
      view3d: 'filament',
      name: 'Swimming and turning',
      latin: 'motus',
      confidence: 'model',
      what: 'A colony swims anterior first, turning about its own axis as it goes, driven by the flagella of all its somatic cells beating in waves that run across the surface.',
      role: 'It steers towards light with no nervous system: the cells at the front have the largest eyespots, and each cell’s flagella answer its own eyespot as the colony’s turning sweeps it past the light. In still water colonies swim upwards and turn about vertical axes, so here their front poles are tipped towards the objective. In the footage the colonies are packed nearly edge to edge and do not travel: each turns in place, about once every ten to twenty seconds, anticlockwise on the screen — read off it by following juveniles round inside colonies. Which pole of each faced the lens the footage does not show.',
      dimensions: [
        ['Flagella', 'two per somatic cell', 'species'],
        ['Beat', 'coordinated as metachronal waves', 'model'],
        ['In still water', 'swims upwards, turning about a vertical axis', 'model'],
        ['Steering', 'phototaxis, by the eyespots; largest at the anterior', 'model'],
        ['Turning in the footage', 'once every 10–20 s, anticlockwise on screen', 'unverified'],
        ['Swimming speed', 'not found for this species in what could be read', 'unverified'],
      ],
      sources: ['r72', 'r73', 'r74', 'r75'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 1580 },
    },

    germSoma: {
      view3d: 'filament',
      name: 'Germ and soma',
      latin: 'divisio laboris',
      confidence: 'model',
      what: 'Two kinds of cell in one organism: a few that reproduce, and many that cannot and die when their work is done. Volvox is the classic case of how a division of labour like that arises, because its relatives form a graded series from single cells upwards.',
      role: 'The multicellular volvocine algae split from their single-celled relatives about 234 million years ago, in the Triassic, and their three main lineages were established by 200 million years ago. Kirk described twelve steps from a Chlamydomonas-like cell to a Volvox — cells that stay joined after division, a colony with a front, inversion, a germ line set aside — and the living genera between them, Gonium, Pandorina, Eudorina and Pleodorina, still show the stages. Volvox’s genome, set beside Chlamydomonas’s, has much the same set of protein-coding genes: what changed was mostly how the old ones are used, with a few families enlarged, among them those of the matrix.',
      dimensions: [
        ['Cell types', 'two: somatic cells and gonidia', 'species'],
        ['Origin of the multicellular lineage', 'about 234 million years ago (Triassic)', 'model'],
        ['Three main lineages', 'established by about 200 million years ago', 'model'],
        ['From one cell to Volvox', 'twelve developmental steps', 'model'],
        ['Genome of V. carteri', 'much the same protein-coding repertoire as Chlamydomonas', 'model'],
      ],
      sources: ['r77', 'r76', 'r78', 'r65'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 1400 },
    },

    identification: {
      view3d: 'filament',
      name: 'Which Volvox is this?',
      latin: 'determinatio',
      confidence: 'unverified',
      what: 'The footage is labelled only “Volvox”. The atlas draws V. aureus, because what the footage shows of the young is this species’: four to ten showing in each colony, all in one half of it, where V. carteri has sixteen and V. globator’s cells are joined by strands thick enough to make each one a star.',
      role: 'The footage disagrees with the species in one number. Its colonies are 70–150 µm across on its own 100 µm scale bar, and Smith gives 400–600 µm for V. aureus. The proportions agree — young a sixth to a third of their parent, as V. aureus’s would be well into their growth; somewhere between six hundred and three thousand cells a colony, inside its range — and the absolute size does not. Either the footage’s organism is a smaller Volvox, or its colonies are small ones of this species. The atlas keeps the species’ size, frames the drop as the footage frames it, and leaves the question here, where anybody who can tell the two apart can answer it.',
      dimensions: [
        ['Young per colony', '4–10 showing in the footage; 4–12 in V. aureus; 16 in V. carteri', 'unverified'],
        ['Cells per colony', 'roughly 600–2800 in the footage, counted on in-focus faces; 500–3200 in V. aureus', 'unverified'],
        ['Colony size', '70–150 µm in the footage; 400–600 µm in V. aureus', 'unverified'],
        ['Cytoplasmic strands', 'thin in V. aureus; not resolved in the footage', 'species'],
        ['V. carteri', 'about 2000 somatic cells and 16 gonidia', 'model'],
      ],
      sources: ['r65', 'r67', 'r70', 'r66'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 1580 },
    },
  }
}
