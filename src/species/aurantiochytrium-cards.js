// The cards for Aurantiochytrium mangrovei, strain RCC893.
//
// Three kinds of evidence sit on these cards, and the tiers keep them apart.
// The species' own literature is thin but primary: the protologue (r80), the
// paper that moved it to Aurantiochytrium (r81), two studies of Hong Kong
// strains (r85, r86) and the collection's record of this strain (r82). The
// culture drawn is measured on the project owner's photograph (r96), which is
// private: the numbers are on the cards and in the anatomical bill of
// materials, the image is nowhere. And where the species has not been looked at,
// the second tier is the sister species A. limacinum — the type of the genus
// and far better studied — or the thraustochytrids at large.
//
// The cameras are read out of the drawn population rather than typed in: the
// cell card flies to an isolated cell of the median size near the middle of
// the stage, the groups card to a group of four to seven, the oil card to an
// isolated larger cell. A change to the seed or to the rules moves the camera
// with the cells.
//
// The plane of focus follows the camera's target, so where a card aims in depth
// is where it focuses. The cell and group cards aim at the slide's own plane,
// where the objective opens, so they show what the photograph shows; the oil
// card aims at the middle of its cell, where the droplets are.
import { workingDistance } from '../microscope.js'
import { buildCycle, buildThraustochytrids, typicalCell, typicalGroup } from '../thraustochytrid.js'

const VIEW = [0, 0, 1]
// The brightfield objective's field of view, in degrees; see microscope.js.
const FOV = 40

