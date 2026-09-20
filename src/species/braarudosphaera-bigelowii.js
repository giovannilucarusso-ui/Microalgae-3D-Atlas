// Braarudosphaera bigelowii (Gran & Braarud) Deflandre 1947 — the alga with the
// nitroplast, and the fifth specimen.
//
// It is here for the organelle. In 2024 the nitrogen-fixing cyanobacterium this
// haptophyte carries — UCYN-A, "Candidatus Atelocyanobacterium thalassa" — was
// shown to divide in step with its host and to import proteins the host's
// nucleus encodes (r54), which is what makes an endosymbiont an organelle. The
// first nitrogen-fixing organelle known in any eukaryote, and with the
// chromatophore of Paulinella the most recently evolved organelle known (r56).
// It is visible down an ordinary light microscope, as a round body at the back
// of the cell, and the reference photograph labels it.
//
// **What is drawn is the motile stage, and of one species of a complex.** B.
// bigelowii has two life stages: a non-motile cell inside a dodecahedron of
// twelve calcite pentaliths, which is the famous fossil, and a scaly flagellate
// that was described in 1972 as a species of its own, Chrysochromulina
// parkeae, before molecular data joined the two (r57). And the name covers
// several species: Hagino et al. (r53) formally split the complex by pentalith
// size and 18S genotype in 2026, and the name *parkeae* went with the large
// form, not with this one. So the classic description of "the motile stage" —
// Green & Leadbeater's, with its flagella and haptonema measured — is now a
// description of the sister species, and its rows sit at the second tier here.
// The culture the reference footage and the 2024–2026 papers come from, FR-21,
// is genotype III, which is B. bigelowii in the strict sense.
//
// The reference is the Zehr Lab's footage of a living FR-21 cell in
// brightfield (UC Santa Cruz), and its proportions, colour and edges are
// measured off it — see haptophyte.js and the notes below.
import { BRAARUDOSPHAERA_CARDS } from './braarudosphaera-cards.js'

