# Fonts

The atlas's typefaces, served from the site itself. How they are used is in
[`oculare.css`](oculare.css).

| Family | Styles | Foundry | Licence |
|---|---|---|---|
| Sofia Sans | upright, variable weight | Lettersoup | [SIL OFL 1.1](sofia-sans/OFL.txt) |
| Sofia Sans Extra Condensed | upright, variable weight | Lettersoup | [SIL OFL 1.1](sofia-sans-extra-condensed/OFL.txt) |
| Sofia Sans Semi Condensed | italic, variable weight | Lettersoup | [SIL OFL 1.1](sofia-sans-semi-condensed/OFL.txt) |
| Martian Mono | upright, variable weight and width | Evil Martians | [SIL OFL 1.1](martian-mono/OFL.txt) |

The `.woff2` files are the Latin and Latin Extended subsets that Google Fonts
serves for these families (fonts.gstatic.com, September 2026), unmodified; the
licences are those in [google/fonts](https://github.com/google/fonts/tree/main/ofl).
The SIL Open Font License lets them be used, bundled and redistributed with the
atlas, provided each keeps its licence alongside it and none is sold on its own.

To add a subset or a style, take the `@font-face` block Google Fonts serves for
it, save the file it points at next to the others, and point the block at that
file instead.
