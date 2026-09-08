# Design notes — how the model is drawn, and why

The long account behind the [Microalgae 3D Atlas](../README.md), whose first
specimen is Spirulina (*Limnospira* / *Arthrospira platensis*). This is the
record of the reasoning — what the optics are modelling, what was tried and
rejected, and which findings would otherwise be re-derived from scratch. Start
at the README if you are arriving for the first time.

An interactive 3D exploration of the cyanobacterium **Spirulina** (*Limnospira / Arthrospira platensis*), from the helical filament down to its internal ultrastructure. Every dimension in the model traces back to a primary source, and the interface says which values were measured in Spirulina itself and which were borrowed from model cyanobacteria.

## Status — v0.6

Two scales, two instruments. The filament is what you actually meet down a light
microscope, so it is drawn as a wet mount in transmitted light; the interior is
56 nm of detail no lens resolves, so it borrows the register those instruments
are read in — a dark ground with the structures lit from within, as in a confocal
stack or a tomogram. It is not an acquired image and should not be read as one:
it is an interpretive, false-colour reconstruction informed by TEM, where the
evidence is section contrast and the fourteen material colours are annotation.
What a tomogram justifies is the ground and the reading, not the palette. Both go through an optics pass (`src/optics.jsx`) that adds
what a raw render lacks: a thin plane of focus with everything else dissolving,
the lateral colour fringe of a real objective, veiling glare, sensor grain and
the falloff of the illuminated field.

**Filament view.** The helical trichome with species-specific geometry: left-handed helix (29 of 36 clonal strains), 480 µm long, ~110 cells of Ø 8 × 4.4 µm with visible cross-walls. A gliding-motility animation reproduces the screw-like rotation-plus-travel with periodic reversals.

The trichome carries a seeded density map rather than a colour: mid grey is the nominal thickness of specimen in the beam, and the light is what survives crossing it. What is drawn into that map comes from the light micrographs in Nowicka-Krawczyk 2019 Fig. 4 (`docs/fonti/`) — the cross-walls, which are the one feature a light microscope really resolves in this genus and which fall at visibly uneven intervals; the barrel profile of each cell, fullest across its middle and drawing in at each wall, which is what stacks the filament into discs; the granulation banked against the septa; and the mottle of gas vacuoles and reserve granules that keeps the cytoplasm from reading flat. Every cell is rolled its own load, and the granulation and the beading follow it: down a real lens some cells are packed dark and their neighbours visibly clearer, and it is that unevenness cell to cell — not the granules themselves, which sit at the edge of what a lens resolves — that stops 480 µm of filament reading as extruded. What is *not* drawn is as deliberate: the surface fibrils and the mucilage pores of the gliding apparatus are 8 and 15 nm, two orders of magnitude under this microscope's resolution, and a view that states its own optics cannot then resolve them.

Both original ends carry a **calyptra** — the apical cell's outer wall thickened into a cap, the bright refractile spot the light microscope shows on a filament otherwise full of pigment, and part of what separates this genus from Spirulina proper. It is drawn by refraction rather than by absorption, and it has to be: everything else here is drawn by what it removes from the beam, and a calyptra removes almost nothing, so as one more absorbing layer over the apical cell it could only ever make the tip *darker* than the cell beneath — 0.07 of the red transmitted by the cell alone, 0.06 by the two multiplied together. It was subtracting six per cent from the brightest thing on the filament. A thick, clear, curved body bends light into the objective instead, and that light is added: brightest where the wall is thickest over the dome and where the line of sight runs along it at the lip. The apical cell under it is swollen five per cent — rounded to *subcapitate* is the character, and drawn at the trichome's own radius it was not an apex but simply where the tube stopped — and it is the clearest cell on the filament, because a dome rounding off puts less pigmented depth in the beam. The ends a filament makes by breaking at a necridium have none of this: no cap, no swelling, full cytoplasm.

Nothing here is lit. Under transmitted light the lamp is behind the slide, so
the filament multiplies the field behind it by its own transmittance
(Beer-Lambert, per colour channel, `src/specimen.jsx`): the path through a round
body is longest down its axis and vanishes at the silhouette, which is why the
trichome is dark in the middle and pale at the rim, with the thin dark outline of
light refracted out of the objective's cone and the bright Becke line just
outside it. The slide carries what a slide carries — grit in Brownian motion,
detritus, neighbouring trichomes well off the focal plane.

