// The landing page: the atlas drawn as a tree of life, every specimen a leaf
// that opens it at the microscope.
//
// Nothing here is typed in. The specimens, their places on the tree and their
// counts come from the species records by way of `virtual:atlas-index` (see
// tools/atlas-index.mjs); the lineages, the empty slots and the endosymbioses
// from src/tree.js. A species file added to the registry is on this page at the
// next build.
//
// The page is plain DOM and SVG, not React: it has one tree to draw and one card
// to fill, and it should be on screen before the microscope's megabyte of
// three.js has even been asked for.
// The version comes with the index rather than from package.json, which the
// microscope imports too: a module both pages import becomes a chunk they share,
// and the one-file bundle cannot carry a chunk on the side.
import atlas from 'virtual:atlas-index'
import './landing.css'

const PROPOSE = 'https://github.com/giovannilucarusso-ui/Microalgae-3D-Atlas/issues/new?template=propose-organism.yml'
const microscope = (id) => `microscope.html#/${id}`

const RANKS = ['Cellular life', 'Domain', 'Supergroup', 'Phylum', 'Genus', 'Species']
const RANK_OF = { domain: 1, supergroup: 2, phylum: 3, genus: 4, species: 5 }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const f = (v) => +v.toFixed(1)
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// ── The tree ───────────────────────────────────────────────────────────────
//
// The lineages from src/tree.js, with each specimen hung under its phylum by
// genus. A lineage with no specimen anywhere under it is a slot to fill.

const NODES = {}
const TREE = (() => {
  const byPhylum = new Map()
  for (const s of atlas.species) byPhylum.set(s.lineage.phylum, [...(byPhylum.get(s.lineage.phylum) ?? []), s])

  const make = (l, parent) => {
    const node = { id: slug(l.name), name: l.name, common: l.common ?? null, rank: RANK_OF[l.rank], parent, children: [] }
    for (const c of l.children ?? []) node.children.push(make(c, node))
    if (l.rank === 'phylum') {
      const species = byPhylum.get(l.name) ?? []
      for (const g of new Set(species.map((s) => s.genus))) {
        const genus = { id: slug(g), name: g, rank: 4, genus: true, parent: node, children: [] }
        genus.children = species.filter((s) => s.genus === g).map((s) => ({ id: s.id, name: s.latin, rank: 5, sp: s, parent: genus, children: [] }))
        node.children.push(genus)
      }
      if (l.more && species.length) {
        node.children.push({ id: slug(l.more.name), name: l.more.name, note: l.more.note, rank: 4, parent: node, children: [] })
      }
    }
    return node
  }
  const root = { id: 'root', name: 'Cellular life', rank: 0, parent: null, children: [] }
  root.children = atlas.lineages.map((l) => make(l, root))

  const mark = (n) => {
    NODES[n.id] = n
    if (n.sp) return true
    const has = n.children.map(mark).some(Boolean)
    n.missing = !has
    return has
  }
  mark(root)
  return root
})()

const each = (fn, n = TREE) => {
  fn(n)
  n.children.forEach((c) => each(fn, c))
}
const leavesOf = (n) => (n.children.length ? n.children.flatMap(leavesOf) : [n])
const LEAVES = leavesOf(TREE)
const ancestors = (n) => {
  const a = []
  for (let m = n; m; m = m.parent) a.push(m.id)
  return a
}
const descendants = (n) => {
  const d = []
  each((m) => d.push(m.id), n)
  return d
}
const speciesUnder = (n) => leavesOf(n).filter((l) => l.sp)
// A slot is named for what a reader would call it — "Red algae", not
// "Rhodophyta" — with the formal name beside it.
const slotName = (n) => (n.common ? capital(n.common) : n.name)
const slotNote = (n) => (n.common ? n.name : n.note)

// ── The discs ──────────────────────────────────────────────────────────────
//
// Each specimen is shown as a disc of bright field with its organism in it,
// drawn by the body generator the microscope uses for it — so a new species on
// an existing generator arrives with a disc of its own.

