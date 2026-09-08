// Species-specific measurements for Arthrospira/Limnospira platensis.
// Every value cites its primary source; the full dossier lives in
// docs/distinta-anatomica-spirulina.md (Anatomical Bill of Materials v1.1).
//
// UNITS: the filament view works in micrometres, the cell view in nanometres.

// ── Filament scale (µm) ───────────────────────────────────────────────

// Helix geometry vs growth temperature — van Eykelenburg (1979),
// Antonie van Leeuwenhoek 45:369–390, Lake Nakuru strain.
// Linear correlation with temperature: pitch r = 0.92, diameter r = 0.97.
// Light intensity affects neither parameter.
export const HELIX_VS_TEMPERATURE = {
  cold: { tempC: 15, pitchUm: 152, diameterUm: 69 },
  warm: { tempC: 30, pitchUm: 113, diameterUm: 36 },
}

// Cell dimensions — Nowicka-Krawczyk et al. (2019) Sci Rep 9:694:
// width 6–12 µm (≈10 µm in the Nakuru strain), length 2.6–5.6 µm,
// cells always shorter than wide.
export const CELL = {
  diameterUm: 8,
  lengthUm: 4.4,
}

// Trichome — length 100–500 µm in 7-day cultures (Life 11:536, 2021);
// 29 of 36 clonal strains are left-handed (Mühling et al. 2003, J Phycol 39:360).
export const TRICHOME = {
  lengthUm: 480,
  handedness: 'left',
}

// The strain every helical measurement above comes from. It is worth naming in
// the interface rather than leaving implied, because these are not
// species-typical numbers: the Nakuru pitch of 113–152 µm sits well above the
// 12–72 µm the species spans, so the modelled filament is markedly more open
// than most Arthrospira anyone would meet — 1.8 turns at 15 °C where a
// photograph usually shows four to eight.
//
// It is the strain with the helix measured against temperature, which is why
// the model is built on it. Saying so is the difference between a measurement
// and a claim about the species.
export const STRAIN = {
  name: 'Lake Nakuru',
  reference: 'van Eykelenburg 1979',
  cellDiameterUm: 10,
}

// The species-wide ranges recorded in the anatomical dossier, kept next to the
// modelled values so the interface can show one against the other instead of
// presenting a single strain as the organism.
export const HELIX_SPECIES_RANGE = {
  pitchUm: [12, 72],
  diameterUm: [15, 60],
}

// The helix the model is actually wound on: the middle of the range the species
// occupies, not a strain.
//
// Only one culture — Lake Nakuru — has ever had its helix measured against
// temperature, and its pitch sits above the species range entirely. Building
// the filament out of those numbers made the model a portrait of that culture
// rather than of Spirulina, and put a temperature slider in front of it that
// said so. `HELIX_VS_TEMPERATURE` and `helixAtTemperature` stay below because
// the relationship is real and measured and worth keeping in the record;
// nothing in the app is driven from them any more.
export const SPECIES_HELIX = {
  pitchUm: (HELIX_SPECIES_RANGE.pitchUm[0] + HELIX_SPECIES_RANGE.pitchUm[1]) / 2,
  diameterUm: (HELIX_SPECIES_RANGE.diameterUm[0] + HELIX_SPECIES_RANGE.diameterUm[1]) / 2,
}

// Screw sense of the modelled helix, as the sign applied to the azimuth.
//
// The scene is Y-up and right-handed, and the helix climbs in +Y. There, an
// azimuth that *decreases* as the curve rises is a right-handed screw — so a
// left-handed trichome needs the azimuth to increase, i.e. a positive sign.
// Getting this backwards mirrors the organism, and a mirrored helix is
// indistinguishable from a correct one in a still frame, which is why
// `tools/check-science.mjs` asserts it against a known right-handed control
// instead of leaving it to the eye.
export function helixSign(handedness = TRICHOME.handedness) {
  return handedness === 'left' ? 1 : -1
}

// A point on the trichome's helical axis at t ∈ [0, 1], centred on the origin.
// It lives here rather than inside the component so the screw sense can be
// checked without a renderer in the way.
export function helixPoint(t, { radiusUm, pitchUm, turns, handedness }) {
  const angle = helixSign(handedness) * t * turns * Math.PI * 2
  return [
    radiusUm * Math.cos(angle),
    (t - 0.5) * pitchUm * turns,
    radiusUm * Math.sin(angle),
  ]
}

