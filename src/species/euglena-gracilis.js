// Euglena gracilis Klebs 1883 — the fourth specimen, and the first that is
// neither a cyanobacterium nor a green coccoid.
//
// It is here for three reasons, and the third is the interesting one.
//
// **It is a real food organism.** Euglena gracilis is grown commercially in
// Japan and sold as a functional food; its β-1,3-glucan, paramylon, is the
// product. That puts it in the same story as the Spirulina and the Chlorella
// already in the atlas.
//
// **It is the best-looking thing a pond has.** Which matters less than the
// science, but not nothing: an atlas nobody opens teaches nobody.
//
// **And it breaks the atlas's shape, usefully.** Every specimen so far has been
// either a filament or a sphere, and a sphere is the one body a renderer gets
// for free — an ellipsoid is a quadratic, so every surface in the coccoid field
// is *solved*. A Euglena is a spindle: rounded at the front, drawn out to a
// point at the back, and not an ellipsoid by any stretch. It is also *flexible*,
// which no other specimen here is. So it is the specimen that says whether the
// engine generalises or whether it was a Chlorella renderer wearing a coat.
//
// What this view deliberately does not claim: a crisp pellicle striation. The
// strips are measured at 240 nm groove to groove in this species — one of the
// finest in the genus — and this objective resolves 220. They are therefore
// right at the limit, which is why a real Euglena looks faintly ribbed and never
// crisply striped, and why they are drawn at the few per cent of contrast the
// objective passes there instead of as forty clean lines down each cell.
import { EUGLENA_CARDS } from './euglena-cards.js'

