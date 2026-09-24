// Volvox aureus Ehrenberg 1832 — the sixth specimen, and the first that is not
// a cell but a colony of them.
//
// It is here for the division of labour. A Volvox colony is a hollow ball of
// matrix with a few hundred to a few thousand cells in one layer at its surface,
// and those cells are of two kinds: many small somatic cells that swim and never
// divide, and a few large gonidia in the back half that make the next
// generation and never swim. It is the plainest case of germ and soma there is,
// in a lineage that became multicellular a little over two hundred million years
// ago, and it is the textbook's picture of how that happens.
//
// **Why aureus, and not carteri.** V. carteri is the laboratory's Volvox —
// genome, cell counts, embryology, flagellar hydrodynamics — and most of what
// the cards know about the genus comes from it, at the second tier. But the
// reference footage, labelled only "Volvox", shows colonies each carrying four
// to ten offspring in one half of the colony, and V. carteri carries sixteen; V.
// aureus, the commonest Volvox of lowland ponds (r66), carries four to twelve,
// in the posterior half (r65). The footage's organism is not identified by
// anyone, and the card "Which Volvox is this?" says what matches and what does
// not.
//
// **What does not match is the size.** Against the footage's own 100 µm bar its
// colonies are 70–150 µm across; Smith gives 400–600 µm for mature V. aureus. The
// atlas keeps the species' size, as it kept Euglena's, and frames the drop the
// way the footage frames it: a colony spans about four tenths of the frame's
// height. What the footage settles without any scale bar entering is kept as
// measured: the stage the colonies are at, how many offspring show, how crowded
// the drop is, how the light falls off from rim to middle, the ratio of a
// colony's size to the spacing of its cells, and how fast it turns.
//
// The reference is a clip labelled "Volvox, 200x" with a 100 µm scale bar, in
// darkfield, supplied by the project owner as a screen recording; its lower third
// is in the style of Journey to the Microcosmos (James Weiss). Frames were
// pulled out of it and measured, not copied — see docs/fonti/README.md.
import { volvoxCards } from './volvox-cards.js'
import { buildColonies } from '../volvocine.js'