// The helix the trichome is actually wound on at a given temperature, turns
// included: 480 µm of filament laid along a helix of this pitch and diameter
// makes exactly this many. It lives here because the tube that is drawn and the
// camera that flies to the apical cell both need the number, and two copies of
// it in two files is how they drift apart.
export function trichomeHelix(helix) {
  const circumference = Math.PI * helix.diameterUm
  return {
    radiusUm: helix.diameterUm / 2,
    pitchUm: helix.pitchUm,
    turns:
      TRICHOME.lengthUm /
      Math.sqrt(circumference * circumference + helix.pitchUm * helix.pitchUm),
    handedness: TRICHOME.handedness,
  }
}

const { cold, warm } = HELIX_VS_TEMPERATURE

export function helixAtTemperature(tempC) {
  const t = (tempC - cold.tempC) / (warm.tempC - cold.tempC)
  return {
    pitchUm: cold.pitchUm + (warm.pitchUm - cold.pitchUm) * t,
    diameterUm: cold.diameterUm + (warm.diameterUm - cold.diameterUm) * t,
  }
}

// Arc length of one helical turn: sqrt((π·D)² + P²)
export function turnLengthUm({ pitchUm, diameterUm }) {
  const c = Math.PI * diameterUm
  return Math.sqrt(c * c + pitchUm * pitchUm)
}

export function coilCount(helix, trichomeLengthUm = TRICHOME.lengthUm) {
  return trichomeLengthUm / turnLengthUm(helix)
}

// ── Reproduction ──────────────────────────────────────────────────────
//
// No spores, no heterocysts, no akinetes — Arthrospira does none of the things
// a filamentous cyanobacterium is often assumed to do. It multiplies by
// breaking. Certain intercalary cells undergo programmed death (necridia): they go
// biconcave and fill with mucilage, the trichome parts at them, and the short
// motile chain that comes away — a hormogonium — glides off, lengthens by
// intercalary division and rebuilds the helix.
//
// `breakAt` is where along the filament the necridium forms, as a fraction of
// its length. The piece beyond it is the hormogonium: at 0.85 of a 110-cell
// filament that is about 16 cells, inside the range usually quoted.
export const LIFE_CYCLE = {
  breakAt: 0.85,
  hormogoniumCells: [5, 25], // generic to the group; not measured in Arthrospira
  stages: [
    {
      at: 0,
      name: 'Intact trichome',
      text: 'An unbranched file of cells, growing by division anywhere along its length.',
    },
    {
      at: 0.12,
      name: 'A necridium forms',
      text: 'One intercalary cell dies on purpose: it goes biconcave, loses its contents and fills with mucilage. It pales long before anything breaks.',
    },
    {
      at: 0.42,
      name: 'The filament parts',
      text: 'The trichome separates at the dead cell. Both new ends are rounded — no wound, no repair.',
    },
    {
      at: 0.62,
      name: 'The hormogonium glides away',
      text: 'The short motile chain screws off along its own helix — the same gliding that carries an intact filament — and will lengthen into a new trichome.',
    },
  ],
}

export function lifeCycleStage(progress) {
  const stages = LIFE_CYCLE.stages
  let current = stages[0]
  for (const stage of stages) if (progress >= stage.at) current = stage
  return current
}

// ── Photosynthesis, as a sequence ─────────────────────────────────────
//
// The path the energy actually takes, in the order it takes it. Phycocyanin
// catches the light chlorophyll absorbs poorly, passes it inward down the rods
// to the allophycocyanin core, and the core hands it to chlorophyll a in the
// membrane the core is sitting on. What comes out the far end is spent by
// Rubisco inside the carboxysome.
export const PHOTOSYNTHESIS = [
  { at: 0, name: 'Light caught', text: 'Phycocyanin in the rods absorbs around 620 nm — the green light chlorophyll a is worst at using.' },
  { at: 0.28, name: 'Funnelled inward', text: 'The excitation passes down the rods towards the core, each step downhill in energy so it cannot go back.' },
  { at: 0.48, name: 'Handed to chlorophyll', text: 'The allophycocyanin core (≈650 nm) delivers it to chlorophyll a in the thylakoid membrane underneath.' },
  { at: 0.66, name: 'Down the chain', text: 'Electrons run along the membrane. The same lipid bilayer carries the respiratory chain — one membrane, two jobs.' },
  { at: 0.84, name: 'Carbon fixed', text: 'Rubisco inside the carboxysome spends it on CO₂, concentrated there by carbonic anhydrase.' },
]

export function photosynthesisStep(progress) {
  let current = PHOTOSYNTHESIS[0]
  for (const step of PHOTOSYNTHESIS) if (progress >= step.at) current = step
  return current
}

// ── Cell scale (nm) ───────────────────────────────────────────────────

