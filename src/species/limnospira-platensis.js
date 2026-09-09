// Spirulina — the atlas's first specimen.
//
// A species record is what the microscope is pointed at. It carries the
// organism and nothing about the rendering: no optics, no camera position, no
// blur. Those belong to `src/microscope.js`, because every species in this
// atlas is looked at through the same instrument, and a species that needed its
// own optics to look right would be evidence the optics are wrong.
//
// The measurements are not repeated here. They live in `src/science.js` with the
// reasoning and the sources that justify them, and this record points at them —
// two copies of a number are two numbers, and one of them goes stale.
import { GROUPS, STRUCTURES } from '../structures.js'
import {
  CELL,
  LIFE_CYCLE,
  SPECIES_HELIX,
  HELIX_SPECIES_RANGE,
  STRAIN,
  TRICHOME,
} from '../science.js'

export default {
  id: 'limnospira-platensis',
  name: 'Spirulina',
  latin: 'Limnospira (Arthrospira) platensis',
  group: 'Cyanobacteria',
  // The cards. They stay in structures.js, where they sit beside the shared
  // bibliography every species draws on; the record points at them, the way it
  // points at science.js for the measurements.
  structures: STRUCTURES,

  // The outside: what a light microscope shows, which is where every species in
  // the atlas starts. `kind` chooses the body generator; everything under it is
  // that generator's own parameters, so a coccoid or a chain-forming diatom
  // brings a different `kind` and different fields rather than bending these.
  exterior: {
    kind: 'helical-trichome',
    label: 'Filament',
    caption:
      'One filament in a wet mount, about 110 cells long, seen in transmitted light. Pick a cell to go inside.',
    // How much slide is in frame, in µm. The microscope derives the working
    // distance, the clipping planes, the zoom limits and the fine-focus travel
    // from this one number.
    fieldUm: 451.3,
    // How deep the specimen lies along the line of sight, which is what the fine
    // focus has to be able to cross. The helix is 160 µm along its axis and 38
    // across; from this camera that projects to about 78 µm of depth.
    depthUm: 78,
    // Where the camera sits, as a direction. Pulled off the axis so the helix
    // reads as a helix rather than as a row of discs.
    view: [299, 160, 518],
    helix: SPECIES_HELIX,
    speciesRange: HELIX_SPECIES_RANGE,
    strain: STRAIN,
    trichome: TRICHOME,
    cell: CELL,
    lifeCycle: LIFE_CYCLE,
    // The apical cap that separates this genus from Arthrospira proper. A
    // species without one omits the key rather than setting it false: the
    // absence of a character and a character absent are different statements,
    // and only the first belongs in a record.
    calyptra: true,
    groups: GROUPS.filament,
  },

  // The inside. A species may sit in this atlas with an exterior and no
  // interior at all — most will, for a long time — and the confidence tiers are
  // what make that honest rather than empty. Spirulina is the one that has one.
  interior: {
    kind: 'cyanobacterial-cutaway',
    label: 'Cell interior',
    caption:
      'One cell, cut open: a wedge and the cell above it have been removed, so you look down onto the lower cross-wall.',
    fieldNm: 11989,
    view: [6660, 13660, 10460],
    groups: GROUPS.cell,
  },
}