export function AURANTIOCHYTRIUM_CARDS(exterior) {
  const population = buildThraustochytrids(exterior)
  const home = workingDistance(exterior.fieldUm, FOV)
  // A camera framing `across` micrometres of slide round a point, focused at
  // the depth `z`.
  const framing = (at, across, z = 0) => ({
    target: [at.x, at.y, z],
    dir: VIEW,
    distance: workingDistance(across, FOV),
  })
  const cell = typicalCell(population)
  const group = typicalGroup(population)
  const big = typicalCell(population, 17)
  // Where the life cycle plays, focused through the middle of its grown cell.
  const cycle = buildCycle(exterior, population)
  const whole = { target: [0, 0, 0], dir: VIEW, distance: home }

  return {
    cellBody: {
      view3d: 'filament',
      name: 'The vegetative cell',
      latin: 'thallus',
      confidence: 'species',
      what: 'A colourless sphere with a thin wall, full of oil. Three days into a rich medium the cells of this culture are about thirteen micrometres across in the middle of their range, and run from under six to over twenty-eight. Each rests on the slide, with its middle one radius above the glass.',
      role: 'Like every unstained cell in brightfield it is a phase object: what draws it is not a colour but its edge. With the plane of focus a little below the cells, as in the reference photograph, every margin has a dark rim inside and a bright line outside — the Becke line — and the oil inside turns the body into a cobble of small lenses. How big a cell grows depends on what it is fed. The protologue measured 6–9 µm on pine pollen in sea water and 5–12 µm in a nutrient medium; a strain from Hong Kong reached 10–45 µm at ten per cent glucose. This culture, in YEP at two per cent, lies between them, and the sizes drawn are the 230 cells measured on the photograph, drawn from directly rather than from a fitted curve.',
      dimensions: [
        ['Shape', 'globose or subglobose; thin-walled', 'species'],
        ['Young cell (encysted zoospore)', '3.7–4.4 µm', 'species'],
        ['Mature cell on pine pollen in sea water', '6.3–9.2 µm, about 24 h after the zoospore settles', 'species'],
        ['Mature cell in a nutrient medium', '5.0–12.0 µm', 'species'],
        ['Strain MP2 at 10 % glucose', '10.6–45.1 µm, mean 15.6 ± 6.1 µm (n = 35)', 'species'],
        ['RCC893 in the collection’s record', '“length 20 µm” — the one cell of its micrograph, 19.9 µm on the scale bar', 'species'],
        ['RCC893 after 72 h in YEP', 'median 13.2 µm; 9.5–17.8 µm from the 5th to the 95th percentile; 5.7–28.4 µm at the extremes (n = 230)', 'species'],
        ['Measured on', 'each cell’s edge, between the dark rim and the bright line, at 1.32 px/µm', 'species'],
        ['Ectoplasmic net', 'from a single point of the cell; poorly developed in the genus and not visible at 200×', 'species'],
        ['Wall', `thin; its thickness has not been measured — drawn as ${exterior.wallUm} µm`, 'unverified'],
        ['Refractive index', 'not measured — protoplasm drawn at 1.36 in a medium of 1.341', 'unverified'],
        ['Plane of focus', `${exterior.focus.aboveGlassUm} µm above the slide, just under the middle of a cell of the median size — fitted to the edges of the photograph’s 13–16 µm cells`, 'unverified'],
      ],
      sources: ['r96', 'r80', 'r85', 'r82', 'r81'],
      camera: framing(cell, 42),
    },

    lipidBodies: {
      view3d: 'filament',
      name: 'Lipid bodies',
      latin: 'corpora lipidica',
      confidence: 'species',
      what: 'Oil, in droplets one to two micrometres across, packed through the whole cell. It is why the organism is grown: a third to a half of its dry mass is lipid, and the dominant fatty acid of its genus is DHA, the omega-3 of fish oil.',
      role: 'They are what gives the cells their texture under the objective. Oil at 1.47 in protoplasm at 1.36 makes every droplet a small lens, and each is drawn at its own depth in the cell: those above the plane of focus come out with dark centres and those below with bright ones, and racking the focus turns the one into the other. How much of the cell they fill has not been measured in this strain; drawn, they are about a fifth of its volume. How big they are depends on the culture: about a micrometre in the collection’s micrograph of the strain, coarser in the three-day culture drawn here, whose texture at 200× has a grain of one and a half to three micrometres. In a Hong Kong strain of the species fed more glucose some cells carry so much oil that they float when the culture is centrifuged, and their droplets are larger and more unsaturated. In fresh water the cell bursts and the droplets spill out.',
      dimensions: [
        ['Content', 'cells “filled with numerous lipid bodies” (strain MP2)', 'species'],
        ['Lipid', '38.1–53.2 % of the freeze-dried biomass', 'species'],
        ['Main fatty acid', 'DHA dominant, arachidonic acid minor — a character of the genus', 'species'],
        ['Size in RCC893', 'about 1 µm (0.8–1.2) across, throughout the cell — on the collection’s micrograph', 'species'],
        ['In the culture drawn', 'coarser: the texture at 200× has a grain of 1.5–3 µm', 'species'],
        ['Size in MP2', '1.5–4 µm, largest towards the margin, after 48 h at 1 % glucose — on Wong et al.’s fig. 2a', 'species'],
        ['Floating cells', 'at 6–10 % glucose many MP2 cells float after centrifugation; their droplets are larger and more unsaturated', 'species'],
        ['In fresh water', 'the cell bursts and releases its lipid bodies', 'species'],
        ['Refractive index', 'above 1.46 in the lipid bodies of an oleaginous microalga; drawn at 1.47', 'model'],
        ['Share of the cell', 'not measured in this strain — drawn at about a fifth of the volume', 'unverified'],
        ['Drawn', 'droplets 0.8–2.1 µm, in layers turned at random, a little larger towards the margin', 'unverified'],
        ['Contrast', 'saturated where the first-order optics would overstate it, to the texture of the collection’s micrograph', 'unverified'],
      ],
      sources: ['r85', 'r86', 'r82', 'r81', 'r91'],
      camera: framing(big, 30, big.z),
    },

    colour: {
      view3d: 'filament',
      name: 'Colour',
      latin: 'color',
      confidence: 'species',
      what: 'Almost none. The genus is named for an orange thallus — its cells make carotenoids all the way to astaxanthin — but a single cell of this strain under the microscope is nearly colourless, and the colour of its colonies has not been recorded.',
      role: 'The reference photograph shows the cells clearly yellow inside and faintly violet outside, and nearly all of that is the photograph’s objective rather than the cell. Summed over a cell and the halo round it, the blue channel loses 1.6 % of the light against 0.3–0.8 % for red and green: most of the yellow inside is blue light moved outwards by the objective’s colour error, not taken by the cell. What is left — a few per cent of blue — is also what the collection’s micrograph of the strain shows, taken on another microscope, and it is what is drawn: carotenoids, dissolved in the oil. The orange of the genus is the colour of a colony, a thick mass of cells seen together; whether this strain’s colonies are orange nobody has written down.',
      caveat:
        'The colour on screen is what this atlas’s objective makes of the cells, and it has less colour error than the one that took the reference photograph: the photograph’s cells are yellower for that reason alone. Under a Rheinberg filter the colour is no longer a transmittance at all.',
      dimensions: [
        ['Thallus of the genus', 'orange: astaxanthin, phoenicoxanthin, canthaxanthin, β-carotene', 'species'],
        ['Colonies of RCC893', 'not recorded — the collection leaves the colour unspecified', 'unverified'],
        ['Cell interior at 200×', '0.93–0.96 of the field in red, 0.96–0.99 in green, 0.82–0.86 in blue — the reference photograph', 'species'],
        ['Summed over cell and halo', 'blue loses 1.6 %, red and green 0.3–0.8 %', 'species'],
        ['On the collection’s micrograph', 'interior 1.04 / 1.04 / 0.98 of its field — blue 5 % under green', 'species'],
        ['Drawn', `a micrometre of oil passes ${exterior.lipid.perUm.map((v) => (v === 1 ? 'all' : v)).join(', ')} of the red, green and blue`, 'unverified'],
        ['Carotenoid synthesis', 'a single fused crtIBY gene, acquired by horizontal transfer', 'model'],
      ],
      sources: ['r81', 'r82', 'r96', 'r94'],
      camera: framing(cell, 60),
    },

    groups: {
      view3d: 'filament',
      name: 'Diads, tetrads and clumps',
      latin: 'divisio binaria',
      confidence: 'species',
      what: 'Most cells lie in pairs and small groups. A cell divides in two, and again, and the daughters stay together, pressed flat against each other where they touch or lying a micrometre or two apart.',
      role: 'The protologue gives the sequence — a diad, a tetrad, six, seven or eight cells, often twelve — and on pine pollen the daughters do not grow, so a cluster stays the size of the cell it came from. This culture shows the other behaviour the protologue records in a nutrient medium, cells dividing inside an intact wall and growing where they are into clusters: its cells in groups are as large as its cells alone. The collection’s record of the strain says simply “clumps”, and the describers of the genus found its colonies small, like fine grains on the bottom of a flask. At fourteen hundred cells to the square millimetre some contacts are also chance, and the drawing lets them happen rather than adding them twice.',
      dimensions: [
        ['Division', 'binary: a diad, a tetrad, 6, 7 or 8 cells, often 12', 'species'],
        ['On pine pollen', 'the daughters do not grow; the cluster stays the size of the mother cell', 'species'],
        ['In a nutrient medium', 'rarely, a wall that stays whole: 4–32 cells growing in place into large clusters', 'species'],
        ['Colonies of the genus', 'small; in liquid medium, fine grains on the bottom of the flask', 'species'],
        ['RCC893, collection record', 'cell assemblage: clumps', 'species'],
        ['In the reference culture', '36 % of cells touching another, 61 % within 2.4 µm, 74 % within 3.9 µm; groups mostly of 2–7, a few of about 15', 'species'],
        ['Cells in groups', 'as large as cells alone: median 12.7 against 12.6 µm (interiors, n = 378)', 'species'],
        ['Drawn', '60 % of cells in division groups, the rest scattered: 38, 58 and 72 % at the same three distances', 'unverified'],
        ['Where two cells press', 'a flat face along the plane of equal power between their spheres', 'unverified'],
      ],
      sources: ['r80', 'r81', 'r82', 'r96'],
      camera: group ? framing(group, Math.max(40, group.reach * 2.6)) : whole,
    },

    culture: {
      view3d: 'filament',
      name: 'Three days in YEP',
      latin: 'cultura',
      confidence: 'species',
      what: 'The slide is a drop of the owner’s culture after 72 hours in YEP — filtered sea water with glucose, peptone and yeast extract — grown in the dark at 24 °C, the conditions under which the strain is grown for its oil.',
      role: 'By three days a culture like this has mostly stopped dividing and is filling its cells with oil: in another strain of the species, division ends at about a day and the lipid accumulates after. The zoospores the culture released in its first days had gone by the time of the photograph, so none are drawn; nor are the thin rod-shaped bacteria the photograph also holds, which are the culture’s and not the organism’s. The density on the slide, about fourteen hundred cells to the square millimetre, is the same order as the twenty million to the millilitre of the strain’s flask cultures, depending on how deep the mount is.',
      dimensions: [
        ['Strain', 'RCC893 (CKM1), Roscoff Culture Collection', 'species'],
        ['Medium', 'YEP: filtered natural sea water at pH 6.5, glucose 20 g/L, peptone 2 g/L, yeast extract 2 g/L', 'species'],
        ['Conditions', '24 ± 2 °C, in the dark', 'species'],
        ['In the collection', 'YEP at 22 °C, transferred every four weeks', 'species'],
        ['Age of the culture', '72 h', 'species'],
        ['Zoospores', 'present in the first days, none at 72 h', 'species'],
        ['Bacteria', 'thin rods, present — not drawn', 'species'],
        ['Density on the slide', 'about 1400 cells per mm²', 'species'],
        ['In a flask', 'about 2 × 10⁷ cells per mL', 'species'],
        ['If the mount is 20 µm deep', 'about 7 × 10⁷ cells per mL', 'unverified'],
        ['When division stops (strain BL10)', 'around 24 h, after which lipid accumulates', 'species'],
      ],
      sources: ['r83', 'r82', 'r84', 'r92', 'r96'],
      camera: whole,
    },

    zoospores: {
      view3d: 'filament',
      name: 'Zoospores',
      latin: 'zoosporae',
      confidence: 'species',
      what: 'Not in the culture drawn, which had released its zoospores in its first days and had none left at 72 hours — but they are in the life cycle: switch it on in the panel. Small elliptical swimmers with two unequal flagella, and every cell can make them.',
      role: 'On pine pollen in sea water the protologue watched each cell of a cluster round up, grow two flagella and swim away, one after another, with no sporangium round it. In a nutrient medium the cell instead loses its thin wall, turns amoeboid and cleaves into two to thirty-two. Strains from Hong Kong’s mangroves release them mostly at low salinity — as the tide goes out — and they swim fast, in straight lines with occasional turns: in the life cycle they leave at that speed, and are out of a close view within a second or two.',
      dimensions: [
        ['In the culture drawn', 'none left at 72 h — the life cycle shows them', 'species'],
        ['Shape', 'elliptical, with a slight depression at the front', 'species'],
        ['Size', '4.1–4.8 × 2.6–3.3 µm', 'species'],
        ['Flagella', 'a long anterior and a shorter posterior, inserted at the side', 'species'],
        ['On pine pollen', 'each cell of the cluster becomes a zoospore; no sporangium', 'species'],
        ['In a nutrient medium', 'the cell loses its wall and cleaves like an amoeba into 2–32', 'species'],
        ['Speed (strain KF6)', 'up to 151 µm/s along the path, 125 µm/s in a straight line, at 7.5 ‰', 'species'],
        ['When they form', 'mostly at low salinity, 0–15 ‰', 'species'],
        ['In A. limacinum', 'ovoid and larger, 5.0–7.0 × 6.0–8.5 µm', 'model'],
        ['Flagellar lengths', 'not measured in the species — drawn about twice and once the body', 'unverified'],
        ['Beat', 'not measured — drawn as a slow travelling wave', 'unverified'],
      ],
      sources: ['r80', 'r86', 'r81', 'r96'],
      camera: framing(cycle.spot, 60, cycle.glassZ + cycle.R),
    },

    lifeCycle: {
      view3d: 'filament',
      name: 'From zoospore to zoosporangium',
      latin: 'cyclus vitae',
      confidence: 'species',
      what: 'The cycle the culture went through in its first days, which the life-cycle switch plays in a clearing near the middle of the stage: a zoospore settles and rounds up, the cyst grows into a cell full of oil, its protoplast cleaves inside the wall into sixteen zoospores, and the wall bursts and lets them out.',
      role: 'Every cell on the slide can do this, and a culture that has had its fill stops doing it: by three days there were no zoospores left in the owner’s flask. The protologue watched two versions of the release. On pine pollen in sea water the cells of a cluster round up, the wall round them gradually disintegrates and each cell swims off as a zoospore, one after another. In a nutrient medium the mature cell sheds its thin wall, turns amoeboid, and cleaves exactly into 2, 4, 8, 16 or rarely 32 zoospores. What is drawn is what the project owner sees in RCC893 in YEP: cleavage inside the wall, then a wall that bursts. Growth is compressed, a day into ten seconds; the swimming is at the speed measured for the species, which is why the zoospores are out of sight within a second or two.',
      caveat:
        'The burst is the project owner’s observation of this strain and is not yet published; the protologue’s account of the type strain differs, and both are on this card.',
      dimensions: [
        ['Encysted zoospore', '3.7–4.4 µm, globose', 'species'],
        ['Mature cell on pine pollen', '6.3–9.2 µm, about 24 h after the zoospore settles', 'species'],
        ['Drawn mature cell', '13.2 µm, the median of the culture drawn', 'species'],
        ['Cleavage', 'successive binary divisions: 2, 4, 8, 16, rarely 32 — the larger cells making the more', 'species'],
        ['Release in RCC893, YEP', 'cleavage inside the wall, then the wall bursts — unpublished observation', 'species'],
        ['Release in the type strain', 'on pollen, the wall disintegrates and the cells leave one by one; in a nutrient medium the wall is shed first and the naked cell cleaves', 'species'],
        ['Zoospores', '4.1–4.8 × 2.6–3.3 µm, elliptical, flagella inserted at the side', 'species'],
        ['Speed (strain KF6)', 'up to 125 µm/s in a straight line, 151 µm/s along the path', 'species'],
        ['When they form', 'mostly at low salinity, 0–15 ‰', 'species'],
        ['Sixteen', 'one of the protologue’s counts; how many RCC893 makes has not been counted', 'unverified'],
        ['Timing', 'growth compressed; swimming at its measured speed', 'unverified'],
      ],
      sources: ['r80', 'r86', 'r96', 'r81'],
      camera: framing(cycle.spot, 60, cycle.glassZ + cycle.R),
    },

    identity: {
      view3d: 'filament',
      name: 'Which name, which strain?',
      latin: 'nomenclatura',
      confidence: 'species',
      what: 'Described in 1988 as Schizochytrium mangrovei, from dead mangrove leaves in Goa, and moved to the new genus Aurantiochytrium in 2007. The strain on this stage, RCC893, was isolated in Hong Kong in 2002.',
      role: 'The type cultures from Goa have been lost. When the genus was erected its 18S tree held a single strain of this species — RCC893 — and the authors noted that it is not the ex-type, and that the species’ position would be settled by strains collected again at the type locality. So the strain drawn here is the species’ reference in practice rather than by rule, which is worth knowing about any number measured on it, those on these cards included. The old name survives: in industry “Schizochytrium” often still means a strain of Aurantiochytrium. And the basionym’s year, 1988, was printed as 1998 when the species was moved, and WoRMS carries the misprint.',
      dimensions: [
        ['Accepted name', 'Aurantiochytrium mangrovei (Raghu-Kumar) R. Yokoyama & D. Honda 2007', 'species'],
        ['Basionym', 'Schizochytrium mangrovei Raghu-Kumar 1988', 'species'],
        ['Type locality', 'dead leaves of Rhizophora mucronata, Orda, Goa, India', 'species'],
        ['Type cultures', 'NIOCC 90, 97 and 98; the ex-type strain has been lost', 'species'],
        ['RCC893', 'strain CKM1, isolated by K.M. Tsui on 10 September 2002 from decaying leaves, Sai Kung, Hong Kong', 'species'],
        ['In the tree that erected the genus', 'the species’ only strain, “not ex-type”', 'species'],
        ['18S rRNA', 'AB973565, in the collection’s record', 'species'],
        ['Year of the basionym', '1988 — printed 1998 in 2007, and in WoRMS since', 'species'],
        ['The sister species', 'A. limacinum, type of the genus: slug-like gliding cells, larger ovoid zoospores', 'model'],
      ],
      sources: ['r80', 'r81', 'r82', 'r90', 'r93'],
      camera: whole,
    },

    notAnAlga: {
      view3d: 'filament',
      name: 'Why is a non-alga here?',
      latin: 'Labyrinthulomycota',
      confidence: 'species',
      what: 'Aurantiochytrium has no plastid and does not photosynthesise. It is a stramenopile — a relative of the diatoms and the brown seaweeds — from a branch that lives by digesting what it grows on: in its case, fallen mangrove leaves.',
      role: 'It is in an atlas of microalgae because the world puts it there. Its oil is sold as algal oil, the European Food Safety Authority calls the genus it is traded under “a single-cell microalga”, and the owner’s own paper on this strain lists microalgae among its keywords. None of that is taxonomy. The stramenopiles’ common ancestor was very probably a heterotroph, and only one branch of them, the ochrophytes, took in a plastid; this is not that branch. So the specimen shows where the word stops. On the landing page’s tree it sits under SAR as Labyrinthulomycota, with no endosymbiosis arrow running into it; WoRMS puts the same group in the phylum Bigyra.',
      dimensions: [
        ['Plastid', 'none; no photosynthesis', 'species'],
        ['Nutrition', 'heterotrophic, by extracellular digestion of leaf tissue', 'species'],
        ['Classification (WoRMS)', 'Chromista › Heterokonta › Bigyra › Labyrinthulea › Thraustochytrida › Thraustochytriaceae', 'species'],
        ['The lineage', 'stramenopiles that never took in a plastid; only the ochrophytes did', 'model'],
        ['Are thraustochytrids algae?', 'no, on phylogenetic, biological or ecological grounds', 'model'],
        ['The EU’s word', '“a single-cell microalga” — EFSA, of Schizochytrium, in 2021', 'model'],
        ['On the landing page', 'Labyrinthulomycota, under SAR; no endosymbiosis arrow', 'model'],
      ],
      sources: ['r87', 'r88', 'r89', 'r90', 'r95', 'r86', 'r83'],
      camera: whole,
    },
  }
}
