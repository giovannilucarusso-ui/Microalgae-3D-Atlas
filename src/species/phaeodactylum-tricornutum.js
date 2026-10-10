// Phaeodactylum tricornutum Bohlin 1897 — the model diatom, strain Pt1 8.6, and
// the eighth specimen. The first diatom in the atlas.
//
// **The first diatom does not look like one.** A diatom is a cell in a box of
// glass, and this one, for almost all of its cells, is not: the fusiform cells
// that make up a culture of the strain drawn have an organic wall with a few
// silica bands thirteen nanometres wide in the girdle region, and nothing else
// of silica (r98). Only the oval form builds a reduced silica valve with a
// raphe, and it was that raphe, found in 1958, that put the species among the
// diatoms at all (r99). The species divides without silicon (r99), and its
// cells do not get smaller generation after generation. It is the most studied
// diatom there is — genome, transformation, gene editing — and the least
// typical, and the cards say both.
//
// **The strain is Pt1 8.6** (CCAP 1055/1 = CCMP2561), the clone De Martino and
// Ten-Hage isolated in 2003 from the culture Coughlan took from an estuary off
// Blackpool around 1956 (r109). It is the strain whose genome was sequenced
// (r107, r108), whose cells were reconstructed whole by FIB-SEM (r102) and
// followed through division (r105), and in ordinary culture it is fusiform.
//
// **What is drawn is a fresh wet mount of a healthy culture**, in brightfield,
// at about a hundred micrometres across — the owner's choice of framing, which
// puts a cell at a fifth of the field and an arm, a micrometre across, at a
// dozen or more pixels. The shapes, the plastid's place and the arms are
// measured on an open micrograph of the three forms (r111); the density, the
// way the cells lie and how many are in focus at once on a photograph of a Pt1
// culture (r112); the sizes and volumes on the strain's own literature.
import { PHAEODACTYLUM_CARDS } from './phaeodactylum-cards.js'

