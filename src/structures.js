import {
  CELL_STORAGE,
  CUTAWAY,
  FLOOR_NM,
  HELIX_SPECIES_RANGE,
  SPECIES_HELIX,
  helixPoint,
  trichomeHelix,
} from './science.js'
import {
  AEROTOPES,
  CARBOXYSOME_BODIES,
  ENVELOPE_STEP,
  LIPID_BODIES,
  POLYPHOSPHATE_BODIES,
  cyanophycinDrawn,
  envelopeTread,
  polyglucanShown,
} from './sites.js'

const START = CUTAWAY.keptStart
const KEPT = CUTAWAY.kept

// Content layer for the info panel — derived from the Anatomical Bill of Materials
// (docs/distinta-anatomica-spirulina.md, v1.1). Confidence tiers are carried through
// to the UI so the viewer always knows what was measured on Spirulina itself.

export const CONFIDENCE = {
  species: { label: 'Measured in Spirulina', tone: 'species' },
  model: { label: 'From model cyanobacteria', tone: 'model' },
  unverified: { label: 'Not yet established', tone: 'unverified' },
}

export const SOURCES = {
  r1: {
    text: 'Nowicka-Krawczyk et al. (2019) Sci Rep 9:694',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6345927/',
  },
  r4: {
    text: 'van Eykelenburg (1977) Antonie van Leeuwenhoek 43:89–99',
    url: 'https://doi.org/10.1007/BF00395664',
  },
  r5: {
    text: 'van Eykelenburg (1979) Antonie van Leeuwenhoek 45:369–390',
    url: 'https://doi.org/10.1007/BF00443277',
  },
  r6: {
    text: 'Ciferri (1983) Microbiol Rev 47:551–578',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC283708/',
  },
  r8: {
    text: 'van Eykelenburg (1980) PhD thesis, TU Delft',
    url: 'https://repository.tudelft.nl/file/File_202ee8be-75f1-4211-bfad-f40c8d539d0d',
  },
  r9: {
    text: 'Mühling et al. (2003) J Phycol 39:360–367',
    url: 'https://doi.org/10.1046/j.1529-8817.2003.01246.x',
  },
  r10: {
    text: 'Fujisawa et al. (2010) DNA Res 17:85–103',
    url: 'https://doi.org/10.1093/dnares/dsq004',
  },
  r12: {
    text: 'Hoiczyk & Baumeister (1998) Curr Biol 8:1161–1168',
    url: 'https://www.sciencedirect.com/science/article/pii/S0960982207004873',
  },
  r14: {
    text: 'Weiss et al. (2019) Cell 178:374–384',
    url: 'https://doi.org/10.1016/j.cell.2019.05.055',
  },
  r16: {
    text: 'Mullineaux (2014) BBA Bioenergetics 1837:503–511',
    url: 'https://www.sciencedirect.com/science/article/pii/S0005272813002119',
  },
  r17: {
    text: 'Light regulation of phycobilisomes in S. platensis C1 (1999) Plant Cell Physiol 40:1194',
    url: 'https://academic.oup.com/pcp/article-abstract/40/12/1194/1911115',
  },
  r18: {
    text: 'Phycocyanin production in A. platensis (2021) Bioresour Technol',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S096085242101419X',
  },
  r19: {
    text: 'Wang et al. (2001) Acta Cryst D 57:784–792 — PDB 1GH0',
    url: 'https://www.rcsb.org/structure/1GH0',
  },
  r22: {
    text: 'Kerfeld et al. (2003) Structure 11:55–65 — OCP from A. maxima, PDB 1M98',
    url: 'https://doi.org/10.1016/S0969-2126(02)00936-X',
  },
  r25: {
    text: 'Rae et al. (2013) Microbiol Mol Biol Rev 77:357–379',
    url: 'https://journals.asm.org/doi/10.1128/mmbr.00061-12',
  },
  r27: {
    text: 'Morphology and growth of A. platensis (2021) Life 11:536',
    url: 'https://doi.org/10.3390/life11060536',
  },
  r29: {
    text: 'Helicoid morphology and temperature compensation (2024) Phycology 4:6',
    url: 'https://doi.org/10.3390/phycology4010006',
  },
  r32: {
    text: 'Carbohydrate storage granules in Synechocystis (2015) J Bacteriol',
    url: 'https://journals.asm.org/doi/10.1128/jb.00830-15',
  },
  r33: {
    text: 'Simon (1971) PNAS 68:265–267 — cyanophycin composition',
    url: 'https://www.researchgate.net/publication/16430706',
  },
  r34: {
    text: 'Biogenic polyphosphate in Synechococcus PCC 7002 (2018)',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6163655/',
  },
  r35: {
    text: 'Compacted DNA by cryo-electron tomography (2016) Sci Rep 6:34934',
    url: 'https://doi.org/10.1038/srep34934',
  },
  r36: {
    text: 'Campbell et al. (1982) J Bacteriol 149:361–363 — PHB in S. platensis',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC216630/',
  },
  r38: {
    text: 'Structural biology of microbial gas vesicles (2024) Biochem Soc Trans 52:205',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10903477/',
  },
  r40: {
    text: 'Griese et al. (2011) FEMS Microbiol Lett 323:124–131 — ploidy',
    url: 'https://academic.oup.com/femsle/article/323/2/124/476031',
  },
  r24: {
    text: 'Low-temperature morphology and ultrastructure of Arthrospira platensis, Erdos Plateau — Polish Journal of Environmental Studies',
    url: 'https://www.pjoes.com/Low-Temperature-Morphology-and-Ultrastructure-nof-Arthrospira-platensis-Collected,187141,0,2.html',
  },
  r37: {
    text: 'Poly-β-hydroxybutyrate accumulation in Nostoc muscorum and Spirulina platensis under phosphate limitation (2005) J Plant Physiol',
    url: 'https://www.researchgate.net/publication/7348236',
  },
  // --- Chlorella ---------------------------------------------------------
  // The taxonomic revision that sorted the genus out, and the source of the
  // emended generic diagnosis the coccoid field is drawn to. Its account of why
  // morphology failed here — "the limited number of morphological characters
  // and small dimensions of vegetative cells" — is why this atlas draws the two
  // Chlorella species alike and says so.
  r44: {
    text: 'Bock, Krienitz & Pröschold (2011) Fottea 11:293–312 — “Taxonomic reassessment of the genus Chlorella (Trebouxiophyceae) using molecular signatures (barcodes), including description of seven new species”',
    url: 'https://doi.org/10.5507/fot.2011.028',
  },
  r45: {
    text: 'Safi, Zebib, Merah, Pontalier & Vaca-Garcia (2014) Renew Sustain Energy Rev 35:265–278 — “Morphology, composition, production, processing and applications of Chlorella vulgaris: A review”',
    url: 'https://doi.org/10.1016/j.rser.2014.04.007',
  },
  r46: {
    text: 'Lizzul, Lekuona-Amundarain, Purton & Campos (2018) Biology 7:25 — “Characterization of Chlorella sorokiniana, UTEX 1230”',
    url: 'https://doi.org/10.3390/biology7020025',
  },
  r47: {
    text: 'Krivina & Temraleeva (2020) Microbiology 89:720–732 — “Identification Problems and Cryptic Diversity of Chlorella-Clade Microalgae (Chlorophyta)”',
    url: 'https://doi.org/10.1134/S0026261720060107',
  },
  r43: {
    text: 'Deschoenmaeker, Facchini, Cabrera Pino, Bayon-Vicente, Sachdeva, Flammang & Wattiez (2016) J Struct Biol 196:385–393 — “Nitrogen depletion in Arthrospira sp. PCC 8005, an ultrastructural point of view”',
    url: 'https://doi.org/10.1016/j.jsb.2016.08.007',
  },
  r42: {
    text: 'van Eykelenburg (1980) Antonie van Leeuwenhoek 46:113–127',
    url: 'https://doi.org/10.1007/BF00444067',
  },
}