**Cell interior view.** A cutaway of one cell in nanometre units: a 115° wedge and the cell above have been removed, so you look down onto the lower cross-wall. Fourteen clickable structures — the extracellular sheath, the four-layered wall, plasma membrane, cross-wall, thylakoids, phycobilisomes, carboxysomes, a hexagonally packed gas-vesicle bundle, cyanophycin, polyglucan, polyphosphate, lipid bodies, the nucleoid and ribosomes.

The **envelope** is cut twice, because a section and a face answer different questions. At the far edge of the wedge it is a section: bands 15 nm wide, which state the thickness and can state nothing else. At the near edge the layers do not all stop in the same place — each is cut back a step further than the one inside it, so the plasma membrane runs right out to the cut and stands proud of everything, then L-I a step behind it, then L-II, L-III, L-IV, and last the sheath. Because these are nested shells, a layer that outreaches the one over it has a strip of its own outer face in the open: five treads of five materials in the order the envelope is built in, with the layer thicknesses standing as the cut faces between them. Each carries its own grain — the linear elements running along the filament axis in L-IV, the right-handed surface fibrils of L-III — approximated as a fine grain biased lengthwise, since a true helix needs the cylinder's own angular frame and is worth less than it would cost — the isotropic cross-linked mesh of L-II, the fibrillar β-1,2-glucan of L-I — and none of that exists in a 15 nm stripe. It exists on a face. The step is 380 nm of arc, the narrowest that still leaves a face rather than another edge once the foreshortening of looking along a cylinder is paid for; five of them take 27° off a 245° sector. The cross-wall keeps the whole sector, though it *is* L-II folded inwards and stepping it back with L-II is the tidier story: it is the floor everything on it is placed from, and two steps off its near edge left the cyanophycin, the aerotopes and the lamellae standing over open space. Thirty nanometres of its rim showing past the membrane at floor level is the smaller untruth. The sheath stops last, because a coat that reached the cut would arch over every tread below it. The five names are hung on the five treads while the wall is the selected structure.

Outside everything, and in a group of its own, is the **extracellular sheath**: about 50 nm of hydrated polysaccharide the cell secretes and then sits inside. It is not a fifth layer of the wall and it is not drawn as one. Its thickness is a field over angle and height rather than a number — most of the coat near the measured 50 nm, a few places running out to the 300 nm the fibrillar layer reaches — and only its outer surface, its rims and its cut faces are built, because an inner surface would sit on the wall’s own face where it can only z-fight. The rest is the material: a thin transparent coat is nearly clear seen face on, where the line of sight crosses 50 nm of it, and obvious at the silhouette, where it runs along it for micrometres. Rendering it as a fresnel edge rather than as a fill is both what a gel does and the reason the layer does not have to be exaggerated to be seen.

That layer is also where the two literatures appear to disagree, and the model has to hold both. Nowicka-Krawczyk et al. (2019) record trichomes "without a sheath or with a thin, inconspicuous one", which is what a light microscope sees; Deschoenmaeker et al. (2016) photograph one on this organism and measure it. Fifty nanometres is an order of magnitude under what a lens resolves, so both are right, and `tools/check-science.mjs` asserts the inequality rather than leaving it as a remark. It is drawn at the fed thickness, like everything else in this cutaway: starve the culture of nitrogen and it swells to 50—200 nm as the cell routes carbon it cannot use out through the wall, which is a fact on the card and not a control.

The thylakoid system is generated rather than drawn, and nothing in it is concentric. A family of lamellae is an oval that turns as it grows outward — about a quarter turn across the cell, so a membrane meets the wall at a slight angle rather than running parallel to it — carrying three harmonics whose phase drifts with radius: neighbours stay roughly parallel, since membranes may not cross, while the family never repeats a circle. Within a family the lamellae arrive in fascicles of three to six at the measured 56 nm, and each fascicle is followed by a lane of cytoplasm. The arithmetic used to give back after every group exactly what the tightening took, so the mean across the band came out at 56 nm as well — which made the whole annulus one continuous stack thirty-six membranes deep, and that is not what the sections show. The 56 nm is an *interdistance between adjacent lamellae*, and in Deschoenmaeker 2016 Fig. 2 the thylakoids of this organism are discrete concentric whorls, six to a dozen membranes each, separated by cytoplasm carrying the carboxysomes and the granules. So the interdistance stays measured and the mean does not. The whorls stay tight, because in the plates they are tight; the system that follows the wall is the loose one. Plenty of them simply stop: a lamella is a flattened sac, not a hoop. Several off-axis centres grow their own families inside a limited neighbourhood, and the surrounding lamellae break where two families meet — the dislocated, fingerprint-like pattern of a transmission electron micrograph. Those whirls are ovals stretched along the radius that carries them, with a broken core: a bullseye of shrinking circles is a CAD extrusion, and it is the one thing a micrograph of this cell never shows. The stack undulates, sampled from a field shared with its neighbours rather than drawn per lamella, so it ends in a wavy crest instead of a machined plateau. One set of lamellae, drawn at two thicknesses. There used to be two sets, the far one at 140 nm, and the swap was the single moment in the model where zooming in made the anatomy *multiply*: the same cell went from fourteen membranes to thirty-six in one frame, which is the opposite of what closing in on something is meant to do. The count and the positions no longer change with distance — only the drawn thickness does, 22 nm out where a 16 nm sac is about a pixel and could only shimmer, the true 16 nm once it is worth more than that. Six nanometres is not a transition anyone can see.

