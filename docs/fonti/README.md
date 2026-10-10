# Sources

## van Eykelenburg (1979–1980), TU Delft thesis

`vanEykelenburg-tesi-TUDelft.pdf`, with an OCR text pass beside it. The source of
almost every measured number in the model: lamella spacing, the storage switch,
the helix against temperature, the wall layers. One strain, one laboratory —
which is why the app names it wherever its numbers are on screen.

## Nowicka-Krawczyk, Mühlsteinová & Hauer (2019) *Sci Rep* 9:694

`nowicka-krawczyk-2019-Limnospira.pdf` — the paper that separated *Limnospira*
from *Arthrospira*. **CC BY 4.0**: the figures may be reproduced with
attribution. Downloaded from the publisher, https://doi.org/10.1038/s41598-018-36831-0.

Three plates are kept beside it as PNGs because they are what the rendering was
drawn against, not just cited from:

- `nk2019-fig4.png` — light microscopy of *Limnospira*. The arrowheads mark the
  **calyptra**: the apical cell ends in a bright, refractile cap, and some
  apical cells have none. This is what `Trichome.jsx` draws at the two original
  ends of the filament.
- `nk2019-fig5.png` — TEM of *Limnospira*. Thylakoids in **irregular**
  arrangement: short wavy fascicles running at many angles, loose whorls, no
  concentric shells anywhere. The reference for `thylakoidLamellae` in
  `geometry.js`, and the reason it carries a fine high-frequency harmonic — in
  the plate a lamella is never straight for long.
- `nk2019-fig2.png` — TEM of *Arthrospira jenneri*, kept as the contrast: per
  its caption the thylakoids there are **radially arranged**, and aerotopes sit
  near the cross-walls. Full radial orientation belongs to that genus, which is
  why the model only leans that way rather than committing to it.

## Deschoenmaeker et al. (2016) *J Struct Biol* 196:385–393

`deschoenmaeker-2016-ultrastructure.pdf` — "Nitrogen depletion in *Arthrospira*
sp. PCC 8005, an ultrastructural point of view". **Not open access**; supplied by
the project owner. Kept here because PCC 8005 is now classified as *Limnospira
indica*, which makes this a dedicated TEM study of the interior of a Limnospira
— the only modern one found.

`deschoenmaeker-2016-fig2-TEM.jpg` is its Fig. 2: longitudinal sections of fed
(N+) and nitrogen-starved (N−) cells. What the model was drawn against:

- **Septa (S).** In a fed cell they are thin, faintly darker lines that curve and
  run oblique — you have to look for them. The hard, high-contrast bulkheads in
  the same plate are the *starved* cells. The paper measures the difference:
  40 nm while fed, swelling to 100 nm in a day and 200 nm in two.
- **What a septum is made of**: "invaginations of L-II flanked by L-I" — the
  envelope folding inwards, not a plate laid between two cells. This is why
  `septumGeometry` bows and leans and swells back into the wall, and why
  `ZONES.septumOuter` runs out to the L-II layer instead of stopping at the
  membrane.
- **Wall layers, measured in this strain**: L-I ±5–10 nm, L-II ±10–15,
  L-III ±5–10, L-IV ±10–15, whole wall ±45 nm.
- **Counts in fed cells**: ~25 thylakoids and 2–3 carboxysomes per cell.
- The paper uses **chromatoplasm** for the lamellar shell and **nucleoplasm** for
  the electron-dense central cytoplasm, so that two-zone reading is current for
  Limnospira and not only van Eykelenburg's.
- An **EPS sheath of about 50 nm** lies outside the wall.

## Chlorella — Bock, Krienitz & Pröschold (2011) *Fottea* 11:293–312

The taxonomic revision that sorted the genus out, and the source of the emended
generic diagnosis the coccoid field is drawn to:

> "cells spherical, subspherical or ellipsoid, single or forming colonies with
> up to 64 cells, mucilage present or absent. Chloroplast single, parietal,
> pyrenoid present, surrounded by starch grains. Reproduction by autospores,
> zoospores lacking. Autospores released through disruption of mother cell wall."

Its account of why morphology failed here is the reason both Chlorella species
in this atlas are drawn alike: what defeated a century of work was "the limited
number of morphological characters and small dimensions of vegetative cells".
Open access at https://doi.org/10.5507/fot.2011.028 — not kept in this
repository; the passages above were read out of the published PDF.

## Krivina & Temraleeva (2020) *Microbiology* 89:720–732

"Identification Problems and Cryptic Diversity of Chlorella-Clade Microalgae".
The source for the statement on the *Which species is this?* card: no single
phenotypic character determines a taxonomic position within this clade, and the
separation of *C. vulgaris* from *C. sorokiniana* is made on ITS-2 and 18S.
https://doi.org/10.1134/S0026261720060107

## Lizzul, Lekuona-Amundarain, Purton & Campos (2018) *Biology* 7:25

"Characterization of *Chlorella sorokiniana*, UTEX 1230". **CC BY 4.0.** The
measured size for the strain — 2–4.5 µm — and the range the genus occupies,
2–10 µm. https://doi.org/10.3390/biology7020025

## Ikeda & Takeda (1995) *J Phycol* 31:813–818