export const CELL_NM = {
  diameter: CELL.diameterUm * 1000,
  length: CELL.lengthUm * 1000,
  get radius() {
    return this.diameter / 2
  },
}

// Wall layers L-I…L-IV, each 10–15 nm, total up to ~60 nm.
// van Eykelenburg (1977) Antonie van Leeuwenhoek 43:89–99; thesis ch. II.
// Listed outermost first, the order the camera meets them.
export const WALL_LAYERS = [
  { id: 'L-IV', thickness: 15, color: '#1f3a40', note: 'linear elements 12–15 nm, parallel to the axis' },
  { id: 'L-III', thickness: 15, color: '#639f92', note: 'fibrils 8–10 nm in a right-handed helix' },
  { id: 'L-II', thickness: 15, color: '#c6934f', note: 'peptidoglycan — the rigid layer' },
  { id: 'L-I', thickness: 15, color: '#4f9179', note: 'fibrillar β-1,2-glucan' },
]

export const WALL_TOTAL_NM = WALL_LAYERS.reduce((s, l) => s + l.thickness, 0)

export const MEMBRANE_NM = 8 // generic bilayer; no species-specific measurement

// The sheath: extracellular polymeric substances outside the wall.
//
// Not a fifth wall layer. It is a secreted, hydrated polysaccharide gel, and
// the numbers are the ones that make it a variable rather than a structure —
// measured on Arthrospira sp. PCC 8005 by Deschoenmaeker et al. (2016), which
// is this organism rather than a model for it. About 50 nm in ordinary growth;
// 50–200 nm after several days without nitrogen; and by 240 h it resolves into
// a continuous film against the wall (cEPS) and a looser fibrillar layer
// outside it (fEPS) reaching 300 nm on some cells, micrometres in places.
//
// This is also why the genus is described as sheathless. 50 nm is an order of
// magnitude under what a light microscope resolves, so Nowicka-Krawczyk et al.
// (2019) can record trichomes "without a sheath or with a thin, inconspicuous
// one" and Deschoenmaeker can photograph one, and both be right.
//
// The cell is drawn at REFERENCE_GROWTH_C in ordinary growth, so it is drawn at
// the unstarved thickness. The starvation range stays here because it belongs
// on the card as a fact about the layer, in the same way the storage switch
// stays a fact about the cyanophycin granule rather than a control.
export const SHEATH = {
  nominalNm: 50,
  starvedNm: [50, 200],
  // How far the fibrillar layer runs out where it runs out furthest. This is
  // the only number here that is a modelling decision as much as a measurement:
  // the paper reports strands of several micrometres in places, and drawing
  // those would put a fog round the cell rather than a coat on it.
  fibrillarMaxNm: 300,
  // van Eykelenburg's loose external fibrils, in the Nakuru strain at high
  // temperature. Far below a pixel at any zoom this model reaches, so they are
  // in the surface rather than in the geometry.
  fibrilNm: 3,
}

// The cross-wall in a healthy cell. Measured in Limnospira indica PCC 8005:
// an invagination of L-II flanked by L-I, 40 nm across while the culture is fed
// (Deschoenmaeker et al. 2016). Starve it of nitrogen and the same septum
// swells to 100 nm within a day and 200 nm within two — which is where the
// thick, hard-edged cross-walls in the literature's figures come from, and not
// what an ordinary cell has.
export const SEPTUM_NM = 40

// The nanopores that drill it. ~20 nm, dozens per septum, in rows: measured in
// Anabaena and Nostoc, and the rows themselves seen directly in S. platensis.
export const SEPTUM_PORE_NM = 20

// Thylakoid lamellae spaced ≈56 nm — van Eykelenburg (1979), cells at 38.5 °C, 1 klux.
// Arrangement irregular with whirl-like sections in Limnospira (Nowicka-Krawczyk 2019).
export const THYLAKOID = {
  spacingNm: 56,
  membraneNm: 7, // a single bilayer
  sacNm: 16, // the flattened sac: two membranes plus the lumen between them
}

export const CARBOXYSOME = { diameterNm: 420 } // up to ~500 nm in S. platensis
export const GAS_VESICLE = { diameterNm: 65, lengthNm: 900, ribPeriodNm: 4 }
export const POLYGLUCAN = { diameterNm: 25, lengthNm: 450 }
export const POLYPHOSPHATE = { diameterNm: 300 }
export const LIPID_BODY = { diameterNm: 260 }
export const RIBOSOME = { diameterNm: 22 }

