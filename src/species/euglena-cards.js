// The cards for Euglena gracilis.
//
// The confidence tiers read differently here from the Chlorella pair, and that
// is worth noticing rather than smoothing over. Chlorella's cards sit mostly at
// the second tier because almost nothing a light microscope can say about a
// two-micrometre sphere is a *species* character. Euglena gracilis is a
// laboratory workhorse fifty micrometres long: most of what is drawn here has
// been measured in this organism by name, and the rows say so.
//
// What stays at the bottom tier is what the instrument cannot carry — and the
// pellicle is the case worth reading. Its strips are measured at 240 nm groove
// to groove, this objective resolves 220, so they sit *at* the limit rather
// than under it or over it. That is why a real Euglena looks faintly ribbed and
// never crisply striped, and the card says that instead of the model drawing
// forty clean lines and calling it anatomy.
const VIEW = [0, 0, 1]

export const EUGLENA_CARDS = {
  cellBody: {
    view3d: 'filament',
    name: 'The cell',
    latin: 'cellula',
    confidence: 'species',
    what: 'A spindle, thirty-five to fifty-five micrometres long and seven to twenty-five wide, rounded at the front and drawn out to a point behind. There is no cell wall. What holds the shape is the pellicle — protein strips under the membrane — and because strips can slide on one another, the shape is not fixed: the same cell is a spindle one second and a fat cylinder the next.',
    role: 'That is the first thing to unlearn coming from the other specimens in this atlas. A Spirulina is a helix and a Chlorella is a sphere, and both of them are those things because a rigid wall makes them so. A Euglena has no wall, and its outline is a posture rather than a measurement — which is why the width given for the species runs from seven micrometres to twenty-five. The range is not sloppy observation. It is one organism, measured at different moments.',
    dimensions: [
      ['Length', '35–55 µm', 'species'],
      ['Width', '6–25 µm — the spread is metaboly, not variation', 'species'],
      ['Shape', 'elongated spindle; rounded anterior, tapered posterior', 'species'],
      ['Cell wall', 'none — a pellicle of protein strips instead', 'species'],
      ['Field of view', 'about 260 µm down — the framing of the reference footage at 200×', 'unverified'],
      ['In suspension', 'most of them — Euglena swims and does not settle', 'model'],
      ['Density drawn', 'about 4 × 10⁷ cells/mL — a concentrated drop, several times a batch culture', 'unverified'],
      ['Seen in', 'DIC by default: relief is the slope of the optical path, not a shadow', 'model'],
    ],
    sources: ['r49'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 240 },
  },

  pellicle: {
    view3d: 'filament',
    name: 'Pellicle',
    latin: 'pellicula',
    confidence: 'species',
    what: 'Overlapping protein strips lying under the plasma membrane, running from the front of the cell to the back in a shallow helix. Each strip has a ridge along one edge and a groove along the other, and neighbouring strips interlock — ridge into groove — so the whole sheet holds together while still being able to slide.',
    role: 'It is the reason this organism can be both definite in shape and able to change it, and it is the structure that replaces the cell wall the rest of this atlas has. It is also the clearest case in the atlas of a real structure sitting exactly on the instrument’s limit: in Euglena gracilis the strips are 240 nm from groove to groove — among the finest striation in the genus — and Abbe’s limit for this objective is 220 nm. Not comfortably resolved and not safely invisible: *at* the limit. So the strips are drawn at the contrast an objective passes that close to its cut-off — about three per cent — which at the working zoom is nothing at all, and closed in on a cell in focus is a faint ribbing that comes and goes with the fine focus. Not the crisp stripes a diagram would give it: if this view showed you countable strips it would be lying about the microscope.',
    caveat:
      'The striation is drawn as unresolved on purpose. At 240 nm against a resolution limit of 220 nm the strips are at the edge of what this objective can separate, so what is honest to show is a faint ribbing that comes and goes with focus — not a countable set of lines. Anything sharper would be a claim about the instrument rather than about the organism.',
    dimensions: [
      ['Strip width', '240 nm, groove to groove', 'species'],
      ['Arrangement', 'longitudinal to shallow helix, interlocking ridge and groove', 'species'],
      ['Function', 'shape, and the ability to change it', 'species'],
      ['Resolved here', 'barely — 240 nm against a limit of 220 nm, about 3% contrast', 'unverified'],
    ],
    sources: ['r49', 'r50'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 90 },
  },

  chloroplasts: {
    view3d: 'filament',
    name: 'Chloroplasts',
    latin: 'chloroplasti',
    confidence: 'species',
    what: 'Numerous chloroplasts — not one — scattered through the cell rather than lining its wall. In this species they are discoid to band-shaped plates a few micrometres across. Chlorophyll a and b, as in a green alga: Euglena is not one, but its plastid came from one, swallowed whole.',
    role: 'This is the character that separates a euglenoid from a green coccoid at a glance, and it is why a Euglena is *mottled* green where a Chlorella is evenly green. One cup of pigment lining a wall gives a cell that darkens smoothly from rim to middle; many plates, with paramylon granules packed between them, give a cell that is green right through but broken into darker and lighter patches, and the patches roll with the cell as it swims. In a living cell at this magnification they do not come apart into countable discs — the reference footage never shows that — and the plates are drawn as that mottle, at their measured size, rather than as a diagram of them.',
    dimensions: [
      ['Number', 'numerous — about ten', 'model'],
      ['Form', 'discoid, band-form or fusiform', 'species'],
      ['Pigments', 'chlorophyll a and b', 'species'],
      ['Arrangement', 'scattered through the cytoplasm, not parietal', 'species'],
      ['Origin', 'secondary endosymbiosis of a green alga', 'model'],
      ['Resolved here', 'as a mottle at the scale of the plates, not as countable discs', 'unverified'],
    ],
    sources: ['r49'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 110 },
  },

  paramylon: {
    view3d: 'filament',
    name: 'Paramylon',
    latin: 'paramylum',
    confidence: 'species',
    what: 'The storage carbohydrate, and the reason anyone farms this organism: β-1,3-glucan, laid down as solid granules rather than dissolved. Rod-like to ovoid, commonly two large ones lying either side of the nucleus with smaller ones scattered through the cell.',
    role: 'They are what gives a Euglena in focus its grain. A paramylon granule is dense, solid glucan with a refractive index well above the cytoplasm around it, and in differential interference contrast that step is drawn as relief: every small granule becomes a bead, bright on one side and shadowed on the other, and a cell full of them looks finely pebbled. The two large grains show as paler, smoother patches either side of the nucleus, where there is glucan instead of plastid. Unlike starch, paramylon is stored outside the plastid, which is a euglenoid character and not an incidental one.',
    dimensions: [
      ['Composition', 'β-1,3-glucan', 'species'],
      ['Form', 'rod-like to ovoid granules', 'species'],
      ['Number', 'commonly two large, flanking the nucleus, plus smaller ones', 'species'],
      ['Location', 'in the cytoplasm, not in the plastid', 'species'],
      ['Small granules', 'drawn about 2 µm across, packed through the cytoplasm', 'model'],
      ['Why it matters', 'it is the commercial product of this organism', 'model'],
    ],
    sources: ['r49'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 90 },
  },

  stigma: {
    view3d: 'filament',
    name: 'Stigma (eyespot)',
    latin: 'stigma',
    confidence: 'species',
    what: 'A patch of orange-red carotenoid granules beside the reservoir at the front of the cell. It is not an eye and it does not detect light: it shades the photoreceptor at the base of the flagellum, so that as the cell rotates while swimming the receptor is lit and shadowed in turn, and the cell can tell which way the light is coming from.',
    role: 'It is the only part of this organism that is not green, and out of all proportion to its size it is what your eye goes to first. It is also how you tell which end is the front — useful, because a swimming Euglena is a moving spindle and the two ends are not otherwise obvious. In this atlas it is the first pigment that is not a chlorophyll, and it absorbs where the chloroplasts transmit, which is why it reads as a hot spot rather than as a dark one.',
    dimensions: [
      ['Position', 'anterior, beside the reservoir', 'species'],
      ['Pigment', 'carotenoid granules', 'species'],
      ['Size', 'a few micrometres', 'model'],
      ['Function', 'a shade for the photoreceptor, not a detector', 'model'],
    ],
    sources: ['r49'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 70 },
  },

  flagellum: {
    view3d: 'filament',
    name: 'Flagellum',
    latin: 'flagellum',
    confidence: 'species',
    what: 'One emergent flagellum, from a reservoir at the anterior end. Its length runs from about a quarter of the body to the whole of it. A second, short flagellum stays inside the reservoir and never emerges.',
    role: 'It does not beat like an oar. The wave runs from base to tip and the cell moves forward while spinning slowly about its own long axis — which is what makes the eyespot useful, since a rotating cell sweeps its photoreceptor through the light. Drawn as what an exposure records of it: a flagellum beating at tens of hertz is not a line but the envelope the line sweeps, and at the thickness of an axoneme that envelope is barely there. The clean curved line a textbook draws is a fixed specimen, not a living one.',
    dimensions: [
      ['Number emergent', 'one', 'species'],
      ['Length', 'a quarter of the body to the whole of it', 'species'],
      ['Second flagellum', 'present but non-emergent', 'model'],
      ['Swimming speed', 'drawn at 45–95 µm/s', 'model'],
      ['Rotation', 'once or twice a second about the long axis, front end circling', 'model'],
      ['Resolved here', 'as a blur — it beats far faster than the eye integrates', 'unverified'],
    ],
    sources: ['r49'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 80 },
  },

  metaboly: {
    view3d: 'filament',
    name: 'Euglenoid movement',
    latin: 'metabolia',
    confidence: 'species',
    what: 'The cell changes shape as it goes: a wave of swelling runs from one end to the other, and the spindle becomes briefly a fat cylinder, then a spindle again. It is done by the pellicle strips sliding on one another, and it is a form of locomotion in its own right — a Euglena can work its way through sediment with no flagellum at all.',
    role: 'It is the reason the species description gives a width from six to twenty-five micrometres. That is not a population range being reported sloppily: it is one cell, at different moments of the same motion. This atlas draws organisms to measured dimensions, and metaboly is the case where a single measured dimension does not exist — so the cells here are drawn along that range rather than at a point on it, and they move through it. Not all at once, though: a cell swimming hard keeps its spindle, and it is the ones that have stopped — about a fifth of a mount, drawn here — that bulge and narrow in earnest.',
    dimensions: [
      ['Mechanism', 'pellicle strips sliding on one another', 'species'],
      ['Amplitude', 'the whole 6–25 µm width range of the species', 'species'],
      ['Function', 'locomotion, including through sediment', 'model'],
      ['Drawn here', 'as a travelling wave along the cell, strong in the cells that have stopped', 'unverified'],
    ],
    sources: ['r49', 'r50'],
    camera: { target: [0, 0, 0], dir: VIEW, distance: 200 },
  },
}