function mulberry32(seed) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A coccoid culture at its real sizes: the disc is a field 24 µm across, and the
// cells are thrown into it from the species' own size range. Two species that
// differ only in how big their cells run look different here for that reason
// and no other.
function coccoid(cell, seed) {
  const { minUm = 2, maxUm = 8, skew = 1 } = cell ?? {}
  const perUm = 100 / 24
  const rand = mulberry32(seed)
  const cells = []
  for (let i = 0; i < 600 && cells.length < 14; i++) {
    const r = ((minUm + (maxUm - minUm) * Math.pow(rand(), skew)) / 2) * perUm
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand()) * (47 - r)
    const x = 50 + Math.cos(a) * d
    const y = 50 + Math.sin(a) * d
    if (cells.every((c) => Math.hypot(c.x - x, c.y - y) > c.r + r + 1.6)) cells.push({ x, y, r, th: rand() * Math.PI * 2 })
  }
  return cells
    .map(({ x, y, r, th }) =>
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#4e9340" stroke="#34702b" stroke-width="1.3"/>` +
      `<circle cx="${f(x + Math.cos(th) * r * 0.33)}" cy="${f(y + Math.sin(th) * r * 0.33)}" r="${f(r * 0.5)}" fill="#d5e9c1"/>`)
    .join('')
}

function organism(body) {
  switch (body.kind) {
    case 'helical-trichome': {
      let d = ''
      for (let i = 0; i <= 124; i += 2) {
        const x = -12 + i
        d += `${i ? 'L' : 'M'}${f(x)} ${f(50 + 17 * Math.sin(((x + 12) / 31) * 2 * Math.PI))}`
      }
      return `<g transform="rotate(-24 50 50)"><path d="${d}" fill="none" stroke="#2c6a64" stroke-width="12.5" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="#72bcb1" stroke-width="3.5" stroke-linecap="round" opacity=".8" transform="translate(0 -2.8)"/></g>`
    }
    case 'coccoid-field':
      return coccoid(body.cell, body.seed)
    case 'euglenoid-field':
      return `<g transform="rotate(-26 50 50)"><path d="M8 47 C0 40 -2 28 6 17" fill="none" stroke="#3b6f2e" stroke-width="1.8"/>` +
        `<path d="M8 50 C8 37 26 32 46 35 C64 38 82 46 97 51 C82 55 64 62 46 65 C26 68 8 63 8 50Z" fill="#5a9a44" stroke="#3b6f2e" stroke-width="1.5"/>` +
        `<ellipse cx="38" cy="50" rx="7" ry="3.4" fill="#e6f0d6" opacity=".85"/><ellipse cx="56" cy="52" rx="5.5" ry="2.8" fill="#e6f0d6" opacity=".8"/>` +
        `<ellipse cx="71" cy="51" rx="4" ry="2" fill="#e6f0d6" opacity=".7"/><circle cx="16" cy="45" r="3.6" fill="#d4512f"/></g>`
    case 'haptophyte-field':
      return `<path d="M47 33 C40 20 30 13 14 8" fill="none" stroke="#8a7440" stroke-width="1.6"/><path d="M53 33 C60 20 70 13 86 8" fill="none" stroke="#8a7440" stroke-width="1.6"/>` +
        `<path d="M50 33 L50 21" stroke="#8a7440" stroke-width="1.2"/><ellipse cx="50" cy="57" rx="26" ry="24" fill="#f1e7c9" stroke="#a88a4a" stroke-width="1.6"/>` +
        `<ellipse cx="36.5" cy="55" rx="8.5" ry="15.5" fill="#c79d3c" transform="rotate(12 36.5 55)"/><ellipse cx="63.5" cy="55" rx="8.5" ry="15.5" fill="#c79d3c" transform="rotate(-12 63.5 55)"/>` +
        `<circle cx="50" cy="70" r="7.5" fill="#aebfae" stroke="#6f8a78" stroke-width="1.3"/>`
    default:
      return `<circle cx="50" cy="50" r="22" fill="none" stroke="#6f8a78" stroke-width="2"/>`
  }
}

// The round field every disc is cut to, defined once for the tree, the card
// and the list alike.
document.body.insertAdjacentHTML(
  'afterbegin',
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="field"><circle cx="50" cy="50" r="47"/></clipPath></defs></svg>',
)

