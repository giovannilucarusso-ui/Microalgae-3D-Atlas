// Folds the Vite build into ONE self-contained .html file, so the app can be
// handed to someone as a plain attachment: no server, no npm, no network.
// A normal `dist/` needs to be served over http — a browser refuses to load
// `<script type="module" src=...>` from file://. Inlined, there is nothing to
// fetch, so a double-click is enough.
//
//   npm run share      → vite build, then share/spirulina-3d.html
//
// The build is part of the script rather than a step to remember. This reads
// `dist/` and never writes it, so run on its own it will happily bundle
// whatever was built last — and `npm run share:check` will pass, because a
// stale bundle is a perfectly working bundle. That was harmless while the file
// was ignored; it stopped being harmless the moment the bundle became the
// tracked deliverable.
//
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = 'dist'
const OUT_DIR = 'share'
const OUT = join(OUT_DIR, 'spirulina-3d.html')
// An Artifact is wrapped in the host's own <!doctype>/<head>/<body> at publish
// time, so handing it a second complete document nests one inside the other and
// the inner <title> is dropped on the floor. This one is page content only.
const OUT_ARTIFACT = join(OUT_DIR, 'spirulina-3d.artifact.html')

const read = (href) => readFile(join(DIST, href.replace(/^\//, '')), 'utf8')

// A `</script>` anywhere inside the bundle would close the tag early. It can
// only ever appear inside a string literal, where the escape is a no-op to JS.
const safeJs = (js) => js.replace(/<\/script/gi, '<\/script')
const safeCss = (css) => css.replace(/<\/style/gi, '<\/style')

// Minified code is full of `$&`, `$1`, `$'` — every one of them a substitution
// pattern if the replacement is handed to .replace() as a string. It has to go
// in as a function, or the bundle rewrites itself with copies of its own tag.
const sub = (haystack, tag, replacement) => haystack.replace(tag, () => replacement)

let html = await readFile(join(DIST, 'index.html'), 'utf8')

// Preloads point at files that are about to stop existing.
html = html.replace(/\s*<link[^>]+rel="modulepreload"[^>]*>/gi, '')

const js = []
const css = []

const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/gi)]
for (const [tag, href] of scripts) {
  const code = safeJs(await read(href))
  js.push(code)
  html = sub(html, tag, `<script type="module">\n${code}\n</script>`)
}

const styles = [...html.matchAll(/<link\b[^>]*\bhref="(\/assets\/[^"]+\.css)"[^>]*>/gi)]
for (const [tag, href] of styles) {
  const sheet = safeCss(await read(href))
  css.push(sheet)
  html = sub(html, tag, `<style>\n${sheet}\n</style>`)
}

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT, html)

// The same bundle again, as page *content* rather than as a document.
//
// The charset goes first and is not optional. Dropping the <head> drops the
// `<meta charset>` with it, and the encoding sniffer only reads the first 1024
// bytes — so without it the browser falls back to the system codepage and every
// non-ASCII character in the bundle is mangled: `·` becomes `Â·`, `1 µm` becomes
// `1 Âµm`, the arrows on the stepper turn to mush. The interface is full of
// them, and they are all inside the inlined script, which is decoded with the
// document's encoding like everything else.
//
// The title comes next so it falls inside the first 8 KB the host scans for
// one, ahead of seventeen kilobytes of stylesheet. It is the bare name and not
// the document title: an artifact is picked out of a gallery by its name, and
// "Spirulina 3D — Limnospira platensis" is a name with a caption stapled to it.
//
// The shim is the one thing the wrapped page needs that the standalone file
// does not, and it repeats itself on purpose. The scene is sized off a chain of
// `height: 100%`, which resolves only if every ancestor already has a height —
// not a thing to assume inside somebody else's skeleton — so both ends of the
// chain are nailed down here and the root is anchored to the viewport as well.
// The ground is repainted for the same reason: the host composites the page
// over a background it paints in the *viewer's* theme, so a body that does not
// state its own colour borrows whatever that happens to be.
await writeFile(
  OUT_ARTIFACT,
  [
    '<meta charset="utf-8">',
    '<title>Spirulina 3D</title>',
    ...css.map((sheet) => `<style>\n${sheet}\n</style>`),
    '<style>',
    '  html, body, #root { margin: 0; padding: 0; height: 100%; }',
    '  #root { height: 100dvh; }',
    '  body { background: #06110f; overflow: hidden; }',
    '</style>',
    '<div id="root"></div>',
    ...js.map((code) => `<script type="module">\n${code}\n</script>`),
    '',
  ].join('\n'),
)

// Anything still pointing into assets/ would break the moment the file travels
// alone, and that is exactly the failure the recipient would hit, not us.
const dangling = [...html.matchAll(/["'(](\/?assets\/[^"')]+)/g)].map((m) => m[1])
const size = (Buffer.byteLength(html) / 1024 / 1024).toFixed(2)
console.log(`wrote ${OUT} — ${size} MB, ${scripts.length} script(s) + ${styles.length} stylesheet(s) inlined`)
console.log(`wrote ${OUT_ARTIFACT} — the same bundle as page content, for publishing`)
if (dangling.length) {
  console.log('\nWARNING — still references files outside the html:')
  for (const d of new Set(dangling)) console.log('  ' + d)
  process.exit(1)
}
