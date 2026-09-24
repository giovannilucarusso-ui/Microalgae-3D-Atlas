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
// the cards know about how a Volvox works comes from it, at the second tier.
// V. aureus is the one a pond gives you: the most commonly reported species of
// the genus, cosmopolitan in lowland fresh water (r66), with four to twelve
// young in each colony where V. carteri has sixteen (r65). So the specimen is
// the common one, and the laboratory species lends it what has only been
// measured there.
//
// Everything the species description gives is drawn to it: the colony's size,
// its cell count, the number, size and place of its gonidia, the size its young
// reach before they are released (r65). What a description cannot give — how
// crowded a drop is, which stage its colonies are at, how the drop is framed —
// is a choice, made here, and marked on the cards as not established.
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
      'A crowded drop of Volvox aureus in darkfield. Each colony is a hollow ball of cells: its rim a string of bright points where the plane of focus cuts it, its faces a green haze above and below, and in its back half the young colonies it will release. Each turns slowly about its own axis. Pick a structure below, or click a colony, to read about it.',

    // How much of the slide is in frame: enough for a few mature colonies,
    // each spanning about four tenths of the frame's height — close enough to
    // see the cell layer as points, wide enough to see a drop and not one
    // colony. A framing, not a measurement.
    fieldUm: 1150,
    view: [0, 0, 1],
    // A cavity a little deeper than the largest colony, so the colonies are
    // not crushed and lie with their middles near one plane, and their rims
    // come into focus together. Only the small young colonies have room to
    // sit above or below it.
    depthUm: 650,

    // Concentrated, and stated as such rather than passed off as a pond: the
    // colonies nearly touch, and about a quarter of the frame is empty ground.
    // A pond holds far fewer — a sample like this is taken from where
    // phototaxis has gathered them to the lit side of a jar.
    coloniesPerMl: 6000,
    centred: true,

    colony: {
      // Mature colonies (r65).
      diameterUm: [400, 600],
      // Young ones, from the release size up (r65).
      youngDiameterUm: [175, 320],
      // 500–3200 in the species (r65). Drawn across the middle of that range,
      // log-uniform, so a colony has a thousand to two and a half thousand.
      cells: [1000, 2400],
      // A somatic cell, drawn at 6 µm; compilations give 5–8 (r66).
      cellUm: 6,
    },

    offspring: {
      // Four to twelve gonidia, 18–22 µm, in the posterior half; the embryos
      // they make expand to 150–175 µm before they are released (r65).
      count: [4, 12],
      gonidiumUm: [18, 22],
      releaseUm: [150, 175],
      // Which stage the colonies are at. A drop in the middle of its asexual
      // cycle: most colonies carrying juveniles as they expand, a few with
      // embryos still cleaving, a few young colonies whose gonidia have not
      // divided. A choice, and the cards say so.
      stages: { juveniles: 0.84, embryos: 0.08, young: 0.08 },
      // The smallest juvenile drawn, as a share of its release size, and a
      // skew of the brood's age towards it: most broods are drawn early in
      // their expansion, a few close to release.
      juvenileFrom: 0.4,
      ageSkew: 2.4,
      // A cell of an embryo just after cleavage, and of a juvenile about to be
      // released. Not measured; see the embryos card.
      cellUm: [1.2, 5],
    },

    // Swimming upwards in still water, as colonies do (r72): the anterior
    // pole tipped towards the objective by up to this angle.
    axis: { tiltRad: 0.55 },
    // Turning about the axis. V. carteri colonies 150 µm in radius turn at
    // about a radian a second, and larger ones more slowly (r80); these are
    // larger, so slower — a turn every eight to eighteen seconds. All in one
    // sense, since the flagella of every colony beat at the same slant;
    // which sense is not established.
    spin: { radPerS: [0.35, 0.8], sense: 1 },
    // In a drop this crowded the colonies do not travel: they stray a few
    // micrometres from where they lie and turn in place.
    drift: { wanderUm: [2, 6], rate: [0.04, 0.12] },
    // Bacteria and fine detritus. Colourless, so white in darkfield.
    motes: { perMl: 30000, diameterUm: [0.5, 2.2] },

    motion: {
      label: 'Swimming',
      note: 'Each colony turns about its own axis, once every eight to eighteen seconds; in a drop this crowded they turn in place rather than travelling. Switch it off to hold the drop still and rack the focus through a colony.',
    },

    // The chloroplast's colour, as a transmittance at one micrometre of it.
    // Not measured for this species: it is the chlorophyll a and b shape the
    // atlas gives every green alga — red and blue well down, blue somewhat
    // further — at a depth that makes the light a cell scatters green once it
    // has crossed its own plastid on the way out. See the somatic cells card.
    colour: '#c4ee8c',
    band: [0.09, 0.06, 0.03],
    bandWeak: [0.12, 0.12, 0.1],

    // Darkfield: it lights the colony by its cells and leaves the clear matrix
    // dark, which is the organism's own structure made visible. Brightfield and
    // the Rheinberg pairs are offered too.
    filter: 'darkfield',

    seed: 6131,
    groups: [
      { title: 'The organism', ids: ['organism', 'habitat', 'germSoma'] },
      { title: 'The colony', ids: ['colony', 'somaticCells', 'matrix'] },
      { title: 'Reproduction', ids: ['gonidia', 'embryos', 'sexual'] },
      { title: 'Behaviour', ids: ['swimming'] },
      { title: 'Telling them apart', ids: ['identification'] },
    ],
  },
}

// The cards, aimed at the colony the population centres on the stage: its size
// is drawn from the seed, so the card about the cells finds its rim by asking
// the population rather than by remembering a number that was true once.
const centred = buildColonies({ ...record.exterior, coloniesPerMl: 0 }).colonies[0]
record.structures = volvoxCards({ rimUm: centred.radiusUm })

export default record