"Species-specific differences of pyrenoids in *Chlorella* (Chlorophyta)". The
genus sectioned and sorted by one organelle, and the source for the *Pyrenoid*
card. Two things off it are drawn:

- **The starch sheath is in two pieces.** In *C. vulgaris* the matrix is capped
  by two thick concavo-convex cup-shaped starch plates, not wrapped in a
  continuous shell, and a single **double-layered thylakoid** runs through it.
- **It does not separate the two species in this atlas.** The species with
  glucosamine walls — *C. vulgaris*, *C. sorokiniana* and *C. kessleri* — are
  virtually identical in pyrenoid morphology. That is a second character, at a
  scale a light microscope cannot reach, agreeing with the objective that these
  two cannot be told apart, and it is on the *Which species is this?* card for
  that reason.

The plates are drawn as two **lenses** rather than as two cups. The concavity is
a fraction of a micrometre on a body about one across: it is in the electron
micrographs and it is not in a wet mount, and the card says so rather than the
model claiming a resolution it does not have.
https://doi.org/10.1111/j.0022-3646.1995.00813.x

## Safi, Zebib, Merah, Pontalier & Vaca-Garcia (2014) *Renew Sustain Energy Rev* 35:265–278

"Morphology, composition, production, processing and applications of *Chlorella
vulgaris*: A review". The size range and the autospore count for the type
species. https://doi.org/10.1016/j.rser.2014.04.007

**No Chlorella micrographs are kept in this repository.** The four sources above
are text; the light micrographs consulted while drawing the field are cited from
them and from the plates in Bock et al., and none of them carries a licence that
would let this project redistribute the images. What is drawn here was drawn
against them, not from them.

## CAUP H1917 — *Chlorella vulgaris* var. *vulgaris* f. *viridis*

https://botany.natur.cuni.cz/algo/CAUP/H1917_Chlorella_vulgaris.htm — four light
micrographs of a living culture, from the Culture Collection of Algae of Charles
University in Prague. **Copyright © Pavel Škaloud, Phycological research group,
Charles University in Prague.** Not redistributable, and **not in this
repository**: the plates were consulted, not copied.

They are the reference the Chlorella field is drawn against, and reading them
went two rounds: the first took two numbers off them and corrected two mistakes
that no amount of looking had, and the second worked out which of those two
numbers the plates could actually carry.

- **Field (186, 182, 131); cell interior (126, 147, 12).** So a cell transmits
  about three quarters of the light, not the half it was first drawn at, and
  the green is made by *failing to absorb* green rather than by darkening
  everything. That is chlorophyll's absorption spectrum, and it is the opposite
  of what a dark green paint does. The **luminance** of `CHLORELLA_GENUS.colour`
  is still those pixels.
- **The same two pixels cannot carry the hue, and for a while they were asked
  to.** Taken literally they say blue transmits 0.09 where red transmits 0.68 —
  blue extinguished seven times harder than red. No chlorophyll does that: in
  vivo the Soret band near 435 nm and the red band near 675 nm are comparable,
  with the carotenoids adding on the blue side, so red and blue should both be
  well down and blue only somewhat further. What that ratio measured is this
  plate's own white balance. Its field is already khaki — blue at 0.70 of red
  before the light has met a cell — so inside one the blue channel sits at 12
  out of 255, on the sensor's floor, where a ratio has stopped meaning anything.

  Used as a transmittance it was worse than merely wrong, because transmittances
  are raised to the path length: at twice the drawn thickness 0.09 becomes
  0.008, and more than half the pigmented area of the frame was rendering with a
  blue channel of 0, 1 or 2 — a *clipped* colour, which is the one thing no
  camera returns and a reliable tell that an image was computed. The hue now
  comes from the pigment's spectrum (0.50 / 0.72 / 0.33) and the luminance from
  the plate.
- **The lamp is warm — but a khaki field is a white balance, not an
  illuminant.** The field here is frankly khaki; the field in
  Nowicka-Krawczyk 2019 is near neutral at (156, 168, 153). The atlas's own was
  (125, 145, 148) — blue, and the only one of the three that was. Splitting the
  difference between the two references put a sepia cast over the whole atlas,
  which is a property of one afternoon's capture rather than of any microscope.
  The field is now near-neutral with a trace of warmth left in it, and *bright*:
  a photographed brightfield sits near 210–230, and at 153 the empty slide was
  darker than the specimen is in a real micrograph.

The strain description gives "diameter up to 7(-9)" µm, at the top of the range
the species occupies.

A second pass over the same plates is what put the inside of a cell in. Drawn
against them and not before them:

- **The refractile bodies are the loudest thing in a cell** at this
  magnification — two to four of them, unmistakable, mostly gathered in one part
  of the cell. Drawn first as a faint sheen, they were the feature the plates put
  in the foreground and the model had left out.
- **They cannot be sorted into starch and oil by looking.** Both are there and
  both look the same; the *Refractile granules* card says so instead of giving
  them two colours.
- **The chloroplast's margin wanders.** It is lobed, sometimes incised, and never
  a circle — which is why the cup stopped being a solid of revolution. Drawn as
  one, every cell in the field carried the same outline at a different angle.