// The 17–20 °C storage switch — van Eykelenburg (1979, 1980).
// Below ~17 °C nitrogen is banked as cyanophycin (granules to 2400 nm,
// 18 % of cell volume at 15.5 °C); above it, carbon as polyglucan, which
// peaks at 17–20 °C and thins out again above 20 °C.
export function cyanophycinState(tempC) {
  const abundance =
    tempC <= 15 ? 1 : tempC >= 25 ? 0.08 : 1 - 0.92 * ((tempC - 15) / 10)
  return {
    abundance,
    maxDiameterNm: tempC < 17 ? 2400 : 630,
  }
}

export function polyglucanState(tempC) {
  let abundance
  if (tempC < 17) abundance = 0.15 + 0.35 * ((tempC - 15) / 2)
  else if (tempC <= 20) abundance = 1
  else abundance = Math.max(0.15, 1 - 0.85 * ((tempC - 20) / 10))
  return { abundance }
}

// The cell interior is drawn in one state, not on a slider.
//
// The switch above is measured and real, but it is one strain in one
// laboratory, and hanging the whole interior off it makes that single study the
// subject of the view instead of the species. What the cutaway shows is a
// culture in ordinary growth — well above the switch, both stores present and
// neither at its extreme — which is the condition Spirulina is actually held at
// in cultivation and the one most micrographs of it record.
export const REFERENCE_GROWTH_C = 30
export const CELL_STORAGE = {
  cyanophycin: cyanophycinState(REFERENCE_GROWTH_C),
  polyglucan: polyglucanState(REFERENCE_GROWTH_C),
}

// The cell is drawn as a cutaway: a wedge facing the camera is removed so the
// interior can be read. Surviving world angles run from `keptStart` to 2π.
const REMOVED_ANGLE = (115 * Math.PI) / 180
export const CUTAWAY = {
  removed: REMOVED_ANGLE,
  kept: Math.PI * 2 - REMOVED_ANGLE,
  keptStart: REMOVED_ANGLE,
}

// The y of the face of the lower cross-wall — the floor of the cutaway, the
// surface you look down onto. Lives here because both the placement of the
// granules and the placement of the labels are measured from it, and two
// copies of the same expression in two files is how they drift apart.
export const FLOOR_NM = -(CELL_NM.length / 2 - 45)

// Radial zones, all in nm. The nucleoplasm is kept clear of lamellae: that is
// where van Eykelenburg found the polyhedral bodies and the DNA.
export const ZONES = {
  wallOuter: (CELL.diameterUm * 1000) / 2, // 4000 nm
  // Where the model stops drawing the sheath. Not an edge — a gel does not have
  // one — but the reach the framing and the fog have to clear.
  get sheathOuter() {
    return this.wallOuter + SHEATH.fibrillarMaxNm
  },
  get wallInner() {
    return this.wallOuter - WALL_TOTAL_NM
  },
  get membraneInner() {
    return this.wallInner - MEMBRANE_NM
  },
  get thylakoidOuter() {
    return this.membraneInner - 170
  },
  // How far out the cross-wall reaches. It is not a disc laid between two cells
  // that stops at the membrane: it is an invagination of L-II flanked by L-I
  // (Deschoenmaeker et al. 2016), so it runs out into the wall as far as the
  // layer it is made of, and the envelope and the septum are one surface.
  get septumOuter() {
    return this.wallOuter - WALL_LAYERS[0].thickness - WALL_LAYERS[1].thickness
  },
  // Lamella-free core holding the DNA and the carboxysomes. Widened from 1400:
  // the polyhedral bodies and the nucleoid are described as occupying a region,
  // and at 1400 nm that region was a shaft between two walls of membrane with
  // nothing of it visible. The check in tools/check-science.mjs still holds the
  // floor — the thylakoid band has to carry at least thirty lamellae at true
  // spacing, and at 1750 it carries thirty-five.
  nucleoplasm: 1750,
  // |y| beyond this is free of lamellae. It used to be 1700, which left a
  // 455 nm stripe of empty cytoplasm above the cross-wall — and in a section
  // that reads as membranes hanging clear of the floor with daylight under
  // them, which no micrograph shows. In a longitudinal section the lamellae run
  // most of the way to the wall and it is the granules and the aerotopes that
  // occupy the last of the distance, so the stack comes down to meet them and
  // arches over them where they are in the way.
  subSeptal: 1930,
}

// Deterministic RNG so the cell interior is stable across re-renders.
export function seededRandom(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// An angle in the part of the cell that survives the cutaway.
export function keptAngle(rnd, margin = 0.12) {
  return CUTAWAY.keptStart + margin + rnd() * (CUTAWAY.kept - 2 * margin)
}
