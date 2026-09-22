// The landing page's view of the atlas, read out of the species records.
//
// The landing page draws the tree and says, for every specimen, how many of its
// measurements were taken in the organism itself. Those counts live in the
// cards, and the cards cannot be shipped to the landing page as they are: they
// sit behind structures.js, which imports the geometry, which imports three.js —
// the better part of a megabyte for a page that draws a circle and some text.
//
// So the records are read here, in Node, when the site is built (or when the dev
// server first serves the page), and what the landing page needs goes to it as
// a small module, `virtual:atlas-index`. Nothing is typed in twice: a new card
// or a retiered row changes the numbers on the landing page at the next build.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ID = 'virtual:atlas-index'
const RESOLVED = '\0' + ID

// "Keeling (2010) Philos Trans…" → "Keeling (2010)", and three authors or more
// → "Coale et al. (2024)". Every entry in the bibliography opens with its
// authors and year, and the tree cites in that form.
function short(text) {
  const m = /^(.*?)\s*\((\d{4}[a-z]?)\)/.exec(text)
  if (!m) return text
  const authors = m[1].split(/,\s*|\s+&\s+/).filter(Boolean)
  return `${authors.length > 2 ? `${authors[0]} et al.` : authors.join(' & ')} (${m[2]})`
}

export function buildIndex({ version, SPECIES, SOURCES, confidenceFor, LINEAGES, ENDOSYMBIOSES, TREE_SOURCES }) {
  const cite = (id) => ({ id, short: short(SOURCES[id].text), text: SOURCES[id].text, url: SOURCES[id].url })
  return {
    version,
    species: SPECIES.map((s) => {
      const cards = Object.values(s.structures)
      const rows = cards.flatMap((c) => c.dimensions ?? [])
      const tiers = { species: 0, model: 0, unverified: 0 }
      for (const [, , tier] of rows) tiers[tier]++
      const words = s.latin.split(/\s+/)
      const labels = confidenceFor(s)
      return {
        id: s.id,
        name: s.name,
        latin: s.latin,
        genus: words[0],
        epithet: words[words.length - 1],
        authority: s.authority ?? null,
        group: s.group,
        lineage: s.lineage,
        tagline: s.tagline,
        views: [s.exterior, s.interior].filter(Boolean).map((v) => v.label),
        // What the landing page draws in the specimen's disc: the body generator
        // it is drawn with, and for a coccoid the sizes its cells come in.
        body: { kind: s.exterior.kind, cell: s.exterior.cell ?? null, seed: s.exterior.seed ?? 1 },
        cards: cards.length,
        rows: rows.length,
        tiers,
        tierLabels: Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, v.label])),
        sources: new Set(cards.flatMap((c) => c.sources ?? [])).size,
      }
    }),
    lineages: LINEAGES,
    endosymbioses: ENDOSYMBIOSES.map((e) => ({ ...e, sources: e.sources.map(cite) })),
    treeSources: TREE_SOURCES.map(cite),
  }
}

// The files the index is read from. A change to any of them in development
// reloads the landing page with fresh numbers.
const WATCHED = /[\\/]src[\\/](species[\\/].*|tree\.js|structures\.js|science\.js|sites\.js)$/

export function atlasIndex() {
  let root = process.cwd()
  let server = null
  return {
    name: 'atlas-index',
    configResolved(config) {
      root = config.root
    },
    configureServer(s) {
      server = s
      s.watcher.on('change', (file) => {
        if (!WATCHED.test(file)) return
        const mod = s.moduleGraph.getModuleById(RESOLVED)
        if (mod) s.moduleGraph.invalidateModule(mod)
        s.ws.send({ type: 'full-reload', path: '/index.html' })
      })
    },
    resolveId(id) {
      return id === ID ? RESOLVED : null
    },
    async load(id) {
      if (id !== RESOLVED) return null
      // In development the dev server loads the records, so an edit reaches the
      // page without a restart; a build reads them the way `npm run check` does.
      const load = (path) =>
        server ? server.ssrLoadModule(path) : import(pathToFileURL(resolve(root, '.' + path)).href)
      const [species, structures, tree] = await Promise.all([
        load('/src/species/index.js'),
        load('/src/structures.js'),
        load('/src/tree.js'),
      ])
      const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
      const index = buildIndex({
        version,
        SPECIES: species.SPECIES,
        SOURCES: structures.SOURCES,
        confidenceFor: structures.confidenceFor,
        LINEAGES: tree.LINEAGES,
        ENDOSYMBIOSES: tree.ENDOSYMBIOSES,
        TREE_SOURCES: tree.TREE_SOURCES,
      })
      return `export default ${JSON.stringify(index)}`
    },
  }
}