- **The emptied mother walls are on the slide**, between the living cells:
  colourless, thin, sharply outlined, and empty.
- **Nothing in the plate is brighter than the field.** The field is the lamp with
  nothing in front of it, and it is the ceiling — which is why the refractile
  bodies screen rather than add, and why a pile of them saturates instead of
  running away.

A third pass, this one for magnification. The field was halved to 48 µm — the
difference between scanning a slide and looking at a cell — and two numbers came
off the plates rather than out of the air:

- **The culture is a little over four hundred million cells to the millilitre.**
  Counted: about forty-five objects in a field roughly sixty-six micrometres
  across, read off the frame against the cells' own diameters, at close to two
  cells an object. Eighty-five cells in 66 × 66 × 45 µm is 4.3 × 10⁸ /mL. The
  record had carried 2 × 10⁸ — plausible, and half of what the plates show.
- **About a third of what is on the slide is dividing.** Pairs inside an unbroken
  wall and quartets sitting where they were released are not a curiosity in these
  plates, they are most of what you look at. The model had them at one cell in
  ten, so the character the whole genus is *described by* was something you had
  to hunt for.

And two things the plates settle about the shape of it:

- **The autospore count is a power of two.** Successive bipartition cannot arrive
  at three or five, and the plates show pairs, quartets, and the occasional
  mother packed with more than you can count. The old draw — a rounded power law
  over 2–8 — was producing every number in between.
- **A sporangium has a contour of its own**, with a visible gap between the
  daughters and the wall that holds them, because the daughters have built their
  own walls already. Drawn as green balls in a sac, they had no anatomy; drawn as
  cells, which is what they are, each one carries its own chloroplast.

## Euglena gracilis — NIES protist morphology reference

https://www.nies.go.jp/chiiki1/protoz/morpho/flagella/euglena.htm — the National
Institute for Environmental Studies (Japan) culture collection's own
morphological description of the genus. A collection describing the strains it
holds is about as close to a primary source as a morphological account gets, and
it is where every dimension on the Euglena cards comes from:

- **E. gracilis: 35–55 × 6–25 µm.** The width range is the interesting half. It
  is not a sloppily reported population spread — it is *one cell at different
  moments*, because a euglenoid has no wall and changes shape as it swims. The
  atlas draws organisms to measured dimensions, and this is the case where a
  single measured dimension does not exist, so the cells are drawn travelling
  along the range rather than sitting at a point on it.
- **Numerous chloroplasts, "discoid, band-form, or fusiform"**, scattered through
  the cytoplasm rather than lining the wall. That is the character that separates
  a euglenoid from a green coccoid at a glance.
- **Paramylon "rod-like to ovoid", commonly two flanking the nucleus.**
- **One emergent flagellum from the anterior reservoir, a quarter to the full
  body length**; a second stays inside and never emerges.
- **A conspicuous anterior stigma**, and a nucleus central to posterior.

## Euglena pellicle — strip architecture

The pellicle is overlapping proteinaceous strips under the plasma membrane, each
with a ridge along one edge and a groove along the other, interlocking with its
neighbours so the sheet holds together while still sliding. They arise at the
flagellar canal and run to the posterior.

**The number this specimen's honesty turns on: in *E. gracilis* the strips are
240 nm groove to groove** — among the finest striation in the genus — against an
Abbe limit of about 220 nm for the objective this atlas draws with. Not
comfortably resolved and not safely invisible: *at* the limit. So the strips are
drawn at the contrast an objective's transfer function passes that close to its
cut-off — about three per cent — which at the working zoom is nothing, and closed
in on a cell in focus is a faint ribbing that comes and goes with the fine focus. A view that showed
countable strips would be making a claim about the microscope rather than about
the organism — the same kind of statement as the Spirulina sheath, which is
invisible in transmitted light for the same reason and visible in the
reconstruction.

**No Euglena micrographs are kept in this repository.** The reference the look
is drawn against is a clip of euglenids at 200× from *Journey to the
Microcosmos* (James Weiss), supplied by the project owner, consulted and not
copied. Frames were pulled out of it and measured rather than eyeballed:

- **The illumination is DIC, not Rheinberg.** Every cell is in relief, bright on
  one side and shadowed on the other in the same direction across the frame —
  and so is the air bubble, which has no pigment and could not be drawn that way
  by anything absorbing. That is Nomarski differential interference contrast,
  and it is the `dic` entry in `FILTERS` in `src/microscope.js`.
- **Its colours are a grade.** A plain DIC image is grey; the footage has a blue
  ground (25, 89, 109) with the cells luminous yellow-green — dark, middle and
  bright cell tones (28, 74, 6), (57, 107, 17), (100, 140, 20). The atlas's DIC
  entry is tuned to those numbers and says that they are a grade.
- **What it shows about the organism**: a mount crowded enough that 22% of the
  frame is empty ground; about half the cells dissolved into a soft haze above
  and below focus; cells in focus finely pebbled rather than patchy, with a
  pointed colourless tail and a red stigma; swimming, and rolling as they go.
- **What it does not settle: the size.** Against the footage's own 100 µm bar
  its euglenids are 30–40 µm long, the small end of *E. gracilis* or under it.
  The atlas keeps the NIES dimensions, so its cells stand a little larger in the
  frame than these do.


