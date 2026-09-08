// Renders the running dev server in headless Chrome and writes PNGs to docs/shots/.
// This is the only way the 3D output can actually be inspected during development:
// a browser pane that is never displayed never composites a frame, so React Three
// Fiber never even mounts the scene.
//
//   node tools/shoot.mjs                     → default set of shots
//   node tools/shoot.mjs cell:0,60           → one shot, cell view, azimuth+elevation offsets
//   node tools/shoot.mjs cell@30 --crop 700,250,520,360
//   node tools/shoot.mjs filament --still     → gliding rotation off, so two
//                                               shots can be compared
//   node tools/shoot.mjs filament --focus 24  → fine focus racked to +24 µm
//
// `--crop` writes the named rectangle at one screen pixel to one image pixel
// instead of the whole 1400×900 frame scaled down to be looked at. Surface
// texture is the one thing a downscaled frame cannot be judged on: the
// resampling is itself a low-pass filter, so a shot of an aliasing surface and
// a shot of a smooth one come back looking the same.
import { access, mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

// Chrome does not sit in the same place on every machine, and one hard-coded
// path meant this only ran where it was written. CHROME_PATH overrides.
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA && process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate)
      return candidate
    } catch {}
  }
  throw new Error(
    'No Chrome found. Looked in:\n  ' +
      CHROME_CANDIDATES.join('\n  ') +
      '\nSet CHROME_PATH to the executable and run again.',
  )
}
const PORT = process.env.PORT ?? process.env.VITE_PORT ?? 5173
const URL = process.env.SHOT_URL ?? `http://localhost:${PORT}`
const OUT = 'docs/shots'
const SIZE = { width: 1400, height: 900 }

const SHOTS = [
  { name: 'filament', view: 'filament' },
  { name: 'cell-overview', view: 'cell' },
  { name: 'cell-wall', view: 'cell', select: 'wall' },
  { name: 'cell-thylakoids', view: 'cell', select: 'thylakoids' },
]