const glyphCache = new Map()
function disc(body, cx, cy, r) {
  const key = JSON.stringify(body)
  if (!glyphCache.has(key)) glyphCache.set(key, organism(body))
  return `<circle class="disc" cx="${f(cx)}" cy="${f(cy)}" r="${r}"/>` +
    `<g transform="translate(${f(cx - r)} ${f(cy - r)}) scale(${+((2 * r) / 100).toFixed(4)})"><g clip-path="url(#field)">${glyphCache.get(key)}</g></g>` +
    `<circle class="disc-ring" cx="${f(cx)}" cy="${f(cy)}" r="${r}"/>`
}
const discSvg = (body, size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${disc(body, 50, 50, 47)}</svg>`

const TIERS = ['species', 'model', 'unverified']
function tierBarSvg(x, y, w, h, t) {
  const n = TIERS.reduce((a, k) => a + t[k], 0) || 1
  const usable = w - 4
  let at = x
  return TIERS.map((k) => {
    const ww = (usable * t[k]) / n
    const s = `<rect class="bar-${k}" x="${f(at)}" y="${f(y)}" width="${f(ww)}" height="${h}" rx="${h / 2}"/>`
    at += ww + 2
    return s
  }).join('')
}
const tierBar = (t) => `<span class="bar">${TIERS.map((k) => `<span class="bar-${k}" style="flex:${t[k]}"></span>`).join('')}</span>`

// ── Drawing the tree ───────────────────────────────────────────────────────
//
// Radial: the root at the centre, one ring per rank, the specimens round the
// rim. A gap is left at the top for the ring labels. Specimens get a wider share
// of the circle than empty slots, which only have to be seen.

const R = [0, 96, 186, 272, 350, 408]
const DISC = 27
const RIM = 438
const P = (r, a) => ({ x: r * Math.cos((a * Math.PI) / 180), y: r * Math.sin((a * Math.PI) / 180) })

const POS = (() => {
  const gap = 36
  const span = 360 - gap
  const start = -90 + gap / 2
  const weight = (l) => (l.sp ? 1.3 : 0.75)
  const total = LEAVES.reduce((a, l) => a + weight(l), 0)
  const ang = {}
  let acc = 0
  for (const l of LEAVES) {
    ang[l.id] = start + ((acc + weight(l) / 2) / total) * span
    acc += weight(l)
  }
  ;(function inner(n) {
    if (!n.children.length) return
    n.children.forEach(inner)
    const a = n.children.map((c) => ang[c.id])
    ang[n.id] = (Math.min(...a) + Math.max(...a)) / 2
  })(TREE)
  const pos = {}
  for (const id in ang) {
    const n = NODES[id]
    const r = n.sp ? R[5] : R[n.rank]
    pos[id] = { ...P(r, ang[id]), r, a: ang[id] }
  }
  return pos
})()

const ENDO_KINDS = ['primary', 'green', 'red', 'nitro']

function drawTree(showEndo) {
  let s = `<svg viewBox="-650 -490 1300 1030"${showEndo ? ' class="endo-on"' : ''} role="group" aria-label="The atlas as a tree of life: ${plural(atlas.species.length, 'specimen', 'specimens')}, and the lineages still to come">`
  s += '<defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    ENDO_KINDS.map((k) => `<marker id="arrow-${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="head-${k}" d="M0 0.8L9 5L0 9.2z"/></marker>`).join('') +
    '</defs>'

  // The two domains, as faint sectors behind their lineages.
  for (const domain of TREE.children) {
    const as = leavesOf(domain).map((l) => POS[l.id].a)
    const a0 = Math.min(...as) - 13
    const a1 = Math.max(...as) + 13
    const r0 = 52
    const r1 = RIM + DISC + 10
    const A = P(r0, a0), B = P(r1, a0), C = P(r1, a1), D = P(r0, a1)
    const large = a1 - a0 > 180 ? 1 : 0
    s += `<path class="sector sector-${domain.id}" d="M${f(A.x)} ${f(A.y)}L${f(B.x)} ${f(B.y)}A${r1} ${r1} 0 ${large} 1 ${f(C.x)} ${f(C.y)}L${f(D.x)} ${f(D.y)}A${r0} ${r0} 0 ${large} 0 ${f(A.x)} ${f(A.y)}Z"/>`
  }
  for (let k = 1; k <= 4; k++) {
    s += `<circle class="ring" r="${R[k]}"/><text class="ring-label" x="0" y="${-R[k] + 4}" text-anchor="middle">${RANKS[k]}</text>`
  }
  s += `<text class="ring-label" x="0" y="${-RIM + 4}" text-anchor="middle">Species</text>`

  s += '<g class="edges" filter="url(#glow)">'
  each((n) => {
    if (!n.parent) return
    const p = POS[n.parent.id]
    const c = POS[n.id]
    let d
    if (p.r === 0) d = `M0 0L${f(c.x)} ${f(c.y)}`
    else {
      const a = P(p.r, c.a)
      d = `M${f(p.x)} ${f(p.y)}A${p.r} ${p.r} 0 0 ${c.a > p.a ? 1 : 0} ${f(a.x)} ${f(a.y)}L${f(c.x)} ${f(c.y)}`
    }
    s += `<path data-edge="${n.id}" class="edge${n.missing ? ' missing' : ''}" d="${d}"/>`
    if (n.missing && !n.children.length) {
      const e = P(RIM - 17, c.a)
      s += `<path data-edge="${n.id}" class="edge missing" d="M${f(c.x)} ${f(c.y)}L${f(e.x)} ${f(e.y)}"/>`
    }
  })
  s += '</g>'

  // Higher lineages are lettered along the ray that leads into them. A phylum
  // sits on the ray straight after its supergroup, so the two go on opposite
  // sides of the line; so do the two domains, which share the diameter through
  // the root. Genera are left to the leaves, which carry the genus name.
  each((n) => {
    if (!n.children.length) return
    const c = POS[n.id]
    let label = ''
    if (n.parent && !n.genus) {
      const m = P((POS[n.parent.id].r + c.r) / 2, c.a)
      const flipped = Math.cos((c.a * Math.PI) / 180) < 0
      const below = n.rank === 3 || (n.rank === 1 && flipped)
      label = `<text class="taxon${n.missing ? ' missing' : ''}" transform="translate(${f(m.x)} ${f(m.y)}) rotate(${f(flipped ? c.a + 180 : c.a)})" x="0" ${below ? 'y="0" dy="1.25em"' : 'y="-9"'} text-anchor="middle">${esc(n.name)}</text>`
    }
    s += `<g class="node" data-id="${n.id}"><circle class="dot" cx="${f(c.x)}" cy="${f(c.y)}" r="${n.parent ? 5 : 7}"/>${label}</g>`
  })

  for (const l of LEAVES) {
    const a = POS[l.id].a
    const cos = Math.cos((a * Math.PI) / 180)
    const sin = Math.sin((a * Math.PI) / 180)
    const d0 = P(RIM, a)
    const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
    const lx = anchor === 'start' ? d0.x + DISC + 12 : anchor === 'end' ? d0.x - DISC - 12 : d0.x
    const y0 = anchor !== 'middle' ? d0.y - 6 : sin > 0 ? d0.y + DISC + 26 : d0.y - DISC - 52
    if (l.sp) {
      const sp = l.sp
      const bx = anchor === 'start' ? lx : anchor === 'end' ? lx - 110 : lx - 55
      s += `<g class="leaf" data-id="${l.id}" tabindex="0" role="button" aria-label="${esc(sp.latin)}">` +
        `<circle class="hit" cx="${f(d0.x)}" cy="${f(d0.y)}" r="${DISC + 12}"/>` + disc(sp.body, d0.x, d0.y, DISC) +
        `<text class="leaf-name" x="${f(lx)}" y="${f(y0)}" text-anchor="${anchor}"><tspan class="latin">${esc(sp.genus)}</tspan>` +
        `<tspan class="latin" x="${f(lx)}" dy="1.1em">${esc(sp.epithet)}</tspan>` +
        (sp.name !== sp.genus ? `<tspan class="common" dx="8">${esc(sp.name)}</tspan>` : '') + '</text>' +
        tierBarSvg(bx, y0 + 36, 110, 6, sp.tiers) + '</g>'
    } else {
      const mx = anchor === 'start' ? d0.x + 26 : anchor === 'end' ? d0.x - 26 : lx
      s += `<g class="leaf slot" data-id="${l.id}" tabindex="0" role="button" aria-label="${esc(slotName(l))}, not yet in the atlas">` +
        `<circle class="hit" cx="${f(d0.x)}" cy="${f(d0.y)}" r="26"/><circle class="slot-ring" cx="${f(d0.x)}" cy="${f(d0.y)}" r="15"/>` +
        `<path class="slot-plus" d="M${f(d0.x - 5)} ${f(d0.y)}h10M${f(d0.x)} ${f(d0.y - 5)}v10"/>` +
        `<text class="slot-name" x="${f(mx)}" y="${f(anchor === 'middle' ? y0 - 6 : d0.y - 2)}" text-anchor="${anchor}">${esc(slotName(l))}` +
        `<tspan class="slot-note" x="${f(mx)}" dy="1.2em">not yet in the atlas</tspan></text></g>`
    }
  }

  // Where the plastids came from. The arrows are pulled through the middle of
  // the disc, like the tree's own branches; an arrow whose two ends sit nearly
  // opposite each other would run straight across the root that way, so it is
  // bowed out to the side instead.
  if (showEndo) {
    s += '<g class="endo">'
    atlas.endosymbioses.forEach((e, i) => {
      const A = POS[slug(e.from)]
      const B = POS[slug(e.to)]
      if (!A || !B) return
      // The angle between the two ends, from 0 to 180 degrees.
      const opposite = Math.abs(((B.a - A.a + 540) % 360) - 180) > 150
      const C = opposite
        ? { x: (A.x + B.x) / 2 - (B.y - A.y) * 0.45, y: (A.y + B.y) / 2 + (B.x - A.x) * 0.45 }
        : { x: (A.x + B.x) * 0.16, y: (A.y + B.y) * 0.16 }
      const pull = (p, q, d) => {
        const dx = p.x - q.x, dy = p.y - q.y, len = Math.hypot(dx, dy) || 1
        return { x: p.x - (dx / len) * d, y: p.y - (dy / len) * d }
      }
      const a = pull(A, C, 10)
      const b = pull(B, C, 14)
      s += `<path class="arrow arrow-${e.kind}" marker-end="url(#arrow-${e.kind})" d="M${f(a.x)} ${f(a.y)}Q${f(C.x)} ${f(C.y)} ${f(b.x)} ${f(b.y)}"/>`
      const M = { x: 0.25 * A.x + 0.5 * C.x + 0.25 * B.x, y: 0.25 * A.y + 0.5 * C.y + 0.25 * B.y }
      s += `<g class="badge badge-${e.kind}"><circle cx="${f(M.x)}" cy="${f(M.y)}" r="15"/><text x="${f(M.x)}" y="${f(M.y)}" dy=".36em" text-anchor="middle">${i + 1}</text></g>`
    })
    s += '</g>'
  }
  return s + '</svg>'
}

