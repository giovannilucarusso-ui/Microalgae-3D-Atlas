// Chlorella sorokiniana Shihira & Krauss 1965 — isolated by Sorokin in 1953 and
// first taken for a thermotolerant mutant of C. pyrenoidosa, then reinvestigated
// and given its own name. It is the one grown when the culture has to be fast
// and warm: about 9.2 doublings a day at 39 °C.
//
// Everything visible about it here is shared with C. vulgaris, deliberately, and
// the "Which species is this?" card says why. The one difference this instrument
// can carry is the size distribution, and it is carried at the same field of
// view as its sibling so that the difference is the organism's and not the
// framing's.
import { CHLORELLA_CARDS, CHLORELLA_GENUS } from './chlorella.js'

export default {
  id: 'chlorella-sorokiniana',
  name: 'Chlorella',
  latin: 'Chlorella sorokiniana',
  authority: 'Shihira & Krauss 1965',
  group: CHLORELLA_GENUS.group,
  structures: CHLORELLA_CARDS,

  exterior: {
    ...CHLORELLA_GENUS,
    caption:
      'A wet mount of a Chlorella sorokiniana culture, seen in transmitted light. The cells run smaller than C. vulgaris — which is the only difference this instrument can show, and only across a whole field.',
    // 2–4.5 µm measured on UTEX 1230; the species is reported to about 5.5 µm.
    // The drawn range takes the measured strain and allows the tail.
    cell: { minUm: 1.8, maxUm: 5.2, skew: 1.8 },
    autospores: { fraction: 0.1, min: 2, max: 8 },
    seed: 3907,
  },
}
