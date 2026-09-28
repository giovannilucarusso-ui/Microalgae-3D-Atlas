// Aurantiochytrium mangrovei (Raghu-Kumar) R. Yokoyama & D. Honda 2007 — a
// thraustochytrid, strain RCC893, and the seventh specimen.
//
// **It is not an alga, and it is here on purpose.** A thraustochytrid has no
// plastid and never photosynthesises: it is a heterotrophic stramenopile that
// lives by digesting dead mangrove leaves, from a branch of the stramenopiles
// that on current evidence never took a plastid in (r88). But the world treats
// it as one — the oil it makes, rich in DHA, is sold as "algal oil", and the
// European Food Safety Authority calls the genus it is traded under "a
// single-cell microalga" (r89). It is the specimen that shows where the word
// stops, and the tree on the landing page puts it on a branch with no
// endosymbiosis arrow into it, because the absence is the point.
//
// **The strain is RCC893, the project owner's.** Isolated from decaying
// mangrove leaves at Sai Kung, Hong Kong, in 2002 (r82), and grown by the
// owner for its omega-3 oil (r83). It also happens to be the only strain of
// the species in the 18S tree that erected the genus, where it is flagged as
// not being the ex-type — the type cultures from Goa have been lost (r81). So
// the cells on this stage are the species' reference in fact, not in law, and
// the card "Which name, which strain?" says so.
//
// **What is drawn is the owner's culture three days into YEP**, at 200× in
// brightfield, because that is the picture of it that exists: a photograph the
// owner has chosen to keep private, on which the sizes, the density, the
// grouping and the colour were measured (r96). Everything taken from it is a
// number; the photograph is in no file of this repository. The cells'
// interiors — oil droplets about a micrometre across, packed through the whole
// cell — are measured on the one image the Roscoff collection publishes of the
// strain (r82).
import { CYCLE_T } from '../thraustochytrid.js'
import { AURANTIOCHYTRIUM_CARDS } from './aurantiochytrium-cards.js'

