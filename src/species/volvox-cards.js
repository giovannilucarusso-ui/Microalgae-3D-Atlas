// The cards for Volvox aureus.
//
// Two literatures, and the tiers keep them apart. What is measured on V. aureus
// is mostly the old light-microscope description — colony size, cell count, the
// number and size and place of its gonidia, the size its young reach before
// release, its sexual colonies and zygotes — with its habitat, and one
// ultrastructural paper on the strands that join its cells. Almost everything
// else anyone knows about how a Volvox works was measured on V. carteri, the
// laboratory species: its cell counts and matrix, the rule that decides which
// cell becomes a gonidium, how it swims and steers, its genome. Those rows sit
// at the second tier here, as the sister species' did on Braarudosphaera — not
// because anybody doubts them, but because they were measured on a different
// organism than the one on the stage.
//
// What neither literature gives — how crowded the drawn drop is, which stage its
// colonies are at, how it is framed — is a choice, and it sits at the third tier.
const VIEW = [0, 0, 1]

// `rimUm` is the radius of the colony centred on the stage, so the card that is
// about the cells can be aimed at the place they are sharp: its rim.
export function volvoxCards({ rimUm }) {
  const rim = [rimUm * Math.SQRT1_2, rimUm * Math.SQRT1_2, 0]
  return {
    organism: {
      view3d: 'filament',
      name: 'Volvox aureus',
      latin: 'Volvox aureus Ehrenberg 1832',
      confidence: 'species',
      what: 'A green alga that lives as a colony: a hollow ball of clear jelly, up to about half a millimetre across — just visible to the naked eye as a green speck — with a thousand or more small cells set in a single layer at its surface, each beating two flagella, so that the whole ball rolls slowly through the water. Inside it, in the back half, sit the few large cells that will become the next colonies.',
      role: 'It is the commonest Volvox, found in ponds and lakes on every continent, and one of the most studied organisms in biology for one reason: it has only two kinds of cell. Many small somatic cells swim and can never divide; a few large germ cells, the gonidia, divide and never swim. It is the simplest organism with a division of labour between body and germ line, and its relatives — single cells, flat plates of four or sixteen cells, balls of thirty-two or sixty-four — are alive today, a graded series from one cell to Volvox. Antonie van Leeuwenhoek saw its colonies in 1700 and described them as great round particles; Linnaeus named the genus in 1758, from volvere, to roll.',
      dimensions: [
        ['Colony', 'hollow sphere or ellipsoid, 400–600 µm when mature', 'species'],
        ['Cells', '500–3200, in one layer at the surface', 'species'],
        ['Cell types', 'two: somatic cells and gonidia', 'species'],
        ['Young per colony', '4–12, in the posterior half', 'species'],
        ['Reproduction', 'asexual by daughter colonies; sexual by eggs and sperm', 'species'],
        ['First seen', 'van Leeuwenhoek, 1700', 'model'],
        ['Genus named', 'Linnaeus, 1758 — from volvere, to roll', 'model'],
      ],
      sources: ['r65', 'r66', 'r81', 'r69'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 1580 },
    },

    habitat: {
      view3d: 'filament',
      name: 'Where it lives',
      latin: 'habitatio',
      confidence: 'species',
      what: 'Fresh water, almost anywhere: lowland lakes, rivers, ponds, ditches and puddles, on every continent. It is the most commonly reported species of the genus.',
      role: 'It is most abundant in late summer, when warm, nutrient-rich water can turn green with it. A colony is heavier than water and swims upwards towards light, so in a jar left by a window the colonies gather on the lit side, where a pipette can take a concentrated drop — which is what is on the stage here, and why its colonies nearly touch. In open water they are far sparser.',
      dimensions: [
        ['Water', 'fresh; lowland lakes, rivers, ponds, ditches, puddles', 'species'],
        ['Distribution', 'cosmopolitan; the most commonly reported Volvox', 'species'],
        ['Season', 'most abundant in late summer', 'species'],
        ['Density', 'slightly heavier than water; it swims up to stay suspended', 'model'],
        ['Drawn', '6000 colonies per millilitre — a concentrated drop, not a pond', 'unverified'],
      ],
      sources: ['r66', 'r72', 'r80'],
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

    colony: {
      view3d: 'filament',
      name: 'The colony',
      latin: 'coenobium',
      confidence: 'species',
      what: 'A hollow ball of clear matrix, 400–600 µm across when mature, with its cells in a single layer at the surface — 500 to 3200 of them in this species. It is not a heap of cells that happen to stick together: its cells are joined by fine strands of cytoplasm, it has a front and a back, and all but a few of its cells will never divide again.',
      role: 'A colony is born with every cell it will ever have. It grows by laying down matrix, so as it ages its cells spread apart rather than multiplying — which makes the count a property of each colony, drawn once here, and the spacing between cells what that count leaves on a sphere of that size. In darkfield a colony is drawn by that layer. A ray through its rim runs along the layer for tens of micrometres, and one through its middle crosses it twice, briefly, so the rim is bright and the middle dim — about two and a half times brighter over the ground — and the ratio depends on how thick the layer is against how wide the ball, not on how big either is. The faces above and below the plane of focus are too far from it to resolve, and are the green haze across each colony. Click a colony to come back to this card.',
      dimensions: [
        ['Diameter, mature', '400–600 µm', 'species'],
        ['Cells', '500–3200, in one layer at the surface of a hollow sphere or ellipsoid', 'species'],
        ['Released young', '150–175 µm across', 'species'],
        ['Cell number', 'fixed in the embryo; the colony grows by its matrix, not by adding cells', 'model'],
        ['Matrix', 'about 99 % of the volume', 'model'],
        ['Drawn', '400–600 µm, and 175–320 µm for young colonies', 'species'],
        ['Drawn cells', '1000–2400 a colony, the middle of the species’ range', 'unverified'],
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
      role: 'They swim and do nothing else: they do not divide, and once the colony has released its young they die with it. In darkfield each shows as a point of light — something small and refractile in the cell scatters far more than the rest of it. Near the plane of focus the cells are drawn one by one where they sit, on an even lattice with a little disorder in it; further off they merge into the haze of the layer, and the handover is the blur itself: a cell is drawn as a cell for as long as its blur is small against the spacing between cells. Their light is green because it has crossed the cell’s own chloroplast on its way out.',
      caveat:
        'The colour is not measured. The chloroplast carries the chlorophyll a and b shape the atlas gives every green alga, at a depth chosen so the scattered light comes out green. And the bright point in each cell is drawn as one refractile body; which body it is — eyespot, pyrenoid, a starch grain — is not established.',
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
      role: 'It is the part that grows. In V. carteri the colony’s radius increases with age while the number and the size of its cells do not, and the compartments round the cells loosen as it does, from a tight polygonal packing to a looser one. In darkfield it is nearly invisible, because its refractive index is close to water’s: which is why a colony here is drawn by its cells and not by an outline.',
      dimensions: [
        ['Share of the volume', 'about 99 %', 'model'],
        ['Compartments', 'one per somatic cell; areas gamma-distributed', 'model'],
        ['As it grows', 'packing loosens from polygonal to acircular', 'model'],
        ['Radius with age', 'grows; cell number and cell size do not', 'model'],
        ['Drawn', 'somatic cells under 1 % of a mature colony’s volume; the rest is matrix', 'model'],
        ['Its outline', 'not drawn — too close to water’s index to scatter', 'unverified'],
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
      role: 'Germ and soma are separated here in the plainest form there is: the gonidia reproduce and do not swim, the somatic cells swim and do not reproduce. In V. carteri which a cell becomes is decided by its size when cleavage ends — above about 8 µm, a gonidium — and it has sixteen of them and about two thousand somatic cells. An undivided gonidium is a solid green body, drawn with its edge bright, as a dense body’s is in darkfield. In the drawn drop only the young colonies still carry them undivided; elsewhere they have already cleaved.',
      dimensions: [
        ['Number', '4–12', 'species'],
        ['Diameter', '18–22 µm', 'species'],
        ['Position', 'irregularly, in the posterior half', 'species'],
        ['What makes a gonidium', 'over about 8 µm when cleavage ends', 'model'],
        ['In V. carteri', '16 gonidia and about 2000 somatic cells', 'model'],
        ['Drawn undivided', 'in about one colony in twelve, the young ones', 'unverified'],
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
      role: 'The inversion is what a Volvox embryo is famous for: the whole sheet of cells folds through itself, as a sock is turned. This species does it in the second of the two known ways, type B: the posterior hemisphere contracts first and the opening widens while the anterior half moves over it. Once released, the juvenile swims off and the parent, left with nothing but somatic cells, dies. Most colonies in the drawn drop carry juveniles part-way through their expansion. A juvenile is drawn by the same function as its parent, because it already is one: every cell it will have, in a layer on a sphere. Its light is the most saturated green in the field, having crossed so much plastid.',
      dimensions: [
        ['Released at', '150–175 µm', 'species'],
        ['Inversion', 'type B — the posterior hemisphere first', 'species'],
        ['Cells', 'all the colony will have, fixed when cleavage ends', 'model'],
        ['The parent', 'dies once its young are released', 'model'],
        ['Drawn', 'juveniles from 40 % of the release size to full, most near the start; embryos at a gonidium’s size', 'unverified'],
        ['Stage mix drawn', 'about 84 % of colonies with juveniles, 8 % with embryos, 8 % young', 'unverified'],
        ['Their cells', 'drawn from 1.2 µm just after cleavage to 5 µm at release — not measured', 'unverified'],
      ],
      sources: ['r65', 'r68', 'r69', 'r70'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 620 },
    },

    sexual: {
      view3d: 'filament',
      name: 'Sexual reproduction',
      latin: 'reproductio sexualis',
      confidence: 'species',
      what: 'Most of the year Volvox aureus reproduces without sex, by daughter colonies. Now and then colonies are made that carry sex cells instead: male colonies with packets of sperm, female colonies with eggs. The species is usually dioecious — a colony is one sex or the other.',
      role: 'A male colony carries hundreds of sperm packets, plates of thirty-two sperm that swim off together and break up at a female. A fertilised egg becomes a zygote with a thick wall, smooth in this species where V. globator’s is spiny, and it is the zygote that lasts through winter or a dried-up pond; it germinates when conditions return. None of the colonies on this stage is sexual: the drawn drop is in its asexual cycle.',
      dimensions: [
        ['Sexes', 'usually separate colonies (dioecious)', 'species'],
        ['Male colonies', '330–360 µm long, 1000–5000 cells', 'species'],
        ['Sperm packets', '600–1000 a colony, plates 15–18 µm of 32 sperm', 'species'],
        ['Female colonies', '340–415 µm, with 7–21 eggs, usually 10–14', 'species'],
        ['Zygote', '38–62 µm, with a smooth wall', 'species'],
        ['What the zygote is for', 'surviving winter or drying, then germinating', 'model'],
        ['Drawn', 'none — the drop is asexual', 'unverified'],
      ],
      sources: ['r65', 'r69'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 1580 },
    },

    swimming: {
      view3d: 'filament',
      name: 'Swimming and turning',
      latin: 'motus',
      confidence: 'model',
      what: 'A colony swims anterior first, turning about its own axis as it goes, driven by the flagella of all its somatic cells beating in waves that run across the surface.',
      role: 'It steers towards light with no nervous system: the cells at the front have the largest eyespots, and each cell’s flagella answer its own eyespot as the colony’s turning sweeps it past the light. In still water colonies swim upwards and turn about vertical axes, so here their front poles are tipped towards the objective, which is up. V. carteri colonies 150 µm in radius turn at about a radian a second, larger ones more slowly; the colonies here are larger, and in a drop this crowded they turn in place rather than travel.',
      dimensions: [
        ['Flagella', 'two per somatic cell', 'species'],
        ['Beat', 'coordinated as metachronal waves', 'model'],
        ['In still water', 'swims upwards, turning about a vertical axis', 'model'],
        ['Turning', 'about 1 rad/s at 150 µm radius, slower when larger', 'model'],
        ['Steering', 'phototaxis, by the eyespots; largest at the anterior', 'model'],
        ['Drawn', 'a turn every 8–18 s, all in one sense', 'unverified'],
        ['Swimming speed of this species', 'not found in what could be read', 'unverified'],
      ],
      sources: ['r72', 'r80', 'r73', 'r74', 'r75'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 1580 },
    },

    identification: {
      view3d: 'filament',
      name: 'Which Volvox is this?',
      latin: 'determinatio',
      confidence: 'species',
      what: 'There are about twenty species of Volvox, and three are the ones a pond usually gives. V. aureus has thin strands between its cells, four to twelve young in each colony and a smooth-walled zygote. V. globator is larger, with many more cells joined by strands thick enough to make each cell a star in surface view, and a spiny zygote. V. carteri, the laboratory species, has no strands in the adult and sixteen gonidia.',
      role: 'Down a light microscope the strands are the first thing to look for, and at the magnification of this view they are not resolved: fine strands are about as thick as a flagellum. What this drop can show is the rest of the character — the number of young in each colony and where they sit, the size of the colonies and of their cells — and all of it is drawn to V. aureus.',
      dimensions: [
        ['Cytoplasmic strands', 'thin in V. aureus', 'species'],
        ['Young per colony', '4–12 in V. aureus; 16 in V. carteri', 'species'],
        ['Zygote wall', 'smooth in V. aureus, spiny in V. globator', 'species'],
        ['V. carteri', 'about 2000 somatic cells and 16 gonidia', 'model'],
        ['Strands at this magnification', 'not resolved', 'unverified'],
      ],
      sources: ['r65', 'r67', 'r70', 'r66'],
      camera: { target: [0, 0, 0], dir: VIEW, distance: 1580 },
    },
  }
}
