// Assertions over every specimen record — the part of the atlas other people
// will add to. check-science.mjs holds Spirulina's numbers to the literature;
// this holds every species file to the shape the atlas can draw, so a
// contribution fails here, with a sentence, instead of in front of a reader.
//
// Two of these are crashes rather than tidiness. A card citing a source id the
// bibliography does not have takes the info panel down when it is opened, and
// so does a dimension row whose tier is not one of the three: both are looked
// up, not printed. Run with `npm run check`.
import { SPECIES } from '../src/species/index.js'
import { CONFIDENCE, SOURCES } from '../src/structures.js'
import { ENDOSYMBIOSES, LINEAGES, RANKS, TREE_SOURCES } from '../src/tree.js'

let failures = 0
let checks = 0

function check(name, condition, detail = '') {
  checks++
  if (condition) return
  failures++
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

// The same check over many entries, naming the ones that fail it.
function every(name, entries, ok) {
  const bad = entries.filter(([, value]) => !ok(value)).map(([key]) => key)
  check(name, bad.length === 0, bad.join(', '))
}

const isText = (v) => typeof v === 'string' && v.trim() !== ''
const isDirection = (v) =>
  Array.isArray(v) && v.length === 3 && v.every(Number.isFinite) && v.some((n) => n !== 0)

const TIERS = Object.keys(CONFIDENCE)

// Whether a species' lineage is a path the landing page's tree has: a domain,
// then a supergroup where the domain has them, then a phylum.
function onTree(lineage) {
  const domain = LINEAGES.find((l) => l.name === lineage?.domain)
  const under = lineage?.supergroup
    ? domain?.children?.find((l) => l.rank === 'supergroup' && l.name === lineage.supergroup)
    : domain
  return Boolean(under?.children?.some((l) => l.rank === 'phylum' && l.name === lineage?.phylum))
}

// The body generators App.jsx dispatches on. An exterior kind it does not know
// is not an error there: it falls through to the trichome, which is why it is
// one here. A new generator adds its kind to this list.
const EXTERIOR_KINDS = ['helical-trichome', 'coccoid-field', 'euglenoid-field', 'haptophyte-field']
// App.jsx draws every interior with CellSection, whatever the kind says. The
// list is here so that a second interior arrives with its own kind and its own
// dispatch, rather than quietly being given Spirulina's cell.
const INTERIOR_KINDS = ['cyanobacterial-cutaway']

// ── The registry ───────────────────────────────────────────────────────────

console.log('registry')
const ids = SPECIES.map((s) => s.id)
check('every species id is unique', new Set(ids).size === ids.length,
  ids.filter((id, i) => ids.indexOf(id) !== i).join(', '))
check('every species id is lower-case words joined by hyphens',
  ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)))

// ── Each species ───────────────────────────────────────────────────────────

for (const species of SPECIES) {
  console.log(species.id)
  const cards = Object.entries(species.structures ?? {})

  check('it has a name, a Latin name and a group',
    [species.name, species.latin, species.group].every(isText))
  // Where it hangs on the landing page's tree, and the sentence it is
  // introduced with there. A lineage the tree does not have would leave the
  // specimen off the page altogether, without an error anywhere.
  check('it names its lineage — at least a domain and a phylum',
    isText(species.lineage?.domain) && isText(species.lineage?.phylum))
  check('its lineage is a path on the tree in src/tree.js', onTree(species.lineage),
    `${[species.lineage?.domain, species.lineage?.supergroup, species.lineage?.phylum].filter(Boolean).join(' › ')} — add it to LINEAGES`)
  check('it has a tagline for the landing page', isText(species.tagline))
  check('it has cards', cards.length > 0)
  // confidenceFor() reads these two and no others: the third label, "not yet
  // established", names no organism and stays the same across the atlas.
  check('it renames only the two tiers that name an organism',
    !species.tiers ||
      Object.entries(species.tiers).every(([k, v]) => (k === 'species' || k === 'model') && isText(v)))
  check('it has an exterior — every specimen starts from what a light microscope shows',
    Boolean(species.exterior))

  const parts = [
    { part: 'exterior', record: species.exterior, kinds: EXTERIOR_KINDS, view3d: 'filament', field: 'fieldUm' },
    { part: 'interior', record: species.interior, kinds: INTERIOR_KINDS, view3d: 'cell', field: 'fieldNm' },
  ].filter((p) => p.record)

  for (const { part, record, kinds, view3d, field } of parts) {
    check(`the ${part} is a kind a generator draws`, kinds.includes(record.kind),
      `"${record.kind}" is not one of ${kinds.join(', ')}`)
    check(`the ${part} has a label and a caption`, isText(record.label) && isText(record.caption))
    check(`the ${part} field of view is a positive length`,
      Number.isFinite(record[field]) && record[field] > 0, `${field} is ${record[field]}`)
    check(`the ${part} view is a direction`, isDirection(record.view))

    // The groups are the panel's table of contents and the order of the tour.
    // A card left out of them can only be reached by clicking the model, and a
    // group naming a card that does not exist lists nothing.
    const listed = (record.groups ?? []).flatMap((g) => g.ids ?? [])
    check(`every card the ${part} groups list exists`, listed.every((id) => species.structures?.[id]),
      listed.filter((id) => !species.structures?.[id]).join(', '))
    check(`every card the ${part} groups list is drawn in that view`,
      listed.every((id) => !species.structures?.[id] || species.structures[id].view3d === view3d),
      listed.filter((id) => species.structures?.[id] && species.structures[id].view3d !== view3d).join(', '))
    every(`every card drawn in the ${part} is listed in exactly one of its groups`,
      cards.filter(([, c]) => c.view3d === view3d),
      (c) => listed.filter((id) => species.structures[id] === c).length === 1)
  }

  const views = new Set(parts.map((p) => p.view3d))
  every('every card belongs to a view this species has', cards, (c) => views.has(c.view3d))
  every('every card says what the structure is and what it does', cards,
    (c) => [c.name, c.what, c.role].every(isText))
  every(`every card is marked at one of the tiers — ${TIERS.join(', ')}`, cards,
    (c) => TIERS.includes(c.confidence))
  every('every dimension row is [what, value, tier], with a tier from that list', cards,
    (c) =>
      Array.isArray(c.dimensions) &&
      c.dimensions.every(
        (row) => Array.isArray(row) && row.length === 3 && isText(row[0]) && isText(row[1]) && TIERS.includes(row[2]),
      ))
  // "Not yet established" is a statement about the literature, and it needs
  // the literature cited as much as a measurement does.
  every('every card cites at least one source', cards,
    (c) => Array.isArray(c.sources) && c.sources.length > 0)
  every('every source a card cites is in the bibliography', cards,
    (c) => (c.sources ?? []).every((id) => SOURCES[id]))
}