// ── Citations ──────────────────────────────────────────────────────────────

const cite = (sources) =>
  sources.map((c) => `<a href="${esc(c.url)}" title="${esc(c.text)}">${esc(c.short)}</a>`).join('; ')

function endoKey() {
  return `<p class="label">Where the plastids came from</p><ol class="endo-list">` +
    atlas.endosymbioses.map((e, i) =>
      `<li><span class="num badge-${e.kind}">${i + 1}</span><span><b class="ink-${e.kind}">${esc(e.label)}</b> · ${esc(e.note)}. <span class="cites">${cite(e.sources)}</span></span></li>`).join('') +
    '</ol>'
}

function schematic() {
  const burki = atlas.treeSources.find((c) => c.id === 'r62')
  return `A schematic. Four ranks are drawn and class, order and family are skipped. The eukaryotic supergroups follow ` +
    `${burki ? cite([burki]) : 'Burki et al. (2020)'}, and they fan out from one point because the order in which they branched is not resolved. ` +
    `Archaea, none of which photosynthesise with chlorophyll, are left out.`
}

// ── The card ───────────────────────────────────────────────────────────────

const crumbs = (n) =>
  ancestors(n).reverse().slice(1, -1).map((id) => (NODES[id].genus ? `<i class="latin">${esc(NODES[id].name)}</i>` : esc(NODES[id].name))).join(' › ')