export default {
  id: 'euglena-gracilis',
  name: 'Euglena',
  latin: 'Euglena gracilis',
  authority: 'Klebs 1883',
  group: 'Euglenozoa · Euglenida',
  structures: EUGLENA_CARDS,
  // Unlike the Chlorella pair, most of what is drawn here *is* measured in this
  // species — it is a heavily studied laboratory organism. The second tier is
  // the genus, which is where the shape language and the pellicle come from.
  tiers: {
    species: 'Measured in Euglena gracilis',
    model: 'From the genus Euglena',
  },

  exterior: {
    group: 'Euglenozoa · Euglenida',
    kind: 'euglenoid-field',
    label: 'Wet mount',
    caption:
      'A crowded wet mount of Euglena gracilis in differential interference contrast. The cells swim and roll as they go, most of the culture is a soft haze above and below the plane of focus, and a few have stopped to change shape — the pellicle is strips, not a wall.',

    // 35–55 by 6–25 µm, measured for this species (NIES). The width range is
    // enormous because a euglenoid does not have one width: a cell part-way
    // through metaboly is a different shape from the same cell a second later,
    // and the range is that as much as it is variation between individuals.
    cell: { lengthUm: [35, 55], widthUm: [7, 13], skew: 1.2 },

    // The framing of the reference footage: at 200× its frame is about 500 µm
    // across and 265 down. Measured against its own scale bar, the euglenids in
    // it are 30–40 µm long — the small end of this species' range or just
    // under it — so a Euglena gracilis drawn to its measured 35–55 µm stands a
    // little larger in this frame than they do in that one, and that is left as
    // the species' difference rather than scaled away. The Chlorella field of
    // 48 would frame exactly one cell, and one cell is not what a culture
    // looks like.
    fieldUm: 260,
    // Down the optical axis, exactly, like every other wet mount here. See the
    // note on `view` in chlorella.js for what a tilt costs.
    view: [0, 0, 1],
    // Deeper than a standard coverslip gap, and that is read off the footage:
    // a gap of twenty micrometres under this objective would leave nothing
    // more than a couple of micrometres out of focus, and the reference is
    // half cells dissolved into a luminous haze. That takes a drop tens of
    // micrometres deep — but not eighty, tried first, which put three cells in
    // four into the haze where the footage has about half.
    depthUm: 60,

    // Euglena swims, so it does not settle. This is the first specimen in the
    // atlas whose cells are genuinely spread through the coverslip gap, which
    // is why so much of this field is dissolved at any one setting — and why
    // the fine focus matters more here than anywhere else.
    settling: { settled: 0.12, layerUm: 6, roughnessUm: 2.5 },

    // A crowded drop, denser than a batch culture. Batch cultures of this
    // species run from about a million to ten million cells per millilitre, and
    // 6e6 put a dozen cells in a 190 µm frame — a sparse slide. The reference
    // footage is nothing like that: counted off a frame, about three hundred
    // cells lie within reach of focus in 500 × 265 µm, which through a drop
    // this deep is a few times 10^7 per millilitre. Matched to the footage by
    // coverage, 5e7 left 21% of the frame as empty ground against its 22% —
    // and on screen that read as too many, a crush rather than a culture. So
    // this is a quarter fewer, which leaves about 31% of the ground clear. That
    // is still a concentrated sample — phototaxis gathers Euglena towards the
    // light and a pipette takes it from there — and it is stated as such rather
    // than passed off as a culture density. The count still follows from the
    // density, the block and the gap rather than being chosen.
    cellsPerMl: 3.75e7,

    // How the culture moves. E. gracilis swims at something like fifty to a
    // hundred micrometres a second and rolls about its long axis once or twice
    // a second; the front end circles the line of travel, so a swimmer wobbles.
    // A minority of cells in any mount have stopped and are doing metaboly
    // instead, and those barely travel.
    swimming: {
      umPerS: [45, 95],
      spinHz: [1, 2],
      wobbleRad: [0.06, 0.16],
      turnRadPerS: 0.22,
      workingFraction: 0.18,
      workingUmPerS: [0, 6],
    },
    // How far out of the plane of the slide a cell points: a Laplace spread of
    // this many radians. See orientation() in euglenoid.js.
    tiltSpread: 0.22,

    // They gather, but loosely — Euglena is motile and does not stick, so what
    // clumping there is comes from phototaxis and from the edge of the
    // coverslip rather than from adhesion.
    clumping: { fraction: 0.25, size: [2, 4] },

    // The chloroplasts: numerous discoid plates a few micrometres across,
    // lying under the pellicle. This is the character that separates a
    // euglenoid from a green coccoid at a glance — Chlorella has one cup, this
    // has many plates — though in a living cell in focus they read less as
    // countable discs than as a coarse mottle, packed together with the
    // granules between them. plateUm is the scale of that mottle.
    chloroplasts: { count: [8, 14], discUm: [3.5, 6.5], thickUm: [0.8, 1.4], plateUm: 3.8 },
    // How much of a ray's path through the pigmented part of the cell is
    // plastid. A green, light-grown Euglena is packed with them; the reference
    // shows cells green right through, not glassy bodies with discs inside.
    plastidFraction: 0.5,

    // Paramylon: β-1,3-glucan, and the reason anybody farms this organism.
    // Rod-like to ovoid, commonly two large ones flanking the nucleus with
    // smaller ones scattered. It is strongly refractile — more so than starch —
    // which is what makes the grains the brightest things in the cell.
    paramylon: { major: [1, 2], minor: [2, 6], majorUm: [4, 8], minorUm: [1.2, 2.6], granuleUm: 2.0 },

    // The pellicle strips, groove to groove, measured in this species (r50).
    // One of the finest striations in the genus, and right at this
    // objective's limit — see the note at the top of this file.
    pellicle: { stripUm: 0.24 },

    // The nucleus: large, central to posterior, and colourless, so it shows as
    // a paler region where the plastids stop.
    nucleusUm: 7,

    // The stigma: a patch of carotenoid granules beside the reservoir, at the
    // anterior. It is the one part of this organism that is not green, it is
    // conspicuous out of all proportion to its size, and it is how you tell
    // which end is the front.
    stigmaUm: 2.6,

    // One emergent flagellum from the anterior reservoir, between a quarter and
    // the whole body length (NIES). Drawn as what an exposure records of it: a
    // flagellum beating at tens of hertz is a faint envelope, not the clean line
    // a diagram draws, and at the thickness of an axoneme it is barely there.
    flagellum: { lengthFrac: [0.45, 0.9], widthUm: 0.4 },

    // The colour, as transmittances of one unit of pigment — the same contract
    // as every other specimen. See the note on CHLORELLA_GENUS.colour for why
    // this is a measurement and not a paint sample.
    //
    // Euglena carries chlorophyll a and b, like a green alga and unlike a
    // cyanobacterium, so the shape of the absorption starts from the Chlorella
    // one. It does not end there, and the blue channel is where it parts: a
    // euglenoid plastid carries a good deal more carotenoid per chlorophyll —
    // diadinoxanthin, β-carotene, neoxanthin — and carotenoids absorb exactly
    // the blue-green the chlorophylls let through. Left at the Chlorella blue,
    // the cells of the reference field measured 11 to 18 levels too blue at
    // every brightness while red and green sat within a few; the yellower
    // plate is that carotenoid, not a grade.
    colour: '#88bd30',

    // Opens in DIC, because that is how the reference footage shows it and
    // because it suits a body like this one: a spindle ten micrometres thick
    // and full of refractile plates and granules is all optical-path slope, and
    // DIC draws exactly that. See the DIC entry in microscope.js for what its
    // colours are and are not.
    filter: 'dic',

    seed: 4471,
    groups: [
      { title: 'The cell', ids: ['cellBody', 'pellicle', 'chloroplasts', 'paramylon'] },
      { title: 'Front end', ids: ['stigma', 'flagellum'] },
      { title: 'Movement', ids: ['metaboly'] },
    ],
  },
}