A lamella used to run floor to ceiling wherever it existed, and that — not the count, and not the 56 nm — is what made the interior impenetrable. A sheet 3.9 µm tall standing 56 nm from the next one hides sixteen of its neighbours at thirty degrees off vertical, and that arithmetic does not depend on the spacing: no amount of thinning the stack could ever have opened it. A thylakoid is a flattened sac and a sac has an edge in every direction, height included. So the stack now stands its full height against the wall, where it frames the cell, and steps down as it comes inwards, where the nucleoid and the carboxysomes are. It is cropped from the top only — the top being the cut end, so a sac that stops short of it has simply stopped, while raising the floor would hang membranes in the air above the cross-wall, which no section shows. The crop comes from a coarse field shared between neighbours, so a fascicle rises and falls as one body while the fascicle a micron away sits at another height, and it carries a ripple of about 450 nm along the arc so that a crest is ragged rather than a drawn curve.

Three cytoplasmic lanes cross every family — the dislocation lines of the fingerprint. A break rolled per lamella is a hole; forty of them lined up across the fascicles is a corridor, and the corridor is the only thing that lets the eye reach the middle of the cell from outside it. They curve, because the centre line drifts with radius, and they pinch and close along their length, because a lane of fixed angle and fixed width is a saw cut through the cell rather than a lane.

Each sac carries its own pigment load as well, written into the geometry as one value per lamella rather than per surviving arc — a sac broken into three pieces is still one sac, and tinting the pieces differently draws two lines across it that are not there. Forty membranes of a single colour stack into a solid however finely each of them is lit, and being able to count them is most of the content of a section of this cell.

The core the cutaway opens onto is a room rather than a shaft. The lamella-free nucleoplasm runs to 1750 nm, and the carboxysomes, polyphosphate bodies, nucleoid and ribosomes are spread across it instead of piled on the axis. The lipid droplets are the exception and are placed outside it, from 1950 nm out to 3500: held in the core they all sat buried inside the thylakoid stack, which is a droplet drawn where nothing can see it — which is also what the micrographs show, polyhedral bodies distributed through the nucleoplasmic region with some of them against the innermost lamellae. The nucleoid is thirty-four fibres built as confined persistent walks: a chromatin fibre carries on roughly the way it was going, turns a little at every step, and is pulled back only at the edge of its territory. Drawn instead as parametric loops with a random radius per sample, which is what it was, the spline smooths every loop into a chord and twenty of them come out as a birdcage with the cell visible through the bars.

Surfaces carry a world-space mottle folded into their colour, their roughness
and their shading normal, and its ladder of octaves has two ends rather than a
fixed length. The far end is the screen: each octave is faded out on its own
approach to the pixel it can no longer be drawn in rather than on the coarsest
one's, because fading the sum on the base octave alone leaves the finest a full
octave under Nyquist, where it cannot be drawn, only aliased — so adding detail
makes the surface *smoother*, a grey mush of sub-pixel noise in place of relief.
The near end is the specimen: each structure declares the size of the smallest
thing it is actually built out of — the glycan strand in the peptidoglycan, a
photosystem in a thylakoid membrane, van Eykelenburg's 3 nm fibril in the
sheath, a ribosome in the cytosol, because below that the model draws the
ribosomes themselves — and the ladder stops there. A fixed four octaves was a
floor as well as a ceiling, and it was the reason a close zoom magnified the
same blur instead of resolving anything new; the same surface now runs to five
or seven octaves when the camera is close enough to spend them, and it stops
where the organism does rather than wherever the arithmetic ran out. Two ladders
are walked at once, because colour wants its fine octaves to keep weight and
slope does not: at one persistence a seventh octave would carry six times the
first one's slope and the relief would collapse into sandpaper exactly where the
extra octaves arrive. What survives is renormalised by its own weight, so a
surface keeps its contrast as the fine octaves drop away instead of fading
towards flat, and a slow domain warp drags both the mottle and the grain about
before either is sampled, since what separates a grown surface from a mineral
one is that its features are drawn out and folded rather than the same size in
every direction. The palette is
pulled back from display primaries towards the muted colours dense protein and
pigment actually take, and the crevices are darkened from the depth buffer — a lit
surface with no occlusion in its folds is the flattest thing a renderer produces,
and in a cell that is mostly slots it is the term that carries the form.