// ── The tree ───────────────────────────────────────────────────────────────
//
// src/tree.js, as the landing page draws it. The page gives every lineage and
// genus an id made from its name, and finds the ends of an endosymbiosis by
// name, so a name used twice or misspelt is a node drawn in the wrong place or
// an arrow drawn nowhere.

console.log('tree')
const lineages = []
;(function walk(list) {
  for (const l of list ?? []) {
    lineages.push(l)
    walk(l.children)
  }
})(LINEAGES)
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const genera = [...new Set(SPECIES.map((s) => s.latin.split(/\s+/)[0]))]
every('every lineage has a name and a rank the tree draws', lineages.map((l) => [l.name ?? '?', l]),
  (l) => isText(l.name) && RANKS.includes(l.rank))
every('every "more" slot has a name and a note', lineages.filter((l) => l.more).map((l) => [l.name, l]),
  (l) => isText(l.more.name) && isText(l.more.note))
const treeIds = [
  ...lineages.map((l) => slug(l.name)),
  ...lineages.filter((l) => l.more).map((l) => slug(l.more.name)),
  ...genera.map(slug),
  ...SPECIES.map((s) => s.id),
]
check('every lineage, genus and species has an id of its own on the landing page',
  new Set(treeIds).size === treeIds.length, treeIds.filter((id, i) => treeIds.indexOf(id) !== i).join(', '))

// The landing page colours the four; a fifth kind would be drawn in none.
const ENDO_KINDS = ['primary', 'green', 'red', 'nitro']
const ends = new Set([...lineages.map((l) => l.name), ...genera])
const endos = ENDOSYMBIOSES.map((e) => [`${e.from} → ${e.to}`, e])
every('every endosymbiosis runs between lineages on the tree or genera in the atlas', endos,
  (e) => ends.has(e.from) && ends.has(e.to))
every(`every endosymbiosis is a kind the landing page colours — ${ENDO_KINDS.join(', ')}`, endos,
  (e) => ENDO_KINDS.includes(e.kind))
every('every endosymbiosis says what it is and cites the bibliography', endos,
  (e) => isText(e.label) && isText(e.note) && e.sources?.length > 0 && e.sources.every((id) => SOURCES[id]))
check('every source the tree itself rests on is in the bibliography', TREE_SOURCES.every((id) => SOURCES[id]))

// ── The bibliography ───────────────────────────────────────────────────────

console.log('bibliography')
const sources = Object.entries(SOURCES)
every('every source says what it is and links to it over https', sources,
  (s) => isText(s.text) && /^https:\/\/\S+$/.test(s.url ?? ''))
// One work under two ids is two entries to correct when one of them is wrong.
const urls = sources.map(([, s]) => s.url)
check('no work is in the bibliography twice', new Set(urls).size === urls.length,
  sources.filter(([, s], i) => urls.indexOf(s.url) !== i).map(([id]) => id).join(', '))

// ───────────────────────────────────────────────────────────────────────────

console.log()
if (failures) {
  console.error(`${failures} of ${checks} checks failed`)
  process.exit(1)
}
console.log(`${checks} checks passed`)
