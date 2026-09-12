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

