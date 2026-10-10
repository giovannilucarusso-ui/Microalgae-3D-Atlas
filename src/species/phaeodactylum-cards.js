// The cards for Phaeodactylum tricornutum, strain Pt1 8.6.
//
// The species is the most studied diatom there is, so most rows here are the
// first tier and many of them are the strain drawn: its cell sizes counted in
// thousands (r103), its organelles reconstructed whole by FIB-SEM (r102), its
// division followed hour by hour (r105). The second tier is the other diatoms.
// What the drawing decides for itself — a spread of lengths, how many cells are
// dividing, the colour's hue — is said on the card, at the third.
//
// The cameras are read out of the drawn population: the cell cards fly to a
// lone fusiform cell of about the median length near the middle of the stage
// and focus on it; the oval card to the nearest oval on the glass; the division
// card to a cell whose plastid is dividing. A change to the seed or to the
// rules moves the camera with the cells.
import { workingDistance } from '../microscope.js'
import { buildPennates, typicalCell, typicalOval } from '../pennate.js'

const VIEW = [0, 0, 1]
// The brightfield objective's field of view, in degrees; see microscope.js.
const FOV = 40

export function PHAEODACTYLUM_CARDS(exterior) {
  const population = buildPennates(exterior)
  const home = workingDistance(exterior.fieldUm, FOV)
  const framing = (at, across) => ({
    target: [at.x, at.y, at.z],
    dir: VIEW,
    distance: workingDistance(across, FOV),
  })
  const cell = typicalCell(population)
  const dividing = typicalCell(population, { dividing: true })
  const oval = typicalOval(population)
  const whole = { target: [0, 0, 0], dir: VIEW, distance: home }
  const pct = (v) => `${Math.round(v * 100)} %`

  return {
    cellBody: {
      view3d: 'filament',
      name: 'The fusiform cell',
      latin: 'cellula fusiformis',
      confidence: 'species',
      what: 'A spindle: a short body about three micrometres across, holding the cell’s one plastid, drawn out at both ends into colourless arms a micrometre wide. In a culture of strain Pt1 the cells are about 23 µm long, and nearly all of them have this shape.',
      role: 'The arms are mostly vacuole: large vacuoles fill the extra volume this shape creates, while the body holds the plastid, the nucleus and the Golgi, with mitochondria running out along the arms. So under the objective an arm is nearly transparent, a tube whose two walls are what the eye reads — a dark line along each side and a pale fringe outside it. For its length the cell holds little: whole cells of the strain reconstructed by FIB-SEM measure about 33 µm³, less than a sphere four micrometres across, because most of the length is arm. Some cells are straight and some bent; both kinds are stable in culture.',
      dimensions: [
        ['Length, Pt1 in brightfield', 'mean 22.6–23.5 µm over eleven days, 2500–8000 cells per sample', 'species'],
        ['Width', '3.5–4 µm in the same counts, which include the edge the blur adds; 2.4–3.0 µm at the body on a micrograph at 45 px/µm', 'species'],
        ['Arms', '0.9–1.0 µm across at mid-arm, rounded at the tip', 'species'],
        ['Volume', '32.6 ± 2.4 µm³ for cells 13–15 µm long (FIB-SEM, three cells)', 'species'],
        ['Shape', 'straight or bent (“lunate”), both stable in culture', 'species'],
        ['Inside', 'vacuoles in the arms; plastid, nucleus and Golgi in the body; mitochondria reaching both tips', 'species'],
        ['Spread of lengths', `not given in what could be read — drawn as ${exterior.cell.lengthUm} ± ${exterior.cell.lengthSdUm} µm`, 'unverified'],
        ['Refractive index', 'not measured — cytoplasm drawn at 1.36, vacuole 1.343, wall 1.395, in sea water at 1.339', 'unverified'],
      ],
      sources: ['r103', 'r111', 'r102', 'r98', 'r101'],
      camera: framing(cell, 34),
    },

    plastid: {
      view3d: 'filament',
      name: 'The plastid',
      latin: 'plastidium',
      confidence: 'species',
      what: 'One per cell, golden brown, lying along one side of the body: about a third of the cell’s volume. It holds chlorophyll a, the chlorophylls c and fucoxanthin.',
      role: 'A diatom’s plastid came from a red alga taken in by a heterotrophic ancestor, which is why it is wrapped in four membranes, the outermost continuous with the envelope of the nucleus. Fucoxanthin, bound in its light-harvesting proteins, absorbs right across the blue and well into the green; chlorophyll a takes the red; what passes is the gold between. Because the plastid is pushed to one side of the body, a cell lying on one face shows it centred, and on another along one edge. Before a cell divides, its plastid divides first, by a constriction across its middle.',
      caveat: 'The hue drawn is the order the pigments set — blue taken most, then green, then red — at the luminance of the open micrograph of the species. Published photographs run from olive to yellow with their cameras’ white balance, and a ratio of channels in a photograph measures that too.',
      dimensions: [
        ['Number', 'one, central, on the epivalve side until just before division', 'species'],
        ['Share of the cell', '33.7 ± 1.8 % of the volume at low light, 24.7 ± 6.7 % at high light (FIB-SEM of Pt1)', 'species'],
        ['Volume', '10.97 ± 0.27 µm³ at low light', 'species'],
        ['Pyrenoid', 'one, inside the plastid, crossed by two thylakoids; 7.1 % of the plastid’s volume, below what the objective resolves', 'species'],
        ['Pigments', 'chlorophyll a, chlorophylls c, fucoxanthin; its fluorescence is excited at 490, 555 and 620 nm and peaks at 685 nm', 'species'],
        ['Membranes', 'four, the outermost continuous with the nuclear envelope', 'species'],
        ['Colour drawn', 'per micrometre of plastid R 0.89, G 0.82, B 0.64 — hue from the pigments, luminance from the micrograph', 'unverified'],
      ],
      sources: ['r98', 'r101', 'r102', 'r105', 'r111'],
      camera: framing(cell, 16),
    },

    droplets: {
      view3d: 'filament',
      name: 'Lipid droplets',
      latin: 'corpora lipidica',
      confidence: 'species',
      what: 'A few small drops of oil, about half a micrometre across: three or four to a cell while nitrogen is plentiful, beside the plastid and out in the arms.',
      role: 'They store carbon as triacylglycerol. Oil is much denser optically than cytoplasm, so each droplet is a small lens: near focus a bright point, out of focus a ring, and racking the knob turns the one into the other. When the culture runs out of nitrogen they grow — in Pt1 from a third of a cubic micrometre of oil per cell to about six in eleven days — and within three days of nitrogen returning they are back where they started.',
      dimensions: [
        ['With nitrogen', '3.6 ± 2.1 droplets per cell, 0.09 ± 0.04 µm³ each', 'species'],
        ['After 11 days without nitrogen', '7.0 ± 3.1 droplets, 6.15 ± 3.52 µm³ of oil per cell, 0.88 µm³ each', 'species'],
        ['Three days after nitrogen returns', '0.39 ± 0.83 µm³ per cell', 'species'],
        ['Where', 'beside the plastid, and in the arms', 'species'],
        ['Refractive index', 'lipid above 1.46 in single microalgal cells', 'model'],
      ],
      sources: ['r103', 'r101', 'r91'],
      camera: framing(cell, 20),
    },

    wall: {
      view3d: 'filament',
      name: 'A diatom almost without glass',
      latin: 'frustulum',
      confidence: 'species',
      what: 'The wall of a fusiform cell is organic. Its only silica is up to ten bands thirteen nanometres wide in the girdle region, far below what any light microscope resolves.',
      role: 'A diatom is defined by its frustule, two overlapping valves of silica. This species was once excluded from the diatoms for lacking one, and was brought back only when a silicified raphe was found in its oval form. The wall of all its forms has three layers — an outer layer of corrugated ridges, an inner layer of fibrils, and between them a less dense one — made mostly of a sulphated glucuronomannan. Only the oval cell lays down silica in a valve, and even there it is often reduced to the raphe and a strip round it. A wall that never becomes a rigid box is why the cell can change shape, and why its daughters do not get smaller with each division as other diatoms’ do.',
      dimensions: [
        ['Silica in fusiform and triradiate cells', '0–10 bands, rods 13 nm wide (27–34 nm with their organic coat), usually only on the epitheca', 'species'],
        ['Outer layer', 'ridges in sets of two to five, papillae 6–10 nm high at 13–17 nm intervals; absent from the girdle', 'species'],
        ['Silica in the oval cell', 'a reduced valve carrying the raphe, in one valve, in both, or in neither', 'species'],
        ['Without silicon', 'the species divides without added silica; Pt1 8.6 is routinely grown in f/2 without silicate', 'species'],
        ['Thickness, oval cell', `30–45 nm in two transverse sections, ridged on its surface; drawn ${Math.round(exterior.wall.ovalUm * 1000)} nm`, 'species'],
        ['Thickness, fusiform cell', `not stated — drawn ${Math.round(exterior.wall.fusiformUm * 1000)} nm, which gives the arms the edges the micrograph shows`, 'unverified'],
      ],
      sources: ['r98', 'r99', 'r105'],
      camera: framing(cell, 12),
    },

    suspension: {
      view3d: 'filament',
      name: 'Suspended, not settled',
      latin: 'plancton',
      confidence: 'species',
      what: 'The fusiform cells hang in the water. A culture with nutrients to spare does not sink, so in a fresh mount the cells are spread through the whole depth of the drop.',
      role: 'Their arms are full of vacuoles, which makes them lighter than the oval cells: these are planktonic forms. In settling columns a culture with phosphate to spare sank at −0.06 ± 0.13 metres a day — not at all — and one starved of phosphate at 0.79 metres a day, which would take it to the slide in seconds. With cells at every depth, only one layer of them is sharp at any setting of the fine focus, and most of the field is cells out of focus, as a photograph of a Pt1 culture shows. Rack the fine focus to bring them in one layer at a time. The ovals are the exception: they settle, and stick to the glass.',
      caveat: `The density drawn is the photograph’s, about ${exterior.cellsPerMm2} cells to the square millimetre of slide, and its drop was evidently concentrated: a batch culture stops at a few million cells per millilitre, which would put about one cell in a field this size.`,
      dimensions: [
        ['Sinking, phosphate replete', '−0.06 ± 0.13 m per day', 'species'],
        ['Phosphate limited / depleted', '0.58 ± 0.10 / 0.79 ± 0.03 m per day, rising with the cells’ lipid', 'species'],
        ['Why they float', 'the large vacuoles of the arms make fusiform and triradiate cells more buoyant than oval ones', 'species'],
        ['Density drawn', `${exterior.cellsPerMm2} cells per mm², counted on a photograph of a Pt1 culture (130–180 cells in about 0.032 mm²)`, 'species'],
        ['Depth of the drop', `not known for the photograph — drawn as ${exterior.depthUm} µm`, 'unverified'],
      ],
      sources: ['r104', 'r99', 'r112'],
      camera: whole,
    },

    morphotypes: {
      view3d: 'filament',
      name: 'Four forms, one species',
      latin: 'morphotypi',
      confidence: 'species',
      what: 'Fusiform, oval, triradiate and, rarely, cruciform: one species with the same DNA in every form, in shapes different enough that its first describer took one of them for a stage of division.',
      role: 'Bohlin described the species in 1897 from triradiate cells, and drew a fusiform cell as a cell dividing; the fusiform form was isolated in 1910 and named as a Nitzschia. Which form a culture shows depends on how it is grown, not on its genes: the forms hold the same amount of DNA, and every strain can turn oval. In ordinary liquid culture the fusiform is the most stable form, and most strains keep it; one, Pt8, is mostly triradiate. Oval cells take over on agar, in exhausted media and below a strain’s best temperature; to become one, a fusiform cell pulls its protoplast in from the arms and forms an oval cell inside its old wall. The cruciform form has been common in one strain only, at 10–15 °C. The field drawn is Pt1 as it grows in liquid culture.',
      dimensions: [
        ['Pt1, Pt2, Pt4–Pt7, Pt10', '95–100 % fusiform in standard conditions', 'species'],
        ['Pt8', '80–85 % triradiate, and unstable', 'species'],
        ['Pt9', '60–75 % oval at 15–19 °C, 80–95 % fusiform at 25–28 °C', 'species'],
        ['Cruciform', 'up to 55 % in strain CCMM 2004 at 10 °C; possibly a pair of triradiate cells not yet separated', 'species'],
        ['Into an oval', 'the protoplast retracts from the arms and forms an oval cell inside the old wall, which later splits along the girdle', 'species'],
        ['Drawn', `${pct(1 - exterior.morphs.oval)} fusiform, ${pct(exterior.morphs.oval)} oval, no triradiate`, 'unverified'],
      ],
      sources: ['r97', 'r98', 'r99', 'r100', 'r106'],
      camera: whole,
    },

    oval: {
      view3d: 'filament',
      name: 'The oval cell',
      latin: 'forma ovalis',
      confidence: 'species',
      what: 'The one form of the species that looks like a diatom: an ellipse about seven micrometres by three, with a glassy rim, and the only form that can build silica and a raphe.',
      role: 'It is the benthic form. It secretes mucilage through its raphe and sticks to surfaces, which fusiform cells do not — so the few ovals in this field lie on the slide while the fusiform cells hang above them. It comes in two shapes: long and thin while the culture grows well, which is the shape drawn, and round and clustered in mucilage when it is stressed. Its plastid fills much of the cell.',
      dimensions: [
        ['Size', '5.4–7.7 × 2.8–3.2 µm on the micrograph; drawn 6–7.8 × 2.8–3.2 µm', 'species'],
        ['Wall', `30–45 nm in section under the electron microscope, ridged on its surface; drawn ${Math.round(exterior.wall.ovalUm * 1000)} nm. The glassy rim the light microscope shows is its edge as the objective draws it, not its thickness`, 'species'],
        ['Silica', 'a reduced valve with the raphe, in none, one or both valves', 'species'],
        ['Attachment', 'adheres by its secretions; fusiform cells do not', 'species'],
        ['Long and round', 'long and thin in good conditions, round and clustered in mucilage under stress', 'species'],
        ['Gliding', 'the raphe may let it glide; a speed was not found, so it is drawn still', 'unverified'],
        ['Plane of focus', `${exterior.oval.focusBelowUm} µm below the middle of the cell, as in the micrograph: a dark line at the wall, cold inside and warm outside`, 'unverified'],
      ],
      sources: ['r99', 'r98', 'r101', 'r111'],
      // The plane of focus follows the camera's target, so the target sits
      // where the micrograph's ovals were focused rather than at the cell's
      // middle; see focusBelowUm in the species record.
      camera: framing({ ...oval, z: oval.z - exterior.oval.focusBelowUm }, 16),
    },

    division: {
      view3d: 'filament',
      name: 'Division',
      latin: 'divisio',
      confidence: 'species',
      what: 'A cell divides lengthwise into two daughters lying side by side, and it divides its plastid first.',
      role: 'In a culture kept on a day–night cycle, DNA synthesis begins about four hours after the light comes on, and the plastid then divides by a constriction across its middle. Furrows grow in from both tips of the cell, the Golgi doubles, and the nucleus is cut in two by the furrow — no spindle has ever been seen in this species — and the daughters part at the end of the day. A cell doubles about once every day or day and a half. In this field some cells carry a plastid pinched in two, and a few pairs of daughters still lie together.',
      caveat: `How many cells show each stage in a field is not measured: drawn, ${pct(exterior.division.plastidDividedShare)} with a divided plastid and ${pct(exterior.division.pairShare)} in pairs.`,
      dimensions: [
        ['Doubling time', '1–1.5 days in liquid culture', 'species'],
        ['First visible event', 'the plastid divides by a central constriction, after DNA synthesis begins at about 4 h of light', 'species'],
        ['Furrows', 'from both tips of the cell, 8–10 h after the light comes on', 'species'],
        ['The nucleus', 'cut by the furrow; no spindle or microtubules observed', 'species'],
        ['Daughters part', 'about 12 h after the light comes on, at the end of the day', 'species'],
      ],
      sources: ['r105', 'r98', 'r97'],
      camera: framing(dividing, 30),
    },

    identity: {
      view3d: 'filament',
      name: 'Which strain?',
      latin: 'Pt1 8.6',
      confidence: 'species',
      what: 'Pt1 8.6, the clone whose genome was sequenced: isolated in 2003 from a culture taken around 1956 from an estuary off Blackpool.',
      role: 'Phaeodactylum tricornutum stands alone in its family and suborder, and it became the model diatom for practical reasons: it grows fast, it can be transformed and edited, and its genome was published in 2008 and assembled from telomere to telomere in 2022 — twenty-five chromosomes, in a diploid cell. Its strains come from coasts, estuaries and rock pools from sub-polar to tropical latitudes, and the oldest, from Plymouth, has been in culture since about 1910. One of the most recent, Pt14, was isolated in the Gulf of Salerno and has the shortest cells of the seventeen compared.',
      dimensions: [
        ['Name', 'Phaeodactylum tricornutum Bohlin 1897', 'species'],
        ['Classification', 'Bacillariophyceae › Naviculales › Phaeodactylaceae', 'species'],
        ['Strain drawn', 'Pt1 8.6 = CCAP 1055/1 = CCMP2561, a clone of Pt1 (CCMP632 = CCAP 1055/3), Blackpool, about 1956', 'species'],
        ['Genome', '25 nuclear chromosomes, diploid; about 40 % of its genes not shared with the centric diatom Thalassiosira', 'species'],
        ['Where it lives', 'coastal waters: tidal zones, estuaries, rock pools', 'species'],
        ['Pt14', 'Gulf of Salerno; cells 10–15 µm, the shortest of seventeen accessions', 'species'],
      ],
      sources: ['r109', 'r107', 'r108', 'r106', 'r110', 'r97', 'r99'],
      camera: whole,
    },
  }
}