// The endosymbioses a specimen's line took part in: the ones that ended in it,
// and the ones its lineage was the source of.
function plastidHistory(n) {
  const line = new Set(ancestors(n))
  const into = atlas.endosymbioses.filter((e) => line.has(slug(e.to)))
  const out = atlas.endosymbioses.filter((e) => line.has(slug(e.from)) && !line.has(slug(e.to)))
  if (!into.length && !out.length) return ''
  return `<div class="history"><p class="label">Plastid history</p><ul>` +
    into.map((e) => `<li><b class="ink-${e.kind}">${esc(e.label)}</b> · ${esc(e.note)}.</li>`).join('') +
    out.map((e) => `<li>Its lineage was taken in by others as the <b class="ink-${e.kind}">${esc(e.label.toLowerCase())}</b>.</li>`).join('') +
    '</ul></div>'
}

function speciesCard(n) {
  const s = n.sp
  const n3 = (k) => s.tiers[k]
  return `<p class="crumbs">${crumbs(n)}</p>` +
    `<div class="card-disc">${discSvg(s.body, 92)}</div>` +
    (s.name !== s.genus ? `<p class="common-name">${esc(s.name)}</p>` : '') +
    `<h2 class="latin">${esc(s.latin)}</h2>` +
    (s.authority ? `<p class="authority">${esc(s.authority)}</p>` : '') +
    `<p class="tagline">${esc(s.tagline)}</p>` +
    `<dl class="facts"><dt>Group</dt><dd>${esc(s.group)}</dd><dt>Views</dt><dd>${s.views.map(esc).join(' · ')}</dd>` +
    `<dt>Cards</dt><dd><span class="num">${s.cards}</span> structures, <span class="num">${s.rows}</span> dated measurements, <span class="num">${s.sources}</span> sources</dd></dl>` +
    `<div class="tiers">${tierBar(s.tiers)}<ul>${TIERS.map((k) => `<li><i class="swatch tier-${k}"></i>${esc(s.tierLabels[k])}<b class="num">${n3(k)}</b></li>`).join('')}</ul></div>` +
    plastidHistory(n) +
    `<a class="open" href="${microscope(s.id)}">Open at the microscope →</a>`
}