## Braarudosphaera bigelowii — the motile stage and the nitroplast

No PDFs are kept for this specimen; every source below is linked from its card.
What each one settles:

- **Suzuki et al. 2021**, *Front. Plant Sci.* 12:749895 (CC BY 4.0) — the motile
  stage in culture, three strains. Genotype III cells 15–22 × 5–9 µm; two
  flagella of equal length; a haptonema with a basal swelling, never seen to
  coil; oval scales of three kinds in several layers; 3–6 spine-like scales at
  both ends; "a distinctive projecting structure at the posterior end"; the
  endosymbiont "between two plastids at the posterior of the cell", one per
  cell and two in a dividing one. And one genotype III strain lost it in culture.
- **Green & Leadbeater 1972**, *J. Mar. Biol. Assoc. UK* 52:469–474 — the
  flagellate described as *Chrysochromulina parkeae*. Flagella 8–20 µm, haptonema
  2.5–4.5 µm, spines 20–31 µm, two golden-brown lateroparietal plastids with
  refractive droplets, dorsoventral compression, slow revolution about the long
  axis. **Since Hagino et al. 2026 the name *parkeae* belongs to the large form
  (genotypes IV and V)**, so these are a sister species' measurements and sit at
  the second tier.
- **Hagino et al. 2026**, *Phycologia* 65:159–176 — the formal split of the
  complex: *B. bigelowii* (genotype III, pentaliths 8–10.5 µm, motile cells
  10–20 µm), *B. parkeae* (IV, V) and *B. okadae* (I, II). Paywalled; its
  motile-cell and scale dimensions were read from **Nannotax3**, which compiles
  them: motile cells 9–19.2 × 3.9–8.7 µm, plate scales 0.9–2.9 µm in three kinds,
  spines 6.4–22.5 µm.
- **Hagino et al. 2013**, *PLoS ONE* 8:e81749 (CC BY 3.0) — UCYN-A inside the
  calcified stage by TEM, a spheroid body about 2 µm across with up to thirty
  lamellae; *C. parkeae* inside the *B. bigelowii* clade by 18S (99.89 %
  similarity to genotype III), which is what joined the two stages.
- **Coale et al. 2024**, *Science* 384:217–222 — the nitroplast: division in step
  with the host by soft X-ray tomography, import of host-encoded proteins by
  proteomics, strain FR-21. Paywalled; its abstract and the Dryad record
  (doi:10.5061/dryad.2z34tmptf, CC0 — the tomograms themselves, ~0.4 GB each)
  were read, not the paper.
- **Cornejo-Castillo et al. 2024**, *Cell* 187:1762–1768 — host to UCYN-A
  effective radius 2.33 ± 0.20, conserved across lineages.
- **Li et al. 2026**, bioRxiv 2026.04.11.717942 (preprint, CC BY-NC-ND, **not
  peer reviewed**) — FIB-SEM of three whole motile FR-21 cells: volume
  130.5 ± 8.2 µm³, plastids 35 %, nitroplast 10.2 ± 0.5 %, an electron-dense
  vacuole 11.5 %, nucleus 6.5 %, mitochondria 4 %; calcified cells from the sea
  570 µm³ with four plastids and two nitroplasts; chloroplast to nitroplast
  volume about 3.2 in both stages. Cryo-ET: nitroplasts 2–4 µm across, internal
  membranes 10–160 nm, a four-layer cyanobacterial envelope with a 12 nm outer
  membrane inside two host-derived layers that open by day. Culture density about
  10⁵ cells/mL. The card that leans on the envelope finding says it is a preprint.
- **Mak et al. 2024**, *Environ. Microbiol. Rep.* 16:e13312 (CC BY 4.0) — FR-21
  grazes bacteria, 6–7 per cell per hour, at night; cell division mostly at night.
- **Thompson et al. 2012**, *Science* 337:1546–1550 — the symbiosis as first
  found, in a small open-ocean prymnesiophyte host.

**What the atlas derives rather than types.** The cell's length is the one at
which the footage's proportions give the FIB-SEM volume (14.4 µm, inside the
species' range); the nitroplast is the sphere of 10.2 % of that volume (2.9 µm,
inside the cryo-ET range) and comes out 0.59 of the cell's width — the footage
shows 0.6, which is two independent measurements agreeing; the plastid plates are
the thickness that makes them 35 %. `tools/check-braarudosphaera.mjs` holds each
of these to its source.

**No Braarudosphaera images are kept in this repository.** The reference is a
brightfield clip of a living FR-21 cell from the Zehr Lab (UC Santa Cruz) and a
labelled light micrograph of the same organism, both supplied by the project
owner, consulted and not copied. Frames were pulled out of the clip and measured:

- **The ground is neutral grey, (208, 209, 206).** Brightfield, no filter.
- **The outline, at thirty-odd stations along the axis on two frames**: a
  truncated front about half the full width, widening almost linearly to the
  widest point at 62 % of the length, then a point behind. Length to width 2.9.
- **The cell is pale.** Its interior transmits about (0.96, 0.91, 0.67) of the
  field — golden, blue taken more than green — and the long path through a
  plate at the margin is brown rather than orange, which is why the pigment
  model's blue channel saturates early.
