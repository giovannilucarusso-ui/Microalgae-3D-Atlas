// The cards for Braarudosphaera bigelowii, motile stage.
//
// The tiers here carry a piece of taxonomy, and it is worth reading them for it.
// The motile stage of this alga was described in 1972 as a species of its own,
// Chrysochromulina parkeae, and that description — flagella 8–20 µm, haptonema
// 2.5–4.5 µm, two lateroparietal golden-brown plastids — is still the only
// place most of its light-microscope characters are measured. In 2026 the
// species complex was split (r53), and the name parkeae went with the large
// form, genotypes IV and V. The organism in the reference footage and in the
// nitroplast papers is genotype III: B. bigelowii itself. So the classic
// numbers are now a sister species' numbers, and they sit at the second tier —
// not because anybody doubts them, but because they were measured on a
// different organism than the one on the stage.
//
// What is measured on this species is recent, and much of it is at a scale no
// light microscope reaches: volumes from focused-ion-beam tomography, an
// envelope from cryo-electron tomography, a proteome. The card for the
// nitroplast says which of that the objective can carry and which it cannot.
const VIEW = [0, 0, 1]

export const BRAARUDOSPHAERA_CARDS = {
  cellBody: {
    view3d: 'filament',
    name: 'The motile cell',
    latin: 'cellula flagellata',
    confidence: 'species',
    what: 'An elongate cell about fourteen micrometres long and five wide: blunt at the front, where two flagella and a short haptonema arise; widest behind the middle, where the nitroplast lies; drawn to a point at the back, with a small knob projecting from the tip. It is compressed front to back and covered in thin organic scales. This is one of the species’ two stages — the other is a non-motile cell inside twelve calcite plates.',
    role: 'What draws this cell in brightfield is not its colour but its edges. It is pale, and it sits in sea water, and like any unstained cell it is mostly a phase object: slightly out of focus, every margin grows a bright line on the inside and a dark one outside, and that outline is what the eye reads first. None of its dimensions here were typed in. The proportions are measured off the reference footage, and the size is the one at which those proportions give the volume that focused-ion-beam tomography measured on cells of the same culture — which lands at fourteen micrometres, inside the range the species description gives. A culture of this alga is thin: a field this size holds a cell about once in several dozen looks, so the one on the stage was found and centred, as it is in the footage.',
    dimensions: [
      ['Length × width', '9–19 × 4–9 µm, motile cells of this species', 'species'],
      ['In genotype III cultures', '15–22 × 5–9 µm', 'species'],
      ['Volume', '130.5 ± 8.2 µm³, three FIB-SEM reconstructions of strain FR-21', 'species'],
      ['Drawn', '14.4 × 5.0 µm — the footage’s proportions at the measured volume', 'species'],
      ['Shape', 'oval to pyriform; truncated in front, pointed behind', 'species'],
      ['Posterior projection', '“a distinctive projecting structure” — its nature is not known', 'species'],
      ['Compression', 'dorsoventral, in the sister species', 'model'],
      ['Degree of compression', 'not measured — drawn at 0.8 of the width', 'unverified'],
      ['Culture density', 'about 10⁵ cells/mL in exponential growth', 'species'],
      ['Plane of focus', 'a micrometre beyond the cell’s midplane, as in the footage', 'unverified'],
    ],
    sources: ['r60', 'r53', 'r51', 'r56', 'r52'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 58 },
  },

  nitroplast: {
    view3d: 'filament',
    name: 'Nitroplast',
    latin: 'Candidatus Atelocyanobacterium thalassa · UCYN-A2',
    confidence: 'species',
    what: 'A cyanobacterium that has become part of the cell. It divides when the cell divides, one to each daughter, and it takes in proteins that the host’s own nucleus encodes — the two things that separate an organelle from a guest — and in 2024 it was recognised as the first organelle in any eukaryote that fixes nitrogen: the nitroplast. It is the round body about three micrometres across at the back of the cell, between the two plastids.',
    role: 'It turns nitrogen gas into ammonia, which no eukaryote can do with its own genes, and it cannot live alone: it has lost photosystem II and the machinery to fix carbon, and runs on sugar from the host’s photosynthesis. The partnership was first found in 2012, in open-ocean plankton, with a smaller relative of this alga as the host; its wall is still a bacterium’s — peptidoglycan and a thick outer membrane — inside two layers the host made. In brightfield it shows because it has a refractive index of its own: a round body with a dark rim and a pale centre, as in the footage. Its size here is the sphere holding the measured 10.2 % of the cell’s volume, and at the footage’s proportions that comes out six tenths of the cell’s width — which is what the footage shows. Two independent measurements, agreeing. Its internal membranes, tens of nanometres thick, are far below what this objective resolves.',
    dimensions: [
      ['Diameter', '2–4 µm, by cryo-electron tomography', 'species'],
      ['Share of the cell', '10.2 ± 0.5 % of its volume, by FIB-SEM', 'species'],
      ['Drawn', '2.9 µm — the sphere of that share; 0.59 of the cell’s width against 0.6 in the footage', 'species'],
      ['Number', 'one; two in a cell about to divide', 'species'],
      ['Position', 'posterior, between the two plastids', 'species'],
      ['Division', 'in step with the host, one to each daughter', 'species'],
      ['Protein import', 'proteins encoded in the host nucleus', 'species'],
      ['Size against the host', 'radius 2.33 ± 0.20 times smaller, conserved across UCYN-A lineages', 'species'],
      ['Plastid to nitroplast volume', 'about 3.2, the same in both life stages', 'species'],
      ['Lost', 'photosystem II, carbon fixation, the TCA cycle', 'species'],
      ['Envelope', 'inner membrane, peptidoglycan, a granular layer, a 12 nm outer membrane — then two host layers', 'species'],
      ['Internal membranes', '~10–160 nm thick; far under this objective’s 0.22 µm', 'species'],
      ['Refractive index', 'not measured — drawn at 1.40, a little under a plastid’s', 'unverified'],
    ],
    sources: ['r54', 'r55', 'r56', 'r51', 'r59'],
    // Aimed at where the nitroplast starts — a third of the way back along a
    // cell that begins front-left. The cell wanders and turns from there, so
    // this is a place to look rather than a lock on it.
    camera: { target: [2.5, 0, 0], dir: VIEW, distance: 32 },
  },

  plastids: {
    view3d: 'filament',
    name: 'Plastids',
    latin: 'plastidia',
    confidence: 'species',
    what: 'Two golden-brown plastids lining the cell nearly from end to end, one down each side, meeting all but along a narrow seam, with the nitroplast between them at the back. Together they are more than a third of the cell, and they carry a pyrenoid.',
    role: 'They are why the cell is golden right across, and why a narrow pale streak runs down its middle when it lies flat: that is the seam between the two plates, where a ray crosses no pigment. A ray grazing the side of the cell runs lengthwise through a plate, so the margin is where the colour is deepest. As the cell revolves the seam swings round with it. Their thickness here is not chosen: it is whatever makes the two of them the measured 35 % of the cell, about four tenths of a micrometre.',
    caveat:
      'The colour is measured off the reference footage against its own empty field, so it carries that camera’s white balance as well as the pigment. And it is only the measurement with the condenser filter set to None: under a Rheinberg filter the cell is seen by two lamps at once, and its colour is no longer a transmittance.',
    dimensions: [
      ['Number', 'two', 'species'],
      ['Position', 'posterior, flanking the nitroplast', 'species'],
      ['Share of the cell', '35 % of its volume, both together', 'species'],
      ['Drawn thickness', '0.4 µm — solved for that share', 'species'],
      ['Pyrenoid', 'present', 'species'],
      ['Arrangement', 'lateroparietal, along the cell (sister species)', 'model'],
      ['Colour', 'golden-brown (sister species)', 'model'],
      ['Refractive droplets', 'numerous (sister species); one or two show in the footage', 'model'],
      ['How far round they reach', 'to a narrow seam, as the footage’s pale axial streak shows', 'unverified'],
      ['Colour on screen', 'measured off the footage — 0.96 / 0.90 / 0.62 of the light at one µm of plate', 'unverified'],
    ],
    sources: ['r51', 'r56', 'r57', 'r52'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 34 },
  },

  flagella: {
    view3d: 'filament',
    name: 'Flagella',
    latin: 'flagella',
    confidence: 'species',
    what: 'Two flagella of equal length, arising together at the front of the cell and bending back along it, smooth and beating alike.',
    role: 'In the footage they are not a blur but two slow curves, one arcing out and back above the cell and one looping below it, with a wave running down them — which is how they are drawn. How fast this species swims has not been published; the cell in the footage holds station, drifting a micrometre a second against the debris and revolving slowly about its long axis, which is the one thing the original description says about its movement. Each flagellum is a few tenths of a micrometre thick, under the resolution limit, so it shows as a faint line with a bright core and dark flanks where it is a little out of focus, and nearly vanishes where it is in focus.',
    dimensions: [
      ['Number', 'two, of equal length', 'species'],
      ['Insertion', 'at the anterior end, with the haptonema', 'species'],
      ['Length', '8–20 µm in the sister species; drawn 13–18 µm, about the cell’s length as in the footage', 'model'],
      ['Surface and beat', 'smooth; homodynamic', 'model'],
      ['Movement', 'the cell revolves slowly about its long axis', 'model'],
      ['Swimming speed', 'not published for this species', 'unverified'],
      ['Drawn beat', 'a slow wave, under once a second, matched to the footage', 'unverified'],
    ],
    sources: ['r51', 'r60', 'r52'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 60 },
  },

  haptonema: {
    view3d: 'filament',
    name: 'Haptonema',
    latin: 'haptonema',
    confidence: 'species',
    what: 'A third appendage between the two flagella, and the one that gives the haptophytes their name. In this species it is swollen at its base and has not been seen to coil; in the sister species it is a few micrometres long, shorter than the flagella.',
    role: 'What it does for this species is not known. The cell does eat — in culture it takes six or seven bacteria an hour, and does so at night — but how it takes them has not been watched, and the card leaves that open rather than borrowing an answer from another genus.',
    dimensions: [
      ['Base', 'swollen', 'species'],
      ['Coiling', 'not observed', 'species'],
      ['Length', '2.5–4.5 µm in the sister species', 'model'],
      ['Feeding', 'bacteria, 6–7 per cell per hour, by night', 'species'],
      ['Its part in feeding', 'not observed', 'unverified'],
    ],
    sources: ['r51', 'r52', 'r58'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 32 },
  },

  scales: {
    view3d: 'filament',
    name: 'Scales and spines',
    latin: 'squamae',
    confidence: 'species',
    what: 'The cell is covered in thin oval plates of organic material, of three kinds and in several layers, and carries three to six long spine-like scales at its two ends. The spines are the straight rods that run ahead of the cell in the footage, in a bundle of two or three.',
    role: 'The plates are a few micrometres across and are the cell’s whole covering. They are not drawn: thin organic plates of nearly the medium’s refractive index do not show individually in brightfield, and a layer of them shows, if at all, as part of the cell’s outline. The spines are drawn, as the rigid, straight, faintly bright rods the footage shows.',
    dimensions: [
      ['Plate scales', 'three kinds, oval, in several layers', 'species'],
      ['Largest plates', '1.6–2.9 × 0.7–2.0 µm, rimmed', 'species'],
      ['Smaller plates', '0.9–2.4 × 0.6–2.0 µm', 'species'],
      ['Spine-like scales', '3–6, at the front and back', 'species'],
      ['Spine length', '6.4–22.5 µm', 'species'],
      ['Spine shaft', 'cross-banded, with a spoon-shaped base (sister species)', 'model'],
      ['Drawn', 'the spines only — the plates would not show', 'unverified'],
    ],
    sources: ['r51', 'r60', 'r52'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 70 },
  },

  diel: {
    view3d: 'filament',
    name: 'Day and night',
    latin: 'rhythmus diurnus',
    confidence: 'species',
    what: 'The cell keeps a day. In the light its plastids photosynthesise and its nitroplast fixes nitrogen — only in the light, which suggests the nitroplast runs on carbon from that photosynthesis. In the dark the cell eats bacteria and divides.',
    role: 'The nitroplast’s boundary changes with the hour. At night it is sealed inside the two layers the host wraps round it; by day those layers open in places and the space around it fills with small vesicles that look as though they come from its own outer membrane — the organelle opening for exchange while it works. That account is from a 2026 preprint and has not yet been through peer review, and the card says so. What is on the stage is a moment, not a day: the view does not run the clock.',
    dimensions: [
      ['Nitrogen fixation', 'by day only, from shortly after dawn', 'species'],
      ['Grazing', 'by night — about 8 bacteria per cell per hour; none measurable by day', 'species'],
      ['Cell division', 'mostly at night', 'species'],
      ['Nitroplast envelope', 'host layers intact at night, discontinuous by day, with vesicles', 'species'],
      ['Culture conditions', '12 h light : 12 h dark, 18 °C', 'species'],
      ['Status of the envelope finding', 'a 2026 preprint, not yet peer reviewed', 'unverified'],
    ],
    sources: ['r56', 'r58'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 90 },
  },

  lifeCycle: {
    view3d: 'filament',
    name: 'Two stages, several species',
    latin: 'cyclus vitae',
    confidence: 'species',
    what: 'The species has two lives. One is a non-motile cell about fifteen micrometres across inside a dodecahedron of twelve five-sided calcite plates — the pentaliths, which have been settling on the sea floor since the Cretaceous. The other is the scaly flagellate on this stage, which was described as a species of its own, Chrysochromulina parkeae, in 1972.',
    role: 'DNA joined the two: the flagellate’s 18S sequence is all but identical to the calcified cell’s, and both carry the same cyanobacterium. And the name turned out to cover several species, separable by the size of their plates and by their genes; in 2026 the complex was divided formally. The form in the footage — genotype III — keeps the name B. bigelowii. The large form took the name parkeae, so the 1972 description of the flagellate now belongs to its sister species, which is why its numbers are at the second tier on these cards. Not every culture keeps its nitroplast, either: one genotype III strain lost it in culture.',
    dimensions: [
      ['Calcified stage', 'twelve pentaliths in a dodecahedron; cell about 15 µm', 'species'],
      ['Pentaliths', '8–10.5 µm across in this species', 'species'],
      ['Calcified cell', '570 µm³, four plastids, two nitroplasts — cells from the sea, species within the complex not determined', 'model'],
      ['Motile stage', 'this one — once named Chrysochromulina parkeae', 'species'],
      ['Evidence', '18S rDNA 99.89 % similar; the same endosymbiont', 'species'],
      ['The complex', 'B. bigelowii (genotype III), B. parkeae (IV, V), B. okadae (I, II), and a small form', 'species'],
      ['Nitroplast in culture', 'lost by one genotype III strain; absent in a genotype IV strain', 'species'],
      ['Fossil record', 'back to about 100 million years (late Cretaceous)', 'species'],
    ],
    sources: ['r57', 'r53', 'r60', 'r56', 'r51'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 96 },
  },
}