// Named sets, so a look pass is one command instead of six. `--set look` is the
// one the interior is judged on: the same cell at four distances and angles,
// because a cutaway that reads well from the home viewpoint and nowhere else is
// a poster, not a model.
const SETS = {
  look: [
    { name: 'look-overview', view: 'cell' },
    { name: 'look-mid', view: 'cell', zoom: 5 },
    { name: 'look-top', view: 'cell', zoom: 4, orbit: [0, -230] },
    { name: 'look-core', view: 'cell', zoom: 9, orbit: [0, -90] },
    { name: 'look-rake', view: 'cell', zoom: 7, orbit: [260, 120] },
  ],
  // Brackets the lamella LOD swap at 8200 nm. The question these answer is the
  // one a still frame cannot: does zooming in make the anatomy larger, or does
  // it make it multiply?
  lod: [
    { name: 'lod-far', view: 'cell', zoom: 8 },
    { name: 'lod-near', view: 'cell', zoom: 20 },
    { name: 'lod-close', view: 'cell', zoom: 30 },
  ],
  bodies: [
    { name: 'body-carboxysomes', view: 'cell', select: 'carboxysomes' },
    { name: 'body-nucleoid', view: 'cell', select: 'nucleoid' },
    { name: 'body-polyphosphate', view: 'cell', select: 'polyphosphate' },
    { name: 'body-gasvesicles', view: 'cell', select: 'gasVesicles' },
    { name: 'body-lipid', view: 'cell', select: 'lipidBodies' },
  ],
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  await mkdir(OUT, { recursive: true })

  // Fail on the real reason rather than on a navigation timeout half a minute
  // later. The usual cause is simply that `npm run dev` is not running.
  try {
    const probe = await fetch(URL)
    if (!probe.ok) throw new Error('HTTP ' + probe.status)
  } catch (cause) {
    throw new Error('No dev server at ' + URL + ' — start one with `npm run dev`. (' + cause.message + ')')
  }

  const browser = await puppeteer.launch({
    executablePath: await findChrome(),
    headless: true,
    args: [
      '--headless=new',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      `--window-size=${SIZE.width},${SIZE.height}`,
    ],
  })

  const page = await browser.newPage()
  await page.setViewport(SIZE)

  const problems = []
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text())
  })
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

  const args = process.argv.slice(2)
  const setFlag = args.indexOf('--set')
  const cropFlag = args.indexOf('--crop')
  // The trichome glides: it is turning about its own axis whenever the view is
  // open, so two shots taken the same way land at two rotations and the tip you
  // were judging has moved. Nothing about a still is comparable to another
  // still until that is off.
  const still = args.includes('--still')
  // Where the fine focus is racked to, in µm. The plane of focus is a control
  // in the filament view, so a shot that does not say where it was set is not
  // reproducible.
  const focusFlag = args.indexOf('--focus')
  const focusAt = focusFlag === -1 ? null : Number(args[focusFlag + 1])
  const [cx, cy, cw, ch] = cropFlag === -1 ? [] : (args[cropFlag + 1] ?? '').split(',').map(Number)
  const clip =
    cropFlag === -1
      ? undefined
      : [cx, cy, cw, ch].every(Number.isFinite)
        ? { x: cx, y: cy, width: cw, height: ch }
        : fail('--crop wants x,y,w,h in pixels')
  const shots =
    setFlag !== -1
      ? SETS[args[setFlag + 1]] ?? fail(`no such set: ${args[setFlag + 1]}`)
      : args[0] && !args[0].startsWith('--')
        ? [parseArg(args[0])]
        : SHOTS

  for (const shot of shots) {
    await page.goto(URL, { waitUntil: 'networkidle0' })

    // React Three Fiber only mounts the scene once the canvas has a real size.
    await page.waitForFunction(
      () => {
        const c = document.querySelector('canvas')
        return c && c.width > 400
      },
      { timeout: 20000 },
    )

    if (shot.view === 'cell') {
      await page.evaluate(() => {
        const tab = [...document.querySelectorAll('.tab')].find((t) =>
          t.textContent.includes('Cell'),
        )
        tab?.click()
      })
      // Switching view remounts the canvas: a fresh WebGL context, the optics
      // composer, the shader compiles and the whole lamella generator. Under
      // SwiftShader that is seconds, and a short wait catches an empty frame.
      await sleep(2600)
    }

    if (still) {
      await page.evaluate(() => {
        const box = document.querySelector('.toggle input[type="checkbox"], input[type="checkbox"]')
        if (box?.checked) box.click()
      })
      await sleep(400)
    }

    if (focusAt != null && Number.isFinite(focusAt)) {
      await page.evaluate((v) => {
        const slider = document.querySelector('#fine')
        if (!slider) return
        slider.value = String(v)
        slider.dispatchEvent(new Event('input', { bubbles: true }))
      }, focusAt)
      await sleep(400)
    }

    if (shot.select) {
      await page.evaluate((id) => {
        // Only the ids whose list entry is not simply the id spelled out; the
        // fallback below covers the rest.
        const names = {
          wall: 'Four-layered cell wall',
          thylakoids: 'Thylakoids',
          phycobilisomes: 'Phycobilisomes',
          carboxysomes: 'Carboxysomes',
          nucleoid: 'Nucleoid',
          gasVesicles: 'Gas vesicles',
          lipidBodies: 'Lipid bodies',
          polyphosphate: 'Polyphosphate bodies',
          polyglucan: 'Polyglucan granules',
          cyanophycin: 'Cyanophycin granules',
          septum: 'Cross-wall (septum)',
          membrane: 'Plasma membrane',
          sheath: 'Extracellular sheath',
          ribosomes: 'Ribosomes',
          // filament view
          trichome: 'Helical trichome',
          cellUnit: 'Vegetative cell',
          calyptra: 'Calyptra',
          gliding: 'Gliding motility',
          reproduction: 'Reproduction by fragmentation',
        }
        const item = [...document.querySelectorAll('.item')].find((b) =>
          b.textContent.includes(names[id] ?? id),
        )
        item?.click()
      }, shot.select)
      // let the camera rig finish its flight
      await sleep(2600)
    }

    // Orbit and dolly, driven as real pointer input rather than by reaching
    // into the scene: OrbitControls is the only thing that owns the camera once
    // the flight has landed, and a second hand on it is how the two disagree.
    if (shot.orbit) {
      const [dx, dy] = shot.orbit
      // Started over empty field, not over the specimen: OrbitControls lets the
      // click through at the end of a drag, and a drag begun on a lamella ends
      // by selecting it — which is a shot of the info panel, not of the cell.
      const cx = SIZE.width * 0.45
      const cy = SIZE.height * 0.08
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      // In steps: one jump of 300 px is a flick the damping never catches up to.
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(cx + (dx * i) / 12, cy + (dy * i) / 12)
        await sleep(16)
      }
      await page.mouse.up()
      await sleep(500)
    }

    if (shot.zoom) {
      await page.mouse.move(SIZE.width * 0.62, SIZE.height * 0.5)
      for (let i = 0; i < Math.abs(shot.zoom); i++) {
        await page.mouse.wheel({ deltaY: shot.zoom > 0 ? -120 : 120 })
        await sleep(90)
      }
      // The lamella LOD swaps at 8200 nm and the detailed tier is generated on
      // the frame it first appears. Landing the shot before that is a picture
      // of the coarse tier labelled as the fine one.
      await sleep(2200)
    }

    await sleep(1200)
    const file = `${OUT}/${shot.name}${clip ? '-crop' : ''}.png`
    await page.screenshot({ path: file, ...(clip ? { clip } : {}) })
    console.log(`wrote ${file}`)
  }

  await browser.close()

  if (problems.length) {
    console.log('\nconsole errors:')
    for (const p of new Set(problems)) console.log('  ' + p)
  } else {
    console.log('\nno console errors')
  }
}

// `cell`, `cell:carboxysomes`, `cell@6`, `cell@6,240,-80` — view, optional
// structure to select, then dolly notches and an orbit drag in pixels.
function parseArg(arg) {
  const [stage, camera = ''] = arg.split('@')
  const [view, select = ''] = stage.split(':')
  const [zoom, dx, dy] = camera.split(',').map(Number)
  return {
    name: 'adhoc',
    view,
    select: select || undefined,
    zoom: Number.isFinite(zoom) ? zoom : undefined,
    orbit: Number.isFinite(dx) ? [dx, Number.isFinite(dy) ? dy : 0] : undefined,
  }
}

function fail(message) {
  throw new Error(message + '. Sets: ' + Object.keys(SETS).join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