- **What draws it is its edges**: a pale halo outside (+10 %), a dark rim
  (−50 %, red-brown), a bright yellow line just inside it (+15 %, brighter than
  the empty field), then a darker band and the pale interior with a narrow pale
  streak down the axis — the seam between the two plates. Spines show a bright
  core with dark flanks (+9 / −4 %), flagella a few per cent either way. Every
  one of those has the sign of a phase object a micrometre beyond the plane of
  focus, and the atlas draws the cell there. The halo is the first Fresnel fringe,
  which the transport-of-intensity term cannot make and is added as such.
- **The cell holds station**: against the debris it drifts about a micrometre a
  second, turns now and then, and revolves slowly while the flagella beat.


## Volvox aureus — the colony, and what a Volvox is made of

No PDFs are kept for this specimen; every source below is linked from its card.
**None of the full texts could be opened from where this specimen was written**
— the session's network allowed a search engine and nothing else — so each
source was located, and its bibliographic record checked, through search
results, and what it settles was read from its abstract and from compilations
that cite it. Every figure below is one of those, and where a figure came
second-hand it says so. A reader with the papers open can check each card row
against its source in minutes, and the scientific-correction form is for that.

- **Smith 1944**, *Trans. Am. Microsc. Soc.* 63:265–310 — the comparative
  monograph of the genus, and the source of the species' light-microscope
  figures: colonies 400–600 µm, 500–3200 cells in one layer at the surface of a
  hollow sphere or ellipsoid, four to twelve gonidia of 18–22 µm irregularly in
  the posterior half, embryos expanding to 150–175 µm before release. **Read from
  compilations that cite it** (the encyclopaedic accounts of the species), not
  from the paper.
- **AlgaeBase** — the authority, Ehrenberg 1832, and the species' standing as the
  commonest Volvox, cosmopolitan in lowland fresh water. Compilations give its
  somatic cells as 5–8 µm; the card draws 6 and marks it unestablished.
- **Bisalputra & Stein 1966**, *Can. J. Bot.* 44:1697–1702 — the cytoplasmic
  strands between V. aureus's cells, from division in the embryo that never
  quite finishes.
- **Höhn & Hallmann 2011**, *BMC Biol.* 9:89 — type B inversion, described in V.
  globator and shared by V. aureus: the posterior hemisphere contracts first,
  the opening widens, the anterior half moves over it.
- **Umen 2020**, *EvoDevo* 11:13 — the volvocine algae reviewed; the matrix at
  about 99 % of a V. carteri colony's volume.
- **Matt & Umen 2016**, *Dev. Biol.* 419:99–113 — V. carteri as a developmental
  model: about 2000 somatic cells and 16 gonidia.
- **Kirk et al. 1993**, *J. Cell Biol.* 123:191–208 — in V. carteri a cell's fate
  is its size at the end of cleavage: over about 8 µm, a gonidium.
- **Ishikawa et al. 2020**, *J. Fluid Mech.* 903:A11 — colonies swim upwards in
  still water and turn about vertical axes; a V. carteri colony's radius grows
  with age while the number and size of its cells do not.
- **Drescher et al. 2010**, *PNAS* 107:11171–11176, and **Ueki & Wakabayashi
  2018**, *PNAS* 115 — phototaxis, and the gradient of eyespot size from about
  2.5 µm at the anterior to about 0.8 µm behind.
- **Brumley et al. 2015**, *J. R. Soc. Interface* 12:20141358 — the flagella
  beat in metachronal waves.
- **Kirk 2005**, *BioEssays* 27:299–310; **Herron et al. 2009**, *PNAS*
  106:3254–3258; **Prochnik et al. 2010**, *Science* 329:223–226 — the twelve
  steps from a Chlamydomonas-like cell to Volvox; the multicellular volvocines
  splitting from their single-celled relatives about 234 million years ago,
  their three main lineages by 200; and V. carteri's genome, with much the same
  protein-coding repertoire as Chlamydomonas's.
- **von der Heyde et al. 2025**, *PNAS* — the matrix's compartments, one per
  somatic cell, gamma-distributed, loosening as the colony grows.

**How the colony is drawn**, and the one source that is not about biology: the
cells sit on a spherical Fibonacci lattice, and the shader finds the ones near a
ray with the closed-form inverse of Keinert, Innmann, Sänger & Stamminger
(2015), *ACM Trans. Graph.* 34(6):193, "Spherical Fibonacci mapping".
`tools/check-volvox.mjs` holds that lookup against a brute-force search.

**No Volvox images are kept in this repository.** The reference is a clip
labelled "Volvox, 200x" with a 100 µm scale bar, in darkfield, supplied by the
project owner as a screen recording of a video player; its lower third is in the
style of *Journey to the Microcosmos* (James Weiss), and its source should be
cited by link once it is confirmed. Frames were pulled out of it and measured,
consulted and not copied:

- **It is darkfield.** The empty ground is (3.4, 16, 20.5) across four frames,
  and the specks in it are exactly neutral — their excess over the local ground
  is equal in red, green and blue — so the ring's light is white and the green
  of the colonies is their own.