// Most viewpoints are approached from the same place: out in the open wedge,
// slightly above, which is where the cutaway leaves room. The envelope is the
// exception. The sheath and the membrane are read square onto the far edge of
// the wedge, where they stand as bands of a stated thickness; the wall is read
// at the near edge, where the five layers are stepped back one behind the
// other, because a thickness is all a band can state and the four layers differ
// in what they are made of.
// Where a body actually is, rather than where it was when somebody last typed a
// coordinate in. Every one of these sets is placed by a seeded rule — an angle
// rolled inside the kept sector, a radius inside a band, a diameter scaled — so
// a hand-written anchor is only right until the rule is next touched, and then
// it is silently wrong. It had gone wrong for all four of them: the leader for
// the lipid bodies was pointing at a micrometre of empty cytoplasm, the
// carboxysomes' at 810 nm of it, the polyphosphate's at 615, the aerotopes' at
// 756. On a cell eight micrometres across those are not near misses.
//
// The biggest of a set is the one to point at: it is the one that survives the
// thinning rules at the reference temperature, and it is the easiest of them to
// see. `at` returns the top of it, which is where a leader should land on a
// sphere — the centre is inside the body and the dot would sit on nothing.
const biggest = (bodies) => bodies.reduce((a, b) => (b.d > a.d ? b : a))

const at = (body) => ({
  angle: (Math.atan2(body.z, body.x) + Math.PI * 2) % (Math.PI * 2),
  radius: Math.hypot(body.x, body.z),
  y: body.y + body.d / 2,
  // What the camera should be looking at: the body itself, not its top. Taken
  // from the same object in the same place, so the two cannot drift apart the
  // way they had.
  target: [body.x, body.y, body.z],
})

const CYANOPHYCIN_AT = at(biggest(cyanophycinDrawn(CELL_STORAGE.cyanophycin.maxDiameterNm)))
const CARBOXYSOME_AT = at(biggest(CARBOXYSOME_BODIES))
const POLYPHOSPHATE_AT = at(biggest(POLYPHOSPHATE_BODIES))
const LIPID_AT = at(biggest(LIPID_BODIES))
const AEROTOPE_AT = at(biggest(AEROTOPES))
// The rods are all one size, so `biggest` decides nothing among them; sites.js
// picks the one against a cut face instead, for the reason the cyanophycin
// granules are placed against one.
const POLYGLUCAN_AT = at(polyglucanShown(CELL_STORAGE.polyglucan.maxDiameterNm ?? CELL_STORAGE.cyanophycin.maxDiameterNm))

export const VIEW_DIR = [0.512, 0.342, 0.788]
const CUT_FACE_DIR = [0.18, 0.32, 0.93]
// The staircase at the leading edge of the cutaway, and where it has to be read
// from. Out along its own radius so the treads are not edge-on, lifted so they
// are looked down into rather than across, and leaned back towards the open
// wedge so the cut faces between them are in view as well — which lands the
// camera just inside the wedge, outside the cell, in front of the steps.
const STEP_COS = Math.cos(ENVELOPE_STEP.mid)
const STEP_SIN = Math.sin(ENVELOPE_STEP.mid)
const STEP_AT = [3970 * STEP_COS, 300, 3970 * STEP_SIN]
const STEP_DIR = [
  0.72 * STEP_COS + 0.46 * STEP_SIN,
  0.50,
  0.72 * STEP_SIN - 0.46 * STEP_COS,
]
// Looking down on the lamella crests is the one view that shows the whirls:
// the dislocated fingerprint pattern only exists in plan.
const PLAN_DIR = [0.34, 0.86, 0.38]