export default {
  id: 'braarudosphaera-bigelowii',
  name: 'Braarudosphaera',
  latin: 'Braarudosphaera bigelowii',
  authority: '(Gran & Braarud) Deflandre 1947',
  group: 'Haptophyta · Prymnesiophyceae',
  structures: BRAARUDOSPHAERA_CARDS,
  // The second tier is the sister species B. parkeae — the original 1972
  // description of the motile stage — and the haptophytes at large.
  tiers: {
    species: 'Measured in Braarudosphaera bigelowii',
    model: 'From a sister species or other haptophytes',
  },

  exterior: {
    group: 'Haptophyta · Prymnesiophyceae',
    kind: 'haptophyte-field',
    label: 'Wet mount · motile stage',
    caption:
      'A single motile cell of Braarudosphaera bigelowii in sea water, in brightfield, holding station while it slowly turns. The round body at the back, between the two golden plastids, is the nitroplast: a nitrogen-fixing cyanobacterium that has become an organelle. Everything else in the field is empty water, because a culture of this alga is that thin.',

    // A field about seventy micrometres down: the framing of the reference
    // footage, in which a cell fifteen micrometres long spans a fifth of the
    // height.
    fieldUm: 70,
    view: [0, 0, 1],
    depthUm: 30,

    // Exponential growth in culture, measured on FR-21 (r56). Two to three
    // orders of magnitude under anything else in this atlas, and through a
    // field this size it is one cell in several dozen fields — see the note at
    // the top of haptophyte.js for why one cell is placed by hand.
    cellsPerMl: 1e5,

    // The cell. `volumeUm3` is the mean of three FIB-SEM reconstructions of
    // cultured motile cells, 130.5 ± 8.2 µm³ (r56), and it sets the size:
    // the proportions come from the footage (length to width 2.9 : 1), and the
    // length follows from asking for that volume — about 14 µm, inside the
    // 9–19 µm the species description gives for its motile cells (r53, r60).
    // The compression is described (r52) but not measured, and 0.8 is a
    // choice: it is what lets a nitroplast of the measured volume fit through
    // the cell's thickness with a margin, and a flatter cell could not hold it.
    cell: { volumeUm3: 130.5, widthRatio: 0.345, flattening: 0.8, lengthSpread: [0.94, 1.06] },

    // The two plastids, lining the sides of the cell nearly from end to end
    // (r51, r52), and together 35 % of the cell's volume in the FIB-SEM
    // reconstructions (r56). Their thickness is solved for that share, not
    // chosen. How far round the cell they reach is read off the footage: seen
    // flat, the cell is golden right across except for one narrow pale streak
    // down its axis, which is the seam where the two plates nearly meet.
    plastids: { volumeShare: 0.35, fromS: 0.06, span: 1.42 },

    // The nitroplast: one per cell, at the back, between the plastids (r51),
    // 10.2 % of the cell's volume (r56). Its radius is the sphere of that
    // volume — about 1.5 µm, inside the 2–4 µm diameters measured by
    // cryo-electron tomography — and at the footage's proportions it comes
    // out six tenths of the cell's width, which is what the footage shows.
    // Two independent measurements agreeing, not one fitted to the other.
    nitroplast: { volumeShare: 0.102, u: -0.36 },
    // The nucleus, 6.5 % of the volume (r56). Its position is not given in
    // what could be read; it is drawn in front of the nitroplast, faintly.
    nucleus: { volumeShare: 0.065, u: 0.2 },
    // "Numerous refractive droplets" in the plastids (r52); the footage shows
    // one or two bright points, one near each end.
    droplets: { at: [0.72, -0.8], radiusUm: [0.14, 0.2] },

    // Two flagella of equal length arising at the front (r51, r60), 8–20 µm in
    // the sister species (r52); about the cell's length and more in the
    // footage. They are thin — an axoneme and its membrane — and the beat is
    // drawn slow, as the footage shows it: they bend out and back along the
    // body with a wave running down them.
    flagella: {
      lengthUm: [13, 18],
      radiusUm: 0.12,
      bendRad: [1.6, 2.1],
      amplitudeRad: 0.3,
      waveUm: 7,
      beatHz: [0.5, 1.0],
    },
    // Short, swollen at the base, and never seen to coil (r51); 2.5–4.5 µm in
    // the sister species (r52).
    haptonema: { lengthUm: [2.5, 4.5], radiusUm: 0.09, swellingUm: 0.24 },
    // Spine-like scales, three to six, at the front and the back (r51),
    // 6.4–22.5 µm in this species (r60). The footage shows a bundle of two or
    // three running straight ahead of the cell, and the reference photograph
    // more behind it.
    spines: { anterior: [2, 3], posterior: [1, 2], lengthUm: [8, 14], radiusUm: 0.13, baseUm: 0.26 },
    // "A distinctive projecting structure at the posterior end" (r51) — in
    // the footage a small pale knob on the tip.
    projection: { lengthUm: 1.5, neckUm: 0.2, knobUm: 0.5 },

    // How it moves. "The cell revolved slowly about its longitudinal axis"
    // (r52) is the only statement in the literature; the rest is the footage,
    // in which the cell holds station against the debris — a micrometre a
    // second of drift — and swings its heading now and then.
    swimming: { spinHz: [0.12, 0.22], wanderUm: [1.5, 3.2], turnRad: [0.3, 0.6] },
    motion: {
      label: 'Swimming',
      note: 'The cell holds station, revolving slowly about its long axis while its flagella beat, as in the reference footage. Switch it off to hold the cell still and rack the focus through it.',
    },

    // The pose the centred cell starts in: the footage's, along the frame
    // with its front to the left and its broad face to the objective.
    startPose: { headingRad: Math.PI, rollRad: 0 },
    // Where the plane of focus sits against the cell, as in the footage: about
    // a micrometre beyond its midplane — the depth at which the footage's dark
    // rim, bright inner line and pale halo come out closest to their measured
    // strengths. Further off, the fringes widen faster than they deepen. See
    // buildHaptophytes.
    focusOffsetUm: 1.1,

    // The plastids' colour, as a transmittance at one micrometre of plastid,
    // measured off the footage against its own field: the middle of a cell
    // lying flat, through two plates, transmits (0.96, 0.91, 0.67). Golden —
    // blue taken more than green, green more than red. `band` and `bandWeak`
    // are how much of each camera channel the pigment nearly misses, and how
    // nearly: the footage's blue is almost the same through one micrometre of
    // plate as through three, so most of the blue the pigment takes it takes
    // at once and the rest it barely touches — which is why the long path
    // through a plate at the cell's margin goes brown rather than orange.
    colour: '#f4e69e',
    band: [0.1, 0.05, 0.6],
    bandWeak: [0.13, 0.13, 0.02],

    // Brightfield, because that is the footage. The Rheinberg pairs and
    // darkfield are offered; DIC is not yet drawn by this renderer.
    filter: 'none',

    seed: 5021,
    groups: [
      { title: 'The cell', ids: ['cellBody', 'nitroplast', 'plastids'] },
      { title: 'Front end', ids: ['flagella', 'haptonema', 'scales'] },
      { title: 'The organism', ids: ['diel', 'lifeCycle'] },
    ],
  },
}