- **The levels.** 28 % of the frame is empty ground; the out-of-focus faces of
  the colonies are a haze averaging (12, 50, 12) over a third of the frame; 4.6 %
  is brighter than 120 in green, averaging (47, 159, 12) — the young colonies.
- **The rim is brighter than the middle** by about two and a half times over the
  ground, on the lower fifth of each ring (so that the young inside do not count),
  on two colonies. The drawn colony returns about the same, 2.6–2.7.
- **What the colonies carry.** Of thirteen colonies in a frame, ten carry young a
  sixth to a fifth of their diameter, one a third, one small bright bodies, and
  one nothing that shows; four to ten show in each.
- **How many cells.** Counted as points on in-focus faces against the area they
  cover, in three places, roughly 600 to 2800 a colony. No scale bar enters a
  count like that, and the three readings agree no more closely than that.
- **How they move.** In a drop this crowded the colonies do not travel. Each
  turns in place, once every ten to twenty seconds, anticlockwise on screen —
  read by following young round inside colonies over seven seconds of
  continuous footage.
- **What it does not settle: the species, and the size.** Against its own bar
  its colonies are 70–150 µm across — a quarter of V. aureus's mature size — so
  either they are small colonies, or the organism is a smaller Volvox. The atlas
  draws V. aureus at the species' size, framed so a colony spans the share of the
  frame it spans in the footage, and the card "Which Volvox is this?" says so.

## Aurantiochytrium mangrovei RCC893 — the thraustochytrid

The research record is `docs/distinta-anatomica-aurantiochytrium.md`; its
numbered bibliography is the full list. This section keeps what is stored here
and why.

**The species is *A. mangrovei*, strain RCC893** — the project owner's
organism (Russo et al. 2021, *Processes* 9:1834, CC BY). RCC893 (strain name
CKM1) was isolated by K.M. Tsui on 10 September 2002 from decaying leaves in a
brackish mangrove at Sai Kung, Hong Kong (Roscoff Culture Collection record).
It is the only *A. mangrovei* in the 18S tree that erected the genus
*Aurantiochytrium* (Yokoyama & Honda 2007), and those authors note that it is
not the ex-type strain: the type cultures from Goa (NIOCC 90, 97, 98) have been
lost.

**Species-level sources, kept locally (PDFs are gitignored):**

- `raghukumar-1988-schizochytrium-mangrovei.pdf` — Raghu-Kumar 1988, *Trans. Br.
  Mycol. Soc.* 90:627–631, the protologue; © British Mycological Society, read
  from the copy the Roscoff Culture Collection hosts. Young cell 3.7–4.4 µm;
  mature cell 6.3–9.2 µm on pollen, 5–12 µm in nutrient medium; diad → tetrad →
  6–8 → 12 cells, each becoming a zoospore; zoospores elliptical,
  4.1–4.8 × 2.6–3.3 µm, long anterior and short posterior flagellum, lateral;
  in nutrient medium the cell loses its wall and cleaves like an amoeba into
  2–32 zoospores.
- `yokoyama-honda-2007-aurantiochytrium.pdf` — Yokoyama & Honda 2007,
  *Mycoscience* 48:199–211, free on J-STAGE: the genus diagnosis (thin-walled,
  globose, orange thallus; five carotenoids up to astaxanthin; < 5 % ARA and
  ~80 % DHA in the PUFA; small colonies; ectoplasmic net poorly developed;
  zoospores reniform to ovoid) and the RCC893 caveat above.
- `wong-2008-a-mangrovei-MP2.pdf` — Wong et al. 2008, *Mycoscience* 49:266–270,
  J-STAGE: strain MP2 from Hong Kong. Cells spherical and full of lipid bodies
  (DIC); 10.6–45.1 µm (mean 15.6) at 10 % glucose; burst in fresh water; after
  centrifugation a floating layer and a pellet, the floating cells richer in
  larger, more unsaturated lipid bodies.
- `tsui-2012-zoospore-motility.pdf` — Tsui et al. 2012, *Mycoscience* 53:1–9,
  J-STAGE: strain KF6. Zoospores swim straight with occasional turns, up to
  151 µm/s (curvilinear) and 125 µm/s (straight line) at 7.5 ‰ salinity;
  production triggered at 0–15 ‰.
- `russo-2021-a-mangrovei-RCC893.pdf` (CC BY) and
  `delabroise-2022-RCC893-pilot.pdf` (*Mar. Drugs* 20:499, CC BY) — RCC893 in
  culture: YEP on filtered seawater, 24 ± 2 °C in the dark; flask cultures near
  2 × 10⁷ cells/mL.

**Sister-species references, kept in the repository because the licence allows
it** — these are *A. limacinum*, the model tier for this specimen:

- `gilgomez2025-s1-02h.png` … `gilgomez2025-s1-12h.png` — the six unadjusted
  time-lapse stills of the S1 file of Gil-Gomez et al. 2025, *PLoS ONE*
  20:e0326651, https://doi.org/10.1371/journal.pone.0326651, **CC BY 4.0**.
  Strain ATCC MYA-1381 (SR21, the type strain) on a glass-bottom dish, 63×/1.4
  oil objective, 2, 4, 6, 8, 10 and 12 hours after zoospore settlement. Converted
  from TIFF to greyscale PNG without loss (the originals are pure grey).
  **Scale: the 10 µm bar is 83 px, so 8.3 px/µm; the frame is 80 × 94 µm.**
  Measured on them: a settled cell of about 4 µm at 2 h, 5 at 4 h, 6 at 6 h,
  then a dividing cluster of 8, 10.5 and 13.6 µm at 8, 10 and 12 h (a tetrad of
  cells of about 7 µm). The ground is neutral grey, about 110/255. This is the
  reference the settlement view will be calibrated against.