// view: where the camera flies when the structure is selected.
// target in scene units (µm in the filament view, nm in the cell view).
export const STRUCTURES = {
  // ─── Filament view ───────────────────────────────────────────────
  trichome: {
    view3d: 'filament',
    name: 'Helical trichome',
    latin: 'trichoma',
    confidence: 'species',
    what: 'An unbranched file of cylindrical cells wound into a left-handed helix. This is the individual you see under a light microscope: no branching and no flagellum anywhere on it, and no mucilage sheath of the kind that would be visible down a lens — though the electron microscope does find a thin extracellular layer, about 50 nm of polymeric substances, against the wall.',
    role: 'The helix is not decoration. It behaves like a spring: it stores elastic energy, keeps the filament suspended in the water column, and its geometry sets how the cell glides. What is drawn here is the middle of the range the species occupies, not a culture. Only one strain has ever had its helix measured against growth temperature, and it coils more openly than the species allows — building the filament from it would have made this a portrait of that culture rather than of Spirulina.',
    dimensions: [
      ['Filament length', '100–500 µm (7-day culture)', 'species'],
      [
        'Helix pitch',
        `${SPECIES_HELIX.pitchUm} µm — midpoint of the species range, ${HELIX_SPECIES_RANGE.pitchUm[0]}–${HELIX_SPECIES_RANGE.pitchUm[1]} µm`,
        'species',
      ],
      [
        'Helix diameter',
        `${SPECIES_HELIX.diameterUm} µm — midpoint of ${HELIX_SPECIES_RANGE.diameterUm[0]}–${HELIX_SPECIES_RANGE.diameterUm[1]} µm`,
        'species',
      ],
      ['Handedness', 'left-handed in 29 of 36 clonal strains', 'species'],
      [
        'Helix against temperature',
        'one culture only (Lake Nakuru): pitch 113 → 152 µm and Ø 36 → 69 µm from 30 down to 15 °C — not modelled here',
        'species',
      ],
      ['EPS layer at the wall', '≈50 nm, thickening under starvation', 'species'],
    ],
    sources: ['r5', 'r8', 'r9', 'r27', 'r43'],
    camera: { target: [0, 0, 0], dir: VIEW_DIR, distance: 320 },
  },
  calyptra: {
    view3d: 'filament',
    name: 'Calyptra',
    latin: 'calyptra',
    confidence: 'species',
    what: 'The outer wall of the apical cell, thickened into a cap over its dome. In the light microscope it is the one bright, refractile spot on a filament otherwise full of pigment — the wall carries no phycocyanin, so it takes far less out of the beam than the cytoplasm beneath it.',
    role: 'A diagnostic character, not an organelle: Nowicka-Krawczyk uses the calyptra and the thickened apical wall to separate Limnospira from Arthrospira proper, whose type species A. jenneri lacks one. That only the two original ends carry it here is a convention of this model rather than something the paper establishes — no maturation time course was found in it, and its figures settle morphology, not how fast a new end acquires a cap.',
    dimensions: [
      ['Where', 'the two apical cells, over the dome', 'species'],
      ['Appearance', 'rounded or subcapitate, thickened outer wall', 'species'],
      ['Not universal', 'some apical cells are rounded without one', 'species'],
    ],
    sources: ['r1'],
    // Where the apical cell is depends on the helix, so this is a function
    // rather than a remembered coordinate — the fault every hand-typed anchor
    // in this file has had. It is a function of the *species* helix now; the
    // temperature slider it was originally written for is gone.
    camera: (helix) => {
      // Aimed at the apical cell itself, not at the axis beside it. In this
      // view the focal plane is a real objective's — a couple of micrometres
      // thick — and it sits at whatever the camera is aimed at, so an axis
      // target leaves the one thing being looked at dissolved. Three helix
      // diameters back is then far enough that the glide, turning the tip
      // round that axis, cannot carry it out of frame; it does carry it out of
      // focus and back, which is what watching a wet mount is like.
      const [x, y, z] = helixPoint(1, trichomeHelix(helix))
      return { target: [x, y, z], dir: VIEW_DIR, distance: helix.diameterUm * 3 }
    },
  },
  cellUnit: {
    view3d: 'filament',
    name: 'Vegetative cell',
    latin: 'cellula',
    confidence: 'species',
    what: 'Each disc in the stack is one cell, always wider than it is long, joined to its neighbours by a cross-wall that is visible even in the light microscope — one of the characters that separates Arthrospira and Limnospira from true Spirulina.',
    role: 'The trichome grows by intercalary division: cells divide in a single plane anywhere along the filament, so the whole thread lengthens rather than a tip extending.',
    dimensions: [
      ['Diameter', '6–12 µm (≈10 µm in the Lake Nakuru strain)', 'species'],
      ['Length', '2.6–5.6 µm — from the amended description of A. jenneri; the Limnospira description says only shorter than wide', 'model'],
      // Derived, not measured: it assumes the 480 µm is the length of the cell
      // file rather than the apparent length of the coil, and the sources do
      // not say which they mean.
      ['Cells per filament', '≈110, if the 480 µm is measured along the filament', 'unverified'],
    ],
    sources: ['r1', 'r6', 'r8'],
    camera: { target: [0, 0, 0], dir: VIEW_DIR, distance: 120 },
  },
  gliding: {
    view3d: 'filament',
    name: 'Gliding motility',
    latin: 'motus repens',
    confidence: 'species',
    what: 'The filament glides across surfaces while rotating about its own axis — a screw-like motion that reverses direction periodically. No flagella are involved anywhere in the process.',
    role: 'Mucus is secreted through rows of pores set beside the cross-walls; helical surface fibrils act as the track that converts secretion into rotation. The pore rows are documented in S. platensis itself; the ~15 nm pore diameter and the propulsion mechanism come from Phormidium.',
    dimensions: [
      ['Pore rows beside the septa', 'seen directly in S. platensis', 'species'],
      ['Pore diameter', '≈15 nm — measured in Phormidium', 'model'],
      ['Propulsion mechanism', 'mucus secretion through the pore complex', 'model'],
      ['Surface fibrils', '8–10 nm, right-handed helix (layer L-III)', 'species'],
      ['Temperature response', 'helicoid shape compensates gliding speed', 'species'],
      ['Gliding speed', 'measured in NIES-39 against temperature and filament length (Phycology 2024) — the figure is not extracted here', 'species'],
    ],
    sources: ['r4', 'r8', 'r12', 'r29'],
    camera: { target: [0, 0, 0], dir: VIEW_DIR, distance: 200 },
  },

  reproduction: {
    view3d: 'filament',
    name: 'Reproduction by fragmentation',
    latin: 'fragmentatio',
    confidence: 'species',
    what: 'No spores, no heterocysts, no akinetes — Arthrospira does none of the things a filamentous cyanobacterium is often assumed to do. It multiplies by breaking. Certain intercalary cells die on purpose: they go biconcave, lose their contents and fill with mucilage. These are necridia, and the trichome parts at them.',
    role: 'What comes away is a hormogonium — a short motile chain that glides off, lengthens by intercalary division and rebuilds the helix. It is why a culture of this organism is a population of filaments of every length, and why there is no life stage that survives drying: nothing here is a resting cell.',
    dimensions: [
      ['Mechanism', 'programmed death of intercalary cells, then breakage', 'species'],
      ['Spores, heterocysts, akinetes', 'none — the genome carries no nitrogenase either', 'species'],
      ['Hormogonium length', '5–25 cells — a figure generic to the group', 'model'],
      ['Hormogonium length in Arthrospira', 'never measured', 'unverified'],
      ['New ends', 'rounded, not torn', 'species'],
    ],
    sources: ['r4', 'r6', 'r10'],
    camera: { target: [0, 60, 0], dir: VIEW_DIR, distance: 420 },
  },

  // ─── Cell view ───────────────────────────────────────────────────
  sheath: {
    view3d: 'cell',
    name: 'Extracellular sheath (EPS)',
    latin: 'vagina gelatinosa',
    confidence: 'species',
    what: 'A coat of hydrated polysaccharide the cell secretes and then sits inside — about 50 nm of it in ordinary growth. It is not a fifth layer of the wall: nothing anchors it, its thickness varies from place to place along the same filament, and how much of it there is depends on what the culture has been fed.',
    role: 'Carbon with nowhere to go. When nitrogen runs out the cell keeps fixing carbon and has nothing to build protein with, so it routes the surplus outside as exopolysaccharide and the sheath thickens — 50 nm to 50–200 nm over a few days of starvation. By ten days it has resolved into two layers: a continuous film against the wall, and a looser fibrillar one outside that which reaches 300 nm on some cells and micrometres in places. It is also what makes the biomass slimy to handle and the filaments stick to each other and to surfaces.',
    dimensions: [
      ['Thickness, fed culture', '≈50 nm — measured in Arthrospira sp. PCC 8005', 'species'],
      ['Under nitrogen starvation', '50–200 nm after several days', 'species'],
      ['Continuous layer (cEPS)', 'a film against the wall, resolved by 240 h', 'species'],
      ['Fibrillar layer (fEPS)', 'to 300 nm on some cells, micrometres in places', 'species'],
      ['External fibrils', '≈3 nm, in the Nakuru strain at high temperature', 'species'],
      // The reason the taxonomic literature and the electron microscopy appear
      // to contradict each other, which is worth stating rather than resolving
      // silently in favour of one of them.
      ['Visible down a light microscope', 'no — the genus is described as sheathless', 'species'],
      ['What is drawn here', 'a coat varying from about 18 to 300 nm, with roughly a sixth of it over 100: the fed thickness carrying the fibrillar tail measured after 240 h of starvation, so the surface is a composite of two conditions rather than one culture', 'model'],
      ['Same material as the gliding mucus', 'not established', 'unverified'],
      ['What is drawn here', 'the fed thickness; the swelling is a fact on this card, not a control', 'species'],
    ],
    sources: ['r43', 'r1', 'r5', 'r8', 'r27'],
    // 4040, not 4180. The coat is drawn at the fed thickness — 50 nm on a wall
    // that ends at 4000 — so an anchor at 4180 was 130 nm out in open water.
    // `fibrillarMaxNm` is the starved figure and is on the card, not in the
    // scene; reading the scene off a number the scene does not use is how a
    // leader ends up pointing at nothing.
    label: { text: 'EPS sheath', angle: START + 1.35, radius: 4040, y: 1720, offset: [-118, -52], survey: true },
    // Square onto the cut face, like the wall — this layer only states its
    // thickness in section, and from anywhere else it is an edge. Framed to
    // hold the wall as well: 50 nm of gel on its own is a pale band filling the
    // screen, and the fact worth seeing is that it sits on top of something
    // built, is thinner than it, and does not keep to a thickness the way the
    // four layers under it do.
    camera: { target: [4020, 300, 42], dir: CUT_FACE_DIR, distance: 820 },
  },
  wall: {
    view3d: 'cell',
    name: 'Four-layered cell wall',
    latin: 'paries cellularis',
    confidence: 'species',
    what: 'A thin Gram-negative-type wall resolved into four layers, L-I to L-IV, each 10–15 nm thick — about 60 nm in total, which is under 1 % of the cell diameter. L-I is fibrillar and probably β-1,2-glucan — the 1978 spectrum resembles one and the polymer is thought to originate in the inner fibrillar layer, both stated with reservations — L-II is the rigid peptidoglycan, L-III carries right-handed surface fibrils, and L-IV is built from linear elements running parallel to the filament axis.',
    role: 'The thinness matters commercially: unlike the cellulose wall of a green alga, this wall is easily digested, which is why Spirulina biomass needs no cell disruption to be nutritionally available.',
    dimensions: [
      ['L-I (innermost)', '10–15 nm — fibrillar, β-1,2-glucan', 'species'],
      ['L-II', '10–15 nm — peptidoglycan, continues into the septa', 'species'],
      ['L-III', '10–15 nm — fibrils 8–10 nm, right-handed', 'species'],
      ['L-IV (outermost)', '10–15 nm — linear elements 12–15 nm', 'species'],
      ['Total thickness', 'up to ~60 nm; each layer is drawn at the top of its range', 'species'],
      ['L-IV read as the Gram-negative outer membrane', 'an interpretation, not a measurement', 'model'],
      ['What is drawn here', 'the envelope stepped open at the cut — the membrane proud of it, then one tread per layer outwards', 'model'],
    ],
    sources: ['r4', 'r8'],
    // On the staircase, not on the far cut face. It sat at the opposite edge of
    // the sector from the viewpoint that opens when you click it, so selecting
    // the wall flew the camera 229° away from its own leader line — the label
    // and the camera describing two different places at once. The middle tread
    // is L-II, and the anchor rides it: read from `envelopeTread`, so it cannot
    // come adrift from the steps the way a typed angle did.
    label: {
      text: 'Cell wall · 4 layers',
      angle: envelopeTread(2),
      radius: 3970,
      y: 1400,
      // Out to the right and well up. The anchor has moved to the near edge of
      // the sector, which on screen is the left of the cell, and a pill offset
      // leftwards from there goes behind the panel.
      offset: [56, -150],
      survey: true,
    },
    // Onto the staircase rather than onto the flush section. The flush section
    // is still there — it is the far edge of the wedge, and the sheath's and the
    // membrane's viewpoints frame it — but four parallel bands 15 nm wide can
    // only ever state that there are four of them. Each of these four is a
    // different polymer with a different grain, and a grain lives on a face,
    // not on an edge.
    camera: { target: STEP_AT, dir: STEP_DIR, distance: 5000 },
  },
  membrane: {
    view3d: 'cell',
    name: 'Plasma membrane',
    latin: 'membrana plasmatica',
    confidence: 'model',
    what: 'The lipid bilayer immediately beneath layer L-I. In cyanobacteria it is a working bioenergetic membrane in its own right, not merely a boundary.',
    role: 'It carries part of the respiratory electron transport chain and the transporters that concentrate bicarbonate — the first step of the carbon-concentrating mechanism that feeds the carboxysomes.',
    dimensions: [
      ['Thickness', '≈7–8 nm — a generic bilayer value', 'model'],
      ['Species-specific measurement', 'not reported', 'unverified'],
      ['Respiratory chain on this membrane', 'shown in model cyanobacteria', 'model'],
    ],
    sources: ['r8', 'r16'],
    label: { text: 'Plasma membrane', angle: START + KEPT - 0.03, radius: 3930, y: 200, offset: [104, 34] },
    camera: { target: [3930, 200, 40], dir: CUT_FACE_DIR, distance: 470 },
  },
  thylakoids: {
    view3d: 'cell',
    name: 'Thylakoids',
    latin: 'thylacoidea',
    confidence: 'species',
    what: 'Flattened membrane sacs lying free in the cytoplasm — there is no chloroplast here: a cyanobacterium is the ancestor of the chloroplast, not a cell that owns one. In Limnospira the arrangement is irregular, with whirl-like sections across the middle of the cell; in true Arthrospira it is radial instead.',
    role: 'One membrane, two jobs. Photosynthetic and respiratory electron transport share the same lipid bilayer and some of the same carriers, so the cell photosynthesises by day and respires around the clock in the same compartment.',
    dimensions: [
      ['Spacing between lamellae', '≈56 nm — measured at 38.5 °C, 1 klux', 'species'],
      ['Dependence of that spacing on temperature', 'never measured', 'unverified'],
      ['Arrangement', 'irregular, whirl-like in the central region', 'species'],
      ['Pigment', 'all chlorophyll a sits in these membranes', 'species'],
      ['Photosynthesis and respiration sharing one membrane', 'shown in model cyanobacteria', 'model'],
    ],
    sources: ['r1', 'r5', 'r8', 'r16'],
    label: { text: 'Thylakoids', angle: START + 1.75, radius: 3250, y: 1500, offset: [-16, -78], survey: true },
    // Onto the crests, not into the stack. Aimed at mid-height the camera sat
    // inside the band and the near membranes filled the frame with their faces
    // — a good picture of a lamella and no picture at all of the arrangement,
    // which is the one thing this card is about. The lamellae average 2511 nm
    // tall, so the crests are around y = 1250, and from above them at 6800 the
    // frame holds about 4.4 µm: a whole whirl and the families it breaks
    // against.
    camera: { target: [-1194, 1250, 2532], dir: PLAN_DIR, distance: 6800 },
  },
  phycobilisomes: {
    view3d: 'cell',
    name: 'Phycobilisomes',
    latin: 'phycobilisomata',
    confidence: 'species',
    what: 'Fan-shaped antenna complexes docked on the cytoplasmic face of the thylakoids. In S. platensis C1 each one is a three-cylinder allophycocyanin core with six radiating rods of C-phycocyanin — the blue pigment that gives Spirulina its colour and its commercial value.',
    role: 'They harvest light that chlorophyll absorbs poorly and funnel the energy downhill: phycocyanin (~620 nm) → allophycocyanin (~650 nm) → chlorophyll a. Under strong light the Orange Carotenoid Protein switches them off — and the reference OCP structure was solved from Arthrospira maxima itself.',
    dimensions: [
      ['Architecture', 'hemidiscoidal: 3-cylinder APC core + 6 CPC rods', 'species'],
      // The shape drawn here is right; its measurements are not this organism's.
      ['Assembled dimensions', 'no structure solved for Arthrospira — the one drawn here is built to the proportions of related species', 'unverified'],
      ['Occupancy', '≈4.5 % of the interlamellar space', 'species'],
      ['Phycobiliproteins', '15–20 % of dry weight (up to ~24 %)', 'species'],
      ['Atomic structure', 'C-phycocyanin at 2.2 Å — PDB 1GH0 / 1HA7', 'species'],
    ],
    sources: ['r5', 'r8', 'r17', 'r18', 'r19', 'r22'],
    label: { text: 'Phycobilisomes', angle: START + 2.4, radius: 2500, y: 700, offset: [-116, -40] },
    camera: { target: [-1152, 250, 2442], dir: VIEW_DIR, distance: 1100 },
  },
  carboxysomes: {
    view3d: 'cell',
    name: 'Carboxysomes',
    latin: 'corpora polyedra',
    confidence: 'species',
    what: 'Polyhedral protein compartments with no membrane at all — an icosahedral shell of protein tiles packed with Rubisco. In S. platensis they appear with a sharp polygonal profile and a granular interior, sitting in the nucleoid region, and they are present at every temperature and light level tested.',
    role: 'The cell pumps bicarbonate into the cytoplasm; carbonic anhydrase inside the shell converts it to CO₂ right next to Rubisco. The local CO₂ spike suppresses photorespiration and makes carbon fixation far more efficient than in a plant leaf.',
    dimensions: [
      ['Diameter in S. platensis', 'not measured. The ~500 nm this model is drawn near comes from a general description of carboxysomes across cyanobacteria in the same 1980 thesis, not from its Spirulina observations', 'model'],
      ['Typical in cyanobacteria', '100–200 nm (169 ± 12 nm) — the modern consensus', 'model'],
      ['Shell thickness', '3–4 nm', 'model'],
      ['Type', 'β-carboxysome, Rubisco form 1B — inferred from the genome', 'model'],
      ['Number per cell', '2–3 in fed cells and 0–1 after a day of nitrogen starvation, counted in sections of PCC 8005 — section counts, not a whole-cell census. Seven are drawn here, which is a composition rather than a count', 'species'],
    ],
    sources: ['r5', 'r8', 'r25'],
    label: {
      text: 'Carboxysomes',
      angle: CARBOXYSOME_AT.angle,
      radius: CARBOXYSOME_AT.radius,
      y: CARBOXYSOME_AT.y,
      offset: [-108, -66],
      survey: true,
    },
    camera: { target: CARBOXYSOME_AT.target, dir: VIEW_DIR, distance: 4400 },
  },
  gasVesicles: {
    view3d: 'cell',
    name: 'Gas vesicles',
    latin: 'aerotopus',
    confidence: 'species',
    what: 'Hollow protein cylinders with conical ends, gathered into bundles (aerotopes) beside the cross-walls. The wall is protein only — gas-permeable, water-repellent — and in Spirulina they pack hexagonally at a diameter of about 65 nm.',
    role: 'A buoyancy device. They lower the density of the cell so the filament floats up toward the light; collapsing them under pressure makes a culture sink, which is the classic demonstration that this is what they are for.',
    dimensions: [
      ['Diameter in S. platensis', '≈65 nm', 'species'],
      ['Length', 'up to 1000 nm', 'species'],
      ['Rib periodicity', '4.0 nm', 'species'],
      ['Packing', 'dense, hexagonal, near the septa', 'species'],
      ['Presence', 'facultative — lost in long culture', 'species'],
      ['Wall composition', '≈2 nm of GvpA protein — from other cyanobacteria', 'model'],
    ],
    sources: ['r1', 'r5', 'r8', 'r38'],
    label: {
      text: 'Gas vesicles',
      angle: AEROTOPE_AT.angle,
      radius: AEROTOPE_AT.radius,
      y: AEROTOPE_AT.y,
      offset: [118, 6],
      survey: true,
    },
    camera: { target: AEROTOPE_AT.target, dir: VIEW_DIR, distance: 1700 },
  },
  cyanophycin: {
    view3d: 'cell',
    name: 'Cyanophycin granules',
    latin: 'granula cyanophycini',
    confidence: 'species',
    what: 'A nitrogen store characteristic of cyanobacteria: multi-L-arginyl-poly-L-aspartate, a branched polymer built without ribosomes. It is not exclusive to them — native accumulation has since been demonstrated in Acinetobacter — but it is where the polymer was found and where it is the rule. The granules line up along the cross-walls at the cell periphery.',
    role: 'Below about 17 °C growth slows and nitrogen is banked here instead of being spent on protein — granules swell to 2.4 µm and can fill 18 % of the cell volume. Above that threshold they are abruptly replaced by carbon storage.',
    dimensions: [
      ['Below 17 °C', 'up to 2400 nm — 18 % of cell volume at 15.5 °C', 'species'],
      ['Above 17 °C', 'largest granule ≈630 nm', 'species'],
      ['Composition', 'aspartate : arginine 1 : 1 — Simon’s assay, on Anabaena', 'model'],
      ['Position', 'peripheral, aligned along the septa', 'species'],
    ],
    sources: ['r5', 'r8', 'r33', 'r42'],
    label: {
      text: 'Cyanophycin',
      angle: CYANOPHYCIN_AT.angle,
      radius: CYANOPHYCIN_AT.radius,
      y: CYANOPHYCIN_AT.y,
      // Above the granule rather than below it: moving the granule to the cut
      // face, where it can be seen, put it next to the cross-wall's own anchor,
      // and two leader lines dropping to the same corner is one label on top of
      // the other.
      offset: [-96, -52],
      survey: true,
    },
    camera: { target: CYANOPHYCIN_AT.target, dir: VIEW_DIR, distance: 2600 },
  },
  polyglucan: {
    view3d: 'cell',
    name: 'Polyglucan granules',
    latin: 'granula polyglucani',
    confidence: 'species',
    what: 'The carbon store — glycogen-like rods of branched glucose polymer, packed in a hexagonal array in the space between the thylakoids.',
    role: 'Above 17 °C the cell switches abruptly from banking nitrogen to banking carbon, and these rods take over from the cyanophycin granules. They thin out again above 20 °C and under strong light, when the carbon is spent on growth instead.',
    dimensions: [
      ['Diameter', '≈25 nm', 'species'],
      ['Length', 'up to 450 nm', 'species'],
      ['Packing', 'hexagonal array between thylakoids — observed; the rods here are placed individually against the lamellae and are not packed into one', 'model'],
      ['Peak abundance', '17–20 °C, low nitrate', 'species'],
    ],
    sources: ['r5', 'r8', 'r32', 'r42'],
    label: {
      text: 'Polyglucan',
      angle: POLYGLUCAN_AT.angle,
      radius: POLYGLUCAN_AT.radius,
      y: POLYGLUCAN_AT.y,
      offset: [-118, 44],
    },
    camera: { target: POLYGLUCAN_AT.target, dir: VIEW_DIR, distance: 2200 },
  },
  polyphosphate: {
    view3d: 'cell',
    name: 'Polyphosphate bodies',
    latin: 'corpora polyphosphatica',
    confidence: 'model',
    what: 'Dense spherical granules of inorganic polyphosphate — the classic "volutin" of older microscopy. Present in S. platensis; the size range quoted here comes from other cyanobacteria.',
    role: 'The phosphorus bank. In Synechococcus these bodies stay in contact with the DNA and may feed phosphate directly into replication.',
    dimensions: [
      ['Presence in S. platensis', 'confirmed by electron microscopy', 'species'],
      ['Diameter', '200–400 nm — in cyanobacteria generally', 'model'],
      ['Contact with the DNA', 'seen in Synechococcus', 'model'],
    ],
    sources: ['r5', 'r8', 'r34', 'r35'],
    label: {
      text: 'Polyphosphate',
      angle: POLYPHOSPHATE_AT.angle,
      radius: POLYPHOSPHATE_AT.radius,
      y: POLYPHOSPHATE_AT.y,
      offset: [-112, 62],
    },
    camera: { target: POLYPHOSPHATE_AT.target, dir: VIEW_DIR, distance: 3600 },
  },
  lipidBodies: {
    view3d: 'cell',
    name: 'Lipid bodies',
    latin: 'corpora lipidica',
    confidence: 'species',
    what: 'Osmiophilic droplets — dark in electron micrographs — associated with the thylakoid region. The cell is known to accumulate poly-β-hydroxybutyrate, of the same polyester family used to make PHA bioplastics, but whether these droplets are that polymer is not established: the plates label PHAs and lipid inclusions separately.',
    role: 'Energy and carbon reserve. PHB reaches about 6 % of dry weight during exponential growth in S. platensis and increases further under phosphate limitation.',
    dimensions: [
      ['PHB content', 'up to ~6 % of dry weight', 'species'],
      ['Behaviour', 'shrink at −5 °C; accumulate under P limitation', 'species'],
      ['How much of the droplet is PHB', 'not established', 'unverified'],
    ],
    sources: ['r5', 'r8', 'r24', 'r36', 'r37'],
    label: {
      text: 'Lipid bodies',
      angle: LIPID_AT.angle,
      radius: LIPID_AT.radius,
      y: LIPID_AT.y,
      offset: [112, -36],
    },
    camera: { target: LIPID_AT.target, dir: VIEW_DIR, distance: 2600 },
  },
  nucleoid: {
    view3d: 'cell',
    name: 'Nucleoid',
    latin: 'nucleoides',
    confidence: 'species',
    what: 'The DNA of a circular chromosome, unenclosed in the central cytoplasm and threaded between granules and thylakoids. How many copies of it a cell carries is not established here — other cyanobacteria are usually polyploid. There is no nuclear membrane, which is the defining prokaryotic feature and what the cutaway is opened to show.',
    role: 'Because DNA and ribosomes share one compartment, transcription and translation happen simultaneously on the same molecule. The NIES-39 genome holds 6630 protein-coding genes and, notably, no nitrogenase — Spirulina cannot fix nitrogen.',
    dimensions: [
      ['Genome (NIES-39)', '≈6.8 Mb, circular', 'species'],
      ['Protein-coding genes', '6630 · 2 rRNA operons · 40 tRNAs', 'species'],
      ['Ploidy', 'unmeasured in Arthrospira', 'unverified'],
      ['Many chromosome copies per cell', 'the rule in other cyanobacteria', 'model'],
    ],
    sources: ['r10', 'r35', 'r40'],
    label: { text: 'Nucleoid · no membrane', angle: START + 3.7, radius: 800, y: -1250, offset: [-30, 118], survey: true },
    camera: { target: [-380, 0, 380], dir: VIEW_DIR, distance: 6000 },
  },
  ribosomes: {
    view3d: 'cell',
    name: 'Ribosomes',
    latin: 'ribosomata',
    confidence: 'model',
    what: '70S ribosomes — the prokaryotic size class — scattered free through the cytoplasm. Rendered here at exaggerated visibility; at true scale they are barely a pixel beside a carboxysome.',
    role: 'Protein synthesis. Their 70S signature is what antibiotics such as tetracycline recognise, and it is the same class of ribosome found inside chloroplasts, a fossil of the endosymbiotic origin.',
    dimensions: [
      ['Type', '70S — the prokaryotic class', 'model'],
      ['Count per cell', 'not established for Arthrospira', 'unverified'],
    ],
    sources: ['r6', 'r10'],
    label: { text: 'Ribosomes', angle: START + 2.8, radius: 640, y: 1400, offset: [94, -70] },
    camera: { target: [0, 0, 0], dir: VIEW_DIR, distance: 4200 },
  },
  septum: {
    view3d: 'cell',
    name: 'Cross-wall (septum)',
    latin: 'septum transversale',
    confidence: 'species',
    what: 'The partition between neighbouring cells: a three-layered wall, L-I / L-II / L-I, with the peptidoglycan sandwiched in the middle. Rows of pores are frequently visible on both sides of it.',
    role: 'It divides the cells but does not isolate them. In filamentous cyanobacteria the septal peptidoglycan is drilled by nanopores carrying protein channels — septal junctions, a prokaryotic analogue of gap junctions that close under stress. Those junctions are proven in Anabaena and Nostoc. In Spirulina what is on record is rows of pores beside the septa, seen in the historical micrographs and read there as the outlet of the gliding mucus; that those rows are the same structure as Anabaena’s trans-septal nanopores is an inference this model makes, not an observation anyone has published.',
    dimensions: [
      ['Structure', 'L-I / L-II / L-I, three layers', 'species'],
      ['Septal fibrils', '14–15 nm', 'species'],
      ['Rows of pores beside the septum', 'seen directly in S. platensis', 'species'],
      ['Nanopores', '≈20 nm, dozens per septum — Anabaena and Nostoc', 'model'],
      ['The gated protein junction itself', 'never characterised in Spirulina', 'unverified'],
    ],
    sources: ['r4', 'r8', 'r14'],
    label: { text: 'Cross-wall', angle: START + 0.22, radius: 2950, y: FLOOR_NM, offset: [-124, 62], survey: true },
    camera: { target: [-1200, -2100, 2300], dir: VIEW_DIR, distance: 3400 },
  },
}

