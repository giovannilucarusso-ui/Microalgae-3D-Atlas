// Chlorella vulgaris Beijerinck 1890 — the type species of the genus, and the
// one every "chlorella" on a supplement label is nominally referring to.
import { CHLORELLA_CARDS, CHLORELLA_GENUS } from './chlorella.js'

export default {
  id: 'chlorella-vulgaris',
  name: 'Chlorella',
  latin: 'Chlorella vulgaris',
  authority: 'Beijerinck 1890',
  group: CHLORELLA_GENUS.group,
  structures: CHLORELLA_CARDS,

  exterior: {
    ...CHLORELLA_GENUS,
    caption:
      'A wet mount of a Chlorella vulgaris culture, seen in transmitted light. Most of the field is out of focus at any one setting — rack the fine focus to reach the rest of it.',
    // The literature spans 2–10 µm for this species and reports 2–5 µm as the
    // usual observation. The drawn range stops at 8: a field built to the
    // absolute extreme would put a handful of cells in it twice the size of
    // anything a culture normally shows, and the size distribution is the one
    // thing this view is being asked to carry honestly.
    cell: { minUm: 2, maxUm: 8, skew: 1.8 },
    autospores: { fraction: 0.1, min: 2, max: 8 },
    seed: 5150,
  },

  // No interior. Most species in this atlas will not have one, and the
  // confidence tiers are what make that an honest entry rather than an empty
  // one: what is known about the outside of this organism is stated, and what
  // is not resolved by the instrument drawing it is stated too.
}