Phycobilisomes and ribosomes appear once they are large enough on screen to
mean anything, and are simply absent before that: a 22 nm body at whole-cell
zoom is honest noise, and a field of it reads as dirt on the lens.

Nothing biological is a perfect solid of revolution, so the shapes carry their
own defects: storage granules and polyphosphate bodies are displaced along their
normals by a noise field, the carboxysome is the twenty-faced
icosahedron rather than a subdivision of one, with its corners pushed off the
textbook solid, the nucleoid is thirty-four thin fibres
sharing a territory rather than one thick hose, and the gas vesicles carry their
4 nm protein ribs in the shading normal — far too fine to build as geometry, and
faded out by screen-space derivative once a rib drops below a pixel, which is
the point at which it could only alias.

### Reading the cell

A cutaway packed with lamellae is not readable by dimming things. Picking a
structure now empties the cell around it: the envelope stays as a translucent
hull so you can still tell where you have landed, the thylakoid system thins to
a veil you look straight through — the near lamella wins the depth test, so it
stays a veil however many stack up behind it — and everything else steps out
until it is the one selected. What is bolted to the thylakoids stays with them.

Each group in the structure list also carries an eye: switch a whole layer off
and it is gone until you say otherwise, which is the direct answer to the
thylakoids standing in front of everything.

The camera no longer cuts a straight line to the target. The look-at point
travels straight while the camera swings around it in spherical coordinates, on
a fixed clock eased at both ends, and the radius bulges outwards mid-flight: the
cell backs off, turns, and only then does the camera descend. Clearing the
selection flies back out to the overview, touching the controls cancels the
flight, and while a structure is selected its leader-line label is the only one
drawn — the answer to "where has it taken me".

Every viewpoint is aimed where its structure is actually legible: the four-layer
wall onto the staircase at the near edge of the wedge, where each layer has a
face turned to the camera instead of a 15 nm edge, and the thylakoids from
above, where the whirls resolve into their fingerprint. The flush section is
still there at the far edge — the sheath's and the membrane's viewpoints are
what frame it.

**No temperature slider — and that is the point.** Two measured relationships used to be driven from one: the helix tightening as the culture warms (pitch 152 → 113 µm, Ø 69 → 36 µm) and the 17–20 °C storage switch inside the cell (nitrogen banked as cyanophycin below the threshold, carbon as polyglucan rods above). Both are real. Both come from one strain in one laboratory — and the open-coiled Lake Nakuru culture has a pitch that sits *outside* the range the species occupies, so building the filament from it made the model a portrait of that culture with a control in front of it saying so.

The model is the species instead. The helix is `SPECIES_HELIX`, the midpoint of the described ranges (pitch 12–72 µm, diameter 15–60 µm); the cutaway is drawn at `REFERENCE_GROWTH_C`, a culture in ordinary growth with both stores present and neither at its extreme. `helixAtTemperature` and the storage switch stay in `science.js` because the measurements are worth keeping in the record, and the switch is still on the cyanophycin card where it is a fact about the granule rather than a control. What is gone is the control, not the relationship: `CELL_STORAGE` still evaluates both storage functions, once, at `REFERENCE_GROWTH_C`, and what they return is what the cutaway draws — how much cyanophycin survives the thinning and how many polyglucan rods there are. The helix is the one that is genuinely no longer driven: `SPECIES_HELIX` is a midpoint, not a temperature.

The cross-wall is a **surface, not a plate**. It bows, ripples and leans, and it thickens as it returns to the wall, because it is an invagination of the wall's own L-II layer flanked by L-I rather than a bulkhead dropped between two cells (Deschoenmaeker et al. 2016). It is 40 nm across, which is what a fed cell has — the thick, hard-edged septa in the literature's figures are nitrogen-starved cells, where the same septum swells to 100 nm in a day and 200 nm in two. The granules and the aerotopes rest on that surface rather than on the plane it used to be: a floor drawn in one place and rested on in another is two floors.

And it is drilled. Fifty-six nanopores of ~20 nm run through it in rows, open-ended and dark inside, because the card has always said the cross-wall *divides the cells but does not isolate them* — the septal peptidoglycan carries protein channels, a prokaryotic analogue of gap junctions — while the model went on drawing a solid floor. They are the smallest thing here worth drawing and only resolve close up, which is the honest size for them.