// Grouped by what the structure is for, not by where it sits — the grouping is
// itself part of what the atlas teaches.
export const GROUPS = {
  filament: [
    { title: 'Whole organism', ids: ['trichome', 'cellUnit', 'calyptra', 'gliding'] },
    { title: 'Life cycle', ids: ['reproduction'] },
  ],
  cell: [
    // First, because it is the first thing you meet coming from outside — and
    // its own group, because it is not part of the envelope. The wall is built
    // and anchored; this is secreted, and how much of it exists depends on the
    // day the culture has had.
    { title: 'Surface & environment', ids: ['sheath'] },
    { title: 'Envelope', ids: ['wall', 'membrane', 'septum'] },
    { title: 'Light harvesting', ids: ['thylakoids', 'phycobilisomes'] },
    { title: 'Carbon fixation', ids: ['carboxysomes'] },
    { title: 'Reserves', ids: ['polyglucan', 'cyanophycin', 'polyphosphate', 'lipidBodies'] },
    { title: 'Buoyancy', ids: ['gasVesicles'] },
    { title: 'Genetic machinery', ids: ['nucleoid', 'ribosomes'] },
  ],
}

export function structuresForView(view) {
  return Object.entries(STRUCTURES)
    .filter(([, s]) => s.view3d === view)
    .map(([id, s]) => ({ id, ...s }))
}

// The in-scene labels: the leader-line annotations drawn on the model itself.
// They live beside each structure's camera viewpoint because they are the same
// kind of fact — where in the cell this thing is — and keeping the two in
// separate files meant two sets of coordinates for the same thirteen objects,
// to be kept in step by hand.
export function labelsForView(view) {
  return Object.entries(STRUCTURES)
    .filter(([, s]) => s.view3d === view && s.label)
    .map(([id, s]) => ({ id, ...s.label }))
}

export function tourOrder(view) {
  return GROUPS[view].flatMap((group) => group.ids)
}
