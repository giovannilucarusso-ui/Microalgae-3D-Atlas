# Microalgae 3D Atlas

An interactive 3D cell atlas of microalgae and cyanobacteria that says where
every number came from.

Anatomical illustrations do not carry their provenance. You cannot tell, looking
at one, whether a spacing was measured in the organism drawn, borrowed from a
relative, or invented to make the picture read. This atlas is built the other way
round: each dimension is dated, sourced, and marked at one of three confidence
tiers, and the constraints those numbers have to satisfy are asserted in code
rather than left as prose.

**First specimen: Spirulina** (*Limnospira* / *Arthrospira platensis*) — the
cyanobacterium behind the commercial product, and the one with enough published
ultrastructure to build against. Two scales: the helical trichome as a wet mount
in transmitted light, and one cell opened in a nanometre-scale cutaway.

| | |
|---|---|
| clickable structures | 19 |
| dated measurements | 88 |
| **measured in Spirulina itself** | **56 — 64 %** |
| taken from model cyanobacteria | 22 — 25 % |
| not yet established | 10 — 11 % |
| primary sources | 28, every one cited by a card |
| constraints asserted in code | 36 (`npm run check`) |

## The three tiers

Every row on every card is one of:

- **Measured in Spirulina** — the figure comes from this organism.
- **From model cyanobacteria** — no measurement exists for Spirulina; the value
  is borrowed, and the card says so.
- **Not yet established** — drawn to a plausible proportion, and flagged.

This is the part that scales. A species with far less literature than Spirulina
can still be built honestly: it will simply carry more of the second and third
tier, and how little is known about it is itself worth showing. An illustration
has no way to declare its own uncertainty; this does.

Where the model knowingly departs from what was observed, the card says that
too. The polyglucan rods are recorded as packed in a hexagonal array and are
drawn individually against the lamellae — and the card states the difference
rather than hiding it.

## Adding a specimen

The microscope and the organism are separate. [`src/microscope.js`](src/microscope.js)
holds the instrument — two objectives, their optics, and the arithmetic that
turns "how much slide do I want in frame" into a working distance, clipping
planes, zoom limits and fine-focus travel. [`src/species/`](src/species/) holds
the organisms. A species declares how big it is and which way to look at it; it
declares nothing about rendering, because every specimen in this atlas is looked
at through the same instrument. **A species that needed its own optics to look
right would be evidence the optics are wrong.**

A new specimen is a file in `src/species/` and a line in its index. What it needs:

```js
exterior: {
  kind: 'helical-trichome',  // which body generator draws it
  fieldUm: 451.3,            // how much slide is in frame; the camera follows
  view: [299, 160, 518],     // which way to look
  …the generator's own parameters
}
```

`kind` selects the generator. A coccoid, a chain-forming diatom or a flagellate
is a new generator beside [`Trichome.jsx`](src/Trichome.jsx) and a different set
of parameters — not a flag inside it.

**A species may have an exterior and no interior at all**, and most will for a
long time. That is what the confidence tiers are for: a specimen whose literature
supports the outside and little else still belongs here, carrying more of the
second and third tier, and how little is known about it is itself worth showing.

## Run it

```bash
npm install
npm run dev
```

To produce a copy you can send to someone — one self-contained HTML file, no
server, no npm, no network, a double-click is enough:

```bash
npm run share        # builds, then folds it into share/spirulina-3d.html
npm run share:check  # opens that file in headless Chrome and proves it stands alone
```

There is no hosted copy yet.

## What it is not

The cell interior is not an acquired image and should not be read as one. It is
an interpretive, false-colour reconstruction informed by transmission electron
microscopy: the evidence is section contrast, and the fourteen material colours
are annotation. The filament view is drawn as transmitted light because that is
genuinely how you meet this organism; the interior borrows the register of a
confocal stack or a tomogram because 56 nm is past what any lens resolves.

## Sources

`docs/fonti/README.md` describes every source, what it settles, and where it came
from. The PDFs themselves are **not** in this repository — one of them is not
open access — so a fresh clone has the descriptions and not the papers. The three
figures from Nowicka-Krawczyk et al. (2019) are included under their own CC BY
4.0 licence, with attribution.

## Licence

- **Code** — MIT, in [`LICENSE`](LICENSE).
- **Anatomical data, card text, documentation and rendered images** — CC BY 4.0,
  in [`LICENSE-CONTENT`](LICENSE-CONTENT). Attribution required; the data is the
  part that took the reading rather than the typing.

## Citing it

See [`CITATION.cff`](CITATION.cff). Where you rely on a specific measurement,
cite the primary source the card names as well — a figure reused without its
sources loses the one thing that separates it from an illustration.

## Audited

[`docs/review-2026-09-08.md`](docs/review-2026-09-08.md) is an external review of
the implementation, kept unedited, with a status header saying how each of its
fifteen findings was closed. It is here because a model that claims to say where
its numbers come from should also say who has checked it and what they found.

## How it is drawn, and why

[`docs/design-notes.md`](docs/design-notes.md) is the long account: what the
optics are modelling, why the thylakoid stack is generated rather than drawn,
what was tried and rejected, and which findings would otherwise be re-derived
from scratch. It is the record of the reasoning, not an introduction.

Vite · React 19 · Three.js · React Three Fiber · drei
