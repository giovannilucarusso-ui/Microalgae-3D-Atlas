# Contributing

The atlas is built to outgrow one person's reading. Most of what it needs is not
code: someone who knows an organism, has read its literature or has it under a
microscope can add as much as someone who writes shaders.

## The one rule

**No number without a source and a tier.** Every row on every card is one of:

- **measured in this species** — `species`;
- **borrowed from a relative**, because nothing has been measured in this one — `model`;
- **not yet established**, drawn to a plausible proportion and flagged — `unverified`;

and every card cites the works its rows come from. A species with little
literature is welcome. It will carry more of the second and third tier, and that
makes it an honest entry, not a weak one.

## Ways in

| | what it takes | where |
|---|---|---|
| Correct a card | a source | [Scientific correction](https://github.com/giovannilucarusso-ui/Microalgae-3D-Atlas/issues/new?template=scientific-correction.yml) |
| Propose an organism | its literature | [Propose an organism](https://github.com/giovannilucarusso-ui/Microalgae-3D-Atlas/issues/new?template=propose-organism.yml) |
| Share micrographs | a microscope | the organism's proposal, or [Discussions](https://github.com/giovannilucarusso-ui/Microalgae-3D-Atlas/discussions) |
| Add a specimen on an existing generator | some JavaScript | a pull request — [below](#add-a-specimen-on-an-existing-generator) |
| Draw a new body plan | three.js | an issue first, then a pull request |
| Anything else | | [Discussions](https://github.com/giovannilucarusso-ui/Microalgae-3D-Atlas/discussions) |

### Correct a card

The most useful thing a reader can send. Say where the problem is (specimen,
card, row), what the card says, what it should say, and the source: a DOI or a
stable link, with the page, table or figure. Corrections are kept in public, the
way [the external review](docs/review-2026-09-08.md) is. A model that says where
its numbers come from should also show how they were fixed.

If you only suspect something, start a discussion instead: a card changes against
a source.

### Propose an organism

No code. The form asks for the species, what a light microscope shows of it, the
measurements with their tiers, the sources, and reference images you have the
right to share. Every specimen starts from its exterior, meaning what you see
down a lens, and most will have nothing more for a long time. A proposal does not
need ultrastructure.

Someone else can build a well-sourced proposal. Whoever curated its science is
credited on it (see [Licence and credit](#licence-and-credit)).

### Add a specimen on an existing generator

There are four body generators. A species whose body fits one of them needs a
species file, some cards and some bibliography entries, and no rendering code.

| `exterior.kind` | draws | built for |
|---|---|---|
| `helical-trichome` | one helical filament of cells | Spirulina — [`limnospira-platensis.js`](src/species/limnospira-platensis.js) |
| `coccoid-field` | a wet-mount field of round single cells | Chlorella — [`chlorella.js`](src/species/chlorella.js) |
| `euglenoid-field` | a field of flexible, spindle-shaped flagellates | Euglena — [`euglena-gracilis.js`](src/species/euglena-gracilis.js) |
| `haptophyte-field` | a scaly flagellate with a flattened body, parietal plastids, flagella, haptonema and spine-scales | Braarudosphaera — [`braarudosphaera-bigelowii.js`](src/species/braarudosphaera-bigelowii.js) |

1. **Start from the closest record** in [`src/species/`](src/species/) and give
   it its own `id`, `name`, `latin`, `authority` and `group`. The parameters
   under `exterior` belong to the generator, and the record you copied explains
   each of them.
2. **Place it on the tree.** `lineage: { domain, supergroup, phylum }` says
   where the landing page hangs it (a bacterium has no supergroup), and
   `tagline` is the one sentence it is introduced with there. If the tree in
   [`src/tree.js`](src/tree.js) shows your phylum as an empty slot, the specimen
   fills it; if the phylum is not there at all, add it to `LINEAGES`.
3. **Name your tiers.** `tiers.species` and `tiers.model` are the two labels that
   have to name an organism. Chlorella's are *Measured in Chlorella* and *From
   the genus or a close relative*. The third label is the same everywhere.
4. **Write the cards**, one for each structure a reader can pick:

   | field | |
   |---|---|
   | `name`, `latin` | what the structure is called |
   | `view3d` | `'filament'` for the exterior view, `'cell'` for an interior |
   | `confidence` | the tier of the card as a whole |
   | `what` | what the structure is |
   | `role` | what it does, and why it looks the way it does here |
   | `caveat` | optional: where the drawing knowingly departs from what was observed |
   | `dimensions` | rows of `[what, value, tier]` |
   | `sources` | ids from `SOURCES` in [`src/structures.js`](src/structures.js) |
   | `camera` | where the view goes when the card opens |

   List every card in one of the `exterior.groups`. The groups are the panel's
   table of contents and the order of the tour.
5. **Add the sources** to `SOURCES` in `src/structures.js`, under the next free
   `rNN`. Use a DOI link wherever one exists.
6. **Register the record** in [`src/species/index.js`](src/species/index.js).
7. **Check it and look at it.** Run `npm run check`, then `npm run dev`, and open
   the pull request with a screenshot.

### Draw a new body plan

A chain-forming diatom, a dinoflagellate or a colony each needs a new generator.
It sits beside [`Trichome.jsx`](src/Trichome.jsx),
[`CellField.jsx`](src/CellField.jsx), [`EuglenaField.jsx`](src/EuglenaField.jsx)
and [`HaptophyteField.jsx`](src/HaptophyteField.jsx), is selected by a new
`exterior.kind` in `App.jsx`, and that kind is added to the list in
[`tools/check-atlas.mjs`](tools/check-atlas.mjs). Give it a disc on the landing
page too, in `organism()` in [`src/landing/main.js`](src/landing/main.js); until
then it is shown as an empty ring. A field that integrates its
cells along the ray can take the condenser's two beams, the pigment calibration
and the offscreen compositing from [`src/twoBeam.jsx`](src/twoBeam.jsx) rather
than writing them again. Open an issue before you
start, so that two people do not build the same one.

Two things to know first:

- **A species declares nothing about rendering.** Every specimen is seen through
  the same instrument, [`src/microscope.js`](src/microscope.js). If a species
  needed its own optics to look right, that would mean the optics are wrong.
- **Read [`docs/design-notes.md`](docs/design-notes.md).** It records what has
  already been tried and rejected, so you do not have to re-derive it.

### Share micrographs

Your own micrographs of an organism are reference material the atlas is short of.
Post them in the organism's proposal or in Discussions, with:

- the strain, if you know it;
- the objective;
- the illumination (brightfield, phase contrast, DIC…);
- a licence that lets them be used, CC BY 4.0 or CC0.

## Sources and copyright

- **Never commit material you do not have the right to redistribute:** a paper's
  PDF, its figures, or frames from a video. Cite it by DOI or link instead.
  [`docs/fonti/README.md`](docs/fonti/README.md) says what each source settles and
  where to find it, and `.gitignore` keeps PDFs out of the repository.
- **Openly licensed figures may be included, with attribution.** The example is
  the three plates from Nowicka-Krawczyk et al. (2019), which are CC BY 4.0.
- **A video you drew against can be cited by link.** Its frames stay out of the
  repository and out of anything published from it.

## Licence and credit

By contributing, you agree to the same licences as the rest of the atlas:

- code under the MIT licence ([`LICENSE`](LICENSE));
- data, card text, documentation and images under CC BY 4.0
  ([`LICENSE-CONTENT`](LICENSE-CONTENT)).

Whoever curates a specimen (its cards, tiers and sources) is named in its species
file and listed among the authors in [`CITATION.cff`](CITATION.cff), the author
list a citation of the atlas uses. A correction is credited in the commit that
makes it.

## Review

Every pull request runs `npm run check`:

- [`tools/check-science.mjs`](tools/check-science.mjs) checks the constraints
  Spirulina's numbers have to satisfy;
- [`tools/check-atlas.mjs`](tools/check-atlas.mjs) checks that every specimen
  record can be drawn: tiers from the three, sources that resolve, cards that can
  be reached;
- [`tools/check-shaders.mjs`](tools/check-shaders.mjs) catches a stray backtick
  inside GLSL.

Passing the check means a record is well-formed, not that it is right. A change
to the science is merged only after its numbers have been read against the
sources it cites.

## Working on it

```bash
npm install
npm run dev     # http://localhost:5173
npm run check   # science constraints, specimen records, shaders
npm run shots   # headless renders into docs/shots/: needs the dev server and Chrome (CHROME_PATH)
```

The renders are how the 3D output gets inspected. For a visual change, attach one.

Issues and pull requests are written in English so that anyone can follow them.
Italian is welcome too.
