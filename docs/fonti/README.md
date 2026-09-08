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