function lineageCard(n) {
  const species = speciesUnder(n)
  const title = n.genus ? `<i class="latin">${esc(n.name)}</i>` : esc(n.missing && !n.children.length ? slotName(n) : n.name)
  const note = n.missing && !n.children.length ? slotNote(n) : n.common
  if (n.missing) {
    return `<p class="crumbs"><span class="rank">${RANKS[n.rank]}</span>${crumbs(n) ? ' · ' + crumbs(n) : ''}</p><h2>${title}</h2>` +
      (note ? `<p class="authority">${esc(note)}</p>` : '') +
      `<p class="note">Not yet in the atlas. A specimen comes in with its sources and a reference image, and the confidence tiers let a thinly studied organism in honestly: it simply carries more of the second and third tier.</p>` +
      `<a class="open ghost" href="${PROPOSE}">Propose an organism →</a>`
  }
  const genera = new Set(species.map((l) => l.sp.genus)).size
  return `<p class="crumbs"><span class="rank">${RANKS[n.rank]}</span>${crumbs(n) ? ' · ' + crumbs(n) : ''}</p><h2>${title}</h2>` +
    (note ? `<p class="authority">${esc(note)}</p>` : '') +
    `<p class="note">${plural(species.length, 'specimen', 'specimens')} in the atlas${n.genus ? '' : `, in ${plural(genera, 'genus', 'genera')}`}.</p>` +
    `<ul class="pick">${species.map((l) => `<li><button type="button" data-pick="${l.id}"><i class="latin">${esc(l.sp.latin)}</i></button></li>`).join('')}</ul>`
}