- `gilgomez2025-fig1.png` — the published figure made from those stills, with
  contrast raised to show the ectoplasmic net and arrows on its strands. Same
  licence.
- `deragon2021-fig1-stem.jpg` — Deragon et al. 2021, *Cells* 10:2680,
  https://doi.org/10.3390/cells10102680, **CC BY 4.0**, Fig. 1: scanning
  transmission EM of *A. limacinum* CCAP 4062/1 after two days in rich medium,
  wild type and a lipid hyper-accumulating mutant, with nucleus, Golgi,
  mitochondria, vacuoles and lipid droplets labelled. Measured: wild-type cells
  about 8–9 µm, droplets about 0.6 µm and few; mutant droplets 1–1.9 µm and dense
  round a large vacuole; nucleus 2.5–3 µm; mitochondrial profiles 0.6–1.1 µm.
- `commons-neonja2011-sr21-dic.jpg` — "Aurantiochytrium limacinum SR21", by
  NEON ja (2011), Olympus IX71 with a DP72 colour camera, Wikimedia Commons,
  **CC BY-SA 3.0** — so any adaptation of this one image must carry the same
  licence. DIC, 10 µm bar = 94 px. Measured: cells 10–17 µm, neutral grey
  ground (103, 103, 103), cells without a hue of their own.
- `adl2024-thraustochytrid-schema.jpg` — schematic of a thraustochytrid trophont
  by Sina Adl (2024), from *Protistology* (Elsevier), ch. 7, uploaded by the
  author to Wikimedia Commons under **CC BY 4.0**: scales, mitochondria with
  tubular cristae, nucleus and nucleolus, a lipid globule, the bothrosome and
  the ectoplasmic net. A diagram, not a measurement.

**Kept locally, never published:** `utente-aurantiochytrium-200x.jpg`, the
project owner's own brightfield photograph of RCC893 after 72 h of culture in
YEP, at 200× through the eyepiece with a phone. The owner has chosen not to publish it,
so it is gitignored and only numbers measured on it may appear anywhere else
(distinta §2.10): a 1.0 mm field at 1.32 px/µm, cells 13.2 µm median
(9.5–17.8 µm, 5th–95th percentile, n = 230), about 70 % of cells in groups of
2–7, no zoospores at 72 h, a few rod bacteria (which the owner has chosen not
to have drawn).

**Consulted on the collection's site, not kept:** the Roscoff Culture
Collection's one micrograph of RCC893, on its strain page (no licence stated,
so it is not copied here). Measured on its 5 µm bar (14.4 px/µm): the cell is
19.9 µm across — the record's "length 20 µm" is that one cell — and packed with
lipid droplets of about 1 µm (0.8–1.2); its interior is 1.04 / 1.04 / 0.98 of
the field in red, green and blue, blue about 5 % under green, and its texture
has a standard deviation of 0.103 of the field. It is the reference for the
droplets and for how much colour is really in the cells: taken on a third
microscope, it shows none of the reference photograph's yellow.

**Read, not kept:** Chung et al. 2025 (*Nat. Commun.*, CC BY-NC-ND), Sasaki et
al. 2023 (*J. Phys. Chem. B*, CC BY-NC-ND) and the Stony Brook laboratory pages
(no licence) were consulted and measured; only numbers come from them. The
life-cycle plate of Ganuza et al. 2019 is on Wikimedia Commons as CC BY 4.0, but
the article is not listed as open access, so it is not copied here until the
publisher's licence is confirmed.

## Phaeodactylum tricornutum — the first diatom (October 2026)

The research record is `docs/distinta-anatomica-phaeodactylum.md` (v0.3); its
numbered bibliography is the full list. This section keeps what is stored here
and why. The exterior was built on 10 October 2026, and what it cites is r97–r112
in `src/structures.js`: Bohlin 1897 (r97), Borowitzka & Volcani 1978 (r98),
Tesson et al. 2009 (r99), He et al. 2014 (r100), Galas et al. 2021 (r101),
Uwizeye et al. 2021 (r102), Murison et al. 2023 (r103), Zhang et al. 2023 (r104),
Tanaka et al. 2015 (r105), Chaumier et al. 2024 (r106), Bowler et al. 2008
(r107), Giguere et al. 2022 (r108), the CCAP catalogue (r109), WoRMS (r110), and
the two open images below, Gruber (r111) and Monteil (r112).
`tools/check-phaeodactylum.mjs` holds the drawn culture to them.

