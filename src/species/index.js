// The atlas's specimens.
//
// One entry per organism. Adding one is adding a file here and listing it — the
// microscope, the optics and the shared machinery do not change, which is the
// property this registry exists to protect.
import limnospiraPlatensis from './limnospira-platensis.js'
import chlorellaVulgaris from './chlorella-vulgaris.js'
import chlorellaSorokiniana from './chlorella-sorokiniana.js'

export const SPECIES = [limnospiraPlatensis, chlorellaVulgaris, chlorellaSorokiniana]

export const DEFAULT_SPECIES = limnospiraPlatensis.id

export function speciesById(id) {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0]
}