const record = {
  id: 'volvox-aureus',
  name: 'Volvox',
  latin: 'Volvox aureus',
  authority: 'Ehrenberg 1832',
  group: 'Chlorophyta · Chlorophyceae',
  lineage: { domain: 'Eukaryota', supergroup: 'Archaeplastida', phylum: 'Chlorophyta' },
  tagline: 'A hollow ball of cells, most of which can only swim: the plainest division of labour between germ and soma there is.',
  // The second tier is the laboratory species, V. carteri, and the genus.
  tiers: {
    species: 'Measured in Volvox aureus',
    model: 'From Volvox carteri or the genus',
  },

  exterior: {
    group: 'Chlorophyta · Chlorophyceae',
    kind: 'colony-field',
    label: 'Wet mount · darkfield',
    caption:
      'A crowded drop of Volvox aureus in darkfield. Each colony is a hollow ball of cells: its rim a string of bright points where the plane of focus cuts it, its faces a green haze above and below, and in its back half the young colonies it will release. They turn slowly in place, as in the reference footage.',

    // The framing of the footage, at the species' size. In the footage a
    // colony spans 0.43 of the frame's height (120 of 276 µm on its own bar);
    // a V. aureus colony of 500 µm spans the same share of 1150.
    fieldUm: 1150,
    view: [0, 0, 1],
    // A cavity a little deeper than the largest colony, so the colonies are
    // not crushed and lie with their middles near one plane — which is why
    // nearly every rim in the footage is sharp at once. Only the small young
    // colonies have room to sit above or below, and they are the ones the
    // footage shows as ghosts.
    depthUm: 650,

    // Concentrated, and stated as such rather than passed off as a pond. The
    // footage's frame is 28 % empty ground across four frames, with its
    // colonies nearly touching; this density returns that coverage through a
    // frame of the drawn size (tools/check-volvox.mjs). A pond holds far fewer
    // — a sample like this is taken from where phototaxis has gathered them.
    coloniesPerMl: 6000,
    centred: true,

    colony: {
      // Mature colonies (r65).
      diameterUm: [400, 600],
      // Young ones, from the release size up (r65).
      youngDiameterUm: [175, 320],
      // 500–3200 in the species (r65). The footage's colonies hold roughly
      // 600 to 2800 — three readings of in-focus faces, counting points
      // against the area they cover, which no scale bar enters and which agree
      // no more closely than that. Drawn across the part of the species' range
      // the readings share, log-uniform.
      cells: [1000, 2400],
      // A somatic cell, drawn at 6 µm; compilations give 5–8.
      cellUm: 6,
    },

    offspring: {
      // Four to twelve gonidia, 18–22 µm, in the posterior half; the embryos
      // they make expand to 150–175 µm before they are released (r65).
      count: [4, 12],
      gonidiumUm: [18, 22],
      releaseUm: [150, 175],
      // Which stage the colonies are at, read off the footage: of thirteen
      // colonies in its frame, all but two carry offspring well into
      // expansion — a sixth to a third of the parent's diameter, their own
      // cells showing as fine dots when in focus — one carries small bright
      // bodies, and one shows none.
      stages: { juveniles: 0.84, embryos: 0.08, young: 0.08 },
      // The smallest juvenile drawn, as a share of its release size: the
      // footage's smallest are a sixth of their parent, which at the species'
      // sizes is about four tenths of 150–175 µm.
      juvenileFrom: 0.4,
      // And most are near that: in ten of the twelve colonies with young
      // showing, they are a sixth to a fifth of the parent's diameter, and only
      // one colony carries young of a third. The brood's age is drawn with
      // this skew towards the young end.
      ageSkew: 2.4,
      // A cell of an embryo just after cleavage, and of a juvenile about to be
      // released. Not measured; see the embryos card.
      cellUm: [1.2, 5],
    },

    // Swimming upwards in still water, as colonies do (r72): the anterior
    // pole tipped towards the objective by up to this angle.
    axis: { tiltRad: 0.55 },
    // One turn every ten to twenty seconds, read off the footage by following
    // juveniles round inside a colony; anticlockwise on screen.
    spin: { radPerS: [0.315, 0.625], sense: 1 },
    // In a drop this crowded the colonies do not travel: they stray a few
    // micrometres from where they lie and turn in place, as in the footage.
    drift: { wanderUm: [2, 6], rate: [0.04, 0.12] },
    // Bacteria and fine detritus. Colourless, so white in darkfield.
    motes: { perMl: 30000, diameterUm: [0.5, 2.2] },

    motion: {
      label: 'Swimming',
      note: 'Each colony turns about its own axis, about once every ten to twenty seconds, as in the reference footage: in a drop this crowded they turn in place rather than travelling. Switch it off to hold the drop still and rack the focus through a colony.',
    },

    // The chloroplast's colour, as a transmittance at one micrometre of it.
    // No brightfield reference was used for this specimen, so it is not
    // measured: it is the chlorophyll a and b shape the atlas gives every
    // green alga — red and blue well down, blue somewhat further — at the
    // depth that returns the footage's greens when the light a cell scatters
    // has crossed its own plastid on the way out. See the somatic cells card.
    colour: '#c4ee8c',
    band: [0.09, 0.06, 0.03],
    bandWeak: [0.12, 0.12, 0.1],

    // Darkfield, because that is the footage.
    filter: 'darkfield',

    seed: 6131,
    groups: [
      { title: 'The colony', ids: ['colony', 'somaticCells', 'matrix'] },
      { title: 'Reproduction', ids: ['gonidia', 'embryos'] },
      { title: 'The organism', ids: ['swimming', 'germSoma', 'identification'] },
    ],
  },
}

// The cards, aimed at the colony the population centres on the stage: its size
// is drawn from the seed, so the card about the cells finds its rim by asking
// the population rather than by remembering a number that was true once.
const centred = buildColonies({ ...record.exterior, coloniesPerMl: 0 }).colonies[0]
record.structures = volvoxCards({ rimUm: centred.radiusUm })

export default record