The lamella-free middle of the cell is a **fringe, not a bore hole**. Its edge wanders on three harmonics, each lamella of the wall-following family reaches past it by its own amount — most stop near it, about one in seven pushes well in — and one whirl sits over the edge and crosses it outright, which is a cell Nowicka-Krawczyk 2019 Fig. 5d actually shows. A circle of fixed radius that every membrane stopped dead on read as two compartments with a wall between them, and the cell is one thing. About 5 % of lamella points now lie inside where that wall used to be, reaching in to 620 nm.

Nothing passes through a membrane. The lamella generator takes the storage granules **and the aerotopes** as obstacles and carries a height per point, so a lamella arches over one the way it does in a micrograph — which is why the placement of every one of them lives in `sites.js`, before anything is drawn, rather than in the component that draws it.

Where things sit is part of the anatomy, not decoration. Cyanophycin granules are **peripheral, banked along the cross-wall**, which is where they are found — one left in open ground in the middle of the floor has nothing to be against and reads as a marble dropped there. Gas vesicles come in **several aerotopes, each lying at its own angle**: the hexagonal packing at ~65 nm is measured and kept, but a single upright raft of identical cylinders is a machine part. And the lamella-free sub-septal zone is 225 nm, not the 455 it once was — that wider band left the stack hanging clear of the cross-wall with daylight under it, and in a longitudinal section the membranes run most of the way to the wall with the granules and the bundles taking up the last of the distance.

The plane of focus follows whatever the viewer has centred, so zooming in on a
structure brings it into focus the way turning the fine focus does.

**Scale bar** in µm or nm, recomputed live from the camera; **leader-line labels** anchored on the structures themselves; **structure list grouped by function**, with a stepper to walk through it and a layer switch per group; **info panel** carrying the description, dimensions, confidence tier and linked sources.

## Scientific base

The content backbone is the Anatomical Bill of Materials in
[`docs/distinta-anatomica-spirulina.md`](docs/distinta-anatomica-spirulina.md) (42 cited sources, three-tier confidence system). Primary reference scans live in `docs/fonti/`. The app content layer is `src/structures.js`; all measurements sit in `src/science.js` with their citations attached.

## Run

```bash
npm install
npm run dev
```

Vite dev server on http://localhost:5173.

## Inspecting the render

A browser tab that is never displayed never composites a frame, and React Three Fiber will not even mount the scene without one — so the 3D output cannot be checked from a background tab. Render it headlessly instead:

```bash
npm run shots
```

Chrome (SwiftShader) loads the dev server and writes PNGs of the filament view, the cell overview and two focused structures into `docs/shots/`. For a single frame: `node tools/shoot.mjs cell`, or `node tools/shoot.mjs cell:thylakoids` to focus a structure. An `@` suffix drives the camera afterwards — `node tools/shoot.mjs "cell@6,240,-80"` dollies in six notches and then orbits 240 px right and 80 px up — and `--set look` renders the five viewpoints the interior is judged on in one pass, `--set bodies` the small structures one at a time. A cutaway that reads from the home viewpoint and nowhere else is a poster, not a model, which is what the sets are for.

The generator itself is measured separately, because what the eye is judging is not something a still frame states:

```bash
npm run lamellae
```

Arc and lamella counts, the mean height of a sac against the 3860 nm the cell allows, the membrane area per face, and how many arcs are long enough to carry phycobilisomes and polyglucan. The height is the number to watch: it, and not the count or the 56 nm spacing, is what decides whether the interior can be seen into at all.

## Handing it to someone

```bash
npm run share
```

Folds the build into `share/spirulina-3d.html`, one self-contained file with no
server, no npm and no network: a double-click is enough. It writes a second copy
beside it, `spirulina-3d.artifact.html`, which is the same bundle as page
*content* rather than as a document — for publishing somewhere that supplies its
own `<head>`, where a nested second document would have its title dropped and,
worse, its `<meta charset>` with it. Lose that and the browser falls back to the
system codepage: every interpunct becomes `Â·`, `1 µm` becomes `1 Âµm`, and the
arrows on the stepper turn to mush.

```bash
npm run share:check
```

Opens the bundle straight off disk in headless Chrome — no server — and proves it
mounts, sizes its canvas, lists its structures and reaches the network for
nothing. That last check is the point: anything the bundle still tries to fetch
is a dependency the recipient discovers and you do not.

## Stack

Vite · React 19 · Three.js · React Three Fiber · drei