const exterior = {
  group: 'Labyrinthulomycota · Thraustochytrida',
  kind: 'thraustochytrid-field',
  label: 'Wet mount · 72 h culture',
  caption:
    'Strain RCC893 three days into a flask of YEP, in a wet mount, in transmitted light. Colourless cells full of oil, resting on the slide, most of them in pairs and small groups. Rack the fine focus: the plane selects a size, because every cell rests on the glass with its middle one radius above it.',

  // How much slide is in frame: a quarter of the reference photograph's
  // field, which is a millimetre across at 200× — about what a screen shows
  // of a field that size at a size where a cell is still a cell.
  fieldUm: 280,
  view: [0, 0, 1],
  // The coverslip gap, near enough; it sets the fine focus's travel, and
  // the largest cells are nearly thirty micrometres tall.
  depthUm: 30,
  // How much of the drop is populated, in fields across and down: panning
  // finds more of the same culture rather than the edge of it.
  slab: [3, 2.2],

  // About 1400 cells to the square millimetre, counted on the photograph
  // (r96): some thousand cells over 0.71 mm² of it.
  cellsPerMm2: 1400,
  // For the landing page's disc: the measured median and extremes.
  cell: { minUm: 5.7, maxUm: 28.4, medianUm: 13.2 },

  // How the cells lie. Sixty per cent of them in groups made by division —
  // pressed together, or lying a micrometre or two apart — and the rest
  // scattered. Fitted to the photograph's count of cells whose outlines come
  // within 0.9, 2.4 and 3.9 µm of another's (36, 61 and 74 %): this gives
  // about 38, 58 and 72 %. See thraustochytrid.js.
  grouping: {
    fraction: 0.6,
    squeeze: [0.88, 1.35],
    gapUm: 0.2,
  },

  // Where the objective is racked to, as a height above the slide. Every cell
  // rests on the glass with its middle one radius up, so this is also a choice
  // of which size is in focus. Fitted to the photograph's cells of 13–16 µm —
  // a dark rim inside at 0.93–0.95 of the field and a bright line outside at
  // about +4 % — which puts it just under the middle of a cell of the median
  // size. Cells smaller than about 11 µm then have their middles below the
  // plane and show the reverse, bright inside and dark outside; larger ones
  // are further off and ring more widely. Rack the fine focus to move it.
  focus: { aboveGlassUm: 5.6 },

  // The oil. Droplets on a jittered lattice, `spacingUm` between sites, a
  // share `fill` of the sites occupied; the step grows with the cell's size
  // between the two diameters of `sizeRangeUm`, and a droplet's size is a
  // fraction of its step (DROPLET_K in thraustochytrid.js): 0.8–2.1 µm across.
  // The collection's micrograph of the strain (r82) shows droplets of about a
  // micrometre, in a culture kept for weeks; the three-day culture drawn here
  // is coarser — the texture of its cells at 200× has a grain of 1.5–3 µm
  // (r96) — and a strain of the species after two days at 1 % glucose shows
  // 1.5–4 µm (r85). About a fifth of the cell's volume, which nothing measures
  // and the card says so.
  //
  // `perUm` is what one micrometre of oil lets through, as a display ratio:
  // the carotenoids dissolved in it take a little blue. Set so that a cell of
  // the median size keeps about 96 % of the blue it keeps of the green — the
  // few per cent that the reference photograph and the collection's micrograph
  // both leave once their objectives' colour errors are accounted for.
  lipid: {
    spacingUm: [1.6, 2.2],
    fill: [0.8, 0.95],
    sizeRangeUm: [9, 19],
    perUm: [1, 0.998, 0.982],
    // How far the droplets' phase term may go before it saturates. The
    // first-order equation the renderer uses is exact for weak phase objects
    // and a droplet of oil a micrometre or two across is not one: unbounded, it
    // printed every droplet near focus as a black or white blot. Set so that a
    // cell in focus through its middle has the texture measured on the
    // collection's micrograph of the strain — a standard deviation of about a
    // tenth of the field, at 14.4 px/µm.
    phaseLimit: 0.22,
  },
  // The wall, which nobody has measured in this species.
  wallUm: 0.1,

  // What else is on the slide: only grit. The photograph's culture holds
  // thin rod-shaped bacteria, which belong to the culture and not to the
  // organism and which the owner chose to leave out; the atlas's usual
  // passing cells of some other species are left out with them, and so are
  // its detritus flakes, which seen edge-on are rods of just the bacteria's
  // size.
  debris: { flakes: 0, cocci: 0 },

  // The life cycle, shown on request: one cell followed from a zoospore to a
  // zoosporangium in a clearing near the middle of the stage. See buildCycle in
  // thraustochytrid.js, and the life-cycle card for what each step rests on.
  lifeCycle: {
    // The length of one loop at play speed. Growth is compressed into it;
    // swimming is not.
    seconds: 30,
    // The cell that becomes a zoosporangium: the measured median (r96).
    matureUm: 13.2,
    // An encysted zoospore, 3.7–4.4 µm (r80).
    cystUm: 4,
    // What its protoplast cleaves into: 2, 4, 8, 16 or rarely 32 in a nutrient
    // medium, the larger cells making the more (r80).
    zoospores: 16,
    // How much empty slide the cycle needs round the mature cell.
    clearUm: 8,
    // 4.1–4.8 × 2.6–3.3 µm (r80). The flagella's lengths are not measured in
    // the species: the anterior one longer, as the protologue says, and drawn
    // about twice the body and about the body.
    zoospore: { lengthUm: 4.5, widthUm: 3, flagellaUm: [9, 5] },
    // Straight-line speeds of a Hong Kong strain's zoospores, up to 125 µm/s
    // (151 µm/s along the path) at low salinity (r86).
    speedUm: [60, 125],
    label: 'Life cycle',
    note: 'The culture on the stage is three days old and had no zoospores left. Switch this on to follow one cell through the days before: a zoospore settles, grows into a cell, cleaves into sixteen zoospores and bursts. Growth is compressed; the swimming is at its measured speed.',
    stages: [
      {
        at: 0,
        name: 'A zoospore settles',
        text: 'An elliptical zoospore four and a half micrometres long, with a long flagellum in front and a shorter one behind, both at its side, swims in, stops, loses its flagella and rounds up into a cyst of about four micrometres.',
      },
      {
        at: CYCLE_T.cyst,
        name: 'It grows',
        text: 'The cyst grows into a mature cell and fills with oil. On pine pollen in sea water that takes about a day and stops at 6–9 µm; in YEP the cells grow to thirteen micrometres and more.',
      },
      {
        at: CYCLE_T.grown,
        name: 'Cleavage inside the wall',
        text: 'Inside its wall the protoplast divides in two, and each half again: two, four, eight, sixteen. The cell has become a zoosporangium.',
      },
      {
        at: CYCLE_T.cleaved,
        name: 'Zoospores take shape',
        text: 'The sixteen masses take the shape of zoospores and grow their flagella, and stir inside the wall.',
      },
      {
        at: CYCLE_T.shaped,
        name: 'The zoosporangium bursts',
        text: 'The wall gives way on one side and the zoospores spill out, the nearest first — as the project owner sees RCC893 release them in YEP. The protologue, on the type strain, describes a cell that sheds its wall before it cleaves.',
      },
      {
        at: CYCLE_T.burst + 0.01,
        name: 'Away',
        text: 'Each swims off in a straight line with occasional turns, at up to 125 µm/s — its own speed, not compressed — and the empty wall collapses behind them.',
      },
    ],
  },

  // Brightfield, as in the photograph.
  filter: 'none',

  seed: 893,
  groups: [
    { title: 'The cell', ids: ['cellBody', 'lipidBodies', 'colour'] },
    { title: 'The culture', ids: ['groups', 'culture'] },
    { title: 'The life cycle', ids: ['lifeCycle', 'zoospores'] },
    { title: 'The organism', ids: ['identity', 'notAnAlga'] },
  ],
}

export default {
  id: 'aurantiochytrium-mangrovei',
  name: 'Aurantiochytrium',
  latin: 'Aurantiochytrium mangrovei',
  authority: '(Raghu-Kumar) R. Yokoyama & D. Honda 2007',
  group: exterior.group,
  lineage: { domain: 'Eukaryota', supergroup: 'SAR', phylum: 'Labyrinthulomycota' },
  tagline:
    'Not an alga: a heterotroph with no plastid, whose oil is sold as “algal” for its DHA. The project owner’s strain, RCC893, three days into culture.',
  structures: AURANTIOCHYTRIUM_CARDS(exterior),
  // The second tier is the sister species, the best-studied of the genus, and
  // the thraustochytrids at large.
  tiers: {
    species: 'Measured in Aurantiochytrium mangrovei',
    model: 'From A. limacinum or other thraustochytrids',
  },
  exterior,
}
