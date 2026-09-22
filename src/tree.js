// The tree the atlas hangs its specimens on.
//
// A species record says where it sits — `lineage: { domain, supergroup, phylum }`
// — and its genus is the first word of its Latin name. This file holds the rest:
// the order the lineages are drawn in, the lineages the atlas does not cover yet,
// and the endosymbioses that moved plastids between them. The landing page draws
// the tree from the two together, so adding a specimen to a lineage already
// listed here is adding a species file and nothing else.
//
// **It is a schematic, and says so.** Four ranks are drawn — domain, supergroup,
// phylum, genus — and everything between them is skipped. The eukaryotic
// supergroups are those of Burki et al. (r62), and they fan out from a single
// point because the order in which they branched is not resolved: a drawing that
// nested them would be claiming a result nobody has. Archaea are left out, since
// none of them photosynthesise with chlorophyll; the tree is of the lineages an
// atlas of microalgae could ever draw from.
//
// A lineage with no specimen under it is drawn as an empty slot. That is on
// purpose: the gaps are the atlas's to-do list, and each one links to the form
// for proposing an organism.

export const RANKS = ['domain', 'supergroup', 'phylum', 'genus', 'species']

// In drawing order, which is also the order round the landing page's circle.
// `common` is the name a reader knows the lineage by, where it has one.
// `more` names what else a covered lineage holds, and draws one more empty slot
// for it, so that a phylum with one specimen does not read as a finished one.
export const LINEAGES = [
  {
    name: 'Bacteria',
    rank: 'domain',
    children: [
      {
        name: 'Cyanobacteria',
        rank: 'phylum',
        more: { name: 'Other cyanobacteria', note: 'Nostoc, Synechococcus…' },
      },
    ],
  },
  {
    name: 'Eukaryota',
    rank: 'domain',
    children: [
      {
        name: 'Archaeplastida',
        rank: 'supergroup',
        children: [
          { name: 'Chlorophyta', rank: 'phylum', common: 'green algae' },
          { name: 'Rhodophyta', rank: 'phylum', common: 'red algae' },
        ],
      },
      { name: 'Discoba', rank: 'supergroup', children: [{ name: 'Euglenozoa', rank: 'phylum' }] },
      { name: 'Haptista', rank: 'supergroup', children: [{ name: 'Haptophyta', rank: 'phylum' }] },
      {
        name: 'SAR',
        rank: 'supergroup',
        common: 'stramenopiles, alveolates, rhizarians',
        children: [
          { name: 'Bacillariophyta', rank: 'phylum', common: 'diatoms' },
          { name: 'Dinoflagellata', rank: 'phylum', common: 'dinoflagellates' },
        ],
      },
      { name: 'Cryptista', rank: 'supergroup', children: [{ name: 'Cryptophyta', rank: 'phylum', common: 'cryptophytes' }] },
    ],
  },
]

// Where the plastids of the specimens came from, as arrows from the lineage
// that was taken in to the lineage that took it. Both ends name a lineage above
// or a genus in the atlas.
//
// The red-algal arrow is drawn from red algae to the haptophytes and labelled as
// debated rather than routed through anyone: Keeling (r61) gives a single uptake
// of a red alga shared by the "chromalveolates", Stiller et al. (r63) a chain of
// three, the last of them an ochrophyte taken in by the haptophytes. The two
// agree on where the plastid began and not on how it arrived.
//
// The nitroplast's date is the divergence of the UCYN-A lineages, ~91 million
// years ago (r64): a date inside the partnership, which is therefore at least
// that old — not the date it began.
export const ENDOSYMBIOSES = [
  {
    from: 'Cyanobacteria',
    to: 'Archaeplastida',
    kind: 'primary',
    label: 'Primary plastid',
    note: 'a cyanobacterium, taken in once by the ancestor of green and red algae',
    sources: ['r61'],
  },
  {
    from: 'Chlorophyta',
    to: 'Euglena',
    kind: 'green',
    label: 'Secondary plastid',
    note: 'a whole green alga, engulfed',
    sources: ['r61'],
  },
  {
    from: 'Rhodophyta',
    to: 'Haptophyta',
    kind: 'red',
    label: 'Plastid of red-algal origin',
    note: 'by a route still debated',
    sources: ['r61', 'r63'],
  },
  {
    from: 'Cyanobacteria',
    to: 'Braarudosphaera',
    kind: 'nitro',
    label: 'Nitroplast',
    note: 'the cyanobacterium UCYN-A, whose lineages split ~91 million years ago',
    sources: ['r54', 'r64'],
  },
]

// What the drawing of the tree itself rests on.
export const TREE_SOURCES = ['r62', 'r61']