const exterior = {
  group: 'Bacillariophyta · Bacillariophyceae',
  kind: 'pennate-field',
  label: 'Wet mount · healthy culture',
  caption:
    'A fresh wet mount of strain Pt1 8.6 in transmitted light. Almost every cell is fusiform: a short golden body holding a single plastid, and two colourless arms. They hang through the whole depth of the drop, so the fine focus brings them in one layer at a time; the few oval cells lie on the glass.',

  // About a hundred micrometres across: the owner's choice (distinta §8).
  fieldUm: 100,
  view: [0, 0, 1],
  // The coverslip gap, near enough. It sets the fine focus's travel, and the
  // fusiform cells are spread through all of it.
  depthUm: 30,
  // How much of the drop is populated, in fields across and down.
  slab: [3, 2.2],

  // Cells per square millimetre of slide, counted on the photograph of a Pt1
  // culture (r112): 130–180 cells, sharp and blurred, in about 0.032 mm² —
  // its scale set by the strain's measured mean length (r103), since it has no
  // bar. That is far denser than a batch culture in f/2, which stops at a few
  // million cells per millilitre and would put one cell in a field this size;
  // the photographed drop was evidently concentrated, as drops for the
  // microscope often are. The count is the photograph's, and the card says so.
  cellsPerMm2: 4500,

  // How many of the cells are which form. Pt1 is fusiform in ordinary liquid
  // culture — 95–100 % in the accessions of its genotype (r100) — with oval
  // cells now and then (r99, r112) and no triradiate cell documented in it.
  morphs: { oval: 0.04 },

  // The fusiform cell.
  cell: {
    // Pt1 in brightfield, 2500–8000 cells per sample: a mean length between
    // 22.6 and 23.5 µm across eleven days (r103). The spread is not given in
    // what could be read; ±2.5 µm is a choice, and the range clips the tails
    // inside what the species shows (10–15 µm in the shortest accession, 25–30
    // µm in the longest, r106).
    lengthUm: 23,
    lengthSdUm: 2.5,
    lengthRangeUm: [16, 30],
    // How much of the length the central body takes, as a fraction of the
    // half-length: about 40 % on the open micrograph (r111), the central third
    // or so in confocal images of the three forms (r101), more in the FIB-SEM
    // cell, which tapers more gradually (r102).
    bodyOfLength: [0.45, 0.6],
    // The body's width. Measured on the micrograph, 2.4–3.0 µm in a cell of 17
    // µm (r111); 3.5–4 µm in brightfield counts of Pt1, which include the edge
    // the blur adds (r103). Held to the FIB-SEM volume: with these widths a
    // cell of 13–15 µm, the length of the reconstructed cells, comes out at
    // about 33 µm³ against the measured 32.6 ± 2.4 µm³ (r102). See
    // check-phaeodactylum.mjs.
    bodyWidthUm: [2.8, 3.4],
    // The arms: 0.9–1.0 µm across at mid-arm on the micrograph (r111), and a
    // little narrower towards the rounded tip.
    armUm: [0.85, 1.0],
    tipOfArm: [0.8, 0.95],
    // Straight or "bent" (lunate): both are stable in culture (r98). How many
    // are bent is read off the two images (r111, r112) and is a choice; the
    // bend is the sag of the axis at its middle, in µm.
    bentShare: 0.25,
    bendUm: [0.8, 2.0],
  },
  // A little tilt out of the slide's plane; see orientation() in pennate.js.
  tiltSpread: 0.15,

  // The wall. Organic in the fusiform cell, with silica only as bands of 13 nm
  // in the girdle region (r98); its thickness is not stated, and 40 nm is a
  // choice that, with the index below, gives the arms the edges the
  // micrograph shows. The oval's is measured: 30–45 nm in the two transverse
  // sections of r98 (figs 15–16, against their 0.1 µm bars), with ridges a
  // few nanometres high on its surface, and part of one valve may be silica.
  // The thick, glassy rim the light microscope shows round an oval is not the
  // wall's thickness, which is far under the objective's resolution, but its
  // edge as the objective draws it.
  wall: { fusiformUm: 0.04, ovalUm: 0.045 },

  // The plastid: one per cell, central, pushed to one side of the body (r98,
  // r101), 33.7 ± 1.8 % of the cell's volume in Pt1 at low light (r102). It is
  // drawn as a thick plate: its length a share of the body's, its thickness
  // half the body's radius, its third axis solved for the volume share.
  plastid: {
    volumeShare: [0.3, 0.36],
    lengthOfBody: [0.82, 0.95],
    thicknessOfBody: 0.55,
    offsetOfBody: 0.35,
  },
  // The nucleus, 6.2 ± 0.7 % of the volume (r102), central, beside the
  // plastid (r101). It differs from the cytoplasm round it so little that a
  // micrograph barely shows it, and so is it drawn.
  nucleus: { volumeShare: 0.062 },
  // Lipid droplets with nitrogen to spare: 3.6 ± 2.1 to a cell, 0.09 ± 0.04
  // µm³ each (r103), beside the plastid and out in the arms (r101).
  droplets: { meanCount: 3.57, volumeUm3: 0.09, volumeSpread: 0.35, inArms: 0.45 },

  // Division. A synchronised culture divides its plastid first, by a
  // constriction across its middle, in the hours after the light comes on, and
  // the two daughters part at the end of the day (r105); with a cell dividing
  // about once a day, a cell in a culture in the light carries a pinched
  // plastid for some hours out of every twenty-four. How many in any one field
  // is not measured; these shares are choices, and the card says so.
  division: { plastidDividedShare: 0.15, pinch: 0.85, pairShare: 0.05 },

  // The oval cell, as it comes in a culture growing well: "long and thin"
  // (r99), about 8 × 3 µm in the first description and 5.4–7.7 × 2.8–3.2 µm on
  // the micrograph (r111), its plastid filling much of it (r101).
  oval: {
    lengthUm: [6, 7.8],
    widthUm: [2.8, 3.2],
    plastid: {
      volumeShare: [0.3, 0.4],
      lengthOfBody: [0.72, 0.84],
      thicknessOfBody: 0.55,
      offsetOfBody: 0.3,
    },
    // Where the oval card puts the plane of focus: this far below the middle
    // of the cell, towards the slide. Fitted to the ovals of the micrograph
    // (r111), whose rim is a dark line at the wall — 0.85 of the field in
    // green — with a cold edge inside it and a warm, pale halo outside; with
    // the plane through the middle of the cell the wall shows no dark line at
    // all, only the objective's colour fringes. Rack the fine focus to move it.
    focusBelowUm: 0.4,
  },

  // The plastid's colour, as a transmittance at one micrometre of plastid.
  //
  // **Hue from the pigments, luminance from the micrograph.** The plastid
  // holds chlorophyll a, the chlorophylls c and fucoxanthin, bound in its
  // light-harvesting proteins (r101). Fucoxanthin in the cell absorbs right
  // across the blue and well into the green, chlorophyll a also in the red, and
  // what is left is the yellow to orange of the gap between: blue taken most,
  // then green, then red — the golden brown of diatoms. The two photographs of
  // the species disagree about red against green, one olive (r111) and one
  // yellow (r112), which is what their cameras' white balance does to a ratio;
  // the order the pigments set is used, and the luminance is the micrograph's,
  // where the plastid at its thickest keeps about 0.68 of the field in green.
  colour: '#e3d1a2',
  // Each camera band keeps a small share the pigment nearly misses, so a long
  // path walks to a dark olive-brown instead of clipping a channel; the share
  // is smallest in the blue, which fucoxanthin and the chlorophylls both take.
  band: [0.08, 0.06, 0.1],
  bandWeak: [0.13, 0.13, 0.05],

  // Brightfield, because both references are brightfield.
  filter: 'none',

  // What else is on the slide: a little grit, a couple of flakes, and no
  // passing cells of some other species.
  debris: { flakes: 2, cocci: 0 },

  // For the landing page's disc.
  seed: 2561,
  groups: [
    { title: 'The cell', ids: ['cellBody', 'plastid', 'droplets', 'wall'] },
    { title: 'The culture', ids: ['suspension', 'morphotypes', 'oval', 'division'] },
    { title: 'The organism', ids: ['identity'] },
  ],
}

export default {
  id: 'phaeodactylum-tricornutum',
  name: 'Phaeodactylum',
  latin: 'Phaeodactylum tricornutum',
  authority: 'Bohlin 1897',
  group: exterior.group,
  lineage: { domain: 'Eukaryota', supergroup: 'SAR', phylum: 'Bacillariophyta' },
  tagline:
    'The model diatom, and the least typical: in a culture of strain Pt1 almost no cell has the glass box diatoms are known for.',
  structures: PHAEODACTYLUM_CARDS(exterior),
  // The second tier is the other diatoms, and the stramenopiles with
  // red-algal plastids at large.
  tiers: {
    species: 'Measured in Phaeodactylum tricornutum',
    model: 'From other diatoms',
  },
  exterior,
}