function overviewCard() {
  const genera = new Set(atlas.species.map((s) => s.genus)).size
  const phyla = new Set(atlas.species.map((s) => s.lineage.phylum)).size
  const inside = atlas.species.filter((s) => s.views.length > 1).map((s) => s.name)
  return `<p class="crumbs"><span class="rank">The atlas today</span></p>` +
    `<h2>${plural(atlas.species.length, 'specimen', 'specimens')} · ${plural(genera, 'genus', 'genera')} · ${plural(phyla, 'phylum', 'phyla')}</h2>` +
    `<p class="note">Each leaf opens that organism at the microscope. The empty slots are lineages the atlas does not cover yet; each one leads to the form for proposing one.</p>` +
    `<p class="note">Every specimen is seen first as a light microscope sees it.${inside.length ? ` ${inside.join(', ')} also ${inside.length > 1 ? 'open' : 'opens'} up, one cell cut away down to the nanometre.` : ''}</p>`
}

// ── State ──────────────────────────────────────────────────────────────────

const state = { selected: null, hover: null, endo: false }
const treeEl = document.getElementById('tree')
const cardEl = document.getElementById('card')
const keyEl = document.getElementById('endo-key')

function render() {
  treeEl.innerHTML = drawTree(state.endo)
  keyEl.innerHTML = state.endo ? endoKey() : ''
  keyEl.hidden = !state.endo
  paint()
}

function renderCard() {
  const n = state.selected && NODES[state.selected]
  cardEl.innerHTML = !n ? overviewCard() : n.sp ? speciesCard(n) : lineageCard(n)
}

const reach = (id) => (id ? new Set([...ancestors(NODES[id]), ...descendants(NODES[id])]) : new Set())
function paint() {
  const hover = reach(state.hover)
  const selected = reach(state.selected)
  for (const e of treeEl.querySelectorAll('[data-edge]')) {
    e.classList.toggle('hot', hover.has(e.dataset.edge))
    e.classList.toggle('on', selected.has(e.dataset.edge))
  }
  for (const e of treeEl.querySelectorAll('[data-id]')) {
    e.classList.toggle('selected', e.dataset.id === state.selected)
    e.classList.toggle('lit', hover.has(e.dataset.id))
  }
}

const narrow = window.matchMedia('(max-width: 900px)')
const still = window.matchMedia('(prefers-reduced-motion: reduce)')
function select(id) {
  state.selected = state.selected === id ? null : id
  renderCard()
  paint()
  // Under the tree rather than beside it, the card would change out of sight.
  if (state.selected && narrow.matches) cardEl.scrollIntoView({ behavior: still.matches ? 'auto' : 'smooth', block: 'nearest' })
}

treeEl.addEventListener('click', (e) => {
  const t = e.target.closest('[data-id]')
  if (t) select(t.dataset.id)
})
treeEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const t = e.target.closest('[data-id]')
  if (!t) return
  e.preventDefault()
  select(t.dataset.id)
})
treeEl.addEventListener('mouseover', (e) => {
  const id = e.target.closest('[data-id]')?.dataset.id ?? null
  if (id === state.hover) return
  state.hover = id
  paint()
})
treeEl.addEventListener('mouseleave', () => {
  state.hover = null
  paint()
})
cardEl.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-pick]')
  if (pick) select(pick.dataset.pick)
})
document.getElementById('endo').addEventListener('change', (e) => {
  state.endo = e.target.checked
  render()
})

// ── The list ───────────────────────────────────────────────────────────────
//
// Every specimen once more, as a plain list of links: what a phone gets in
// place of a tree too small to tap, and what a screen reader gets always.
document.getElementById('roster').innerHTML = atlas.species
  .map((s) =>
    `<li><a href="${microscope(s.id)}">${discSvg(s.body, 52)}<span class="roster-text">` +
    `<span class="roster-name"><i class="latin">${esc(s.latin)}</i>${s.name !== s.genus ? ` <span class="common-name">${esc(s.name)}</span>` : ''}</span>` +
    `<span class="roster-tag">${esc(s.tagline)}</span>${tierBar(s.tiers)}</span></a></li>`)
  .join('')

document.getElementById('version').textContent = ` · v${atlas.version}`
document.getElementById('schematic').innerHTML = schematic()
render()
renderCard()