**The reference strain is Pt1 8.6** (CCAP 1055/1 = CCMP2561), the clone
De Martino and Ten-Hage isolated in 2003 from the Pt1 culture (CCMP632 =
CCAP 1055/3), which Coughlan isolated around 1956 from a polluted estuary off
Blackpool (CCAP catalogue). It is the genome strain (Bowler et al. 2008;
telomere-to-telomere assembly, 25 chromosomes, Giguere et al. 2022), the strain
of the FIB-SEM reconstruction (Uwizeye et al. 2021) and of the cell-division
study (Tanaka et al. 2015), and it is mostly fusiform.

**Kept in the repository because the licence allows it:**

- `commons-gruber2008-morphotypes.jpg` — "Phaeodactylum tricornutum", by Ansgar
  Gruber, Universität Konstanz (2008), Wikimedia Commons, **CC BY 4.0**. Oval
  (inset), triradiate and fusiform cells in brightfield at high magnification;
  strain not stated. **Scale: the 10 µm bar is 454 px, so 45.4 px/µm.**
  Measured: fusiform 16.5 µm tip to tip (about 17 along the arc), pigmented body
  about 7 × 2.4–3.0 µm, arms 0.9–1.0 µm across; triradiate arms 6.9, 8.0 and
  7.1 µm from the centre at 117°, 117° and 126°; ovals 5.4–7.7 × 2.8–3.2 µm with
  a thick hyaline rim. Field (162, 171, 166); densest plastid 0.53 / 0.68 / 0.33
  of the field in red, green and blue; inside an arm 0.98–1.00, its edges
  0.93–0.95. The reference for the shapes and for the plastid's luminance.
- `commons-monteil2022-pt1-field.jpg` — "Phaeodactylum tricornutum Pt1", by
  R. Monteil (2022), Wikimedia Commons, **CC BY-SA 4.0** — so any adaptation of
  this one image must carry the same licence. A whole field of a Pt1 culture,
  no scale bar, strongly yellow white balance (field 219, 216, 154), phone
  sharpening and purple fringes from the objective. Measured: 122 pigmented
  objects near focus plus many out of focus; pigmented part 183 px median
  (114–244, 10th–90th percentile), which at about 23 µm per cell puts the field
  near 210 × 160 µm. The reference for density, orientation and depth, not for
  colour.
- `commons-bohlin1897-fig9.png` — Bohlin 1897, fig. 9, the protologue's plate,
  **public domain**: (a) the triradiate cell as the vegetative stage, (b–c) a
  fusiform cell and a pair of cells drawn as division stages.
- `uwizeye2021-fig1.png`, `uwizeye2021-fig3.png`, `uwizeye2021-fig5.png` —
  Uwizeye et al. 2021, *Nat. Commun.* 12:1049,
  https://doi.org/10.1038/s41467-021-21314-0, **CC BY 4.0**: the FIB-SEM surface
  of a Pt1 cell (32.6 ± 2.4 µm³), its plastid, nucleus and mitochondria in 3D,
  and the plastid with its pyrenoid crossed by parallel thylakoid stacks. The
  volumes are from the paper's Supplementary Data 1 (read, not stored). Raw
  stacks: BioStudies S-BSST575.
- `galas2021-fig1-tem.jpg`, `galas2021-fig2-plastid.jpg` — Galas et al. 2021,
  *Front. Plant Sci.* 12:638181, https://doi.org/10.3389/fpls.2021.638181,
  **CC BY 4.0**, strain Pt3: TEM of the fusiform, oval and triradiate cells
  (1 µm bars; vacuoles in the arms, one plastid beside a round nucleus, the
  oval's thicker wall), and the plastid's autofluorescence over transmitted
  light for the three forms.
- `he2014-fig2-transformations.png` — He, Han & Yu 2014, *PLoS ONE* 9:e93922,
  https://doi.org/10.1371/journal.pone.0093922, **CC BY 4.0**, strain CCMM 2004:
  cruciform, triradiate and fusiform cells turning oval in four stages, 10 µm
  bars.

**Kept locally, not in the repository** (`*.pdf` is ignored here; both are
subscription papers, supplied by the project owner):

- `borowitzka-volcani-1978-morphotypes.pdf` — Borowitzka & Volcani 1978,
  *J. Phycol.* 14:10–21: the ultrastructure of the three forms, the wall and its
  silica bands, the vacuoles of the arms, the shape variants. A scan with no
  text layer. Measured on it: the oval cell's wall, 30–45 nm in the transverse
  sections of figs 15–16 against their 0.1 µm bars.
- `tesson-2009-polymorphism.pdf` — Tesson, Gaillard & Martín-Jézéquel 2009,
  *Bot. Mar.* 52:104–116: the forms, the conditions that favour each, how an
  oval forms inside a fusiform cell, the long and the round ovals.

**Read, not kept:** Tanaka et al. 2015 (*Protist*, CC BY-NC-ND: the division
sequence and its timing), Flori et al. 2017 (*Nat. Commun.*, CC BY: thylakoid
architecture), Murison et al. 2023 (*Front. Plant Sci.*, CC BY: Pt1 22.6–23.5 ×
3.5–4 µm on thousands of cells, lipid droplets under nitrogen starvation),
Chaumier et al. 2024 (*ISME Commun.*, CC BY: 17 accessions, including Pt14 from
the Gulf of Salerno), Chuberre et al. 2022 and Rastogi et al. 2018 (CC BY), and
the abstracts of the papers listed in the distinta as not yet obtained.
